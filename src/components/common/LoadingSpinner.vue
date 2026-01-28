<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md' | 'lg'
}>()
</script>

<template>
  <div class="flex items-center justify-center">
    <div
      class="animate-spin rounded-full border-2 border-apple-gray-200 border-t-apple-blue"
      :class="{
        'h-4 w-4': size === 'sm',
        'h-8 w-8': size === 'md' || !size,
        'h-12 w-12': size === 'lg',
      }"
    />
  </div>
</template>
