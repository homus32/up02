import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    // E2E/integration tests use @nuxt/test-utils/e2e with setup({ server: true })
    // These MUST run in standard Node environment, NOT Nuxt vitest environment,
    // to avoid [vite:vue] MagicString constructor conflict with @vue/compiler-sfc
    // See: https://github.com/nuxt/test-utils/issues/1690
    environment: 'node',
    include: ['test/server/**/*.test.ts'],
  },
})
