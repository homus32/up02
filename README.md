# AnimeBaza — Учебная практика УП.02

Веб-приложение-каталог аниме. Данные загружаются через Shikimori GraphQL API.
Пользовательские списки — localStorage. Разрабатывается в рамках учебной практики УП.02.

## Стек

- **Nuxt 4** + **Vue 3** + **TypeScript** + **Vite** (SSR)
- **PrimeVue 4** (Aura theme)
- **Vanilla CSS** — БЭМ (BEM), CSS custom properties
- **GraphQL** — Shikimori API через Nitro proxy (`graphql-request`)
- **pnpm** — пакетный менеджер

## Быстрый старт

```bash
pnpm install
pnpm dev
```

Открой http://localhost:3000.

## Команды

| Команда | Назначение |
|---------|-----------|
| `pnpm dev` | Dev-сервер (http://localhost:3000) |
| `pnpm build` | Production-сборка |
| `pnpm generate` | Статическая генерация |
| `pnpm preview` | Превью production-сборки |
| `pnpm test` | Unit-тесты (Vitest) |
| `pnpm test:e2e` | E2E-тесты |
| `pnpm postinstall` | `nuxt prepare` (генерация .nuxt/) |

## Структура проекта

```
app/           # страницы, компоненты, composables
server/        # Nitro API routes (GraphQL proxy)
test/          # unit + E2E тесты
docs/          # документация и SDD-спецификации
```

## Документация

- `docs/specs/` — SDD-спецификации (архитектура, UI, use-cases)
- `docs/guides/` — руководства (задания практики, CSS-методология)
