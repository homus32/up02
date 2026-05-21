# Known Issues (AnimeBaza)

> **Дата аудита:** 2026-05-21
> **Объём:** Все страницы, composables, server routes, конфигурация, типы
> **Метод:** Полный code review + анализ архитектурных расхождений

---

## Critical (blocking errors — приложение не работает или падает в SSR)

### CI-1: SSR crash — `useStorage` с `localStorage` ломает серверный рендеринг

**Severity:** CRITICAL

**Status:** ✅ RESOLVED (2026-05-21)

**Location:**
- `app/composables/useAuth.ts:8` — `useStorage<UserProfile | null>(AUTH_KEY, null, localStorage, ...)`
- `app/composables/useUserLists.ts:10-11` — `useStorage<AnimeLists>(LISTS_KEY, {}, localStorage)`, `useStorage<AnimeRatings>(RATINGS_KEY, {}, localStorage)`

**Impact:** При каждом SSR-запросе `localStorage` равен `undefined` на сервере. `useStorage` вызывает `storage.getItem(...)` → `TypeError: storage.getItem is not a function`. Это роняет весь серверный рендеринг страниц, где вызываются `useAuth()` или `useUserLists()`:
- `app.vue:2` — `useAuth()` вызывается на уровне app shell → **каждая страница падает**
- `app/pages/index.vue:130` — `useUserLists()` → падает каталог
- `app/pages/anime/[id].vue:15` — `useUserLists()` → падает страница тайтла
- `app/pages/profile.vue:9` — `useUserLists()` — эта страница имеет `ssr: false`, но если рендеринг всё же происходит (навигация, preload), падает

**Root Cause:** В проекте установлен только `@vueuse/core` (v14.3.0), но **отсутствует `@vueuse/nuxt`**. Без Nuxt-модуля VueUse:
1. `useStorage(key, default, localStorage, opts)` на сервере не получает SSR-safe fallback
2. Третий аргумент (`localStorage`) форсирует использование именно этого storage-объекта, и VueUse не подменяет его на in-memory аналог
3. SSR-рендеринг вызывает `localStorage.getItem(...)` → `undefined.getItem(...)` → crash

**Fix Applied:**
1. Установлен `@vueuse/nuxt` — `npm install @vueuse/nuxt`
2. Добавлен в `nuxt.config.ts` — `modules: ['@primevue/nuxt-module', '@vueuse/nuxt', 'nuxt-mcp-dev']`
3. Убран явный `localStorage` третий аргумент из `useStorage` в `useAuth.ts` (заменён на `undefined`) и `useUserLists.ts` (удалён полностью)
4. SSR-рендеринг проверен на страницах `/`, `/anime/28851`, `/login` — ошибок нет

---

### CI-2: Пагинация возвращает неверный `total` — всегда равен `animes.length`

**Severity:** CRITICAL

**Status:** ✅ RESOLVED (2026-05-21)

**Location:**
- `server/api/anime/search.get.ts:30` — строка `total: animes.length`

**Impact:** `Paginator` получает `total` = количеству элементов на текущей странице (например, 20), а не общему количеству результатов поиска. Пагинатор всегда показывает одну страницу, даже если в API тысячи совпадений. Пользователь не может перейти на вторую страницу — она "не существует" с точки зрения пагинатора.

**Root Cause:** Shikimori GraphQL API возвращает только текущую страницу результатов без поля `totalCount` (или оно не запрашивается в query). Вместо использования настоящего total из API, код подставляет `animes.length`.

**Fix Applied (2026-05-21):**
1. Заменён `<Paginator>` на кнопку "Загрузить ещё" (инкрементальная загрузка)
2. Добавлено состояние `allAnimes` для накопления результатов, `hasMore` (определяется по длине ответа API — если < limit, страниц больше нет), `loadingMore` для спиннера
3. `useAsyncData` фетчит только page=1, отслеживает `baseParams` (без page)
4. `loadMore()` инкрементит page, аппендится к `allAnimes`
5. При смене фильтров — `watch(data)` сбрасывает всё к page=1

**Не используется:** Shikimori GraphQL не поддерживает `totalCount`. Paginator заменён на Load More.
---


### CI-3: Поиск — два конкурирующих механизма, навигация на каждое нажатие клавиши

**Severity:** CRITICAL

**Status:** ✅ RESOLVED (2026-05-21)

**Location:**
- `app/app.vue:63` — `@input="onSearchSubmit"` (мгновенная навигация на каждое нажатие)
- `app/pages/index.vue:76-88` — `debouncedSearch` (400ms debounce, обновляет URL)

**Impact:** Поиск в header (app.vue) вызывает `router.push({ path: '/', query: { search: ... } })` на **каждый** `@input`. Это означает, что при наборе слова "Naruto":
1. Нажатие 'N' → навигация на `/?search=N` → полная перезагрузка SSR
2. Нажатие 'a' → навигация на `/?search=Na` → снова перезагрузка
3. ...и так для каждого символа

