import { gql } from 'graphql-request'

export const SEARCH_ANIMES = gql`
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

export const GET_ANIME_BY_ID = gql`
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
