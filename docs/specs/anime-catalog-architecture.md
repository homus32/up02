# AnimeBaza — Architecture Design

> **Утверждено Oracle-ревью (2026-05-21).** Ниже — итоговые решения после кросс-проверки архитектуры.

**Стек:** Nuxt 4 + Vue 3 + TypeScript + PrimeVue 4 (Aura theme) + Shikimori REST API
**Стили:** Vanilla CSS (БЭМ), CSS custom properties, PrimeVue Aura tokens

## Архитектурные решения (ADR)

| Решение | Выбор | Обоснование |
|---------|-------|-------------|
| API Shikimori | **GraphQL** | GraphQL endpoint https://shikimori.io/api/graphql доступен без OAuth для чтения публичных данных; REST для fallback |
| Прокси | Nitro `server/api/anime/search.get.ts` + `[id].get.ts` | GraphQL POST к `shikimori.io/api/graphql`, кеширование (5min/1h), обработка 429, User-Agent |
| Пагинация | **Paginator** (PrimeVue), не infinite scroll | DataView + Paginator работают из коробки; infinite scroll требует ручного IntersectionObserver |
| localStorage | **VueUse `useStorage`** | SSR-safe, реактивная синхронизация, JSON-сериализация, межвкладочная |
| Аутентификация | **localStorage** (не sessionStorage) | sessionStorage теряется при открытии новой вкладки |
| Структура списков | `UserListItem` с name/posterUrl/status | Избавляет от N+1 запросов при отображении профиля |
| Защита `/profile` | **Page-level middleware** (inline) | Только один защищённый роут — глобальный middleware избыточен |
| SSR | `/profile` → `ssr: false`. Hover popup → `<ClientOnly>` | localStorage и OverlayPanel не SSR-safe |
| Поиск | **URL params** (`?search=...`) | SSR-friendly, шаринг ссылок, навигация назад |
| OverlayPanel | `<ClientOnly>` на десктопе, `<Dialog position="bottom">` на мобилках | Teleport + DOM манипуляции не работают на сервере |
| PrimeVue кастомизация | **CSS custom properties** `--p-*` | Меньше кода, чем Pass Through; хватает для тёмной темы |

---

## 1. Component Tree (full hierarchy with props/emits)

