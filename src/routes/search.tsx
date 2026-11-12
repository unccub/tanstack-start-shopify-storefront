import { Link, createFileRoute } from '@tanstack/react-router'
import { Pagination, paginationLinkClass } from '~/components/catalogue/Pagination'
import { ProductGrid } from '~/components/catalogue/ProductGrid'
import { NotFound, RouteError } from '~/components/layout/StatusPage'
import { SearchCombobox } from '~/components/search/SearchCombobox'
import { storefrontConfig } from '~/config'
import { searchHeaders } from '~/lib/cache'
import { validateSearchPageSearch } from '~/lib/search-params'
import { seo } from '~/lib/seo'
import { useSyncedState } from '~/lib/use-synced-state'
import { searchProducts } from '~/shopify/search.functions'
import { searchSortLabels, searchSortValues } from '~/shopify/sort'
import controls from '~/styles/controls.module.css'
import page from '~/styles/page.module.css'
import styles from './search.module.css'

const Search = () => {
  const results = Route.useLoaderData()
  const { q = '', sort = 'relevance' } = Route.useSearch()
  const navigate = Route.useNavigate()
  const [sortValue, setSortValue] = useSyncedState<string>(sort)

  return (
    <div className={page.page}>
      <div className={page.header}>
        <h1 className={page.title}>{q ? `Results for “${q}”` : 'Search'}</h1>
        {results ? (
          <p className={page.lede} role="status">
            {results.totalCount} {results.totalCount === 1 ? 'product' : 'products'} found
          </p>
        ) : (
          <p className={page.lede}>Search the catalogue by product name.</p>
        )}
      </div>

      <div className={styles.controls}>
        <SearchCombobox label="Search the catalogue" defaultValue={q} className={styles.box} />
        {results && results.products.length > 0 ? (
          <form method="get" className={styles.sort}>
            <input type="hidden" name="q" value={q} />
            <label className={styles.sortLabel}>
              <span className={controls.label}>Sort by</span>
              <select
                className={controls.select}
                name="sort"
                value={sortValue}
                onChange={(event) => {
                  setSortValue(event.target.value)
                  const next = searchSortValues.find((value) => value === event.target.value)
                  void navigate({ search: { q, sort: next === 'relevance' ? undefined : next }, resetScroll: false })
                }}
              >
                {searchSortValues.map((value) => (
                  <option key={value} value={value}>
                    {searchSortLabels[value]}
                  </option>
                ))}
              </select>
            </label>
            <noscript>
              <button type="submit" className={controls.buttonSecondary}>
                Apply
              </button>
            </noscript>
          </form>
        ) : null}
      </div>

      {results && results.products.length > 0 ? (
        <ProductGrid products={results.products} headingLevel={2} eagerCount={2} priority />
      ) : null}
      {results && results.products.length === 0 ? (
        <p className={page.empty}>
          Nothing matched “{q}”. Check the spelling, try a shorter word, or <Link to="/collections">browse the collections</Link>.
        </p>
      ) : null}

      {results ? (
        <Pagination
          previous={
            results.pageInfo.hasPreviousPage && results.pageInfo.startCursor ? (
              <Link
                from={Route.fullPath}
                search={(current) => ({ ...current, after: undefined, before: results.pageInfo.startCursor ?? undefined })}
                rel="prev"
                className={paginationLinkClass}
              >
                Previous page
              </Link>
            ) : null
          }
          next={
            results.pageInfo.hasNextPage && results.pageInfo.endCursor ? (
              <Link
                from={Route.fullPath}
                search={(current) => ({ ...current, before: undefined, after: results.pageInfo.endCursor ?? undefined })}
                rel="next"
                className={paginationLinkClass}
              >
                Next page
              </Link>
            ) : null
          }
        />
      ) : null}
    </div>
  )
}

export const Route = createFileRoute('/search')({
  validateSearch: validateSearchPageSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    deps.q ? searchProducts({ data: { query: deps.q, sort: deps.sort, after: deps.after, before: deps.before } }) : null,
  head: ({ match }) =>
    seo({
      title: match.search.q ? `Search: ${match.search.q}` : 'Search',
      description: `Search the ${storefrontConfig.shopName} catalogue.`,
      path: '/search',
      // Result pages are endless variations of the catalogue, so only the bare search page is indexable.
      noindex: Boolean(match.search.q),
    }),
  headers: searchHeaders,
  component: Search,
  notFoundComponent: NotFound,
  errorComponent: RouteError,
})
