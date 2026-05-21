<template>
  <div class="skeleton-anime-detail">
    <div class="skeleton-anime-detail__poster skeleton-card__poster" />
    <div class="skeleton-anime-detail__info">
      <div class="skeleton-card__title" style="width: 70%; height: 28px;" />
      <div class="skeleton-card__subtitle" style="width: 50%; height: 18px; margin-top: 0.5rem;" />
      <div style="margin-top: 1.5rem;">
        <div class="skeleton-card__title" style="width: 40%; height: 14px;" />
        <div class="skeleton-card__subtitle" style="width: 60%; height: 12px; margin-top: 0.75rem;" />
        <div class="skeleton-card__title" style="width: 30%; height: 14px; margin-top: 0.75rem;" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-anime-detail {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--space-8);
}

.skeleton-anime-detail__poster {
  aspect-ratio: 3 / 4;
  border-radius: var(--border-radius-lg);
}

.skeleton-anime-detail__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-4);
}
</style>
