-- Add location name columns to the photos table
-- Run this migration in Supabase SQL Editor

-- Add new columns for geocoded location data
ALTER TABLE photos ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS location_name TEXT;

-- Create indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_photos_city ON photos(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_photos_country ON photos(country) WHERE country IS NOT NULL;

-- Optional: Create a composite index for location filtering
CREATE INDEX IF NOT EXISTS idx_photos_location ON photos(country, city)
WHERE country IS NOT NULL OR city IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN photos.city IS 'City name from reverse geocoding';
COMMENT ON COLUMN photos.country IS 'Country name from reverse geocoding';
COMMENT ON COLUMN photos.location_name IS 'Full formatted location name from reverse geocoding';
