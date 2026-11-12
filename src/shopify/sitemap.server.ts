import { inContext, storefront } from './client.server'
import { graphql } from './graphql'
import type { SitemapEntry, SitemapType } from './types'

const sitemapCountsQuery = graphql(`
  query SitemapCounts($country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    products: sitemap(type: PRODUCT) {
      pagesCount {
        count
      }
    }
    collections: sitemap(type: COLLECTION) {
      pagesCount {
        count
      }
    }
    pages: sitemap(type: PAGE) {
      pagesCount {
        count
      }
    }
  }
`)

const sitemapResourcesQuery = graphql(`
  query SitemapResources($type: SitemapType!, $page: Int!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    sitemap(type: $type) {
      resources(page: $page) {
        items {
          handle
          updatedAt
        }
      }
    }
  }
`)

const apiType = { products: 'PRODUCT', collections: 'COLLECTION', pages: 'PAGE' } as const

// No buyer is behind a sitemap request, so the buyer IP is not forwarded.
const options = { buyer: false }

// How many pages of up to 250 resources Shopify holds for each type.
export const fetchSitemapPageCounts = async (): Promise<Record<SitemapType, number>> => {
  const data = await storefront(sitemapCountsQuery, inContext, options)
  return {
    products: data.products.pagesCount?.count ?? 1,
    collections: data.collections.pagesCount?.count ?? 1,
    pages: data.pages.pagesCount?.count ?? 1,
  }
}

// One call per sitemap file, however large the catalogue is.
export const fetchSitemapEntries = async (type: SitemapType, page: number): Promise<Array<SitemapEntry>> => {
  const data = await storefront(sitemapResourcesQuery, { type: apiType[type], page, ...inContext }, options)
  return (data.sitemap.resources?.items ?? []).map((item) => ({ handle: item.handle, updatedAt: item.updatedAt }))
}
