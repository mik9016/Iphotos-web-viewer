<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-vue-next'
import type { PhotoWithUrl } from '@/types'
import { formatDuration } from '@/utils/date'
import { usePhotoUrl } from '@/composables/usePhotoUrl'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const props = defineProps<{
  photo: PhotoWithUrl
}>()

const { getSignedUrl } = usePhotoUrl()

const videoRef = ref<HTMLVideoElement | null>(null)
const videoUrl = ref<string | null>(null)
const loadingUrl = ref(true)
const videoError = ref(false)
const isPlaying = ref(false)
const isMuted = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const showControls = ref(true)

async function loadVideoUrl() {
  loadingUrl.value = true
  videoError.value = false

  // Use fullUrl if already available, otherwise fetch it
  if (props.photo.fullUrl) {
    videoUrl.value = props.photo.fullUrl
  } else {
    const url = await getSignedUrl(props.photo, 'full')
    videoUrl.value = url
  }

  loadingUrl.value = false
}

function handleVideoError() {
  videoError.value = true
  console.error('Video failed to load:', props.photo.filename, props.photo.mime_type)
}

let controlsTimeout: number | null = null

const progress = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

function togglePlay() {
  if (!videoRef.value) return

  if (isPlaying.value) {
    videoRef.value.pause()
  } else {
    videoRef.value.play()
  }
}

function toggleMute() {
  if (!videoRef.value) return
  videoRef.value.muted = !videoRef.value.muted
  isMuted.value = videoRef.value.muted
}

function handleTimeUpdate() {
  if (!videoRef.value) return
  currentTime.value = videoRef.value.currentTime
}

function handleLoadedMetadata() {
  if (!videoRef.value) return
  duration.value = videoRef.value.duration
}

function handleSeek(e: MouseEvent) {
  if (!videoRef.value) return

  const rect = (e.target as HTMLElement).getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  videoRef.value.currentTime = percent * duration.value
}

function handleFullscreen() {
  if (!videoRef.value) return
  videoRef.value.requestFullscreen()
}

function showControlsTemporarily() {
  showControls.value = true

  if (controlsTimeout) {
    clearTimeout(controlsTimeout)
  }

  controlsTimeout = window.setTimeout(() => {
    if (isPlaying.value) {
      showControls.value = false
    }
  }, 3000)
}

onMounted(() => {
  loadVideoUrl()
})

watch(videoRef, (video) => {
  if (video) {
    video.addEventListener('play', () => { isPlaying.value = true })
    video.addEventListener('pause', () => { isPlaying.value = false })
    video.addEventListener('ended', () => { isPlaying.value = false })
  }
})
</script>

<template>
  <div
    class="relative group"
    @mousemove="showControlsTemporarily"
    @click="togglePlay"
  >
    <!-- Loading state -->
    <div v-if="loadingUrl" class="flex items-center justify-center min-h-[300px] min-w-[400px]">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Error state -->
    <div v-else-if="videoError || !videoUrl" class="flex flex-col items-center justify-center min-h-[300px] min-w-[400px] text-white">
      <p class="text-lg mb-2">Unable to play video</p>
      <p class="text-sm text-white/60">{{ photo.filename }}</p>
      <p class="text-xs text-white/40 mt-1">{{ photo.mime_type }}</p>
    </div>

    <!-- Video player -->
    <video
      v-else
      ref="videoRef"
      :src="videoUrl"
      :poster="photo.thumbnailUrl"
      class="max-w-full max-h-[90vh] outline-none"
      playsinline
      tabindex="-1"
      @timeupdate="handleTimeUpdate"
      @loadedmetadata="handleLoadedMetadata"
      @error="handleVideoError"
      @keydown.left.prevent
      @keydown.right.prevent
    />

    <!-- Play overlay -->
    <div
      v-if="!loadingUrl && !videoError && videoUrl && !isPlaying"
      class="absolute inset-0 flex items-center justify-center bg-black/20"
    >
      <div class="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
        <Play class="w-8 h-8 text-white ml-1" />
      </div>
    </div>

    <!-- Controls -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-show="!loadingUrl && !videoError && videoUrl && (showControls || !isPlaying)"
        class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
        @click.stop
      >
        <!-- Progress bar -->
        <div
          class="h-1 bg-white/30 rounded-full mb-3 cursor-pointer"
          @click="handleSeek"
        >
          <div
            class="h-full bg-white rounded-full"
            :style="{ width: `${progress}%` }"
          />
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button
              @click="togglePlay"
              tabindex="-1"
              class="text-white hover:text-white/80 transition-colors"
            >
              <Pause v-if="isPlaying" class="w-6 h-6" />
              <Play v-else class="w-6 h-6" />
            </button>

            <button
              @click="toggleMute"
              tabindex="-1"
              class="text-white hover:text-white/80 transition-colors"
            >
              <VolumeX v-if="isMuted" class="w-5 h-5" />
              <Volume2 v-else class="w-5 h-5" />
            </button>

            <span class="text-white text-sm">
              {{ formatDuration(currentTime) }} / {{ formatDuration(duration) }}
            </span>
          </div>

          <button
            @click="handleFullscreen"
            tabindex="-1"
            class="text-white hover:text-white/80 transition-colors"
          >
            <Maximize class="w-5 h-5" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
