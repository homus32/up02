const SHIKIMORI_GRAPHQL = 'https://shikimori.io/api/graphql'

const SEARCH_QUERY = `
query($page: PositiveInt, $limit: PositiveInt, $order: OrderEnum, $kind: AnimeKindString, $status: AnimeStatusString, $season: SeasonString, $score: Int, $search: String) {
  animes(page: $page, limit: $limit, order: $order, kind: $kind, status: $status, season: $season, score: $score, search: $search) {
    id name russian kind score status episodes episodesAired duration season description descriptionHtml
    poster { mainUrl originalUrl }
    genres { id name russian }
    studios { id name }
    airedOn { year }
  }
}
`

interface GraphQlResponse {
  data?: { animes: unknown[] }
  errors?: Array<{ message: string }>
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { search, kind, status, season, score, order, limit, page } = query

  try {
    const variables: Record<string, unknown> = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      order: order || 'ranked',
    }

    if (search) variables.search = search
    if (kind) variables.kind = kind
    if (status) variables.status = status
    if (season) variables.season = season
    if (score) variables.score = Number(score)

    const response = await $fetch<GraphQlResponse>(SHIKIMORI_GRAPHQL, {
      method: 'POST',
      body: { query: SEARCH_QUERY, variables },
      headers: {
        'User-Agent': 'AnimeBaza/1.0 (educational project)',
        'Content-Type': 'application/json',
      },
    })

    if (response.errors?.length) {
      throw createError({
        statusCode: 500,
        statusMessage: `Shikimori API error: ${response.errors[0]!.message}`,
      })
    }

    const animes = response?.data?.animes ?? []

    setResponseHeader(event, 'Cache-Control', 'public, max-age=300')

    return {
      data: animes,
      meta: {
        total: animes.length,
        page: Number(page) || 1,
        limit: Number(limit) || 20,
      },
    }
  } catch (err: any) {
    if (err?.statusCode === 429 || err?.status === 429) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Rate limited. Please try again later.',
      })
    }
    if (err?.statusCode) throw err
    throw createError({
      statusCode: 500,
      statusMessage: 'Shikimori API unavailable. Please try again.',
    })
  }
})
