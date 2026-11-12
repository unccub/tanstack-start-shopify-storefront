import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { NotFound, RouteError } from '~/components/layout/StatusPage'
import { parseSearch, stringifySearch } from '~/lib/search-params'
import { routeTree } from './routeTree.gen'

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
  })

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    parseSearch,
    stringifySearch,
    defaultPreload: 'intent',
    defaultNotFoundComponent: NotFound,
    defaultErrorComponent: RouteError,
  })

  // Dehydrates the cache on the server, hydrates it in the browser and wraps the app in the provider.
  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
