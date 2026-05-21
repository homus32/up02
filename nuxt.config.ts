// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from '@primeuix/themes/aura'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  components: [
    { path: '~/components', pathPrefix: false },
  ],

  modules: ['@primevue/nuxt-module', '@vueuse/nuxt', 'nuxt-mcp-dev'],

  css: ['~/assets/css/theme.css'],

  primevue: {
    options: {
      theme: {
        preset: Aura,
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
