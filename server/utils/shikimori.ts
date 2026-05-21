import { GraphQLClient } from 'graphql-request'

let client: GraphQLClient | null = null

export function useShikimoriClient(): GraphQLClient {
  if (client) return client

  const config = useRuntimeConfig()
  client = new GraphQLClient(config.shikimori.apiUrl, {
    headers: {
      'User-Agent': 'AnimeBaza/1.0 (educational project)',
    },
  })

  return client
}

export function handleShikimoriError(err: unknown): never {
  if (err && typeof err === 'object' && 'statusCode' in err) {
    throw err
  }

  const errObj = err as Record<string, unknown>
  const response = errObj.response as Record<string, unknown> | undefined
  const status = errObj.status ?? response?.status

  if (status === 429) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Rate limited. Please try again later.',
    })
  }

  throw createError({
    statusCode: 502,
    statusMessage: 'Shikimori API unavailable.',
  })
}
