# Contributing

Thanks for taking the time. Bug reports, fixes and small improvements are all welcome. For anything larger, or anything on the roadmap in the README, please open an issue first so we can agree the shape before you write it.

## Setup

You need Node 22.12 or newer.

```bash
npm install
npm run dev
```

With no env file the storefront runs against mock.shop, which is all you need for most changes.

## Checks to run before a pull request

```bash
npm run typecheck
npm run codegen:check
npm run test:e2e
```

The first time, install the test browser with `npx playwright install chromium`.

If your change could affect loading or accessibility, also run `npm run lighthouse -- --runs 3` and mention the scores in the pull request.

CI runs the type check, the GraphQL check and the smoke test on every push.

## The tests depend on mock.shop

The smoke test runs the production build against mock.shop and uses its products by handle (`men-crewneck`, the `men` collection). It needs network access, and it will fail if `PUBLIC_STORE_DOMAIN` is set when it builds. If mock.shop is down or changes its catalogue, the test fails through no fault of your change; say so in the pull request.

## Conventions

- **Arrow functions only.** `const foo = () => {}` for components, helpers and handlers. No `function` declarations.
- **All Shopify access stays in `src/shopify/`.** Components and page routes import its `*.functions.ts`, types and helpers, never a `*.server.ts` file. The one exception is a server-only route, such as the sitemap, which may call a `*.server.ts` module from inside its `server.handlers`.
- **CSS Modules with tokens only.** Colours, spacing, radii and type sizes come from `src/styles/tokens.css`. If a value is missing, add a token; do not put a raw colour in a module.
- **No new runtime dependencies without discussion.** The starter's value is partly in how little it ships. Development tooling is easier to say yes to.
- **Animate `transform` and `opacity` only**, and respect `prefers-reduced-motion`.
- **Comments are rare and short.** One line, for a reason the code cannot show.
- **UK English** in docs and interface text. Say "colour scheme" for light and dark, and "storefront" for the product.
- After changing a GraphQL document, run `npm run codegen:check`. After changing the API version, follow `docs/moving-to-a-real-store.md`.

## Reporting a security problem

Please do not open a public issue for a security problem. Use GitHub's private vulnerability reporting on this repository.
