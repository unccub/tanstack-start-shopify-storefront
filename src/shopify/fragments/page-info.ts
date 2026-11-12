import { graphql } from '../graphql'
import type { FragmentOf } from '../graphql'

export const pageInfoFragment = graphql(`
  fragment PageInfo on PageInfo {
    hasNextPage
    hasPreviousPage
    startCursor
    endCursor
  }
`)

export type PageInfoData = FragmentOf<typeof pageInfoFragment>