```
app.vue (NuxtLayout)
│   <NuxtPage />
│
├── pages/index.vue (HomePage)
│   ├── TheHeader
│   │   props: none
│   │   emits: search(query: string)
│   │
│   ├── HeroSection
│   │   ├── SearchBar
│   │   │   props: modelValue (string), loading (boolean)
│   │   │   emits: update:modelValue, submit
│   │   │   uses: InputText + Button (icon-only)
│   │   │
│   ├── AnimeSlider (top-rated / seasonal)
│   │   │   props: animes (AnimeCardData[]), title (string)
│   │   │   uses: Carousel
│   │   │   children: AnimeCard
│   │   │
│   ├── AnimeGrid (latest releases)
│   │   │   props: animes (AnimeCardData[]), title (string)
│   │   │   uses: DataView (grid layout)
│   │   │   children: AnimeCard[]
│   │   │
│   └── TheFooter
│       props: none
│
├── pages/catalog/index.vue (CatalogPage)
│   ├── TheHeader
│   ├── CatalogLayout
│   │   ├── CatalogSidebar
│   │   │   props: filters (CatalogFilters), v-model
│   │   │   emits: update:filters
│   │   │   │
│   │   │   ├── FilterSection (reusable wrapper)
│   │   │   │   props: title (string), collapsible (boolean)
│   │   │   │   slot: default
│   │   │   │
│   │   │   ├── KindFilter
│   │   │   │   props: modelValue (string[]), options (SelectItem[])
│   │   │   │   emits: update:modelValue
│   │   │   │   uses: SelectButton (multiple)
│   │   │   │
│   │   │   ├── GenreFilter
│   │   │   │   props: modelValue (string[]), genres (Genre[])
│   │   │   │   emits: update:modelValue
│   │   │   │   uses: Checkbox[] or Chips
│   │   │   │
│   │   │   ├── StatusFilter
│   │   │   │   props: modelValue (string)
│   │   │   │   emits: update:modelValue
│   │   │   │   uses: SelectButton
│   │   │   │
│   │   │   ├── RatingFilter
│   │   │   │   props: modelValue ({ min: number, max: number })
│   │   │   │   emits: update:modelValue
│   │   │   │   uses: InputNumber (min) + InputNumber (max)
│   │   │   │
│   │   │   └── SeasonFilter
│   │   │       props: modelValue (string)
│   │   │       emits: update:modelValue
│   │   │       uses: Select (year + season dropdowns)
│   │   │
│   │   └── CatalogContent
│   │       ├── CatalogToolbar
│   │       │   props: totalCount (number), viewMode (string), sortBy (string)
│   │       │   emits: update:viewMode, update:sortBy
│   │       │   uses: SelectButton (view toggle) + Select (sort) + Badge (count)
│   │       │
│   │       ├── AnimeGrid / AnimeList (switched by viewMode)
│   │       │   props: animes (AnimeCardData[]), loading (boolean), layout ('grid' | 'list')
│   │       │   uses: DataView
│   │       │   children: AnimeCard[]
│   │       │
│   │       └── Paginator
│   │           props: page (number), totalItems (number), rows (number)
│   │           emits: page-change
│   │
│   └── AnimeDrawer (quick preview on card click)
│       props: animeId (string | null), visible (boolean)
│       emits: update:visible, close
│       uses: Drawer + Skeleton (while loading)
│       │
│       ├── AnimePreview
│       │   props: anime (AnimeDetail)
│       │   ├── AnimeCover — uses: Image (preview=true)
│       │   ├── AnimeScore — uses: Rating (readonly)
│       │   ├── AnimeGenres — uses: Chip[] (severity-colored)
│       │   ├── AnimeSynopsis — uses: Accordion
│       │   └── FavoriteButton
│       │       props: animeId (string), isFavorite (boolean)
│       │       emits: toggle
│
├── pages/anime/[id].vue (AnimeDetailPage)
│   ├── TheHeader
│   ├── AnimeHero
│   │   props: anime (AnimeDetail)
│   │   ├── Poster — uses: Image
│   │   ├── TitleBlock (title, altTitle, kind, year)
│   │   ├── MetadataBar (score/Status/Episodes)
│   │   │   uses: Tag (status severity) + Rating (readonly) + Badge (episodes)
│   │   ├── GenreChips — uses: Chip[] (colored by kind)
│   │   └── FavoriteButton
│   │
│   ├── AnimeTabs
│   │   props: tabs (TabItem[]), activeTab (string)
│   │   emits: update:activeTab
│   │   uses: Tabs
│   │   │
│   │   ├── TabPanel "Synopsis"
│   │   │   props: description (string), descriptionHtml (string)
│   │   │   uses: v-html (sanitized) or markdown render
│   │   │
│   │   ├── TabPanel "Characters"
│   │   │   children: CharacterList
│   │   │   │   props: characters (Character[])
│   │   │   │   children: CharacterCard[]
│   │   │   │       props: character (Character)
│   │   │   │       uses: Avatar + text (role badge)
│   │   │
│   │   ├── TabPanel "Related"
│   │   │   children: RelatedAnime
│   │   │   │   props: related (RelatedAnime[])
│   │   │   │   children: AnimeCard[] (compact variant)
│   │   │
│   │   └── TabPanel "Screenshots"
│   │       children: ScreenshotGalleria
│   │           props: screenshots (Screenshot[])
│   │           uses: Galleria
│   │
│   └── TheFooter
│
├── pages/favorites/index.vue (FavoritesPage)
│   ├── TheHeader
│   ├── FavoritesEmpty (shown when no favorites)
│   │   props: none
│   ├── FavoritesList
│   │   props: animes (AnimeCardData[])
│   │   children: AnimeCard[] (with remove button)
│   │   uses: DataView
│   └── TheFooter
│
├── components/ (shared/reusable)
│   ├── TheHeader.vue
│   │   nav links: Home, Catalog, Favorites (Badge count)
│   │   search input → emits search → navigates to /catalog?q=...
│   │   uses: Menubar or custom nav
│   │
│   ├── TheFooter.vue
│   │
│   ├── AnimeCard.vue
│   │   props: anime (AnimeCardData), layout ('grid' | 'list')
│   │   emits: click(animeId), preview(animeId)
│   │   uses: Card (or custom div), Image, Badge (kind), Tag (status)
│   │   variant: poster-mode / list-mode
│   │
│   ├── FilterSection.vue
│   │   props: title (string), collapsed (boolean)
│   │   slot: default
│   │
│   ├── FavoriteButton.vue
│   │   props: animeId (string), isFavorite (boolean)
│   │   emits: toggle(animeId)
│   │   icon: heart (filled/outline)
│   │
│   └── SearchBar.vue
│       props: modelValue (string), placeholder (string), loading (boolean)
│       emits: update:modelValue, submit
│       uses: InputGroup > InputText + Button(icon="search")
```

