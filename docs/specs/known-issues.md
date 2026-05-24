# Known Issues (AnimeBaza)

> **Дата аудита:** 2026-05-23  
> **Последнее обновление:** 2026-05-23 — HI-2/HI-13 resolved: custom hover popup вместо PrimeVue OverlayPanel
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

### CI-4: `pages/anime/[id].vue` — `refresh()` не деконструирован из `useAsyncData`

**Severity:** CRITICAL

**Status:** ✅ RESOLVED (2026-05-23)

**Location:**
- `app/pages/anime/[id].vue:8` — `const { data: anime, status, error } = useAsyncData<Anime>(...)` — `refresh` отсутствует

**Impact:** На строке 25 вызывается `refresh()` в `@action="refresh()"` (кнопка «Повторить» в ErrorState), но `refresh` не деконструирован из `useAsyncData`. При клике на кнопку повтора — `TypeError: refresh is not a function`. Пользователь не может восстановиться после ошибки загрузки.

**Root Cause:** Ошибка копирования — при декомпозиции хиро-секции в `AnimeDetailHero.vue` переменная `refresh` была утеряна.

**Fix Applied (2026-05-23):**
1. `refresh` добавлен в деструктуризацию `useAsyncData`:
   ```ts
   const { data: anime, status, error, refresh } = useAsyncData<Anime>(...)
   ```
2. Создан регрессионный тест `test/unit/anime-detail-page.test.ts`, проверяющий наличие `refresh` в возвращаемом объекте

---

### CI-5: Cache-Control — `setResponseHeader` не работает из-за Nitro route rule

**Severity:** CRITICAL

**Status:** ✅ RESOLVED (2026-05-23)

**Location:**
- `server/api/anime/search.get.ts:25` — `setResponseHeader(event, 'Cache-Control', 'public, max-age=300')`
- `server/api/anime/[animeId].get.ts:20` — `setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')`
- `nuxt.config.ts` — route rule `'/api/**': { cache: { maxAge: 60 * 5 } }`

**Impact:** Вызовы `setResponseHeader` для Cache-Control в server routes не имели эффекта. Nitro route rule `'/api/**': { cache: { maxAge: 60 * 5 } }` в `nuxt.config.ts` переопределяет заголовок Cache-Control на уровне роута — `setResponseHeader` применяется раньше и перезаписывается маршрутизатором. Фактически все API-эндпоинты (и поиск, и детальная страница) отдавали `max-age=300` независимо от вызовов в коде.

**Root Cause:** `setResponseHeader` в Nitro server routes применяется до обработки route rules. Route rule `'/api/**': { cache: { maxAge: 60 * 5 } }` срабатывает после и перезаписывает заголовок. `setResponseHeader` в обоих роутах был мёртвым кодом.

**Fix Applied (2026-05-23):**
1. Удалён `setResponseHeader(event, 'Cache-Control', 'public, max-age=300')` из `server/api/anime/search.get.ts`
2. Удалён `setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')` из `server/api/anime/[animeId].get.ts`
3. Актуальное значение Cache-Control задаётся единой route rule `'/api/**': { cache: { maxAge: 60 * 5 } }` в `nuxt.config.ts`

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

### HI-2: OverlayPanel popup — заменён на кастомный HTML+CSS+JS

**Severity:** HIGH

**Status:** ✅ RESOLVED (2026-05-23)

**Location:** `app/components/catalog/AnimePreviewPopup.vue`, `app/composables/usePopupHover.ts`, `app/pages/index.vue`

