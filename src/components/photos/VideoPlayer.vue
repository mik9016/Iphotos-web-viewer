<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-vue-next'
import type { PhotoWithUrl } from '@/types'
import { formatDuration } from '@/utils/date'

defineProps<{
  photo: PhotoWithUrl
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const isPlaying = ref(false)
const isMuted = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const showControls = ref(true)

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
  if (videoRef.value) {
    videoRef.value.addEventListener('play', () => { isPlaying.value = true })
    videoRef.value.addEventListener('pause', () => { isPlaying.value = false })
    videoRef.value.addEventListener('ended', () => { isPlaying.value = false })
  }
})
</script>

<template>
  <div
    class="relative group"
    @mousemove="showControlsTemporarily"
    @click="togglePlay"
  >
    <video
      ref="videoRef"
      :src="photo.fullUrl || photo.thumbnailUrl"
      :poster="photo.thumbnailUrl"
      class="max-w-full max-h-[90vh]"
      playsinline
      @timeupdate="handleTimeUpdate"
      @loadedmetadata="handleLoadedMetadata"
    />

    <!-- Play overlay -->
    <div
      v-if="!isPlaying"
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
        v-show="showControls || !isPlaying"
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
              class="text-white hover:text-white/80 transition-colors"
            >
              <Pause v-if="isPlaying" class="w-6 h-6" />
              <Play v-else class="w-6 h-6" />
            </button>

            <button
              @click="toggleMute"
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
            class="text-white hover:text-white/80 transition-colors"
          >
            <Maximize class="w-5 h-5" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
