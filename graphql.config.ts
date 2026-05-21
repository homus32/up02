import type { IGraphQLConfig } from 'graphql-config'

const config: IGraphQLConfig = {
  schema: './docs/shikimori_graphql/schema.graphql',
  documents: ['server/graphql/**/*.ts'],
}

export default config
