<script setup lang="ts">
import { USER_LIST_STATUSES, USER_LIST_LABELS } from '~/types/anime'
import type { UserListStatus } from '~/types/anime'

definePageMeta({ ssr: false })

const router = useRouter()
const { isLoggedIn, username, logout } = useAuth()
const { getByStatus, removeFromList, getListStats } = useUserLists()

onMounted(() => {
  if (!isLoggedIn.value) router.replace('/login')
})

const stats = computed(() => getListStats())
const totalAnime = computed(() => Object.values(stats.value).reduce<number>((a, b) => a + b, 0))

function handleLogout() {
  logout()
  router.push('/login')
}

function handleRemove(animeId: string) {
  removeFromList(animeId)
}
</script>

<template>
  <div class="profile-page">
    <div class="profile-page__header container">
      <ProfileCard
        :username="username || ''"
        :total-anime="totalAnime"
        :lists-count="stats"
      />
      <Button
        icon="pi pi-sign-out"
        label="Выйти"
        severity="secondary"
        outlined
        size="small"
        @click="handleLogout"
      />
    </div>

    <div class="profile-page__content container">
      <TabView>
        <TabPanel
          v-for="status in USER_LIST_STATUSES"
          :key="status"
          :value="status"
          :header="USER_LIST_LABELS[status]"
        >
          <template #header>
            <span class="profile-page__tab-header">
              <span class="profile-page__tab-label">{{ USER_LIST_LABELS[status] }}</span>
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
              <NuxtLink
                :to="`/anime/${animeId}`"
                class="profile-page__card-link"
              >
                <img
                  :src="item.posterUrl || '/placeholder-poster.svg'"
                  :alt="item.russian || item.name"
                  class="profile-page__card-poster"
                />
                <div class="profile-page__card-info">
                  <span class="profile-page__card-name">{{ item.russian || item.name }}</span>
                  <Tag
                    :value="USER_LIST_LABELS[item.status as UserListStatus]"
                    :class="`tag-${item.status}`"
                    class="profile-page__card-status"
                  />
                  <span
                    v-if="item.score > 0"
                    class="profile-page__card-score"
                  >
                    <i class="pi pi-star" /> {{ item.score }}
                  </span>
                </div>
              </NuxtLink>

              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                size="small"
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-8) var(--space-6);
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

.profile-page__card-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
  text-decoration: none;
  color: inherit;
  min-width: 0;
}

.profile-page__card-poster {
  width: 60px;
  height: 80px;
  border-radius: var(--border-radius-md);
  object-fit: cover;
  background: var(--bg-elevated);
  flex-shrink: 0;
}

.profile-page__card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.profile-page__card-name {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-page__card-status {
  font-size: var(--text-xs);
  align-self: flex-start;
}

.profile-page__card-score {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--accent-amber);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.profile-page__card-score i {
  font-size: var(--text-xs);
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
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-4);
    padding: var(--space-6);
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
