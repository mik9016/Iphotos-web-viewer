<script setup lang="ts">
import { ref } from 'vue'
import { Play, Check, Image as ImageIcon } from 'lucide-vue-next'
import { usePhotosStore } from '@/stores/photos'
import type { PhotoWithUrl } from '@/types'
import { formatDuration } from '@/utils/date'

const props = defineProps<{
  photo: PhotoWithUrl
}>()

const emit = defineEmits<{
  click: [photo: PhotoWithUrl]
}>()

const photosStore = usePhotosStore()
const imageLoaded = ref(false)
const imageError = ref(false)

const isSelected = computed(() => photosStore.selectedPhotos.has(props.photo.id))

function handleClick(e: MouseEvent) {
  if (e.shiftKey || e.metaKey || e.ctrlKey) {
    e.preventDefault()
    photosStore.toggleSelection(props.photo.id)
  } else {
    emit('click', props.photo)
  }
}

function handleSelect(e: Event) {
  e.stopPropagation()
  photosStore.toggleSelection(props.photo.id)
}

import { computed } from 'vue'
</script>

<template>
  <div
    class="group relative aspect-square bg-apple-gray-100 dark:bg-apple-gray-800 rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
    :class="{ 'ring-2 ring-apple-blue ring-offset-2': isSelected }"
    @click="handleClick"
  >
    <!-- Thumbnail -->
    <img
      v-if="photo.thumbnailUrl && !imageError"
      :src="photo.thumbnailUrl"
      :alt="photo.filename"
      class="w-full h-full object-cover transition-opacity duration-200"
      :class="{ 'opacity-0': !imageLoaded }"
      @load="imageLoaded = true"
      @error="imageError = true"
      loading="lazy"
    />

    <!-- Placeholder -->
    <div
      v-if="!imageLoaded || imageError"
      class="absolute inset-0 flex items-center justify-center"
    >
      <ImageIcon class="w-8 h-8 text-apple-gray-400" />
    </div>

    <!-- Video indicator -->
    <div
      v-if="photo.media_type === 'video'"
      class="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 text-white text-xs"
    >
      <Play class="w-3 h-3" />
      <span v-if="photo.duration">{{ formatDuration(photo.duration) }}</span>
    </div>

    <!-- Selection checkbox -->
    <button
      class="absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
      :class="isSelected
        ? 'bg-apple-blue border-apple-blue text-white'
        : 'bg-white/80 border-apple-gray-300 opacity-0 group-hover:opacity-100'"
      @click="handleSelect"
    >
      <Check v-if="isSelected" class="w-4 h-4" />
    </button>

    <!-- Hover overlay -->
    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
  </div>
</template>
