/**
 * Migration script to generate JPEG thumbnails for all existing photos
 *
 * Run with:
 *   SUPABASE_SERVICE_KEY="your-key" pnpm migrate:thumbnails
 */

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import convert from 'heic-convert'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

// Configure ffmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path)

// Config
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://supabase.unicatsolutions.de'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''
const BUCKET_NAME = 'iphotos'
const THUMBNAIL_SIZE = 400
const JPEG_QUALITY = 70
const BATCH_SIZE = 5 // Smaller batch for memory

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_KEY environment variable is required')
  console.error('Get it from: Supabase Dashboard > Settings > API > service_role key')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface Photo {
  id: string
  user_id: string
  filename: string
  storage_path: string
  thumbnail_path: string | null
  media_type: 'image' | 'video'
}

function isHeic(filename: string): boolean {
  const lower = filename.toLowerCase()
  return lower.endsWith('.heic') || lower.endsWith('.heif')
}

async function convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
  const outputBuffer = await convert({
    buffer: new Uint8Array(buffer),
    format: 'JPEG',
    quality: JPEG_QUALITY / 100,
  })
  return Buffer.from(outputBuffer)
}

async function generateImageThumbnail(buffer: Buffer, filename: string): Promise<Buffer> {
  let imageBuffer = buffer

  // Convert HEIC to JPEG first
  if (isHeic(filename)) {
    console.log(' (converting HEIC)')
    imageBuffer = await convertHeicToJpeg(buffer)
  }

  // Resize with sharp
  return sharp(imageBuffer)
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer()
}

async function generateVideoThumbnail(videoBuffer: Buffer, filename: string): Promise<Buffer> {
  const tempDir = join(tmpdir(), 'thumbnail-migration')
  await mkdir(tempDir, { recursive: true })

  const tempVideoPath = join(tempDir, filename)
  const tempThumbPath = join(tempDir, `${filename}.jpg`)

  try {
    await writeFile(tempVideoPath, videoBuffer)

    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempVideoPath)
        .screenshots({
          timestamps: ['00:00:00.500'],
          filename: `${filename}.jpg`,
          folder: tempDir,
          size: `${THUMBNAIL_SIZE}x?`,
        })
        .on('end', () => resolve())
        .on('error', () => {
          // Try first frame
          ffmpeg(tempVideoPath)
            .screenshots({
              timestamps: ['00:00:00.000'],
              filename: `${filename}.jpg`,
              folder: tempDir,
              size: `${THUMBNAIL_SIZE}x?`,
            })
            .on('end', () => resolve())
            .on('error', reject)
        })
    })

    const thumbBuffer = await import('fs').then(fs =>
      fs.promises.readFile(tempThumbPath)
    )

    return thumbBuffer
  } finally {
    try {
      await unlink(tempVideoPath)
      await unlink(tempThumbPath)
    } catch {
      // Ignore
    }
  }
}

function stripBucketPrefix(path: string): string {
  return path.replace(/^iphotos\//, '')
}

function getThumbnailPath(userId: string, filename: string): string {
  const name = filename.replace(/\.[^.]+$/, '')
  return `${userId}/thumbnails/${name}_thumb.jpg`
}

function getFullThumbnailPath(userId: string, filename: string): string {
  return `${BUCKET_NAME}/${getThumbnailPath(userId, filename)}`
}

async function processPhoto(photo: Photo): Promise<boolean> {
  const storagePath = stripBucketPrefix(photo.storage_path)
  const thumbnailPath = getThumbnailPath(photo.user_id, photo.filename)
  const fullThumbnailPath = getFullThumbnailPath(photo.user_id, photo.filename)

  try {
    const { data: blob, error: downloadError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(storagePath)

    if (downloadError || !blob) {
      console.error(`  Failed to download: ${downloadError?.message}`)
      return false
    }

    const buffer = Buffer.from(await blob.arrayBuffer())
    let thumbnailBuffer: Buffer

    if (photo.media_type === 'video') {
      thumbnailBuffer = await generateVideoThumbnail(buffer, photo.filename)
    } else {
      thumbnailBuffer = await generateImageThumbnail(buffer, photo.filename)
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(thumbnailPath, thumbnailBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error(`  Failed to upload thumbnail: ${uploadError.message}`)
      return false
    }

    const { error: updateError } = await supabase
      .from('photos')
      .update({ thumbnail_path: fullThumbnailPath })
      .eq('id', photo.id)

    if (updateError) {
      console.error(`  Failed to update DB: ${updateError.message}`)
      return false
    }

    return true
  } catch (err) {
    console.error(`  Error: ${err}`)
    return false
  }
}

async function main() {
  console.log('Starting thumbnail migration...\n')

  const { data: photos, error } = await supabase
    .from('photos')
    .select('id, user_id, filename, storage_path, thumbnail_path, media_type')
    .is('thumbnail_path', null)
    .order('taken_at', { ascending: true, nullsFirst: true })

  if (error) {
    console.error('Failed to fetch photos:', error.message)
    process.exit(1)
  }

  if (!photos || photos.length === 0) {
    console.log('No photos need thumbnails. All done!')
    return
  }

  console.log(`Found ${photos.length} photos without thumbnails\n`)

  let processed = 0
  let succeeded = 0
  let failed = 0

  for (let i = 0; i < photos.length; i += BATCH_SIZE) {
    const batch = photos.slice(i, i + BATCH_SIZE)

    const results = await Promise.all(
      batch.map(async (photo) => {
        process.stdout.write(`[${processed + 1}/${photos.length}] ${photo.filename}...`)
        const success = await processPhoto(photo as Photo)
        console.log(success ? ' ✓' : ' ✗')
        processed++
        return success
      })
    )

    succeeded += results.filter(Boolean).length
    failed += results.filter(r => !r).length

    // Small delay between batches
    await new Promise(r => setTimeout(r, 100))
  }

  console.log('\n--- Migration Complete ---')
  console.log(`Total: ${photos.length}`)
  console.log(`Succeeded: ${succeeded}`)
  console.log(`Failed: ${failed}`)
}

main().catch(console.error)
