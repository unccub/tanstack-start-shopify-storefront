import { createFileRoute } from '@tanstack/react-router'
import { AddToCartButton } from '~/components/cart/AddToCartButton'
import { Breadcrumbs } from '~/components/catalogue/Breadcrumbs'
import { Price } from '~/components/catalogue/Price'
import { ProductGallery } from '~/components/catalogue/ProductGallery'
import { Recommendations } from '~/components/catalogue/Recommendations'
import { VariantPicker } from '~/components/catalogue/VariantPicker'
import { NotFound, RouteError } from '~/components/layout/StatusPage'
import { Prose } from '~/components/ui/Prose'
import { catalogueHeaders } from '~/lib/cache'
import { validateProductSearch } from '~/lib/search-params'
import { breadcrumbJsonLd, productJsonLd, seo, seoUnavailable } from '~/lib/seo'
import { getProduct } from '~/shopify/product.functions'
import page from '~/styles/page.module.css'
import styles from './product.module.css'

const Product = () => {
  const product = Route.useLoaderData()
  const variant = product.selectedVariant
  const available = variant ? variant.availableForSale : product.availableForSale

  return (
    <div className={page.page}>
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Collections', href: '/collections' }, { label: product.title }]} />
      <div className={styles.layout}>
        <ProductGallery images={product.images} leadImage={variant?.image ?? product.featuredImage} title={product.title} />
        <div className={styles.details}>
          <div className={styles.heading}>
            {product.vendor ? <p className={styles.vendor}>{product.vendor}</p> : null}
            <h1 className={styles.title}>{product.title}</h1>
          </div>
          <p className={styles.price}>
            <Price
              price={variant?.price ?? product.priceRange.minVariantPrice}
              compareAt={variant ? variant.compareAtPrice : product.compareAtPriceRange.minVariantPrice}
            />
          </p>
          {product.hasOnlyDefaultVariant ? null : <VariantPicker handle={product.handle} options={product.options} />}
          <div className={styles.buy}>
            <AddToCartButton variantId={variant?.id ?? null} available={available} />
            <p className={available ? styles.inStock : styles.soldOut}>
              {available ? 'In stock' : product.hasOnlyDefaultVariant ? 'This product is sold out.' : 'This option is sold out.'}
            </p>
          </div>
          {product.descriptionHtml ? (
            <section aria-labelledby="description-title" className={styles.description}>
              <h2 id="description-title" className={styles.descriptionTitle}>
                Description
              </h2>
              <Prose html={product.descriptionHtml} />
            </section>
          ) : null}
        </div>
      </div>
      <Recommendations handle={product.handle} />
    </div>
  )
}

export const Route = createFileRoute('/products/$handle')({
  validateSearch: validateProductSearch,
  loaderDeps: ({ search }) => ({
    selectedOptions: Object.entries(search).map(([name, value]) => ({ name, value })),
  }),
  loader: ({ params, deps }) => getProduct({ data: { handle: params.handle, selectedOptions: deps.selectedOptions } }),
  head: ({ loaderData, params }) =>
    loaderData
      ? seo({
          title: loaderData.seo.title ?? loaderData.title,
          description: loaderData.seo.description || loaderData.description || loaderData.title,
          // Every variant URL points at the product itself.
          path: `/products/${params.handle}`,
          type: 'product',
          image: loaderData.featuredImage,
          jsonLd: [
            productJsonLd(loaderData),
            breadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: 'Collections', path: '/collections' },
              { name: loaderData.title, path: `/products/${params.handle}` },
            ]),
          ],
        })
      : seoUnavailable(),
  headers: catalogueHeaders,
  component: Product,
  notFoundComponent: NotFound,
  errorComponent: RouteError,
})
