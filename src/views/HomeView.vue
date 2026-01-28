<script setup lang="ts">
import { ref, computed } from 'vue'
import { Download, Trash2 } from 'lucide-vue-next'
import { usePhotosStore } from '@/stores/photos'
import AppLayout from '@/components/layout/AppLayout.vue'
import PhotoGrid from '@/components/photos/PhotoGrid.vue'
import FilterBar from '@/components/photos/FilterBar.vue'
import PhotoViewer from '@/components/photos/PhotoViewer.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { downloadMultiplePhotos } from '@/utils/download'
import type { PhotoWithUrl } from '@/types'

const photosStore = usePhotosStore()
const viewerPhoto = ref<PhotoWithUrl | null>(null)
const showBulkDeleteConfirm = ref(false)
const bulkDeleting = ref(false)
const downloading = ref(false)
const downloadProgress = ref({ current: 0, total: 0 })

const deleteProgressText = computed(() => {
  const { current, total, failed } = photosStore.deleteProgress
  if (total === 0) return ''
  let text = `Deleting ${current} of ${total}`
  if (failed > 0) text += ` (${failed} failed)`
  return text
})

const downloadProgressText = computed(() => {
  const { current, total } = downloadProgress.value
  if (total === 0) return ''
  return `Downloading ${current} of ${total}`
})

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

async function handleBulkDelete() {
  bulkDeleting.value = true
  try {
    await photosStore.deleteSelectedPhotos()
  } finally {
    bulkDeleting.value = false
    showBulkDeleteConfirm.value = false
  }
}

async function handleBulkDownload() {
  const selectedPhotos = photosStore.getSelectedPhotos()
  if (selectedPhotos.length === 0) return

  downloading.value = true
  downloadProgress.value = { current: 0, total: selectedPhotos.length }

  try {
    await downloadMultiplePhotos(selectedPhotos, (current, total) => {
      downloadProgress.value = { current, total }
    })
  } finally {
    downloading.value = false
    downloadProgress.value = { current: 0, total: 0 }
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

    <!-- Bulk delete confirmation -->
    <ConfirmDialog
      v-if="showBulkDeleteConfirm"
      title="Delete Photos"
      :message="`Are you sure you want to delete ${photosStore.selectedPhotos.size} photo(s)? This action cannot be undone.`"
      confirm-text="Delete"
      variant="danger"
      :loading="bulkDeleting"
      @confirm="handleBulkDelete"
      @cancel="showBulkDeleteConfirm = false"
    />

    <!-- Floating action bar for selected photos -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-all duration-300"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-300"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-4"
      >
        <div
          v-if="photosStore.selectionMode && !downloading && photosStore.deleteProgress.total === 0"
          class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-apple-gray-800 dark:bg-apple-gray-700 text-white rounded-full shadow-lg flex items-center gap-4"
        >
          <span class="text-sm font-medium">{{ photosStore.selectedPhotos.size }} selected</span>

          <div class="w-px h-5 bg-white/20" />

          <button
            @click="handleBulkDownload"
            class="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <Download class="w-4 h-4" />
            <span class="text-sm">Download</span>
          </button>

          <button
            @click="showBulkDeleteConfirm = true"
            class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
          >
            <Trash2 class="w-4 h-4" />
            <span class="text-sm">Delete</span>
          </button>
        </div>
      </Transition>

      <!-- Progress indicator -->
      <Transition
        enter-active-class="transition-all duration-300"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-300"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-4"
      >
        <div
          v-if="photosStore.deleteProgress.total > 0 || downloading"
          class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-apple-gray-800 text-white rounded-full shadow-lg flex items-center gap-3"
        >
          <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>{{ downloading ? downloadProgressText : deleteProgressText }}</span>
        </div>
      </Transition>
    </Teleport>
  </AppLayout>
</template>
