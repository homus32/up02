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
| **TheHeader** | `app/app.vue` | Layout: шапка (лого + навигация + поиск), NuxtPage, подвал | Все страницы |
| **AnimeCard** | `app/components/AnimeCard.vue` | Карточка аниме (постер, название, теги, рейтинг, кнопка «В список»/«Удалить») | Каталог |
| **CatalogFilters** | `app/components/CatalogFilters.vue` | Фильтры (тип, статус, сезон, сортировка), v-model | Каталог |
| **AnimePreviewPopup** | `app/components/AnimePreviewPopup.vue` | Всплывающий попап с деталями (OverlayPanel десктоп / Dialog мобильные) | Каталог |
| **AnimeDetailHero** | `app/components/AnimeDetailHero.vue` | Постер, заголовок, метаданные, жанры, описание (v-html санитизация) | Страница тайтла |
| **PlayerPlaceholder** | `app/components/PlayerPlaceholder.vue` | Плеер-заглушка (иконка + «Видео временно недоступно») | Страница тайтла |
| **AnimeDetailLists** | `app/components/AnimeDetailLists.vue` | Добавление в список / оценка (ClientOnly, useUserLists) | Страница тайтла |
| **ProfileCard** | `app/components/ProfileCard.vue` | Аватар, имя пользователя, статистика по спискам | Профиль |
| **SkeletonCard** | `app/pages/index.vue` (inline) | Скелетон-загрузчик карточки | Каталог |

## Макет (Layout)

- `app/app.vue` — корневой компонент с `NuxtPage`
- Шапка: логотип "AnimeBaza", ссылки «Каталог» / «Войти» (или имя пользователя), поиск
- Подвал: копирайт «AnimeBaza — учебный проект УП.02»
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
