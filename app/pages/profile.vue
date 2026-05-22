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
      <PButton
        icon="pi pi-sign-out"
        label="Выйти"
        severity="secondary"
        outlined
        size="small"
        @click="handleLogout"
      />
    </div>

    <div class="profile-page__content container">
      <PTabView>
        <PTabPanel
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
            <AnimeProfileCard
              v-for="[animeId, item] in getByStatus(status)"
              :key="animeId"
              :anime-id="animeId"
              :item="item"
              @remove="handleRemove"
            />
          </div>

          <ProfileTabEmpty v-else />
        </PTabPanel>
      </PTabView>
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

/* Mobile */
@media (max-width: 768px) {
  .profile-page__header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-4);
    padding: var(--space-6);
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
