<script setup lang="ts">
import type { UserListStatus } from '~/types/anime'
import { USER_LIST_STATUSES, USER_LIST_LABELS } from '~/types/anime'

const props = defineProps<{
  animeId: string
  isInList: boolean
  listStatus?: UserListStatus | null
  size?: 'small' | 'normal'
}>()

const emit = defineEmits<{
  'add-to-list': [animeId: string, status: UserListStatus]
  'remove-from-list': [animeId: string]
}>()

// ── Status -> severity ──
const statusSeverity: Record<UserListStatus, 'info' | 'success' | 'warn' | 'danger' | 'contrast'> = {
  planned: 'info',
  watching: 'success',
  completed: 'contrast',
  on_hold: 'warn',
  dropped: 'danger',
}

// ── Status -> icon ──
const statusIcon: Record<UserListStatus, string> = {
  planned: 'pi pi-clock',
  watching: 'pi pi-play',
  completed: 'pi pi-check-circle',
  on_hold: 'pi pi-pause',
  dropped: 'pi pi-ban',
}

// Button appearance based on list status
const buttonSeverity = computed(() => {
  if (!props.isInList || !props.listStatus) return 'secondary'
  return statusSeverity[props.listStatus]
})

const buttonIcon = computed(() => {
  if (!props.isInList || !props.listStatus) return 'pi pi-bookmark'
  return statusIcon[props.listStatus]
})

const buttonLabel = computed(() => {
  if (!props.isInList || !props.listStatus) return 'В список'
  return USER_LIST_LABELS[props.listStatus]
})

// Dropdown menu items
const menuItems = computed(() => {
  const items = USER_LIST_STATUSES.map(status => ({
    label: USER_LIST_LABELS[status],
    icon: statusIcon[status],
    command: () => {
      emit('add-to-list', props.animeId, status)
    },
  }))

  if (props.isInList) {
    items.push(
      { separator: true },
      {
        label: 'Убрать из списка',
        icon: 'pi pi-trash',
        command: () => {
          emit('remove-from-list', props.animeId)
        },
      },
    )
  }

  return items
})

const isDefault = computed(() => !props.isInList || !props.listStatus)

// Default action
function handleDefaultAction() {
  if (props.isInList) return
  emit('add-to-list', props.animeId, 'planned')
}
</script>

<template>
  <PSplitButton
    :label="buttonLabel"
    :icon="buttonIcon"
    :model="menuItems"
    :severity="buttonSeverity"
    :outlined="isDefault"
    :class="{ 'anime-list-button_default': isDefault }"
    :size="size === 'small' ? 'small' : undefined"
    fluid
    @click="handleDefaultAction"
  />
</template>

<style scoped>
.anime-list-button_default {
  --p-button-outlined-secondary-color: var(--accent-cyan, #00d4ff);
  --p-button-outlined-secondary-border-color: var(--accent-cyan, #00d4ff);
  --p-button-outlined-secondary-hover-background: color-mix(in srgb, var(--accent-cyan, #00d4ff) 10%, transparent);
  --p-button-outlined-secondary-active-background: color-mix(in srgb, var(--accent-cyan, #00d4ff) 16%, transparent);
}
</style>
