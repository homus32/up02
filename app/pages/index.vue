<script setup lang="ts">
import type { Anime, UserListStatus } from '~/types/anime'

const router = useRouter()
const { baseParams, filterState, onFilterChange } = useCatalogSearchState()
const api = useAnimeApi()

const { data, status, error, refresh } = useAsyncData(
  'catalog',
  () => api.search({ ...baseParams.value, page: 1 }),
  { watch: [baseParams] },
)

const { allAnimes, hasMore, loadingMore, loadMore } = useCatalogPagination(
  data, baseParams, (p) => api.search(p), 50,
)

const { visibleAnimes, displayLimit, canLoadMore, loadMoreWithFill } = useCatalogFillPage(
  allAnimes, data, hasMore, loadMore,
)

// === User lists ===
const { getStatus, isInList, addToList, removeFromList } = useUserLists()

function handleAddToList(anime: Anime, status: UserListStatus) {
  addToList(String(anime.id), {
    status, name: anime.name, russian: anime.russian,
    posterUrl: anime.poster?.mainUrl || null, score: 0, addedAt: Date.now(),
  })
}
function handleRemoveFromList(animeId: string) { removeFromList(String(animeId)) }
function handlePopupAddToList(animeId: string, status: UserListStatus) {
  const a = selectedAnime.value
  if (!a) return
  addToList(animeId, {
    status, name: a.name, russian: a.russian,
    posterUrl: a.poster?.mainUrl || null, score: 0, addedAt: Date.now(),
  })
}

// === Hover popup ===
const popupRef = ref()
const selectedAnime = ref<Anime | null>(null)
function showPopup(event: Event, anime: Anime) {
  selectedAnime.value = anime
  popupRef.value?.show(event)
}
function onPopupHide() { selectedAnime.value = null }
</script>

<template>
  <div class="catalog-page">
    <div class="catalog-page__inner container">
      <!-- Filters -->
      <CatalogFilters v-model="filterState" @change="onFilterChange" />

      <!-- Loading -->
      <SkeletonCatalogGrid
        v-if="allAnimes.length === 0 && status === 'pending'"
        :count="displayLimit"
      />

      <!-- Error -->
      <ErrorState
        v-else-if="status === 'error'"
        title="Ошибка загрузки"
        :message="error?.statusMessage || error?.message || 'Не удалось загрузить данные. Попробуйте позже.'"
        action-label="Повторить"
        @action="refresh()"
      />

      <!-- Empty -->
      <EmptyState
        v-else-if="allAnimes.length === 0"
        title="Ничего не найдено"
        message="Попробуйте изменить параметры поиска"
        action-label="Сбросить фильтры"
        @action="router.replace({ query: {} })"
      />

      <!-- Grid -->
      <template v-else>
        <div class="catalog-page__grid">
          <AnimeCard
            v-for="anime in visibleAnimes"
            :key="anime.id"
            :anime="anime"
            :list-status="getStatus(String(anime.id))"
            @preview="(e) => showPopup(e, anime)"
            @add-to-list="(status) => handleAddToList(anime, status)"
            @remove-from-list="handleRemoveFromList(anime.id)"
          />
        </div>

        <!-- Load More -->
        <div v-if="canLoadMore" class="catalog-page__load-more">
          <PButton
            label="Загрузить ещё"
            icon="pi pi-chevron-down"
            severity="secondary"
            outlined
            :loading="loadingMore"
            @click="loadMoreWithFill"
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
