<script setup lang="ts">
import type { Anime, UserListStatus } from '~/types/anime'
import { USER_LIST_STATUSES, USER_LIST_LABELS } from '~/types/anime'

const props = defineProps<{
  animeId: string
  anime: Anime
}>()

const { getStatus, isInList, addToList, removeFromList, getRating, setRating, updateStatus } = useUserLists()

const selectedStatus = ref<UserListStatus | null>(null)
const userRating = ref(0)

const _isInList = computed(() => isInList(props.animeId))
const currentStatus = computed(() => getStatus(props.animeId))

// Convert USER_LIST_STATUSES to label/value objects for SelectButton
const statusOptions = computed(() =>
  USER_LIST_STATUSES.map(s => ({ label: USER_LIST_LABELS[s], value: s }))
)

// Init selected status from list
watch(_isInList, (inList) => {
  selectedStatus.value = inList ? currentStatus.value : null
}, { immediate: true })

// Init user rating
watch(() => props.animeId, () => {
  userRating.value = getRating(props.animeId)
}, { immediate: true })

// Poster URL for the list item
const posterUrl = computed(() => {
  if (!props.anime.poster) return ''
  return props.anime.poster.mainUrl || props.anime.poster.originalUrl || ''
})

// Handle add to list
function handleAddToList() {
  if (!selectedStatus.value) return
  const item = {
    status: selectedStatus.value,
    name: props.anime.name,
    russian: props.anime.russian,
    posterUrl: posterUrl.value || null,
    score: userRating.value,
    addedAt: Date.now(),
  }
  addToList(props.animeId, item)
}

// Handle remove from list
function handleRemoveFromList() {
  removeFromList(props.animeId)
  selectedStatus.value = null
}

// Handle rating change
function handleRatingChange(newRating: number) {
  userRating.value = Math.round(newRating * 2)
  setRating(props.animeId, userRating.value)
  if (_isInList.value && currentStatus.value) {
    updateStatus(props.animeId, currentStatus.value)
  }
}

// Status tag CSS class
function getStatusTagClass(status: UserListStatus): string {
  return `tag-${status}`
}
</script>

<template>
  <div class="anime-detail-lists">
    <ClientOnly>
      <!-- Not in list: show selector + add button -->
      <template v-if="!_isInList">
        <div class="anime-detail-lists__selector">
          <PSelectButton
            v-model="selectedStatus"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            :allowEmpty="false"
            :multiple="false"
          />
        </div>
        <PButton
          label="Добавить"
          icon="pi pi-plus"
          :disabled="!selectedStatus"
          @click="handleAddToList"
        />
      </template>

      <!-- In list: show status badge + remove + rating -->
      <template v-else>
        <div class="anime-detail-lists__status">
          <PTag
            v-if="currentStatus"
            :value="USER_LIST_LABELS[currentStatus]"
            :class="getStatusTagClass(currentStatus)"
          />
        </div>
        <div class="anime-detail-lists__actions">
          <PButton
            label="Удалить"
            icon="pi pi-trash"
            severity="danger"
            outlined
            @click="handleRemoveFromList"
          />
        </div>
        <div class="anime-detail-lists__rating">
          <label class="anime-detail-lists__rating-label">Ваша оценка:</label>
          <PRating
            :modelValue="userRating / 2"
            :stars="5"
            :cancel="false"
            @update:modelValue="handleRatingChange"
          />
        </div>
      </template>

      <template #fallback>
        <div class="anime-detail-lists__loading">
          <i class="pi pi-spin pi-spinner" />
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<style scoped>
.anime-detail-lists {
  margin-top: var(--space-8);
  padding: var(--space-6);
  background: var(--bg-card);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.anime-detail-lists__selector {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.anime-detail-lists__selector :deep(.p-selectbutton) {
  display: flex;
  flex-wrap: wrap;
}

.anime-detail-lists__actions {
  display: flex;
  gap: var(--space-3);
}

.anime-detail-lists__rating {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.anime-detail-lists__rating-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.anime-detail-lists__loading {
  display: flex;
  justify-content: center;
  padding: var(--space-4);
  color: var(--text-muted);
}
</style>
