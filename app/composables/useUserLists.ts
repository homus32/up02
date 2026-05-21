import { readonly } from 'vue'
import { useStorage } from '@vueuse/core'
import type { UserListStatus, UserListItem, AnimeLists, AnimeRatings } from '~/types/anime'
import { USER_LIST_STATUSES } from '~/types/anime'

const LISTS_KEY = 'anime_lists'
const RATINGS_KEY = 'anime_ratings'

export function useUserLists() {
  const lists = useStorage<AnimeLists>(LISTS_KEY, {})
  const ratings = useStorage<AnimeRatings>(RATINGS_KEY, {})

  function addToList(animeId: string, item: UserListItem) {
    lists.value = { ...lists.value, [animeId]: item }
  }

  function removeFromList(animeId: string) {
    const { [animeId]: _, ...rest } = lists.value
    lists.value = rest
  }

  function updateStatus(animeId: string, status: UserListStatus) {
    const existing = lists.value[animeId]
    if (existing) {
      lists.value = {
        ...lists.value,
        [animeId]: { ...existing, status },
      }
    }
  }

  function getStatus(animeId: string): UserListStatus | null {
    return lists.value[animeId]?.status ?? null
  }

  function getItem(animeId: string): UserListItem | null {
    return lists.value[animeId] ?? null
  }

  function getByStatus(status: UserListStatus): [string, UserListItem][] {
    return Object.entries(lists.value).filter(
      ([, item]) => item.status === status,
    )
  }

  function isInList(animeId: string): boolean {
    return animeId in lists.value
  }

  function setRating(animeId: string, score: number) {
    ratings.value = { ...ratings.value, [animeId]: score }
  }

  function getRating(animeId: string): number {
    return ratings.value[animeId] ?? 0
  }

  function getListStats(): Record<UserListStatus, number> {
    const stats = {} as Record<UserListStatus, number>
    for (const s of USER_LIST_STATUSES) {
      stats[s] = 0
    }
    for (const item of Object.values(lists.value)) {
      stats[item.status]++
    }
    return stats
  }

  return {
    lists: readonly(lists),
    ratings: readonly(ratings),
    addToList,
    removeFromList,
    updateStatus,
    getStatus,
    getItem,
    getByStatus,
    isInList,
    setRating,
    getRating,
    getListStats,
  }
}