Это порождает лавину HTTP-запросов, перезагружает страницу, и полностью игнорирует debounced-механизм в index.vue. Два механизма конфликтуют: header немедленно навигирует, а catalog пытается дебаунсить.

**Root Cause:** В header используется `@input` (fire on every keystroke) без debounce и без проверки, находится ли пользователь уже на странице `/`. Если пользователь на странице каталога, вместо `router.push` нужно просто эмитить событие поиска или обновлять query без полной навигации.

**Fix Applied (2026-05-21):**
1. Убран `@input="onSearchSubmit"` из поля поиска в header
2. Навигация происходит только через `@submit.prevent` на форме (по Enter)
3. Добавлен `watchDebounced(searchQuery, 500)` в header — debounced-поиск с автопоиском через 500ms без Enter
4. Добавлена кнопка очистки × в поле поиска (при непустом `searchQuery`)
5. `onSearchSubmit` обрабатывает пустой поиск (возврат на `/`)
6. Debounced-поиск в каталоге (`index.vue`) работает независимо (400ms debounce)
7. Убран `page` из URL-параметров в `updateUrl()` — deep-link на страницу пагинации больше не поддерживается (замена на Load More)
---



## High (сломанная функциональность — работает некорректно или не соответствует спецификации)

### HI-1: SelectButton в `[id].vue` не работает — `optionLabel=""` и `optionValue=""`

**Severity:** HIGH

**Status:** ✅ RESOLVED (2026-05-21)

**Location:** `app/pages/anime/[id].vue:270-281`

```vue
<SelectButton
  v-model="selectedStatus"
  :options="USER_LIST_STATUSES"
  optionLabel=""
  optionValue=""
  :allowEmpty="false"
  :multiple="false"
>
```

**Impact:** `optionLabel=""` и `optionValue=""` указывают PrimeVue искать свойства с именами `""` (пустая строка) в объектах опций. Поскольку `USER_LIST_STATUSES` — массив строк (`['planned', 'watching', ...]`), а не объектов, SelectButton либо не отрендерит метки, либо не сможет сопоставить выбранное значение. Кнопки выбора статуса (Запланировано/Смотрю/...) не работают.

**Root Cause:** Для массива строк нужно либо:
- Не указывать `optionLabel`/`optionValue` (PrimeVue сам обработает строки как label=value)
- Либо преобразовать в массив объектов `{ label: '...', value: '...' }`
- Шаблон `#option` используется для кастомного рендеринга, но без корректных `optionLabel`/`optionValue` v-model не работает

**Fix Applied (2026-05-21):** 
1. Убраны `optionLabel=""` и `optionValue=""` из `<SelectButton>`.
2. Преобразован `:options` из строкового массива в массив объектов `{ label, value }`, убран `#option`-слот, добавлены `optionLabel="label"` и `optionValue="value"`.
3. CSS: убран `gap` на `.anime-page__list-selector :deep(.p-selectbutton)`. Добавлены CSS-переменные `--p-selectbutton-background`, `--p-selectbutton-border-color: transparent`, `--p-selectbutton-item-background`, `--p-selectbutton-item-color`, `--p-selectbutton-item-checked-background`, `--p-selectbutton-item-checked-color` с тёмными значениями для переопределения Aura-темы. Всё обёрнуто в `html.dark-mode { ... }` для корректной специфичности.

---

### HI-2: OverlayPanel popup — нет hide-on-mouseleave, позиционирование ненадёжно

**Severity:** HIGH

**Location:** `app/pages/index.vue:148-161, 270, 353-415`

**Impact:**
- Popup показывается при `@mouseenter` на карточке (строка 270), но **никогда не скрывается** при `@mouseleave`
- Нет "hover bridge" — если пользователь двигает мышь между карточками, popup мигает
- OverlayPanel управляется императивно (`popup.value.show(event)`) и позиционируется относительно `event.target`, что ненадёжно при скролле
- На мобильных popup заменяется на Dialog, но дублирование шаблона popup (строки 360-413 и 430-478) — copy-paste

**Root Cause:** OverlayPanel не предназначен для hover-поведения на списке элементов. Его API требует явного show/hide. Решение с `@mouseenter` без `@mouseleave` и без hover-intent (задержка перед показом) — хрупкое.

**Fix:**
1. Использовать `@mouseenter` с задержкой (debounce 300ms) перед показом
2. Добавить `@mouseleave` на карточку и сам popup для скрытия
3. Заменить OverlayPanel на кастомный tooltip/popover с `position: absolute` внутри карточки, управляемый через CSS hover
4. Вынести шаблон popup в отдельный компонент `<AnimePreviewPopup>` чтобы избежать дублирования для Desktop/Mobile

---

### HI-3: Тёмная тема — селектор `.dark-mode` никогда не применяется

**Severity:** HIGH

