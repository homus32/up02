<script setup lang="ts">
import type { Anime } from '~/types/anime'

const props = defineProps<{
  anime: Anime
}>()

// Poster URL
const posterUrl = computed(() => {
  if (!props.anime.poster) return ''
  return props.anime.poster.mainUrl || props.anime.poster.originalUrl || ''
})

// Map score 0-10 to 0-5 stars
const displayScore = computed(() => {
  if (!props.anime.score) return 0
  return Math.round(props.anime.score) / 2
})

// Season display
const seasonDisplay = computed(() => {
  if (!props.anime.season) return null
  const season = props.anime.season
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
  if (!props.anime.studios?.length) return null
  return props.anime.studios[0].name
})

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

// Sanitized description HTML (HI-5) — client-side dynamic import (SSR-safe)
const safeDescriptionHtml = ref(props.anime.descriptionHtml || '')
onMounted(async () => {
  if (props.anime.descriptionHtml) {
    const DOMPurify = await import('dompurify').then(m => m.default)
    safeDescriptionHtml.value = DOMPurify.sanitize(props.anime.descriptionHtml, {
      ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'target'],
    })
  }
})
</script>

<template>
  <div>
    <NuxtLink to="/" class="anime-detail-hero__back">
      <i class="pi pi-arrow-left" />
      Назад в каталог
    </NuxtLink>

    <div class="anime-detail-hero__content">
      <!-- Poster -->
      <div class="anime-detail-hero__poster">
        <PImage
          :src="posterUrl"
          :alt="anime.russian || anime.name"
          preview
          loading="eager"
          fetchpriority="high"
        />
      </div>

      <!-- Info -->
      <div class="anime-detail-hero__info">
        <!-- Title -->
        <h1 class="anime-detail-hero__title">
          {{ anime.russian || anime.name }}
        </h1>
        <p
          v-if="anime.russian && anime.name !== anime.russian"
          class="anime-detail-hero__title-alt"
        >
          {{ anime.name }}
        </p>

        <!-- Badges -->
        <div class="anime-detail-hero__badges">
          <PTag :value="anime.kind.toUpperCase()" :severity="getKindSeverity(anime.kind)" />
          <PTag
            :value="anime.status === 'anons' ? 'Анонс' : anime.status === 'ongoing' ? 'Онгоинг' : 'Выпущено'"
            :severity="getStatusSeverity(anime.status)"
          />
        </div>

        <!-- Score -->
        <div class="anime-detail-hero__score">
          <PRating :modelValue="displayScore" :readonly="true" :stars="5" :cancel="false" />
          <span class="anime-detail-hero__score-value">{{ anime.score || 'N/A' }}</span>
        </div>

        <!-- Metadata -->
        <div class="anime-detail-hero__meta">
          <div v-if="anime.airedOn?.year" class="anime-detail-hero__meta-item">
            <span class="anime-detail-hero__meta-label">Год</span>
            <span class="anime-detail-hero__meta-value">{{ anime.airedOn.year }}</span>
          </div>
          <div v-if="seasonDisplay" class="anime-detail-hero__meta-item">
            <span class="anime-detail-hero__meta-label">Сезон</span>
            <span class="anime-detail-hero__meta-value">{{ seasonDisplay }}</span>
          </div>
          <div class="anime-detail-hero__meta-item">
            <span class="anime-detail-hero__meta-label">Серии</span>
            <span class="anime-detail-hero__meta-value">
              {{ anime.episodesAired > 0 ? `${anime.episodesAired} из ${anime.episodes || '?'}` : anime.episodes || '?' }}
            </span>
          </div>
          <div v-if="anime.duration" class="anime-detail-hero__meta-item">
            <span class="anime-detail-hero__meta-label">Длительность</span>
            <span class="anime-detail-hero__meta-value">{{ anime.duration }} мин.</span>
          </div>
        </div>

        <!-- Genres -->
        <div v-if="anime.genres?.length" class="anime-detail-hero__genres">
          <PChip v-for="genre in anime.genres" :key="genre.id" :label="genre.russian || genre.name" />
        </div>

        <!-- Studio -->
        <div v-if="studioName" class="anime-detail-hero__studio">
          <span class="anime-detail-hero__studio-label">Студия:</span>
          <span class="anime-detail-hero__studio-name">{{ studioName }}</span>
        </div>

        <!-- Description -->
        <div v-if="anime.descriptionHtml || anime.description" class="anime-detail-hero__description">
          <div
            v-if="safeDescriptionHtml"
            class="anime-detail-hero__description-html"
            v-html="safeDescriptionHtml"
          />
          <p v-else class="anime-detail-hero__description-text">{{ anime.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Back link */
.anime-detail-hero__back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  text-decoration: none;
  margin-bottom: var(--space-6);
  transition: color var(--transition-fast);
}

.anime-detail-hero__back:hover {
  color: var(--accent-cyan);
  text-decoration: none;
}

/* Content layout */
.anime-detail-hero__content {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--space-8);
  align-items: start;
}

/* Poster */
.anime-detail-hero__poster {
  position: sticky;
  top: calc(var(--header-height) + var(--space-6));
}

.anime-detail-hero__poster :deep(.p-image) {
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.anime-detail-hero__poster :deep(.p-image img) {
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
}

/* Info */
.anime-detail-hero__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.anime-detail-hero__title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  line-height: var(--leading-tight);
  margin: 0;
}

.anime-detail-hero__title-alt {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin: 0;
  margin-top: calc(var(--space-1) * -1);
}

/* Badges */
.anime-detail-hero__badges {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

/* Score */
.anime-detail-hero__score {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.anime-detail-hero__score-value {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--accent-amber);
}

.anime-detail-hero__score :deep(.p-rating) {
  gap: var(--space-1);
}

/* Metadata */
.anime-detail-hero__meta {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3) var(--space-6);
  padding: var(--space-4);
  background: var(--bg-card);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
}

.anime-detail-hero__meta-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.anime-detail-hero__meta-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.anime-detail-hero__meta-value {
  font-size: var(--text-base);
  color: var(--text-primary);
  font-weight: var(--font-medium);
}

/* Genres */
.anime-detail-hero__genres {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

/* Studio */
.anime-detail-hero__studio {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
}

.anime-detail-hero__studio-label {
  color: var(--text-muted);
}

.anime-detail-hero__studio-name {
  color: var(--text-secondary);
}

/* Description */
.anime-detail-hero__description {
  padding: var(--space-4);
  background: var(--bg-card);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
}

.anime-detail-hero__description-html {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
}

.anime-detail-hero__description-html :deep(p) {
  margin-bottom: var(--space-3);
}

.anime-detail-hero__description-html :deep(p:last-child) {
  margin-bottom: 0;
}

.anime-detail-hero__description-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
}

/* Responsive */
@media (max-width: 768px) {
  .anime-detail-hero__content {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }

  .anime-detail-hero__poster {
    position: static;
  }

  .anime-detail-hero__poster :deep(.p-image img) {
    aspect-ratio: 2 / 3;
    max-height: 400px;
    margin: 0 auto;
  }

  .anime-detail-hero__title {
    font-size: var(--text-2xl);
  }

  .anime-detail-hero__meta {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
