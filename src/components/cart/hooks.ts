import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addToCart,
  applyDiscountCodes,
  removeFromCart,
  updateCartLineQuantity,
} from '~/shopify/cart.functions'
import { usePageSettled } from '~/lib/use-page-settled'
import { cartQueryOptions } from '~/shopify/cart.queries'
import type { Cart, CartLine, CartResult, MoneyData } from '~/shopify/types'
import { setCartMessages } from './store'

// The tagged key gives getQueryData and setQueryData the cart type.
const cartQueryKey = cartQueryOptions.queryKey
const cartMutationKey = ['cart-mutation'] as const
const addMutationKey = [...cartMutationKey, 'add'] as const

const FAILURE_MESSAGE = 'Your cart could not be updated, so nothing has changed. Please try again.'

const toMoney = (like: MoneyData, amount: number): MoneyData => ({ ...like, amount: Math.max(0, amount).toFixed(2) })

const sum = (values: ReadonlyArray<MoneyData>) => values.reduce((total, money) => total + Number(money.amount), 0)

const withLines = (cart: Cart, lines: Array<CartLine>): Cart => {
  const subtotal = sum(lines.map((line) => line.subtotal))
  const difference = subtotal - Number(cart.subtotal.amount)
  return {
    ...cart,
    lines,
    totalQuantity: lines.reduce((total, line) => total + line.quantity, 0),
    subtotal: toMoney(cart.subtotal, subtotal),
    total: toMoney(cart.total, Number(cart.total.amount) + difference),
  }
}

const withQuantity = (line: CartLine, quantity: number): CartLine => {
  const amount = Number(line.unitPrice.amount) * quantity
  return { ...line, quantity, subtotal: toMoney(line.subtotal, amount), total: toMoney(line.total, amount) }
}

const setLineQuantity = (cart: Cart, lineId: string, quantity: number) =>
  withLines(
    cart,
    cart.lines.flatMap((line) => {
      if (line.id !== lineId) return [line]
      return quantity > 0 ? [withQuantity(line, quantity)] : []
    }),
  )

type Optimistic<TInput> = (cart: Cart, input: TInput) => Cart

const useCartMutation = <TInput>(
  mutationKey: ReadonlyArray<string>,
  mutationFn: (input: TInput) => Promise<CartResult>,
  optimistic?: Optimistic<TInput>,
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey,
    // One scope runs cart mutations one at a time, in the order they were made.
    scope: { id: 'cart' },
    mutationFn,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: cartQueryKey })
      const previous = queryClient.getQueryData(cartQueryKey)
      if (previous && optimistic) queryClient.setQueryData(cartQueryKey, optimistic(previous, input))
      return { previous }
    },
    onError: (_error, _input, context) => {
      if (context?.previous !== undefined) queryClient.setQueryData(cartQueryKey, context.previous)
      setCartMessages([FAILURE_MESSAGE])
      void queryClient.invalidateQueries({ queryKey: cartQueryKey })
    },
    onSuccess: (result) => {
      // While later changes are queued, their optimistic state is newer than this response.
      if (queryClient.isMutating({ mutationKey: cartMutationKey }) <= 1) {
        queryClient.setQueryData(cartQueryKey, result.cart)
      }
      setCartMessages(result.messages)
    },
  })
}

// The cart is not needed for the first paint, so its request waits until the page has loaded.
export const useCart = () => useQuery({ ...cartQueryOptions, enabled: usePageSettled() })

export const useCartCount = () =>
  useQuery({ ...cartQueryOptions, enabled: usePageSettled(), select: (cart) => cart?.totalQuantity ?? 0 }).data ?? 0

type AddInput = { variantId: string; quantity?: number }

export const useAddToCart = () =>
  useCartMutation<AddInput>(
    addMutationKey,
    ({ variantId, quantity = 1 }) => addToCart({ data: { lines: [{ merchandiseId: variantId, quantity }] } }),
    // A line that is not in the cart yet is shown as pending instead of being invented.
    (cart, { variantId, quantity = 1 }) => {
      const line = cart.lines.find((candidate) => candidate.variantId === variantId)
      return line ? setLineQuantity(cart, line.id, line.quantity + quantity) : cart
    },
  )

export const useIsAddingToCart = () => useIsMutating({ mutationKey: addMutationKey }) > 0

export const useUpdateCartLine = () =>
  useCartMutation<{ lineId: string; quantity: number }>(
    [...cartMutationKey, 'update'],
    (input) => updateCartLineQuantity({ data: input }),
    (cart, { lineId, quantity }) => setLineQuantity(cart, lineId, quantity),
  )

export const useRemoveCartLine = () =>
  useCartMutation<{ lineId: string }>(
    [...cartMutationKey, 'remove'],
    ({ lineId }) => removeFromCart({ data: { lineIds: [lineId] } }),
    (cart, { lineId }) => setLineQuantity(cart, lineId, 0),
  )

export const useDiscountCodes = () =>
  useCartMutation<{ discountCodes: Array<string> }>([...cartMutationKey, 'discount'], (input) =>
    applyDiscountCodes({ data: input }),
  )

export const MAX_LINE_QUANTITY = 999

// Reads the quantity from the cache at click time, so quick clicks each count.
export const useStepCartLine = () => {
  const queryClient = useQueryClient()
  const update = useUpdateCartLine()

  return (lineId: string, delta: number) => {
    const line = queryClient.getQueryData(cartQueryKey)?.lines.find((candidate) => candidate.id === lineId)
    if (!line) return
    const quantity = Math.min(MAX_LINE_QUANTITY, Math.max(0, line.quantity + delta))
    if (quantity !== line.quantity) update.mutate({ lineId, quantity })
  }
}
