import type { Anime } from '~/types/anime'

/**
 * useAnimeDetailCache — in-memory cache for anime detail API calls.
 *
 * Use: profile page popup fetches anime details via `/api/anime/:id`.
 * This composable caches results in a Map to avoid re-fetching,
 * and deduplicates in-flight requests so the same ID is only fetched once.
 *
 * Profile page has `ssr: false`, so the Map lives as long as the page is mounted.
 */
export function useAnimeDetailCache() {
  /** Resolved cache entries */
  const cache = new Map<string, Anime>()

  /** Deduplication map for in-flight requests */
  const pending = new Map<string, Promise<Anime>>()

  /**
   * Fetch anime detail by ID, caching the result.
   * Deduplicates in-flight requests: concurrent calls with the same ID
   * share a single fetch promise.
   */
  function get(animeId: string): Promise<Anime> {
    // Return cached result immediately
    const cached = cache.get(animeId)
    if (cached) return Promise.resolve(cached)

    // Reuse in-flight request if one exists
    const inFlight = pending.get(animeId)
    if (inFlight) return inFlight

    // Start a new fetch
    const promise = $fetch<Anime>(`/api/anime/${animeId}`)
      .then((anime) => {
        pending.delete(animeId)
        cache.set(animeId, anime)
        return anime
      })
      .catch((error) => {
        pending.delete(animeId)
        throw error
      })

    pending.set(animeId, promise)
    return promise
  }

  /**
   * Synchronously check if an anime is already cached.
   * Returns the cached Anime or null.
   */
  function getCached(animeId: string): Anime | null {
    return cache.get(animeId) ?? null
  }

  /** Clear the entire cache (both resolved and pending). */
  function clear() {
    cache.clear()
    pending.clear()
  }

  return {
    get,
    getCached,
    clear,
  }
}
