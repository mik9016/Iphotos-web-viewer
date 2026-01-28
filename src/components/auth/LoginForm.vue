<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Mail, Lock, AlertCircle } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const localError = ref('')

async function handleSubmit() {
  if (!email.value || !password.value) {
    localError.value = 'Please enter your email and password'
    return
  }

  localError.value = ''
  const success = await authStore.login(email.value, password.value)

  if (success) {
    router.push('/')
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Email -->
    <div>
      <label for="email" class="block text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300 mb-2">
        Email
      </label>
      <div class="relative">
        <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-apple-gray-400" />
        <input
          id="email"
          v-model="email"
          type="email"
          autocomplete="email"
          class="input pl-10"
          placeholder="you@example.com"
          required
        />
      </div>
    </div>

    <!-- Password -->
    <div>
      <label for="password" class="block text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300 mb-2">
        Password
      </label>
      <div class="relative">
        <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-apple-gray-400" />
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          class="input pl-10"
          placeholder="Enter your password"
          required
        />
      </div>
    </div>

    <!-- Error -->
    <div v-if="localError || authStore.error" class="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
      <AlertCircle class="w-5 h-5 flex-shrink-0" />
      <span>{{ localError || authStore.error }}</span>
    </div>

    <!-- Submit -->
    <button
      type="submit"
      :disabled="authStore.loading"
      class="btn btn-primary w-full h-12 text-base"
    >
      <LoadingSpinner v-if="authStore.loading" size="sm" />
      <span v-else>Sign in</span>
    </button>
  </form>
</template>
