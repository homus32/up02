<script setup lang="ts">
const { isLoggedIn, username } = useAuth()
const route = useRoute()
const { searchQuery, onSearchSubmit } = useHeaderSearch()
</script>

<template>
  <header class="header">
    <div class="header__inner container">
      <NuxtLink to="/" class="header__logo">
        AnimeBaza
      </NuxtLink>

      <nav class="header__nav">
        <NuxtLink to="/" class="header__link" :class="{ 'header__link_active': route.path === '/' }">
          <i class="pi pi-th-large header__link-icon" aria-hidden="true"></i>
          Каталог
        </NuxtLink>
        <NuxtLink
          v-if="isLoggedIn"
          to="/profile"
          class="header__link"
          :class="{ 'header__link_active': route.path === '/profile' }"
        >
          <i class="pi pi-user header__link-icon" aria-hidden="true"></i>
          {{ username }}
        </NuxtLink>
        <NuxtLink
          v-else
          to="/login"
          class="header__link"
          :class="{ 'header__link_active': route.path === '/login' }"
        >
          <i class="pi pi-user header__link-icon" aria-hidden="true"></i>
          Войти
        </NuxtLink>
      </nav>

      <div class="header__search">
        <form @submit.prevent="onSearchSubmit" class="header__search-form">
          <div class="header__search-wrapper">
            <i class="pi pi-search header__search-icon" aria-hidden="true"></i>
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Поиск аниме..."
              class="header__search-input"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="header__search-clear"
              @click="searchQuery = ''; onSearchSubmit()"
              aria-label="Очистить поиск"
            >
              ×
            </button>
          </div>
        </form>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Header */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg-page);
  border-bottom: 1px solid var(--border-color);
  backdrop-filter: blur(8px);
}

.header__inner {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  height: var(--header-height);
}

.header__logo {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--accent-cyan);
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
}

.header__logo:hover {
  color: var(--accent-cyan);
  text-decoration: none;
}

.header__nav {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.header__link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  text-decoration: none;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
}

.header__link-icon {
  font-size: 0.9rem;
}

.header__link:hover {
  color: var(--text-primary);
  background: var(--bg-card);
  text-decoration: none;
}

.header__link_active {
  color: var(--accent-cyan);
  background: rgba(0, 200, 255, 0.08);
}

.header__search {
  flex: 1;
  max-width: 360px;
  margin-left: auto;
}

.header__search-form {
  width: 100%;
}

.header__search-wrapper {
  position: relative;
  width: 100%;
}

.header__search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-size: 0.85rem;
  pointer-events: none;
}

.header__search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 2px 6px;
  line-height: 1;
  border-radius: 50%;
  transition: color var(--transition-fast);
}

.header__search-clear:hover {
  color: var(--text-primary);
}

.header__search-input {
  width: 100%;
  padding: var(--space-2) var(--space-4) var(--space-2) calc(var(--space-4) + 22px);
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-family: inherit;
  transition: border-color var(--transition-fast);
}

.header__search-input::placeholder {
  color: var(--text-muted);
}

.header__search-input:focus {
  outline: none;
  border-color: var(--accent-cyan);
}

/* Mobile */
@media (max-width: 768px) {
  .header__inner {
    flex-wrap: wrap;
    height: auto;
    padding: var(--space-3) var(--space-4);
    gap: var(--space-3);
  }

  .header__search {
    order: 3;
    flex: 0 0 100%;
    max-width: 100%;
  }

  .header__nav {
    margin-left: auto;
  }
}
</style>
