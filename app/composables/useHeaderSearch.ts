import { watchDebounced } from '@vueuse/core'

export function useHeaderSearch() {
  const route = useRoute()
  const router = useRouter()

  const searchQuery = ref('')

  watchDebounced(
    searchQuery,
    () => {
      if (searchQuery.value.trim()) {
        router.push({ path: '/', query: { search: searchQuery.value.trim() } })
      } else {
        router.push({ path: '/' })
      }
    },
    { debounce: 500, maxWait: 1000 },
  )

  function onSearchSubmit() {
    router.push({
      path: '/',
      query: searchQuery.value.trim() ? { search: searchQuery.value.trim() } : undefined,
    })
  }

  onMounted(() => {
    if (route.query.search) {
      searchQuery.value = route.query.search as string
    }
  })

  return {
    searchQuery,
    onSearchSubmit,
  }
}
