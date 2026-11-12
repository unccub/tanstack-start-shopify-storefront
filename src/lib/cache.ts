// Every choice here is explained in docs/caching.md.

// Browsers always check back, so a shopper never sees a page older than the CDN's copy.
const BROWSER = 'public, max-age=0, must-revalidate'

const FRESH_SECONDS = 60
const STALE_SECONDS = 60 * 60 * 24

export const CATALOGUE_CDN = `public, durable, max-age=${FRESH_SECONDS}, stale-while-revalidate=${STALE_SECONDS}`
export const SUGGESTIONS_CDN = 'public, max-age=60, stale-while-revalidate=600'
export const SITEMAP_CDN = `public, durable, max-age=3600, stale-while-revalidate=${STALE_SECONDS}`
export const NOT_FOUND_CDN = 'public, max-age=60'

export const BROWSER_CACHE = BROWSER

// Set by a response built from incomplete data, and removed again by the server entry.
export const DEGRADED_HEADER = 'X-Storefront-Degraded'

export const catalogueHeaders = () => ({
  'Cache-Control': BROWSER,
  'Netlify-CDN-Cache-Control': CATALOGUE_CDN,
})

// Only these params change a collection page, so tracking params do not split its cache entry.
export const collectionHeaders = () => ({
  ...catalogueHeaders(),
  'Netlify-Vary': 'query=sort|filter|price_min|price_max|after|before',
})

// Search queries are open-ended, so results are not stored on the CDN.
export const searchHeaders = () => ({ 'Cache-Control': BROWSER })
