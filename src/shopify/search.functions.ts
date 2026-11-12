import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { SUGGESTIONS_CDN } from '~/lib/cache'
import { cacheServerFn } from './cache.server'
import { parseProductFilters } from './filters'
import { cursorSchema } from './pagination'
import { fetchPredictiveSearch, fetchSearch } from './search.server'
import { searchSortValues } from './sort'

const query = z.string().max(200)

export const searchProducts = createServerFn({ method: 'GET' })
  .validator(
    cursorSchema.extend({
      query,
      sort: z.enum(searchSortValues).default('relevance'),
      filters: z.array(z.string().max(1000)).max(30).default([]),
    }),
  )
  .handler(({ data }) => fetchSearch({ ...data, filters: parseProductFilters(data.filters) }))

export const predictiveSearch = createServerFn({ method: 'GET' })
  .validator(z.object({ query, limit: z.number().int().min(1).max(10).default(5) }))
  .handler(({ data }) => {
    cacheServerFn(SUGGESTIONS_CDN)
    return fetchPredictiveSearch(data.query, data.limit)
  })
