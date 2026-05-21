import { describe, it, expect } from 'vitest'
import { setup, $fetch, fetch } from '@nuxt/test-utils/e2e'
import { createServer } from 'node:http'
import { type AddressInfo } from 'node:net'

interface SearchResponse {
  data: Record<string, unknown>[]
  meta: {
    total: number
    page: number
    limit: number
  }
}

const MOCK_25_ANIMES = Array.from({ length: 25 }, (_, i) => ({
  id: String(i + 1),
  name: `Anime ${i + 1}`,
  russian: `Аниме ${i + 1}`,
  kind: 'tv' as const,
  score: 7.0 + (i % 3) * 0.5,
  status: 'released' as const,
  episodes: 12,
  episodesAired: 12,
  poster: { mainUrl: `https://example.com/poster${i + 1}.jpg`, originalUrl: `https://example.com/poster${i + 1}.jpg` },
  genres: [{ id: 1, name: 'Action', russian: 'Экшн' }],
  studios: [{ id: 1, name: 'Test Studio' }],
  airedOn: { year: 2024 },
}))

let capturedVariables: Record<string, unknown> | null = null

describe('GET /api/anime/search', async () => {
  const mockServer = createServer(async (req, res) => {
    let body = ''
    for await (const chunk of req) body += chunk
    const parsed = JSON.parse(body)
    capturedVariables = parsed?.variables || null

    const page = Number(parsed?.variables?.page) || 1
    const limit = Number(parsed?.variables?.limit) || 20
    const start = (page - 1) * limit
    const items = MOCK_25_ANIMES.slice(start, start + limit)

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ data: { animes: items } }))
  })

  await new Promise<void>((resolve) => mockServer.listen(0, resolve))
  const port = (mockServer.address() as AddressInfo).port

  await setup({
    server: true,
    env: {
      NUXT_SHIKIMORI_API_URL: `http://localhost:${port}/graphql`,
    },
  })

  it('returns paginated anime list with default params', async () => {
    const result = await $fetch<SearchResponse>('/api/anime/search', {
      query: { page: 1, limit: 10, order: 'ranked' },
    })

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('meta')
    expect(result.data).toHaveLength(10)
    expect(result.data[0]).toMatchObject({ id: '1', name: 'Anime 1' })
    expect(result.meta).toEqual({ total: 10, page: 1, limit: 10 })
  })

  it('respects page and limit params', async () => {
    const result = await $fetch<SearchResponse>('/api/anime/search', {
      query: { page: 2, limit: 5 },
    })

    expect(result.data).toHaveLength(5)
    expect(result.data[0].id).toBe('6')
    expect(result.meta).toEqual({ total: 5, page: 2, limit: 5 })
  })

  it('handles empty results on page beyond data', async () => {
    const result = await $fetch<SearchResponse>('/api/anime/search', {
      query: { page: 100, limit: 20 },
    })

    expect(result.data).toEqual([])
    expect(result.meta.total).toBe(0)
  })

  it('returns 200 with Cache-Control header', async () => {
    const response = await fetch('/api/anime/search?page=1&limit=10&order=ranked')

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toMatch(/max-age=300/)
  })

  it('passes kind/status/season/score params to GraphQL variables', async () => {
    capturedVariables = null

    await $fetch('/api/anime/search', {
      query: {
        kind: 'tv',
        status: 'released',
        season: 'summer_2024',
        score: '8',
      },
    })

    expect(capturedVariables).toMatchObject({
      kind: 'tv',
      status: 'released',
      season: 'summer_2024',
      score: 8,
    })
  })
})
