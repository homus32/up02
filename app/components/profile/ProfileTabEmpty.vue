<template>
  <div class="profile-tab-empty">
    <i class="pi pi-inbox profile-tab-empty__icon" />
    <p class="profile-tab-empty__text">Здесь пока ничего нет</p>
    <NuxtLink to="/" class="profile-tab-empty__link">
      Перейти в каталог
    </NuxtLink>
  </div>
</template>

<style scoped>
.profile-tab-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12) var(--space-6);
  text-align: center;
}

.profile-tab-empty__icon {
  font-size: 3rem;
  color: var(--text-muted);
  margin-bottom: var(--space-4);
}

.profile-tab-empty__text {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin-bottom: var(--space-4);
}

.profile-tab-empty__link {
  color: var(--accent-cyan);
  font-size: var(--text-sm);
  text-decoration: none;
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--accent-cyan);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
}

.profile-tab-empty__link:hover {
  background: var(--accent-cyan);
  color: var(--text-inverse);
  text-decoration: none;
}
</style>
