import { computed, readonly } from 'vue'
import { StorageSerializers, useStorage } from '@vueuse/core'
import type { UserProfile } from '~/types/anime'

const AUTH_KEY = 'anime_user'

export function useAuth() {
  const user = useStorage<UserProfile | null>(AUTH_KEY, null, undefined, {
    serializer: StorageSerializers.object,
  })

  const isLoggedIn = computed(() => user.value !== null)
  const username = computed(() => user.value?.username ?? null)

  function login(username: string) {
    user.value = {
      username,
      loggedInAt: new Date().toISOString(),
    }
  }

  function logout() {
    user.value = null
  }

  return {
    user: readonly(user),
    isLoggedIn,
    username,
    login,
    logout,
  }
}
