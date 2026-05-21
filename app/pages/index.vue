<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import type { Anime, SearchParams, UserListStatus } from '~/types/anime'
import { USER_LIST_STATUSES, USER_LIST_LABELS } from '~/types/anime'

const route = useRoute()
const router = useRouter()

// === URL-driven search state ===
const searchQuery = ref((route.query.search as string) || '')
const selectedKind = ref((route.query.kind as string) || '')
const selectedStatus = ref((route.query.status as string) || '')
const selectedSeason = ref((route.query.season as string) || '')
const selectedScore = ref(Number(route.query.score) || 0)
const currentSort = ref((route.query.order as string) || 'ranked')
const currentPage = ref(Number(route.query.page) || 1)
const isMobile = ref(false)

// ===== Filters =====
const kindOptions = [
  { label: 'Все', value: '' },
  { label: 'TV', value: 'tv' },
  { label: 'Movie', value: 'movie' },
  { label: 'OVA', value: 'ova' },
  { label: 'ONA', value: 'ona' },
  { label: 'Special', value: 'special' },
]

const statusOptions = [
  { label: 'Все', value: '' },
  { label: 'Онгоинг', value: 'ongoing' },
  { label: 'Вышел', value: 'released' },
  { label: 'Анонс', value: 'anons' },
]

const sortOptions = [
  { label: 'По рейтингу', value: 'ranked' },
  { label: 'По популярности', value: 'popularity' },
  { label: 'По названию', value: 'name' },
  { label: 'По дате', value: 'aired_on' },
  { label: 'По эпизодам', value: 'episodes' },
]

const seasonOptions = [
  { label: 'Все сезоны', value: '' },
  { label: 'Зима 2025', value: 'winter_2025' },
  { label: 'Весна 2025', value: 'spring_2025' },
  { label: 'Лето 2025', value: 'summer_2025' },
  { label: 'Осень 2025', value: 'autumn_2025' },
  { label: 'Зима 2024', value: 'winter_2024' },
  { label: 'Весна 2024', value: 'spring_2024' },
  { label: 'Лето 2024', value: 'summer_2024' },
  { label: 'Осень 2024', value: 'autumn_2024' },
]

// === Build search params from reactive state ===
const searchParams = computed<SearchParams>(() => ({
  query: searchQuery.value || undefined,
  kind: (selectedKind.value as SearchParams['kind']) || undefined,
  status: (selectedStatus.value as SearchParams['status']) || undefined,
  season: selectedSeason.value || undefined,
  score: selectedScore.value || undefined,
  order: (currentSort.value as SearchParams['order']) || 'ranked',
  page: currentPage.value,
  limit: 20,
}))

// === Data fetching ===
const { data, status, error, refresh } = useAsyncData<{ data: Anime[]; meta: { total: number; page: number; limit: number } }>(
  'catalog',
  () => useAnimeApi().search(searchParams.value),
  { watch: [searchParams] },
)

// === URL sync (debounced for search) ===
const debouncedSearch = useDebounceFn((q: string) => {
  router.replace({
    query: {
      ...route.query,
      search: q || undefined,
      page: undefined,
    },
  })
  currentPage.value = 1
}, 400)

function onSearchInput() {
  debouncedSearch(searchQuery.value)
}

function updateUrl() {
  router.replace({
    query: {
      search: searchQuery.value || undefined,
      kind: selectedKind.value || undefined,
      status: selectedStatus.value || undefined,
      season: selectedSeason.value || undefined,
      score: selectedScore.value || undefined,
      order: currentSort.value || undefined,
      page: currentPage.value > 1 ? String(currentPage.value) : undefined,
    },
  })
}

