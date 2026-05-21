<script setup lang="ts">
import type { Anime, UserListStatus } from '~/types/anime'
import { USER_LIST_LABELS } from '~/types/anime'

const props = defineProps<{
  anime: Anime
  listStatus?: UserListStatus | null
}>()

const emit = defineEmits<{
  preview: [event: MouseEvent]
  'add-to-list': [status: UserListStatus]
  'remove-from-list': []
}>()

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

function statusLabel(status: string): string {
  const labels: Record<string, string> = { ongoing: 'Онгоинг', released: 'Вышел', anons: 'Анонс' }
  return labels[status] || status
}
</script>

<template>
  <div class="anime-card" @mouseenter="emit('preview', $event)">
    <NuxtLink :to="`/anime/${anime.id}`" class="anime-card__link">
      <div class="anime-card__poster-wrapper">
        <img
          :src="anime.poster?.mainUrl || '/placeholder-poster.svg'"
          :alt="anime.name"
          class="anime-card__poster"
          loading="lazy"
        />
        <Tag
          :value="kindLabel(anime.kind)"
          class="anime-card__kind-badge"
          severity="secondary"
        />
      </div>
    </NuxtLink>

    <div class="anime-card__body">
      <NuxtLink :to="`/anime/${anime.id}`" class="anime-card__title-link">
        <h3 class="anime-card__title">{{ anime.russian || anime.name }}</h3>
      </NuxtLink>

      <div class="anime-card__meta">
        <Tag
          v-if="anime.status"
          :value="statusLabel(anime.status)"
          :severity="statusSeverity(anime.status)"
          class="anime-card__status-badge"
        />
        <span v-if="anime.score" class="anime-card__score">
          <i class="pi pi-star"></i> {{ anime.score.toFixed(1) }}
        </span>
      </div>

      <ClientOnly>
        <div class="anime-card__actions">
          <div v-if="listStatus" class="anime-card__actions-inline">
            <Tag
              :value="USER_LIST_LABELS[listStatus]"
              :class="`tag-${listStatus}`"
              class="anime-card__list-badge"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              size="small"
              @click.stop="emit('remove-from-list')"
            />
          </div>
          <Button
            v-else
            label="В список"
            icon="pi pi-plus"
            size="small"
            outlined
            @click.stop="emit('add-to-list', 'planned')"
          />
        </div>
      </ClientOnly>
    </div>
  </div>
</template>

<style scoped>
.anime-card {
  background: var(--bg-card);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  transition: all var(--transition-normal);
  cursor: pointer;
  display: flex;
  flex-direction: column;
}
.anime-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg), var(--shadow-cyan);
}
.anime-card__poster-wrapper {
  position: relative;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: var(--bg-surface);
}
.anime-card__poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-normal);
}
.anime-card:hover .anime-card__poster {
  transform: scale(1.05);
}
.anime-card__kind-badge {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  font-size: var(--text-xs);
}
.anime-card__body {
  padding: var(--space-3);
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.anime-card__title-link {
  text-decoration: none;
  color: inherit;
}
.anime-card__title-link:hover {
  text-decoration: none;
}
.anime-card__title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  line-height: var(--leading-tight);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.anime-card__meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.anime-card__score {
  font-size: var(--text-xs);
  color: var(--accent-amber);
  display: flex;
  align-items: center;
  gap: 2px;
}
.anime-card__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: auto;
  padding-top: var(--space-2);
}
.anime-card__list-badge {
  font-size: var(--text-xs);
}
</style>
