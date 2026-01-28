<script setup lang="ts">
import { ref } from 'vue'
import { usePhotosStore } from '@/stores/photos'
import AppLayout from '@/components/layout/AppLayout.vue'
import PhotoGrid from '@/components/photos/PhotoGrid.vue'
import FilterBar from '@/components/photos/FilterBar.vue'
import PhotoViewer from '@/components/photos/PhotoViewer.vue'
import type { PhotoWithUrl } from '@/types'

const photosStore = usePhotosStore()
const viewerPhoto = ref<PhotoWithUrl | null>(null)

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
</script>

<template>
  <AppLayout>
    <FilterBar />
    <PhotoGrid @open-photo="openPhoto" />

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
