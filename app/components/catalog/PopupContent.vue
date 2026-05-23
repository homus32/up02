<script setup lang="ts">
import type { Anime, UserListStatus } from '~/types/anime'

const props = defineProps<{
  anime: Anime
  isInList: boolean
  listStatus?: UserListStatus | null
}>()

const emit = defineEmits<{
  'add-to-list': [animeId: string, status: UserListStatus]
  navigate: [animeId: string]
}>()

function kindLabel(kind: string): string {
  const map: Record<string, string> = { tv: 'TV', movie: 'Movie', ova: 'OVA', ona: 'ONA', special: 'Special', music: 'Music' }
  return map[kind] || kind
}
</script>

<template>
  <div class="popup">
    <div class="popup__header">
      <h4 class="popup__title">{{ anime.russian || anime.name }}</h4>
      <span v-if="anime.name !== anime.russian" class="popup__alt-title">
        {{ anime.name }}
      </span>
    </div>

    <div class="popup__meta">
      <span v-if="anime.airedOn?.year" class="popup__meta-item">
        {{ anime.airedOn.year }} г.
      </span>
      <span v-if="anime.episodes" class="popup__meta-item">
        {{ anime.episodesAired }}/{{ anime.episodes }} эп.
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

    <p v-if="anime.description" class="popup__description">
      {{ anime.description.slice(0, 200) }}{{ anime.description.length > 200 ? '...' : '' }}
    </p>

    <div class="popup__actions">
      <PButton
        :label="isInList ? 'В списке' : 'В список'"
        :icon="isInList ? 'pi pi-check' : 'pi pi-plus'"
        size="small"
        @click="emit('add-to-list', anime.id, 'planned')"
      />
      <PButton
        label="Подробнее"
        icon="pi pi-arrow-right"
        size="small"
        severity="secondary"
        @click="emit('navigate', anime.id)"
      />
    </div>
  </div>
</template>