function onPageChange(event: { page: number }) {
  currentPage.value = event.page + 1
  updateUrl()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function onFilterChange() {
  currentPage.value = 1
  updateUrl()
}

// === Anime kind label ===
function kindLabel(kind: string): string {
  const map: Record<string, string> = { tv: 'TV', movie: 'Movie', ova: 'OVA', ona: 'ONA', special: 'Special', music: 'Music' }
  return map[kind] || kind
}

function statusSeverity(status: string): 'info' | 'warn' | 'success' | undefined {
  if (status === 'anons') return 'info'
  if (status === 'ongoing') return 'warn'
  if (status === 'released') return 'success'
  return undefined
}

// === User lists ===
const { getStatus, isInList, addToList, removeFromList, getItem } = useUserLists()

function handleAddToList(anime: Anime, status: string) {
  addToList(String(anime.id), {
    status: status as UserListStatus,
    name: anime.name,
    russian: anime.russian,
    posterUrl: anime.poster?.mainUrl || null,
    score: 0,
    addedAt: Date.now(),
  })
}

function handleRemoveFromList(animeId: number) {
  removeFromList(String(animeId))
}

// === Hover popup ===
const popup = ref()
const selectedAnime = ref<Anime | null>(null)
const popupStatus = ref<UserListStatus>('planned')

function showPopup(event: Event, anime: Anime) {
  selectedAnime.value = anime
  if (!isMobile.value && popup.value) {
    popup.value.show(event)
  }
}

const dialogVisible = computed({
  get: () => isMobile.value && selectedAnime.value !== null,
  set: (val) => { if (!val) selectedAnime.value = null },
})

// === Init ===
onMounted(() => {
  isMobile.value = window.innerWidth < 768
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 768
  })
})
</script>