**Status:** ✅ RESOLVED (2026-05-21)

**Location:**
- `nuxt.config.ts:18` — `darkModeSelector: '.dark-mode'`
- `app/assets/css/theme.css` — все токены заданы как тёмные (нет `:root` → `:root.dark-mode` переключения)

**Impact:** PrimeVue настроен ждать класс `.dark-mode` на `<html>` для активации тёмной темы, но этот класс нигде не добавляется. Поскольку CSS-токены уже тёмные, визуально выглядит нормально, но:
- PrimeVue-компоненты могут рендериться в светлой теме (несоответствие с кастомными токенами)
- Нет механизма переключения темы
- Некоторые PrimeVue-компоненты имеют отдельные тёмные варианты стилей, которые не активируются

**Root Cause:** Несоответствие между PrimeVue-конфигурацией (ждёт `.dark-mode`) и реальным DOM (класс не добавляется).

**Fix Applied (2026-05-21):**
1. Добавлен `document.documentElement.classList.add('dark-mode')` в `onMounted` в `app.vue`

---

### HI-4: Монолитные страницы — 739 и 671 строк без декомпозиции

**Severity:** HIGH

**Location:**
- `app/pages/index.vue` — 739 строк (вся логика каталога: фильтры, грид, карточки, popup, диалог, пагинация, скелетоны, состояния)
- `app/pages/anime/[id].vue` — 671 строка (вся детальная страница: постер, метаданные, плеер, списки, скелетоны, ошибки)

**Impact:**
- Нарушает архитектурную спецификацию (`anime-catalog-architecture.md`), которая определяет 15+ компонентов: `AnimeCard`, `CatalogLayout`, `CatalogSidebar`, `FilterSection`, `KindFilter`, `StatusFilter`, `SearchBar`, `AnimeDrawer`, `AnimeHero`, `AnimeTabs`, `TheHeader`, `TheFooter`, etc.
- Директория `app/components/` **пуста** — ни одного компонента не создано
- Код невозможно переиспользовать (например, карточка аниме рендерится inline в трёх местах: каталог, popup, профиль)
- Тестирование невозможно — монолит не поддаётся unit-тестированию
- Любое изменение рискует сломать несвязанную функциональность

**Root Cause:** Быстрая итерационная разработка без рефакторинга. Вся логика была написана в pages для скорости, без последующей декомпозиции.

**Fix:** Провести декомпозицию согласно архитектурной спецификации:

**Phase 1 (Critical):**
- `AnimeCard.vue` — вынести рендеринг карточки из index.vue, profile.vue
- `AnimePreviewPopup.vue` — вынести попап из index.vue
- `CatalogFilters.vue` — вынести фильтры из index.vue
- `AnimeDetailHero.vue` — вынести хиро-секцию из [id].vue
- `PlayerPlaceholder.vue` — вынести плеер-заглушку

**Phase 2 (Nice-to-have):**
- `SearchBar.vue` — вынести поиск из app.vue
- `ProfileCard.vue` — вынести карточку профиля
- Остальные компоненты по спецификации

---

### HI-5: `v-html` без санитизации — потенциальный XSS

**Severity:** HIGH

**Location:** `app/pages/anime/[id].vue:250`

```vue
<div v-if="anime.descriptionHtml" class="anime-page__description-html" v-html="anime.descriptionHtml" />
```

**Impact:** `descriptionHtml` приходит из Shikimori API. Хотя API Shikimori контролируется третьей стороной и маловероятно содержит зловредный код, содержимое описаний может включать:
- `<script>` теги
- Inline обработчики (`onerror`, `onload`)
- Внешние ресурсы (iframes, изображения с трекингом)

**Root Cause:** Отсутствие санитизации HTML перед вставкой в DOM.

**Fix:**
1. Установить `DOMPurify` или `sanitize-html`: `pnpm add dompurify && pnpm add -D @types/dompurify`
2. Создать computed с санитизацией:
```ts
import DOMPurify from 'dompurify'

const safeDescriptionHtml = computed(() => {
  if (!anime.value?.descriptionHtml) return ''
  return DOMPurify.sanitize(anime.value.descriptionHtml, {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target'],
  })
})
```
3. Заменить `v-html="anime.descriptionHtml"` на `v-html="safeDescriptionHtml"`

---

### HI-6: Нет `@vueuse/nuxt` — SSR-safe storage не работает

**Severity:** HIGH

**Status:** ✅ RESOLVED (2026-05-21, вместе с CI-1)

**Location:** `package.json` — отсутствовал пакет `@vueuse/nuxt`

**Impact:** Связано с CI-1. Без этого модуля все `useStorage` вызовы на сервере падают.

**Fix Applied:** Установлен `@vueuse/nuxt`, добавлен в `modules` в `nuxt.config.ts`.

---

### HI-7: UI/визуальное качество — кнопки выглядят ужасно, нет типографической иерархии

