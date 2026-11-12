import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { addCartLines, readCart, removeCartLines, updateCartDiscountCodes, updateCartLine } from './cart.server'

const MAX_QUANTITY = 999
const gid = z.string().min(1).max(500)

export const getCart = createServerFn({ method: 'GET' }).handler(() => readCart())

export const addToCart = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      lines: z
        .array(z.object({ merchandiseId: gid, quantity: z.number().int().min(1).max(MAX_QUANTITY).default(1) }))
        .min(1)
        .max(50),
    }),
  )
  .handler(({ data }) => addCartLines(data.lines))

// A quantity of 0 removes the line.
export const updateCartLineQuantity = createServerFn({ method: 'POST' })
  .validator(z.object({ lineId: gid, quantity: z.number().int().min(0).max(MAX_QUANTITY) }))
  .handler(({ data }) => updateCartLine(data.lineId, data.quantity))

export const removeFromCart = createServerFn({ method: 'POST' })
  .validator(z.object({ lineIds: z.array(gid).min(1).max(100) }))
  .handler(({ data }) => removeCartLines(data.lineIds))

// Pass an empty list to clear every code.
export const applyDiscountCodes = createServerFn({ method: 'POST' })
  .validator(z.object({ discountCodes: z.array(z.string().trim().min(1).max(100)).max(10) }))
  .handler(({ data }) => updateCartDiscountCodes(data.discountCodes))
