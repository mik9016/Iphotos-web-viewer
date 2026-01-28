<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { usePhotosStore } from '@/stores/photos'
import FolderCard from './FolderCard.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { Folder } from '@/types'

const props = defineProps<{
  type: 'year' | 'month' | 'city' | 'country'
}>()

const emit = defineEmits<{
  selectFolder: [folder: Folder]
}>()

const photosStore = usePhotosStore()
const folders = ref<Folder[]>([])
const loading = ref(true)

async function loadFolders() {
  loading.value = true
  folders.value = await photosStore.getFolders(props.type)
  loading.value = false
}

watch(() => props.type, loadFolders)

onMounted(loadFolders)
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Empty state -->
    <EmptyState
      v-else-if="folders.length === 0"
      title="No folders"
      description="Your photos will be organized here."
    />

    <!-- Folder grid -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      <FolderCard
        v-for="folder in folders"
        :key="folder.value"
        :folder="folder"
        @click="emit('selectFolder', folder)"
      />
    </div>
  </div>
</template>
