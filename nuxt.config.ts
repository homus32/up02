// https://nuxt.com/docs/api/configuration/nuxt-config
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

const AnimeBazaPreset = definePreset(Aura, {
  semantic: {
    colorScheme: {
      dark: {
        primary: {
          color: '{cyan.400}',
          contrastColor: '#0f0f1a',
          hoverColor: '{cyan.300}',
          activeColor: '{cyan.200}',
        },
        formField: {
          background: '#1e1e38',
          borderColor: '#2a2a4a',
          hoverBorderColor: '{primary.color}',
          focusBorderColor: '{primary.color}',
        },
        content: {
          background: '#0f0f1a',
          borderColor: '#2a2a4a',
        },
      },
    },
  },
  components: {
    card: {
      colorScheme: {
        dark: {
          root: {
            background: '#1a1a2e',
            borderRadius: '12px',
          },
        },
      },
    },
    chip: {
      colorScheme: {
        dark: {
          root: {
            background: '#222240',
            color: '#9898b8',
          },
        },
      },
    },
    button: {
      root: {
        label: {
          fontWeight: '600',
        },
      },
    },
  },
})

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  devServer: { host: '0.0.0.0' },

  components: [
    { path: '~/components', pathPrefix: false },
  ],

  modules: ['@primevue/nuxt-module', '@vueuse/nuxt', 'nuxt-mcp-dev'],

  css: ['~/assets/css/theme.css', 'primeicons/primeicons.css'],

  app: {
    head: {
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
        },
      ],
      script: [
        {
          innerHTML:
            'document.documentElement.classList.add("dark-mode")',
        },
      ],
    },
  },

  primevue: {
    components: {
      prefix: 'P',
    },
    options: {
      theme: {
        preset: AnimeBazaPreset,
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
