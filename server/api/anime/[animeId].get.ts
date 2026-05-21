import { GET_ANIME_BY_ID } from '#server/graphql/queries'

export default defineEventHandler(async (event) => {
  const animeId = getRouterParam(event, 'animeId')

  if (!animeId || !/^\d+$/.test(animeId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid anime ID' })
  }

  try {
    const client = useShikimoriClient()
    const data = await client.request(GET_ANIME_BY_ID, { ids: animeId })

    const anime = data?.animes?.[0] ?? null

    if (!anime) {
      throw createError({ statusCode: 404, statusMessage: `Anime #${animeId} not found` })
    }

    setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
    return anime
  } catch (err) {
    handleShikimoriError(err)
  }
})
