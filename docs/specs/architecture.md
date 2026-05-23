# Architecture

## Стек

- **Nuxt 4** — фреймворк (SSR, file-based routing)
- **Vue 3** — UI-библиотека (Composition API, `<script setup>`)
- **TypeScript** — типизация
- **Vite** — сборщик
- **Vanilla CSS** — стилизация (БЭМ, custom properties)

## Структура проекта

```
app/
  app.vue          # корневой компонент
  pages/           # страницы
  components/      # переиспользуемые компоненты (feature-based)
    layout/        # Header.vue, Footer.vue
    catalog/       # AnimeCard.vue, AnimePreviewPopup.vue, PopupContent.vue, CatalogFilters.vue
    anime/         # AnimeDetailHero.vue, AnimeDetailLists.vue, PlayerPlaceholder.vue
    profile/       # ProfileCard.vue, AnimeProfileCard.vue, ProfileTabEmpty.vue
    shared/        # ErrorState.vue, EmptyState.vue, SkeletonCatalogGrid.vue, SkeletonAnimeDetail.vue
  composables/     # Vue composables
    useAnimeApi.ts
    useAuth.ts
    useUserLists.ts
    useHeaderSearch.ts
    useCatalogSearchState.ts
    useCatalogPagination.ts
    usePopupHover.ts          # hover bridge для попапа (show 300ms, hide 150ms grace)
  types/
    anime.ts
server/
  api/anime/
    search.get.ts      # поиск/фильтрация аниме (GraphQL proxy)
    [animeId].get.ts   # детальная страница тайтла (GraphQL proxy)
  graphql/
    queries.ts         # GraphQL-запросы (gql tag → graphql-tag, TypedDocumentNode)
  utils/
    shikimori.ts       # GraphQL-клиент (graphql-request) + error handler
graphql.config.ts      # WebStorm IDE — автокомплит и валидация GraphQL-запросов
public/            # статические файлы
test/
  server/          # E2E-тесты server routes (vitest + @nuxt/test-utils/e2e)
  unit/            # unit-тесты (vitest)
docs/
  guides/          # руководства
  specs/           # SDD-спецификации
```

## Рендеринг

- SSR по умолчанию (Nuxt 4 default)
- Все страницы рендерятся на сервере

## Стилизация

- Vanilla CSS, БЭМ-классы
- CSS custom properties для цветов, размеров, отступов
- Компонентные CSS-файлы (`<style scoped>` или отдельные `.css`)
- CSS Grid для раскладки (без Tailwind)
- PrimeVue-тема кастомизируется через `definePreset` в `nuxt.config.ts` (Aura base + overrides)

---

*Последнее обновление: 2026-05-22 — обновлена структура проекта: компоненты разложены по feature-based папкам, добавлены 6 новых компонентов (Header, Footer, AnimeProfileCard, ProfileTabEmpty, ErrorState, EmptyState, SkeletonCatalogGrid, SkeletonAnimeDetail) и 3 новых composable (useHeaderSearch, useCatalogSearchState, useCatalogPagination).*
*Последнее обновление: 2026-05-22 — GraphQL-запросы переведены на `graphql-tag` + `TypedDocumentNode` для type safety. Добавлен `graphql.config.ts` для WebStorm IDE.*
*Последнее обновление: 2026-05-22 — PrimeVue-тема кастомизируется через `definePreset` (Aura base + overrides)*
*Последнее обновление: 2026-05-23 — добавлены PopupContent.vue и usePopupHover.ts*
