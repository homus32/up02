<script setup lang="ts">
import type { Anime, UserListStatus } from '~/types/anime'

const props = defineProps<{
  anime: Anime
  isInList: boolean
  listStatus?: UserListStatus | null
}>()

const emit = defineEmits<{
  'add-to-list': [animeId: string, status: UserListStatus]
}>()

function kindLabel(kind: string): string {
  const map: Record<string, string> = { tv: 'TV', movie: 'Movie', ova: 'OVA', ona: 'ONA', special: 'Special', music: 'Music' }
  return map[kind] || kind
}

/** Удаляет Shikimori BB-коды вида [tag=id]text[/tag], оставляя только text */
function stripBBCode(text: string): string {
  return text.replace(/\[(\w+)=\d+\](.*?)\[\/\1\]/g, '$2')
}

/** Очищенное описание */
const cleanDescription = computed(() => {
  if (!props.anime.description) return ''
  const cleaned = stripBBCode(props.anime.description)
  return cleaned.length > 200 ? cleaned.slice(0, 200) + '...' : cleaned
})
</script>

<template>
  <div class="popup">
    <!-- Рейтинг в правом верхнем углу -->
    <div v-if="anime.score" class="popup__rating">
      <i class="pi pi-star-fill" />
      <span>{{ anime.score.toFixed(1) }}</span>
    </div>

    <div class="popup__header">
      <NuxtLink :to="`/anime/${anime.id}`" class="popup__title-link">
        <h4 class="popup__title">{{ anime.russian || anime.name }}</h4>
      </NuxtLink>
      <span v-if="anime.name !== anime.russian" class="popup__alt-title">
        {{ anime.name }}
      </span>
    </div>

    <div class="popup__meta">
      <span v-if="anime.airedOn?.year" class="popup__meta-item">
        {{ anime.airedOn.year }} г.
      </span>
      <span v-if="anime.episodes" class="popup__meta-item">
        <u>{{ anime.episodesAired }}/{{ anime.episodes }} эп.</u>
      </span>
      <span v-if="anime.duration" class="popup__meta-item">
        {{ anime.duration }} мин.
      </span>
      <PTag
        :value="kindLabel(anime.kind)"
        severity="secondary"
        class="popup__kind"
      />
    </div>

    <div v-if="anime.genres?.length" class="popup__genres">
      <PChip
        v-for="genre in anime.genres.slice(0, 4)"
        :key="genre.id"
        :label="genre.russian || genre.name"
        class="popup__genre"
      />
    </div>

    <p v-if="cleanDescription" class="popup__description">
      {{ cleanDescription }}
    </p>

    <div class="popup__actions">
      <PButton
        :label="isInList ? 'В списке' : 'В список'"
        :icon="isInList ? 'pi pi-check' : 'pi pi-plus'"
        size="small"
        @click="emit('add-to-list', anime.id, 'planned')"
      />

    </div>
  </div>
</template>

<style scoped>
.popup {
  position: relative;
  padding-bottom: 36px;
}

.popup__rating {
  position: absolute;
  bottom: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: var(--text-xl, 1.25rem);
  font-weight: var(--font-bold, 700);
  color: var(--accent-cyan, #00d4ff);
  background: color-mix(in srgb, var(--bg-card, #1a1a2e) 85%, transparent);
  padding: 6px 10px;
  border-radius: var(--border-radius-md, 8px) 0 0 0;
  line-height: 1;
}

.popup__rating .pi-star-fill {
  font-size: 2em;
  align-self: flex-end;
  line-height: 1.4;
}

.popup__rating .pi-star-fill {
  font-size: 16px;
}

.popup__genres {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
  margin-bottom: 12px;
}

.popup__genre {
  padding: 5px;
	font-size: 0.9rem;

}

.popup__description {
  margin-bottom: 10px;
	font-size: 0.9rem;
}


.popup__title-link {
  color: var(--text-primary, #e8e8f0);
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-thickness: 1px;
  transition: color var(--transition-fast, 150ms);
}

.popup__title-link:hover {
  color: var(--accent-cyan, #00d4ff);
}

.popup__actions {
  display: flex;
  gap: 8px;
}
.popup__meta {
  display: flex;
  align-items: center;
}

.popup__meta-item {
  margin-right: 10px;
}

.popup__kind {
  margin-left: 3px;
  margin-right: 3px;
}
</style>
