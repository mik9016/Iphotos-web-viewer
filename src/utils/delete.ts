import { useSupabase } from '@/composables/useSupabase'
import type { PhotoWithUrl } from '@/types'

export interface DeleteResult {
  succeeded: string[]
  failed: string[]
}

export async function deleteSinglePhoto(photo: PhotoWithUrl): Promise<boolean> {
  const supabase = useSupabase()

  // Storage paths in DB include bucket name prefix, strip it
  const path = photo.storage_path.replace(/^iphotos\//, '')
  const paths = [path]

  if (photo.thumbnail_path) {
    const thumbPath = photo.thumbnail_path.replace(/^iphotos\//, '')
    paths.push(thumbPath)
  }

  // Delete storage files
  const { error: storageError } = await supabase.storage
    .from('iphotos')
    .remove(paths)

  if (storageError) {
    throw new Error(`Failed to delete files: ${storageError.message}`)
  }

  // Delete database record
  const { error: dbError } = await supabase
    .from('photos')
    .delete()
    .eq('id', photo.id)

  if (dbError) {
    throw new Error(`Failed to delete record: ${dbError.message}`)
  }

  return true
}

export async function deleteMultiplePhotos(
  photos: PhotoWithUrl[],
  onProgress?: (current: number, total: number, failed: number) => void
): Promise<DeleteResult> {
  const result: DeleteResult = {
    succeeded: [],
    failed: [],
  }

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    onProgress?.(i + 1, photos.length, result.failed.length)

    try {
      await deleteSinglePhoto(photo)
      result.succeeded.push(photo.id)
    } catch (e) {
      console.warn(`Failed to delete ${photo.filename}:`, e)
      result.failed.push(photo.id)
    }
  }

  return result
}
