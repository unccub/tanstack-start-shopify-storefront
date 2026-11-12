import { useEffect, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { analytics } from '~/lib/analytics'
import { MAIN_ID } from './SkipLink'

// After a move to another page, focus goes to the main content and the new title is read out.
// Changes to search params alone (a variant, a sort, a page of results) leave focus where it is.
export const RouteAnnouncer = () => {
  const router = useRouter()
  const [title, setTitle] = useState('')

  useEffect(
    () =>
      router.subscribe('onResolved', ({ fromLocation, toLocation, pathChanged }) => {
        if (!fromLocation || !pathChanged) return
        analytics.pageView(toLocation.href)
        document.getElementById(MAIN_ID)?.focus({ preventScroll: true })
        // The document title is written just after the route resolves.
        setTimeout(() => setTitle(document.title), 100)
      }),
    [router],
  )

  return (
    <p role="status" className="visually-hidden">
      {title}
    </p>
  )
}
