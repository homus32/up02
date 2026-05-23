<template>
  <div class="player-placeholder">
    <div class="player-placeholder__inner">
      <i class="pi pi-play-circle player-placeholder__icon" />
      <span class="player-placeholder__text">Видео временно недоступно</span>
    </div>
  </div>
</template>

<style scoped>
.player-placeholder {
  margin-top: var(--space-8);
}

.player-placeholder__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  aspect-ratio: 16 / 9;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
}

.player-placeholder__icon {
  font-size: 4rem;
  color: var(--text-muted);
}

.player-placeholder__text {
  font-size: var(--text-base);
  color: var(--text-muted);
}
</style>
