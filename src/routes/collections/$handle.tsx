import { Link, createFileRoute } from '@tanstack/react-router'
import { Breadcrumbs } from '~/components/catalogue/Breadcrumbs'
import { Pagination, paginationLinkClass } from '~/components/catalogue/Pagination'
import { ProductGrid } from '~/components/catalogue/ProductGrid'
import { SortFilterForm } from '~/components/catalogue/SortFilterForm'
import type { SortFilterValues } from '~/components/catalogue/SortFilterForm'
import { NotFound, RouteError } from '~/components/layout/StatusPage'
import { Prose } from '~/components/ui/Prose'
import { storefrontConfig } from '~/config'
import { collectionHeaders } from '~/lib/cache'
import { toFilterInputs, validateCollectionSearch } from '~/lib/search-params'
import { itemListJsonLd, seo, seoUnavailable } from '~/lib/seo'
import { getCollection } from '~/shopify/catalogue.functions'
import { collectionSortLabels, collectionSortValues } from '~/shopify/sort'
import page from '~/styles/page.module.css'

// Small enough that phones do not load a long grid, and the demo catalogue still shows paging.
const COLLECTION_PAGE_SIZE = 12

const sortOptions = collectionSortValues.map((value) => ({ value, label: collectionSortLabels[value] }))

const Collection = () => {
  const collection = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { pageInfo } = collection

  // A new sort or filter starts again from the first page.
  const handleChange = (values: SortFilterValues) => void navigate({ search: validateCollectionSearch(values), resetScroll: false })

  return (
    <div className={page.page}>
      <div className={page.header}>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Collections', href: '/collections' }, { label: collection.title }]} />
        <h1 className={page.title}>{collection.title}</h1>
        {collection.descriptionHtml ? <Prose html={collection.descriptionHtml} className={page.lede} /> : null}
      </div>
      <SortFilterForm
        sort={search.sort ?? 'featured'}
        sortOptions={sortOptions}
        filters={collection.filters}
        activeFilters={search.filter ?? []}
        priceMin={search.price_min}
        priceMax={search.price_max}
        onChange={handleChange}
      />
      {collection.products.length > 0 ? (
        <ProductGrid products={collection.products} headingLevel={2} eagerCount={2} priority />
      ) : (
        <p className={page.empty}>No products match. Try removing a filter.</p>
      )}
      <Pagination
        previous={
          pageInfo.hasPreviousPage && pageInfo.startCursor ? (
            <Link
              from={Route.fullPath}
              search={(current) => ({ ...current, after: undefined, before: pageInfo.startCursor ?? undefined })}
              rel="prev"
              className={paginationLinkClass}
            >
              Previous page
            </Link>
          ) : null
        }
        next={
          pageInfo.hasNextPage && pageInfo.endCursor ? (
            <Link
              from={Route.fullPath}
              search={(current) => ({ ...current, before: undefined, after: pageInfo.endCursor ?? undefined })}
              rel="next"
              className={paginationLinkClass}
            >
              Next page
            </Link>
          ) : null
        }
      />
    </div>
  )
}

export const Route = createFileRoute('/collections/$handle')({
  validateSearch: validateCollectionSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ params, deps }) =>
    getCollection({
      data: { handle: params.handle, sort: deps.sort, filters: toFilterInputs(deps), after: deps.after, before: deps.before, pageSize: COLLECTION_PAGE_SIZE },
    }),
  head: ({ loaderData, params }) =>
    loaderData
      ? seo({
          title: loaderData.seo.title ?? loaderData.title,
          description: loaderData.seo.description || loaderData.description || `Shop ${loaderData.title} at ${storefrontConfig.shopName}.`,
          // Sorted, filtered and later pages all point at the collection itself.
          path: `/collections/${params.handle}`,
          image: loaderData.image ?? loaderData.products[0]?.featuredImage,
          jsonLd: [itemListJsonLd(loaderData.title, loaderData.products)],
        })
      : seoUnavailable(),
  headers: collectionHeaders,
  component: Collection,
  notFoundComponent: NotFound,
  errorComponent: RouteError,
})
