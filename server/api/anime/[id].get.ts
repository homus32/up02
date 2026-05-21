const SHIKIMORI_GRAPHQL = 'https://shikimori.io/api/graphql'

const ANIME_QUERY = `
query($ids: String!) {
  animes(ids: $ids, limit: 1) {
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
  const id = getRouterParam(event, 'id')

  if (!id || !/^\d+$/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid anime ID' })
  }

  try {
    const response = await $fetch<GraphQlResponse>(SHIKIMORI_GRAPHQL, {
      method: 'POST',
      body: { query: ANIME_QUERY, variables: { ids: id } },
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

    const anime = response?.data?.animes?.[0] ?? null

    if (!anime) {
      throw createError({ statusCode: 404, statusMessage: `Anime #${id} not found` })
    }

    setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
    return anime
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
      statusMessage: 'Failed to fetch anime details.',
    })
  }
})
