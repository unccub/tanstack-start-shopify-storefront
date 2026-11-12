import { useEffect, useState } from 'react'

let settled = false

const whenIdle = (run: () => void) => {
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 2000 })
  else setTimeout(run, 200)
}

// True once the page has loaded and the browser is idle. Requests the first paint does not need, such as
// the cart count, wait for it so they never compete with the main image. Later navigations start settled.
export const usePageSettled = () => {
  const [ready, setReady] = useState(settled)

  useEffect(() => {
    if (settled) return setReady(true)
    const finish = () =>
      whenIdle(() => {
        settled = true
        setReady(true)
      })
    if (document.readyState === 'complete') return finish()
    window.addEventListener('load', finish, { once: true })
    return () => window.removeEventListener('load', finish)
  }, [])

  return ready
}
