import { ref } from 'vue'
import { useSupabase } from './useSupabase'
import type { Photo, GeocodingResult } from '@/types'

const geocodeCache = new Map<string, GeocodingResult>()

export function useGeocoding() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`
    const cached = geocodeCache.get(cacheKey)

    if (cached) {
      return cached
    }

    loading.value = true
    error.value = null

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
        {
          headers: {
            'User-Agent': 'iPhotos-Web/1.0',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Geocoding request failed')
      }

      const data = await response.json()

      const result: GeocodingResult = {
        city: data.address?.city || data.address?.town || data.address?.village || null,
        country: data.address?.country || null,
        name: data.display_name || null,
      }

      geocodeCache.set(cacheKey, result)
      return result
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Geocoding failed'
      return null
    } finally {
      loading.value = false
    }
  }

  async function getLocationName(photo: Photo): Promise<string | null> {
    // Check if location data already exists in DB
    if (photo.city || photo.country) {
      const parts = [photo.city, photo.country].filter(Boolean)
      return parts.join(', ') || null
    }

    // Fallback: reverse geocode using lat/lng
    if (photo.latitude && photo.longitude) {
      const result = await reverseGeocode(photo.latitude, photo.longitude)

      if (result) {
        // Optionally update DB for future use
        await updatePhotoLocation(photo.id, result)

        const parts = [result.city, result.country].filter(Boolean)
        return parts.join(', ') || null
      }
    }

    return null
  }

  async function updatePhotoLocation(photoId: string, location: GeocodingResult) {
    const supabase = useSupabase()

    try {
      await supabase
        .from('photos')
        .update({
          city: location.city,
          country: location.country,
          location_name: location.name,
        })
        .eq('id', photoId)
    } catch {
      // Silent fail - not critical
      console.warn('Failed to update photo location')
    }
  }

  function clearCache() {
    geocodeCache.clear()
  }

  return {
    reverseGeocode,
    getLocationName,
    updatePhotoLocation,
    clearCache,
    loading,
    error,
  }
}
