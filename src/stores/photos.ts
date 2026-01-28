import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSupabase } from '@/composables/useSupabase'
import { usePhotoUrl } from '@/composables/usePhotoUrl'
import { deleteSinglePhoto, deleteMultiplePhotos, type DeleteResult } from '@/utils/delete'
import type { Photo, PhotoWithUrl, FilterState, Folder } from '@/types'

const PAGE_SIZE = 50

export const usePhotosStore = defineStore('photos', () => {
  const supabase = useSupabase()
  const { getSignedUrl } = usePhotoUrl()

  const photos = ref<PhotoWithUrl[]>([])
  const selectedPhotos = ref<Set<string>>(new Set())
  const currentPhoto = ref<PhotoWithUrl | null>(null)
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref<string | null>(null)
  const hasMore = ref(true)
  const filters = ref<FilterState>({})
  const sortBy = ref<'taken_at' | 'created_at'>('taken_at')
  const sortOrder = ref<'asc' | 'desc'>('desc')
  const deleting = ref(false)
  const deleteProgress = ref({ current: 0, total: 0, failed: 0 })

  const filteredPhotos = computed(() => {
    return photos.value
  })

  const selectionMode = computed(() => selectedPhotos.value.size > 0)

  async function fetchPhotos(reset = false) {
    if (loading.value || loadingMore.value) return
    if (!reset && !hasMore.value) return

    if (reset) {
      loading.value = true
      photos.value = []
      hasMore.value = true
    } else {
      loadingMore.value = true
    }

    error.value = null

    try {
      let query = supabase
        .from('photos')
        .select('*')
        .order(sortBy.value, { ascending: sortOrder.value === 'asc', nullsFirst: false })
        .range(photos.value.length, photos.value.length + PAGE_SIZE - 1)

      // Apply filters
      if (filters.value.year) {
        query = query.eq('year', filters.value.year)
      }
      if (filters.value.month) {
        query = query.eq('month', filters.value.month)
      }
      if (filters.value.day) {
        query = query.eq('day', filters.value.day)
      }
      if (filters.value.city) {
        query = query.eq('city', filters.value.city)
      }
      if (filters.value.country) {
        query = query.eq('country', filters.value.country)
      }
      if (filters.value.mediaType) {
        query = query.eq('media_type', filters.value.mediaType)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      if (data) {
        const photosWithUrls: PhotoWithUrl[] = await Promise.all(
          data.map(async (photo: Photo) => {
            const thumbnailUrl = await getSignedUrl(photo, 'thumbnail')
            return {
              ...photo,
              thumbnailUrl: thumbnailUrl || undefined,
            }
          })
        )

        if (reset) {
          photos.value = photosWithUrls
        } else {
          photos.value.push(...photosWithUrls)
        }

        hasMore.value = data.length === PAGE_SIZE
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch photos'
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  async function loadPhotoUrl(photo: PhotoWithUrl) {
    if (photo.fullUrl) return

    const url = await getSignedUrl(photo, 'full')
    if (url) {
      const index = photos.value.findIndex(p => p.id === photo.id)
      if (index >= 0) {
        photos.value[index] = { ...photos.value[index], fullUrl: url }
      }
      if (currentPhoto.value?.id === photo.id) {
        currentPhoto.value = { ...currentPhoto.value, fullUrl: url }
      }
    }
  }

  function setCurrentPhoto(photo: PhotoWithUrl | null) {
    currentPhoto.value = photo
    if (photo) {
      loadPhotoUrl(photo)
    }
  }

  function setFilters(newFilters: FilterState) {
    filters.value = newFilters
    fetchPhotos(true)
  }

  function clearFilters() {
    filters.value = {}
    fetchPhotos(true)
  }

  function setSorting(by: 'taken_at' | 'created_at', order: 'asc' | 'desc') {
    sortBy.value = by
    sortOrder.value = order
    fetchPhotos(true)
  }

  function toggleSelection(photoId: string) {
    if (selectedPhotos.value.has(photoId)) {
      selectedPhotos.value.delete(photoId)
    } else {
      selectedPhotos.value.add(photoId)
    }
  }

  function selectAll() {
    photos.value.forEach(p => selectedPhotos.value.add(p.id))
  }

  function clearSelection() {
    selectedPhotos.value.clear()
  }

  async function getFolders(type: 'year' | 'month' | 'city' | 'country'): Promise<Folder[]> {
    try {
      let query = supabase.from('photos').select('*')

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      if (!data) return []

      const grouped = new Map<string | number, Photo[]>()

      data.forEach((photo: Photo) => {
        let key: string | number | null = null

        switch (type) {
          case 'year':
            key = photo.year
            break
          case 'month':
            key = photo.year && photo.month ? `${photo.year}-${photo.month}` : null
            break
          case 'city':
            key = photo.city
            break
          case 'country':
            key = photo.country
            break
        }

        if (key !== null) {
          if (!grouped.has(key)) {
            grouped.set(key, [])
          }
          grouped.get(key)!.push(photo)
        }
      })

      const folders: Folder[] = []

      for (const [key, photos] of grouped) {
        let label = String(key)

        if (type === 'month' && typeof key === 'string') {
          const [year, month] = key.split('-')
          const date = new Date(parseInt(year), parseInt(month) - 1)
          label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
        }

        const coverPhoto = photos[0]
        const thumbnailUrl = coverPhoto ? await getSignedUrl(coverPhoto, 'thumbnail') : undefined

        folders.push({
          type,
          value: key,
          label,
          count: photos.length,
          coverPhoto: coverPhoto ? { ...coverPhoto, thumbnailUrl: thumbnailUrl || undefined } : undefined,
        })
      }

      // Sort folders
      folders.sort((a, b) => {
        if (type === 'year' || type === 'month') {
          return String(b.value).localeCompare(String(a.value))
        }
        return String(a.label).localeCompare(String(b.label))
      })

      return folders
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch folders'
      return []
    }
  }

  function getSelectedPhotos(): PhotoWithUrl[] {
    return photos.value.filter(p => selectedPhotos.value.has(p.id))
  }

  function clearError() {
    error.value = null
  }

  async function deletePhoto(photo: PhotoWithUrl): Promise<boolean> {
    deleting.value = true
    try {
      await deleteSinglePhoto(photo)
      // Remove from local state
      photos.value = photos.value.filter(p => p.id !== photo.id)
      selectedPhotos.value.delete(photo.id)
      return true
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete photo'
      return false
    } finally {
      deleting.value = false
    }
  }

  async function deleteSelectedPhotos(): Promise<DeleteResult> {
    deleting.value = true
    deleteProgress.value = { current: 0, total: selectedPhotos.value.size, failed: 0 }

    const photosToDelete = getSelectedPhotos()

    try {
      const result = await deleteMultiplePhotos(photosToDelete, (current, total, failed) => {
        deleteProgress.value = { current, total, failed }
      })

      // Remove succeeded photos from local state
      const succeededSet = new Set(result.succeeded)
      photos.value = photos.value.filter(p => !succeededSet.has(p.id))
      result.succeeded.forEach(id => selectedPhotos.value.delete(id))

      if (result.failed.length > 0) {
        error.value = `Failed to delete ${result.failed.length} photo(s)`
      }

      return result
    } finally {
      deleting.value = false
      deleteProgress.value = { current: 0, total: 0, failed: 0 }
    }
  }

  return {
    photos,
    filteredPhotos,
    selectedPhotos,
    currentPhoto,
    loading,
    loadingMore,
    error,
    hasMore,
    filters,
    sortBy,
    sortOrder,
    selectionMode,
    fetchPhotos,
    loadPhotoUrl,
    setCurrentPhoto,
    setFilters,
    clearFilters,
    setSorting,
    toggleSelection,
    selectAll,
    clearSelection,
    getFolders,
    getSelectedPhotos,
    clearError,
    deleting,
    deleteProgress,
    deletePhoto,
    deleteSelectedPhotos,
  }
})
