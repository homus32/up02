<script setup lang="ts">
import type { Anime, UserListStatus } from '~/types/anime'
import { USER_LIST_STATUSES, USER_LIST_LABELS } from '~/types/anime'

const route = useRoute()
const animeId = computed(() => route.params.id as string)

// Fetch anime data
const { data: anime, status, error } = useAsyncData<Anime>(
  `anime-${animeId.value}`,
  () => useAnimeApi().getById(animeId.value),
)

// User lists composable (client-only)
const userLists = useUserLists()

// Reactive state for add-to-list
const selectedStatus = ref<UserListStatus | null>(null)
const userRating = ref(0)

// Convert USER_LIST_STATUSES to label/value objects for SelectButton
const statusOptions = computed(() =>
  USER_LIST_STATUSES.map(s => ({ label: USER_LIST_LABELS[s], value: s }))
)

// Determine current list status on client
const isInList = computed(() => userLists.isInList(animeId.value))
const currentStatus = computed(() => userLists.getStatus(animeId.value))

// Init selected status from list
watch(isInList, (inList) => {
  if (inList) {
    selectedStatus.value = currentStatus.value
  } else {
    selectedStatus.value = null
  }
}, { immediate: true })

// Init user rating
watch(() => animeId.value, (id) => {
  userRating.value = userLists.getRating(id)
}, { immediate: true })

// Kind badge severity
function getKindSeverity(kind: string): 'info' | 'success' | 'warn' | 'danger' | 'secondary' {
  switch (kind) {
    case 'tv': return 'info'
    case 'movie': return 'success'
    case 'ova': return 'warn'
    case 'ona': return 'warn'
    case 'special': return 'secondary'
    case 'music': return 'secondary'
    default: return 'secondary'
  }
}

// Status badge severity
function getStatusSeverity(status: string): 'info' | 'success' | 'warn' | 'danger' {
  switch (status) {
    case 'anons': return 'info'
    case 'ongoing': return 'warn'
    case 'released': return 'success'
    default: return 'info'
  }
}

// Status tag CSS class
function getStatusTagClass(status: UserListStatus): string {
  return `tag-${status}`
}

// Map score 0-10 to 0-5 stars
const displayScore = computed(() => {
  if (!anime.value?.score) return 0
  return Math.round(anime.value.score) / 2
})

// Poster URL
const posterUrl = computed(() => {
  if (!anime.value?.poster) return ''
  return anime.value.poster.mainUrl || anime.value.poster.originalUrl || ''
})

// Season display
const seasonDisplay = computed(() => {
  if (!anime.value?.season) return null
  const season = anime.value.season
  // Format: "spring_2024" → "Весна 2024"
  const [seasonName, year] = season.split('_')
  const seasonMap: Record<string, string> = {
    winter: 'Зима',
    spring: 'Весна',
    summer: 'Лето',
    autumn: 'Осень',
  }
  return seasonMap[seasonName] ? `${seasonMap[seasonName]} ${year}` : season
})

// Studio name
const studioName = computed(() => {
  if (!anime.value?.studios?.length) return null
  return anime.value.studios[0].name
})

// Handle add to list
function handleAddToList() {
  if (!selectedStatus.value || !anime.value) return
  const item = {
    status: selectedStatus.value,
    name: anime.value.name,
    russian: anime.value.russian,
    posterUrl: posterUrl.value || null,
    score: userRating.value,
    addedAt: Date.now(),
  }
  userLists.addToList(animeId.value, item)
}

// Handle remove from list
function handleRemoveFromList() {
  userLists.removeFromList(animeId.value)
  selectedStatus.value = null
}

// Handle rating change
function handleRatingChange(newRating: number) {
  userRating.value = Math.round(newRating * 2) // convert back to 0-10
  userLists.setRating(animeId.value, userRating.value)
  // Update item in list if exists
  if (isInList.value && currentStatus.value) {
    userLists.updateStatus(animeId.value, currentStatus.value)
  }
}

