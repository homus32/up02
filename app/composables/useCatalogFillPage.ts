import type { Ref } from 'vue'
import type { Anime } from '~/types/anime'
import { ref, computed, onMounted } from 'vue'
import { useMediaQuery } from '@vueuse/core'

/**
 * Dynamically calculates how many anime cards fit in the visible viewport
 * on the catalog page. SSR-safe — uses a default of 12 cards for initial render.
 *
 * On mount (client only), measures:
 *  - grid container width
 *  - header height + filters height
 *  - viewport height
 *  — and computes cols × rows to fill the page without scrolling.
 *
 * @param allAnimes — Ref of the full anime list (including loaded pages)
 * @returns displayLimit  — computed card count fitting the viewport
 *          visibleAnimes — sliced list (or full list when cap is disabled)
 *          cappedMode    — whether the slice cap is active
 *          disableCap    — call to remove the cap (e.g. on "Load More")
 */
export function useCatalogFillPage(allAnimes: Ref<Anime[]>) {
  // SSR-safe default: 12 cards (6 cols × 2 rows at 1280px@1080p)
  const displayLimit = ref(12)
  const cappedMode = ref(true)

  // useMediaQuery is SSR-safe — returns false on server, real value on client
  const isMobile = useMediaQuery('(max-width: 767px)')

  // Calculate display limit once on mount
  onMounted(() => {
    const grid = document.querySelector('.catalog-page__grid') as HTMLElement | null
    if (!grid) return

    const gridWidth = grid.getBoundingClientRect().width
    const minCardWidth = isMobile.value ? 140 : 180
    const gap = isMobile.value ? 12 : 20

    // How many columns fit?
    const cols = Math.max(1, Math.floor((gridWidth + gap) / (minCardWidth + gap)))

    // Estimate card height: poster (3:4 ratio) + body (~130px)
    const cardWidth = (gridWidth - (cols - 1) * gap) / cols
    const cardHeight = cardWidth * (4 / 3) + 130

    // Measure actual DOM heights for header and filters
    const headerEl = document.querySelector('.header') as HTMLElement | null
    const headerHeight = headerEl?.offsetHeight ?? 64

    const filtersEl = document.querySelector('.catalog-page__inner > :first-child') as HTMLElement | null
    const filtersHeight = filtersEl?.getBoundingClientRect().height ?? 48

    const pagePaddingTop = 24 // var(--space-6) ≈ 24px
    const availableHeight = window.innerHeight - headerHeight - filtersHeight - pagePaddingTop

    // How many rows fit? Use round (not floor) so partial rows count.
    // Minimum 2 rows to avoid looking empty.
    const idealRows = Math.round((availableHeight + gap) / (cardHeight + gap))
    const rows = Math.max(2, idealRows)

    displayLimit.value = cols * rows
  })

  // Computed that slices to displayLimit while capped
  const visibleAnimes = computed(() => {
    if (!cappedMode.value) return allAnimes.value
    return allAnimes.value.slice(0, displayLimit.value)
  })

  // Disable the cap — called by "Load More"
  function disableCap() {
    cappedMode.value = false
  }

  return { displayLimit, visibleAnimes, cappedMode, disableCap }
}
