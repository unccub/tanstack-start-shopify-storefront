import { createFileRoute } from '@tanstack/react-router'
import { BROWSER_CACHE, SITEMAP_CDN } from '~/lib/cache'
import { renderSitemapIndex, sitemapFileCount, sitemapFilePath, sitemapTypes } from '~/lib/sitemap'
import { fetchSitemapPageCounts } from '~/shopify/sitemap.server'

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const counts = await fetchSitemapPageCounts()
        const files = sitemapTypes.flatMap((type) =>
          Array.from({ length: sitemapFileCount(type, counts[type]) }, (_, page) => sitemapFilePath(type, page + 1)),
        )
        return new Response(renderSitemapIndex(files), {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': BROWSER_CACHE,
            'Netlify-CDN-Cache-Control': SITEMAP_CDN,
          },
        })
      },
    },
  },
})