// Back link target (catalog or home)
const backLink = computed(() => {
  return '/'
})
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
      <NuxtLink :to="backLink" class="anime-page__back">
        <i class="pi pi-arrow-left" />
        Назад в каталог
      </NuxtLink>

      <div class="anime-page__content">
        <!-- Poster -->
        <div class="anime-page__poster">
          <Image
            :src="posterUrl"
            :alt="anime.russian || anime.name"
            preview
            loading="eager"
            fetchpriority="high"
          />
        </div>

        <!-- Info -->
        <div class="anime-page__info">
          <!-- Title -->
          <h1 class="anime-page__title">
            {{ anime.russian || anime.name }}
          </h1>
          <p v-if="anime.russian && anime.name !== anime.russian" class="anime-page__title-alt">
            {{ anime.name }}
          </p>

          <!-- Badges -->
          <div class="anime-page__badges">
            <Tag :value="anime.kind.toUpperCase()" :severity="getKindSeverity(anime.kind)" />
            <Tag :value="anime.status === 'anons' ? 'Анонс' : anime.status === 'ongoing' ? 'Онгоинг' : 'Выпущено'" :severity="getStatusSeverity(anime.status)" />
          </div>

          <!-- Score -->
          <div class="anime-page__score">
            <Rating :modelValue="displayScore" :readonly="true" :stars="5" :cancel="false" />
            <span class="anime-page__score-value">{{ anime.score || 'N/A' }}</span>
          </div>

          <!-- Metadata -->
          <div class="anime-page__meta">
            <div v-if="anime.airedOn?.year" class="anime-page__meta-item">
              <span class="anime-page__meta-label">Год</span>
              <span class="anime-page__meta-value">{{ anime.airedOn.year }}</span>
            </div>
            <div v-if="seasonDisplay" class="anime-page__meta-item">
              <span class="anime-page__meta-label">Сезон</span>
              <span class="anime-page__meta-value">{{ seasonDisplay }}</span>
            </div>
            <div class="anime-page__meta-item">
              <span class="anime-page__meta-label">Серии</span>
              <span class="anime-page__meta-value">
                {{ anime.episodesAired > 0 ? `${anime.episodesAired} из ${anime.episodes || '?'}` : anime.episodes || '?' }}
              </span>
            </div>
            <div v-if="anime.duration" class="anime-page__meta-item">
              <span class="anime-page__meta-label">Длительность</span>
              <span class="anime-page__meta-value">{{ anime.duration }} мин.</span>
            </div>
          </div>

          <!-- Genres -->
          <div v-if="anime.genres?.length" class="anime-page__genres">
            <Chip v-for="genre in anime.genres" :key="genre.id" :label="genre.russian || genre.name" />
          </div>

          <!-- Studio -->
          <div v-if="studioName" class="anime-page__studio">
            <span class="anime-page__studio-label">Студия:</span>
            <span class="anime-page__studio-name">{{ studioName }}</span>
          </div>

          <!-- Description -->
          <div v-if="anime.descriptionHtml || anime.description" class="anime-page__description">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-if="anime.descriptionHtml" class="anime-page__description-html" v-html="anime.descriptionHtml" />
            <p v-else class="anime-page__description-text">{{ anime.description }}</p>
          </div>
        </div>
      </div>

      <!-- Player placeholder -->
      <div class="anime-page__player">
        <div class="anime-page__player-inner">
          <i class="pi pi-play-circle anime-page__player-icon" />
          <span class="anime-page__player-text">Видео временно недоступно</span>
        </div>
      </div>

      <!-- Add to list section -->
      <div class="anime-page__lists">
        <ClientOnly>
          <!-- Not in list: show selector + add button -->
          <template v-if="!isInList">
            <div class="anime-page__list-selector">
              <SelectButton
                v-model="selectedStatus"
                :options="statusOptions"
                optionLabel="label"
                optionValue="value"
                :allowEmpty="false"
                :multiple="false"
              />
            </div>
            <Button
              label="Добавить"
              icon="pi pi-plus"
              :disabled="!selectedStatus"
              @click="handleAddToList"
            />
          </template>

          <!-- In list: show status badge + remove + rating -->
          <template v-else>
            <div class="anime-page__list-status">
              <Tag
                v-if="currentStatus"
                :value="USER_LIST_LABELS[currentStatus]"
                :class="getStatusTagClass(currentStatus)"
              />
            </div>
            <div class="anime-page__list-actions">
              <Button
                label="Удалить"
                icon="pi pi-trash"
                severity="danger"
                outlined
                @click="handleRemoveFromList"
              />
            </div>
            <div class="anime-page__list-rating">
              <label class="anime-page__rating-label">Ваша оценка:</label>
              <Rating
                :modelValue="userRating / 2"
                :stars="5"
                :cancel="false"
                @update:modelValue="handleRatingChange"
              />
            </div>
          </template>

          <template #fallback>
            <div class="anime-page__list-loading">
              <i class="pi pi-spin pi-spinner" />
            </div>
          </template>
        </ClientOnly>
      </div>
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

