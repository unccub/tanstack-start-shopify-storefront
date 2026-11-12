import { inContext, storefront } from './client.server'
import type { ProductFilterInput } from './filters'
import { pageInfoFragment, productCardFragment } from './fragments'
import { graphql } from './graphql'
import type { Cursor } from './pagination'
import { toConnectionArgs, withCursorFallback } from './pagination'
import type { SearchSort } from './sort'
import { toSearchSort } from './sort'
import type { PredictiveSearchResults, ProductCardData, SearchResults } from './types'

const searchQuery = graphql(
  `
    query Search(
      $query: String!
      $first: Int
      $after: String
      $last: Int
      $before: String
      $sortKey: SearchSortKeys
      $reverse: Boolean
      $filters: [ProductFilter!]
      $country: CountryCode
      $language: LanguageCode
    ) @inContext(country: $country, language: $language) {
      search(
        query: $query
        first: $first
        after: $after
        last: $last
        before: $before
        sortKey: $sortKey
        reverse: $reverse
        productFilters: $filters
        types: [PRODUCT]
        unavailableProducts: LAST
      ) {
        totalCount
        nodes {
          __typename
          ... on Product {
            ...ProductCard
          }
        }
        productFilters {
          id
          label
          type
          values {
            id
            label
            count
            input
          }
        }
        pageInfo {
          ...PageInfo
        }
      }
    }
  `,
  [productCardFragment, pageInfoFragment],
)

const predictiveSearchQuery = graphql(
  `
    query PredictiveSearch($query: String!, $limit: Int!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
      predictiveSearch(query: $query, limit: $limit, limitScope: EACH, types: [PRODUCT, COLLECTION]) {
        products {
          ...ProductCard
        }
        collections {
          id
          handle
          title
        }
      }
    }
  `,
  [productCardFragment],
)

type SearchInput = Cursor & {
  query: string
  sort: SearchSort
  filters: Array<ProductFilterInput>
}

const emptyPageInfo = { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null }

export const fetchSearch = async ({ query, sort, filters, ...cursor }: SearchInput): Promise<SearchResults> => {
  const term = query.trim()
  if (!term) return { query: term, totalCount: 0, products: [], filters: [], pageInfo: emptyPageInfo }

  const data = await withCursorFallback(cursor, (safeCursor) =>
    storefront(searchQuery, {
      query: term,
      ...toConnectionArgs(safeCursor),
      ...toSearchSort(sort),
      filters,
      ...inContext,
    }),
  )

  return {
    query: term,
    totalCount: data.search.totalCount,
    products: data.search.nodes.flatMap((node): Array<ProductCardData> => (node.__typename === 'Product' ? [node] : [])),
    filters: data.search.productFilters,
    pageInfo: data.search.pageInfo,
  }
}

export const fetchPredictiveSearch = async (query: string, limit = 5): Promise<PredictiveSearchResults> => {
  const term = query.trim()
  if (!term) return { query: term, products: [], collections: [] }

  const data = await storefront(predictiveSearchQuery, { query: term, limit, ...inContext })
  return {
    query: term,
    products: data.predictiveSearch?.products ?? [],
    collections: data.predictiveSearch?.collections ?? [],
  }
}
