<script setup lang="ts">
import { Camera } from 'lucide-vue-next'
import LoginForm from '@/components/auth/LoginForm.vue'
</script>

<template>
  <div class="min-h-screen bg-apple-gray-50 dark:bg-apple-gray-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Camera class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-apple-gray-900 dark:text-white">
          iPhotos
        </h1>
        <p class="mt-2 text-apple-gray-500 dark:text-apple-gray-400">
          Sign in to access your photos
        </p>
      </div>

      <!-- Login form -->
      <div class="card p-6 sm:p-8">
        <LoginForm />
      </div>

      <!-- Footer -->
      <p class="mt-6 text-center text-sm text-apple-gray-500">
        Your photos are securely stored in the cloud
      </p>
    </div>
  </div>
</template>
