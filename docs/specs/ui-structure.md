# UI Structure

## Страницы

| # | Страница | Маршрут | Назначение | Ключевые PrimeVue-компоненты |
|---|----------|---------|------------|------------------------------|
| 1 | **Каталог** | `/` | Сетка карточек аниме, поиск, фильтры (тип/статус/сезон/сорт.), пагинация | DataView, SelectButton, Select, Paginator, OverlayPanel, Dialog, Tag, Chip, Skeleton |
| 2 | **Страница тайтла** | `/anime/[id]` | Постер, информация, плеер-заглушка, добавление в список, оценка | Image, Tag, Rating, Chip, Button, SelectButton |
| 3 | **Вход** | `/login` | Псевдо-форма логина (любое имя → профиль) | InputText, Button |
| 4 | **Профиль** | `/profile` | Имя пользователя, 5 списков (planned/watching/completed/on_hold/dropped) с карточками, удаление | TabView, TabPanel, Button, Tag |

## Компоненты

| Компонент | Назначение | В каких страницах |
|-----------|------------|-------------------|
| `app/app.vue` | Layout: шапка (лого + навигация + поиск), NuxtPage, подвал | Все |
| `.skeleton-card` | Скелетон-загрузчик (poster + title + subtitle) | Каталог |
| `.popup` | Всплывающий попап с деталями аниме (OverlayPanel десктоп / Dialog мобильные) | Каталог |

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
- **Поиск** (в шапке) — динамический debounced поиск, обновляет URL-параметр `?search=`

## Адаптивность

- CSS Grid с `auto-fill`/`minmax(180px, 1fr)` для сетки карточек
- На мобильных (<768px): grid → `minmax(140px, 1fr)`
- OverlayPanel → Dialog `position="bottom"` на мобильных
- Фильтры в столбик на мобильных

## SSR-стратегия

| Страница | SSR | Причина |
|----------|-----|---------|
| Каталог `/` | ✅ SSR | Данные из Shikimori через Nitro proxy |
| Тайтл `/anime/[id]` | ✅ SSR | Данные через Nitro proxy |
| Вход `/login` | ✅ SSR | Статичная форма |
| Профиль `/profile` | ❌ ssr: false | localStorage + ClientOnly |

---

*Последнее обновление: 2026-05-21*
