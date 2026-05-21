<script setup lang="ts">
import { USER_LIST_STATUSES, USER_LIST_LABELS } from '~/types/anime'
import type { UserListStatus, UserListItem } from '~/types/anime'

definePageMeta({ ssr: false })

const router = useRouter()
const { isLoggedIn, username, logout } = useAuth()
const { getByStatus, removeFromList, getListStats } = useUserLists()

onMounted(() => {
  if (!isLoggedIn.value) {
    router.replace('/login')
  }
})

const stats = computed(() => getListStats())

function handleLogout() {
  logout()
  router.push('/login')
}

function handleRemove(animeId: string) {
  removeFromList(animeId)
}

function getAnimeName(item: UserListItem): string {
  return item.russian || item.name
}

function getStatusLabel(status: UserListStatus): string {
  return USER_LIST_LABELS[status]
}
</script>

<template>
  <div class="profile-page">
    <div class="profile-page__header">
      <div class="container">
        <div class="profile-page__greeting">
          <h1 class="profile-page__title">
            Hello, {{ username }}!
          </h1>
          <Button
            icon="pi pi-sign-out"
            label="Выйти"
            severity="secondary"
            outlined
            size="small"
            @click="handleLogout"
          />
        </div>

        <div class="profile-page__stats">
          <div
            v-for="status in USER_LIST_STATUSES"
            :key="status"
            class="profile-page__stat"
          >
            <span
              class="profile-page__stat-badge"
              :class="`tag-${status}`"
            >
              {{ getStatusLabel(status) }}
            </span>
            <span class="profile-page__stat-count">
              {{ stats[status] }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="profile-page__content container">
      <TabView>
        <TabPanel
          v-for="status in USER_LIST_STATUSES"
          :key="status"
          :value="status"
          :header="getStatusLabel(status)"
        >
          <template #header>
            <span class="profile-page__tab-header">
              <span class="profile-page__tab-label">{{ getStatusLabel(status) }}</span>
              <span
                v-if="stats[status] > 0"
                class="profile-page__tab-count"
              >
                {{ stats[status] }}
              </span>
            </span>
          </template>

          <div
            v-if="getByStatus(status).length > 0"
            class="profile-page__list"
          >
            <div
              v-for="[animeId, item] in getByStatus(status)"
              :key="animeId"
              class="profile-page__card"
            >
              <div class="profile-page__card-poster">
                <img
                  v-if="item.posterUrl"
                  :src="item.posterUrl"
                  :alt="getAnimeName(item)"
                  class="profile-page__card-image"
                />
                <div v-else class="profile-page__card-placeholder">
                  <i class="pi pi-image" />
                </div>
              </div>

              <div class="profile-page__card-info">
                <NuxtLink
                  :to="`/anime/${animeId}`"
                  class="profile-page__card-name"
                >
                  {{ getAnimeName(item) }}
                </NuxtLink>

                <div class="profile-page__card-meta">
                  <Tag
                    :value="getStatusLabel(item.status)"
                    :class="`tag-${item.status}`"
                    class="profile-page__card-status"
                  />

                  <div v-if="item.score > 0" class="profile-page__card-rating">
                    <i class="pi pi-star-fill" />
                    <span>{{ item.score.toFixed(1) }}</span>
                  </div>
                </div>
              </div>

              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                class="profile-page__card-remove"
                @click="handleRemove(animeId)"
              />
            </div>
          </div>

          <div v-else class="profile-page__empty">
            <i class="pi pi-inbox profile-page__empty-icon" />
            <p class="profile-page__empty-text">Nothing here yet</p>
            <NuxtLink to="/" class="profile-page__empty-link">
              Browse catalog
            </NuxtLink>
          </div>
        </TabPanel>
      </TabView>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  padding-bottom: var(--space-12);
}

.profile-page__header {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  padding: var(--space-8) 0;
}

.profile-page__greeting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
}

.profile-page__title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.profile-page__stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.profile-page__stat {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--bg-elevated);
  border-radius: var(--border-radius-md);
  padding: var(--space-2) var(--space-3);
}

.profile-page__stat-badge {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--border-radius-sm);
}

.profile-page__stat-count {
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.profile-page__content {
  padding-top: var(--space-8);
}

.profile-page__tab-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.profile-page__tab-label {
  font-size: var(--text-sm);
}

.profile-page__tab-count {
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  padding: 2px 6px;
  border-radius: 10px;
}

.profile-page__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.profile-page__card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: var(--space-3);
  transition: border-color var(--transition-fast);
}

.profile-page__card:hover {
  border-color: var(--accent-cyan);
}

.profile-page__card-poster {
  flex-shrink: 0;
  width: 60px;
  height: 80px;
  border-radius: var(--border-radius-md);
  overflow: hidden;
  background: var(--bg-elevated);
}

.profile-page__card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-page__card-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.profile-page__card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.profile-page__card-name {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color var(--transition-fast);
}

.profile-page__card-name:hover {
  color: var(--accent-cyan);
  text-decoration: none;
}

.profile-page__card-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.profile-page__card-status {
  font-size: var(--text-xs);
}

.profile-page__card-rating {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--accent-amber);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.profile-page__card-rating i {
  font-size: var(--text-xs);
}

.profile-page__card-remove {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
}

.profile-page__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12) var(--space-6);
  text-align: center;
}

.profile-page__empty-icon {
  font-size: 3rem;
  color: var(--text-muted);
  margin-bottom: var(--space-4);
}

.profile-page__empty-text {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin-bottom: var(--space-4);
}

.profile-page__empty-link {
  color: var(--accent-cyan);
  font-size: var(--text-sm);
  text-decoration: none;
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--accent-cyan);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
}

.profile-page__empty-link:hover {
  background: var(--accent-cyan);
  color: var(--text-inverse);
  text-decoration: none;
}

/* Mobile */
@media (max-width: 768px) {
  .profile-page__header {
    padding: var(--space-6) 0;
  }

  .profile-page__greeting {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-4);
  }

  .profile-page__title {
    font-size: var(--text-xl);
  }

  .profile-page__stats {
    gap: var(--space-2);
  }

  .profile-page__stat {
    padding: var(--space-1) var(--space-2);
  }

  .profile-page__card {
    padding: var(--space-2);
  }

  .profile-page__card-poster {
    width: 50px;
    height: 66px;
  }
}

@media (max-width: 480px) {
  .profile-page__tab-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-1);
  }
}
</style>