# UI Structure

## Страницы

| # | Страница | Маршрут | Назначение | Ключевые PrimeVue-компоненты |
|---|----------|---------|------------|------------------------------|
| 1 | **Каталог** | `/` | Сетка карточек аниме, поиск, фильтры (тип/статус/сезон/сорт.), кнопка «Загрузить ещё» | SelectButton, Select, Button, Tag, Chip, OverlayPanel, Dialog |
| 2 | **Страница тайтла** | `/anime/[id]` | Постер, информация, плеер-заглушка, добавление в список, оценка | Tag, Rating, Chip, Button, SelectButton |
| 3 | **Вход** | `/login` | Псевдо-форма логина (любое имя → профиль) | InputText, Button |
| 4 | **Профиль** | `/profile` | Имя пользователя, 5 списков (planned/watching/completed/on_hold/dropped) с карточками, удаление | TabView, TabPanel, Button, Tag |

## Компоненты

| Компонент | Файл | Назначение | Где используется |
|-----------|------|------------|------------------|
| **Header** | `app/components/layout/Header.vue` | Layout: шапка (лого + навигация + поиск), NuxtPage, подвал | Все страницы |
| **Footer** | `app/components/layout/Footer.vue` | Подвал с копирайтом | Все страницы |
| **AnimeCard** | `app/components/catalog/AnimeCard.vue` | Карточка аниме (постер, название, теги, рейтинг, кнопка «В список»/«Удалить») | Каталог |
| **CatalogFilters** | `app/components/catalog/CatalogFilters.vue` | Фильтры (тип, статус, сезон, сортировка), v-model | Каталог |
| **AnimePreviewPopup** | `app/components/catalog/AnimePreviewPopup.vue` | Всплывающий попап с деталями (OverlayPanel десктоп / Dialog мобильные) | Каталог |
| **AnimeDetailHero** | `app/components/anime/AnimeDetailHero.vue` | Постер, заголовок, метаданные, жанры, описание (v-html санитизация) | Страница тайтла |
| **PlayerPlaceholder** | `app/components/anime/PlayerPlaceholder.vue` | Плеер-заглушка (иконка + «Видео временно недоступно») | Страница тайтла |
| **AnimeDetailLists** | `app/components/anime/AnimeDetailLists.vue` | Добавление в список / оценка (ClientOnly, useUserLists) | Страница тайтла |
| **ProfileCard** | `app/components/profile/ProfileCard.vue` | Аватар, имя пользователя, статистика по спискам | Профиль |
| **AnimeProfileCard** | `app/components/profile/AnimeProfileCard.vue` | Карточка аниме в списке (постер, название, статус, оценка, удаление) | Профиль |
| **ProfileTabEmpty** | `app/components/profile/ProfileTabEmpty.vue` | Пустое состояние вкладки списка | Профиль |
| **ErrorState** | `app/components/shared/ErrorState.vue` | Состояние ошибки с иконкой, сообщением и кнопкой повтора | Каталог, Страница тайтла |
| **EmptyState** | `app/components/shared/EmptyState.vue` | Пустое состояние с иконкой, сообщением и действием | Каталог |
| **SkeletonCatalogGrid** | `app/components/shared/SkeletonCatalogGrid.vue` | Скелетон-загрузчик сетки карточек (12 карточек) | Каталог |
| **SkeletonAnimeDetail** | `app/components/shared/SkeletonAnimeDetail.vue` | Скелетон-загрузчик детальной страницы (постер + информация) | Страница тайтла |

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

*Последнее обновление: 2026-05-22*

*Обновлено после рефакторинга: добавлены Header/Footer, AnimeProfileCard, ProfileTabEmpty, ErrorState, EmptyState, SkeletonCatalogGrid, SkeletonAnimeDetail; обновлены пути компонентов (feature-based папки).*
