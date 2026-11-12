import { createFileRoute } from '@tanstack/react-router'
import { absoluteUrl, noindex } from '~/config'
import { BROWSER_CACHE, SITEMAP_CDN } from '~/lib/cache'

const rules = noindex
  ? ['User-agent: *', 'Disallow: /']
  : ['User-agent: *', 'Disallow: /cart', 'Disallow: /search', 'Disallow: /_serverFn/', '', `Sitemap: ${absoluteUrl('/sitemap.xml')}`]

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () =>
        new Response(`${rules.join('\n')}\n`, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': BROWSER_CACHE,
            'Netlify-CDN-Cache-Control': SITEMAP_CDN,
          },
        }),
    },
  },
})
