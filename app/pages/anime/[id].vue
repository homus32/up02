<script setup lang="ts">
import type { Anime } from '~/types/anime'

const route = useRoute()
const animeId = computed(() => route.params.id as string)

// Fetch anime data
const { data: anime, status, error } = useAsyncData<Anime>(
  `anime-${animeId.value}`,
  () => useAnimeApi().getById(animeId.value),
)
</script>

<template>
  <div class="anime-page">
    <!-- Loading skeleton -->
    <div v-if="status === 'pending'" class="anime-page__container container">
      <div class="anime-page__skeleton">
        <div class="anime-page__skeleton-poster skeleton-card__poster" />
        <div class="anime-page__skeleton-info">
          <div class="skeleton-card__title" style="width: 70%; height: 28px;" />
          <div class="skeleton-card__subtitle" style="width: 50%; height: 18px; margin-top: 0.5rem;" />
          <div style="margin-top: 1.5rem;">
            <div class="skeleton-card__title" style="width: 40%; height: 14px;" />
            <div class="skeleton-card__subtitle" style="width: 60%; height: 12px; margin-top: 0.75rem;" />
            <div class="skeleton-card__title" style="width: 30%; height: 14px; margin-top: 0.75rem;" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="anime-page__container container">
      <div class="anime-page__error">
        <i class="pi pi-exclamation-triangle anime-page__error-icon" />
        <h2 class="anime-page__error-title">
          {{ error.statusCode === 404 ? 'Аниме не найдено' : 'Ошибка загрузки' }}
        </h2>
        <p class="anime-page__error-text">
          {{ error.statusCode === 404
            ? 'Извините, запрошенное аниме не существует или было удалено.'
            : 'Не удалось загрузить информацию об аниме. Попробуйте обновить страницу.' }}
        </p>
        <NuxtLink to="/" class="anime-page__back">
          <i class="pi pi-arrow-left" />
          Вернуться в каталог
        </NuxtLink>
      </div>
    </div>

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

/* Skeleton */
.anime-page__skeleton {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--space-8);
}

.anime-page__skeleton-poster {
  aspect-ratio: 3 / 4;
  border-radius: var(--border-radius-lg);
}

.anime-page__skeleton-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-4);
}

/* Error state */
.anime-page__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-16) var(--space-8);
  gap: var(--space-4);
}

.anime-page__error-icon {
  font-size: 3rem;
  color: var(--color-error);
}

.anime-page__error-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0;
}

.anime-page__error-text {
  font-size: var(--text-base);
  color: var(--text-secondary);
  max-width: 400px;
  margin: 0;
}

/* Back link in error state */
.anime-page__back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  text-decoration: none;
  margin-top: var(--space-4);
  transition: color var(--transition-fast);
}

.anime-page__back:hover {
  color: var(--accent-cyan);
  text-decoration: none;
}

/* Responsive */
@media (max-width: 768px) {
  .anime-page {
    padding: var(--space-6) 0;
  }

  .anime-page__skeleton {
    grid-template-columns: 1fr;
  }

  .anime-page__skeleton-poster {
    aspect-ratio: 2 / 3;
    max-height: 300px;
    margin: 0 auto;
  }
}
</style>
