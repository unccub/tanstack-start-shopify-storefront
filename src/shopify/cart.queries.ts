import { queryOptions } from '@tanstack/react-query'
import { getCart } from './cart.functions'

export const cartQueryKey = ['cart'] as const

export const cartQueryOptions = queryOptions({
  queryKey: cartQueryKey,
  queryFn: () => getCart(),
  staleTime: 30_000,
})
