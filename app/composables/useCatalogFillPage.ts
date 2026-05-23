import type { Ref } from 'vue'
import type { Anime } from '~/types/anime'
import type { PaginatedResponse } from '~/composables/useCatalogPagination'
import { ref, computed, onMounted, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'

const TARGET_ROWS = 5

/**
 * Dynamically calculates how many anime cards fit in the visible viewport
 * on the catalog page. SSR-safe — uses a default of 30 cards (6 cols × 5 rows).
 *
 * Always shows complete rows only (displayLimit is always a multiple of cols),
 * so the last row never has empty grid cells.
 *
 * @param allAnimes — Ref of the full anime list (including loaded pages)
 * @param data      — Ref from useAsyncData (SSR-first page). Used to reset
 *                    displayLimit when filters change.
 * @param hasMore   — Whether the API has more pages (from useCatalogPagination)
 * @param loadMore  — Fetches the next API page and appends to allAnimes
 */
export function useCatalogFillPage(
  allAnimes: Ref<Anime[]>,
  data: Ref<PaginatedResponse | null>,
  hasMore: Ref<boolean>,
  loadMore: () => Promise<void>,
) {
  // SSR-safe defaults: 6 cols × 5 rows = 30 cards at 1280px
  const cols = ref(6)
  const displayLimit = ref(cols.value * TARGET_ROWS)

  const isMobile = useMediaQuery('(max-width: 767px)')

  function recalcLimit() {
    const grid = document.querySelector('.catalog-page__grid') as HTMLElement | null
    if (!grid) return

    const gridWidth = grid.getBoundingClientRect().width
    const minCardWidth = isMobile.value ? 140 : 180
    const gap = isMobile.value ? 12 : 20

    cols.value = Math.max(1, Math.floor((gridWidth + gap) / (minCardWidth + gap)))

    const target = cols.value * TARGET_ROWS
    const total = allAnimes.value.length
    const slots = Math.min(total, target)
    const completeRows = Math.max(1, Math.floor(slots / cols.value))
    displayLimit.value = completeRows * cols.value
  }

  // Calculate display limit once on mount
  onMounted(recalcLimit)

  // Reset displayLimit when upstream data changes (new search/filter)
  watch(data, () => {
    cols.value = 6
    displayLimit.value = cols.value * TARGET_ROWS
  })

  // Shows cards up to displayLimit
  const visibleAnimes = computed(() =>
    allAnimes.value.slice(0, displayLimit.value),
  )

  // Show Load More when there are more complete rows to show or API has more
  const canLoadMore = computed(() => {
    const total = allAnimes.value.length
    const totalCompleteCards = Math.max(cols.value, Math.floor(total / cols.value) * cols.value)
    return displayLimit.value < totalCompleteCards || hasMore.value
  })

  // Load More: adds TARGET_ROWS rows (cols × TARGET_ROWS cards)
  function loadMoreWithFill() {
    displayLimit.value += cols.value * TARGET_ROWS
    if (displayLimit.value > allAnimes.value.length) {
      loadMore()
    }
  }

  return { displayLimit, visibleAnimes, cols, canLoadMore, loadMoreWithFill }
}
