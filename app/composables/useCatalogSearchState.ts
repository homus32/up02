import type { SearchParams } from '~/types/anime'

export function useCatalogSearchState() {
  const route = useRoute()
  const router = useRouter()

  // === URL-driven search state ===
  const searchQuery = ref((route.query.search as string) || '')
  const selectedKind = ref((route.query.kind as string) || '')
  const selectedStatus = ref((route.query.status as string) || '')
  const selectedSeason = ref((route.query.season as string) || '')
  const selectedScore = ref(Number(route.query.score) || 0)
  const currentSort = ref((route.query.order as string) || 'ranked')

  // === Build search params ===
  const baseParams = computed<SearchParams>(() => ({
    query: searchQuery.value || undefined,
    kind: (selectedKind.value as SearchParams['kind']) || undefined,
    status: (selectedStatus.value as SearchParams['status']) || undefined,
    season: selectedSeason.value || undefined,
    score: selectedScore.value || undefined,
    order: (currentSort.value as SearchParams['order']) || 'ranked',
    limit: 20,
  }))

  // === V-model bridge for CatalogFilters ===
  const filterState = computed({
    get: () => ({ kind: selectedKind.value, status: selectedStatus.value, season: selectedSeason.value, sort: currentSort.value }),
    set: (val: { kind: string; status: string; season: string; sort: string }) => {
      selectedKind.value = val.kind
      selectedStatus.value = val.status
      selectedSeason.value = val.season
      currentSort.value = val.sort
    },
  })

  // === Sync URL → state when back/forward navigation ===
  watch(() => route.query.search, (val) => { searchQuery.value = (val as string) || '' })

  function updateUrl() {
    router.replace({
      query: {
        search: searchQuery.value || undefined,
        kind: selectedKind.value || undefined,
        status: selectedStatus.value || undefined,
        season: selectedSeason.value || undefined,
        score: selectedScore.value || undefined,
        order: currentSort.value || undefined,
      },
    })
  }

  function onFilterChange() {
    updateUrl()
  }

  return {
    searchQuery,
    selectedKind,
    selectedStatus,
    selectedSeason,
    selectedScore,
    currentSort,
    baseParams,
    filterState,
    updateUrl,
    onFilterChange,
  }
}
