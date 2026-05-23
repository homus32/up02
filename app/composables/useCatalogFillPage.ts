import type { Ref } from 'vue'
import type { Anime } from '~/types/anime'
import { ref, computed, onMounted } from 'vue'
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
 * @param hasMore   — Whether the API has more pages (from useCatalogPagination)
 * @param loadMore  — Fetches the next API page and appends to allAnimes
 */
export function useCatalogFillPage(
  allAnimes: Ref<Anime[]>,
  hasMore: Ref<boolean>,
  loadMore: () => Promise<void>,
) {
  // SSR-safe defaults: 6 cols × 5 rows = 30 cards at 1280px
  const cols = ref(6)
  const displayLimit = ref(cols.value * TARGET_ROWS)

  const isMobile = useMediaQuery('(max-width: 767px)')

  // Calculate display limit once on mount
  onMounted(() => {
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
  })

  // Always shows complete rows only — never an incomplete last row
  const visibleAnimes = computed(() => {
    const total = allAnimes.value.length
    const limit = displayLimit.value
    const showCount = Math.min(total, limit)
    const completeRows = Math.max(1, Math.floor(showCount / cols.value))
    return allAnimes.value.slice(0, completeRows * cols.value)
  })

  // Show Load More button when there are more complete rows to show
  // or the API has more pages
  const canLoadMore = computed(() => {
    const total = allAnimes.value.length
    const completeRowCards = Math.max(cols.value, Math.floor(total / cols.value) * cols.value)
    return displayLimit.value < completeRowCards || hasMore.value
  })

  // Load More: adds one row (cols cards), fetches API if needed
  function loadMoreWithFill() {
    displayLimit.value += cols.value
    if (displayLimit.value > allAnimes.value.length) {
      loadMore()
    }
  }

  return { displayLimit, visibleAnimes, cols, canLoadMore, loadMoreWithFill }
}
