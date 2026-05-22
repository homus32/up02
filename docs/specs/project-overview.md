# Project Overview

## Purpose

Веб-приложение «AnimeBaza» — каталог аниме, разрабатываемый в рамках учебной практики УП.02.
Представляет собой стриминговый сайт (каталог + плеер-заглушка) без бекенда.
Данные загружаются через Shikimori GraphQL API. Пользовательские списки — localStorage.

## Tech Stack

- **Frontend:** Nuxt 4, Vue 3, TypeScript, Vite, SSR
- **UI Library:** PrimeVue 4 (Aura theme)
- **Styling:** Vanilla CSS, БЭМ (BEM), CSS custom properties
- **PrimeVue Theming:** Aura preset, кастомизированный через `definePreset` (`@primeuix/themes`)
- **API:** Shikimori GraphQL (`shikimori.io/api/graphql`), прокси через Nitro (`graphql-request`)
- **GraphQL Client:** `graphql-request` (v7), общий клиент в `server/utils/shikimori.ts`
- **GraphQL Query Builder:** `graphql-tag` (через `TypedDocumentNode` из `@graphql-typed-document-node/core`), IDE-валидация через `graphql-config`
- **DOMPurify:** Санитизация HTML-описаний аниме (HI-5), динамический import только на клиенте
- **Runtime Config:** `shikimori.apiUrl` через `runtimeConfig` (`NUXT_SHIKIMORI_API_URL`)
- **Package Manager:** pnpm (см. `pnpm-lock.yaml`)
- **Testing:** Vitest + `@nuxt/test-utils` (E2E), `msw` (unit), `vitest` runner
- **Storage:** localStorage (списки аниме, рейтинг, псевдо-авторизация)

## Задачи практики

1. **Описание тематики дипломного проекта** — документ `docs/guides/concept.md`
2. **Use-case диаграмма** — акторы и их взаимодействие с системой
3. **Проектирование и разработка интерфейса** — 4 страницы: каталог, страница тайтла, вход, профиль

## Acceptance Criteria

- [x] Задание 1: описание проекта — `docs/guides/concept.md`
- [ ] Задание 2: use-case диаграмма в виде изображения
- [x] Задание 3: 4 страницы, PrimeVue + БЭМ, адаптивность, клиентская логика (localStorage), ссылка на репозиторий

## Рефакторинг (Фаза 1–2)

- [x] Фаза 1 Critical (SSR, поиск, пагинация, UI-баги, PrimeVue тема) — выполнено
- [x] Фаза 2 Декомпозиция (7 компонентов из 3 монолитных страниц)
- [x] DOMPurify санитизация v-html
- [x] Нет `as any`, нет утечек event listeners, типизированные функции

---

*Последнее обновление: 2026-05-22 — добавлены graphql-tag, @graphql-typed-document-node/core, graphql-config; TypedDocumentNode для type-safe GraphQL-запросов*
*Последнее обновление: 2026-05-22 — пакетный менеджер: npm → pnpm; Makefile и документация синхронизированы
*Последнее обновление: 2026-05-22 — `--p-*` CSS-оверрайды заменены на `definePreset`, inline-скрипт для `.dark-mode` в `<head>`*
