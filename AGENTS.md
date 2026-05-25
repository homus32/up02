# UP02 — Учебная практика (Дипломный проект)

## OVERVIEW

Учебный проект — веб-приложение, разрабатываемое в рамках учебной практики УП.02.
Стек: Nuxt 4 + Vue 3 + TypeScript + Vite, SSR, vanilla CSS (БЭМ).

> ## **⚠️ АБСОЛЮТНОЕ ПРАВИЛО ПРОЕКТА: ДОКУМЕНТАЦИЯ В `docs/specs/` ДОЛЖНА БЫТЬ СИНХРОНИЗИРОВАНА ПОСЛЕ КАЖДОГО ИЗМЕНЕНИЯ КОДА**
> 
> **ЛЮБОЕ изменение кода — будь то рефакторинг, добавление фичи, исправление бага, переименование файла, изменение структуры папок, добавление/удаление компонента, изменение API, конфигурации или архитектуры — ОБЯЗЫВАЕТ немедленно обновить соответствующие файлы в `docs/specs/`.**
> 
> **ЭТО НЕРУШИМО. НЕ ОБСУЖДАЕТСЯ. НЕ ПРОПУСКАЕТСЯ.**
> 
> **Если ты не обновил `docs/specs/` — ты не закончил задачу. Точка.**
> 
> **Агенты, нарушившие это правило, будут считаться выполнившими работу НЕПОЛНОСТЬЮ.**
> 
> **Проверка перед завершением любой задачи:**
> 1. Что изменилось в коде?
> 2. Какой `.md` файл в `docs/specs/` описывает эту часть системы?
> 3. Обновлён ли он? Перечитай его — не устарел ли?
> 4. Если нет — ОБНОВИ. Прежде чем двигаться дальше.
> 
> **Используй skill `doc-updater` для синхронизации документации. Всегда загружай его при рефакторинге, добавлении фич или изменении архитектуры.**

## Стек

- **Nuxt 4** (v4.4.6), Vue 3, Vue Router 5, TypeScript
- **Vite**, **SSR** (режим по умолчанию)
- **Vanilla CSS** — БЭМ (BEM), CSS custom properties, компонентные CSS-файлы
- **PrimeVue 4** (Aura theme, компоненты с префиксом `P`)
- **Inter** через Google Fonts (`app.head.link`, font-display: swap)

## Цель проекта

Выполнение заданий учебной практики УП.02: описание дипломного проекта, use-case диаграмма, проектирование и разработка интерфейса. Подробнее — `docs/guides/up02.md`.

## STRUCTURE

```
app/
  app.vue          # корневой компонент
  pages/           # страницы (file-based routing)
    index.vue      # каталог
    login.vue      # вход
    profile.vue    # профиль
    anime/
      [id].vue     # детальная страница тайтла
  components/      # переиспользуемые Vue-компоненты (feature-based)
    layout/        # Header.vue, Footer.vue
    catalog/       # AnimeCard.vue, AnimePreviewPopup.vue, PopupContent.vue, CatalogFilters.vue
    anime/         # AnimeDetailHero.vue, AnimeDetailLists.vue, PlayerPlaceholder.vue
    profile/       # ProfileCard.vue, ProfileTabEmpty.vue, ProfileAnimeSection.vue
    shared/        # ErrorState.vue, EmptyState.vue, SkeletonCatalogGrid.vue, SkeletonAnimeDetail.vue
  composables/     # Vue composables
    useAnimeApi.ts
    useAuth.ts
    useUserLists.ts
    useHeaderSearch.ts
    useCatalogSearchState.ts
    useCatalogPagination.ts
    useCatalogFillPage.ts
    usePopupHover.ts
    useAnimeDetailCache.ts
  types/           # TypeScript-типы
    anime.ts
public/            # статика (favicon и т.д.)
docs/
  guides/          # руководства и справочные материалы
    up02.md        # задания учебной практики
    css-organization-without-framework.md  # методология CSS (БЭМ)
  specs/           # SDD-спецификации
    project-overview.md
    architecture.md
    ui-structure.md
    use-cases.md
```

## CSS-стиль: БЭМ (Блок • Элемент • Модификатор)

Подробный разбор методологии — в `docs/guides/css-organization-without-framework.md`.

- **Tailwind не используется.** Все стили — vanilla CSS с БЭМ-классами.
- Имена классов по БЭМ: `.block__element_modifier` (lowercase, дефисы).
- CSS custom properties в `:root` для цветов, размеров шрифтов, отступов.
- Компонентные CSS-файлы — scoped-стили через `<style scoped>` или отдельные CSS-файлы.
- Сетки — CSS Grid с `auto-fit`/`minmax()` вместо media-query-хаков.
- Адаптивность — через container queries и Grid, избегать лишних брейкпоинтов.
- **no outer margin** — внешние отступы задаёт родитель, не компонент.

### Пример БЭМ-классов в компонентах

