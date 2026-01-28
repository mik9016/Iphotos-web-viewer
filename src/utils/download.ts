import JSZip from 'jszip'
import { useSupabase } from '@/composables/useSupabase'
import type { PhotoWithUrl } from '@/types'

export async function downloadSinglePhoto(photo: PhotoWithUrl): Promise<void> {
  const supabase = useSupabase()
  // storage_path in DB includes bucket name prefix, strip it
  const path = photo.storage_path.replace(/^iphotos\//, '')

  const { data, error } = await supabase.storage
    .from('iphotos')
    .download(path)

  if (error) {
    throw new Error(`Failed to download: ${error.message}`)
  }

  const url = URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = photo.filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function downloadMultiplePhotos(
  photos: PhotoWithUrl[],
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const supabase = useSupabase()
  const zip = new JSZip()

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    onProgress?.(i + 1, photos.length)

    try {
      // storage_path in DB includes bucket name prefix, strip it
      const path = photo.storage_path.replace(/^iphotos\//, '')

      const { data, error } = await supabase.storage
        .from('iphotos')
        .download(path)

      if (error) {
        console.warn(`Failed to download ${photo.filename}:`, error)
        continue
      }

      zip.file(photo.filename, data)
    } catch (e) {
      console.warn(`Error downloading ${photo.filename}:`, e)
    }
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `photos-${new Date().toISOString().split('T')[0]}.zip`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown size'

  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}
