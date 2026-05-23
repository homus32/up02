<script setup lang="ts">
withDefaults(defineProps<{
  count?: number
}>(), {
  count: 20,
})
</script>

<template>
  <div class="skeleton-catalog-grid">
    <div v-for="n in count" :key="n" class="skeleton-card">
      <div class="skeleton-card__poster" />
      <div class="skeleton-card__body">
        <div class="skeleton-card__title" />
        <div class="skeleton-card__subtitle" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-5);
}
</style>