**Severity:** HIGH

**Status:** ⚠️ ЧАСТИЧНО РЕШЕНО (2026-05-21)

**Location:** Глобально — все страницы и компоненты

**Impact:** Визуально сайт выглядит как "сырой прототип":
- **Кнопки:** Текст в PrimeVue-кнопках не имеет явного `font-weight` и `letter-spacing`, размер плохо подобран. Нет единой системы кнопок (primary/secondary/ghost выглядят как разрозненные компоненты). Кнопка "В список" и "Подробнее" в карточке визуально конфликтуют.
- **Типография:** Нет явной иерархии заголовков. `h1` = `--text-3xl (2rem)`, `h3` = `--text-sm (0.875rem)` — разрыв слишком большой. Нет настроек для `h2`, `h4` в системе токенов. Размеры шрифтов не используют `clamp()` для fluid-типографики.
- **Карточки:** Текст в карточках каталога разного размера, нет единого ритма. Заголовок карточки — `--text-sm`, рейтинг — `--text-xs`, статус — `--text-xs`. На мобильных становится нечитаемо.
- **Отсутствуют hover-состояния** у большинства интерактивных элементов (кроме карточек). Нет `transition` на ссылках, Chip, Tag, Select.
- **Нет микровзаимодействий**, описанных в `concept.md` (карточка приподнимается, попап выезжает, кнопка сжимается в галочку).
- **PrimeVue-компоненты не кастомизированы** через Pass Through — используются только базовые CSS-переменные. Это даёт "голый" PrimeVue вид без индивидуальности.

**Root Cause:** Стилизация сделана минимально — определён набор CSS-переменных, но нет дизайн-системы. Компоненты PrimeVue используются "as-is" без кастомизации через Pass Through. Нет целостного визуального дизайна — есть только базовая раскраска.

**What improved (2026-05-21):** После исправления PrimeVue-темы (`preset: Aura` вместо строки `'aura'`) стили PrimeVue-компонентов загружаются корректно. Пагинация, кнопки (ToggleButton), селекты, теги теперь выглядят нормально — применены Aura-токены с тёмной темой (2603 CSS-переменных `--p-*`). Визуальный базис стал приемлемым.

**Still needs work:**
1. Типографика — нет fluid-шкалы и иерархии заголовков
2. Hover/focus/active состояния на кастомных элементах
3. Микровзаимодействия (карточки, попап, кнопки)
4. Кастомизация PrimeVue через Pass Through для уникального стиля

**Fix (после рефакторинга кода):**
1. Настроить единую типографическую шкалу с `clamp()` для всех уровней (h1-h6, body, caption)
2. Кастомизировать Button через Pass-Through: `font-weight: 600`, `letter-spacing: 0.01em`, правильный padding
3. Добавить hover/active/focus состояния для всех интерактивных PrimeVue-компонентов
4. Создать дизайн-систему: задокументировать цвета, типографику, отступы, компонентные стили
5. Использовать PrimeVue Pass Through API для кастомизации компонентов, а не только CSS-переменные
6. Адаптировать типографику под мобильные: `--text-sm` на мобильных должен быть не меньше 13px

---

### HI-8: CSS — отсутствует целостная система, стили "кривые"

**Severity:** HIGH

**Status:** ⚠️ ЧАСТИЧНО РЕШЕНО (2026-05-21)

**Location:**
- `app/assets/css/theme.css` — все токены
- `app/pages/*.vue` — scoped-стили каждой страницы

**Impact:** Визуальные дефекты, делающие сайт непрофессиональным:

- **Цветовой контраст:** `--text-muted: #686888` на фоне `--bg-page: #0f0f1a` — соотношение контраста ~3.5:1, недостаточно для WCAG AA для мелкого текста. `--text-secondary: #9898b8` на `#0f0f1a` — ~5.5:1 (на грани).
- **Нет fluid-типографики:** Все размеры — фиксированные `rem`. На больших экранах текст выглядит мелко, на маленьких — крупно.
- **Отсутствует вертикальный ритм:** Нет базового `line-height` для body (1.5 есть, но это единственный). Заголовки не имеют единого `margin-bottom`.
- **Нет системы отступов между секциями:** `--space-6`, `--space-8`, `--space-12` используются без логики — иногда padding-top, иногда margin-top, создаётся неравномерный вертикальный ритм.
- ~~**PrimeVue тема не активирована корректно:**~~ ✅ Исправлено — Aura-тема с 2603 CSS-переменными `--p-*` загружается и применяется. Тёмная тема работает.
- **Нет responsive-утилит:** Все адаптивные правки делаются через media queries вручную в каждом компоненте. Нет системы breakpoints.
- **Глобальные стили в theme.css не имеют БЭМ-контекста:** Стили для `a`, `img`, `button` — голые теги, смешанные с БЭМ-классами. Нарушение специфичности.
- **Размеры кнопок не согласованы:** В каталоге `size="small"`, на странице тайтла — дефолтный размер. Нет единого стандарта.