<template>
  <div class="catalog-page">
    <div class="catalog-page__inner container">
      <!-- Filters -->
      <div class="catalog-page__filters">
        <div class="catalog-page__filter-group">
          <label class="catalog-page__filter-label">Тип</label>
          <SelectButton
            v-model="selectedKind"
            :options="kindOptions"
            option-label="label"
            option-value="value"
            :allow-empty="false"
            class="catalog-page__filter-select"
            @change="onFilterChange"
          />
        </div>

        <div class="catalog-page__filter-group">
          <label class="catalog-page__filter-label">Статус</label>
          <SelectButton
            v-model="selectedStatus"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            :allow-empty="false"
            class="catalog-page__filter-select"
            @change="onFilterChange"
          />
        </div>

        <div class="catalog-page__filter-group catalog-page__filter-group_small">
          <label class="catalog-page__filter-label">Сезон</label>
          <Select
            v-model="selectedSeason"
            :options="seasonOptions"
            option-label="label"
            option-value="value"
            class="catalog-page__filter-select"
            @change="onFilterChange"
          />
        </div>

        <div class="catalog-page__filter-group catalog-page__filter-group_small">
          <label class="catalog-page__filter-label">Сортировка</label>
          <Select
            v-model="currentSort"
            :options="sortOptions"
            option-label="label"
            option-value="value"
            class="catalog-page__filter-select"
            @change="onFilterChange"
          />
        </div>
      </div>

      <!-- Loading -->
      <div v-if="status === 'pending'" class="catalog-page__grid">
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
          {{ (error as any)?.data?.statusMessage || 'Не удалось загрузить данные. Попробуйте позже.' }}
        </p>
        <Button label="Повторить" icon="pi pi-refresh" @click="refresh()" />
      </div>

      <!-- Empty -->
      <div v-else-if="!data?.data?.length" class="catalog-page__state">
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
          <div
            v-for="anime in data.data"
            :key="anime.id"
            class="catalog-page__card card"
            @mouseenter="showPopup($event, anime)"
            @click="isMobile && (selectedAnime = anime)"
          >
            <!-- Card poster -->
            <NuxtLink :to="`/anime/${anime.id}`" class="card__link">
              <div class="card__poster-wrapper">
                <img
                  :src="anime.poster?.mainUrl || '/placeholder-poster.svg'"
                  :alt="anime.name"
                  class="card__poster"
                  loading="lazy"
                />
                <Tag
                  :value="kindLabel(anime.kind)"
                  class="card__kind-badge"
                  severity="secondary"
                />
              </div>
            </NuxtLink>

            <!-- Card body -->
            <div class="card__body">
              <NuxtLink :to="`/anime/${anime.id}`" class="card__title-link">
                <h3 class="card__title">{{ anime.russian || anime.name }}</h3>
              </NuxtLink>

              <div class="card__meta">
                <Tag
                  v-if="anime.status"
                  :value="anime.status === 'ongoing' ? 'Онгоинг' : anime.status === 'released' ? 'Вышел' : 'Анонс'"
                  :severity="statusSeverity(anime.status)"
                  class="card__status-badge"
                />
                <span v-if="anime.score" class="card__score">
                  <i class="pi pi-star" /> {{ anime.score.toFixed(1) }}
                </span>
              </div>

              <!-- Add to list button -->
              <ClientOnly>
                <div class="card__actions">
                  <template v-if="isInList(String(anime.id))">
                    <Tag
                      :value="USER_LIST_LABELS[getStatus(String(anime.id))!]"
                      :class="`tag-${getStatus(String(anime.id))}`"
                      class="card__list-badge"
                    />
                    <Button
                      icon="pi pi-trash"
                      severity="danger"
                      text
                      rounded
                      size="small"
                      @click="handleRemoveFromList(anime.id)"
                    />
                  </template>
                  <Button
                    v-else
                    label="В список"
                    icon="pi pi-plus"
                    size="small"
                    outlined
                    @click="handleAddToList(anime, 'planned')"
                  />
                </div>
              </ClientOnly>
            </div>
          </div>
        </div>

        <!-- Paginator -->
        <div class="catalog-page__paginator">
          <Paginator
            :rows="20"
            :total-records="data?.meta?.total || 0"
            :page="currentPage - 1"
            @page="onPageChange"
          />
        </div>
      </template>
    </div>

    <!-- Desktop OverlayPanel popup -->
    <ClientOnly>
      <OverlayPanel
        ref="popup"
        :breakpoints="{ '768px': '0px' }"
        class="catalog-page__popup"
      >
        <template v-if="selectedAnime">
          <div class="popup">
            <div class="popup__header">
              <h4 class="popup__title">{{ selectedAnime.russian || selectedAnime.name }}</h4>
              <span v-if="selectedAnime.name !== selectedAnime.russian" class="popup__alt-title">
                {{ selectedAnime.name }}
              </span>
            </div>

            <div class="popup__meta">
              <span v-if="selectedAnime.airedOn?.year" class="popup__meta-item">
                {{ selectedAnime.airedOn.year }} г.
              </span>
              <span v-if="selectedAnime.episodes" class="popup__meta-item">
                {{ selectedAnime.episodesAired }}/{{ selectedAnime.episodes }} эп.
              </span>
              <span v-if="selectedAnime.duration" class="popup__meta-item">
                {{ selectedAnime.duration }} мин.
              </span>
              <Tag
                :value="kindLabel(selectedAnime.kind)"
                severity="secondary"
                class="popup__kind"
              />
            </div>

            <div v-if="selectedAnime.genres?.length" class="popup__genres">
              <Chip
                v-for="genre in selectedAnime.genres.slice(0, 4)"
                :key="genre.id"
                :label="genre.russian || genre.name"
                class="popup__genre"
              />
            </div>

            <p v-if="selectedAnime.description" class="popup__description">
              {{ selectedAnime.description.slice(0, 200) }}{{ selectedAnime.description.length > 200 ? '...' : '' }}
            </p>

            <div class="popup__actions">
              <Button
                :label="isInList(String(selectedAnime.id)) ? 'В списке' : 'В список'"
                :icon="isInList(String(selectedAnime.id)) ? 'pi pi-check' : 'pi pi-plus'"
                size="small"
                @click="selectedAnime && handleAddToList(selectedAnime, 'planned')"
              />
              <Button
                label="Подробнее"
                icon="pi pi-arrow-right"
                size="small"
                severity="secondary"
                @click="navigateTo(`/anime/${selectedAnime.id}`)"
              />
            </div>
          </div>
        </template>
      </OverlayPanel>
    </ClientOnly>

    <!-- Mobile Dialog popup -->
    <Dialog
      v-if="isMobile && selectedAnime"
      v-model:visible="dialogVisible"
      position="bottom"
      :style="{ width: '100%', maxHeight: '80vh' }"
      :dismissable-mask="true"
      :closable="true"
      header=" "
      class="catalog-page__dialog"
    >
      <template v-if="selectedAnime">
        <div class="popup">
          <div class="popup__header">
            <h4 class="popup__title">{{ selectedAnime.russian || selectedAnime.name }}</h4>
            <span v-if="selectedAnime.name !== selectedAnime.russian" class="popup__alt-title">
              {{ selectedAnime.name }}
            </span>
          </div>

          <div class="popup__meta">
            <span v-if="selectedAnime.airedOn?.year" class="popup__meta-item">
              {{ selectedAnime.airedOn.year }} г.
            </span>
            <span v-if="selectedAnime.episodes" class="popup__meta-item">
              {{ selectedAnime.episodesAired }}/{{ selectedAnime.episodes }} эп.
            </span>
            <Tag
              :value="kindLabel(selectedAnime.kind)"
              severity="secondary"
              class="popup__kind"
            />
          </div>

          <div v-if="selectedAnime.genres?.length" class="popup__genres">
            <Chip
              v-for="genre in selectedAnime.genres.slice(0, 4)"
              :key="genre.id"
              :label="genre.russian || genre.name"
              class="popup__genre"
            />
          </div>

          <p v-if="selectedAnime.description" class="popup__description">
            {{ selectedAnime.description.slice(0, 150) }}{{ selectedAnime.description.length > 150 ? '...' : '' }}
          </p>

          <div class="popup__actions">
            <Button
              :label="isInList(String(selectedAnime.id)) ? 'В списке' : 'В список'"
              :icon="isInList(String(selectedAnime.id)) ? 'pi pi-check' : 'pi pi-plus'"
              @click="selectedAnime && handleAddToList(selectedAnime, 'planned')"
            />
            <Button
              label="Подробнее"
              icon="pi pi-arrow-right"
              severity="secondary"
              @click="navigateTo(`/anime/${selectedAnime.id}`)"
            />
          </div>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.catalog-page__inner {
  padding-top: var(--space-6);
  padding-bottom: var(--space-12);
}

