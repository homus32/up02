<template>
  <div class="skeleton-anime-detail">
    <div class="skeleton-anime-detail__poster" />
    <div class="skeleton-anime-detail__info">
      <div class="skeleton-anime-detail__title" />
      <div class="skeleton-anime-detail__subtitle" />
      <div class="skeleton-anime-detail__lines">
        <div class="skeleton-anime-detail__line skeleton-anime-detail__line_medium" />
        <div class="skeleton-anime-detail__line skeleton-anime-detail__line_long" />
        <div class="skeleton-anime-detail__line skeleton-anime-detail__line_short" />
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
  background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-elevated) 50%, var(--bg-card) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

.skeleton-anime-detail__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-4);
}

.skeleton-anime-detail__title {
  width: 70%;
  height: 28px;
  background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-elevated) 50%, var(--bg-card) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: var(--border-radius-sm);
}

.skeleton-anime-detail__subtitle {
  width: 50%;
  height: 18px;
  background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-elevated) 50%, var(--bg-card) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: var(--border-radius-sm);
  margin-top: 0.5rem;
}

.skeleton-anime-detail__lines {
  margin-top: 1.5rem;
}

.skeleton-anime-detail__line {
  background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-elevated) 50%, var(--bg-card) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: var(--border-radius-sm);
}

.skeleton-anime-detail__line + .skeleton-anime-detail__line {
  margin-top: 0.75rem;
}

.skeleton-anime-detail__line_medium {
  width: 40%;
  height: 14px;
}

.skeleton-anime-detail__line_long {
  width: 60%;
  height: 12px;
}

.skeleton-anime-detail__line_short {
  width: 30%;
  height: 14px;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
