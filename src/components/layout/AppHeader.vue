<script setup lang="ts">
import { useRouter } from 'vue-router'
import { LogOut, Download, Grid3X3, FolderOpen } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { usePhotosStore } from '@/stores/photos'

const router = useRouter()
const authStore = useAuthStore()
const photosStore = usePhotosStore()

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

function goToDownload() {
  router.push('/download')
}
</script>

<template>
  <header class="sticky top-0 z-40 bg-white/80 dark:bg-apple-gray-900/80 backdrop-blur-xl border-b border-apple-gray-200/50 dark:border-apple-gray-700/50 safe-area-inset-top">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-14">
        <!-- Logo -->
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-semibold text-apple-gray-900 dark:text-white">
            iPhotos
          </h1>
        </div>

        <!-- Navigation -->
        <nav class="hidden sm:flex items-center gap-1">
          <router-link
            to="/"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="$route.name === 'home'
              ? 'bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-blue'
              : 'text-apple-gray-600 dark:text-apple-gray-300 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800'"
          >
            <Grid3X3 class="w-4 h-4" />
            Photos
          </router-link>
          <router-link
            to="/folders"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="$route.name === 'folders' || $route.name === 'folder-type'
              ? 'bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-blue'
              : 'text-apple-gray-600 dark:text-apple-gray-300 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800'"
          >
            <FolderOpen class="w-4 h-4" />
            Folders
          </router-link>
        </nav>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <button
            v-if="photosStore.selectionMode"
            @click="goToDownload"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-apple-blue text-white hover:bg-blue-600 transition-colors"
          >
            <Download class="w-4 h-4" />
            <span class="hidden sm:inline">Download ({{ photosStore.selectedPhotos.size }})</span>
          </button>

          <button
            @click="handleLogout"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-apple-gray-600 dark:text-apple-gray-300 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 transition-colors"
            title="Sign out"
          >
            <LogOut class="w-4 h-4" />
            <span class="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
