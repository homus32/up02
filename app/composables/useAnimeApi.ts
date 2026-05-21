import type { Anime, SearchParams } from '~/types/anime'

interface PaginatedResponse {
  data: Anime[]
  meta: {
    total: number
    page: number
    limit: number
  }
}

export function useAnimeApi() {
  async function search(params: SearchParams = {}): Promise<PaginatedResponse> {
    const query: Record<string, string> = {}

    if (params.query) query.search = params.query
    if (params.kind) query.kind = params.kind
    if (params.status) query.status = params.status
    if (params.season) query.season = params.season
    if (params.score) query.score = String(params.score)
    if (params.order) query.order = params.order
    if (params.page) query.page = String(params.page)
    if (params.limit) query.limit = String(params.limit)

    const qs = new URLSearchParams(query).toString()
    return $fetch<PaginatedResponse>(`/api/anime/search?${qs}`)
  }

  async function getById(id: string): Promise<Anime> {
    return $fetch<Anime>(`/api/anime/${id}`)
  }

  return { search, getById }
}
