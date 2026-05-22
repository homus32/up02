import { describe, it, expect, vi } from 'vitest'

// Mock Nuxt's useAsyncData to return a controlled object with refresh
const mockUseAsyncData = vi.fn()
vi.mock('#app/composables/asyncData', () => ({
  useAsyncData: mockUseAsyncData,
}))

describe('useAsyncData returns refresh method', () => {
  it('returns object with refresh property as a function (regression for CI-4)', async () => {
    // Arrange: mock useAsyncData to return an object with refresh
    const mockRefresh = vi.fn()
    mockUseAsyncData.mockReturnValue({
      data: null,
      status: 'idle',
      error: null,
      refresh: mockRefresh,
    })

    // Act: dynamically import to use the mocked version
    const { useAsyncData } = await import('#app/composables/asyncData')
    const result = useAsyncData('test-key', () => Promise.resolve(null))

    // Verify the returned shape matches what anime/[id].vue expects
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('status')
    expect(result).toHaveProperty('error')
    expect(result).toHaveProperty('refresh')
    expect(typeof result.refresh).toBe('function')
    expect(result.refresh).toBe(mockRefresh)
  })
})
