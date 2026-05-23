import { ref, onUnmounted } from 'vue'
import type { Anime } from '~/types/anime'

/**
 * usePopupHover — hover bridge composable для превью-попапа каталога.
 *
 * Управляет:
 * - Задержкой показа (300ms) — чтобы не дёргать попап при быстром скольжении по карточкам
 * - Grace-периодом скрытия (150ms) — чтобы пользователь успел переместить мышь с карточки на попап
 * - Позиционированием: запоминает `getBoundingClientRect` карточки для расчёта позиции
 * - Clean-up таймеров при unmount
 */
export function usePopupHover() {
  const selectedAnime = ref<Anime | null>(null)
  const isVisible = ref(false)
  const popupRect = ref<DOMRect | null>(null)

  /** Храним ссылку на DOM-элемент карточки, чтобы прочитать rect только после таймера */
  let targetElement: HTMLElement | null = null

  let showTimer: ReturnType<typeof setTimeout> | null = null
  let hideTimer: ReturnType<typeof setTimeout> | null = null

  const SHOW_DELAY = 300
  const HIDE_DELAY = 150

  /** Вызывается при mouseenter на карточку аниме */
  function onCardEnter(anime: Anime, event: MouseEvent) {
    targetElement = event.currentTarget as HTMLElement

    // Отменяем pending hide (мышь вернулась на карточку до скрытия)
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }

    // Если уже показываем это аниме — не перезапускаем таймер
    if (isVisible.value && selectedAnime.value?.id === anime.id) return

    // Запускаем таймер показа. Позиция и контент обновятся ОДНОВРЕМЕННО
    if (showTimer) clearTimeout(showTimer)
    showTimer = setTimeout(() => {
      popupRect.value = targetElement?.getBoundingClientRect() ?? null
      selectedAnime.value = anime
      isVisible.value = true
      showTimer = null
    }, SHOW_DELAY)
  }

  /** Вызывается при mouseleave с карточки аниме */
  function onCardLeave() {
    cancelShow()
    startHideGrace()
  }

  /** Вызывается при mouseenter на сам попап — отменяет скрытие */
  function onPopupEnter() {
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
  }

  /** Вызывается при mouseleave с попапа */
  function onPopupLeave() {
    startHideGrace()
  }

  /** Немедленно показать попап (используется для явного открытия) */
  function show(anime: Anime, rect: DOMRect) {
    cancelShow()
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
    popupRect.value = rect
    selectedAnime.value = anime
    isVisible.value = true
  }

  /** Немедленно скрыть попап */
  function hide() {
    cancelShow()
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
    isVisible.value = false
    selectedAnime.value = null
    popupRect.value = null
  }

  /** Обновить позицию попапа (при resize/scroll) */
  function refreshPosition(rect: DOMRect) {
    popupRect.value = rect
  }

  function startHideGrace() {
    if (hideTimer) clearTimeout(hideTimer)
    hideTimer = setTimeout(() => {
      isVisible.value = false
      selectedAnime.value = null
      popupRect.value = null
      hideTimer = null
    }, HIDE_DELAY)
  }

  function cancelShow() {
    if (showTimer) {
      clearTimeout(showTimer)
      showTimer = null
    }
  }

  // Clean up таймеров при уничтожении компонента
  onUnmounted(() => {
    if (showTimer) clearTimeout(showTimer)
    if (hideTimer) clearTimeout(hideTimer)
  })

  return {
    selectedAnime,
    isVisible,
    popupRect,
    onCardEnter,
    onCardLeave,
    onPopupEnter,
    onPopupLeave,
    show,
    hide,
    refreshPosition,
  }
}
