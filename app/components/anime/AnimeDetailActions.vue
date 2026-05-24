<script setup lang="ts">
import type { Anime, UserListStatus } from '~/types/anime'

const props = defineProps<{
  animeId: string
  anime: Anime
}>()

const { isInList, addToList, removeFromList, getStatus, setRating, getRating } = useUserLists()

const _isInList = computed(() => isInList(props.animeId))
const currentStatus = computed(() => getStatus(props.animeId))
const currentRating = computed(() => getRating(props.animeId))

const posterUrl = computed(() => {
  if (!props.anime.poster) return ''
  return props.anime.poster.mainUrl || props.anime.poster.originalUrl || ''
})

function handleAddToList(animeId: string, status: UserListStatus) {
  const item = {
    status,
    name: props.anime.name,
    russian: props.anime.russian,
    posterUrl: posterUrl.value || null,
    score: 0,
    kind: props.anime.kind, animeStatus: props.anime.status, episodes: props.anime.episodes, airedOnYear: props.anime.airedOn?.year,
  }
  addToList(animeId, item)
}

function handleRemoveFromList(animeId: string) {
  removeFromList(animeId)
}

function handleRatingChange(score: number) {
  if (_isInList.value) {
    setRating(props.animeId, score)
  }
}
</script>

<template>
  <div class="anime-detail-actions">
    <AnimeListButton
      :anime-id="animeId"
      :is-in-list="_isInList"
      :list-status="currentStatus"
      @add-to-list="handleAddToList"
      @remove-from-list="handleRemoveFromList"
    />

    <!-- User rating — only when anime is in list -->
    <div v-if="_isInList" class="anime-detail-actions__rating">
      <span class="anime-detail-actions__rating-label">Моя оценка</span>
      <div class="anime-detail-actions__rating-stars">
        <PRating
          :modelValue="currentRating"
          :stars="10"
          :onIcon="'pi pi-star-fill'"
          :offIcon="'pi pi-star'"
          @update:modelValue="handleRatingChange"
        />
        <span v-if="currentRating > 0" class="anime-detail-actions__rating-value">{{ currentRating }}/10</span>
        <span v-else class="anime-detail-actions__rating-hint">Оцените</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.anime-detail-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.anime-detail-actions__rating {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--bg-card);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
}

.anime-detail-actions__rating-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.anime-detail-actions__rating-stars {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.anime-detail-actions__rating-stars :deep(.p-rating) {
  gap: var(--space-1);
}

.anime-detail-actions__rating-value {
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  color: var(--accent-amber);
}

.anime-detail-actions__rating-hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
  font-style: italic;
}
</style>
