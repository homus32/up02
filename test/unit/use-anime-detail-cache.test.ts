import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock global $fetch (Nuxt auto-import) so useAnimeDetailCache can call it
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

describe('useAnimeDetailCache', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('returns cached value on second call', async () => {
    const { useAnimeDetailCache } = await import(
      '../../app/composables/useAnimeDetailCache'
    )
    const cache = useAnimeDetailCache()
    const anime = { id: '1', name: 'Naruto', score: 8 }

    mockFetch.mockResolvedValue(anime)

    const result1 = await cache.get('1')
    expect(result1).toEqual(anime)
    expect(mockFetch).toHaveBeenCalledTimes(1)

    mockFetch.mockReset()
    const result2 = await cache.get('1')
    expect(result2).toEqual(anime)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('deduplicates in-flight requests', async () => {
    const { useAnimeDetailCache } = await import(
      '../../app/composables/useAnimeDetailCache'
    )
    const cache = useAnimeDetailCache()
    const anime = { id: '1', name: 'Naruto' }

    // Arrange — return a deferred promise so we control timing
    let resolveFetch!: (value: unknown) => void
    let fetchCount = 0
    mockFetch.mockImplementation(() => {
      fetchCount++
      return new Promise((resolve) => {
        resolveFetch = resolve
      })
    })

    // Act — two parallel calls for the same ID
    const promise1 = cache.get('1')
    const promise2 = cache.get('1')

    resolveFetch(anime)

    await expect(promise1).resolves.toEqual(anime)
    await expect(promise2).resolves.toEqual(anime)

    expect(fetchCount).toBe(1)
  })

  it('does not poison cache on fetch error', async () => {
    const { useAnimeDetailCache } = await import(
      '../../app/composables/useAnimeDetailCache'
    )
    const cache = useAnimeDetailCache()

    // Arrange — first call fails
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    await expect(cache.get('1')).rejects.toThrow('Network error')

    // Cache should not contain the failed entry
    expect(cache.getCached('1')).toBeNull()

    const anime = { id: '1', name: 'Naruto' }
    mockFetch.mockResolvedValueOnce(anime)

    const result = await cache.get('1')

    expect(result).toEqual(anime)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('getCached returns null for uncached entries', async () => {
    const { useAnimeDetailCache } = await import(
      '../../app/composables/useAnimeDetailCache'
    )
    const cache = useAnimeDetailCache()

    expect(cache.getCached('unknown-id')).toBeNull()
  })

  it('clear removes all cached entries', async () => {
    const { useAnimeDetailCache } = await import(
      '../../app/composables/useAnimeDetailCache'
    )
    const cache = useAnimeDetailCache()
    const anime = { id: '1', name: 'Naruto' }

    // Arrange — cache a value
    mockFetch.mockResolvedValue(anime)
    await cache.get('1')
    expect(cache.getCached('1')).not.toBeNull()

    // Act
    cache.clear()

    // Assert
    expect(cache.getCached('1')).toBeNull()
  })
})
