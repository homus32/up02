<script setup lang="ts">
interface CatalogFiltersState {
  kind: string
  status: string
  season: string
  sort: string
}

const props = defineProps<{
  modelValue: CatalogFiltersState
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CatalogFiltersState]
  change: []
}>()

const kindOptions = [
  { label: 'Все', value: 'all' },
  { label: 'TV', value: 'tv' },
  { label: 'Movie', value: 'movie' },
  { label: 'OVA', value: 'ova' },
  { label: 'ONA', value: 'ona' },
  { label: 'Special', value: 'special' },
]

const statusOptions = [
  { label: 'Все', value: 'all' },
  { label: 'Онгоинг', value: 'ongoing' },
  { label: 'Вышел', value: 'released' },
  { label: 'Анонс', value: 'anons' },
]

const sortOptions = [
  { label: 'По рейтингу', value: 'ranked' },
  { label: 'По популярности', value: 'popularity' },
  { label: 'По названию', value: 'name' },
  { label: 'По дате', value: 'aired_on' },
  { label: 'По эпизодам', value: 'episodes' },
]

const seasons = ['winter', 'spring', 'summer', 'autumn'] as const
const seasonLabels: Record<string, string> = { winter: 'Зима', spring: 'Весна', summer: 'Лето', autumn: 'Осень' }
const currentYear = new Date().getFullYear()

const seasonOptions = computed(() => {
  const options: { label: string; value: string }[] = [{ label: 'Все сезоны', value: 'all' }]
  for (let year = currentYear; year >= currentYear - 3; year--) {
    for (const season of seasons) {
      options.push({ label: `${seasonLabels[season]} ${year}`, value: `${season}_${year}` })
    }
  }
  return options
})

function update(field: keyof CatalogFiltersState, value: string) {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
  emit('change')
}

const selectedKind = computed({
  get: () => props.modelValue.kind,
  set: (val) => update('kind', val),
})

const selectedStatus = computed({
  get: () => props.modelValue.status,
  set: (val) => update('status', val),
})

const selectedSeason = computed({
  get: () => props.modelValue.season,
  set: (val) => update('season', val),
})

const currentSort = computed({
  get: () => props.modelValue.sort,
  set: (val) => update('sort', val),
})
</script>

<template>
  <div class="catalog-filters">
    <!-- Тип -->
    <div class="catalog-filters__group">
      <label class="catalog-filters__label">Тип</label>
      <div class="catalog-filters__mobile-only">
        <PSelect
          v-model="selectedKind"
          :options="kindOptions"
          option-label="label"
          option-value="value"
          fluid
          class="catalog-filters__select"
        />
      </div>
      <div class="catalog-filters__desktop-only">
        <PSelectButton
          v-model="selectedKind"
          :options="kindOptions"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          class="catalog-filters__select"
        />
      </div>
    </div>

    <!-- Статус -->
    <div class="catalog-filters__group">
      <label class="catalog-filters__label">Статус</label>
      <div class="catalog-filters__mobile-only">
        <PSelect
          v-model="selectedStatus"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          fluid
          class="catalog-filters__select"
        />
      </div>
      <div class="catalog-filters__desktop-only">
        <PSelectButton
          v-model="selectedStatus"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          class="catalog-filters__select"
        />
      </div>
    </div>

    <!-- Сезон + Сортировка -->
    <div class="catalog-filters__row">
      <div class="catalog-filters__group catalog-filters__group_small">
        <label class="catalog-filters__label">Сезон</label>
        <PSelect
          v-model="selectedSeason"
          :options="seasonOptions"
          option-label="label"
          option-value="value"
          class="catalog-filters__select catalog-filters__select--season"
        />
      </div>

      <div class="catalog-filters__group catalog-filters__group_small">
        <label class="catalog-filters__label">Сортировка</label>
        <PSelect
          v-model="currentSort"
          :options="sortOptions"
          option-label="label"
          option-value="value"
          class="catalog-filters__select catalog-filters__select--sort"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.catalog-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
  align-items: flex-end;
}

.catalog-filters__group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.catalog-filters__group_small {
  min-width: 140px;
}

.catalog-filters__row {
  display: contents;
}

.catalog-filters__label {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* CSS-only mobile/desktop switch — no v-if, no SSR flash */
.catalog-filters__mobile-only {
  display: none;
}

.catalog-filters__desktop-only {
  display: block;
}

/* PSelect has root padding: 0 by default, compensate */
.catalog-filters__select {
  min-height: 42px;
}

@media (max-width: 767px) {
  .catalog-filters {
    flex-direction: column;
    gap: var(--space-3);
    align-items: stretch;
  }

  .catalog-filters__mobile-only {
    display: block;
  }

  .catalog-filters__desktop-only {
    display: none;
  }

  .catalog-filters__row {
    display: flex;
    flex-direction: row;
    gap: var(--space-3);
  }

  .catalog-filters__row .catalog-filters__group {
    flex: 1;
  }

  .catalog-filters__group_small {
    min-width: auto;
  }

  /* PSelect root padding fix on mobile — inner label has 8px 12px, root padding is 0 */
  .catalog-filters__select :deep(.p-select-label) {
    padding-block: 10px;
  }
}
</style>
