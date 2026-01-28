<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, Calendar, MapPin } from 'lucide-vue-next'
import { usePhotosStore } from '@/stores/photos'
import AppLayout from '@/components/layout/AppLayout.vue'
import FolderList from '@/components/folders/FolderList.vue'
import PhotoGrid from '@/components/photos/PhotoGrid.vue'
import PhotoViewer from '@/components/photos/PhotoViewer.vue'
import type { Folder, PhotoWithUrl } from '@/types'

const route = useRoute()
const router = useRouter()
const photosStore = usePhotosStore()

const viewerPhoto = ref<PhotoWithUrl | null>(null)
const selectedFolder = ref<Folder | null>(null)

const folderType = computed(() => {
  const type = route.params.type as string
  if (['year', 'month', 'city', 'country'].includes(type)) {
    return type as 'year' | 'month' | 'city' | 'country'
  }
  return null
})

const folderTypes = [
  { type: 'year', label: 'Years', icon: Calendar },
  { type: 'month', label: 'Months', icon: Calendar },
  { type: 'country', label: 'Countries', icon: MapPin },
  { type: 'city', label: 'Cities', icon: MapPin },
]

const currentFolderTypeLabel = computed(() => {
  const ft = folderTypes.find(f => f.type === folderType.value)
  return ft?.label || ''
})

function selectFolderType(type: string) {
  selectedFolder.value = null
  router.push(`/folders/${type}`)
}

function handleFolderSelect(folder: Folder) {
  selectedFolder.value = folder

  // Apply filter based on folder
  switch (folder.type) {
    case 'year':
      photosStore.setFilters({ year: folder.value as number })
      break
    case 'month':
      const [year, month] = String(folder.value).split('-')
      photosStore.setFilters({ year: parseInt(year), month: parseInt(month) })
      break
    case 'city':
      photosStore.setFilters({ city: folder.value as string })
      break
    case 'country':
      photosStore.setFilters({ country: folder.value as string })
      break
  }
}

function goBack() {
  if (selectedFolder.value) {
    selectedFolder.value = null
    photosStore.clearFilters()
  } else {
    router.push('/folders')
  }
}

function openPhoto(photo: PhotoWithUrl) {
  viewerPhoto.value = photo
  photosStore.setCurrentPhoto(photo)
}

function closeViewer() {
  viewerPhoto.value = null
  photosStore.setCurrentPhoto(null)
}

function navigatePrev() {
  const currentIndex = photosStore.photos.findIndex(p => p.id === viewerPhoto.value?.id)
  if (currentIndex > 0) {
    const prevPhoto = photosStore.photos[currentIndex - 1]
    viewerPhoto.value = prevPhoto
    photosStore.setCurrentPhoto(prevPhoto)
  }
}

function navigateNext() {
  const currentIndex = photosStore.photos.findIndex(p => p.id === viewerPhoto.value?.id)
  if (currentIndex < photosStore.photos.length - 1) {
    const nextPhoto = photosStore.photos[currentIndex + 1]
    viewerPhoto.value = nextPhoto
    photosStore.setCurrentPhoto(nextPhoto)
  }
}

// Reset when leaving folder type
watch(folderType, (newType, oldType) => {
  if (newType !== oldType) {
    selectedFolder.value = null
    photosStore.clearFilters()
  }
})
</script>

<template>
  <AppLayout>
    <!-- Breadcrumb -->
    <div v-if="folderType || selectedFolder" class="flex items-center gap-2 mb-4">
      <button
        @click="goBack"
        class="flex items-center gap-1 text-apple-blue hover:underline"
      >
        <ChevronLeft class="w-4 h-4" />
        Back
      </button>
      <span v-if="selectedFolder" class="text-apple-gray-500">/</span>
      <span v-if="selectedFolder" class="text-apple-gray-900 dark:text-white font-medium">
        {{ selectedFolder.label }}
      </span>
    </div>

    <!-- Folder type selection -->
    <div v-if="!folderType">
      <h2 class="text-2xl font-bold text-apple-gray-900 dark:text-white mb-6">
        Browse Folders
      </h2>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          v-for="ft in folderTypes"
          :key="ft.type"
          @click="selectFolderType(ft.type)"
          class="card p-6 text-center hover:shadow-md transition-shadow"
        >
          <component :is="ft.icon" class="w-8 h-8 mx-auto mb-2 text-apple-blue" />
          <span class="font-medium text-apple-gray-900 dark:text-white">{{ ft.label }}</span>
        </button>
      </div>
    </div>

    <!-- Folder list or photo grid -->
    <div v-else>
      <h2 class="text-2xl font-bold text-apple-gray-900 dark:text-white mb-6">
        {{ selectedFolder ? selectedFolder.label : currentFolderTypeLabel }}
      </h2>

      <PhotoGrid v-if="selectedFolder" @open-photo="openPhoto" />
      <FolderList v-else :type="folderType" @select-folder="handleFolderSelect" />
    </div>

    <!-- Photo viewer -->
    <PhotoViewer
      v-if="viewerPhoto"
      :photo="viewerPhoto"
      @close="closeViewer"
      @prev="navigatePrev"
      @next="navigateNext"
    />
  </AppLayout>
</template>
