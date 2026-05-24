import { describe, it, expect, vi, beforeEach } from 'vitest'
import { normalizeItem } from '../../app/types/anime'
import type { AnimeLists, UserListItem } from '../../app/types/anime'

// Mock the Nuxt alias ~/types/anime so useUserLists can resolve it.
// We provide the real normalizeItem so getByStatus produces correct output shapes.
vi.mock('~/types/anime', () => ({
  normalizeItem: (item: Record<string, unknown>) => ({
    status: item.status ?? 'planned',
    name: item.name ?? '',
    russian: item.russian ?? '',
    posterUrl: item.posterUrl ?? null,
    score: item.score ?? 0,
    addedAt: item.addedAt ?? Date.now(),
    kind: item.kind ?? 'tv',
    animeStatus: item.animeStatus ?? 'released',
    episodes: item.episodes ?? 0,
    airedOnYear: item.airedOnYear ?? undefined,
  }),
  USER_LIST_STATUSES: ['planned', 'watching', 'completed', 'on_hold', 'dropped'],
}))

// ──────────────────────────────────────────────
// normalizeItem — pure function, no mocking needed
// ──────────────────────────────────────────────

describe('normalizeItem', () => {
  it('preserves complete data', () => {
    // Arrange
    const item: UserListItem = {
      status: 'watching',
      name: 'Naruto',
      russian: 'Наруто',
      posterUrl: 'https://example.com/poster.jpg',
      score: 8,
      addedAt: 1000,
      kind: 'tv',
      animeStatus: 'ongoing',
      episodes: 220,
      airedOnYear: 2002,
    }

    // Act
    const result = normalizeItem(item)

    // Assert
    expect(result).toEqual(item)
  })

  it('fills defaults for old-format data (missing kind, animeStatus, episodes, airedOnYear)', () => {
    // Arrange — old-format item without optional fields
    const oldItem = {
      status: 'completed' as const,
      name: 'Bleach',
      russian: 'Блич',
      posterUrl: null,
      score: 9,
      addedAt: 2000,
    }

    // Act
    const result = normalizeItem(oldItem)

    // Assert — optional fields get sensible defaults
    expect(result.kind).toBe('tv')
    expect(result.animeStatus).toBe('released')
    expect(result.episodes).toBe(0)
    expect(result.airedOnYear).toBeUndefined()
  })

  it('defaults status to planned when missing', () => {
    // Arrange
    const partial = { name: 'Test' }

    // Act
    const result = normalizeItem(partial)

    // Assert
    expect(result.status).toBe('planned')
  })

  it('fills all defaults for empty input', () => {
    // Arrange
    const empty = {}

    // Act
    const result = normalizeItem(empty)

    // Assert
    expect(result).toEqual({
      status: 'planned',
      name: '',
      russian: '',
      posterUrl: null,
      score: 0,
      addedAt: expect.any(Number),
      kind: 'tv',
      animeStatus: 'released',
      episodes: 0,
      airedOnYear: undefined,
    })
  })
})

// ──────────────────────────────────────────────
// getByStatus — requires useStorage mock
// ──────────────────────────────────────────────

/**
 * Mutable backing store for the mocked useStorage.
 * The getter/setter proxy ensures mutations to/from the composable
 * stay in sync by replacing keys in-place (handles both add and delete).
 */
const mockLists = vi.hoisted(() => ({} as AnimeLists))
const mockRatings = vi.hoisted(() => ({} as Record<string, number>))

vi.mock('@vueuse/core', () => ({
  useStorage: vi.fn((key: string, defaultValue: unknown) => {
    if (key === 'anime_lists') {
      return {
        get value(): AnimeLists {
          return mockLists
        },
        set value(v: AnimeLists) {
          // Replace all entries while keeping the same object reference
          for (const k of Object.keys(mockLists)) delete (mockLists as Record<string, unknown>)[k]
          for (const [k, val] of Object.entries(v)) (mockLists as Record<string, unknown>)[k] = val
        },
      }
    }
    if (key === 'anime_ratings') {
      return {
        get value(): Record<string, number> {
          return mockRatings
        },
        set value(v: Record<string, number>) {
          for (const k of Object.keys(mockRatings)) delete mockRatings[k]
          Object.assign(mockRatings, v)
        },
      }
    }
    return { value: defaultValue }
  }),
}))

describe('getByStatus', () => {
  beforeEach(() => {
    // Reset the mutable store before each test
    for (const k of Object.keys(mockLists)) delete (mockLists as Record<string, unknown>)[k]
    for (const k of Object.keys(mockRatings)) delete mockRatings[k]
  })

  it('returns flat objects with id property', async () => {
    // Arrange — populate mock storage with test data
    mockLists['1'] = {
      status: 'watching',
      name: 'Naruto',
      russian: 'Наруто',
      posterUrl: null,
      score: 8,
      addedAt: 1000,
    } as UserListItem

    mockLists['2'] = {
      status: 'watching',
      name: 'Bleach',
      russian: 'Блич',
      posterUrl: null,
      score: 7,
      addedAt: 2000,
    } as UserListItem

    mockLists['3'] = {
      status: 'planned',
      name: 'One Piece',
      russian: 'Ван Пис',
      posterUrl: null,
      score: 0,
      addedAt: 3000,
    } as UserListItem

    // Act
    const { useUserLists } = await import('../../app/composables/useUserLists')
    const { getByStatus } = useUserLists()
    const watching = getByStatus('watching')

    // Assert
    expect(watching).toHaveLength(2)

    // First item has the flat shape: { id, ...UserListItem }
    const firstWatching = watching[0]!
    expect(firstWatching).toHaveProperty('id')
    expect(firstWatching.id).toBe('1')
    expect(firstWatching.name).toBe('Naruto')
    expect(firstWatching.russian).toBe('Наруто')
    expect(firstWatching.score).toBe(8)

    // Second item
    const secondWatching = watching[1]!
    expect(secondWatching.id).toBe('2')
    expect(secondWatching.name).toBe('Bleach')

    // Other status unaffected
    const planned = getByStatus('planned')
    expect(planned).toHaveLength(1)
    const firstPlanned = planned[0]!
    expect(firstPlanned.id).toBe('3')
    expect(firstPlanned.name).toBe('One Piece')
  })

  it('returns empty array when no items match status', async () => {
    // Arrange — only "watching" items exist
    mockLists['1'] = {
      status: 'watching',
      name: 'Naruto',
      russian: 'Наруто',
      posterUrl: null,
      score: 8,
      addedAt: 1000,
    } as UserListItem

    // Act
    const { useUserLists } = await import('../../app/composables/useUserLists')
    const { getByStatus } = useUserLists()
    const result = getByStatus('completed')

    // Assert
    expect(result).toEqual([])
  })
})
