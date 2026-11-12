# Moving from mock.shop to a real store

Out of the box the starter talks to mock.shop. This is how I would point it at a real Shopify store, and what to test once it is connected, because mock.shop cannot prove everything.

## 1. Point it at your store

Copy `.env.example` to `.env` and set the domain. Use the `myshopify.com` domain; `https://` and a trailing slash are stripped if you include them.

```bash
PUBLIC_STORE_DOMAIN=your-store.myshopify.com
```

Restart `npm run dev`. Requests now go to `https://your-store.myshopify.com/api/2026-10/graphql.json`.

That is enough for tokenless access, which covers products, collections, search, pages and the cart. Your products must be available to the sales channel the Storefront API reads from. If the shop comes up empty, check product availability in the Shopify admin first, and Shopify's [Storefront API documentation](https://shopify.dev/docs/api/storefront) for what your store needs enabled.

## 2. Decide whether you need a token

| | Tokenless | Private token |
| --- | --- | --- |
| Products, collections, search, pages, cart | Yes | Yes |
| Navigation | Built from your collections: the first six by title, plus "All collections" | Your store's `main-menu` and `footer` menus |
| Query complexity limit | 1,000 per query | Not subject to the tokenless limit |
| Setup | None | Create a token in Shopify |

Start tokenless. Add a token when you want the store's own menus, or later for metafields and metaobjects, which the starter does not read yet.

To create one, install Shopify's Headless channel in your store's admin, create a storefront there and copy its **private** access token. Shopify moves these screens around from time to time, so follow their documentation if the labels differ. Then:

```bash
PRIVATE_STOREFRONT_API_TOKEN=your-private-token
```

The token is read on the server only (`src/shopify/env.server.ts`) and sent as `Shopify-Storefront-Private-Token`. Do not use the public token here, and never give this variable a `PUBLIC_` prefix. The `.gitignore` already keeps `.env` out of the repository.

With a token set, each request made for a shopper also sends their IP address in `Shopify-Storefront-Buyer-IP`, which Shopify asks for so it can tell real traffic from abuse. Sitemap requests leave it out.

## 3. Env variables, locally and on Netlify

Locally, `npm run dev` reads `.env`. `npm start`, the plain Node server for the production build, does not read `.env`; export the variables in your shell if you need the token there.

On Netlify, add the same variables under the site's environment variables, then trigger a deploy.

- `PUBLIC_STORE_DOMAIN`, `PUBLIC_NOINDEX` and `PUBLIC_SITE_URL` are fixed at build time. Changing them needs a new deploy.
- `PRIVATE_STOREFRONT_API_TOKEN` is read at request time by the server.

Two more to set deliberately:

- **`PUBLIC_SITE_URL`** is the address used in canonical URLs, Open Graph tags, `robots.txt` and the sitemap. On Netlify it falls back to the site's main URL. Set it yourself if the storefront is served from a different domain than the one Netlify reports, with no trailing slash, for example `https://shop.example.com`.
- **`PUBLIC_NOINDEX=true`** adds a `noindex` meta tag and an `X-Robots-Tag` header to every page and makes `robots.txt` disallow everything. Use it on demos, previews and staging. Leave it empty on the real site.

## 4. Settings in `storefront.config.ts`

```ts
export const storefrontConfig = {
  storeDomain: (import.meta.env.PUBLIC_STORE_DOMAIN ?? '').trim(),
  apiVersion: '2026-10',
  country: 'US',
  language: 'EN',
  shopName: 'Storefront',
  shopDescription: '…',
  featuredCollectionHandle: 'featured',
} as const
```

- **`country` and `language`** go into every query through `@inContext`, so prices, currency and translations come back for that market. They also set the page's `lang` attribute and the locale used to format money. Use Shopify's codes, for example `GB` and `EN`.
- **`shopName` and `shopDescription`** appear in the header, titles, the home page and structured data.
- **`featuredCollectionHandle`** is the collection shown on the home page. If the handle does not exist, the home page leaves that section out.

## 5. When you change the API version

The version is pinned in two places. Change both together:

1. `apiVersion` in `storefront.config.ts`.
2. The schema URL in the `codegen` script in `package.json`.

Then regenerate the types and check every query against the new schema:

```bash
npm run codegen
npm run codegen:check
npm run typecheck
```

Commit the updated `schema.graphql` and `src/graphql-env.d.ts`. Builds do not download the schema, so they keep working without network access to Shopify.

## 6. What to test on the real store

mock.shop accepts some things silently and cannot exercise others. I built these parts to Shopify's schema but have not seen them run against a real store, so check each one:

- **Filters.** Open a collection that has filters set up in Shopify's Search & Discovery app. The filter form should appear above the grid. Tick a value, set a price range, combine two, clear them, and page through filtered results.
- **Discount codes.** On the cart page, apply a code that should work and one that should not. The first should change the total; the second should show Shopify's message.
- **Sale prices.** A product with a compare-at price should show both prices on its card and its page.
- **Markets.** Set `country` to a market you sell in and confirm the currency and prices change. Set one you do not sell in and see what Shopify returns.
- **Menus.** With a token, check the header and footer against your `main-menu` and `footer` menus. Links to blogs, policies and external sites are left out on purpose, because the storefront has no routes for them.
- **Complexity limit.** Without a token, set `STOREFRONT_LOG_COST=1` and browse. Every logged cost should be under 1,000. If you add fields to a query, watch that number.
- **Checkout handover.** Add products, press checkout and confirm Shopify's checkout opens with the same lines, variants and quantities.
- **Stock.** Add more than is in stock and check the message; open a sold-out variant and check it cannot be added.
- **Content pages.** Open `/pages/your-handle` for a page with real content, including headings, links, lists and images. The HTML is passed through an allowlist, so anything unusual, such as embedded video, is removed.
- **Sitemap.** Open `/sitemap.xml` and one of the files it lists. It is built from Shopify's `sitemap` query, which I have only seen answer on mock.shop.

## 7. Before you go live

- Run `npm run test:e2e` with `PUBLIC_STORE_DOMAIN` unset. The test builds the site itself and looks for mock.shop's products by handle, so it fails against your own catalogue.
- Run `npm run lighthouse -- --runs 3`. The script checks mock.shop's handles too, so edit the `pages` list in `scripts/lighthouse.mjs` to use your own collection and product.
- Deploy with `PUBLIC_NOINDEX=true` first, check the site, then clear it and redeploy.
- After the first deploy, follow the checks at the end of [caching.md](caching.md).
