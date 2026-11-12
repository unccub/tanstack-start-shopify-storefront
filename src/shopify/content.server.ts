import { isMockShop, storefrontConfig } from '~/config'
import { fetchCollections } from './catalogue.server'
import { inContext, storefront } from './client.server'
import { getPrivateStorefrontToken } from './env.server'
import { graphql } from './graphql'
import { sanitiseHtml } from './sanitise'
import type { ContentPage, Navigation, NavigationLink } from './types'

const HEADER_MENU_HANDLE = 'main-menu'
const FOOTER_MENU_HANDLE = 'footer'
const MAX_COLLECTION_LINKS = 6

const menusQuery = graphql(`
  query Menus($header: String!, $footer: String!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    shop {
      primaryDomain {
        url
      }
    }
    header: menu(handle: $header) {
      items {
        title
        url
      }
    }
    footer: menu(handle: $footer) {
      items {
        title
        url
      }
    }
  }
`)

const pageQuery = graphql(`
  query Page($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    page(handle: $handle) {
      id
      handle
      title
      body
      bodySummary
      updatedAt
      seo {
        title
        description
      }
    }
  }
`)

// Paths this storefront has routes for. Menu items pointing elsewhere on the store are left out.
const ROUTED_PATHS = /^\/(?:$|collections(?:\/|$)|products\/|pages\/|search(?:$|\?)|cart$)/

const hostOf = (url: string) => {
  try {
    return new URL(url).host
  } catch {
    return undefined
  }
}

const toNavigationLink = (item: { title: string; url: string | null }, storeHosts: ReadonlyArray<string>): Array<NavigationLink> => {
  if (!item.url) return []
  let parsed: URL
  try {
    parsed = new URL(item.url, 'https://storefront.invalid')
  } catch {
    return []
  }
  // Menu URLs point at the store's own domain, so they become paths on this site. External links are left out.
  if (parsed.host !== 'storefront.invalid' && !storeHosts.includes(parsed.host)) return []
  const path = `${parsed.pathname}${parsed.search}`
  return ROUTED_PATHS.test(path) ? [{ label: item.title, href: path }] : []
}

const collectionNavigation = async (): Promise<Navigation> => {
  const collections = await fetchCollections()
  const links = collections.map((collection) => ({ label: collection.title, href: `/collections/${collection.handle}` }))
  return {
    header: [...links.slice(0, MAX_COLLECTION_LINKS), { label: 'All collections', href: '/collections' }],
    footer: [
      { label: 'All collections', href: '/collections' },
      { label: 'Search', href: '/search' },
      { label: 'Cart', href: '/cart' },
    ],
  }
}

export const fetchNavigation = async (): Promise<Navigation> => {
  // Menus need a token on a real store. Without one the navigation is built from collections.
  if (isMockShop || !getPrivateStorefrontToken()) return collectionNavigation()

  const data = await storefront(menusQuery, { header: HEADER_MENU_HANDLE, footer: FOOTER_MENU_HANDLE, ...inContext })
  const storeHosts = [hostOf(data.shop.primaryDomain.url), hostOf(`https://${storefrontConfig.storeDomain}`)].filter(
    (host): host is string => Boolean(host),
  )
  const header = (data.header?.items ?? []).flatMap((item) => toNavigationLink(item, storeHosts))
  if (header.length === 0) return collectionNavigation()

  return { header, footer: (data.footer?.items ?? []).flatMap((item) => toNavigationLink(item, storeHosts)) }
}

export const fetchPage = async (handle: string): Promise<ContentPage | null> => {
  const { page } = await storefront(pageQuery, { handle, ...inContext })
  if (!page) return null

  return {
    id: page.id,
    handle: page.handle,
    title: page.title,
    bodyHtml: sanitiseHtml(page.body),
    bodySummary: page.bodySummary,
    updatedAt: page.updatedAt,
    seo: { title: page.seo?.title ?? null, description: page.seo?.description ?? null },
  }
}
