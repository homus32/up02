<script setup lang="ts">
import { USER_LIST_STATUSES } from '~/types/anime'
import type { UserListStatus, Anime } from '~/types/anime'

const router = useRouter()
const { isLoggedIn, username, logout } = useAuth()
const {
  getByStatus, removeFromList, updateStatus,
  getListStats, isInList, getStatus, clearAll,
  ratings,
} = useUserLists()
const {
  onCardEnter: onCardEnterOriginal, onCardLeave,
  onPopupEnter, onPopupLeave,
  isVisible, selectedAnime, popupRect,
} = usePopupHover()
const animeCache = useAnimeDetailCache()

/** Full anime data fetched via API — replaces selectedAnime once resolved */
const fullAnime = ref<Anime | null>(null)
/** Anchor point: right edge of anime name text */
const popupAnchor = ref<{ x: number; y: number } | null>(null)

/** Popup shows full API data when available, otherwise minimal row data */
const popupAnime = computed(() => fullAnime.value || selectedAnime.value)

// Override popupRect when popup becomes visible or switches to another anime
// Используем selectedAnime вместо isVisible — при быстром переключении между
// рядами isVisible уже true и watcher не срабатывает.
watch([isVisible, selectedAnime], () => {
  if (isVisible.value && selectedAnime.value && popupAnchor.value) {
    const { x, y } = popupAnchor.value
    popupRect.value = new DOMRect(x, y, 0, 0)
  }
  if (!isVisible.value) {
    fullAnime.value = null
    popupAnchor.value = null
  }
})

onMounted(() => {
  if (!isLoggedIn.value) router.replace('/login')
})

const stats = computed(() => getListStats())
const totalAnime = computed(() => Object.values(stats.value).reduce<number>((a, b) => a + b, 0))

function handleLogout() {
  clearAll()
  logout()
  router.push('/login')
}

function handleRemoveFromList(animeId: string) {
  removeFromList(animeId)
}

function handleAddToList(animeId: string, status: UserListStatus) {
  updateStatus(animeId, status)
}

async function handleCardEnter(anime: Anime, event: MouseEvent) {
  fullAnime.value = null
  // Находим правую границу названия аниме — попап появится справа от него
  const cell = event.currentTarget as HTMLElement | null
  const nameEl = cell?.querySelector('.profile-section__anime-name')
  const nameRight = nameEl?.getBoundingClientRect().right ?? event.clientX
  popupAnchor.value = { x: nameRight, y: event.clientY }
  onCardEnterOriginal(anime, event)
  // Fetch full data for rich popup (genres, description, episodes)
  animeCache.get(anime.id).then(data => {
    fullAnime.value = data
  }).catch(() => {})
}
</script>

<template>
  <div class="profile-page">
    <div class="profile-page__header container">
      <ProfileCard
        :username="username || ''"
        :total-anime="totalAnime"
        :lists-count="stats"
      >
        <template #actions>
          <PButton
            icon="pi pi-sign-out"
            label="Выйти"
            severity="secondary"
            outlined
            size="small"
            @click="handleLogout"
          />
        </template>
      </ProfileCard>
    </div>

    <div class="profile-page__content container">
      <div class="profile-page__sections">
        <ProfileAnimeSection
          v-for="status in USER_LIST_STATUSES"
          :key="status"
          :status="status"
          :items="getByStatus(status)"
          :total="stats[status] ?? 0"
          :ratings="ratings"
          :default-open="true"
          :hover-props="{ onCardEnter: handleCardEnter, onCardLeave }"
        />
      </div>
    </div>

    <AnimePreviewPopup
      v-if="isVisible && popupAnime"
      :anime="popupAnime"
      :is-in-list="!!selectedAnime && isInList(selectedAnime.id)"
      :list-status="selectedAnime ? getStatus(selectedAnime.id) : null"
      :position="popupRect"
      @mouseenter="onPopupEnter"
      @mouseleave="onPopupLeave"
      @add-to-list="handleAddToList"
      @remove-from-list="handleRemoveFromList"
    />
  </div>
</template>

<style scoped>
.profile-page {
  padding-bottom: var(--space-12);
}

.profile-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--space-8) var(--space-6);
}

.profile-page__content {
  padding-top: var(--space-8);
}

.profile-page__sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* Mobile */
@media (max-width: 768px) {
  .profile-page__header {
    flex-wrap: wrap;
    gap: var(--space-4);
    padding: var(--space-6);
  }
}
</style>
