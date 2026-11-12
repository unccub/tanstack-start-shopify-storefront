import { absoluteUrl } from '~/config'
import type { SitemapEntry, SitemapType } from '~/shopify/types'

export const sitemapTypes = ['products', 'collections', 'pages'] as const satisfies ReadonlyArray<SitemapType>

const pathPrefix: Record<SitemapType, string> = {
  products: '/products/',
  collections: '/collections/',
  pages: '/pages/',
}

// Routes that exist without a store resource behind them.
const staticEntries: Record<SitemapType, ReadonlyArray<string>> = {
  products: [],
  collections: ['/collections'],
  pages: ['/'],
}

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>'
const NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9'

// One file per page of Shopify's own sitemap data, so each file costs a single API call.
export const sitemapFileCount = (type: SitemapType, pageCount: number) => Math.max(pageCount, staticEntries[type].length > 0 ? 1 : 0)

export const sitemapFilePath = (type: SitemapType, page: number) => `/sitemap/${type}-${page}.xml`

export const parseSitemapFile = (file: string) => {
  const match = /^(products|collections|pages)-([1-9]\d{0,3})\.xml$/.exec(file)
  return match ? { type: match[1] as SitemapType, page: Number(match[2]) } : null
}

export const renderSitemapIndex = (files: ReadonlyArray<string>) =>
  [
    XML_HEADER,
    `<sitemapindex xmlns="${NAMESPACE}">`,
    ...files.map((file) => `  <sitemap><loc>${escapeXml(absoluteUrl(file))}</loc></sitemap>`),
    '</sitemapindex>',
    '',
  ].join('\n')

// Returns null when the file would be empty, which is a page number past the last one.
export const renderSitemapFile = (type: SitemapType, page: number, entries: ReadonlyArray<SitemapEntry>) => {
  const urls = [
    ...(page === 1 ? staticEntries[type] : []).map((path) => ({ loc: absoluteUrl(path), lastmod: null as string | null })),
    ...entries.map((entry) => ({
      loc: absoluteUrl(`${pathPrefix[type]}${encodeURIComponent(entry.handle)}`),
      lastmod: entry.updatedAt,
    })),
  ]

  if (urls.length === 0) return null

  return [
    XML_HEADER,
    `<urlset xmlns="${NAMESPACE}">`,
    ...urls.map(
      ({ loc, lastmod }) => `  <url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ''}</url>`,
    ),
    '</urlset>',
    '',
  ].join('\n')
}
