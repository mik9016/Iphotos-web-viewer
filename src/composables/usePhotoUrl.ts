import { ref } from 'vue'
import { useSupabase } from './useSupabase'
import heic2any from 'heic2any'
import type { Photo } from '@/types'

const urlCache = new Map<string, { url: string; expires: number }>()
const blobCache = new Map<string, string>() // For converted HEIC files
const CACHE_DURATION = 50 * 60 * 1000 // 50 minutes (signed URLs expire in 60 min)

function isHeic(photo: Photo): boolean {
  const filename = photo.filename.toLowerCase()
  const mimeType = photo.mime_type?.toLowerCase() || ''
  return filename.endsWith('.heic') || filename.endsWith('.heif') ||
         mimeType.includes('heic') || mimeType.includes('heif')
}

function stripBucketPrefix(path: string): string {
  return path.replace(/^iphotos\//, '')
}

export function usePhotoUrl() {
  const supabase = useSupabase()
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function getSignedUrl(photo: Photo, type: 'thumbnail' | 'full' = 'full'): Promise<string | null> {
    const cacheKey = `${photo.storage_path}-${type}`

    // Check blob cache first (for converted HEIC)
    const cachedBlob = blobCache.get(cacheKey)
    if (cachedBlob) {
      return cachedBlob
    }

    const cached = urlCache.get(cacheKey)
    if (cached && cached.expires > Date.now()) {
      return cached.url
    }

    loading.value = true
    error.value = null

    try {
      // For thumbnails, use thumbnail_path if available (fast JPEG)
      if (type === 'thumbnail' && photo.thumbnail_path) {
        const thumbPath = stripBucketPrefix(photo.thumbnail_path)

        const { data, error: signError } = await supabase.storage
          .from('iphotos')
          .createSignedUrl(thumbPath, 3600)

        if (!signError && data?.signedUrl) {
          urlCache.set(cacheKey, {
            url: data.signedUrl,
            expires: Date.now() + CACHE_DURATION,
          })
          return data.signedUrl
        }
        // Fall through to original if thumbnail fails
      }

      // For full images or when no thumbnail available
      const path = stripBucketPrefix(photo.storage_path)

      // For HEIC files without thumbnail, download and convert
      if (isHeic(photo) && !photo.thumbnail_path) {
        const { data: blob, error: downloadError } = await supabase.storage
          .from('iphotos')
          .download(path)

        if (downloadError) {
          throw downloadError
        }

        if (blob) {
          // Convert HEIC to JPEG
          const convertedBlob = await heic2any({
            blob,
            toType: 'image/jpeg',
            quality: type === 'thumbnail' ? 0.6 : 0.9,
          })

          const resultBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
          const blobUrl = URL.createObjectURL(resultBlob)
          blobCache.set(cacheKey, blobUrl)
          return blobUrl
        }
      }

      // For non-HEIC files or full-size HEIC (will be downloaded by browser/viewer)
      const { data, error: signError } = await supabase.storage
        .from('iphotos')
        .createSignedUrl(path, 3600) // 1 hour

      if (signError) {
        throw signError
      }

      if (data?.signedUrl) {
        urlCache.set(cacheKey, {
          url: data.signedUrl,
          expires: Date.now() + CACHE_DURATION,
        })
        return data.signedUrl
      }

      return null
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to get signed URL'
      console.error('Error getting photo URL:', e)
      return null
    } finally {
      loading.value = false
    }
  }

  async function getSignedUrls(photos: Photo[]): Promise<Map<string, string>> {
    const urls = new Map<string, string>()

    const uncached = photos.filter(photo => {
      const cacheKey = `${photo.storage_path}-full`
      const cachedBlob = blobCache.get(cacheKey)
      if (cachedBlob) {
        urls.set(photo.id, cachedBlob)
        return false
      }
      const cached = urlCache.get(cacheKey)
      if (cached && cached.expires > Date.now()) {
        urls.set(photo.id, cached.url)
        return false
      }
      return true
    })

    if (uncached.length === 0) {
      return urls
    }

    const promises = uncached.map(async photo => {
      const url = await getSignedUrl(photo)
      if (url) {
        urls.set(photo.id, url)
      }
    })

    await Promise.all(promises)
    return urls
  }

  function clearCache() {
    // Revoke blob URLs before clearing
    blobCache.forEach(url => URL.revokeObjectURL(url))
    blobCache.clear()
    urlCache.clear()
  }

  return {
    getSignedUrl,
    getSignedUrls,
    clearCache,
    loading,
    error,
  }
}