```vue
<template>
  <section class="card">
    <h2 class="card__title">Заголовок</h2>
    <p class="card__text">Текст</p>
    <button class="card__button card__button_primary">Действие</button>
  </section>
</template>
```

## Spec-Driven Development (SDD)

- `docs/specs/` — функциональные и технические спецификации.
- **После правок кода — синхронно обновлять документацию.** Любое изменение кода сопровождается обновлением соответствующих `.md` файлов.
- `docs/specs/` обновляются при изменении функционала, интерфейсов или архитектуры.
- `AGENTS.md` обновляется при изменении структуры репозитория, стека или конвенций.
- Если документация расходится с кодом — реализация считается неполной.

> **🔥 ОБЯЗАТЕЛЬНОЕ ПРАВИЛО ДЛЯ ПЛАНОВ:**
> **Каждый план, созданный в этом проекте, ДОЛЖЕН заканчиваться шагом «Обновление документации».**
> «Обновление документации» — это обязательный последний пункт любого плана, без исключений.
> Использовать skill `doc-updater` для синхронизации `docs/specs/` после выполнения всех остальных шагов.

## DOCS

`docs/` — документация проекта.

- **`docs/guides/`** — руководства и справочные материалы. Содержат описание заданий практики (`up02.md`) и методологию CSS (`css-organization-without-framework.md`).
- **`docs/specs/`** — SDD-спецификации. Хранят то, что код сам по себе не всегда способен точно выразить: цели, контракты, acceptance criteria и архитектурные решения. Агент читает их через `instructions` в `opencode.json`.
- **`docs/excalidraw/`** — Excalidraw-рисунки (диаграммы, схемы). **Всегда сохранять в файл** (`.excalidraw`), никогда не загружать на облако. Интерфейс OpenCode не поддерживает Excalidraw — пользователь смотрит файлы самостоятельно через excalidraw.com.

## Важные команды

| Команда | Назначение |
|---------|-----------|
| `pnpm dev` | Запуск dev-сервера (http://localhost:3000) |
| `pnpm build` | Production-сборка |
| `pnpm generate` | Статическая генерация |
| `pnpm preview` | Превью production-сборки |
| `pnpm postinstall` | `nuxt prepare` (генерация .nuxt/) |

## Особенности Nuxt 4

- `app/` вместо `pages/` — все страницы и компоненты внутри `app/`.
- `app/app.vue` — корневой компонент.
- File-based routing внутри `app/pages/`.
- SSR по умолчанию.

## Тестирование

- **Всегда писать тесты.** Любая новая функциональность, багфикс или рефакторинг сопровождаются тестами.
- **Всегда обновлять существующие тесты** при изменении кода.
- Покрытие — минимум 80% (unit + integration + E2E).
- Фреймворк: Vitest + `@nuxt/test-utils`.
- Следовать TDD-процессу из `.opencode/rules/common/testing.md`.

## Документация (SDD)

- **Любое изменение кода → синхронно обновлять документацию.** Использовать skill `doc-updater`.
- `docs/specs/` обновляются при изменении функционала, интерфейсов или архитектуры.
- `AGENTS.md` обновляется при изменении структуры репозитория, стека или конвенций.
- Если документация расходится с кодом — реализация считается неполной.

## Документация библиотек

- **PrimeVue:** Использовать PrimeVue MCP (`primevue_get_*`) для документации компонентов PrimeVue 4. Не полагаться на данные обучения.
- **Прочие библиотеки:** Использовать Context7 MCP (`context7_resolve-library-id`, `context7_query-docs`) для актуальной документации.

## SSR-ошибки

Для отлова SSR-ошибок запускать dev-сервер в tmux-сессии:
```
tmux new-session -d -s nuxt-dev
tmux send-keys -t nuxt-dev "npx nuxt dev" Enter
tmux capture-pane -t nuxt-dev -p -S -40
```
SSR-ошибки отображаются в терминале dev-сервера (`storage.getItem is not a function`, `NuxtError` и т.д.).

## Визуальное тестирование

- Любые изменения стилей, вёрстки, компонентов Vue или UI требуют **визуальной оценки человеком**.
- **НЕ ДЕЛАТЬ скриншоты.** Они бесполезны. Вместо этого описать **что изменилось** и **на что смотреть** в `.md` файле — пользователь сам проверит и даст обратную связь.
- Пример формулировки: *«Посмотри на странице X: кнопка Y теперь сдвинута вправо, шрифт должен быть Inter. Проверь на мобильном разрешении.»*

## Требования к коду

- TypeScript — строгий режим.
- ESLint — настроен, ошибки не пропускать.
- Компоненты Vue — Composition API + `<script setup lang="ts">`.
- Имена файлов: `PascalCase.vue` для компонентов, `kebab-case` для прочего.
- **Нулевая терпимость к `as any`, `@ts-ignore`, `@ts-expect-error`.**

## Git

- **Запрещено указывать соавтора (co-author) в коммитах.** Никаких `Co-authored-by:`.
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:` и т.д.
