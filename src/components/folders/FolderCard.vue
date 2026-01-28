<script setup lang="ts">
import { ref } from 'vue'
import { Folder as FolderIcon, Image as ImageIcon } from 'lucide-vue-next'
import type { Folder } from '@/types'

defineProps<{
  folder: Folder
}>()

defineEmits<{
  click: [folder: Folder]
}>()

const imageLoaded = ref(false)
const imageError = ref(false)
</script>

<template>
  <div
    class="group cursor-pointer"
    @click="$emit('click', folder)"
  >
    <!-- Cover image -->
    <div class="aspect-[4/3] bg-apple-gray-100 dark:bg-apple-gray-800 rounded-xl overflow-hidden mb-2 transition-transform group-hover:scale-[1.02] group-active:scale-[0.98]">
      <img
        v-if="folder.coverPhoto?.thumbnailUrl && !imageError"
        :src="folder.coverPhoto.thumbnailUrl"
        :alt="folder.label"
        class="w-full h-full object-cover transition-opacity duration-200"
        :class="{ 'opacity-0': !imageLoaded }"
        @load="imageLoaded = true"
        @error="imageError = true"
        loading="lazy"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center"
      >
        <FolderIcon class="w-12 h-12 text-apple-gray-400" />
      </div>
    </div>

    <!-- Label -->
    <h3 class="font-semibold text-apple-gray-900 dark:text-white truncate">
      {{ folder.label }}
    </h3>

    <!-- Count -->
    <p class="text-sm text-apple-gray-500 flex items-center gap-1">
      <ImageIcon class="w-4 h-4" />
      {{ folder.count }} {{ folder.count === 1 ? 'item' : 'items' }}
    </p>
  </div>
</template>
