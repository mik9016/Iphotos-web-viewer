<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Filter, ArrowUpDown, CheckSquare, Square } from 'lucide-vue-next'
import { usePhotosStore } from '@/stores/photos'
import { useSupabase } from '@/composables/useSupabase'

const photosStore = usePhotosStore()
const supabase = useSupabase()

const showFilters = ref(false)

// Available filter options
const availableYears = ref<number[]>([])
const availableMonths = ref<number[]>([])
const availableCities = ref<string[]>([])
const availableCountries = ref<string[]>([])

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

const monthNames = computed(() => {
  return availableMonths.value.map(m => ({
    value: m,
    label: new Date(2000, m - 1).toLocaleDateString('en-US', { month: 'long' })
  }))
})

async function loadFilterOptions() {
  // Fetch distinct values for filters
  const [yearsRes, citiesRes, countriesRes] = await Promise.all([
    supabase.from('photos').select('year').not('year', 'is', null),
    supabase.from('photos').select('city').not('city', 'is', null),
    supabase.from('photos').select('country').not('country', 'is', null),
  ])

  if (yearsRes.data) {
    const years = [...new Set(yearsRes.data.map(r => r.year as number))]
    availableYears.value = years.sort((a, b) => b - a)
  }

  if (citiesRes.data) {
    const cities = [...new Set(citiesRes.data.map(r => r.city as string))]
    availableCities.value = cities.sort()
  }

  if (countriesRes.data) {
    const countries = [...new Set(countriesRes.data.map(r => r.country as string))]
    availableCountries.value = countries.sort()
  }

  // Default months 1-12
  availableMonths.value = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
}

function toggleMediaType(type: 'image' | 'video') {
  if (photosStore.filters.mediaType === type) {
    photosStore.setFilters({ ...photosStore.filters, mediaType: undefined })
  } else {
    photosStore.setFilters({ ...photosStore.filters, mediaType: type })
  }
}

function setYear(year: number | undefined) {
  photosStore.setFilters({ ...photosStore.filters, year })
}

function setMonth(month: number | undefined) {
  photosStore.setFilters({ ...photosStore.filters, month })
}

function setCity(city: string | undefined) {
  photosStore.setFilters({ ...photosStore.filters, city })
}

function setCountry(country: string | undefined) {
  photosStore.setFilters({ ...photosStore.filters, country })
}

function clearFilters() {
  photosStore.clearFilters()
}

function toggleSort() {
  const newOrder = photosStore.sortOrder === 'desc' ? 'asc' : 'desc'
  photosStore.setSorting(photosStore.sortBy, newOrder)
}

onMounted(() => {
  loadFilterOptions()
})
</script>

<template>
  <div class="mb-4">
    <div class="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
      <!-- Filter button -->
      <button
        @click="showFilters = !showFilters"
        class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-0"
        :class="hasActiveFilters
          ? 'bg-apple-blue text-white'
          : 'bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-gray-700 dark:text-apple-gray-300 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700'"
      >
        <Filter class="w-4 h-4 shrink-0" />
        <span class="truncate">{{ filterSummary }}</span>
      </button>

      <div class="flex items-center gap-2 flex-wrap">
        <!-- Selection toggle -->
        <button
          v-if="photosStore.photos.length > 0"
          @click="photosStore.selectionMode ? photosStore.clearSelection() : photosStore.selectAll()"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-gray-700 dark:text-apple-gray-300 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700 transition-colors"
        >
          <CheckSquare v-if="photosStore.selectionMode" class="w-4 h-4" />
          <Square v-else class="w-4 h-4" />
          <span class="hidden sm:inline">{{ photosStore.selectionMode ? 'Deselect' : 'Select' }}</span>
        </button>

        <!-- Sort toggle -->
        <button
          @click="toggleSort"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-gray-700 dark:text-apple-gray-300 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700 transition-colors"
        >
          <ArrowUpDown class="w-4 h-4" />
          <span class="hidden sm:inline">{{ photosStore.sortOrder === 'desc' ? 'Newest' : 'Oldest' }}</span>
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

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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

          <!-- Year -->
          <div v-if="availableYears.length > 0">
            <p class="text-xs font-medium text-apple-gray-500 uppercase tracking-wider mb-2">Year</p>
            <select
              :value="photosStore.filters.year || ''"
              @change="setYear(($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : undefined)"
              class="w-full px-3 py-1.5 rounded-lg text-sm font-medium bg-apple-gray-100 dark:bg-apple-gray-700 text-apple-gray-700 dark:text-apple-gray-300 border-0 focus:ring-2 focus:ring-apple-blue"
            >
              <option value="">All years</option>
              <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
            </select>
          </div>

          <!-- Month -->
          <div>
            <p class="text-xs font-medium text-apple-gray-500 uppercase tracking-wider mb-2">Month</p>
            <select
              :value="photosStore.filters.month || ''"
              @change="setMonth(($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : undefined)"
              class="w-full px-3 py-1.5 rounded-lg text-sm font-medium bg-apple-gray-100 dark:bg-apple-gray-700 text-apple-gray-700 dark:text-apple-gray-300 border-0 focus:ring-2 focus:ring-apple-blue"
            >
              <option value="">All months</option>
              <option v-for="month in monthNames" :key="month.value" :value="month.value">{{ month.label }}</option>
            </select>
          </div>

          <!-- City -->
          <div v-if="availableCities.length > 0">
            <p class="text-xs font-medium text-apple-gray-500 uppercase tracking-wider mb-2">City</p>
            <select
              :value="photosStore.filters.city || ''"
              @change="setCity(($event.target as HTMLSelectElement).value || undefined)"
              class="w-full px-3 py-1.5 rounded-lg text-sm font-medium bg-apple-gray-100 dark:bg-apple-gray-700 text-apple-gray-700 dark:text-apple-gray-300 border-0 focus:ring-2 focus:ring-apple-blue"
            >
              <option value="">All cities</option>
              <option v-for="city in availableCities" :key="city" :value="city">{{ city }}</option>
            </select>
          </div>

          <!-- Country -->
          <div v-if="availableCountries.length > 0">
            <p class="text-xs font-medium text-apple-gray-500 uppercase tracking-wider mb-2">Country</p>
            <select
              :value="photosStore.filters.country || ''"
              @change="setCountry(($event.target as HTMLSelectElement).value || undefined)"
              class="w-full px-3 py-1.5 rounded-lg text-sm font-medium bg-apple-gray-100 dark:bg-apple-gray-700 text-apple-gray-700 dark:text-apple-gray-300 border-0 focus:ring-2 focus:ring-apple-blue"
            >
              <option value="">All countries</option>
              <option v-for="country in availableCountries" :key="country" :value="country">{{ country }}</option>
            </select>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
