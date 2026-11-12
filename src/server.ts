import handler, { createServerEntry } from '@tanstack/react-start/server-entry'
import { noindex } from '~/config'
import { DEGRADED_HEADER, NOT_FOUND_CDN } from '~/lib/cache'

const CDN_HEADERS = ['Netlify-CDN-Cache-Control', 'CDN-Cache-Control', 'Netlify-Vary']

// The last word on caching, whatever a route asked for: errors, redirects, pages built from incomplete data and anything that sets a cookie
// must not be stored on the CDN as if they were catalogue pages.
const finalise = (response: Response) => {
  const headers = new Headers(response.headers)
  const dropCdn = () => CDN_HEADERS.forEach((name) => headers.delete(name))

  const degraded = headers.has(DEGRADED_HEADER)
  headers.delete(DEGRADED_HEADER)

  if (headers.has('Set-Cookie') || response.status >= 500 || degraded) {
    dropCdn()
    headers.set('Cache-Control', 'no-store')
  } else if (response.status >= 300 && response.status < 400) {
    dropCdn()
  } else if (response.status >= 400 && headers.has('Netlify-CDN-Cache-Control')) {
    headers.delete('Netlify-Vary')
    headers.set('Netlify-CDN-Cache-Control', NOT_FOUND_CDN)
  }

  if (noindex) headers.set('X-Robots-Tag', 'noindex, nofollow')

  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

export default createServerEntry({
  fetch: async (request, options) => finalise(await handler.fetch(request, options)),
})
