<script setup lang="ts">
import { ref, computed } from 'vue'
import { Filter, ArrowUpDown, CheckSquare, Square } from 'lucide-vue-next'
import { usePhotosStore } from '@/stores/photos'

const photosStore = usePhotosStore()

const showFilters = ref(false)

const hasActiveFilters = computed(() => {
  const f = photosStore.filters
  return f.year || f.month || f.city || f.country || f.mediaType
})

const filterSummary = computed(() => {
  const parts: string[] = []
  const f = photosStore.filters

  if (f.mediaType) {
    parts.push(f.mediaType === 'image' ? 'Photos' : 'Videos')
  }
  if (f.year) parts.push(String(f.year))
  if (f.month) {
    const date = new Date(2000, f.month - 1)
    parts.push(date.toLocaleDateString('en-US', { month: 'short' }))
  }
  if (f.city) parts.push(f.city)
  if (f.country) parts.push(f.country)

  return parts.join(' · ') || 'All photos'
})

function toggleMediaType(type: 'image' | 'video') {
  if (photosStore.filters.mediaType === type) {
    photosStore.setFilters({ ...photosStore.filters, mediaType: undefined })
  } else {
    photosStore.setFilters({ ...photosStore.filters, mediaType: type })
  }
}

function clearFilters() {
  photosStore.clearFilters()
}

function toggleSort() {
  const newOrder = photosStore.sortOrder === 'desc' ? 'asc' : 'desc'
  photosStore.setSorting(photosStore.sortBy, newOrder)
}
</script>

<template>
  <div class="mb-4">
    <div class="flex items-center justify-between gap-4">
      <!-- Filter button -->
      <button
        @click="showFilters = !showFilters"
        class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="hasActiveFilters
          ? 'bg-apple-blue text-white'
          : 'bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-gray-700 dark:text-apple-gray-300 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700'"
      >
        <Filter class="w-4 h-4" />
        {{ filterSummary }}
      </button>

      <div class="flex items-center gap-2">
        <!-- Selection toggle -->
        <button
          v-if="photosStore.photos.length > 0"
          @click="photosStore.selectionMode ? photosStore.clearSelection() : photosStore.selectAll()"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-gray-700 dark:text-apple-gray-300 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700 transition-colors"
        >
          <CheckSquare v-if="photosStore.selectionMode" class="w-4 h-4" />
          <Square v-else class="w-4 h-4" />
          {{ photosStore.selectionMode ? 'Deselect' : 'Select' }}
        </button>

        <!-- Sort toggle -->
        <button
          @click="toggleSort"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-gray-700 dark:text-apple-gray-300 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700 transition-colors"
        >
          <ArrowUpDown class="w-4 h-4" />
          {{ photosStore.sortOrder === 'desc' ? 'Newest' : 'Oldest' }}
        </button>
      </div>
    </div>

    <!-- Filter panel -->
    <Transition
      enter-active-class="transition-all duration-200"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="showFilters" class="mt-4 p-4 bg-white dark:bg-apple-gray-800 rounded-xl shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-apple-gray-900 dark:text-white">Filters</h3>
          <button
            v-if="hasActiveFilters"
            @click="clearFilters"
            class="text-sm text-apple-blue hover:underline"
          >
            Clear all
          </button>
        </div>

        <div class="space-y-4">
          <!-- Media type -->
          <div>
            <p class="text-xs font-medium text-apple-gray-500 uppercase tracking-wider mb-2">Type</p>
            <div class="flex gap-2">
              <button
                @click="toggleMediaType('image')"
                class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                :class="photosStore.filters.mediaType === 'image'
                  ? 'bg-apple-blue text-white'
                  : 'bg-apple-gray-100 dark:bg-apple-gray-700 text-apple-gray-700 dark:text-apple-gray-300'"
              >
                Photos
              </button>
              <button
                @click="toggleMediaType('video')"
                class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                :class="photosStore.filters.mediaType === 'video'
                  ? 'bg-apple-blue text-white'
                  : 'bg-apple-gray-100 dark:bg-apple-gray-700 text-apple-gray-700 dark:text-apple-gray-300'"
              >
                Videos
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
