import { absoluteUrl, storefrontConfig } from '~/config'
import { shopifyImageUrl } from '~/shopify/images'
import type { ImageData, ProductCardData, ProductDetail } from '~/shopify/types'

type JsonLd = Record<string, unknown>

type SeoInput = {
  // The page's own title. The shop name is appended unless `bare` is set.
  title: string
  bare?: boolean
  description?: string | null
  // Site-relative path of the canonical URL, without search params that only reorder or page the content.
  path: string
  type?: 'website' | 'product'
  image?: ImageData | null
  jsonLd?: ReadonlyArray<JsonLd>
  noindex?: boolean
}

const DESCRIPTION_LENGTH = 160
const SOCIAL_IMAGE_WIDTH = 1200

const toDescription = (text: string) => {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= DESCRIPTION_LENGTH) return clean
  const cut = clean.slice(0, DESCRIPTION_LENGTH - 1)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 80))}…`
}

const socialImage = (image: ImageData) => {
  const width = Math.min(image.width ?? SOCIAL_IMAGE_WIDTH, SOCIAL_IMAGE_WIDTH)
  const height = image.width && image.height ? Math.round((width * image.height) / image.width) : undefined
  return { url: shopifyImageUrl(image.url, width), width, height }
}

// The script body is written as raw HTML, so "<" is escaped to stop store text closing the element.
const serialiseJsonLd = (data: JsonLd) => JSON.stringify(data).replace(/</g, '\\u003c')

export const seo = ({ title, bare = false, description, path, type = 'website', image, jsonLd = [], noindex = false }: SeoInput) => {
  const fullTitle = bare ? title : `${title} | ${storefrontConfig.shopName}`
  const summary = toDescription(description || storefrontConfig.shopDescription)
  const url = absoluteUrl(path)
  const picture = image ? socialImage(image) : null

  return {
    meta: [
      { title: fullTitle },
      { name: 'description', content: summary },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: summary },
      { property: 'og:type', content: type },
      { property: 'og:url', content: url },
      { name: 'twitter:card', content: picture ? 'summary_large_image' : 'summary' },
      ...(picture
        ? [
            { property: 'og:image', content: picture.url },
            { property: 'og:image:width', content: String(picture.width) },
            ...(picture.height ? [{ property: 'og:image:height', content: String(picture.height) }] : []),
            { property: 'og:image:alt', content: image?.altText || title },
          ]
        : []),
      ...(noindex ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),
    ],
    links: [{ rel: 'canonical', href: url }],
    scripts: jsonLd.map((data) => ({ type: 'application/ld+json', children: serialiseJsonLd(data) })),
  }
}

// For a route whose loader found nothing or failed: there is no content to describe.
export const seoUnavailable = () => ({
  meta: [{ title: `Page not found | ${storefrontConfig.shopName}` }, { name: 'robots', content: 'noindex, nofollow' }],
})

const SCHEMA = 'https://schema.org'

export const websiteJsonLd = (): JsonLd => ({
  '@context': SCHEMA,
  '@type': 'WebSite',
  name: storefrontConfig.shopName,
  url: absoluteUrl('/'),
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${absoluteUrl('/search')}?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
})

export const organizationJsonLd = (): JsonLd => ({
  '@context': SCHEMA,
  '@type': 'Organization',
  name: storefrontConfig.shopName,
  url: absoluteUrl('/'),
})

export const breadcrumbJsonLd = (items: ReadonlyArray<{ name: string; path: string }>): JsonLd => ({
  '@context': SCHEMA,
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
})

export const itemListJsonLd = (name: string, products: ReadonlyArray<ProductCardData>): JsonLd => ({
  '@context': SCHEMA,
  '@type': 'ItemList',
  name,
  numberOfItems: products.length,
  itemListElement: products.map((product, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: product.title,
    url: absoluteUrl(`/products/${product.handle}`),
  })),
})

// Describes the product as a whole, not the selected variant, to match the canonical URL.
export const productJsonLd = (product: ProductDetail): JsonLd => {
  const { minVariantPrice, maxVariantPrice } = product.priceRange
  const url = absoluteUrl(`/products/${product.handle}`)
  const availability = `${SCHEMA}/${product.availableForSale ? 'InStock' : 'OutOfStock'}`
  const images = (product.images.length > 0 ? product.images : product.featuredImage ? [product.featuredImage] : []).slice(0, 6)

  return {
    '@context': SCHEMA,
    '@type': 'Product',
    name: product.title,
    description: toDescription(product.seo.description || product.description || product.title),
    url,
    ...(images.length > 0 ? { image: images.map((image) => shopifyImageUrl(image.url, SOCIAL_IMAGE_WIDTH)) } : {}),
    ...(product.vendor ? { brand: { '@type': 'Brand', name: product.vendor } } : {}),
    offers:
      minVariantPrice.amount === maxVariantPrice.amount
        ? { '@type': 'Offer', url, price: minVariantPrice.amount, priceCurrency: minVariantPrice.currencyCode, availability }
        : {
            '@type': 'AggregateOffer',
            url,
            lowPrice: minVariantPrice.amount,
            highPrice: maxVariantPrice.amount,
            priceCurrency: minVariantPrice.currencyCode,
            availability,
          },
  }
}
