import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { CATALOGUE_CDN } from '~/lib/cache'
import { cacheServerFn } from './cache.server'
import { fetchCollection, fetchCollections, fetchProducts } from './catalogue.server'
import { parseProductFilters } from './filters'
import { cursorSchema } from './pagination'
import { collectionSortValues } from './sort'

const handle = z.string().min(1).max(255)

export const getProducts = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      first: z.number().int().min(1).max(48).default(12),
      after: z.string().max(2000).optional(),
      sort: z.enum(['best-selling', 'newest', 'title']).default('best-selling'),
    }),
  )
  .handler(({ data }) => {
    cacheServerFn(CATALOGUE_CDN)
    return fetchProducts(data)
  })

export const getCollections = createServerFn({ method: 'GET' }).handler(() => {
  cacheServerFn(CATALOGUE_CDN)
  return fetchCollections()
})

export const getCollection = createServerFn({ method: 'GET' })
  .validator(
    cursorSchema.extend({
      handle,
      sort: z.enum(collectionSortValues).default('featured'),
      // Each entry is a FilterValue.input JSON string from a previous response.
      filters: z.array(z.string().max(1000)).max(30).default([]),
      pageSize: z.number().int().min(1).max(48).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const collection = await fetchCollection({ ...data, filters: parseProductFilters(data.filters) })
    if (!collection) throw notFound()
    cacheServerFn(CATALOGUE_CDN)
    return collection
  })
