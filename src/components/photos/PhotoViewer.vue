<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { X, ChevronLeft, ChevronRight, Download, MapPin, Calendar, Info, Trash2 } from 'lucide-vue-next'
import { usePhotosStore } from '@/stores/photos'
import { useGeocoding } from '@/composables/useGeocoding'
import VideoPlayer from './VideoPlayer.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { formatDateTime } from '@/utils/date'
import { downloadSinglePhoto, formatFileSize } from '@/utils/download'
import type { PhotoWithUrl } from '@/types'

const props = defineProps<{
  photo: PhotoWithUrl
}>()

const emit = defineEmits<{
  close: []
  prev: []
  next: []
}>()

const photosStore = usePhotosStore()
const { getLocationName } = useGeocoding()

const imageLoaded = ref(false)
const showInfo = ref(false)
const locationName = ref<string | null>(null)
const downloading = ref(false)
const showDeleteConfirm = ref(false)
const deleting = ref(false)

const isVideo = computed(() => props.photo.media_type === 'video')

const currentIndex = computed(() =>
  photosStore.photos.findIndex(p => p.id === props.photo.id)
)

const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < photosStore.photos.length - 1)

function handleKeydown(e: KeyboardEvent) {
  // Don't handle if delete confirm is open
  if (showDeleteConfirm.value) return

  switch (e.key) {
    case 'Escape':
      e.preventDefault()
      emit('close')
      break
    case 'ArrowLeft':
      e.preventDefault()
      if (hasPrev.value) emit('prev')
      break
    case 'ArrowRight':
      e.preventDefault()
      if (hasNext.value) emit('next')
      break
    case 'i':
      e.preventDefault()
      showInfo.value = !showInfo.value
      break
  }
}

async function handleDownload() {
  downloading.value = true
  try {
    await downloadSinglePhoto(props.photo)
  } catch (e) {
    console.error('Download failed:', e)
  } finally {
    downloading.value = false
  }
}

async function handleDelete() {
  deleting.value = true
  try {
    const success = await photosStore.deletePhoto(props.photo)
    if (success) {
      emit('close')
    }
  } finally {
    deleting.value = false
    showDeleteConfirm.value = false
  }
}

watch(() => props.photo, async (newPhoto) => {
  imageLoaded.value = false
  locationName.value = await getLocationName(newPhoto)
}, { immediate: true })

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black flex items-center justify-center" @click.self="emit('close')">
    <!-- Close button -->
    <button
      @click="emit('close')"
      class="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
    >
      <X class="w-6 h-6" />
    </button>

    <!-- Info toggle -->
    <button
      @click="showInfo = !showInfo"
      class="absolute top-4 right-16 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      :class="{ 'bg-white/30': showInfo }"
    >
      <Info class="w-6 h-6" />
    </button>

    <!-- Delete button -->
    <button
      @click="showDeleteConfirm = true"
      class="absolute top-4 right-40 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 hover:bg-red-500/50 text-white transition-colors"
    >
      <Trash2 class="w-6 h-6" />
    </button>

    <!-- Download button -->
    <button
      @click="handleDownload"
      :disabled="downloading"
      class="absolute top-4 right-28 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
    >
      <LoadingSpinner v-if="downloading" size="sm" />
      <Download v-else class="w-6 h-6" />
    </button>

    <!-- Navigation -->
    <button
      v-if="hasPrev"
      @click="emit('prev')"
      class="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
    >
      <ChevronLeft class="w-8 h-8" />
    </button>

    <button
      v-if="hasNext"
      @click="emit('next')"
      class="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
    >
      <ChevronRight class="w-8 h-8" />
    </button>

    <!-- Content -->
    <div class="relative max-w-full max-h-full p-4">
      <!-- Loading -->
      <div v-if="!imageLoaded && !isVideo" class="absolute inset-0 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>

      <!-- Image -->
      <img
        v-if="!isVideo"
        :src="photo.fullUrl || photo.thumbnailUrl"
        :alt="photo.filename"
        class="max-w-full max-h-[90vh] object-contain transition-opacity duration-200"
        :class="{ 'opacity-0': !imageLoaded }"
        @load="imageLoaded = true"
      />

      <!-- Video -->
      <VideoPlayer
        v-else
        :photo="photo"
        class="max-w-full max-h-[90vh]"
      />
    </div>

    <!-- Info panel -->
    <Transition
      enter-active-class="transition-transform duration-300"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-300"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="showInfo"
        class="absolute top-0 right-0 bottom-0 w-80 bg-black/80 backdrop-blur-xl p-6 overflow-y-auto"
      >
        <h3 class="text-white font-semibold mb-4">Info</h3>

        <div class="space-y-4 text-sm">
          <div>
            <p class="text-white/60 mb-1">Filename</p>
            <p class="text-white">{{ photo.filename }}</p>
          </div>

          <div v-if="photo.taken_at">
            <p class="text-white/60 mb-1 flex items-center gap-1">
              <Calendar class="w-4 h-4" />
              Date
            </p>
            <p class="text-white">{{ formatDateTime(photo.taken_at) }}</p>
          </div>

          <div v-if="locationName">
            <p class="text-white/60 mb-1 flex items-center gap-1">
              <MapPin class="w-4 h-4" />
              Location
            </p>
            <p class="text-white">{{ locationName }}</p>
          </div>

          <div>
            <p class="text-white/60 mb-1">Dimensions</p>
            <p class="text-white">{{ photo.width }} x {{ photo.height }}</p>
          </div>

          <div v-if="photo.file_size">
            <p class="text-white/60 mb-1">Size</p>
            <p class="text-white">{{ formatFileSize(photo.file_size) }}</p>
          </div>

          <div>
            <p class="text-white/60 mb-1">Type</p>
            <p class="text-white">{{ photo.mime_type }}</p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Counter -->
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 text-white text-sm">
      {{ currentIndex + 1 }} / {{ photosStore.photos.length }}
    </div>

    <!-- Delete confirmation -->
    <ConfirmDialog
      v-if="showDeleteConfirm"
      title="Delete Photo"
      :message="`Are you sure you want to delete '${photo.filename}'? This action cannot be undone.`"
      confirm-text="Delete"
      variant="danger"
      :loading="deleting"
      @confirm="handleDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>
