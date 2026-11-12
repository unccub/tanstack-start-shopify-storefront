import type { ReactNode } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import { CartDrawer } from '~/components/cart/CartDrawer'
import { CartTrigger } from '~/components/cart/CartTrigger'
import { Footer } from '~/components/layout/Footer'
import { Header } from '~/components/layout/Header'
import { RouteAnnouncer } from '~/components/layout/RouteAnnouncer'
import { MAIN_ID, SkipLink } from '~/components/layout/SkipLink'
import { NotFound } from '~/components/layout/StatusPage'
import { HeaderSearch } from '~/components/search/HeaderSearch'
import { htmlLang, noindex, storefrontConfig } from '~/config'
import { getNavigation } from '~/shopify/content.functions'
import type { Navigation } from '~/shopify/types'
import '~/styles/global.css'

export type RouterContext = {
  queryClient: QueryClient
}

const emptyNavigation: Navigation = { header: [], footer: [] }

const RootDocument = ({ children }: Readonly<{ children: ReactNode }>) => {
  // The shell also renders around errors, when there is no loader data.
  const navigation = Route.useMatch({ select: (match) => match.loaderData }) ?? emptyNavigation

  return (
    <html lang={htmlLang}>
      <head>
        <HeadContent />
      </head>
      <body>
        <SkipLink />
        <Header shopName={storefrontConfig.shopName} links={navigation.header} search={<HeaderSearch />} cart={<CartTrigger />} />
        <main id={MAIN_ID} tabIndex={-1}>
          {children}
        </main>
        <Footer shopName={storefrontConfig.shopName} links={navigation.footer} />
        <CartDrawer />
        <RouteAnnouncer />
        <Scripts />
      </body>
    </html>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({
  loader: async (): Promise<Navigation> => getNavigation().catch(() => emptyNavigation),
  staleTime: Infinity,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'color-scheme', content: 'light dark' },
      { title: storefrontConfig.shopName },
      { name: 'description', content: storefrontConfig.shopDescription },
      { property: 'og:site_name', content: storefrontConfig.shopName },
      ...(noindex ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),
    ],
    links: [
      { rel: 'preconnect', href: 'https://cdn.shopify.com' },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
  }),
  shellComponent: RootDocument,
  component: Outlet,
  notFoundComponent: NotFound,
})
