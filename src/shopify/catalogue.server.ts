import { inContext, storefront } from './client.server'
import type { ProductFilterInput } from './filters'
import { collectionCardFragment, imageFragment, pageInfoFragment, productCardFragment } from './fragments'
import { graphql } from './graphql'
import type { ResultOf } from './graphql'
import type { Cursor } from './pagination'
import { toConnectionArgs, withCursorFallback } from './pagination'
import { sanitiseHtml } from './sanitise'
import type { CollectionSort } from './sort'
import { toCollectionSort } from './sort'
import type { CollectionCardData, CollectionDetail, ProductList } from './types'

const productsQuery = graphql(
  `
    query Products($first: Int!, $after: String, $sortKey: ProductSortKeys, $reverse: Boolean, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
      products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) {
        nodes {
          ...ProductCard
        }
        pageInfo {
          ...PageInfo
        }
      }
    }
  `,
  [productCardFragment, pageInfoFragment],
)

const collectionsQuery = graphql(
  `
    query Collections($first: Int!, $after: String, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
      collections(first: $first, after: $after, sortKey: TITLE) {
        nodes {
          ...CollectionCard
        }
        pageInfo {
          ...PageInfo
        }
      }
    }
  `,
  [collectionCardFragment, pageInfoFragment],
)

const collectionQuery = graphql(
  `
    query Collection(
      $handle: String!
      $first: Int
      $after: String
      $last: Int
      $before: String
      $sortKey: ProductCollectionSortKeys
      $reverse: Boolean
      $filters: [ProductFilter!]
      $country: CountryCode
      $language: LanguageCode
    ) @inContext(country: $country, language: $language) {
      collection(handle: $handle) {
        id
        handle
        title
        description
        descriptionHtml
        updatedAt
        seo {
          title
          description
        }
        image {
          ...Image
        }
        products(first: $first, after: $after, last: $last, before: $before, sortKey: $sortKey, reverse: $reverse, filters: $filters) {
          nodes {
            ...ProductCard
          }
          filters {
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
    }
  `,
  [imageFragment, productCardFragment, pageInfoFragment],
)

type ProductsInput = {
  first: number
  after?: string
  sort?: 'best-selling' | 'newest' | 'title'
}

const productSort = {
  'best-selling': { sortKey: 'BEST_SELLING', reverse: false },
  newest: { sortKey: 'CREATED_AT', reverse: true },
  title: { sortKey: 'TITLE', reverse: false },
} as const

export const fetchProducts = async ({ first, after, sort = 'best-selling' }: ProductsInput): Promise<ProductList> => {
  const data = await storefront(productsQuery, { first, after, ...productSort[sort], ...inContext })
  return { products: data.products.nodes, pageInfo: data.products.pageInfo }
}

const MAX_COLLECTION_PAGES = 4

export const fetchCollections = async (): Promise<Array<CollectionCardData>> => {
  const collections: Array<CollectionCardData> = []
  let after: string | null = null
  for (let page = 0; page < MAX_COLLECTION_PAGES; page += 1) {
    const data: ResultOf<typeof collectionsQuery> = await storefront(collectionsQuery, { first: 50, after, ...inContext })
    collections.push(...data.collections.nodes)
    if (!data.collections.pageInfo.hasNextPage) break
    after = data.collections.pageInfo.endCursor
  }
  return collections
}

type CollectionInput = Cursor & {
  handle: string
  sort: CollectionSort
  filters: Array<ProductFilterInput>
  pageSize?: number
}

export const fetchCollection = async ({ handle, sort, filters, pageSize, ...cursor }: CollectionInput): Promise<CollectionDetail | null> => {
  const data = await withCursorFallback(cursor, (safeCursor) =>
    storefront(collectionQuery, {
      handle,
      ...toConnectionArgs(safeCursor, pageSize),
      ...toCollectionSort(sort),
      filters,
      ...inContext,
    }),
  )
  const collection = data.collection
  if (!collection) return null

  return {
    id: collection.id,
    handle: collection.handle,
    title: collection.title,
    description: collection.description,
    descriptionHtml: sanitiseHtml(collection.descriptionHtml),
    updatedAt: collection.updatedAt,
    seo: { title: collection.seo.title, description: collection.seo.description },
    image: collection.image,
    products: collection.products.nodes,
    filters: collection.products.filters,
    pageInfo: collection.products.pageInfo,
  }
}
