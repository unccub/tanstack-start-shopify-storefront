export const PAGE_SIZE = 24

export const collectionSortValues = [
  'featured',
  'best-selling',
  'newest',
  'price-asc',
  'price-desc',
  'title-asc',
  'title-desc',
] as const

export type CollectionSort = (typeof collectionSortValues)[number]

export const collectionSortLabels: Record<CollectionSort, string> = {
  featured: 'Featured',
  'best-selling': 'Best selling',
  newest: 'Newest',
  'price-asc': 'Price, low to high',
  'price-desc': 'Price, high to low',
  'title-asc': 'Name, A to Z',
  'title-desc': 'Name, Z to A',
}

export const toCollectionSort = (sort: CollectionSort) => {
  switch (sort) {
    case 'best-selling':
      return { sortKey: 'BEST_SELLING', reverse: false } as const
    case 'newest':
      return { sortKey: 'CREATED', reverse: true } as const
    case 'price-asc':
      return { sortKey: 'PRICE', reverse: false } as const
    case 'price-desc':
      return { sortKey: 'PRICE', reverse: true } as const
    case 'title-asc':
      return { sortKey: 'TITLE', reverse: false } as const
    case 'title-desc':
      return { sortKey: 'TITLE', reverse: true } as const
    case 'featured':
      return { sortKey: 'COLLECTION_DEFAULT', reverse: false } as const
  }
}

export const searchSortValues = ['relevance', 'price-asc', 'price-desc'] as const

export type SearchSort = (typeof searchSortValues)[number]

export const searchSortLabels: Record<SearchSort, string> = {
  relevance: 'Relevance',
  'price-asc': 'Price, low to high',
  'price-desc': 'Price, high to low',
}

export const toSearchSort = (sort: SearchSort) => {
  switch (sort) {
    case 'price-asc':
      return { sortKey: 'PRICE', reverse: false } as const
    case 'price-desc':
      return { sortKey: 'PRICE', reverse: true } as const
    case 'relevance':
      return { sortKey: 'RELEVANCE', reverse: false } as const
  }
}
