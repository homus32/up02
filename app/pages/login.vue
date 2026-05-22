<script setup lang="ts">
const { isLoggedIn, login } = useAuth()
const router = useRouter()

const usernameInput = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

onMounted(() => {
  if (isLoggedIn.value) {
    router.push('/profile')
  }
})

function validateForm(): boolean {
  if (!usernameInput.value.trim()) {
    errorMessage.value = 'Введите имя пользователя'
    return false
  }
  if (usernameInput.value.trim().length < 2) {
    errorMessage.value = 'Имя должно содержать минимум 2 символа'
    return false
  }
  errorMessage.value = ''
  return true
}

async function handleLogin() {
  if (!validateForm()) return

  isSubmitting.value = true
  try {
    login(usernameInput.value.trim())
    await router.push('/profile')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-page__card">
      <div class="login-page__header">
        <h1 class="login-page__title">AnimeBaza</h1>
        <p class="login-page__subtitle">
          Ваш персональный каталог аниме
        </p>
      </div>

      <form class="login-page__form" @submit.prevent="handleLogin">
        <div class="login-page__field">
          <label for="username" class="login-page__label">
            Имя пользователя
          </label>
          <PInputText
            id="username"
            v-model="usernameInput"
            type="text"
            placeholder="Введите имя"
            class="login-page__input"
            :disabled="isSubmitting"
            @input="errorMessage = ''"
          />
          <small v-if="errorMessage" class="login-page__error">
            {{ errorMessage }}
          </small>
        </div>

        <PButton
          type="submit"
          label="Войти"
          class="login-page__button"
          :loading="isSubmitting"
        />
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - var(--header-height) - 80px);
  padding: var(--space-6);
}

.login-page__card {
  width: 100%;
  max-width: 400px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-xl);
  padding: var(--space-10) var(--space-8);
  box-shadow: var(--shadow-lg);

  animation: login-card-enter 400ms ease-out both;
}

@keyframes login-card-enter {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-page__header {
  text-align: center;
  margin-bottom: var(--space-8);
}

.login-page__title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--accent-cyan);
  margin-bottom: var(--space-2);
  letter-spacing: -0.02em;
}

.login-page__subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.login-page__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.login-page__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.login-page__label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.login-page__input {
  width: 100%;
}

.login-page__error {
  color: var(--color-error);
  font-size: var(--text-xs);
}

.login-page__button {
  width: 100%;
  margin-top: var(--space-2);
}

@media (max-width: 480px) {
  .login-page {
    padding: var(--space-4);
    align-items: flex-start;
    padding-top: var(--space-12);
  }

  .login-page__card {
    padding: var(--space-6) var(--space-5);
  }
}
</style>