/* Filters bar */
.catalog-page__filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
  align-items: flex-end;
}

.catalog-page__filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.catalog-page__filter-group_small {
  min-width: 140px;
}

.catalog-page__filter-label {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Grid */
.catalog-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-5);
}

/* Card */
.catalog-page__card {
  background: var(--bg-card);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  transition: all var(--transition-normal);
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.catalog-page__card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg), var(--shadow-cyan);
}

.card__poster-wrapper {
  position: relative;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: var(--bg-surface);
}

.card__poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-normal);
}

.catalog-page__card:hover .card__poster {
  transform: scale(1.05);
}

.card__kind-badge {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  font-size: var(--text-xs);
}

.card__body {
  padding: var(--space-3);
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.card__title-link {
  text-decoration: none;
  color: inherit;
}

.card__title-link:hover {
  text-decoration: none;
}

.card__title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  line-height: var(--leading-tight);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card__meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.card__score {
  font-size: var(--text-xs);
  color: var(--accent-amber);
  display: flex;
  align-items: center;
  gap: 2px;
}

.card__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: auto;
  padding-top: var(--space-2);
}

.card__list-badge {
  font-size: var(--text-xs);
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

/* Paginator */
.catalog-page__paginator {
  margin-top: var(--space-8);
  display: flex;
  justify-content: center;
}

/* OverlayPanel / Dialog popup */
.popup {
  padding: var(--space-1);
  max-width: 320px;
}

.popup__header {
  margin-bottom: var(--space-3);
}

.popup__title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.popup__alt-title {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  display: block;
  margin-top: 2px;
}

.popup__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  margin-bottom: var(--space-3);
}

.popup__meta-item {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.popup__genres {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-bottom: var(--space-3);
}

.popup__genre {
  font-size: var(--text-xs) !important;
}

.popup__description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-4);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.popup__actions {
  display: flex;
  gap: var(--space-2);
}

/* Mobile */
@media (max-width: 768px) {
  .catalog-page__filters {
    flex-direction: column;
    gap: var(--space-3);
  }

  .catalog-page__filter-group_small {
    min-width: auto;
  }

  .catalog-page__grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--space-3);
  }

  .popup {
    max-width: 100%;
  }
}
</style>
