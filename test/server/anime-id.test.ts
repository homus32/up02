import { describe, it, expect } from 'vitest'
import { setup, $fetch, fetch } from '@nuxt/test-utils/e2e'
import { createServer } from 'node:http'
import { type AddressInfo } from 'node:net'

const MOCK_ANIME = {
  id: '1',
  name: 'Test Anime',
  russian: 'Тестовое аниме',
  kind: 'tv',
  score: 8.5,
  status: 'released',
  episodes: 24,
  episodesAired: 24,
  description: 'A test anime description',
  season: 'summer_2024',
  poster: { mainUrl: 'https://example.com/poster.jpg', originalUrl: 'https://example.com/poster.jpg' },
  genres: [{ id: 1, name: 'Action', russian: 'Экшн' }],
  studios: [{ id: 1, name: 'Test Studio' }],
  airedOn: { year: 2024 },
}

describe('GET /api/anime/[animeId]', async () => {
  const mockServer = createServer(async (req, res) => {
    let body = ''
    for await (const chunk of req) body += chunk
    const parsed = JSON.parse(body)
    const ids = parsed?.variables?.ids

    if (ids === '1') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ data: { animes: [MOCK_ANIME] } }))
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ data: { animes: [] } }))
    }
  })

  await new Promise<void>((resolve) => mockServer.listen(0, resolve))
  const port = (mockServer.address() as AddressInfo).port

  await setup({
    server: true,
    env: {
      NUXT_SHIKIMORI_API_URL: `http://localhost:${port}/graphql`,
    },
  })

  it('returns anime by valid numeric ID', async () => {
    const anime = await $fetch('/api/anime/1')

    expect(anime).toMatchObject({
      id: '1',
      name: 'Test Anime',
      kind: 'tv',
      score: 8.5,
      status: 'released',
    })
  })

  it('returns 400 for non-numeric ID', async () => {
    const res = await fetch('/api/anime/abc')

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.statusMessage).toMatch(/invalid/i)
    expect(body.statusCode).toBe(400)
  })

  it('returns 404 when anime not found', async () => {
    const res = await fetch('/api/anime/999')

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.statusMessage).toMatch(/not found/i)
  })

  it('returns 200 with Cache-Control header', async () => {
    const res = await fetch('/api/anime/1')

    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toMatch(/max-age=300/)
  })
})
