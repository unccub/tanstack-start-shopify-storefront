import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { z } from 'zod'
import { CATALOGUE_CDN, DEGRADED_HEADER } from '~/lib/cache'
import { cacheServerFn } from './cache.server'
import { fetchNavigation, fetchPage } from './content.server'
import type { Navigation } from './types'

// A store that cannot be reached should not take the whole page down with the navigation, but a page
// rendered without its navigation must not be kept by the CDN either.
export const getNavigation = createServerFn({ method: 'GET' }).handler(async (): Promise<Navigation> => {
  try {
    const navigation = await fetchNavigation()
    cacheServerFn(CATALOGUE_CDN)
    return navigation
  } catch {
    setResponseHeader(DEGRADED_HEADER, '1')
    return { header: [], footer: [] }
  }
})

export const getPage = createServerFn({ method: 'GET' })
  .validator(z.object({ handle: z.string().min(1).max(255) }))
  .handler(async ({ data }) => {
    const page = await fetchPage(data.handle)
    if (!page) throw notFound()
    cacheServerFn(CATALOGUE_CDN)
    return page
  })
