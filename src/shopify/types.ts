import type {
  CollectionCardData,
  ImageData,
  MoneyData,
  PageInfoData,
  ProductCardData,
  ProductVariantData,
} from './fragments'

export type SelectedOption = { name: string; value: string }

export type NavigationLink = { label: string; href: string }

export type Navigation = {
  header: Array<NavigationLink>
  footer: Array<NavigationLink>
}

export type ProductList = {
  products: Array<ProductCardData>
  pageInfo: PageInfoData
}

export type FilterValue = {
  id: string
  label: string
  count: number
  // A JSON string to pass back in the `filters` input to apply this value.
  input: string
}

export type Filter = {
  id: string
  label: string
  type: 'BOOLEAN' | 'LIST' | 'PRICE_RANGE'
  values: Array<FilterValue>
}

export type CollectionDetail = {
  id: string
  handle: string
  title: string
  description: string
  descriptionHtml: string
  updatedAt: string
  seo: { title: string | null; description: string | null }
  image: ImageData | null
  products: Array<ProductCardData>
  filters: Array<Filter>
  pageInfo: PageInfoData
}

export type ProductOptionValue = {
  name: string
  swatchColor: string | null
  selected: boolean
  // False when no variant has this value together with the other selected values.
  exists: boolean
  available: boolean
  // The full selection that choosing this value leads to.
  selectedOptions: Array<SelectedOption>
}

export type ProductOption = {
  name: string
  values: Array<ProductOptionValue>
}

export type ProductDetail = {
  id: string
  handle: string
  title: string
  vendor: string
  description: string
  descriptionHtml: string
  availableForSale: boolean
  updatedAt: string
  seo: { title: string | null; description: string | null }
  featuredImage: ImageData | null
  images: Array<ImageData>
  priceRange: { minVariantPrice: MoneyData; maxVariantPrice: MoneyData }
  compareAtPriceRange: { minVariantPrice: MoneyData; maxVariantPrice: MoneyData }
  // True for a product sold as one variant, where Shopify reports a single "Title" option.
  hasOnlyDefaultVariant: boolean
  options: Array<ProductOption>
  selectedVariant: ProductVariantData | null
}

export type SearchResults = {
  query: string
  totalCount: number
  products: Array<ProductCardData>
  filters: Array<Filter>
  pageInfo: PageInfoData
}

export type PredictiveSearchResults = {
  query: string
  products: Array<ProductCardData>
  collections: Array<{ id: string; handle: string; title: string }>
}

export type ContentPage = {
  id: string
  handle: string
  title: string
  bodyHtml: string
  bodySummary: string
  updatedAt: string
  seo: { title: string | null; description: string | null }
}

export type SitemapType = 'products' | 'collections' | 'pages'

export type SitemapEntry = { handle: string; updatedAt: string }

export type CartLine = {
  id: string
  quantity: number
  variantId: string
  variantTitle: string
  productHandle: string
  productTitle: string
  selectedOptions: Array<SelectedOption>
  image: ImageData | null
  availableForSale: boolean
  unitPrice: MoneyData
  compareAtUnitPrice: MoneyData | null
  subtotal: MoneyData
  total: MoneyData
}

export type Cart = {
  checkoutUrl: string
  totalQuantity: number
  subtotal: MoneyData
  total: MoneyData
  discountCodes: Array<{ code: string; applicable: boolean }>
  lines: Array<CartLine>
}

export type CartResult = {
  cart: Cart | null
  // Problems the buyer should see, such as an invalid discount code or limited stock.
  messages: Array<string>
}

export type { CollectionCardData, ImageData, MoneyData, PageInfoData, ProductCardData, ProductVariantData }
