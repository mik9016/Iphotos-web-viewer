export interface Photo {
  id: string
  user_id: string
  filename: string
  storage_path: string
  thumbnail_path: string | null
  taken_at: string | null
  year: number | null
  month: number | null
  day: number | null
  latitude: number | null
  longitude: number | null
  city: string | null
  country: string | null
  location_name: string | null
  media_type: 'image' | 'video'
  mime_type: string
  file_size: number | null
  width: number
  height: number
  duration: number | null
  device_id: string
}

export interface PhotoWithUrl extends Photo {
  thumbnailUrl?: string
  fullUrl?: string
}

export interface Folder {
  type: 'year' | 'month' | 'day' | 'city' | 'country'
  value: string | number
  label: string
  count: number
  coverPhoto?: PhotoWithUrl
}

export interface FilterState {
  year?: number
  month?: number
  day?: number
  city?: string
  country?: string
  mediaType?: 'image' | 'video'
}

export interface User {
  id: string
  email: string
  created_at: string
}

export interface GeocodingResult {
  city: string | null
  country: string | null
  name: string | null
}
