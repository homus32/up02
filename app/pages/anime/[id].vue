<script setup lang="ts">
import type { Anime } from '~/types/anime'

const route = useRoute()
const animeId = computed(() => route.params.id as string)

// Fetch anime data
const { data: anime, status, error, refresh } = useAsyncData<Anime>(
  `anime-${animeId.value}`,
  () => useAnimeApi().getById(animeId.value),
)
</script>

<template>
  <div class="anime-page">
    <SkeletonAnimeDetail v-if="status === 'pending'" />

    <ErrorState
      v-else-if="error"
      :title="error.statusCode === 404 ? 'Аниме не найдено' : 'Ошибка загрузки'"
      :message="error.statusCode === 404
        ? 'Извините, запрошенное аниме не существует или было удалено.'
        : 'Не удалось загрузить информацию об аниме. Попробуйте обновить страницу.'"
      :action-label="error.statusCode !== 404 ? 'Повторить' : undefined"
      @action="refresh()"
    />

    <!-- Loaded content -->
    <div v-else-if="anime" class="anime-page__container container">
      <AnimeDetailHero :anime="anime" />

      <!-- Player placeholder -->
      <PlayerPlaceholder />

      <!-- Add to list section -->
      <AnimeDetailLists :anime-id="animeId" :anime="anime" />
    </div>
  </div>
</template>

<style scoped>
.anime-page {
  padding: var(--space-8) 0;
}

.anime-page__container {
  max-width: 960px;
}

@media (max-width: 768px) {
  .anime-page {
    padding: var(--space-6) 0;
  }
}
</style>
