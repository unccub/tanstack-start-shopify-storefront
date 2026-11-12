export const storefrontConfig = {
  // Empty means https://mock.shop/api. Set PUBLIC_STORE_DOMAIN to use a real store.
  storeDomain: (import.meta.env.PUBLIC_STORE_DOMAIN ?? '').trim(),
  apiVersion: '2026-10',
  country: 'US',
  language: 'EN',
  shopName: 'Storefront',
  shopDescription: 'A custom storefront on Shopify’s Storefront API, built with TanStack Start.',
  featuredCollectionHandle: 'featured',
} as const
