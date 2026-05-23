<template>
  <div class="skeleton-anime-detail">
    <div class="skeleton-anime-detail__container container">
      <!-- Hero section -->
      <div class="skeleton-anime-detail__hero">
        <div class="skeleton-anime-detail__hero-grid">
          <!-- Poster skeleton -->
          <div class="skeleton-anime-detail__poster" />

          <!-- Info skeleton -->
          <div class="skeleton-anime-detail__info">
            <div class="skeleton-anime-detail__title" />
            <div class="skeleton-anime-detail__subtitle" />

            <!-- Badges skeleton -->
            <div class="skeleton-anime-detail__badges">
              <div class="skeleton-anime-detail__badge" />
              <div class="skeleton-anime-detail__badge" />
            </div>

            <!-- Score skeleton -->
            <div class="skeleton-anime-detail__score" />

            <!-- Meta grid skeleton -->
            <div class="skeleton-anime-detail__meta">
              <div class="skeleton-anime-detail__meta-item" />
              <div class="skeleton-anime-detail__meta-item" />
              <div class="skeleton-anime-detail__meta-item" />
              <div class="skeleton-anime-detail__meta-item" />
            </div>

            <!-- Genres skeleton -->
            <div class="skeleton-anime-detail__genres">
              <div class="skeleton-anime-detail__chip" />
              <div class="skeleton-anime-detail__chip" />
              <div class="skeleton-anime-detail__chip" />
            </div>

            <!-- Description lines skeleton -->
            <div class="skeleton-anime-detail__description">
              <div class="skeleton-anime-detail__line skeleton-anime-detail__line_medium" />
              <div class="skeleton-anime-detail__line skeleton-anime-detail__line_long" />
              <div class="skeleton-anime-detail__line skeleton-anime-detail__line_short" />
            </div>
          </div>
        </div>
      </div>

      <!-- Player placeholder skeleton -->
      <div class="skeleton-anime-detail__player">
        <div class="skeleton-anime-detail__player-inner">
          <div class="skeleton-anime-detail__player-circle" />
          <div class="skeleton-anime-detail__player-text" />
        </div>
      </div>

      <!-- Lists section skeleton (placeholder — will be redesigned) -->
      <div class="skeleton-anime-detail__lists">
        <div class="skeleton-anime-detail__lists-block">
          <div class="skeleton-anime-detail__button" />
          <div class="skeleton-anime-detail__button" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-anime-detail {
  padding: var(--space-8) 0;
}

.skeleton-anime-detail__container {
  max-width: 960px;
}

/* === Hero section === */
.skeleton-anime-detail__hero-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--space-8);
  align-items: start;
}

/* Poster */
.skeleton-anime-detail__poster {
  aspect-ratio: 3 / 4;
  border-radius: var(--border-radius-lg);
  background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-elevated) 50%, var(--bg-card) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  position: sticky;
  top: calc(var(--header-height) + var(--space-6));
}

/* Info column */
.skeleton-anime-detail__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.skeleton-anime-detail__title {
  width: 70%;
  height: 32px;
  background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-elevated) 50%, var(--bg-card) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: var(--border-radius-sm);
}

.skeleton-anime-detail__subtitle {
  width: 50%;
  height: 20px;
  background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-elevated) 50%, var(--bg-card) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: var(--border-radius-sm);
  margin-top: calc(var(--space-1) * -1);
}

/* Badges */
.skeleton-anime-detail__badges {
  display: flex;
  gap: var(--space-2);
}

.skeleton-anime-detail__badge {
  width: 60px;
  height: 24px;
  border-radius: var(--border-radius-sm);
  background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-elevated) 50%, var(--bg-card) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

/* Score */
.skeleton-anime-detail__score {
  width: 140px;
  height: 28px;
  border-radius: var(--border-radius-sm);
  background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-elevated) 50%, var(--bg-card) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

/* Meta grid */
.skeleton-anime-detail__meta {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3) var(--space-6);
  padding: var(--space-4);
  background: var(--bg-card);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
}

.skeleton-anime-detail__meta-item {
  height: 36px;
  border-radius: var(--border-radius-sm);
  background: linear-gradient(90deg, var(--bg-elevated) 25%, rgba(255, 255, 255, 0.03) 50%, var(--bg-elevated) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

/* Genres */
.skeleton-anime-detail__genres {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.skeleton-anime-detail__chip {
  width: 80px;
  height: 28px;
  border-radius: 14px;
  background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-elevated) 50%, var(--bg-card) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

/* Description */
.skeleton-anime-detail__description {
  padding: var(--space-4);
  background: var(--bg-card);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
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

/* === Player placeholder skeleton === */
.skeleton-anime-detail__player {
  margin-top: var(--space-8);
}

.skeleton-anime-detail__player-inner {
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

.skeleton-anime-detail__player-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(90deg, var(--bg-elevated) 25%, rgba(255, 255, 255, 0.03) 50%, var(--bg-elevated) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

.skeleton-anime-detail__player-text {
  width: 200px;
  height: 16px;
  border-radius: var(--border-radius-sm);
  background: linear-gradient(90deg, var(--bg-elevated) 25%, rgba(255, 255, 255, 0.03) 50%, var(--bg-elevated) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

/* === Lists section skeleton === */
.skeleton-anime-detail__lists {
  margin-top: var(--space-8);
  padding: var(--space-6);
  background: var(--bg-card);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--border-color);
}

.skeleton-anime-detail__lists-block {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.skeleton-anime-detail__button {
  width: 100px;
  height: 36px;
  border-radius: var(--border-radius-sm);
  background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-elevated) 50%, var(--bg-card) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

/* === Responsive === */
@media (max-width: 768px) {
  .skeleton-anime-detail {
    padding: var(--space-6) 0;
  }

  .skeleton-anime-detail__hero-grid {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }

  .skeleton-anime-detail__poster {
    position: static;
    max-height: 400px;
    aspect-ratio: 2 / 3;
    width: 50%;
    margin: 0 auto;
  }

  .skeleton-anime-detail__meta {
    grid-template-columns: 1fr 1fr;
  }


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