**Fix:**
1. Проверить и скорректировать контраст всех text-цветов относительно `--bg-page` (минимум 4.5:1 для текста, 3:1 для крупного)
2. Ввести fluid-типографику: `--text-base: clamp(0.875rem, 0.8rem + 0.4vw, 1rem)` и т.д.
3. Установить вертикальный ритм: `--space-section`, `--leading-body`, `--heading-margin-bottom`
4. Определить 3-4 breakpoint как CSS-переменные (можно через `@custom-media` или комментарии)
5. Убрать глобальные теговые стили из theme.css, заменить на БЭМ-утилиты
6. Создать `.btn` / `.button` БЭМ-миксин для согласованного вида кнопок вне PrimeVue
7. Добавить `document.documentElement.classList.add('dark-mode')` в onMounted (см. HI-3)

---

### HI-9: Нет единого подхода к spacing/layout — секции "плавают"

**Severity:** HIGH

**Location:** Все страницы

**Impact:** Визуальный хаос из-за несогласованных отступов:

- `.container` имеет `padding: 0 var(--space-6)` (16px) — нормально, но на мобильных (768px) header меняет padding на `var(--space-3) var(--space-4)` (12px 16px). Контент "дышит" неравномерно.
- Сетка карточек в каталоге: `grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))` — на планшетах карточки становятся слишком широкими, на широких экранах — слишком узкими, если аниме мало.
- Popup накладывается поверх карточек без затемнения фона — пользователь не понимает, что фон не интерактивен (на desktop через OverlayPanel, у которого нет backdrop).
- На странице профиля `TabView` не имеет отступа сверху/снизу, карточки вплотную прилегают к TabPanel.
- На странице тайтла секция "Добавить в список" (`.anime-page__lists`) имеет `padding: var(--space-6)`, а секция описания — `padding: var(--space-4)`. Разные отступы у визуально похожих блоков.
- Плеер-заглушка занимает всю ширину без `max-width`, на широких экранах выглядит нелепо (огромный пустой блок).

**Root Cause:** Отсутствует единая система отступов и layout-контейнеров. Каждая страница определяет свои padding/margin независимо.

**Fix:**
1. Унифицировать `.container` на всех страницах (сейчас используется, но не везде последовательно)
2. Ограничить max-width у плеера-заглушки: `max-width: 640px; margin: 0 auto;`
3. Добавить backdrop к desktop OverlayPanel (через PT: `root: { className: 'p-overlaypanel-overlay' }` + CSS)
4. Синхронизировать padding у блоков на странице тайтла
5. Для сетки карточек на широких экранах: `minmax(180px, 1fr)` → `minmax(200px, 240px)` для более аккуратного вида

---

### HI-10: Нет загрузки шрифтов и предзагрузки критических ресурсов

**Severity:** HIGH

**Location:** 
- `app/assets/css/theme.css:52` — `font-family: 'Inter', ...`
- Нет `@font-face`, нет предзагрузки, нет `font-display: swap`

**Impact:** 
- Шрифт Inter не подключён через веб — используется системный шрифт (или падает на запасной). Сайт выглядит не так, как задумано.
- На машине разработчика Inter установлен локально, поэтому визуально шрифт отображается корректно.
- При первой загрузке на машине без Inter — FOIT (Flash of Invisible Text) или FOUT (Flash of Unstyled Text).

**Root Cause:** Inter указан как `font-family`, но не импортирован ни через `@import`, ни через `@font-face`, ни через Nuxt-модуль шрифтов.

**Fix:**
1. Установить `@nuxt/fonts`: `pnpm add @nuxt/fonts` и добавить в modules
2. Или добавить `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap')` в theme.css
3. Или скачать Inter и использовать `@font-face` с `font-display: swap`

---

## Medium (архитектурный долг — накапливается со временем)

### MI-1: Утечка памяти — window event listeners не удаляются

**Severity:** MEDIUM

**Location:**
- `app/app.vue:20-22` — `window.addEventListener('resize', ...)` в `onMounted`, нет `onUnmounted`
- `app/pages/index.vue:167-169` — то же самое

**Impact:** При SPA-навигации каждый заход на страницу добавляет новый обработчик `resize`, старые не удаляются. Со временем это приводит к утечке памяти и множественным вызовам обработчика на каждое изменение размера.

**Fix:** Добавить `onUnmounted` с `removeEventListener`:
```ts
const onResize = () => { isMobile.value = window.innerWidth < 768 }
onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
```
Вынести `isMobile` логику в composable `useIsMobile()`.

---

### MI-2: CSS не вынесен в компонентные файлы (противоречит БЭМ-методологии)

**Severity:** MEDIUM

