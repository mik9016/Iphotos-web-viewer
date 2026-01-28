import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSupabase } from '@/composables/useSupabase'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const supabase = useSupabase()

  const user = ref<User | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)
  const initialized = ref(false)

  const isAuthenticated = computed(() => !!user.value)

  async function initialize() {
    if (initialized.value) return

    loading.value = true
    error.value = null

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        throw sessionError
      }

      if (session?.user) {
        user.value = {
          id: session.user.id,
          email: session.user.email || '',
          created_at: session.user.created_at,
        }
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          user.value = {
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at,
          }
        } else if (event === 'SIGNED_OUT') {
          user.value = null
        } else if (event === 'TOKEN_REFRESHED') {
          // Token refreshed automatically by Supabase
        }
      })
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to initialize auth'
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) {
        throw loginError
      }

      if (data.user) {
        user.value = {
          id: data.user.id,
          email: data.user.email || '',
          created_at: data.user.created_at,
        }
      }

      return true
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Login failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true
    error.value = null

    try {
      const { error: logoutError } = await supabase.auth.signOut()

      if (logoutError) {
        throw logoutError
      }

      user.value = null
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Logout failed'
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    initialized,
    initialize,
    login,
    logout,
    clearError,
  }
})
