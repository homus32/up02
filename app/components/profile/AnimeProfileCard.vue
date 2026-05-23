<script setup lang="ts">
import { USER_LIST_LABELS } from '~/types/anime'
import type { UserListItem } from '~/types/anime'

defineProps<{
  animeId: string
  item: UserListItem
}>()

defineEmits<{
  remove: [animeId: string]
}>()
</script>

<template>
  <div class="anime-profile-card">
    <NuxtLink
      :to="`/anime/${animeId}`"
      class="anime-profile-card__link"
    >
      <img
        :src="item.posterUrl || '/placeholder-poster.svg'"
        :alt="item.russian || item.name"
        class="anime-profile-card__poster"
      />
      <div class="anime-profile-card__info">
        <span class="anime-profile-card__name">{{ item.russian || item.name }}</span>
        <PTag
          :value="Object.hasOwn(USER_LIST_LABELS, item.status) ? USER_LIST_LABELS[item.status] : item.status"
          :class="`tag-${item.status}`"
          class="anime-profile-card__status"
        />
        <span
          v-if="item.score > 0"
          class="anime-profile-card__score"
        >
          <i class="pi pi-star" /> {{ item.score }}
        </span>
      </div>
    </NuxtLink>

    <PButton
      icon="pi pi-trash"
      severity="danger"
      text
      rounded
      size="small"
      @click="$emit('remove', animeId)"
    />
  </div>
</template>

<style scoped>
.anime-profile-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: var(--space-3);
  transition: border-color var(--transition-fast);
}

.anime-profile-card:hover {
  border-color: var(--accent-cyan);
}

.anime-profile-card__link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
  text-decoration: none;
  color: inherit;
  min-width: 0;
}

.anime-profile-card__poster {
  width: 60px;
  height: 80px;
  border-radius: var(--border-radius-md);
  object-fit: cover;
  background: var(--bg-elevated);
  flex-shrink: 0;
}

.anime-profile-card__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.anime-profile-card__name {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.anime-profile-card__status {
  font-size: var(--text-xs);
  align-self: flex-start;
}

.anime-profile-card__score {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--accent-amber);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.anime-profile-card__score i {
  font-size: var(--text-xs);
}
</style>
