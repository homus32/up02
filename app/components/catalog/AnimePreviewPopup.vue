<script setup lang="ts">
import type { Anime, UserListStatus } from '~/types/anime'
import { useMediaQuery } from '@vueuse/core'
import PopupContent from './PopupContent.vue'

const props = defineProps<{
  anime: Anime | null
  isInList: boolean
  listStatus?: UserListStatus | null
  position: DOMRect | null
}>()

const emit = defineEmits<{
  'add-to-list': [animeId: string, status: UserListStatus]
  navigate: [animeId: string]
  hide: []
  mouseenter: []
  mouseleave: []
}>()

/** Desktop close button — скрываем попап через emit */
function closePopup() {
  emit('hide')
}

const isMobile = useMediaQuery('(max-width: 767px)')

const POPUP_WIDTH = 320
const H_GAP = 12
const EDGE_PADDING = 40
const ESTIMATED_HEIGHT = 400
const VERT_OFFSET = ESTIMATED_HEIGHT * 0.4 // 80px — 20% от высоты попапа

/** Desktop — вычисляем позицию относительно карточки */
const popupStyle = computed(() => {
  if (!props.position || isMobile.value) return {}

  const card = props.position

  // === Горизонталь: справа от карточки, если влезает ===
  let left = card.right + H_GAP
  if (left + POPUP_WIDTH > window.innerWidth) {
    left = card.left - POPUP_WIDTH - H_GAP
  }
  left = Math.max(left, EDGE_PADDING)

  // === Вертикаль ===
  const preferredTop = card.top + VERT_OFFSET
  const overflowsBottom = preferredTop + ESTIMATED_HEIGHT > window.innerHeight - EDGE_PADDING

  // Если попап не влезает снизу — прижимаем к нижнему краю (+40px), чтобы кнопки были видны
  if (overflowsBottom) {
    return {
      position: 'fixed',
      left: `${left}px`,
      bottom: `${EDGE_PADDING}px`,
      zIndex: 1000,
      maxWidth: `${POPUP_WIDTH}px`,
      maxHeight: `calc(100vh - ${EDGE_PADDING * 2}px)`,
      overflowY: 'auto',
    } as const
  }

  // Влезает — позиционируем под карточкой
  return {
    position: 'fixed',
    left: `${left}px`,
    top: `${Math.max(preferredTop, EDGE_PADDING)}px`,
    zIndex: 1000,
    maxWidth: `${POPUP_WIDTH}px`,
  } as const
})

/** Показываем если есть аниме и позиция (десктоп) или просто есть аниме (мобильный) */
const canShow = computed(() => props.anime && (isMobile.value || props.position))
</script>

<template>
  <Teleport to="body">
    <Transition name="preview-popup">
      <div
        v-if="canShow"
        :class="['preview-popup', { 'preview-popup_mobile': isMobile }]"
        :style="isMobile ? {} : popupStyle"
        @mouseenter="$emit('mouseenter')"
        @mouseleave="$emit('mouseleave')"
      >
        <!-- Mobile bottom sheet header -->
        <div v-if="isMobile" class="preview-popup__handle" />

        <!-- Desktop close button -->
        <button
          v-else
          class="preview-popup__close"
          @click="closePopup"
          aria-label="Закрыть"
        >
          <i class="pi pi-times" />
        </button>

        <PopupContent
          v-if="anime"
          :anime="anime"
          :is-in-list="isInList"
          :list-status="listStatus"
          @add-to-list="emit('add-to-list', $event)"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ====== Desktop popup ====== */
.preview-popup {
  background: var(--bg-card, #1a1a2e);
  border: 1px solid var(--border-color, #2a2a4a);
  border-radius: var(--border-radius-lg, 12px);
  box-shadow: var(--shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.4));
  width: 100%;
  overflow: hidden;
  pointer-events: auto;
  padding: 20px;
}

.preview-popup__close {
  position: absolute;
  top: var(--space-2, 8px);
  right: var(--space-2, 8px);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: color-mix(in srgb, var(--bg-page, #0f0f1a) 70%, transparent);
  color: var(--text-secondary, #9898b8);
  border-radius: 50%;
  cursor: pointer;
  z-index: 1;
  font-size: var(--text-sm, 14px);
  backdrop-filter: blur(4px);
  transition: background var(--transition-fast, 150ms), color var(--transition-fast, 150ms);
}

.preview-popup__close:hover {
  background: var(--bg-surface, #1e1e38);
  color: var(--text-primary, #e8e8f0);
}

/* ====== Mobile bottom sheet ====== */
.preview-popup_mobile {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  max-height: 80vh;
  overflow-y: auto;
  border-radius: var(--border-radius-lg, 12px) var(--border-radius-lg, 12px) 0 0;
  border-bottom: none;
  padding: 20px;
}

.preview-popup__handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--text-muted, #9999bb);
  margin: var(--space-2, 8px) auto;
  opacity: 0.4;
}

/* ====== Transition animation ====== */
.preview-popup-enter-active {
  transition: opacity var(--transition-normal, 200ms) ease-out,
              transform var(--transition-normal, 200ms) ease-out;
}

.preview-popup-leave-active {
  transition: opacity var(--transition-fast, 150ms) ease-in,
              transform var(--transition-fast, 150ms) ease-in;
}

.preview-popup-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.preview-popup-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Mobile animation — slide up */
.preview-popup_mobile.preview-popup-enter-from {
  transform: translateY(100%);
}

.preview-popup_mobile.preview-popup-leave-to {
  transform: translateY(100%);
}
</style>
