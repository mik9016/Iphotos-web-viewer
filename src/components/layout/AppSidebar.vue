<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Calendar, MapPin, Film, Image as ImageIcon } from 'lucide-vue-next'
import { usePhotosStore } from '@/stores/photos'
import { fetchPhotoStats } from '@/services/api'
import { formatFileSize } from '@/utils/download'

const router = useRouter()
const photosStore = usePhotosStore()
const stats = ref({ totalPhotos: 0, totalVideos: 0, totalSize: 0 })

onMounted(async () => {
  stats.value = await fetchPhotoStats()
})

function setFilter(type: string) {
  // Navigate to home first, then set filter
  router.push('/').then(() => {
    if (type === 'photos') {
      photosStore.setFilters({ mediaType: 'image' })
    } else if (type === 'videos') {
      photosStore.setFilters({ mediaType: 'video' })
    } else if (type === 'all') {
      photosStore.clearFilters()
    }
  })
}
</script>

<template>
  <aside class="hidden lg:block w-64 flex-shrink-0">
    <div class="sticky top-20 space-y-6">
      <!-- Stats -->
      <div class="card p-4">
        <h3 class="text-xs font-semibold text-apple-gray-500 uppercase tracking-wider mb-3">
          Library
        </h3>
        <div class="space-y-2">
          <button
            @click="setFilter('all')"
            class="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700 transition-colors"
          >
            <span class="flex items-center gap-2 text-sm text-apple-gray-900 dark:text-white">
              <ImageIcon class="w-4 h-4 text-apple-blue" />
              All Photos
            </span>
            <span class="text-xs text-apple-gray-500">{{ stats.totalPhotos + stats.totalVideos }}</span>
          </button>
          <button
            @click="setFilter('photos')"
            class="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700 transition-colors"
          >
            <span class="flex items-center gap-2 text-sm text-apple-gray-900 dark:text-white">
              <ImageIcon class="w-4 h-4 text-apple-green" />
              Photos
            </span>
            <span class="text-xs text-apple-gray-500">{{ stats.totalPhotos }}</span>
          </button>
          <button
            @click="setFilter('videos')"
            class="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700 transition-colors"
          >
            <span class="flex items-center gap-2 text-sm text-apple-gray-900 dark:text-white">
              <Film class="w-4 h-4 text-purple-500" />
              Videos
            </span>
            <span class="text-xs text-apple-gray-500">{{ stats.totalVideos }}</span>
          </button>
        </div>
      </div>

      <!-- Quick Filters -->
      <div class="card p-4">
        <h3 class="text-xs font-semibold text-apple-gray-500 uppercase tracking-wider mb-3">
          Browse By
        </h3>
        <div class="space-y-1">
          <router-link
            to="/folders/year"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-apple-gray-900 dark:text-white hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700 transition-colors"
          >
            <Calendar class="w-4 h-4 text-apple-gray-500" />
            Years
          </router-link>
          <router-link
            to="/folders/month"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-apple-gray-900 dark:text-white hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700 transition-colors"
          >
            <Calendar class="w-4 h-4 text-apple-gray-500" />
            Months
          </router-link>
          <router-link
            to="/folders/country"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-apple-gray-900 dark:text-white hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700 transition-colors"
          >
            <MapPin class="w-4 h-4 text-apple-gray-500" />
            Countries
          </router-link>
          <router-link
            to="/folders/city"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-apple-gray-900 dark:text-white hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700 transition-colors"
          >
            <MapPin class="w-4 h-4 text-apple-gray-500" />
            Cities
          </router-link>
        </div>
      </div>

      <!-- Storage -->
      <div class="card p-4">
        <h3 class="text-xs font-semibold text-apple-gray-500 uppercase tracking-wider mb-3">
          Storage
        </h3>
        <p class="text-sm text-apple-gray-600 dark:text-apple-gray-300">
          {{ formatFileSize(stats.totalSize) }} used
        </p>
      </div>
    </div>
  </aside>
</template>
