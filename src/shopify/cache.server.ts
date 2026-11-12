import { getRequest, setResponseHeaders } from '@tanstack/react-start/server'
import { BROWSER_CACHE } from '~/lib/cache'

const SERVER_FN_PATH = '/_serverFn/'

// Marks a server function's own response as cacheable on the CDN. During server rendering the function
// runs inside the document request, where the route's headers decide, so nothing is set.
export const cacheServerFn = (cdnPolicy: string) => {
  try {
    if (!new URL(getRequest().url).pathname.startsWith(SERVER_FN_PATH)) return
    setResponseHeaders(new Headers({ 'Cache-Control': BROWSER_CACHE, 'Netlify-CDN-Cache-Control': cdnPolicy }))
  } catch {
    // No request in scope: nothing to cache.
  }
}
