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
  components/      # переиспользуемые компоненты
  layouts/         # layout-компоненты (опционально)
server/
  api/anime/
    search.get.ts      # поиск/фильтрация аниме (GraphQL proxy)
    [animeId].get.ts   # детальная страница тайтла (GraphQL proxy)
  graphql/
    queries.ts         # GraphQL-запросы (gql tag)
  utils/
    shikimori.ts       # GraphQL-клиент (graphql-request) + error handler
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

---

*Этот файл обновляется при изменении архитектуры.*
