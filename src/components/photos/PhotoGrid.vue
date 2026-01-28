<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { usePhotosStore } from '@/stores/photos'
import PhotoCard from './PhotoCard.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { PhotoWithUrl } from '@/types'

const emit = defineEmits<{
  openPhoto: [photo: PhotoWithUrl]
}>()

const photosStore = usePhotosStore()
const containerRef = ref<HTMLElement | null>(null)

function handlePhotoClick(photo: PhotoWithUrl) {
  emit('openPhoto', photo)
}

function handleScroll() {
  if (!containerRef.value) return

  const { scrollTop, scrollHeight, clientHeight } = document.documentElement

  if (scrollTop + clientHeight >= scrollHeight - 500) {
    if (!photosStore.loadingMore && photosStore.hasMore) {
      photosStore.fetchPhotos()
    }
  }
}

onMounted(() => {
  photosStore.fetchPhotos(true)
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div ref="containerRef">
    <!-- Loading initial -->
    <div v-if="photosStore.loading && photosStore.photos.length === 0" class="flex items-center justify-center py-20">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Empty state -->
    <EmptyState
      v-else-if="!photosStore.loading && photosStore.photos.length === 0"
      title="No photos"
      description="Your photos will appear here once you upload them from the iOS app."
    />

    <!-- Photo grid -->
    <div v-else>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        <PhotoCard
          v-for="photo in photosStore.photos"
          :key="photo.id"
          :photo="photo"
          @click="handlePhotoClick"
        />
      </div>

      <!-- Loading more -->
      <div v-if="photosStore.loadingMore" class="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>

      <!-- End of list -->
      <div v-else-if="!photosStore.hasMore && photosStore.photos.length > 0" class="text-center py-8">
        <p class="text-sm text-apple-gray-500">
          {{ photosStore.photos.length }} photo{{ photosStore.photos.length === 1 ? '' : 's' }}
        </p>
      </div>
    </div>

    <!-- Error -->
    <div v-if="photosStore.error" class="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg">
      {{ photosStore.error }}
    </div>
  </div>
</template>
