import gql from 'graphql-tag'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'

export interface AnimeGraphQLResult {
  id: string
  name: string
  russian: string
  kind: string
  score: number
  status: string
  episodes: number
  episodesAired: number
  duration: number
  season: string | null
  description: string | null
  descriptionHtml: string | null
  poster: { mainUrl: string; originalUrl: string } | null
  genres: { id: number; name: string; russian: string }[]
  studios: { id: number; name: string }[]
  airedOn: { year: number } | null
}

export interface SearchAnimesVariables {
  page?: number
  limit?: number
  order?: string
  kind?: string
  status?: string
  season?: string
  score?: number
  search?: string
}

export interface GetAnimeByIdVariables {
  ids: string
}

export const SEARCH_ANIMES: TypedDocumentNode<
  { animes: AnimeGraphQLResult[] },
  SearchAnimesVariables
> = gql`
  query($page: PositiveInt, $limit: PositiveInt, $order: OrderEnum, $kind: AnimeKindString, $status: AnimeStatusString, $season: SeasonString, $score: Int, $search: String) {
    animes(page: $page, limit: $limit, order: $order, kind: $kind, status: $status, season: $season, score: $score, search: $search) {
      id name russian kind score status episodes episodesAired duration season description descriptionHtml
      poster { mainUrl originalUrl }
      genres { id name russian }
      studios { id name }
      airedOn { year }
    }
  }
`

export const GET_ANIME_BY_ID: TypedDocumentNode<
  { animes: AnimeGraphQLResult[] },
  GetAnimeByIdVariables
> = gql`
  query($ids: String!) {
    animes(ids: $ids, limit: 1) {
      id name russian kind score status episodes episodesAired duration season description descriptionHtml
      poster { mainUrl originalUrl }
      genres { id name russian }
      studios { id name }
      airedOn { year }
    }
  }
`
