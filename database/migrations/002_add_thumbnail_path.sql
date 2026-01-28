-- Add thumbnail_path column to photos table
-- Run this migration in Supabase SQL Editor

ALTER TABLE photos ADD COLUMN IF NOT EXISTS thumbnail_path TEXT;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_photos_thumbnail_path ON photos(thumbnail_path) WHERE thumbnail_path IS NOT NULL;

COMMENT ON COLUMN photos.thumbnail_path IS 'Path to JPEG thumbnail in storage';
