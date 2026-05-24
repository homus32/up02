<script setup lang="ts">
import type { Anime, UserListStatus } from '~/types/anime'

const props = defineProps<{
  animeId: string
  anime: Anime
}>()

const { isInList, addToList, removeFromList, getStatus } = useUserLists()

const _isInList = computed(() => isInList(props.animeId))
const currentStatus = computed(() => getStatus(props.animeId))

// Poster URL for the list item
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
  </div>
</template>

<style scoped>
.anime-detail-actions {
  width: 100%;
}
</style>
