import { Link, createFileRoute } from '@tanstack/react-router'
import { ProductGrid } from '~/components/catalogue/ProductGrid'
import { NotFound, RouteError } from '~/components/layout/StatusPage'
import { storefrontConfig } from '~/config'
import { catalogueHeaders } from '~/lib/cache'
import { organizationJsonLd, seo, websiteJsonLd } from '~/lib/seo'
import { getCollection, getProducts } from '~/shopify/catalogue.functions'
import controls from '~/styles/controls.module.css'
import page from '~/styles/page.module.css'
import styles from './index.module.css'

const FEATURED_COUNT = 4
const GRID_COUNT = 8

const Home = () => {
  const { featured, products } = Route.useLoaderData()
  const hasFeatured = Boolean(featured && featured.products.length > 0)

  return (
    <div className={page.page}>
      <section className={styles.hero}>
        <h1 className={styles.title}>{storefrontConfig.shopName}</h1>
        <p className={styles.lede}>{storefrontConfig.shopDescription}</p>
        <div className={styles.actions}>
          <Link to="/collections" className={controls.button}>
            Shop collections
          </Link>
          <Link to="/search" className={controls.buttonSecondary}>
            Search products
          </Link>
        </div>
      </section>

      {featured && hasFeatured ? (
        <section className={page.section} aria-labelledby="featured-title">
          <div className={page.sectionHeader}>
            <h2 id="featured-title" className={page.sectionTitle}>
              {featured.title}
            </h2>
            <Link to="/collections/$handle" params={{ handle: featured.handle }} className={page.sectionLink}>
              View the collection
            </Link>
          </div>
          <ProductGrid products={featured.products} eagerCount={2} priority />
        </section>
      ) : null}

      <section className={page.section} aria-labelledby="products-title">
        <div className={page.sectionHeader}>
          <h2 id="products-title" className={page.sectionTitle}>
            Best sellers
          </h2>
          <Link to="/collections" className={page.sectionLink}>
            All collections
          </Link>
        </div>
        {products.length > 0 ? (
          <ProductGrid products={products} eagerCount={hasFeatured ? 0 : 2} priority={!hasFeatured} />
        ) : (
          <p className={page.empty}>There are no products to show yet.</p>
        )}
      </section>
    </div>
  )
}

export const Route = createFileRoute('/')({
  loader: async () => {
    const [featured, list] = await Promise.all([
      // The featured collection is optional: a store without it still gets a home page.
      getCollection({ data: { handle: storefrontConfig.featuredCollectionHandle, pageSize: FEATURED_COUNT } }).catch(() => null),
      getProducts({ data: { first: GRID_COUNT } }),
    ])
    return { featured, products: list.products }
  },
  head: ({ loaderData }) =>
    seo({
      title: storefrontConfig.shopName,
      bare: true,
      description: storefrontConfig.shopDescription,
      path: '/',
      image: loaderData?.featured?.image ?? loaderData?.products[0]?.featuredImage,
      jsonLd: [websiteJsonLd(), organizationJsonLd()],
    }),
  headers: catalogueHeaders,
  component: Home,
  notFoundComponent: NotFound,
  errorComponent: RouteError,
})
