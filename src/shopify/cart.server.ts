import { deleteCookie, getCookie, getRequest, setCookie, setResponseHeader } from '@tanstack/react-start/server'
import { inContext, storefront } from './client.server'
import type { StorefrontUserError } from './errors'
import { cartFragment } from './fragments'
import type { CartData } from './fragments'
import { graphql } from './graphql'
import type { Cart, CartLine, CartResult } from './types'

const CART_COOKIE = 'cart'
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30
const EXPIRED_MESSAGE = 'Your cart had expired, so it has been emptied.'

const isHttps = () => {
  const request = getRequest()
  return (request.headers.get('x-forwarded-proto') ?? new URL(request.url).protocol).startsWith('https')
}

// Secure follows the request, because some browsers drop a Secure cookie on plain http, localhost included.
const cookieOptions = () => ({ httpOnly: true, sameSite: 'lax', path: '/', secure: isHttps() }) as const

const cartQuery = graphql(
  `
    query Cart($id: ID!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
      cart(id: $id) {
        ...Cart
      }
    }
  `,
  [cartFragment],
)

const cartCreateMutation = graphql(
  `
    mutation CartCreate($input: CartInput!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
      cartCreate(input: $input) {
        cart {
          ...Cart
        }
        userErrors {
          field
          message
          code
        }
        warnings {
          code
          message
        }
      }
    }
  `,
  [cartFragment],
)

const cartLinesAddMutation = graphql(
  `
    mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          ...Cart
        }
        userErrors {
          field
          message
          code
        }
        warnings {
          code
          message
        }
      }
    }
  `,
  [cartFragment],
)

const cartLinesUpdateMutation = graphql(
  `
    mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          ...Cart
        }
        userErrors {
          field
          message
          code
        }
        warnings {
          code
          message
        }
      }
    }
  `,
  [cartFragment],
)

const cartLinesRemoveMutation = graphql(
  `
    mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          ...Cart
        }
        userErrors {
          field
          message
          code
        }
        warnings {
          code
          message
        }
      }
    }
  `,
  [cartFragment],
)

const cartDiscountCodesUpdateMutation = graphql(
  `
    mutation CartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
      cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
        cart {
          ...Cart
        }
        userErrors {
          field
          message
          code
        }
        warnings {
          code
          message
        }
      }
    }
  `,
  [cartFragment],
)

type MutationPayload = {
  cart: CartData | null
  userErrors: Array<StorefrontUserError>
  warnings: Array<{ code: string; message: string }>
}

type LineInput = { merchandiseId: string; quantity: number }

const normaliseLine = (line: CartData['lines']['nodes'][number]): Array<CartLine> => {
  const variant = line.merchandise
  if (variant.__typename !== 'ProductVariant') return []
  return [
    {
      id: line.id,
      quantity: line.quantity,
      variantId: variant.id,
      variantTitle: variant.title,
      productHandle: variant.product.handle,
      productTitle: variant.product.title,
      selectedOptions: variant.selectedOptions,
      image: variant.image,
      availableForSale: variant.availableForSale,
      unitPrice: line.cost.amountPerQuantity,
      compareAtUnitPrice: line.cost.compareAtAmountPerQuantity,
      subtotal: line.cost.subtotalAmount,
      total: line.cost.totalAmount,
    },
  ]
}

const normaliseCart = (cart: CartData): Cart => ({
  checkoutUrl: cart.checkoutUrl,
  totalQuantity: cart.totalQuantity,
  subtotal: cart.cost.subtotalAmount,
  total: cart.cost.totalAmount,
  discountCodes: cart.discountCodes,
  lines: cart.lines.nodes.flatMap(normaliseLine),
})

const neverCache = () => setResponseHeader('Cache-Control', 'no-store')

const forgetCart = () => deleteCookie(CART_COOKIE, cookieOptions())

const isMissingCart = ({ cart, userErrors }: MutationPayload) =>
  !cart && userErrors.some((error) => error.field?.includes('cartId') || /cart does not exist/i.test(error.message))

const toResult = (payload: MutationPayload | null | undefined): CartResult => {
  if (!payload) return { cart: null, messages: ['The cart could not be updated. Please try again.'] }
  if (payload.cart) setCookie(CART_COOKIE, payload.cart.id, { ...cookieOptions(), maxAge: CART_COOKIE_MAX_AGE })
  return {
    cart: payload.cart ? normaliseCart(payload.cart) : null,
    messages: [...payload.userErrors, ...payload.warnings].map((entry) => entry.message),
  }
}

const createCart = async (input: { lines?: Array<LineInput>; discountCodes?: Array<string> }) => {
  const data = await storefront(cartCreateMutation, { input, ...inContext })
  return data.cartCreate
}

export const readCart = async (): Promise<Cart | null> => {
  neverCache()
  const id = getCookie(CART_COOKIE)
  if (!id) return null

  const { cart } = await storefront(cartQuery, { id, ...inContext })
  if (!cart) {
    forgetCart()
    return null
  }
  return normaliseCart(cart)
}

export const addCartLines = async (lines: Array<LineInput>): Promise<CartResult> => {
  neverCache()
  const cartId = getCookie(CART_COOKIE)
  if (!cartId) return toResult(await createCart({ lines }))

  const { cartLinesAdd } = await storefront(cartLinesAddMutation, { cartId, lines, ...inContext })
  // The cookie pointed at a cart Shopify no longer has: start a new one with the same lines.
  if (cartLinesAdd && isMissingCart(cartLinesAdd)) return toResult(await createCart({ lines }))
  return toResult(cartLinesAdd)
}

const expired = (): CartResult => {
  forgetCart()
  return { cart: null, messages: [EXPIRED_MESSAGE] }
}

export const updateCartLine = async (lineId: string, quantity: number): Promise<CartResult> => {
  neverCache()
  const cartId = getCookie(CART_COOKIE)
  if (!cartId) return { cart: null, messages: [] }

  const { cartLinesUpdate } = await storefront(cartLinesUpdateMutation, { cartId, lines: [{ id: lineId, quantity }], ...inContext })
  // Line ids die with their cart, so there is nothing to retry.
  if (cartLinesUpdate && isMissingCart(cartLinesUpdate)) return expired()
  return toResult(cartLinesUpdate)
}

export const removeCartLines = async (lineIds: Array<string>): Promise<CartResult> => {
  neverCache()
  const cartId = getCookie(CART_COOKIE)
  if (!cartId) return { cart: null, messages: [] }

  const { cartLinesRemove } = await storefront(cartLinesRemoveMutation, { cartId, lineIds, ...inContext })
  if (cartLinesRemove && isMissingCart(cartLinesRemove)) return expired()
  return toResult(cartLinesRemove)
}

export const updateCartDiscountCodes = async (discountCodes: Array<string>): Promise<CartResult> => {
  neverCache()
  const cartId = getCookie(CART_COOKIE)
  const update = async () => {
    if (!cartId) return createCart({ discountCodes })
    const { cartDiscountCodesUpdate } = await storefront(cartDiscountCodesUpdateMutation, { cartId, discountCodes, ...inContext })
    return cartDiscountCodesUpdate && isMissingCart(cartDiscountCodesUpdate) ? createCart({ discountCodes }) : cartDiscountCodesUpdate
  }

  const result = toResult(await update())
  const rejected = result.cart?.discountCodes.filter((entry) => !entry.applicable) ?? []
  if (rejected.length > 0 && result.messages.length === 0) {
    result.messages.push(...rejected.map((entry) => `The code ${entry.code} cannot be applied to this cart.`))
  }
  return result
}
