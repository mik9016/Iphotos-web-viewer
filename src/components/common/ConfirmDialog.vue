<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning'
  loading?: boolean
}>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'danger',
  loading: false,
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && !props.loading) {
    emit('cancel')
  }
}

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
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/50 backdrop-blur-sm"
        @click="!loading && emit('cancel')"
      />

      <!-- Dialog -->
      <div class="relative bg-white dark:bg-apple-gray-800 rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-apple-gray-200 dark:border-apple-gray-700">
          <h3 class="text-lg font-semibold text-apple-gray-900 dark:text-white">
            {{ title }}
          </h3>
          <button
            v-if="!loading"
            @click="emit('cancel')"
            class="p-1 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700 transition-colors"
          >
            <X class="w-5 h-5 text-apple-gray-500" />
          </button>
        </div>

        <!-- Content -->
        <div class="p-4">
          <p class="text-apple-gray-600 dark:text-apple-gray-300">
            {{ message }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 p-4 bg-apple-gray-50 dark:bg-apple-gray-900">
          <button
            @click="emit('cancel')"
            :disabled="loading"
            class="px-4 py-2 rounded-lg text-sm font-medium bg-apple-gray-200 dark:bg-apple-gray-700 text-apple-gray-700 dark:text-apple-gray-300 hover:bg-apple-gray-300 dark:hover:bg-apple-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ cancelText }}
          </button>
          <button
            @click="emit('confirm')"
            :disabled="loading"
            class="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            :class="{
              'bg-red-500 hover:bg-red-600': variant === 'danger',
              'bg-yellow-500 hover:bg-yellow-600': variant === 'warning',
            }"
          >
            <span v-if="loading" class="flex items-center gap-2">
              <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Deleting...
            </span>
            <span v-else>{{ confirmText }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
