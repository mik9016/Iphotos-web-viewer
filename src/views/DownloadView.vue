<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft, Download, Trash2, Image as ImageIcon } from 'lucide-vue-next'
import { usePhotosStore } from '@/stores/photos'
import AppLayout from '@/components/layout/AppLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { downloadSinglePhoto, downloadMultiplePhotos, formatFileSize } from '@/utils/download'

const router = useRouter()
const photosStore = usePhotosStore()

const downloading = ref(false)
const downloadProgress = ref({ current: 0, total: 0 })

const selectedPhotos = computed(() => photosStore.getSelectedPhotos())

const totalSize = computed(() => {
  return selectedPhotos.value.reduce((sum, p) => sum + (p.file_size || 0), 0)
})

async function handleDownload() {
  if (selectedPhotos.value.length === 0) return

  downloading.value = true

  try {
    if (selectedPhotos.value.length === 1) {
      await downloadSinglePhoto(selectedPhotos.value[0])
    } else {
      await downloadMultiplePhotos(selectedPhotos.value, (current, total) => {
        downloadProgress.value = { current, total }
      })
    }

    // Clear selection after download
    photosStore.clearSelection()
    router.push('/')
  } catch (e) {
    console.error('Download failed:', e)
  } finally {
    downloading.value = false
    downloadProgress.value = { current: 0, total: 0 }
  }
}

function removeFromSelection(photoId: string) {
  photosStore.toggleSelection(photoId)

  if (photosStore.selectedPhotos.size === 0) {
    router.push('/')
  }
}

function clearSelection() {
  photosStore.clearSelection()
  router.push('/')
}

onMounted(() => {
  if (photosStore.selectedPhotos.size === 0) {
    router.push('/')
  }
})
</script>

<template>
  <AppLayout>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <button
          @click="router.push('/')"
          class="flex items-center gap-1 text-apple-blue hover:underline"
        >
          <ChevronLeft class="w-4 h-4" />
          Back
        </button>
      </div>

      <button
        @click="clearSelection"
        class="flex items-center gap-2 text-apple-red hover:underline"
      >
        <Trash2 class="w-4 h-4" />
        Clear selection
      </button>
    </div>

    <h2 class="text-2xl font-bold text-apple-gray-900 dark:text-white mb-2">
      Download Photos
    </h2>
    <p class="text-apple-gray-500 mb-6">
      {{ selectedPhotos.length }} {{ selectedPhotos.length === 1 ? 'item' : 'items' }} selected
      · {{ formatFileSize(totalSize) }}
    </p>

    <!-- Selected photos grid -->
    <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-8">
      <div
        v-for="photo in selectedPhotos"
        :key="photo.id"
        class="relative aspect-square bg-apple-gray-100 dark:bg-apple-gray-800 rounded-lg overflow-hidden group"
      >
        <img
          v-if="photo.thumbnailUrl"
          :src="photo.thumbnailUrl"
          :alt="photo.filename"
          class="w-full h-full object-cover"
        />
        <div v-else class="w-full h-full flex items-center justify-center">
          <ImageIcon class="w-6 h-6 text-apple-gray-400" />
        </div>

        <!-- Remove button -->
        <button
          @click="removeFromSelection(photo.id)"
          class="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <Trash2 class="w-3 h-3" />
        </button>
      </div>
    </div>

    <!-- Download button -->
    <div class="sticky bottom-4">
      <button
        @click="handleDownload"
        :disabled="downloading || selectedPhotos.length === 0"
        class="btn btn-primary w-full h-14 text-base"
      >
        <LoadingSpinner v-if="downloading" size="sm" />
        <template v-else>
          <Download class="w-5 h-5 mr-2" />
          {{ selectedPhotos.length === 1 ? 'Download' : `Download ${selectedPhotos.length} items as ZIP` }}
        </template>
      </button>

      <!-- Progress -->
      <div v-if="downloading && downloadProgress.total > 1" class="mt-2 text-center text-sm text-apple-gray-500">
        Downloading {{ downloadProgress.current }} of {{ downloadProgress.total }}...
      </div>
    </div>
  </AppLayout>
</template>