**Location:** Все страницы:
- `app/pages/index.vue:484-739` — 255 строк `<style scoped>`
- `app/pages/anime/[id].vue:331-671` — 340 строк `<style scoped>`
- `app/pages/login.vue:81-173` — 93 строки
- `app/pages/profile.vue:162-413` — 251 строка

**Impact:**
- БЭМ-методология предполагает отдельные CSS-файлы для компонентов
- Невозможно переиспользовать стили между страницами (popup в index.vue и profile.vue имеют разные селекторы)
- Стили карточек дублируются в нескольких местах
- `<style scoped>` добавляет data-атрибуты, увеличивая размер бандла

**Fix:** При декомпозиции страниц на компоненты (HI-4), вынести стили в соответствующие `<style scoped>` компонентов. Для общих стилей (скелетоны, утилиты) — оставить в `theme.css`.

---

### MI-3: TypeScript — ослабленная типизация

**Severity:** MEDIUM

**Location:**
- `app/pages/index.vue:245` — `(error as any)?.data?.statusMessage`
- `server/api/anime/search.get.ts:22` — `client.request<{ animes: unknown[] }>`
- `server/api/anime/[animeId].get.ts:12` — `client.request<{ animes: unknown[] }>`
- `app/pages/anime/[id].vue:126` — `handleRatingChange(newRating)` имеет неявный `any`
- Множественные `as string`, `as SearchParams['kind']` касты

**Impact:** Потеря type safety в критических местах — ошибки API, несоответствие типов не отлавливаются на этапе компиляции.

**Fix:**
1. Создать typed GraphQL response interface в `app/types/anime.ts`:
```ts
interface GraphQLAnimeResponse { animes: Anime[] }
```
2. Заменить `unknown[]` на `Anime[]` в server routes
3. Заменить `(error as any)` на использование `NuxtError` типа из `#app`
4. Добавить явные типы для параметров функций

---

### MI-4: Отсутствуют error boundaries

**Severity:** MEDIUM

**Location:** Все страницы

**Impact:** Если ошибка происходит не в `useAsyncData`, а в computed, template, или composable — приложение падает с необработанной ошибкой. Пользователь видит пустой экран или Nuxt error page без контекста.

**Fix:**
1. Обернуть каждую страницу в `<NuxtErrorBoundary>`:
```vue
<NuxtErrorBoundary>
  <NuxtPage />
  <template #error="{ error, clearError }">
    <AppError :error="error" @retry="clearError" />
  </template>
</NuxtErrorBoundary>
```
2. Создать `app/error.vue` для глобальных ошибок

---

### MI-5: `nuxt-mcp-dev` в production dependencies

**Severity:** MEDIUM

**Location:** `package.json:22` — `"nuxt-mcp-dev": "^0.3.2"` в `dependencies`, а не в `devDependencies`

**Impact:** Production-бандл включает dev-инструменты. Увеличивает размер бандла, потенциально добавляет уязвимости, не нужные в production.

**Fix:** Переместить в `devDependencies`:
```bash
pnpm remove nuxt-mcp-dev && pnpm add -D nuxt-mcp-dev
```

---

### MI-6: `@primevue/mcp` в production dependencies

**Severity:** MEDIUM

**Location:** `package.json:17` — `"@primevue/mcp": "^4.5.5"` в `dependencies`

**Impact:** MCP-сервер для PrimeVue используется только для AI-assisted разработки. Не нужен в production-бандле. Добавляет ~2-5 MB к бандлу.

**Fix:** Переместить в `devDependencies`.

---

### MI-7: GraphQL-запросы возвращают `unknown[]`

**Severity:** MEDIUM

**Location:**
- `server/api/anime/search.get.ts:22` — `data?.animes ?? []` (тип `unknown[]`)
- `server/api/anime/[animeId].get.ts:12` — `data?.animes?.[0]` (тип `unknown`)

**Impact:** Данные из API не проходят валидацию формы. Несоответствие между GraphQL-схемой и TypeScript-типами не обнаруживается до рантайма. Ответ API может не содержать ожидаемых полей, и ошибка проявится только на клиенте.

**Fix:** Создать typed интерфейсы для GraphQL responses и добавить runtime validation (Zod) или хотя бы использовать `satisfies` на этапе трансформации.

---

### MI-8: Нет обработки состояния загрузки при смене фильтров

**Severity:** MEDIUM

**Location:** `app/pages/index.vue:111-114` — `onFilterChange` меняет страницу на 1 и обновляет URL, но не показывает скелетоны на время загрузки новых данных

**Impact:** При смене фильтров старые карточки остаются на экране до получения новых данных. Пользователь может кликнуть на устаревшую карточку. Нет визуальной индикации загрузки.

**Fix:** Использовать `status === 'pending'` для показа скелетонов при ЛЮБОМ изменении `searchParams`, а не только при начальной загрузке. Добавить `watch` на `searchParams` с показом/скрытием loading overlay.

---

### MI-9: Сезоны захардкожены (не динамические)

**Severity:** MEDIUM

