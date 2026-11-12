# Caching

This is how the starter caches pages and data, and why. The policies live in two small files, so they are easy to change:

- `src/lib/cache.ts` holds every header value.
- `src/server.ts` is the server entry. It has the last word on each response.

The starter is set up for Netlify, which reads the `Netlify-CDN-Cache-Control` header. On another host, swap that header for the one your CDN reads (`CDN-Cache-Control` is the common standard).

## The short version

| What | Browser | CDN |
| --- | --- | --- |
| Home, collections list, collection, product, content pages | always revalidate | fresh for 60 seconds, then served stale for up to a day while a new copy is fetched |
| Search results page | always revalidate | not stored |
| Cart page and every cart request | `no-store` | not stored |
| Catalogue data fetched during client-side navigation | always revalidate | same as catalogue pages |
| Search suggestions | always revalidate | fresh for 60 seconds, stale for up to 10 minutes |
| `sitemap.xml`, child sitemaps, `robots.txt` | always revalidate | fresh for an hour, stale for up to a day |
| Not found pages (404) | always revalidate | 60 seconds |
| Server errors (5xx) | `no-store` | not stored |
| A page rendered while the navigation could not be loaded | `no-store` | not stored |
| Redirects | no CDN header | not stored |
| Files in `/assets` | a year, immutable | a year |

## Catalogue pages

```
Cache-Control: public, max-age=0, must-revalidate
Netlify-CDN-Cache-Control: public, durable, max-age=60, stale-while-revalidate=86400
```

I split the two audiences on purpose.

**Browsers never keep a page.** `max-age=0, must-revalidate` means a shopper's browser always asks the CDN. That keeps the browser from showing a price that is older than the CDN's copy, and it means a deploy reaches everyone at once.

**The CDN keeps a page for 60 seconds, then serves it stale while it fetches a new one.** For the first minute every visitor gets the stored page. After that, the next visitor still gets the stored page straight away, and the CDN renders a fresh one in the background for whoever comes next. Nobody waits for the Storefront API unless a page has not been visited for a whole day.

The cost is staleness. A price or stock change in Shopify shows up within about a minute on a busy page. On a quiet page, one visitor may see the old version before it refreshes. I think that is the right trade for a catalogue, because the cart and checkout always use live data: the cart is never cached, and Shopify's checkout has the final say on price and stock. If your catalogue changes by the minute, lower `STALE_SECONDS` in `src/lib/cache.ts`.

`durable` asks Netlify to share the stored page between its edge locations, so a page rendered for a visitor in London is not rendered again for one in Leeds.

A new deploy clears Netlify's cache, so a release never serves old HTML that points at old asset files.

### Why this is safe: nothing personal is in the HTML

A page can only be shared between visitors if it is the same for all of them. The catalogue pages are, because:

- The cart is not rendered on the server. The header's cart count and the drawer load in the browser after the page appears.
- Catalogue pages never read or set a cookie.

If you add anything personal to a catalogue page (a customer's name, a currency chosen per visitor), render it in the browser or stop caching that page.

### Which search params count

By default a CDN treats every different query string as a different page. That is wasteful when the param does not change the page, as with tracking params such as `utm_source`.

- **Collections** send `Netlify-Vary: query=sort|filter|price_min|price_max|after|before`. Only those params create a separate cache entry.
- **Products** do not send `Netlify-Vary`. Variant params are named after the product's options (`?Size=Medium&Color=Ocean`), so I cannot list them ahead of time. Every distinct query string is cached separately, which is correct, but a tracking param will create an extra entry. If your option names are fixed, add a `Netlify-Vary` list for products in `src/lib/cache.ts`.
- **Home, the collections list and content pages** take no params. I left the default, so a tracking param creates an extra entry there too.

## Search

The search results page is not stored on the CDN. Queries are open-ended, so almost every stored page would be used once. The browser revalidates as with any other page.

Search suggestions (the dropdown in the header) are stored for 60 seconds, because the first few letters of popular searches repeat often.

## Cart

Everything to do with the cart is `no-store`: the cart page and every cart server function. The cart id lives in an `httpOnly` cookie, and a response that depends on a cookie must never be shared.

## Data fetched during navigation

After the first page, moving around the site does not load full pages. The router calls server functions for the data, and those calls are `GET` requests to `/_serverFn/…` with the input in the query string. That makes them cacheable in the same way as pages.

A server function opts in by calling `cacheServerFn()` (`src/shopify/cache.server.ts`). It is opt-in on purpose: a new function is not cached until you decide it is public data. The helper does nothing when the function runs as part of rendering a page, because then the page's own headers apply.

## The safety net in `src/server.ts`

Routes ask for a policy, and the server entry checks the result before it leaves. Whatever a route asked for:

- A response that sets a cookie is never stored on the CDN.
- A server error is never stored.
- A redirect is never stored.
- A 404 that asked for catalogue caching is stored for 60 seconds only, so a product published a minute from now is not hidden behind a stored "not found".

When `PUBLIC_NOINDEX=true`, the same place adds `X-Robots-Tag: noindex, nofollow` to every response.

## Static files

Files under `/assets` have a hash of their content in the name, so `netlify.toml` gives them `max-age=31536000, immutable`.

## Images

Product images come straight from Shopify's CDN, which caches them itself. The starter only chooses the width.

## Clearing the cache by hand

There is no webhook wired up. To drop stored pages before they expire, trigger a new deploy, or add `Netlify-Cache-Tag` headers and call Netlify's purge API from a Shopify webhook. That is on the roadmap rather than in the starter.

## What I have not verified

I built and checked this locally against mock.shop. These points are untested until the site is deployed on Netlify:

- That Netlify stores a server-rendered TanStack Start page when the route sends `Netlify-CDN-Cache-Control`. The header is sent correctly; I have not seen a `Cache-Status: hit` from Netlify.
- That `Netlify-Vary: query=…` handles a repeated key such as `filter` the way I expect.
- That cached `/_serverFn/…` responses are served correctly to the router. They are plain `GET` requests with public cache headers, so they should be.
- How `durable` behaves on your Netlify plan.

After the first deploy, check a product URL twice with `curl -I` and look for `Cache-Status` showing a hit on the second request.

## Checking locally

`npm run build && npm start` serves the production build on plain Node with compression and no CDN in front, so every request renders from scratch. `curl -I http://localhost:3000/products/men-crewneck` shows the headers a CDN would act on.
