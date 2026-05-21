# UP02 — Учебная практика (Дипломный проект)

## OVERVIEW

Учебный проект — веб-приложение, разрабатываемое в рамках учебной практики УП.02.
Стек: Nuxt 4 + Vue 3 + TypeScript + Vite, SSR, vanilla CSS (БЭМ).

## Стек

- **Nuxt 4** (v4.4.6), Vue 3, Vue Router 5, TypeScript
- **Vite**, **SSR** (режим по умолчанию)
- **Vanilla CSS** — БЭМ (BEM), CSS custom properties, компонентные CSS-файлы

## Цель проекта

Выполнение заданий учебной практики УП.02: описание дипломного проекта, use-case диаграмма, проектирование и разработка интерфейса. Подробнее — `docs/guides/up02.md`.

## STRUCTURE

```
app/
  app.vue          # корневой компонент
  pages/           # страницы (file-based routing)
  components/      # переиспользуемые Vue-компоненты
  layouts/         # layout-компоненты (опционально)
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

## DOCS

`docs/` — документация проекта.

- **`docs/guides/`** — руководства и справочные материалы. Содержат описание заданий практики (`up02.md`) и методологию CSS (`css-organization-without-framework.md`).
- **`docs/specs/`** — SDD-спецификации. Хранят то, что код сам по себе не всегда способен точно выразить: цели, контракты, acceptance criteria и архитектурные решения. Агент читает их через `instructions` в `opencode.json`.

## Важные команды

| Команда | Назначение |
|---------|-----------|
| `npm run dev` | Запуск dev-сервера (http://localhost:3000) |
| `npm run build` | Production-сборка |
| `npm run generate` | Статическая генерация |
| `npm run preview` | Превью production-сборки |
| `npm run postinstall` | `nuxt prepare` (генерация .nuxt/) |

## Особенности Nuxt 4

- `app/` вместо `pages/` — все страницы и компоненты внутри `app/`.
- `app/app.vue` — корневой компонент.
- File-based routing внутри `app/pages/`.
- SSR по умолчанию.

## Требования к коду

- TypeScript — строгий режим.
- ESLint — настроен, ошибки не пропускать.
- Компоненты Vue — Composition API + `<script setup lang="ts">`.
- Имена файлов: `PascalCase.vue` для компонентов, `kebab-case` для прочего.

## Git

- **Запрещено указывать соавтора (co-author) в коммитах.** Никаких `Co-authored-by:`.
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:` и т.д.
