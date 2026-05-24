<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import type { Anime, AnimeKind, AnimeStatus, UserListStatus, UserListItem } from '~/types/anime'
import { USER_LIST_LABELS } from '~/types/anime'

interface Props {
  status: UserListStatus
  items: Array<{ id: string } & UserListItem>
  total: number
  defaultOpen?: boolean
  hoverProps: {
    onCardEnter: (anime: Anime, event: MouseEvent) => void
    onCardLeave: () => void
  }
}

type RowItem = { id: string } & UserListItem

const props = withDefaults(defineProps<Props>(), {
  defaultOpen: true,
})

const isOpen = ref(props.defaultOpen)
const isMobile = useMediaQuery('(max-width: 767px)')

/** Whether there are items to display */
const hasItems = computed(() => props.total > 0)

function toggleOpen() {
  isOpen.value = !isOpen.value
}

function kindLabel(kind?: string): string {
  const map: Record<string, string> = {
    tv: 'TV',
    movie: 'Movie',
    ova: 'OVA',
    ona: 'ONA',
    special: 'Special',
    music: 'Music',
  }
  return map[kind ?? 'tv'] || '—'
}

function animeStatusSeverity(status?: string): string {
  if (status === 'anons') return 'info'
  if (status === 'ongoing') return 'warn'
  return 'secondary'
}

function animeStatusLabel(status?: string): string {
  if (status === 'anons') return 'Анонс'
  if (status === 'ongoing') return 'Онгоинг'
  if (status === 'released') return 'Вышел'
  return status ?? '—'
}

/** Construct a minimal Anime object from a row item for popup preview */
function makeAnime(data: RowItem): Anime {
  return {
    id: data.id,
    name: data.name,
    russian: data.russian,
    kind: (data.kind ?? 'tv') as AnimeKind,
    poster: data.posterUrl
      ? { mainUrl: data.posterUrl, originalUrl: data.posterUrl }
      : null,
    score: data.score,
    status: (data.animeStatus ?? 'released') as AnimeStatus,
    episodes: data.episodes ?? 0,
    episodesAired: data.episodes ?? 0,
    duration: 0,
    description: null,
    descriptionHtml: null,
    genres: [],
    studios: [],
    season: null,
    airedOn: data.airedOnYear ? { year: data.airedOnYear } : null,
  }
}

/** PT config for DataTable — minimal, hover handled via #body slot */
const pt: Record<string, unknown> = {}

function onCardMouseEnter(item: RowItem, event: MouseEvent) {
  props.hoverProps.onCardEnter(makeAnime(item), event)
}
</script>

<template>
  <div class="profile-section">
    <!-- Collapsible header -->
    <button
      class="profile-section__header"
      :class="{ 'profile-section__header_collapsed': !isOpen }"
      :aria-expanded="isOpen"
      @click="toggleOpen"
    >
      <i
        :class="['profile-section__chevron', 'pi', 'pi-chevron-down', { 'profile-section__chevron_collapsed': !isOpen }]"
      />
      <span class="profile-section__title">{{ USER_LIST_LABELS[status] }}</span>
      <PTag :value="total" severity="info" class="profile-section__count" />
    </button>

    <!-- Desktop PDataTable -->
    <PDataTable
      v-show="hasItems && !isMobile && isOpen"
      :value="items"
      dataKey="id"
      size="small"
      :rowHover="true"
      tableStyle="min-width: 100%"
      :pt="pt"
    >
      <PColumn header="#" #body="slotProps">
        {{ slotProps.index + 1 }}
      </PColumn>
      <PColumn header="Аниме" #body="slotProps">
        <div
          class="profile-section__anime-cell"
          @mouseenter="onCardMouseEnter(slotProps.data, $event)"
          @mouseleave="hoverProps.onCardLeave"
        >
          <NuxtLink
            :to="'/anime/' + slotProps.data.id"
            class="profile-section__poster-link"
          >
            <img
              :src="slotProps.data.posterUrl || '/placeholder-poster.svg'"
              :alt="slotProps.data.russian || slotProps.data.name"
              width="36"
              height="48"
              class="profile-section__poster"
            />
          </NuxtLink>
          <div class="profile-section__anime-info">
            <NuxtLink
              :to="'/anime/' + slotProps.data.id"
              class="profile-section__anime-name"
            >
              {{ slotProps.data.russian || slotProps.data.name }}
            </NuxtLink>
            <PTag
              v-if="slotProps.data.animeStatus === 'anons' || slotProps.data.animeStatus === 'ongoing'"
              :value="animeStatusLabel(slotProps.data.animeStatus)"
              :severity="animeStatusSeverity(slotProps.data.animeStatus)"
            />
          </div>
        </div>
      </PColumn>
      <PColumn header="Оценка" #body="slotProps">
        <span :class="{ 'profile-section__rating-empty': !(slotProps.data.score > 0) }">
          {{ slotProps.data.score > 0 ? slotProps.data.score : '—' }}
        </span>
      </PColumn>
      <PColumn header="Тип" #body="slotProps">
        {{ kindLabel(slotProps.data.kind) }}
      </PColumn>
    </PDataTable>

    <!-- Mobile card list -->
    <div
      v-show="hasItems && isMobile && isOpen"
      class="profile-section__mobile-cards"
    >
      <div
        v-for="item in items"
        :key="item.id"
        class="profile-section__card"
        @mouseenter="onCardMouseEnter(item, $event)"
        @mouseleave="hoverProps.onCardLeave"
      >
        <NuxtLink :to="'/anime/' + item.id" class="profile-section__card-link">
          <img
            :src="item.posterUrl || '/placeholder-poster.svg'"
            :alt="item.russian || item.name"
            width="48"
            height="64"
            class="profile-section__card-poster"
          />
          <div class="profile-section__card-info">
            <span class="profile-section__card-name">
              {{ item.russian || item.name }}
            </span>
            <span class="profile-section__card-meta">
              <span v-if="item.score > 0" class="profile-section__card-rating">
                <i class="pi pi-star" /> {{ item.score }}
              </span>
              <span class="profile-section__card-kind">{{ kindLabel(item.kind) }}</span>
            </span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== Section root ===== */
