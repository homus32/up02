import { SEARCH_ANIMES } from '#server/graphql/queries'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { search, kind, status, season, score, order, limit, page } = query

  try {
    const client = useShikimoriClient()

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

    const data = await client.request<{ animes: unknown[] }>(SEARCH_ANIMES, variables)
    const animes = data?.animes ?? []

    setResponseHeader(event, 'Cache-Control', 'public, max-age=300')

    return {
      data: animes,
      meta: {
        total: animes.length,
        page: Number(page) || 1,
        limit: Number(limit) || 20,
      },
    }
  } catch (err) {
    handleShikimoriError(err)
  }
})