**Location:** `app/pages/index.vue:44-54` — `seasonOptions` содержит сезоны 2024-2025 вручную

**Impact:** В 2026 году список сезонов устареет. Нет возможности смотреть аниме за другие годы. Каждый год нужно обновлять код.

**Fix:** Генерировать список сезонов динамически на основе текущего года:
```ts
const currentYear = new Date().getFullYear()
const seasonOptions = computed(() => {
  const seasons = ['winter', 'spring', 'summer', 'autumn']
  const labels: Record<string, string> = { winter: 'Зима', spring: 'Весна', summer: 'Лето', autumn: 'Осень' }
  const options = [{ label: 'Все сезоны', value: '' }]
  for (let year = currentYear; year >= currentYear - 3; year--) {
    for (const season of seasons) {
      options.push({ label: `${labels[season]} ${year}`, value: `${season}_${year}` })
    }
  }
  return options
})
```

---

### MI-10: `@nuxt/eslint` отсутствует в devDependencies

**Severity:** MEDIUM

**Location:** `package.json` — нет `@nuxt/eslint`

**Impact:** Проект без линтинга. Ошибки стиля, неиспользуемые переменные, потенциальные баги не отлавливаются.

**Fix:** `pnpm add -D @nuxt/eslint` и настроить `eslint.config.mjs`.

---

### MI-11: Нет unit / integration / E2E тестов

**Severity:** MEDIUM

**Location:** Не обнаружено тестовых файлов (vitest настроен, но тесты не написаны)

**Impact:** Любое изменение может сломать функциональность без обнаружения. Нет покрытия для composables, API routes, компонентов.

**Fix:** Следовать TDD-процессу из `.opencode/rules/common/testing.md`. Начать с тестов на composables (useAuth, useUserLists) и server routes.

---

### MI-12: Дефолтный README (Nuxt starter)

**Severity:** MEDIUM

**Location:** `README.md`

**Impact:** README не содержит информации о проекте AnimeBaza, его назначении, технологическом стеке, как запустить и разрабатывать.

**Fix:** Написать проектный README (можно позже, низкий приоритет).

---

## Low (косметика / полировка — не влияет на функциональность)

### LI-1: Скелетоны — захардкожено 12 карточек

**Severity:** LOW

**Location:** `app/pages/index.vue:231` — `v-for="n in 12"`

**Impact:** При изменении `limit` с 20 на другое число, количество скелетонов не соответствует реальному количеству загружаемых карточек. Косметический дефект.

**Fix:** Сделать параметр конфигурируемым: `v-for="n in searchParams.limit || 20"`.

---

### LI-2: `fetchpriority="high"` на постере без необходимости

**Severity:** LOW

**Location:** `app/pages/anime/[id].vue:188` — `fetchpriority="high"`

**Impact:** Незначительное. Постер не является LCP-элементом на странице тайтла. `fetchpriority="high"` зарезервирован для hero-изображений.

**Fix:** Убрать `fetchpriority="high"` или заменить на `fetchpriority="auto"`.

---

### LI-3: Дублирование шаблона popup (Desktop/Mobile)

**Severity:** LOW

**Location:** `app/pages/index.vue:360-478` — два идентичных блока popup

**Impact:** Копи-паст шаблона. При изменении popup нужно обновлять два места. Риск рассинхронизации.

**Fix:** При декомпозиции (HI-4) вынести в `<AnimePreviewPopup>`.

---

### LI-4: `router.replace` вместо `router.push` для навигации

**Severity:** LOW

**Location:** `app/pages/index.vue:77, 92` — используется `router.replace`

**Impact:** При нажатии "назад" в браузере пользователь пропускает историю изменения фильтров. Поведение спорное — некоторые предпочитают `replace` чтобы не засорять историю.

**Fix:** Сознательное решение. Оставить как есть, но документировать. Или использовать `router.push` для фильтров и `replace` для поиска (debounced).

---

### LI-5: Неполные alt-тексты для изображений

**Severity:** LOW

**Location:** `app/pages/index.vue:278` — `:alt="anime.name"`

**Impact:** Доступность. Для русскоязычных пользователей лучше использовать `anime.russian || anime.name`. Для скринридеров предпочтительнее локализованное название.

**Fix:** `:alt="anime.russian || anime.name"`

---

### LI-6: `import.meta.client` в `ClientOnly` избыточен

**Severity:** LOW

**Location:** `app/pages/anime/[id].vue:266` — `<ClientOnly>` оборачивает весь блок списков

**Impact:** Никакого. `<ClientOnly>` уже гарантирует выполнение только на клиенте. Просто лишний код.

**Fix:** Оставить как есть (это правильно).

---

### LI-7: `display: -webkit-box` без `-webkit-line-clamp` fallback

**Severity:** LOW

**Location:**
- `app/pages/index.vue:587-590`
- `app/pages/index.vue:708-710`

