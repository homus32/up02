import { describe, it, expect, vi } from 'vitest'
import { handleShikimoriError, useShikimoriClient } from '../../server/utils/shikimori'

// Mock createError from h3: throws the opts object so we can assert on it
vi.mock('h3', () => ({
  createError: vi.fn(function (opts: Record<string, unknown>): never {
    const err = new Error((opts.statusMessage as string) || 'Error')
    Object.assign(err, opts)
    throw err
  }),
}))

// Mock graphql-request to avoid real HTTP calls
vi.mock('graphql-request', () => ({
  GraphQLClient: vi.fn(function () {
    return { request: vi.fn() }
  }),
}))

// Mock useRuntimeConfig (Nuxt auto-import, not available outside Nuxt env)
vi.mock('#app/nuxt', () => ({
  useRuntimeConfig: vi.fn(function (): Record<string, unknown> {
    return {
      shikimori: { apiUrl: 'https://shikimori.one/api/graphql' },
    }
  }),
}))

vi.stubGlobal('useRuntimeConfig', () => ({
  shikimori: { apiUrl: 'https://shikimori.one/api/graphql' },
}))

describe('handleShikimoriError', () => {
  it('re-throws h3 errors with statusCode as-is', () => {
    const h3Error = { statusCode: 404, statusMessage: 'Not Found' }
    expect(() => handleShikimoriError(h3Error)).toThrow()
  })

  it('throws 429 when err.status is 429', () => {
    const rateLimitError = { status: 429 }
    expect(() => handleShikimoriError(rateLimitError)).toThrow()
  })

  it('throws 429 when err.response.status is 429', () => {
    const rateLimitError = { response: { status: 429 } }
    expect(() => handleShikimoriError(rateLimitError)).toThrow()
  })

  it('throws 502 for unknown errors', () => {
    const unknownError = new Error('Network failure')
    expect(() => handleShikimoriError(unknownError)).toThrow()
  })

  it('throws 502 for graphql-request ClientError (500)', () => {
    const clientError = {
      response: { status: 500, errors: [{ message: 'Internal server error' }] },
    }
    expect(() => handleShikimoriError(clientError)).toThrow()
  })
})

describe('useShikimoriClient', () => {
  it('returns a GraphQLClient instance', () => {
    const client = useShikimoriClient()
    expect(client).toBeDefined()
    expect(client.request).toBeDefined()
  })

  it('returns the same instance on repeated calls (singleton)', () => {
    const client1 = useShikimoriClient()
    const client2 = useShikimoriClient()
    expect(client1).toBe(client2)
  })
})
