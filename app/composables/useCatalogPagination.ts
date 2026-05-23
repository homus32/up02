import type { Ref } from 'vue'
import type { Anime, SearchParams } from '~/types/anime'

interface PaginatedResponse {
  data: Anime[]
  meta: {
    total: number
    page: number
    limit: number
  }
}

/**
 * Load-more pagination composable.
 * Extracts the append-to-list pattern from index.vue into a reusable unit.
 *
 * @param data      — Ref from useAsyncData (SSR-first page). When data changes
 *                    (new search/filter), accumulated extra pages are reset.
 * @param baseParams — Computed or static SearchParams (without page). Used to
 *                     construct the next-page request inside loadMore().
 * @param searchApi  — Injected search function (inversion of control). Receives
 *                     full SearchParams (including page) and returns a paginated response.
 *
 * @returns allAnimes    — Combined reactive list: SSR data + extra loaded pages
 *          hasMore      — Whether more pages are available
 *          loadingMore  — Loading flag for the load-more operation
 *          loadMore     — Action to fetch the next page and append it
 */
export function useCatalogPagination(
  data: Ref<PaginatedResponse | null>,
  baseParams: Ref<SearchParams>,
  searchApi: (params: SearchParams) => Promise<PaginatedResponse>,
  pageSize: number = 20,
) {
  const currentPage = ref(1)
  const loadingMore = ref(false)
  const additionalAnimes = ref<Anime[]>([])
  const _lastPageFull = ref(true)

  const allAnimes = computed(() => [
    ...(data.value?.data ?? []),
    ...additionalAnimes.value,
  ])

  const hasMore = computed(() =>
    currentPage.value > 1
      ? _lastPageFull.value
      : (data.value?.data?.length ?? 0) >= pageSize,
  )

  // Reset accumulated results when upstream data changes (new search/filter)
  watch(data, () => {
    additionalAnimes.value = []
    currentPage.value = 1
  })

  async function loadMore() {
    if (loadingMore.value || !hasMore.value) return
    loadingMore.value = true
    try {
      const nextPage = currentPage.value + 1
      const result = await searchApi({ ...baseParams.value, page: nextPage })
      additionalAnimes.value = [...additionalAnimes.value, ...result.data]
      _lastPageFull.value = result.data.length >= pageSize
      currentPage.value = nextPage
    } catch {
      // Silently fail — button still clickable for retry
    } finally {
      loadingMore.value = false
    }
  }

  return { allAnimes, hasMore, loadingMore, loadMore }
}