---

## 2. Server Routes (Nitro proxy to Shikimori)

```
server/
  api/
    graphql/
      get.ts       # GET  /api/graphql?query=...&variables=...
      post.ts      # POST /api/graphql  { query, variables }
    animes/
      [id].get.ts   # GET /api/animes/:id
      search.get.ts # GET /api/animes/search?q=&kind=&genre=&status=&minScore=&maxScore=&season=&page=&limit=&order=
    genres.get.ts   # GET /api/genres        — static genre list
    seasons.get.ts  # GET /api/seasons       — available seasons
```

### Proxy rationale
- Hides Shikimori API key from client
- Allows caching headers (Cache-Control)
- Allows response trimming (remove unused fields)
- Allows rate-limit handling (429 retry logic)

### Route implementation outline

```
server/api/graphql.get.ts:
  1. Accept ?query, ?variables as query params
  2. POST to https://shikimori.one/api/graphql
  3. Forward with Authorization header from .env
  4. Return { data, errors } → trim data
  5. Set Cache-Control: public, max-age=300

server/api/animes/[id].get.ts:
  1. GET https://shikimori.one/api/animes/:id
  2. Return trimmed anime detail with characters, related, screenshots

server/api/animes/search.get.ts:
  1. GET https://shikimori.one/api/animes?...
  2. Map query params → api params
  3. Return { data: Anime[], meta: { total, page, limit } }

server/api/genres.get.ts:
  1. Return hardcoded genre list (shikimori genres are stable)
  2. Cache: very long (1 week)
```

---

## 3. Composables

```
composables/
  useAnimeApi.ts
    → wraps $fetch to server proxy routes
    → functions:
        fetchAnimeList(params: SearchParams): Promise<PaginatedResult<Anime>>
        fetchAnimeById(id: string): Promise<AnimeDetail>
        fetchAnimeCharacters(id: string): Promise<Character[]>
        fetchAnimeRelated(id: string): Promise<RelatedAnime[]>
        fetchAnimeScreenshots(id: string): Promise<Screenshot[]>
        searchAnime(query: string, page: number): Promise<PaginatedResult<Anime>>

  useAnimeSearch.ts
    → reactive search state (URL-driven via useRoute/useRouter)
    → reactive: query, page, filters (kind, genre[], status, minScore, maxScore, season, sortBy)
    → derived: apiParams ← computed from filters
    → data: useAsyncData for SSR-friendly fetching
    → debounceSearch: debounced query → URL push

  useFavorites.ts
    → reactive: favoriteIds (Ref<Set<string>>)
    → read from localStorage on client mount
    → toggle(id: string): add/remove
    → isFavorite(id: string): computed boolean
    → clearAll()
    → sync with localStorage via watch
    → key: 'anime-catalog:favorites'

  useAnimeDetail.ts
    → param: animeId (from route)
    → data: useAsyncData + fetchAnimeById
    → characters, related, screenshots: lazy-loaded via tabs
    → loading states per section

  useDebounce.ts
    → generic debounce composable (fn, delay)
    → exports: debouncedFn, cancel

  useGenres.ts
    → fetch genre list once, cache in memory
    → genreById map for lookups
```

---

## 4. Data Structures — TypeScript Interfaces

