import { useSupabase } from '@/composables/useSupabase'
import type { Photo } from '@/types'

export async function fetchPhotoById(id: string): Promise<Photo | null> {
  const supabase = useSupabase()

  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Failed to fetch photo:', error)
    return null
  }

  return data
}

export async function fetchPhotoStats(): Promise<{
  totalPhotos: number
  totalVideos: number
  totalSize: number
}> {
  const supabase = useSupabase()

  const { data, error } = await supabase
    .from('photos')
    .select('media_type, file_size')

  if (error) {
    console.error('Failed to fetch stats:', error)
    return { totalPhotos: 0, totalVideos: 0, totalSize: 0 }
  }

  const stats = {
    totalPhotos: 0,
    totalVideos: 0,
    totalSize: 0,
  }

  data?.forEach(item => {
    if (item.media_type === 'image') {
      stats.totalPhotos++
    } else {
      stats.totalVideos++
    }
    stats.totalSize += item.file_size || 0
  })

  return stats
}

export async function searchPhotos(query: string): Promise<Photo[]> {
  const supabase = useSupabase()

  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .or(`filename.ilike.%${query}%,city.ilike.%${query}%,country.ilike.%${query}%`)
    .order('taken_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Search failed:', error)
    return []
  }

  return data || []
}