**Impact:** В браузерах без поддержки `-webkit-line-clamp` (теоретически — Firefox очень старых версий) текст не обрежется. Практически — все современные браузеры поддерживают.

**Fix:** Можно оставить. Добавить `overflow: hidden` для гарантии.

---

### LI-8: `uniq` импорт не используется — dead code

**Severity:** LOW

**Location:** Не обнаружено (проверить при декомпозиции)

**Impact:** Незначительное увеличение бандла.

**Fix:** Прогнать линтер с `no-unused-vars`.

---

## Architecture Review Summary

### Общая картина

Проект находится на стадии **рабочего прототипа**. SSR-рендеринг починен (CI-1, HI-6 — установлен `@vueuse/nuxt`, убран явный `localStorage` из `useStorage`). PrimeVue-тема Aura корректно загружена (HI-7, HI-8 — частично решены).

### Ключевые архитектурные разрывы

| Аспект | Спецификация (`anime-catalog-architecture.md`) | Реальность |
|--------|------------------------------------------------|------------|
| Компоненты | 15+ компонентов (AnimeCard, CatalogFilters, SearchBar, ...) | **0 компонентов** — всё в pages |
| CSS | БЭМ с отдельными файлами | Всё в `<style scoped>` внутри pages |
| Роутинг | `/catalog`, `/anime/[id]`, `/favorites`, `/profile` | `/`, `/anime/[id]`, `/login`, `/profile` |
| Пагинация | Infinite scroll + Paginator | Только Paginator с неверным total |
| Попап | OverlayPanel desktop / Dialog mobile | Сломано (нет hide) + дублирование шаблона |
| Поиск | URL-driven с debounce 400ms | Два конкурирующих механизма |
| Темизация | `darkModeSelector: '.dark-mode'` | Класс не добавляется |
| SSR safety | `@vueuse/nuxt` для `useStorage` | ✅ Установлен, SSR работает |
| UI/дизайн | Документ концепции (`concept.md`) с визуальным направлением | PrimeVue Aura-тема работает, но нет дизайн-системы |
| Шрифты | Inter в `font-family` | Не подключён — FOIT/FOUT |

### Рекомендованный порядок исправления

**Phase 1 — Critical (баги, SSR, работоспособность):**
1. ~~**CRITICAL** — Установить `@vueuse/nuxt`, SSR чиним (CI-1, HI-6)~~ ✅ **Готово**
2. ~~**HIGH** — Исправить тему PrimeVue: `preset: Aura` вместо `'aura'` (HI-7, HI-8)~~ ✅ **Готово**
3. ~~**CRITICAL** — Поиск: убрать `@input` из header, оставить только сабмит по Enter (CI-3)~~ ✅ **Готово**
4. ~~**CRITICAL** — Пагинация: Paginator → "Load more" кнопка (CI-2)~~ ✅ **Готово**
5. ~~**HIGH** — SelectButton `optionLabel`/`optionValue` fix (HI-1)~~ ✅ **Готово**
6. ~~**HIGH** — Добавить `.dark-mode` класс на `<html>` в `onMounted` (HI-3)~~ ✅ **Готово**

**Phase 2 — Refactoring (декомпозиция монолитов):**
5. **HIGH** — Вынести `AnimeCard.vue` из index.vue (HI-4 Phase 1)
6. **HIGH** — Починить OverlayPanel → `AnimePreviewPopup.vue` (HI-2)
7. **HIGH** — Санитизировать `v-html` (HI-5)
8. **HIGH** — Декомпозиция остальных компонентов (HI-4 Phase 2)

**Phase 3 — UI/Design (визуальное качество):**
9. **HIGH** — UI/визуальный редизайн: кнопки, типографика, hover-состояния (HI-7)
10. **HIGH** — CSS-система: контраст, fluid-типографика, вертикальный ритм (HI-8)
11. **HIGH** — Spacing/layout: единообразные отступы, max-width плеера (HI-9)
12. **HIGH** — Подключить шрифты: Inter через `@nuxt/fonts` (HI-10)

**Phase 4 — Quality (долг):**
13. **MEDIUM** — Архитектурный долг (MI-1–12)
14. **LOW** — Косметические фиксы (LI-1–8)

### Рекомендации по рефакторингу

**Не пытаться декомпозировать всё сразу.** Подход:
1. Сначала исправить критические баги (CI-1–3)
2. Вынести 2-3 ключевых компонента (AnimeCard, AnimePreviewPopup, CatalogFilters)
3. Проверить, что ничего не сломалось
4. Повторить для следующей группы

**Для декомпозиции использовать:**
- `@mouseenter`/`@mouseleave` → вынести в `AnimeCard.vue` с `@preview` событием
- Popup template → вынести в `AnimePreviewPopup.vue` (один компонент для Desktop/Mobile)
- Фильтры → `CatalogFilters.vue` с v-model на все параметры

---

*Последнее обновление: 2026-05-21*
