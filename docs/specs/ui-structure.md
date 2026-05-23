# UI Structure

## Страницы

| # | Страница | Маршрут | Назначение | Ключевые PrimeVue-компоненты |
|---|----------|---------|------------|------------------------------|
| 1 | **Каталог** | `/` | Сетка карточек аниме, поиск, фильтры (тип/статус/сезон/сорт.), кнопка «Загрузить ещё», **динамический расчёт количества карточек под экран** | PSelectButton, PSelect, PButton, PTag, PChip, POverlayPanel, PDialog |
| 2 | **Страница тайтла** | `/anime/[id]` | Постер, информация, плеер-заглушка, добавление в список, оценка | PTag, PRating, PChip, PButton, PSelectButton, PImage |
| 3 | **Вход** | `/login` | Псевдо-форма логина (любое имя → профиль) | PInputText, PButton |
| 4 | **Профиль** | `/profile` | Имя пользователя, 5 списков (planned/watching/completed/on_hold/dropped) с карточками, удаление | PTabView, PTabPanel, PButton, PTag |

## Компоненты

| Компонент | Файл | Назначение | Где используется |
|-----------|------|------------|------------------|
| **Header** | `app/components/layout/Header.vue` | Layout: шапка (лого + навигация + поиск), NuxtPage, подвал | Все страницы |
| **Footer** | `app/components/layout/Footer.vue` | Подвал с копирайтом | Все страницы |
| **AnimeCard** | `app/components/catalog/AnimeCard.vue` | Карточка аниме (постер, название, теги, рейтинг, кнопка «В список»/«Удалить») | Каталог |
| **CatalogFilters** | `app/components/catalog/CatalogFilters.vue` | Фильтры (тип, статус, сезон, сортировка), v-model | Каталог |
| **AnimePreviewPopup** | `app/components/catalog/AnimePreviewPopup.vue` | Всплывающий попап с деталями (OverlayPanel десктоп / Dialog мобильные) | Каталог |
| **PopupContent** | `app/components/catalog/PopupContent.vue` | Содержимое попапа (извлечено из AnimePreviewPopup для устранения дублирования Desktop/Mobile) | AnimePreviewPopup |
| **AnimeDetailHero** | `app/components/anime/AnimeDetailHero.vue` | Постер, заголовок, метаданные, жанры, описание (v-html санитизация) | Страница тайтла |
| **PlayerPlaceholder** | `app/components/anime/PlayerPlaceholder.vue` | Плеер-заглушка (иконка + «Видео временно недоступно») | Страница тайтла |
| **AnimeDetailLists** | `app/components/anime/AnimeDetailLists.vue` | Добавление в список / оценка (ClientOnly, useUserLists) | Страница тайтла |
| **ProfileCard** | `app/components/profile/ProfileCard.vue` | Аватар, имя пользователя, статистика по спискам | Профиль |
| **AnimeProfileCard** | `app/components/profile/AnimeProfileCard.vue` | Карточка аниме в списке (постер, название, статус, оценка, удаление) | Профиль |
| **ProfileTabEmpty** | `app/components/profile/ProfileTabEmpty.vue` | Пустое состояние вкладки списка | Профиль |
| **ErrorState** | `app/components/shared/ErrorState.vue` | Состояние ошибки с иконкой, сообщением и кнопкой повтора | Каталог, Страница тайтла |
| **EmptyState** | `app/components/shared/EmptyState.vue` | Пустое состояние с иконкой, сообщением и действием | Каталог |
| **SkeletonCatalogGrid** | `app/components/shared/SkeletonCatalogGrid.vue` | Скелетон-загрузчик сетки карточек (проп `count`, по умолчанию 20) | Каталог |
| **SkeletonAnimeDetail** | `app/components/shared/SkeletonAnimeDetail.vue` | Скелетон-загрузчик детальной страницы (постер + информация) | Страница тайтла |

## Composables

| Composable | Файл | Назначение |
|------------|------|------------|
| **useCatalogFillPage** | `app/composables/useCatalogFillPage.ts` | Динамический расчёт количества карточек для заполнения экрана каталога. Вычисляет колонки (по ширине контейнера) и ряды (по высоте viewport) на клиенте после монтирования. SSR-safe с дефолтом 12 карточек. |

## Макет (Layout)

- `app/app.vue` — корневой компонент с `<Header />`, `<NuxtPage />`, `<Footer />`
- Шапка (`Header.vue`): логотип "AnimeBaza", ссылки «Каталог» / «Войти» (или имя пользователя), поиск
- Подвал (`Footer.vue`): копирайт «AnimeBaza — учебный проект УП.02»
- Sticky-шапка (position: sticky) с backdrop-filter

## Навигация

- **AnimeBaza** (логотип) → `/`
- **Каталог** → `/`
- **Имя пользователя** (если авторизован) → `/profile`
- **Войти** (если не авторизован) → `/login`
- **Поиск** (в шапке) — debounced автопоиск (500ms) + по Enter, обновляет URL-параметр `?search=`. Кнопка очистки × при непустом поиске.

## Адаптивность

- CSS Grid с `auto-fill`/`minmax(180px, 1fr)` для сетки карточек
- На мобильных (<768px): grid → `minmax(140px, 1fr)`
- OverlayPanel → Dialog `position="bottom"` на мобильных (AnimePreviewPopup)
- Фильтры в столбик на мобильных (CatalogFilters)

## SSR-стратегия

| Страница | SSR | Причина |
|----------|-----|---------|
| Каталог `/` | ✅ SSR | Данные из Shikimori через Nitro proxy |
| Тайтл `/anime/[id]` | ✅ SSR | Данные через Nitro proxy |
| Вход `/login` | ✅ SSR | Статичная форма |
| Профиль `/profile` | ❌ ssr: false | localStorage + ClientOnly |

---

*Последнее обновление: 2026-05-23*

*Обновлено после рефакторинга: добавлены Header/Footer, AnimeProfileCard, ProfileTabEmpty, ErrorState, EmptyState, SkeletonCatalogGrid, SkeletonAnimeDetail; обновлены пути компонентов (feature-based папки).*
*Обновлено 2026-05-23: PrimeVue-компонентам добавлен префикс `P` (настройка `primevue.components.prefix` в `nuxt.config.ts`).*
*Обновлено 2026-05-23: добавлен `useCatalogFillPage` для динамического расчёта количества отображаемых карточек.*
