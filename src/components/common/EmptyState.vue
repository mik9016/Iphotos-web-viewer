<script setup lang="ts">
import { ImageOff } from 'lucide-vue-next'

defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div class="w-16 h-16 rounded-full bg-apple-gray-100 dark:bg-apple-gray-700 flex items-center justify-center mb-4">
      <ImageOff class="w-8 h-8 text-apple-gray-400" />
    </div>
    <h3 class="text-lg font-semibold text-apple-gray-900 dark:text-white mb-1">
      {{ title }}
    </h3>
    <p v-if="description" class="text-apple-gray-500 dark:text-apple-gray-400 max-w-sm">
      {{ description }}
    </p>
    <div class="mt-4">
      <slot />
    </div>
  </div>
</template>
