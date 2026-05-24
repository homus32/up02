// AnimeBaza — Core data types
// Based on Shikimori GraphQL schema (trimmed to project scope)

export interface Anime {
  id: string
  name: string
  russian: string
  kind: AnimeKind
  poster: AnimePoster | null
  genres: Genre[]
  score: number
  status: AnimeStatus
  episodes: number
  episodesAired: number
  duration: number
  description: string | null
  descriptionHtml: string | null
  studios: Studio[]
  season: string | null
  airedOn: { year: number } | null
}

export interface AnimeCardData {
  id: string
  name: string
  russian: string
  kind: AnimeKind
  score: number
  episodes: number
  episodesAired: number
  status: AnimeStatus
  poster: { mainUrl: string; originalUrl: string } | null
  genres: Pick<Genre, 'id' | 'name' | 'russian'>[]
  airedOn: { year: number } | null
}

export type AnimeKind = 'tv' | 'movie' | 'ova' | 'ona' | 'special' | 'music'
export type AnimeStatus = 'anons' | 'ongoing' | 'released'

export interface AnimePoster {
  originalUrl: string
  mainUrl: string
}

export interface Genre {
  id: number
  name: string
  russian: string
}

export interface Studio {
  id: number
  name: string
}

// === User Lists (localStorage) ===

export type UserListStatus = 'planned' | 'watching' | 'completed' | 'on_hold' | 'dropped'

export const USER_LIST_STATUSES: UserListStatus[] = [
  'planned',
  'watching',
  'completed',
  'on_hold',
  'dropped',
]

export const USER_LIST_LABELS: Record<UserListStatus, string> = {
  planned: 'Запланировано',
  watching: 'Смотрю',
  completed: 'Просмотрено',
  on_hold: 'Отложено',
  dropped: 'Брошено',
}

/** Per-anime user list item storing display data + status */
export interface UserListItem {
  status: UserListStatus
  name: string
  russian: string
  posterUrl: string | null
  score: number
  addedAt: number
  kind?: AnimeKind
  animeStatus?: AnimeStatus
  episodes?: number
  airedOnYear?: number
}

/** Normalize a partial UserListItem with sensible defaults for backward compatibility */
export function normalizeItem(item: Partial<UserListItem>): UserListItem {
  return {
    status: item.status ?? 'planned',
    name: item.name ?? '',
    russian: item.russian ?? '',
    posterUrl: item.posterUrl ?? null,
    score: item.score ?? 0,
    addedAt: item.addedAt ?? Date.now(),
    kind: item.kind ?? 'tv',
    animeStatus: item.animeStatus ?? 'released',
    episodes: item.episodes ?? 0,
    airedOnYear: item.airedOnYear ?? undefined,
  }
}

/** localStorage key: anime_lists — Record<animeId, UserListItem> */
export type AnimeLists = Record<string, UserListItem>

/** Per-anime user rating (0-10, 0 = not rated) — localStorage key: anime_ratings */
export type AnimeRatings = Record<string, number>

// === Auth (localStorage, not sessionStorage — persists across tabs) ===

export interface UserProfile {
  username: string
  loggedInAt: string
}

// === API Response Wrappers ===

export interface PaginatedResult<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
  }
}

// === Search / Filter Params ===

export interface SearchParams {
  query?: string
  page?: number
  limit?: number
  kind?: AnimeKind
  status?: AnimeStatus
  season?: string
  score?: number
  order?: SearchOrder
}

export type SearchOrder = 'ranked' | 'popularity' | 'name' | 'aired_on' | 'episodes'
