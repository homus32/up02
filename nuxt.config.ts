// https://nuxt.com/docs/api/configuration/nuxt-config
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@primevue/nuxt-module', 'nuxt-mcp-dev'],

  css: ['~/assets/css/theme.css'],

  primevue: {
    usePrimeVue: true,
    autoImport: true,
    options: {
      theme: {
        preset: 'aura',
        options: {
          darkModeSelector: '.dark-mode',
        },
      },
    },
  },

  runtimeConfig: {
    shikimori: {
      apiUrl: 'https://shikimori.io/api/graphql',
    },
  },

  routeRules: {
    '/profile': { ssr: false },
    '/api/**': { cache: { maxAge: 60 * 5 } },
  },
})
