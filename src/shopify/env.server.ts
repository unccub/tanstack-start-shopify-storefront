// Server only. The `.server` suffix keeps this module out of the client bundle.
export const getPrivateStorefrontToken = () => {
  const token = process.env.PRIVATE_STOREFRONT_API_TOKEN?.trim()
  return token ? token : undefined
}
