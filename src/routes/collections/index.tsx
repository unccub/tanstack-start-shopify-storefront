import { createFileRoute } from '@tanstack/react-router'
import { Breadcrumbs } from '~/components/catalogue/Breadcrumbs'
import { CollectionCard } from '~/components/catalogue/CollectionCard'
import { GRID_SIZES } from '~/components/catalogue/ProductGrid'
import { NotFound, RouteError } from '~/components/layout/StatusPage'
import { storefrontConfig } from '~/config'
import { catalogueHeaders } from '~/lib/cache'
import { seo } from '~/lib/seo'
import { getCollections } from '~/shopify/catalogue.functions'
import page from '~/styles/page.module.css'
import grid from '~/components/catalogue/ProductGrid.module.css'

const Collections = () => {
  const collections = Route.useLoaderData()

  return (
    <div className={page.page}>
      <div className={page.header}>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Collections' }]} />
        <h1 className={page.title}>Collections</h1>
      </div>
      {collections.length > 0 ? (
        <ul role="list" className={grid.grid}>
          {collections.map((collection, index) => (
            <li key={collection.id}>
              <CollectionCard collection={collection} sizes={GRID_SIZES} priority={index === 0} eager={index < 2} />
            </li>
          ))}
        </ul>
      ) : (
        <p className={page.empty}>This store has no collections yet.</p>
      )}
    </div>
  )
}

export const Route = createFileRoute('/collections/')({
  loader: () => getCollections(),
  head: ({ loaderData }) =>
    seo({
      title: 'Collections',
      description: `Browse every collection at ${storefrontConfig.shopName}.`,
      path: '/collections',
      image: loaderData?.find((collection) => collection.image)?.image,
    }),
  headers: catalogueHeaders,
  component: Collections,
  notFoundComponent: NotFound,
  errorComponent: RouteError,
})
