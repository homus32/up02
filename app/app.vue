<script setup lang="ts">
const { isLoggedIn, username } = useAuth()
const route = useRoute()
const router = useRouter()

const searchQuery = ref('')
const isMobile = ref(false)

function onSearchSubmit() {
  if (searchQuery.value.trim()) {
    router.push({ path: '/', query: { search: searchQuery.value.trim() } })
  }
}

onMounted(() => {
  if (route.query.search) {
    searchQuery.value = route.query.search as string
  }
  isMobile.value = window.innerWidth < 768
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 768
  })
})
</script>

<template>
  <div class="layout">
    <header class="header">
      <div class="header__inner container">
        <NuxtLink to="/" class="header__logo">
          AnimeBaza
        </NuxtLink>

        <nav class="header__nav">
          <NuxtLink to="/" class="header__link" :class="{ 'header__link_active': route.path === '/' }">
            Каталог
          </NuxtLink>
          <NuxtLink
            v-if="isLoggedIn"
            to="/profile"
            class="header__link"
            :class="{ 'header__link_active': route.path === '/profile' }"
          >
            {{ username }}
          </NuxtLink>
          <NuxtLink
            v-else
            to="/login"
            class="header__link"
            :class="{ 'header__link_active': route.path === '/login' }"
          >
            Войти
          </NuxtLink>
        </nav>

        <div class="header__search">
          <form @submit.prevent="onSearchSubmit" class="header__search-form">
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Поиск аниме..."
              class="header__search-input"
              @input="onSearchSubmit"
            />
          </form>
        </div>
      </div>
    </header>

    <main class="main">
      <NuxtPage />
    </main>

    <footer class="footer">
      <div class="footer__inner container">
        <p class="footer__text">
          AnimeBaza — учебный проект УП.02
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

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
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  text-decoration: none;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
}

.header__link:hover {
  color: var(--text-primary);
  background: var(--bg-card);
  text-decoration: none;
}

.header__link_active {
  color: var(--accent-cyan);
}

.header__search {
  flex: 1;
  max-width: 360px;
  margin-left: auto;
}

.header__search-form {
  width: 100%;
}

.header__search-input {
  width: 100%;
  padding: var(--space-2) var(--space-4);
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

/* Main */
.main {
  flex: 1;
}

/* Footer */
.footer {
  border-top: 1px solid var(--border-color);
  padding: var(--space-6) 0;
  margin-top: auto;
}

.footer__inner {
  display: flex;
  justify-content: center;
}

.footer__text {
  color: var(--text-muted);
  font-size: var(--text-sm);
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