```typescript
// === API Response Wrappers ===
interface PaginatedResult<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
  }
}

// === Core Entities ===
interface Anime {
  id: string
  malId: number | null
  name: string
  russian: string
  licenseNameRu: string | null
  english: string | null
  japanese: string | null
  synonyms: string[]
  kind: AnimeKind
  rating: AnimeRating
  score: number
  status: AnimeStatus
  episodes: number
  episodesAired: number
  duration: number
  airedOn: { year: number; month: number; day: number; date: string }
  releasedOn: { year: number; month: number; day: number; date: string } | null
  url: string
  season: string | null

  poster: {
    id: string
    originalUrl: string
    mainUrl: string
  } | null

  genres: Genre[]
  studios: Studio[]
}

// === Anime Detail (extended) ===
interface AnimeDetail extends Anime {
  description: string | null
  descriptionHtml: string | null
  descriptionSource: string | null
  franchise: string | null
  favoured: boolean
  anons: boolean
  ongoing: boolean
  threadId: number | null
  topicId: number | null
  myanimelistId: number | null
  ratesScoresStats: ScoreStat[]
  ratesStatusesStats: StatusStat[]

  videos: Video[]
  screenshots: Screenshot[]
  userRate: UserRate | null
}

// === Supplementary Types ===
type AnimeKind = 'tv' | 'movie' | 'ova' | 'ona' | 'special' | 'music' | 'tv_13' | 'tv_24' | 'tv_48'
type AnimeRating = 'none' | 'g' | 'pg' | 'pg_13' | 'r' | 'r_plus' | 'rx'
type AnimeStatus = 'anons' | 'ongoing' | 'released'

interface Genre {
  id: number
  name: string
  russian: string
  kind: 'genre' | 'demographic' | 'theme'
}

interface Studio {
  id: number
  name: string
  imageUrl: string | null
}

interface Character {
  id: number
  name: string
  russian: string
  image: { original: string; preview: string }
  url: string
  roles: CharacterRole[]
  rolesRussian: string[]
}

interface CharacterRole {
  id: number
  roles: string[]
  rolesRussian: string[]
  character: CharacterRoleNested
  person: Person | null
}

interface Person {
  id: number
  name: string
  russian: string
  image: { original: string; preview: string }
  url: string
}

interface RelatedAnime {
  relation: string           // 'adaptation' | 'sequel' | 'prequel' | ...
  relationRussian: string
  anime: Anime
  manga: unknown | null
}

interface Screenshot {
  id: number
  originalUrl: string
  x166Url: string
  x332Url: string
}

interface Video {
  id: number
  url: string
  imageUrl: string
  playerUrl: string
  name: string | null
  kind: string
  hosting: string
}

interface ScoreStat {
  name: number
  value: number
}

interface StatusStat {
  name: string
  value: number
}

interface UserRate {
  id: number
  score: number
  status: string
  episodes: number
  rewatches: number
  text: string | null
  textHtml: string | null
  createdAt: string
  updatedAt: string
}

// === Card-slim variant for lists ===
interface AnimeCardData {
  id: string
  name: string
  russian: string
  kind: AnimeKind
  score: number
  episodes: number
  episodesAired: number
  status: AnimeStatus
  airedOn: { year: number } | null
  poster: { mainUrl: string; originalUrl: string } | null
  genres: { id: number; name: string; russian: string }[]
}

// === Search / Filter params ===
interface SearchParams {
  query?: string
  page?: number
  limit?: number
  kind?: AnimeKind
  status?: AnimeStatus
  season?: string           // '2024' or 'winter_2024'
  score?: number            // min score
  genre?: number            // single genre id
  genre_v2?: number[]       // multiple genres
  order?: SearchOrder
}

type SearchOrder =
  | 'ranked'
  | 'popularity'
  | 'name'
  | 'aired_on'
  | 'episodes'
  | 'status'
  | 'random'
  | 'id_desc'
  | 'ranked_random'
  | 'ranked_shiki'

// === Catalog View State ===
interface CatalogFilters {
  kind: AnimeKind[]
  genres: number[]
  status: AnimeStatus | null
  scoreMin: number
  scoreMax: number
  season: string | null
  sortBy: SearchOrder
  viewMode: 'grid' | 'list'
}

// === Tab definition ===
interface TabItem {
  id: string
  label: string
  icon?: string
}
```