/* Back link */
.anime-page__back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  text-decoration: none;
  margin-bottom: var(--space-6);
  transition: color var(--transition-fast);
}

.anime-page__back:hover {
  color: var(--accent-cyan);
  text-decoration: none;
}

/* Content layout */
.anime-page__content {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--space-8);
  align-items: start;
}

/* Poster */
.anime-page__poster {
  position: sticky;
  top: calc(var(--header-height) + var(--space-6));
}

.anime-page__poster :deep(.p-image) {
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.anime-page__poster :deep(.p-image img) {
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
}

/* Info */
.anime-page__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.anime-page__title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  line-height: var(--leading-tight);
  margin: 0;
}

.anime-page__title-alt {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin: 0;
  margin-top: calc(var(--space-1) * -1);
}

/* Badges */
.anime-page__badges {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

/* Score */
.anime-page__score {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.anime-page__score-value {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--accent-amber);
}

.anime-page__score :deep(.p-rating) {
  gap: var(--space-1);
}

/* Metadata */
.anime-page__meta {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3) var(--space-6);
  padding: var(--space-4);
  background: var(--bg-card);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
}

.anime-page__meta-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.anime-page__meta-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.anime-page__meta-value {
  font-size: var(--text-base);
  color: var(--text-primary);
  font-weight: var(--font-medium);
}

/* Genres */
.anime-page__genres {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

/* Studio */
.anime-page__studio {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
}

.anime-page__studio-label {
  color: var(--text-muted);
}

.anime-page__studio-name {
  color: var(--text-secondary);
}

/* Description */
.anime-page__description {
  padding: var(--space-4);
  background: var(--bg-card);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
}

.anime-page__description-html {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
}

.anime-page__description-html :deep(p) {
  margin-bottom: var(--space-3);
}

.anime-page__description-html :deep(p:last-child) {
  margin-bottom: 0;
}

.anime-page__description-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
}

/* Player placeholder */
.anime-page__player {
  margin-top: var(--space-8);
}

.anime-page__player-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  aspect-ratio: 16 / 9;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
}

.anime-page__player-icon {
  font-size: 4rem;
  color: var(--text-muted);
}

.anime-page__player-text {
  font-size: var(--text-base);
  color: var(--text-muted);
}

/* Add to list section */
.anime-page__lists {
  margin-top: var(--space-8);
  padding: var(--space-6);
  background: var(--bg-card);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.anime-page__list-selector {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.anime-page__list-selector :deep(.p-selectbutton) {
  display: flex;
  flex-wrap: wrap;
}

.anime-page__list-actions {
  display: flex;
  gap: var(--space-3);
}

.anime-page__list-rating {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.anime-page__rating-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.anime-page__list-loading {
  display: flex;
  justify-content: center;
  padding: var(--space-4);
  color: var(--text-muted);
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

/* Responsive */
@media (max-width: 768px) {
  .anime-page {
    padding: var(--space-6) 0;
  }

  .anime-page__content {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }

  .anime-page__poster {
    position: static;
  }

  .anime-page__poster :deep(.p-image img) {
    aspect-ratio: 2 / 3;
    max-height: 400px;
    margin: 0 auto;
  }

  .anime-page__title {
    font-size: var(--text-2xl);
  }

  .anime-page__meta {
    grid-template-columns: 1fr 1fr;
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