**Impact (до фикса):**
- Popup не работал: `TypeError: can't access property "offsetHeight", e is null` — известный баг PrimeVue Popover (#3164) при асинхронных show/hide циклах
- Popup позиционировался относительно `event.currentTarget` (карточки) через `absolutePosition`. В CSS Grid `auto-fill minmax(180px, 1fr)` карточка занимает всю ширину колонки — места для показа popup сбоку нет, он перекрывает соседние карточки
- Два компонента (POverlayPanel desktop + PDialog mobile) с разной логикой управления
- SSR-небезопасный `window.innerWidth` (HI-13)

**Root Cause:** PrimeVue Popover (v4, наследник OverlayPanel) спроектирован для click-based триггеров — позиционирование привязано к bounding box целевого элемента. В CSS Grid это даёт непредсказуемое позиционирование (попап перекрывает соседние карточки). Дополнительно — баг #3164 (offsetHeight null при async show/hide).

**Fix Applied (2026-05-23):**
1. POverlayPanel и PDialog удалены. Вместо них — кастомный `<div>` с `position: fixed`
2. Создан composable `usePopupHover.ts` с hover bridge:
   - 300ms таймер показа (не дёргать при быстром скольжении)
   - 150ms grace-период скрытия (успевает переместить мышь на попап)
   - `onCardEnter(anime, event)` — запоминает `getBoundingClientRect` карточки
   - `onCardLeave()` / `onPopupEnter()` / `onPopupLeave()` — hover bridge
   - Clean-up таймеров в `onUnmounted`
3. Позиционирование: `position: fixed`, расчёт left/top из bounding rect карточки:
   - Десктоп: справа от карточки (+12px gap), если не влезает — слева
   - Вертикальный отступ: 20% от оценочной высоты попапа (~80px) ниже верхнего края карточки
   - Если не влезает снизу — прижимаем к нижнему краю (`bottom: 40px`), чтобы кнопки были видны
   - Защита от выхода за края экрана: 40px padding сверху и снизу
   - Мобильные: bottom sheet на всю ширину
4. Анимация: CSS transition (opacity + translateY, 200ms)
5. SSR-safe `useMediaQuery('(max-width: 767px)')` вместо `window.innerWidth` (HI-13 fixed)
6. PopupContent.vue переиспользован без изменений
7. Удалён: `popupRef`, `showPopup()`, `onPopupHide()`, императивный `show(event)`

---

### HI-3: Тёмная тема — селектор `.dark-mode` никогда не применяется

**Severity:** HIGH

**Status:** ✅ RESOLVED (2026-05-22)

**Location:**
- `nuxt.config.ts` — `darkModeSelector: '.dark-mode'`, `app.head.script` с inline-скриптом
- `app/assets/css/theme.css` — все токены заданы как тёмные

**Impact:** PrimeVue настроен ждать класс `.dark-mode` на `<html>` для активации тёмной темы, но этот класс нигде не добавляется. Поскольку CSS-токены уже тёмные, визуально выглядит нормально, но:
- PrimeVue-компоненты могут рендериться в светлой теме (несоответствие с кастомными токенами)
- Нет механизма переключения темы
- Некоторые PrimeVue-компоненты имеют отдельные тёмные варианты стилей, которые не активируются

**Root Cause:** Несоответствие между PrimeVue-конфигурацией (ждёт `.dark-mode`) и реальным DOM (класс не добавляется). Первая попытка (onMounted) давала flash светлой темы — класс добавлялся после первого paint.

**Fix Applied (2026-05-22):**
1. Кастомизация Aura-темы перенесена из CSS `--p-*` оверрайдов в официальный API `definePreset` (`nuxt.config.ts`)
2. Inline-скрипт `document.documentElement.classList.add("dark-mode")` добавлен через `app.head.script` — выполняется **до первого paint**, flash отсутствует
3. Удалены мёртвые CSS-блоки (`html.dark-mode { }`, `--p-*` в `:root`)
4. Удалён закомментированный `onMounted` из `app.vue`

---

### HI-4: Монолитные страницы — 739 и 671 строк без декомпозиции

**Severity:** HIGH

**Status:** ✅ RESOLVED (2026-05-23)

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

**Fix Applied (2026-05-23):** Все компоненты вынесены согласно архитектурной спецификации:
- `AnimeCard.vue`, `CatalogFilters.vue`, `AnimePreviewPopup.vue`, `PopupContent.vue` — из index.vue
- `AnimeDetailHero.vue`, `PlayerPlaceholder.vue`, `AnimeDetailLists.vue` — из [id].vue
- `SearchBar.vue` — поиск вынесен из app.vue в Header.vue
- `ProfileCard.vue`, `AnimeProfileCard.vue`, `ProfileTabEmpty.vue` — из profile.vue
- `ErrorState.vue`, `EmptyState.vue`, `SkeletonCatalogGrid.vue`, `SkeletonAnimeDetail.vue` — shared-компоненты
- `Header.vue`, `Footer.vue` — layout-компоненты

---

### HI-5: `v-html` без санитизации — потенциальный XSS

**Severity:** HIGH

**Status:** ✅ RESOLVED (2026-05-23)

**Location:** `app/pages/anime/[id].vue:250`

```vue
<div v-if="anime.descriptionHtml" class="anime-page__description-html" v-html="anime.descriptionHtml" />
```

**Impact:** `descriptionHtml` приходит из Shikimori API. Хотя API Shikimori контролируется третьей стороной и маловероятно содержит зловредный код, содержимое описаний может включать:
- `<script>` теги
- Inline обработчики (`onerror`, `onload`)
- Внешние ресурсы (iframes, изображения с трекингом)

**Root Cause:** Отсутствие санитизации HTML перед вставкой в DOM.

**Fix Applied (2026-05-23):**
1. Установлен `dompurify` и `@types/dompurify`
2. Санитизация реализована в `AnimeDetailHero.vue` через динамический import на клиенте:
```ts
const safeDescriptionHtml = computed(async () => {
  if (!anime.value?.descriptionHtml) return ''
  const DOMPurify = await import('dompurify')
  return DOMPurify.default.sanitize(anime.value.descriptionHtml, {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target'],
  })
})
```
3. `v-html="anime.descriptionHtml"` заменён на `v-html="safeDescriptionHtml"`

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

**Status:** ❌ FAILED (2026-05-23) — `clamp()` типографика и Button preset реализованы в коде, но:
- При вёрстке грида `minmax(200px, 240px)` карточки перестали заполнять экран
- `clamp()` может требовать калибровки для разных экранов
- Требуется визуальная проверка и калибровка на 320px/768px/1440px

**Location:** Глобально — все страницы и компоненты

**Impact:** Визуально сайт выглядит как "сырой прототип":
- **Кнопки:** Текст в PrimeVue-кнопках не имеет явного `font-weight` и `letter-spacing`, размер плохо подобран. Нет единой системы кнопок (primary/secondary/ghost выглядят как разрозненные компоненты). Кнопка "В список" и "Подробнее" в карточке визуально конфликтуют.
- **Типография:** Нет явной иерархии заголовков. `h1` = `--text-3xl (2rem)`, `h3` = `--text-sm (0.875rem)` — разрыв слишком большой. Нет настроек для `h2`, `h4` в системе токенов. Размеры шрифтов не используют `clamp()` для fluid-типографики.
- **Карточки:** Текст в карточках каталога разного размера, нет единого ритма. Заголовок карточки — `--text-sm`, рейтинг — `--text-xs`, статус — `--text-xs`. На мобильных становится нечитаемо.
- **Отсутствуют hover-состояния** у большинства интерактивных элементов (кроме карточек). Нет `transition` на ссылках, Chip, Tag, Select.
- **Нет микровзаимодействий**, описанных в `concept.md` (карточка приподнимается, попап выезжает, кнопка сжимается в галочку).
- **PrimeVue-компоненты не кастомизированы** через Pass Through — используются только базовые CSS-переменные. Это даёт "голый" PrimeVue вид без индивидуальности.

**Root Cause:** Стилизация сделана минимально — определён набор CSS-переменных, но нет дизайн-системы. Компоненты PrimeVue используются "as-is" без кастомизации через Pass Through. Нет целостного визуального дизайна — есть только базовая раскраска.

**Attempted Fix (2026-05-23):**
1. Все `--text-*` размеры переведены на `clamp()` для fluid-типографики:
   - `--text-base: clamp(0.875rem, 0.8rem + 0.4vw, 1rem)`
   - `--text-lg`/`--text-xl`/`--text-2xl`/`--text-3xl` с `clamp()`
   - `--text-sm` на мобильных не меньше 13px
2. Button кастомизирован через `definePreset`: `fontWeight: 600`
3. Aura-тема PrimeVue корректно загружена с 2603 CSS-переменными `--p-*`
4. Типографическая иерархия: h1-h6 с единой шкалой

**Still needs work:**
1. Grid `minmax(200px, 240px)` слишком жёсткий — карточки не растягиваются
2. PlayerPlaceholder `max-width: 640px` сделал плеер слишком маленьким
3. Hover/focus/active состояния на кастомных элементах
4. Микровзаимодействия (карточки, попап, кнопки)
5. Дальнейшая кастомизация через Pass Through

---

### HI-8: CSS — отсутствует целостная система, стили "кривые"

**Severity:** HIGH

**Status:** ✅ RESOLVED (2026-05-23)

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

**Fix Applied (2026-05-23):**
1. Контраст исправлен: `--text-muted: #686888` → `#9999bb` (соотношение ~4.8:1, соответствует WCAG AA)
2. Fluid-типографика: все `--text-*` размеры переведены на `clamp()`
3. Вертикальный ритм: добавлены `--space-section`, `--leading-body`, `--heading-margin-bottom`
4. Система breakpoints: добавлены `--bp-sm/md/lg/xl` CSS-переменные
5. PrimeVue-тема кастомизирована через `definePreset` (Aura base + overrides), тёмная тема включена через inline-скрипт `.dark-mode`

---

### HI-9: Нет единого подхода к spacing/layout — секции "плавают"

**Severity:** HIGH

**Status:** ✅ RESOLVED (2026-05-23) — карточки динамически подстраиваются под ширину и высоту экрана через `useCatalogFillPage` composable. Grid оставлен `auto-fill minmax(180px, 1fr)`, количество отображаемых карточек рассчитывается JS на клиенте.

**Location:** Все страницы

**Impact:** Визуальный хаос из-за несогласованных отступов:

- `.container` имеет `padding: 0 var(--space-6)` (16px) — нормально, но на мобильных (768px) header меняет padding на `var(--space-3) var(--space-4)` (12px 16px). Контент "дышит" неравномерно.
- Сетка карточек в каталоге: `grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))` — на планшетах карточки становятся слишком широкими, на широких экранах — слишком узкими, если аниме мало.
- Popup накладывается поверх карточек без затемнения фона — пользователь не понимает, что фон не интерактивен (на desktop через OverlayPanel, у которого нет backdrop).
- На странице профиля `TabView` не имеет отступа сверху/снизу, карточки вплотную прилегают к TabPanel.
- На странице тайтла секция "Добавить в список" (`.anime-page__lists`) имеет `padding: var(--space-6)`, а секция описания — `padding: var(--space-4)`. Разные отступы у визуально похожих блоков.
- Плеер-заглушка занимает всю ширину без `max-width`, на широких экранах выглядит нелепо (огромный пустой блок).

**Root Cause:** Отсутствует единая система отступов и layout-контейнеров. Каждая страница определяет свои padding/margin независимо.

**Fix Applied (2026-05-23):**
1. Создан composable `useCatalogFillPage.ts` — вычисляет колонки (по ширине контейнера) и ряды (по высоте viewport) на клиенте через `onMounted`
2. API всегда загружает 20 карточек, клиент отображает только те, что влезают (`slice(0, displayLimit)`)
3. SSR-дефолт: 12 карточек (6 колонок × 2 ряда при 1280px@1080p). После гидрации на клиенте пересчитывается под реальный вьюпорт
4. Кнопка "Загрузить ещё" — снимает `slice()`-лимит, показывает все загруженные карточки
5. Динамическое количество рядов: от 2 на ноутбуке 1080p до 5+ на 1440p

---

### HI-10: Нет загрузки шрифтов и предзагрузки критических ресурсов

**Severity:** HIGH

**Status:** ✅ RESOLVED (2026-05-23)

**Location:** 
- `app/assets/css/theme.css:52` — `font-family: 'Inter', ...`
- `nuxt.config.ts:73-78` — `app.head.link` с Google Fonts
- `package.json` — удалён `@nuxt/fonts`

**Impact (до фикса):** 
- Шрифт Inter не подключён через веб — используется системный шрифт (или падает на запасной). Сайт выглядит не так, как задумано.
- На машине разработчика Inter установлен локально, поэтому визуально шрифт отображается корректно.
- При первой загрузке на машине без Inter — FOIT (Flash of Invisible Text) или FOUT (Flash of Unstyled Text).

**Root Cause:** Inter указан как `font-family`, но не импортирован ни через `@import`, ни через `@font-face`, ни через Nuxt-модуль шрифтов. Первая попытка через `@nuxt/fonts` провалилась — пакет вызывает `IPC connection closed` при SSR в Nuxt 4.4.6 (ViteNode несовместимость с плагином `fontless`, который перехватывает CSS и делает файловый ввод-вывод в рантайме).

**Fix Applied (2026-05-23):**
1. Удалён `@nuxt/fonts` из `dependencies` (пакет оставался в `package.json` после первой неудачной попытки)
2. Добавлен `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">` в `app.head.link` в `nuxt.config.ts`
3. Шрифт загружается через Google Fonts — никаких SSR-проблем, `font-display: swap` гарантирует отсутствие FOIT

---

### HI-11: `SkeletonCatalogGrid.vue` — компонент не используется

**Severity:** HIGH

**Status:** ✅ RESOLVED (2026-05-23)

**Location:**
- `app/components/shared/SkeletonCatalogGrid.vue` — компонент определён
- `app/pages/index.vue:55-61` — инлайн-скелетоны вместо компонента

**Impact:** Компонент создан на этапе декомпозиции (HI-4), но не подключён ни в одной странице. `pages/index.vue` использует инлайн-разметку скелетонов (строки 55-61), которая дублирует логику `SkeletonCatalogGrid`. При изменении структуры карточки нужно править два места — компонент и инлайн-код.

**Root Cause:** Компонент был создан в рамках декомпозиции, но `index.vue` не был обновлён для его использования.

**Fix Applied (2026-05-23):**
1. Инлайн-скелетоны в `index.vue` заменены на `<SkeletonCatalogGrid v-if="status === 'pending'" />`

---

### HI-12: `EmptyState.vue` — проп `icon` не имеет значения по умолчанию

**Severity:** HIGH

**Status:** ✅ RESOLVED (2026-05-23)

**Location:**
- `app/components/shared/EmptyState.vue:16` — `:class="icon"` без дефолтного значения
- `app/pages/index.vue:74-79` — вызов `<EmptyState />` без `icon`

**Impact:** Шаблон рендерит `<i :class="icon" class="empty-state__icon" />`. При использовании без пропа `icon` (в `index.vue`), `<i>` рендерится с классом `empty-state__icon` но без класса иконки PrimeIcons. Иконка пустого состояния не отображается — пользователь видит пустой кружок.

**Root Cause:** Проп `icon` опциональный (`string` | `undefined`), но в шаблоне нет fallback-значения. Компонент используется в `index.vue` без `icon` для состояния «ничего не найдено».

**Fix Applied (2026-05-23):**
1. Добавлено значение по умолчанию `icon: 'pi pi-search'` через `withDefaults`
2. `primeicons/primeicons.css` добавлен в `css: []` в `nuxt.config.ts`

---

### HI-13: `AnimePreviewPopup.vue` — SSR-небезопасный `window.innerWidth`

**Severity:** HIGH

**Status:** ✅ RESOLVED (2026-05-23) — исправлено вместе с HI-2.

**Location:** `app/components/catalog/AnimePreviewPopup.vue:18`

**Impact:** `onMounted(() => { isMobile.value = window.innerWidth < 768 })` — технически безопасно (onMounted работает только на клиенте в Nuxt), но между SSR-гидрацией и монтированием `isMobile` всегда `false`. Это вызывает визуальный флеш: на мобильных устройствах сначала отрисовывается десктопный OverlayPanel, который затем заменяется на Dialog.

**Root Cause:** Прямой доступ к `window.innerWidth` без SSR-safe альтернативы. `useMediaQuery` из VueUse предоставляет реактивный SSR-safe вариант.

**Fix Applied (2026-05-23):**
```ts
import { useMediaQuery } from '@vueuse/core'
const isMobile = useMediaQuery('(max-width: 767px)')
```
Заменён вместе с переделкой popup (HI-2). Удалён `onMounted` с `window.innerWidth`, удалён `window.addEventListener('resize', onResize)` — утечка памяти (MI-1) тоже починена.

---

### HI-14: `SkeletonAnimeDetail.vue` — скелетон не соответствует реальному layout страницы

**Severity:** HIGH

**Status:** ❌ PENDING

**Location:**
- `app/components/shared/SkeletonAnimeDetail.vue` — скелетон (постер + info grid)
- `app/pages/anime/[id].vue:16` — `<SkeletonAnimeDetail v-if="status === 'pending'" />`
- `app/components/anime/AnimeDetailHero.vue` — реальный компонент

**Impact:**
- Скелетон рендерит grid с постером (280px) + колонка информации (заголовок, подзаголовок, 3 линии описания)
- Реальный layout страницы — это AnimeDetailHero (постер + метаданные + жанры + описание) + PlayerPlaceholder + AnimeDetailLists
- Скелетон не отображает: PlayerPlaceholder, списки (AnimeDetailLists), блок с жанрами, метаданные (тип, статус, эпизоды, рейтинг)
- Пользователь видит скелетон, потом резкий переход к полной странице — визуальный скачок

**Root Cause:** Скелетон создавался, когда ещё был монолит (671 строка). После декомпозиции на AnimeDetailHero, PlayerPlaceholder, AnimeDetailLists — скелетон не обновлялся.

**Fix:**
- Синхронизировать структуру скелетона с реальной структурой страницы
- Добавить заглушки для: PlayerPlaceholder (16:9 блок), блока метаданных, блока списков
- Учесть мобильную версию (на мобилках постер сверху, информация снизу)

---

### HI-15: `SkeletonCatalogGrid.vue` — скелетон не соответствует `AnimeCard`

**Severity:** HIGH

**Status:** ❌ PENDING

**Location:**
- `app/components/shared/SkeletonCatalogGrid.vue` — скелетон (постер + title + subtitle)
- `app/components/catalog/AnimeCard.vue` — реальная карточка (kind-badge, meta с status/score, actions)
- `app/assets/css/theme.css:203-236` — CSS-классы skeleton-card

**Impact:**
- Скелетон состоит из: постера, title (14px высота), subtitle (12px, 60% ширина)
- Реальная AnimeCard имеет: постер с PTag kind-badge оверлеем, title, meta (PTag status + score с иконкой), actions (кнопка "В список" или badge + delete)
- Визуально: скелетон кажется «полым» — нет намёка на badge, рейтинг, кнопку
- При загрузке реальная карточка выглядит гораздо плотнее скелетона

**Root Cause:** Скелетон создавался для первой версии карточки и не обновлялся при рефакторинге AnimeCard.

**Fix:**
- Добавить в скелетон: блок meta (статус + рейтинг), блок actions (кнопка)
- Добавить небольшой badge-элемент на постер (как kind-badge)
- Сохранить shimmer-анимацию

---

### HI-16: `Profile.vue` — дублирование `:header` prop при использовании `#header` slot

**Severity:** HIGH

**Status:** ✅ RESOLVED (2026-05-24)

**Location:**
- `app/pages/profile.vue:50` — `:header="USER_LIST_LABELS[status]"` (prop)
- `app/pages/profile.vue:52-61` — `#header` slot с тем же `{{ USER_LIST_LABELS[status] }}`

**Impact:**
- `:header="..."` передаёт текст заголовка через prop
- `#header` slot полностью переопределяет шаблон заголовка, включая тот же текст + счётчик
- Prop `:header` становится мёртвым кодом — он не используется, т.к. slot его перекрывает
- Создаёт путаницу: при попытке изменить заголовок нужно править в двух местах (или slot не заметить)
- PrimeVue может рендерить и header-prop, и header-slot одновременно в некоторых версиях → потенциальное визуальное дублирование

**Root Cause:** Компонент создавался с `:header`, затем был добавлен `#header` slot для кастомного шаблона со счётчиком. Prop не был удалён.

**Fix Applied (2026-05-24):**
- Убран `:header="USER_LIST_LABELS[status]"` — оставлен только `#header` slot

---

### HI-17: Английский текст в интерфейсе — перевести на русский

**Severity:** HIGH

**Status:** ✅ RESOLVED (2026-05-24)

**Location:**
- `app/components/profile/ProfileTabEmpty.vue:4` — `Nothing here yet`
- `app/components/profile/ProfileTabEmpty.vue:6` — `Browse catalog`

**Impact:**
- Визуально: английские фразы среди русского интерфейса смотрятся инородно
- `ProfileTabEmpty` используется в профиле для пустых списков — пользователь видит английский при первом входе

**Root Cause:** Компонент создавался на английском, перевод не был внесён. Вся остальная часть приложения на русском.

**Fix:**
- `Nothing here yet` → `Здесь пока ничего нет`
- `Browse catalog` → `Перейти в каталог`

Проверка на наличие другого английского текста: выполнена. Все остальные строки в проекте уже на русском — кнопки (Войти, Выйти, В список, Удалить, Загрузить ещё, Повторить), сообщения (Ничего не найдено, Ошибка загрузки, Видео временно недоступно), плейсхолдеры (Поиск аниме...), лейблы (Запланировано, Смотрю, Просмотрено, Отложено, Брошено), header/footer. Единственный английский текст был в ProfileTabEmpty.vue — переведён.

**Fix Applied (2026-05-24):**
- `Nothing here yet` → `Здесь пока ничего нет`
- `Browse catalog` → `Перейти в каталог`

### HI-18: CatalogFilters — мобильная вёрстка фильтров на главной странице

**Severity:** HIGH

**Status:** ✅ RESOLVED (2026-05-24)

**Location:**
- `app/components/catalog/CatalogFilters.vue` — весь компонент

**Root Cause:** Кастомный CSS для мобильной версии менял только `flex-direction` на `column`, но не сбрасывал `align-items: flex-end` (наследовалось из десктопного стиля). На мобилке с колоночным флексом `align-items` управляет горизонтальным выравниванием — все группы прижимались к правому краю. Сезон и Сортировка были отдельными строками вместо одной.

**Fix Applied (2026-05-24):**
1. Добавлен `align-items: stretch` в мобильный media-query — группы растягиваются на всю ширину и выравниваются по левому краю
2. Сезон и Сортировка обёрнуты в `catalog-filters__row` — на мобилке контейнер становится `display: flex; flex-direction: row`, дочерние группы получают `flex: 1` и стоят рядом на одной строке
3. PSelectButton для Типа (6 опций) и Статуса (4 опции) заменён на PSelect (dropdown) на мобилке через `useMediaQuery('(max-width: 767px)')` — больше не переполняют экран

**Fix Applied (2026-05-24) — Iteration 3 (SSR flash + PSelect padding):**
4. `v-if="isMobile"`/`v-else` заменён на CSS-only show/hide: оба компонента (PSelect и PSelectButton) всегда в DOM, переключение через `.catalog-filters__mobile-only` / `.catalog-filters__desktop-only` с `display: none/block` в media-query. Нет SSR-флеша, нет hydration mismatch.
5. Удалён импорт `useMediaQuery` — больше не нужен для переключения.
6. Добавлен `{{ min-height: 42px }}` на `.catalog-filters__select` для стабильной высоты.
7. Добавлен `:deep(.p-select-label) { padding-block: 10px }` на мобилке — PSelect root padding = 0, текст не прижат.

---

### HI-19: Profile — мобильная вёрстка страницы профиля

**Severity:** HIGH

**Status:** ❌ PENDING

**Location:**
- `app/pages/profile.vue:26-82` — шаблон страницы профиля
- `app/pages/profile.vue:126-141` — мобильные стили
- `app/components/profile/ProfileCard.vue:23-31` — stats (5 статусов)
- `app/components/profile/AnimeProfileCard.vue:53-122` — карточка аниме в списке

**Impact:** На мобильных экранах профиль выглядит неаккуратно:

- **PTabView с 5 табами:** PrimeVue TabView не имеет пропа `scrollable`. На мобильных экранах (<480px) 5 вкладок (Запланировано, Смотрю, Просмотрено, Отложено, Брошено) переполняют контейнер — вкладки сжимаются до нечитаемого размера или переносятся. Нет horizontal scroll.
- **ProfileCard stats:** 5 блоков статистики (`flex-wrap: wrap`) на мобильных выглядят как неровная сетка — по 2-3 блока в строке, последняя строка с одним блоком.
- **AnimeProfileCard:** Карточка с постером (60×80px), названием, статусом, рейтингом и кнопкой удаления на узких экранах становится перегруженной.
- ~~**Header (ProfileCard + кнопка выхода):** На мобильных заголовок складывается в колонку, кнопка выхода на всю ширину выглядит оторванной.~~ ✅ RESOLVED (2026-05-24) — кнопка вынесена в правый угол через `margin-left: auto`, заголовок остаётся в row-режиме с `flex-wrap: wrap`.
- **Таб-хедеры на 480px:** `flex-direction: column` для tab-header — счётчик переносится под лейбл, высота табов увеличивается.

**Root Cause:** Профиль не получал мобильной адаптации при создании. PTabView PrimeVue по умолчанию не поддерживает scrollable tabs. Stats ProfileCard использует `flex-wrap` без адаптивных брейкпоинтов. AnimeProfileCard не имеет мобильной компактной версии.

**Fix:**
- Добавить scrollable-режим для PTabView (кастомный CSS с `overflow-x: auto` + flex-shrink: 0 для вкладок)
- Либо заменить PTabView на кастомные вкладки с horizontal scroll на мобильных
- ProfileCard stats: переключиться на grid `repeat(auto-fill, minmax(70px, 1fr))` вместо flex-wrap
- AnimeProfileCard: уменьшить постер до 48×64px на мобильных, убрать или перенести кнопку удаления
- ~~Компактное расположение кнопки выхода на мобильных~~ ✅ RESOLVED (2026-05-24)

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
- `app/composables/useCatalogSearchState.ts:8-13` — все query-параметры кастятся через `as string`
- `app/composables/useHeaderSearch.ts:30` — `route.query.search as string`
- `app/pages/anime/[id].vue:5` — `route.params.id as string` (может быть `string[]`)

**Impact:** Потеря type safety в критических местах — ошибки API, несоответствие типов не отлавливаются на этапе компиляции. `route.query.*` имеет тип `string | string[] | undefined`, ассершн `as string` скрывает эти варианты. Если URL содержит `?kind=tv&kind=movie`, `query.kind` станет массивом `['tv', 'movie']`, что приведёт к неожиданному поведению.

**Fix:**
1. Создать typed GraphQL response interface в `app/types/anime.ts`:
```ts
interface GraphQLAnimeResponse { animes: Anime[] }
```
2. Заменить `unknown[]` на `Anime[]` в server routes
3. Заменить `(error as any)` на использование `NuxtError` типа из `#app`
4. Добавить явные типы для параметров функций
5. Создать утилиту `useQueryParam(key, default)` для безопасного чтения query-параметров без ассершнов

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

**Status:** ✅ RESOLVED (2026-05-23)

**Location:** `package.json:22` — `"nuxt-mcp-dev": "^0.3.2"` в `dependencies`, а не в `devDependencies`

**Impact:** Production-бандл включает dev-инструменты. Увеличивает размер бандла, потенциально добавляет уязвимости, не нужные в production.

**Fix Applied (2026-05-23):**
```bash
pnpm remove nuxt-mcp-dev && pnpm add -D nuxt-mcp-dev
```

---

### MI-6: `@primevue/mcp` в production dependencies

**Severity:** MEDIUM

**Status:** ✅ RESOLVED (2026-05-23)

**Location:** `package.json:17` — `"@primevue/mcp": "^4.5.5"` в `dependencies`

**Impact:** MCP-сервер для PrimeVue используется только для AI-assisted разработки. Не нужен в production-бандле. Добавляет ~2-5 MB к бандлу.

**Fix Applied (2026-05-23):** Перемещён в `devDependencies`.

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

**Status:** ✅ RESOLVED (2026-05-23)

**Location:** `app/pages/index.vue:44-54` — `seasonOptions` содержит сезоны 2024-2025 вручную

**Impact:** В 2026 году список сезонов устареет. Нет возможности смотреть аниме за другие годы. Каждый год нужно обновлять код.

**Fix Applied (2026-05-23):** Список сезонов генерируется динамически на основе текущего года (4 года назад от текущего). Вынесен в `CatalogFilters.vue`:
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

**Status:** ✅ RESOLVED (2026-05-23)

**Location:** `package.json` — нет `@nuxt/eslint`

**Impact:** Проект без линтинга. Ошибки стиля, неиспользуемые переменные, потенциальные баги не отлавливаются.

**Fix Applied (2026-05-23):**
1. `pnpm add -D @nuxt/eslint @nuxt/eslint-config eslint`
2. Добавлен `'@nuxt/eslint'` в `modules` в `nuxt.config.ts`
3. `eslint.config.mjs` авто-сгенерирован через `nuxt prepare` — импортирует `withNuxt` из `.nuxt/eslint.config.mjs`
4. ESLint запускается: `npx eslint app/`
5. **Известное ограничение:** Vue SFC с `<script setup lang="ts">` выдаёт parsing errors из-за особенностей `@nuxt/eslint-config` с pnpm (внутренний TypeScript-парсер не прокидывается в `vue-eslint-parser`). Требует дополнительной настройки или фикса в `@nuxt/eslint-config`.

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

### MI-13: `AnimeProfileCard.vue` — type assertion `item.status as UserListStatus`

**Severity:** MEDIUM

**Status:** ✅ RESOLVED (2026-05-23)

**Location:** `app/components/profile/AnimeProfileCard.vue:15` — `:value="USER_LIST_LABELS[item.status as UserListStatus]"`

**Impact:** Ассершн `as UserListStatus` bypasses type safety. `item.status` из `UserListItem` уже типизирован как `UserListStatus`, но при доступе через индексацию объекта TypeScript не выводит это. Если в localStorage попадёт невалидный статус, ошибка проявится в рантайме.

**Fix Applied (2026-05-23):** Использован `Object.hasOwn(USER_LIST_LABELS, item.status)` для безопасной проверки вместо `as UserListStatus`.

---

### MI-14: Дублирование шаблона popup в `AnimePreviewPopup.vue` (Desktop/Mobile)

**Severity:** MEDIUM

**Status:** ✅ RESOLVED (2026-05-23) — шаблон вынесен в `<PopupContent.vue>`. Используется в новом кастомном popup (HI-2).

**Location:** `app/components/catalog/AnimePreviewPopup.vue:58-188` — два идентичных блока содержимого popup для OverlayPanel и Dialog

**Impact:** Desktop-OverlayPanel и Mobile-Dialog содержат одинаковое содержимое. При изменении структуры popup нужно править оба блока. Риск рассинхронизации.

**Fix Applied (2026-05-23):** Содержимое popup вынесено в отдельный компонент `<PopupContent.vue>`. `AnimePreviewPopup.vue` сокращён со 188 до 112 строк.

---

## Low (косметика / полировка — не влияет на функциональность)

### LI-1: Скелетоны — захардкожено 12 карточек

**Severity:** LOW

**Status:** ✅ RESOLVED (2026-05-23)

**Location:** `app/pages/index.vue:231` — `v-for="n in 12"`

**Impact:** При изменении `limit` с 20 на другое число, количество скелетонов не соответствует реальному количеству загружаемых карточек. Косметический дефект.

**Fix Applied (2026-05-23):** `SkeletonCatalogGrid` добавлен проп `count` со значением по умолчанию 20. `index.vue` использует `<SkeletonCatalogGrid :count="limit" />`.

---

### LI-2: `fetchpriority="high"` на постере без необходимости

**Severity:** LOW

**Status:** ✅ RESOLVED (2026-05-23)

**Location:** `app/pages/anime/[id].vue:188` — `fetchpriority="high"`

**Impact:** Незначительное. Постер не является LCP-элементом на странице тайтла. `fetchpriority="high"` зарезервирован для hero-изображений.

**Fix Applied (2026-05-23):** `fetchpriority="high"` удалён из постера в `AnimeDetailHero.vue`.

---

### LI-3: Дублирование шаблона popup (Desktop/Mobile)

**Severity:** LOW

**Status:** ✅ RESOLVED (2026-05-23)

**Location:** `app/pages/index.vue:360-478` — два идентичных блока popup

**Impact:** Копи-паст шаблона. При изменении popup нужно обновлять два места. Риск рассинхронизации.

**Fix Applied (2026-05-23):** Исправлено совместно с MI-14 и HI-2 — дублированный шаблон вынесен в `<PopupContent.vue>`, используется в кастомном popup (Desktop/Mobile через useMediaQuery).

---

### LI-4: `router.replace` вместо `router.push` для навигации

**Severity:** LOW

**Location:** `app/pages/index.vue:77, 92` — используется `router.replace`

**Impact:** При нажатии "назад" в браузере пользователь пропускает историю изменения фильтров. Поведение спорное — некоторые предпочитают `replace` чтобы не засорять историю.

**Fix:** Сознательное решение. Оставить как есть, но документировать. Или использовать `router.push` для фильтров и `replace` для поиска (debounced).

---

### LI-5: Неполные alt-тексты для изображений

**Severity:** LOW

**Status:** ✅ RESOLVED (2026-05-23)

**Location:** `app/pages/index.vue:278` — `:alt="anime.name"`

**Impact:** Доступность. Для русскоязычных пользователей лучше использовать `anime.russian || anime.name`. Для скринридеров предпочтительнее локализованное название.

**Fix Applied (2026-05-23):** `:alt` заменён на `anime.russian || anime.name` во всех карточках.

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

### LI-9: `AnimeProfileCard.vue` — нарушен порядок template/script setup

**Severity:** LOW

**Status:** ✅ RESOLVED (2026-05-23)

**Location:** `app/components/profile/AnimeProfileCard.vue:1-51`

**Impact:** Во всех компонентах проекта сначала идёт `<script setup lang="ts">`, затем `<template>`. В `AnimeProfileCard.vue` порядок обратный. Не влияет на функциональность, но нарушает принятую конвенцию.

**Fix Applied (2026-05-23):** `<script setup>` и `<template>` переставлены местами.

---

### LI-10: `PlayerPlaceholder.vue` — пустой `<script setup lang="ts">`

**Severity:** LOW

**Status:** ✅ RESOLVED (2026-05-23)

**Location:** `app/components/anime/PlayerPlaceholder.vue:1-3`

**Impact:** Пустой блок script setup без импортов, типов или логики. Никак не влияет на рантайм, но создаёт шум в коде.

**Fix Applied (2026-05-23):** Пустой `<script setup lang="ts">` удалён.

---

### LI-11: `app.vue` — отсутствует анимация `<NuxtPage />`

**Severity:** LOW

**Location:** `app/app.vue:5` — `<NuxtPage />` без обёртки в `<Transition>`

**Impact:** Страницы переключаются мгновенно, без плавного перехода. Визуально feels like jank на навигации.

**Fix:** Оборать `<NuxtPage />` в `<Transition name="page" mode="out-in">` и добавить CSS-анимацию.

---

### LI-12: Избыточный `ssr: false` — задвоен в routeRules и definePageMeta

**Severity:** LOW

**Status:** ✅ RESOLVED (2026-05-23)

**Location:**
- `nuxt.config.ts:93` — `routeRules: { '/profile': { ssr: false } }`
- `app/pages/profile.vue:5` — `definePageMeta({ ssr: false })`

**Impact:** SSR для `/profile` отключается дважды — в конфигурации и на странице. Один из способов избыточен. Не ломает ничего, но дублирует конфигурацию.

**Fix Applied (2026-05-23):** `definePageMeta({ ssr: false })` удалён из `profile.vue`, оставлен только `routeRules`.

---

### LI-13: `SkeletonAnimeDetail.vue` — инлайн-стили bypass БЭМ

**Severity:** LOW

**Status:** ✅ RESOLVED (2026-05-23)

**Location:** `app/components/shared/SkeletonAnimeDetail.vue` — было 5 `style=""` атрибутов

**Impact:** Использование инлайн-стилей в шаблоне противоречит БЭМ-методологии проекта. Стили должны быть вынесены в CSS-классы с модификаторами.

**Fix Applied (2026-05-23):** Все инлайн-стили заменены на БЭМ-классы:
- `.skeleton-anime-detail__title` — заголовок (70% × 28px) + shimmer
- `.skeleton-anime-detail__subtitle` — подзаголовок (50% × 18px) + shimmer
- `.skeleton-anime-detail__lines` — контейнер для 3 линий
- `.skeleton-anime-detail__line_medium/__line_long/__line_short` — линии с разной шириной
- Shimmer-анимация перенесена в `<style scoped>` (ранее бралась из глобального `skeleton-card__*` в `theme.css`)

---

### LI-14: `error?.statusMessage` — потенциально неверный тип

**Severity:** LOW

**Location:** `app/pages/index.vue:70` — `error?.statusMessage`

**Impact:** `error` от `useAsyncData` имеет тип `NuxtError | null`, у которого нет поля `.statusMessage` напрямую. На практике работает через `as any` на более высоком уровне, но TypeScript может подсвечивать проблему.

**Fix:** Использовать типизированную проверку: `(error as NuxtError)?.statusMessage` или определить правильный тип.

---

## Architecture Review Summary

### Общая картина

Проект находится на стадии **рабочего прототипа**. SSR-рендеринг починен (CI-1, HI-6 — установлен `@vueuse/nuxt`, убран явный `localStorage` из `useStorage`). PrimeVue-тема Aura корректно загружена (HI-7, HI-8 — full fix: clamp-типографика, contrast, breakpoints, definePreset). Тёмная тема Aura включена через `definePreset`, `.dark-mode` класс устанавливается синхронно до первого paint. Шрифт Inter подключён через Google Fonts (`app.head.link`) (HI-10). Декомпозиция монолитов завершена — все 17 компонентов вынесены (HI-4). Попап переписан на кастомный `<div>` вместо PrimeVue OverlayPanel (HI-2/HI-13). Dependencies очищены (MI-5, MI-6). Динамический расчёт количества карточек реализован: `useCatalogFillPage` вычисляет кол-во колонок и рядов под конкретный экран (HI-9). Исправлено дублирование header в профиле (HI-16) — удалён `:header` prop, оставлен только `#header` slot. Английский текст переведён на русский (HI-17). Кнопка выхода в профиле вынесена в правый угол (HI-19 — частично). Мобильная вёрстка фильтров (HI-18) — исправлена. Остаются: скелетоны не синхронизированы с layout (HI-14, HI-15), мобильная вёрстка профиля (HI-19 — требуется доработка вкладок и карточек).

### Ключевые архитектурные разрывы

| Аспект | Спецификация (`anime-catalog-architecture.md`) | Реальность |
|--------|------------------------------------------------|------------|
| Компоненты | 15+ компонентов (AnimeCard, CatalogFilters, SearchBar, ...) | ✅ 17 компонентов вынесены, включая PopupContent |
| CSS | БЭМ с отдельными файлами | ✅ Стили распределены по компонентам |
| Роутинг | `/catalog`, `/anime/[id]`, `/favorites`, `/profile` | `/`, `/anime/[id]`, `/login`, `/profile` |
| Пагинация | Infinite scroll + Paginator | ✅ Load More кнопка (CI-2) |
| Попап | OverlayPanel desktop / Dialog mobile | ✅ Кастомный `<div>` (position: fixed, CSS transition) + usePopupHover (HI-2) |
| UI/дизайн | Документ концепции (`concept.md`) с визуальным направлением | ✅ `clamp()`, Button preset, динамический fill-page (HI-7, HI-9), плеер требует калибровки |
| Шрифты | Inter в `font-family` | ✅ Inter через Google Fonts `app.head.link` (HI-10) |

### Рекомендованный порядок исправления

**Phase 1 — Critical (баги, SSR, работоспособность):**
1. ~~**CRITICAL** — Установить `@vueuse/nuxt`, SSR чиним (CI-1, HI-6)~~ ✅ **Готово**
2. ~~**HIGH** — Исправить тему PrimeVue: `preset: Aura` вместо `'aura'` (HI-7, HI-8)~~ ✅ **Готово**
3. ~~**CRITICAL** — Поиск: убрать `@input` из header, оставить только сабмит по Enter (CI-3)~~ ✅ **Готово**
4. ~~**CRITICAL** — Пагинация: Paginator → "Load more" кнопка (CI-2)~~ ✅ **Готово**
5. ~~**HIGH** — SelectButton `optionLabel`/`optionValue` fix (HI-1)~~ ✅ **Готово**
6. ~~**HIGH** — Добавить `.dark-mode` класс на `<html>` через inline-скрипт, кастомизация через `definePreset` (HI-3)~~ ✅ **Готово**
7. ~~**CRITICAL** — Исправить `refresh` в `useAsyncData` на `[id].vue` (CI-4)~~ ✅ **Готово**
8. ~~**CRITICAL** — Синхронизировать Cache-Control в тесте и серверном роуте (CI-5)~~ ✅ **Готово**

**Phase 2 — Refactoring (декомпозиция монолитов):**
5. ~~**HIGH** — Вынести `AnimeCard.vue` из index.vue (HI-4)~~ ✅ **Готово**
6. ~~**HIGH** — Переписать popup без PrimeVue: кастомный `<div>` + CSS-анимация + `usePopupHover` (HI-2)~~ ✅ **Готово**
7. ~~**HIGH** — Санитизировать `v-html` (HI-5)~~ ✅ **Готово**
8. ~~**HIGH** — Декомпозиция остальных компонентов (HI-4 Phase 2)~~ ✅ **Готово**
9. ~~**HIGH** — Подключить `SkeletonCatalogGrid.vue` в index.vue (HI-11)~~ ✅ **Готово**
10. ~~**HIGH** — Добавить дефолтный `icon` в `EmptyState.vue` (HI-12)~~ ✅ **Готово**
11. ~~**HIGH** — Заменить `window.innerWidth` на `useMediaQuery` (HI-13)~~ ✅ **Готово**

**Phase 3 — UI/Design (визуальное качество):**
12. **HIGH** — UI/визуальный редизайн: кнопки, типографика (HI-7) ❌ **Требует доработки** — grid/player не прошли проверку
13. ~~**HIGH** — CSS-система: контраст, fluid-типографика, breakpoints (HI-8)~~ ✅ **Готово**
14. ~~**HIGH** — Spacing/layout: плеер max-width, grid sizing (HI-9)~~ ✅ **Готово** — динамический расчёт карточек через `useCatalogFillPage`
15. ~~**HIGH** — Подключить шрифты: Inter через Google Fonts (HI-10)~~ ✅ **Готово**
16. **HIGH** — Синхронизировать `SkeletonAnimeDetail` с реальным layout страницы (HI-14) ❌ **PENDING**
17. **HIGH** — Синхронизировать `SkeletonCatalogGrid` с `AnimeCard` — скелетон кривой (HI-15) ❌ **PENDING**
18. ~~**HIGH** — Убрать дублирование `:header` prop в `PTabPanel` на profile (HI-16)~~ ✅ **Готово**
19. ~~**HIGH** — Перевести английский текст на русский (HI-17)~~ ✅ **Готово**
20. ~~**HIGH** — Мобильная верстка фильтров на главной (HI-18)~~ ✅ **Готово**
21. **HIGH** — Мобильная верстка профиля (HI-19) ❌ **PENDING** (частично: кнопка выхода в углу — готово, вкладки и карточки — pending)

**Phase 4 — Quality (долг):**
22. **MEDIUM** — Архитектурный долг (MI-1–14) — частично выполнено (MI-5, MI-6, MI-9, MI-13, MI-14)
23. **LOW** — Косметические фиксы (LI-1–14) — частично выполнено (LI-1, LI-2, LI-3, LI-5, LI-9, LI-10, LI-12, LI-13)

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

*Последнее обновление: 2026-05-22 — обновлён HI-3 (inline-скрипт + definePreset), архитектурная сводка синхронизирована*
*Последнее обновление: 2026-05-23 — все HI/LI/MI Phase 2-3 исправления отмечены как RESOLVED; архитектурная сводка обновлена*
*Последнее обновление: 2026-05-23 — добавлены HI-14–17 (скелетоны, профиль, английский текст)*
*Последнее обновление: 2026-05-23 — добавлены HI-18 (мобильные фильтры) и HI-19 (мобильный профиль)*
*Последнее обновление: 2026-05-23 — HI-2/HI-13 resolved: кастомный popup (position: fixed) + usePopupHover вместо POverlayPanel/PDialog
*Последнее обновление: 2026-05-24 — HI-18 resolved (iterations 1-3): мобильная верстка фильтров (CatalogFilters) — выравнивание по левому краю + Сезон/Сортировка на одной строке + CSS-only show/hide для PSelect/PSelectButton без SSR-флеша*
*Последнее обновление: 2026-05-24 — HI-16/HI-17 resolved: tab header duplication fix (удалён `:header` prop), перевод английского текста на русский. HI-19 частично: кнопка выхода в правом углу через `margin-left: auto`. Добавлен `clearAll()` в useUserLists, logout очищает списки и рейтинги.*