---

## 5. localStorage Schema

```
Keys and formats:

anime-catalog:favorites
  type: string[] (anime IDs)
  example: ["123", "456", "789"]

anime-catalog:view-mode
  type: 'grid' | 'list'
  default: 'grid'

anime-catalog:recent-viewed
  type: Array<{ id: string; name: string; timestamp: number }>
  max: 20 items

anime-catalog:theme (future)
  type: 'light' | 'dark'
  default: system preference

anime-catalog:filters-last  (optional — restore last filter state)
  type: CatalogFilters (partial, excluding paging)
```

### Favorites sync strategy
1. On mount (client only): `JSON.parse(localStorage.getItem('anime-catalog:favorites')) ?? []`
2. `useFavorites` exposes reactive `Set<string>`
3. `watch` on the Set → writes back to localStorage
4. No server sync needed (pure client feature)

---

## 6. PrimeVue Component Mapping

| UI Element | PrimeVue Component | Why |
|---|---|---|
| Anime card grid | DataView (layout=grid) | Virtual scroll option for large datasets |
| Anime card list | DataView (layout=list) | Same component, different layout slot |
| Anime carousel/slider | Carousel | Circular mode, responsive options |
| Image posters | Image (preview) | Lazy load + lightbox preview |
| Quick preview drawer | Drawer | Side panel with backdrop, position=right |
| Detail page tabs | Tabs (lazy) | Lazy rendering for characters/screenshots |
| Synopsis accordion | Accordion | Collapsible long text |
| Filters: kind/status | SelectButton (multiple) | Chip-like toggle group, fluent |
| Filters: genres | Checkbox list or Chips | Multi-select with labels |
| Filters: score range | InputNumber (2x) | Min/max inputs |
| Filters: season | Select (dropdown) | Single-select with grouped options |
| Filters: sort by | Select (dropdown) | Single-select |
| View mode toggle | SelectButton (single) | Grid/List icon toggle |
| Score display | Rating (readonly, stars) | Visual score 0-10 → 0-5 stars |
| Status badge | Tag (severity) | Color-coded: ongoing=warn, released=success, anons=info |
| Kind badge | Badge | Compact label: TV, Movie, OVA, etc. |
| Genre chips | Chip | Removable chips in compact layout |
| Pagination | Paginator | Full pagination, RowsPerPageDropdown |
| Favorites heart | Button (icon, severity=danger), outlined/plain toggle | Heart icon with fill state |
| Loading states | Skeleton | Card-shaped skeletons while loading |
| Empty state | Inline message | "No results found" |
| Search input | InputGroup > InputText + Button | Grouped search bar, optional dropdown |
| Header nav | Menubar (or custom) | Horizontal nav with router links |
| Character images | Avatar (image) | Circular with fallback initials |
| Screenshot gallery | Galleria | Fullscreen preview, thumbnail nav |
| Dialog confirm | ConfirmDialog | Favorite removal confirmation |
| Hero section image | Image (no preview) | Full-width poster with overlay |

### PrimeVue Theme
- Use **Aura** theme (default in v4)
- Customize via CSS variables:
  - `--p-primary-color`: brand accent (e.g., oklch-based)
  - `--p-border-radius`: sharper corners for anime aesthetic
  - `--p-card-shadow`: subtle depth
- No Tailwind — all styling via PrimeVue Pass-Through (PT) + BEM classes where PT is insufficient

---

## 7. Route Middleware & Navigation Guards

### Route structure

```
/                  → pages/index.vue        (HomePage)
/catalog           → pages/catalog/index.vue (CatalogPage)
/anime/[id]         → pages/anime/[id].vue    (AnimeDetailPage)
/favorites          → pages/favorites/index.vue (FavoritesPage)
```

### Middleware files

```
middleware/
  catalog-redirect.global.ts    # catch /catalog without params → redirect to /catalog?page=1
  favorites-empty.ts            # redirect /favorites → / if empty (optional)
```

### Route guards — none needed
- All pages are public (no auth)
- Catalog state managed via URL query params (SSR-friendly)
- Favorites: client-only, no redirect needed (show empty state)