.profile-section {
  margin-bottom: var(--space-4, 16px);
}

/* ===== Collapsible header ===== */
.profile-section__header {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
  width: 100%;
  padding: var(--space-3, 12px) var(--space-4, 16px);
  background: var(--bg-card, #1a1a2e);
  border: 1px solid var(--border-color, #2a2a4a);
  border-radius: var(--border-radius-lg, 12px);
  color: var(--text-primary, #e8e8f0);
  font-size: var(--text-base, 1rem);
  font-weight: var(--font-medium, 500);
  cursor: pointer;
  transition: border-color var(--transition-fast, 150ms), background var(--transition-fast, 150ms);
}

.profile-section__header:hover {
  border-color: var(--accent-cyan, #00d4ff);
  background: var(--bg-surface, #1e1e38);
}

.profile-section__header_collapsed {
  border-bottom-left-radius: var(--border-radius-lg, 12px);
  border-bottom-right-radius: var(--border-radius-lg, 12px);
}

/* ===== Chevron ===== */
.profile-section__chevron {
  font-size: var(--text-sm, 0.875rem);
  color: var(--text-secondary, #9898b8);
  transition: transform var(--transition-normal, 200ms) ease;
  flex-shrink: 0;
}

.profile-section__chevron_collapsed {
  transform: rotate(-90deg);
}

/* ===== Title ===== */
.profile-section__title {
  flex: 1;
  text-align: left;
  color: var(--text-primary, #e8e8f0);
}

/* ===== Count badge ===== */
.profile-section__count {
  flex-shrink: 0;
}

/* ===== Anime cell (desktop table) ===== */
.profile-section__anime-cell {
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
}

.profile-section__poster-link {
  flex-shrink: 0;
  line-height: 0;
}

.profile-section__poster {
  width: 36px;
  height: 48px;
  border-radius: var(--border-radius-sm, 4px);
  object-fit: cover;
  background: var(--bg-elevated, #262644);
}

.profile-section__anime-info {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
  min-width: 0;
}

.profile-section__anime-name {
  color: var(--text-primary, #e8e8f0);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: var(--font-medium, 500);
  transition: color var(--transition-fast, 150ms);
}

.profile-section__anime-name:hover {
  color: var(--accent-cyan, #00d4ff);
}

/* ===== Rating ===== */
.profile-section__rating-empty {
  color: var(--text-muted, #9999bb);
}

/* ===== Mobile card list ===== */
.profile-section__mobile-cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
  margin-top: var(--space-2, 8px);
}

.profile-section__card {
  display: flex;
  align-items: center;
  background: var(--bg-card, #1a1a2e);
  border: 1px solid var(--border-color, #2a2a4a);
  border-radius: var(--border-radius-lg, 12px);
  transition: border-color var(--transition-fast, 150ms);
}

.profile-section__card:hover {
  border-color: var(--accent-cyan, #00d4ff);
}

.profile-section__card-link {
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
  flex: 1;
  padding: var(--space-2, 8px) var(--space-3, 12px);
  text-decoration: none;
  color: inherit;
  min-width: 0;
}

.profile-section__card-poster {
  width: 48px;
  height: 64px;
  border-radius: var(--border-radius-sm, 4px);
  object-fit: cover;
  background: var(--bg-elevated, #262644);
  flex-shrink: 0;
}

.profile-section__card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1, 4px);
}

.profile-section__card-name {
  font-size: var(--text-sm, 0.875rem);
  font-weight: var(--font-medium, 500);
  color: var(--text-primary, #e8e8f0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-section__card-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
  font-size: var(--text-xs, 0.75rem);
  color: var(--text-secondary, #9898b8);
}

.profile-section__card-rating {
  display: flex;
  align-items: center;
  gap: var(--space-1, 4px);
  color: var(--accent-amber, #f59e0b);
  font-weight: var(--font-medium, 500);
}

.profile-section__card-rating i {
  font-size: var(--text-xs, 0.75rem);
}

.profile-section__card-kind {
  color: var(--text-muted, #9999bb);
}
</style>
