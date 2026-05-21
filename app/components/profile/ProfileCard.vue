<script setup lang="ts">
import { USER_LIST_STATUSES, USER_LIST_LABELS } from '~/types/anime'
import type { UserListStatus } from '~/types/anime'

defineProps<{
  username: string
  totalAnime: number
  listsCount: Record<UserListStatus, number>
}>()
</script>

<template>
  <div class="profile-card">
    <div class="profile-card__header">
      <div class="profile-card__avatar">
        <i class="pi pi-user" />
      </div>
      <div class="profile-card__info">
        <h1 class="profile-card__username">{{ username }}</h1>
        <p class="profile-card__total">Всего аниме: {{ totalAnime }}</p>
      </div>
    </div>
    <div class="profile-card__stats">
      <div
        v-for="status in USER_LIST_STATUSES"
        :key="status"
        class="profile-card__stat"
      >
        <span class="profile-card__stat-label">{{ USER_LIST_LABELS[status] }}</span>
        <span class="profile-card__stat-count">{{ listsCount[status] }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.profile-card__header {
  display: flex;
  flex-direction: row;
  gap: var(--space-4);
  align-items: center;
}

.profile-card__avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--bg-card);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.profile-card__username {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0;
}

.profile-card__total {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 0;
}

.profile-card__stats {
  display: flex;
  flex-direction: row;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.profile-card__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--bg-card);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--border-radius-md);
  min-width: 80px;
}

.profile-card__stat-label {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  white-space: nowrap;
}

.profile-card__stat-count {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}
</style>