### URL-Driven Catalog State

```
/catalog?page=1&kind=tv,movie&genres=1,4&status=ongoing&sort=ranked&view=grid
```

- `page`: number (default 1)
- `kind`: comma-separated AnimeKind values
- `genres`: comma-separated genre IDs
- `status`: single AnimeStatus
- `scoreMin`, `scoreMax`: numbers
- `season`: string (e.g. `winter_2024`)
- `sort`: SearchOrder
- `view`: 'grid' | 'list' (default: from localStorage or 'grid')

On mount: `useAnimeSearch` reads from route query → fills reactive state → triggers fetch.

---

## 8. Module Dependencies (npm packages)

```json
{
  "dependencies": {
    "nuxt": "^4.4.6",
    "vue": "latest",
    "vue-router": "latest",

    "primevue": "^4.x",
    "@primevue/themes": "^4.x",
    "@primevue/nuxt-module": "^4.x",

    "graphql": "^16.x",
    "graphql-request": "^7.x",

    "@nuxtjs/html-validator": "^1.x"
  },
  "devDependencies": {
    "@nuxt/eslint": "^1.x",
    "typescript": "^5.x",
    "sass": "^1.x",
    "vitest": "^3.x",
    "@vue/test-utils": "^2.x",
    "playwright": "^1.x"
  }
}
```

### Package Justifications

| Package | Purpose |
|---|---|
| `primevue` + `@primevue/nuxt-module` | UI component library, auto-import in Nuxt |
| `@primevue/themes` | Aura theme tokens, override via CSS vars |
| `graphql-request` | Minimal GraphQL client for Shikimori proxy (server-side) |
| `sass` | SCSS for BEM component styles (vanilla CSS + SCSS nesting) |
| `@nuxtjs/html-validator` | Validate rendered HTML for accessibility |
| `@nuxt/eslint` | Linting — Nuxt-aware config |
| `vitest` + `@vue/test-utils` | Unit tests (composables, utilities) |
| `playwright` | E2E tests (critical flows: search, filter, favorites) |

### Not Included (avoid bloat)
- **@nuxt/image** — Shikimori images are already optimized CDN URLs; adds complexity
- **pinia** — Not needed yet; composables + localStorage sufficient for favorites
- **tailwindcss** — Explicitly excluded per project rules (vanilla CSS + BEM)
- **@shikimori/client** — No official SDK; direct fetch via Nitro proxy

---

## Architecture Notes

### Data Flow
```
Client Component
  → composable (useAnimeApi)
    → $fetch('/api/animes/search?...')
      → Nitro server route (server/api/animes/search.get.ts)
        → $fetch('https://shikimori.one/api/animes?...')
          ← Shikimori REST/GraphQL API
      ← trimmed + cached response
    ← PaginatedResult<Anime>
  → reactive state → template
```

### SSR Strategy
- **Home page**: SSR — top anime + seasonal carousel (static-ish data)
- **Catalog page**: SSR with `useAsyncData` — initial page SSR, subsequent via client
- **Detail page**: SSR (`useAsyncData` for anime data), tabs lazy-load on client
- **Favorites page**: Client-only (localStorage not available on server)

### Caching
- Static data (genres): `Cache-Control: max-age=604800` (1 week)
- Anime list: `Cache-Control: public, max-age=300` (5 min)
- Anime detail: `Cache-Control: public, max-age=3600` (1 hour)
- Swarm cache via Nitro storage (optional)

### Error Handling
- 404 on missing anime → `showError({ statusCode: 404 })`
- API errors → graceful fallback with `useAsyncData` error state
- Network errors → retry button in UI
- Empty states → meaningful messages ("No results for...")

### Accessibility
- All images have `alt` text (anime name)
- Color not sole indicator (badges have text)
- Tab panels: proper ARIA attributes (PrimeVue Tabs)
- Keyboard navigation: focusable elements, skip links
- Semantic HTML: `<nav>`, `<main>`, `<section>`, `<article>`, `<header>`, `<footer>`
- `prefers-reduced-motion` respected for Carousel

---

*Generated by architect-brain. This document serves as the reference architecture for implementation.*
