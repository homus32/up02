<script setup lang="ts">
import type { Anime, SearchParams, UserListStatus } from '~/types/anime'

const route = useRoute()
const router = useRouter()

// === URL-driven search state ===
const searchQuery = ref((route.query.search as string) || '')
const selectedKind = ref((route.query.kind as string) || '')
const selectedStatus = ref((route.query.status as string) || '')
const selectedSeason = ref((route.query.season as string) || '')
const selectedScore = ref(Number(route.query.score) || 0)
const currentSort = ref((route.query.order as string) || 'ranked')
const currentPage = ref(1)
const loadingMore = ref(false)
const additionalAnimes = ref<Anime[]>([])
const _lastPageFull = ref(true)

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
  set: (val) => { selectedKind.value = val.kind; selectedStatus.value = val.status; selectedSeason.value = val.season; currentSort.value = val.sort },
})

// === Data fetching (SSR, watches baseParams) ===
const { data, status, error, refresh } = useAsyncData<{ data: Anime[]; meta: { total: number; page: number; limit: number } }>(
  'catalog',
  () => useAnimeApi().search({ ...baseParams.value, page: 1 }),
  { watch: [baseParams] },
)

// Combine SSR data + Load More additions
const allAnimes = computed(() => [
  ...(data.value?.data ?? []),
  ...additionalAnimes.value,
])

const hasMore = computed(() => currentPage.value > 1 ? _lastPageFull.value : (data.value?.data?.length ?? 0) >= 20)

watch(data, () => { additionalAnimes.value = []; currentPage.value = 1 })

watch(() => route.query.search, (val) => { searchQuery.value = (val as string) || '' })

function updateUrl() {
  router.replace({ query: { search: searchQuery.value || undefined, kind: selectedKind.value || undefined, status: selectedStatus.value || undefined, season: selectedSeason.value || undefined, score: selectedScore.value || undefined, order: currentSort.value || undefined } })
}

function onFilterChange() {
  updateUrl()
}

// === Load more (append next page to additionalAnimes) ===
async function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  try {
    const nextPage = currentPage.value + 1
    const result = await useAnimeApi().search({ ...baseParams.value, page: nextPage })
    additionalAnimes.value = [...additionalAnimes.value, ...result.data]
    _lastPageFull.value = result.data.length === 20
    currentPage.value = nextPage
  } catch {
    // Silently fail — button still clickable for retry
  } finally {
    loadingMore.value = false
  }
}

// === User lists ===
const { getStatus, isInList, addToList, removeFromList } = useUserLists()

function handleAddToList(anime: Anime, status: UserListStatus) {
  addToList(String(anime.id), {
    status,
    name: anime.name,
    russian: anime.russian,
    posterUrl: anime.poster?.mainUrl || null,
    score: 0,
    addedAt: Date.now(),
  })
}

function handleRemoveFromList(animeId: string) {
  removeFromList(String(animeId))
}

function handlePopupAddToList(animeId: string, status: UserListStatus) {
  const a = selectedAnime.value
  if (!a) return
  addToList(animeId, { status, name: a.name, russian: a.russian, posterUrl: a.poster?.mainUrl || null, score: 0, addedAt: Date.now() })
}

// === Hover popup ===
const popupRef = ref()
const selectedAnime = ref<Anime | null>(null)

function showPopup(event: Event, anime: Anime) {
  selectedAnime.value = anime
  popupRef.value?.show(event)
}

function onPopupHide() {
  selectedAnime.value = null
}

// isMobile moved to AnimePreviewPopup — no longer needed in catalog page
</script>

<template>
  <div class="catalog-page">
    <div class="catalog-page__inner container">
      <!-- Filters -->
      <CatalogFilters v-model="filterState" @change="onFilterChange" />

      <!-- Loading -->
      <div v-if="allAnimes.length === 0 && status === 'pending'" class="catalog-page__grid">
        <div v-for="n in 12" :key="n" class="skeleton-card">
          <div class="skeleton-card__poster" />
          <div class="skeleton-card__body">
            <div class="skeleton-card__title" />
            <div class="skeleton-card__subtitle" />
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="status === 'error'" class="catalog-page__state">
        <i class="pi pi-exclamation-triangle catalog-page__state-icon" />
        <h2 class="catalog-page__state-title">Ошибка загрузки</h2>
        <p class="catalog-page__state-text">
          {{ error?.statusMessage || error?.message || 'Не удалось загрузить данные. Попробуйте позже.' }}
        </p>
        <Button label="Повторить" icon="pi pi-refresh" @click="refresh()" />
      </div>

      <!-- Empty -->
      <div v-else-if="allAnimes.length === 0" class="catalog-page__state">
        <i class="pi pi-search catalog-page__state-icon" />
        <h2 class="catalog-page__state-title">Ничего не найдено</h2>
        <p class="catalog-page__state-text">Попробуйте изменить параметры поиска</p>
        <Button
          label="Сбросить фильтры"
          icon="pi pi-filter-slash"
          severity="secondary"
          @click="router.replace({ query: {} })"
        />
      </div>

      <!-- Grid -->
      <template v-else>
        <div class="catalog-page__grid">
          <AnimeCard
            v-for="anime in allAnimes"
            :key="anime.id"
            :anime="anime"
            :list-status="getStatus(String(anime.id))"
            @preview="(e) => showPopup(e, anime)"
            @add-to-list="(status) => handleAddToList(anime, status)"
            @remove-from-list="handleRemoveFromList(anime.id)"
          />
        </div>

        <!-- Load More -->
        <div v-if="hasMore" class="catalog-page__load-more">
          <Button
            label="Загрузить ещё"
            icon="pi pi-chevron-down"
            severity="secondary"
            outlined
            :loading="loadingMore"
            @click="loadMore"
          />
        </div>
      </template>
    </div>

    <!-- Preview popup (OverlayPanel desktop / Dialog mobile) -->
    <AnimePreviewPopup
      ref="popupRef"
      :anime="selectedAnime"
      :is-in-list="selectedAnime ? isInList(String(selectedAnime.id)) : false"
      :list-status="selectedAnime ? getStatus(String(selectedAnime.id)) : null"
      @add-to-list="handlePopupAddToList"
      @navigate="(id) => navigateTo(`/anime/${id}`)"
      @hide="onPopupHide"
    />
  </div>
</template>

<style scoped>
.catalog-page__inner {
  padding-top: var(--space-6);
  padding-bottom: var(--space-12);
}

/* Grid */
.catalog-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-5);
}

/* State pages */
.catalog-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16) 0;
  text-align: center;
  gap: var(--space-4);
}

.catalog-page__state-icon {
  font-size: 3rem;
  color: var(--text-muted);
}

.catalog-page__state-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

.catalog-page__state-text {
  color: var(--text-secondary);
  font-size: var(--text-base);
  max-width: 400px;
}

/* Load More */
.catalog-page__load-more {
  margin-top: var(--space-8);
  display: flex;
  justify-content: center;
}

/* Mobile */
@media (max-width: 768px) {
  .catalog-page__grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--space-3);
  }
}
</style>
