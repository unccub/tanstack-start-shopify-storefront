import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { CATALOGUE_CDN } from '~/lib/cache'
import { cacheServerFn } from './cache.server'
import { fetchProduct, fetchProductRecommendations } from './product.server'

const handle = z.string().min(1).max(255)

export const getProduct = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      handle,
      selectedOptions: z
        .array(z.object({ name: z.string().min(1).max(255), value: z.string().min(1).max(255) }))
        .max(10)
        .default([]),
    }),
  )
  .handler(async ({ data }) => {
    const product = await fetchProduct(data)
    if (!product) throw notFound()
    cacheServerFn(CATALOGUE_CDN)
    return product
  })

export const getProductRecommendations = createServerFn({ method: 'GET' })
  .validator(z.object({ handle }))
  .handler(({ data }) => {
    cacheServerFn(CATALOGUE_CDN)
    return fetchProductRecommendations(data.handle)
  })
