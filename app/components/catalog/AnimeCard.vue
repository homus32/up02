<script setup lang="ts">
import type { Anime, UserListStatus } from '~/types/anime'

const props = defineProps<{
  anime: Anime
  listStatus?: UserListStatus | null
}>()

const emit = defineEmits<{
  preview: [event: MouseEvent]
}>()

const STATUS_ICONS: Record<UserListStatus, string> = {
  planned: 'pi pi-bookmark',
  watching: 'pi pi-play',
  completed: 'pi pi-check-circle',
  on_hold: 'pi pi-pause',
  dropped: 'pi pi-times-circle',
}

function kindLabel(kind: string): string {
  const map: Record<string, string> = { tv: 'TV', movie: 'Movie', ova: 'OVA', ona: 'ONA', special: 'Special', music: 'Music' }
  return map[kind] || kind
}
</script>

<template>
  <div class="anime-card" @mouseenter="emit('preview', $event)">
    <NuxtLink :to="`/anime/${anime.id}`" class="anime-card__link">
      <div class="anime-card__poster-wrapper">
        <img
          :src="anime.poster?.mainUrl || '/placeholder-poster.svg'"
          :alt="anime.russian || anime.name"
          class="anime-card__poster"
          loading="lazy"
        />
        <PTag
          :value="kindLabel(anime.kind)"
          class="anime-card__kind-badge"
          severity="secondary"
        />

        <ClientOnly>
          <span
            v-if="listStatus && STATUS_ICONS[listStatus]"
            :class="['anime-card__status-icon', `anime-card__status-icon_${listStatus}`]"
          >
            <i :class="STATUS_ICONS[listStatus]" />
          </span>
        </ClientOnly>
      </div>
    </NuxtLink>

    <div class="anime-card__body">
      <NuxtLink :to="`/anime/${anime.id}`" class="anime-card__title-link">
        <h3 class="anime-card__title">{{ anime.russian || anime.name }}</h3>
      </NuxtLink>

      <span class="anime-card__year">{{ anime.airedOn?.year ?? '—' }}</span>
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.anime-card__year {
  font-size: var(--text-xs);
  color: var(--text-muted);
}
.anime-card__status-icon {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--bg-page) 80%, transparent);
  font-size: var(--text-sm);
  color: var(--accent-cyan);
  backdrop-filter: blur(4px);
  pointer-events: none;
}
.anime-card__status-icon_watching {
  color: var(--accent-green, #4ade80);
}
.anime-card__status-icon_completed {
  color: var(--accent-green, #4ade80);
}
.anime-card__status-icon_on_hold {
  color: var(--accent-amber);
}
.anime-card__status-icon_dropped {
  color: var(--accent-danger);
}
</style>