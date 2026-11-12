import { createFileRoute } from '@tanstack/react-router'
import { BROWSER_CACHE, NOT_FOUND_CDN, SITEMAP_CDN } from '~/lib/cache'
import { parseSitemapFile, renderSitemapFile } from '~/lib/sitemap'
import { fetchSitemapEntries } from '~/shopify/sitemap.server'

const notFound = () =>
  new Response('Not found', {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': BROWSER_CACHE, 'Netlify-CDN-Cache-Control': NOT_FOUND_CDN },
  })

// Child sitemaps, named like /sitemap/products-1.xml.
export const Route = createFileRoute('/sitemap/$file')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const file = parseSitemapFile(params.file)
        if (!file) return notFound()

        const xml = renderSitemapFile(file.type, file.page, await fetchSitemapEntries(file.type, file.page))
        if (!xml) return notFound()

        return new Response(xml, {
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
