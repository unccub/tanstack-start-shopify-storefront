type AddToCartEvent = { variantId: string; quantity: number }

// Hook points for analytics. They do nothing until you fill them in: call your vendor from here,
// and keep its script out of the first paint.
export const analytics = {
  pageView: (_path: string) => {},
  addToCart: (_event: AddToCartEvent) => {},
}
