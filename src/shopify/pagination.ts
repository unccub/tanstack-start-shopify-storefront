import { z } from 'zod'
import { StorefrontApiError } from './errors'
import { PAGE_SIZE } from './sort'

export const cursorSchema = z.object({
  after: z.string().max(2000).optional(),
  before: z.string().max(2000).optional(),
})

export type Cursor = z.infer<typeof cursorSchema>

export const toConnectionArgs = ({ after, before }: Cursor, pageSize: number = PAGE_SIZE) =>
  before && !after
    ? { first: null, after: null, last: pageSize, before }
    : { first: pageSize, after: after ?? null, last: null, before: null }

// Cursors live on in bookmarks and crawler indexes after they stop working. A rejected one falls back to the first page.
export const withCursorFallback = async <TResult>(cursor: Cursor, run: (cursor: Cursor) => Promise<TResult>) => {
  if (!cursor.after && !cursor.before) return run(cursor)
  try {
    return await run(cursor)
  } catch (error) {
    if (!(error instanceof StorefrontApiError) || error.graphqlErrors.length === 0) throw error
    return run({})
  }
}
