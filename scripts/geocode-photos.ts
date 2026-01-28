/**
 * Migration script to reverse geocode photos with coordinates but no city/country
 * Uses OpenStreetMap Nominatim (free, no API key needed)
 *
 * Run with:
 *   SUPABASE_SERVICE_KEY="your-key" pnpm migrate:geocode
 */

import { createClient } from '@supabase/supabase-js'

// Config
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://supabase.unicatsolutions.de'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''
const BATCH_SIZE = 5 // Small batches to respect rate limits
const DELAY_BETWEEN_REQUESTS = 1100 // Nominatim requires max 1 request/second

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface Photo {
  id: string
  filename: string
  latitude: number
  longitude: number
  city: string | null
  country: string | null
}

interface GeocodingResult {
  city: string | null
  country: string | null
  locationName: string | null
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'iPhotos-Migration/1.0 (photo geocoding migration)',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    if (data.error) {
      return { city: null, country: null, locationName: null }
    }

    const address = data.address || {}

    // Try different fields for city
    const city = address.city || address.town || address.village || address.municipality || address.county || null
    const country = address.country || null

    // Build location name
    const parts: string[] = []
    if (city) parts.push(city)
    if (address.state && address.state !== city) parts.push(address.state)
    if (country) parts.push(country)

    const locationName = parts.length > 0 ? parts.join(', ') : null

    return { city, country, locationName }
  } catch (err) {
    console.error(`  Geocoding error: ${err}`)
    return { city: null, country: null, locationName: null }
  }
}

async function processPhoto(photo: Photo): Promise<boolean> {
  try {
    const result = await reverseGeocode(photo.latitude, photo.longitude)

    if (!result.city && !result.country) {
      console.log(` (no location found)`)
      return false
    }

    const { error } = await supabase
      .from('photos')
      .update({
        city: result.city,
        country: result.country,
        location_name: result.locationName,
      })
      .eq('id', photo.id)

    if (error) {
      console.error(`  DB update failed: ${error.message}`)
      return false
    }

    console.log(` → ${result.city || '?'}, ${result.country || '?'}`)
    return true
  } catch (err) {
    console.error(`  Error: ${err}`)
    return false
  }
}

async function main() {
  console.log('Starting geocoding migration...\n')

  // Get photos with coordinates but no city/country
  const { data: photos, error } = await supabase
    .from('photos')
    .select('id, filename, latitude, longitude, city, country')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .or('city.is.null,country.is.null')
    .order('taken_at', { ascending: true, nullsFirst: true })

  if (error) {
    console.error('Failed to fetch photos:', error.message)
    process.exit(1)
  }

  if (!photos || photos.length === 0) {
    console.log('No photos need geocoding. All done!')
    return
  }

  console.log(`Found ${photos.length} photos needing geocoding\n`)
  console.log('Note: Using Nominatim (1 request/sec rate limit)\n')

  let processed = 0
  let succeeded = 0
  let failed = 0

  for (const photo of photos) {
    process.stdout.write(`[${processed + 1}/${photos.length}] ${photo.filename}...`)

    const success = await processPhoto(photo as Photo)

    processed++
    if (success) {
      succeeded++
    } else {
      failed++
    }

    // Rate limit: wait between requests
    if (processed < photos.length) {
      await sleep(DELAY_BETWEEN_REQUESTS)
    }
  }

  console.log('\n--- Migration Complete ---')
  console.log(`Total: ${photos.length}`)
  console.log(`Succeeded: ${succeeded}`)
  console.log(`Failed/No data: ${failed}`)
}

main().catch(console.error)
