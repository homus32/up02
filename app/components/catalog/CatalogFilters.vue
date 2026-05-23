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
  { label: 'Все', value: '' },
  { label: 'TV', value: 'tv' },
  { label: 'Movie', value: 'movie' },
  { label: 'OVA', value: 'ova' },
  { label: 'ONA', value: 'ona' },
  { label: 'Special', value: 'special' },
]

const statusOptions = [
  { label: 'Все', value: '' },
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
  const options: { label: string; value: string }[] = [{ label: 'Все сезоны', value: '' }]
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
    <div class="catalog-filters__group">
      <label class="catalog-filters__label">Тип</label>
      <PSelectButton
        v-model="selectedKind"
        :options="kindOptions"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        class="catalog-filters__select"
      />
    </div>

    <div class="catalog-filters__group">
      <label class="catalog-filters__label">Статус</label>
      <PSelectButton
        v-model="selectedStatus"
        :options="statusOptions"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        class="catalog-filters__select"
      />
    </div>

    <div class="catalog-filters__group catalog-filters__group_small">
      <label class="catalog-filters__label">Сезон</label>
      <PSelect
        v-model="selectedSeason"
        :options="seasonOptions"
        option-label="label"
        option-value="value"
        class="catalog-filters__select"
      />
    </div>

    <div class="catalog-filters__group catalog-filters__group_small">
      <label class="catalog-filters__label">Сортировка</label>
      <PSelect
        v-model="currentSort"
        :options="sortOptions"
        option-label="label"
        option-value="value"
        class="catalog-filters__select"
      />
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

.catalog-filters__label {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

@media (max-width: 768px) {
  .catalog-filters {
    flex-direction: column;
    gap: var(--space-3);
  }

  .catalog-filters__group_small {
    min-width: auto;
  }
}
</style>
