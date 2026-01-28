# iPhotos Web

A modern, Apple-inspired web viewer for photos stored in Supabase. Companion app for the iPhotos iOS sync application.

![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Storage-3FCF8E?logo=supabase)

## Features

- **Photo Gallery** - Grid view with infinite scroll
- **Video Playback** - Built-in player with controls
- **Folder Navigation** - Browse by year, month, city, or country
- **Photo Viewer** - Fullscreen lightbox with keyboard navigation
- **Batch Download** - Select multiple photos and download as ZIP
- **HEIC Support** - Automatic conversion for Apple photos
- **Fast Thumbnails** - Pre-generated JPEG thumbnails
- **Responsive Design** - Works on desktop and mobile
- **Dark Mode Ready** - Follows system preference

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Vue 3 + Composition API |
| Build | Vite |
| Package Manager | pnpm |
| State | Pinia |
| Router | Vue Router 4 |
| Styling | TailwindCSS |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Icons | Lucide Vue |

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Supabase project with:
  - Auth enabled
  - Storage bucket named `iphotos`
  - Row Level Security (RLS) policies configured

## Local Development

### 1. Clone and install

```bash
git clone <your-repo>
cd iphotos-web
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run development server

```bash
pnpm dev
```

Open http://localhost:5173

### 4. Build for production

```bash
pnpm build
```

## Docker Deployment

### Using Docker Compose

```bash
VITE_SUPABASE_URL="https://your-project.supabase.co" \
VITE_SUPABASE_ANON_KEY="your-anon-key" \
docker-compose up -d --build
```

### Using Docker directly

```bash
# Build
docker build \
  --build-arg VITE_SUPABASE_URL="https://your-project.supabase.co" \
  --build-arg VITE_SUPABASE_ANON_KEY="your-anon-key" \
  -t iphotos-web .

# Run
docker run -d -p 3000:80 --name iphotos-web iphotos-web
```

Access at http://localhost:3000

## Coolify Deployment

1. Add your Git repository in Coolify
2. Select **Dockerfile** as build pack
3. Set port to `80`
4. Add Build Arguments:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
5. Deploy

## Database Migrations

Run these SQL commands in Supabase SQL Editor:

### Add location columns
```sql
ALTER TABLE photos ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS location_name TEXT;

CREATE INDEX IF NOT EXISTS idx_photos_city ON photos(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_photos_country ON photos(country) WHERE country IS NOT NULL;
```

### Add thumbnail column
```sql
ALTER TABLE photos ADD COLUMN IF NOT EXISTS thumbnail_path TEXT;
```

## Migration Scripts

These scripts require the `SUPABASE_SERVICE_KEY` (service role key from Supabase Dashboard → Settings → API).

### Generate thumbnails for existing photos

```bash
SUPABASE_SERVICE_KEY="your-service-role-key" pnpm migrate:thumbnails
```

Generates 400px JPEG thumbnails for all photos (handles HEIC and videos).

### Geocode photos with coordinates

```bash
SUPABASE_SERVICE_KEY="your-service-role-key" pnpm migrate:geocode
```

Reverse geocodes photos that have lat/lng but missing city/country using OpenStreetMap Nominatim.

## Project Structure

```
iphotos-web/
├── src/
│   ├── components/
│   │   ├── auth/           # Login form
│   │   ├── common/         # Loading spinner, empty state
│   │   ├── folders/        # Folder card, folder list
│   │   ├── layout/         # Header, sidebar, layout
│   │   └── photos/         # Photo grid, card, viewer, video player
│   ├── composables/
│   │   ├── useSupabase.ts  # Supabase client singleton
│   │   ├── usePhotoUrl.ts  # Signed URL generation + HEIC conversion
│   │   └── useGeocoding.ts # Reverse geocoding helper
│   ├── stores/
│   │   ├── auth.ts         # Authentication state
│   │   └── photos.ts       # Photos state + filtering
│   ├── views/
│   │   ├── LoginView.vue   # Login page
│   │   ├── HomeView.vue    # Main gallery
│   │   ├── FoldersView.vue # Folder navigation
│   │   └── DownloadView.vue# Batch download
│   ├── services/
│   │   └── api.ts          # API helper functions
│   ├── types/
│   │   └── index.ts        # TypeScript interfaces
│   └── utils/
│       ├── date.ts         # Date formatting
│       └── download.ts     # Download helpers
├── scripts/
│   ├── generate-thumbnails.ts  # Thumbnail migration
│   └── geocode-photos.ts       # Geocoding migration
├── database/
│   └── migrations/         # SQL migration files
├── Dockerfile              # Multi-stage Docker build
├── docker-compose.yml      # Docker Compose config
└── nginx.conf              # Nginx config for production
```

## Security

### Frontend Security

| Layer | Protection |
|-------|------------|
| Authentication | Supabase JWT tokens (auto-refresh) |
| Authorization | Row Level Security (RLS) on all tables |
| API Access | Anon key + user session required |
| Photo URLs | Time-limited signed URLs (1 hour) |

### What's Protected

- ✅ Users can only access their own photos
- ✅ Service role key never exposed to frontend
- ✅ Tokens stored securely by Supabase SDK
- ✅ Routes protected by auth guards

### Keys Explained

| Key | Location | Purpose |
|-----|----------|---------|
| `ANON_KEY` | Frontend (public) | Client-side API access, RLS enforced |
| `SERVICE_ROLE_KEY` | Server only | Admin access, bypasses RLS |

## iOS App Integration

This web app is designed to work with the **iPhotos Sync** iOS app which:

1. Uploads photos/videos to Supabase Storage
2. Saves metadata to the `photos` table
3. Generates JPEG thumbnails during upload
4. Reverse geocodes location data

After syncing from iOS, photos appear automatically in the web app.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm type-check` | Run TypeScript checks |
| `pnpm migrate:thumbnails` | Generate thumbnails for existing photos |
| `pnpm migrate:geocode` | Geocode photos with coordinates |

## License

Private project.
