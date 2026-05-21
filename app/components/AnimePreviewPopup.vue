<script setup lang="ts">
import type { Anime, UserListStatus } from '~/types/anime'

const props = defineProps<{
  anime: Anime | null
  isInList: boolean
  listStatus?: UserListStatus | null
}>()

const emit = defineEmits<{
  'add-to-list': [animeId: string, status: UserListStatus]
  navigate: [animeId: string]
  hide: []
}>()

const isMobile = ref(false)
const overlayPanelRef = ref()
const dialogVisible = ref(false)

const onResize = () => { isMobile.value = window.innerWidth < 768 }
onMounted(() => {
  isMobile.value = window.innerWidth < 768
  window.addEventListener('resize', onResize)
})
onUnmounted(() => window.removeEventListener('resize', onResize))

// Watch anime prop: show/hide popup accordingly
watch(() => props.anime, (val) => {
  if (!val) {
    dialogVisible.value = false
  } else if (isMobile.value) {
    dialogVisible.value = true
  }
})

// Emit hide when mobile dialog is dismissed
watch(dialogVisible, (val) => {
  if (!val && props.anime) {
    emit('hide')
  }
})

function kindLabel(kind: string): string {
  const map: Record<string, string> = { tv: 'TV', movie: 'Movie', ova: 'OVA', ona: 'ONA', special: 'Special', music: 'Music' }
  return map[kind] || kind
}

/** Show the popup (desktop via OverlayPanel, mobile via Dialog) */
function show(event: MouseEvent) {
  if (!isMobile.value && overlayPanelRef.value) {
    overlayPanelRef.value.show(event)
  }
}

defineExpose({ show })
</script>

<template>
  <!-- Desktop OverlayPanel popup -->
  <ClientOnly>
    <OverlayPanel
      ref="overlayPanelRef"
      :breakpoints="{ '768px': '0px' }"
      class="anime-preview-popup__overlay"
      @hide="emit('hide')"
    >
      <template v-if="anime">
        <div class="popup">
          <div class="popup__header">
            <h4 class="popup__title">{{ anime.russian || anime.name }}</h4>
            <span v-if="anime.name !== anime.russian" class="popup__alt-title">
              {{ anime.name }}
            </span>
          </div>

          <div class="popup__meta">
            <span v-if="anime.airedOn?.year" class="popup__meta-item">
              {{ anime.airedOn.year }} г.
            </span>
            <span v-if="anime.episodes" class="popup__meta-item">
              {{ anime.episodesAired }}/{{ anime.episodes }} эп.
            </span>
            <span v-if="anime.duration" class="popup__meta-item">
              {{ anime.duration }} мин.
            </span>
            <Tag
              :value="kindLabel(anime.kind)"
              severity="secondary"
              class="popup__kind"
            />
          </div>

          <div v-if="anime.genres?.length" class="popup__genres">
            <Chip
              v-for="genre in anime.genres.slice(0, 4)"
              :key="genre.id"
              :label="genre.russian || genre.name"
              class="popup__genre"
            />
          </div>

          <p v-if="anime.description" class="popup__description">
            {{ anime.description.slice(0, 200) }}{{ anime.description.length > 200 ? '...' : '' }}
          </p>

          <div class="popup__actions">
            <Button
              :label="isInList ? 'В списке' : 'В список'"
              :icon="isInList ? 'pi pi-check' : 'pi pi-plus'"
              size="small"
              @click="emit('add-to-list', anime.id, 'planned')"
            />
            <Button
              label="Подробнее"
              icon="pi pi-arrow-right"
              size="small"
              severity="secondary"
              @click="emit('navigate', anime.id)"
            />
          </div>
        </div>
      </template>
    </OverlayPanel>
  </ClientOnly>

  <!-- Mobile Dialog popup -->
  <Dialog
    v-if="isMobile && anime"
    v-model:visible="dialogVisible"
    position="bottom"
    :style="{ width: '100%', maxHeight: '80vh' }"
    :dismissable-mask="true"
    :closable="true"
    header=" "
    class="anime-preview-popup__dialog"
  >
    <template v-if="anime">
      <div class="popup">
        <div class="popup__header">
          <h4 class="popup__title">{{ anime.russian || anime.name }}</h4>
          <span v-if="anime.name !== anime.russian" class="popup__alt-title">
            {{ anime.name }}
          </span>
        </div>

        <div class="popup__meta">
          <span v-if="anime.airedOn?.year" class="popup__meta-item">
            {{ anime.airedOn.year }} г.
          </span>
          <span v-if="anime.episodes" class="popup__meta-item">
            {{ anime.episodesAired }}/{{ anime.episodes }} эп.
          </span>
          <Tag
            :value="kindLabel(anime.kind)"
            severity="secondary"
            class="popup__kind"
          />
        </div>

        <div v-if="anime.genres?.length" class="popup__genres">
          <Chip
            v-for="genre in anime.genres.slice(0, 4)"
            :key="genre.id"
            :label="genre.russian || genre.name"
            class="popup__genre"
          />
        </div>

        <p v-if="anime.description" class="popup__description">
          {{ anime.description.slice(0, 150) }}{{ anime.description.length > 150 ? '...' : '' }}
        </p>

        <div class="popup__actions">
          <Button
            :label="isInList ? 'В списке' : 'В список'"
            :icon="isInList ? 'pi pi-check' : 'pi pi-plus'"
            @click="emit('add-to-list', anime.id, 'planned')"
          />
          <Button
            label="Подробнее"
            icon="pi pi-arrow-right"
            severity="secondary"
            @click="emit('navigate', anime.id)"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.anime-preview-popup__overlay {
  /* OverlayPanel styling is provided by PrimeVue tokens */
}

.anime-preview-popup__dialog {
  /* Dialog styling is provided by PrimeVue tokens */
}

.popup {
  padding: var(--space-1);
  max-width: 320px;
}

.popup__header {
  margin-bottom: var(--space-3);
}

.popup__title {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.popup__alt-title {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  display: block;
  margin-top: 2px;
}

.popup__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  margin-bottom: var(--space-3);
}

.popup__meta-item {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.popup__genres {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-bottom: var(--space-3);
}

.popup__genre {
  font-size: var(--text-xs) !important;
}

.popup__description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-4);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.popup__actions {
  display: flex;
  gap: var(--space-2);
}

@media (max-width: 768px) {
  .popup {
    max-width: 100%;
  }
}
</style>
