import { useQuery } from '@tanstack/react-query'
import { usePageSettled } from '~/lib/use-page-settled'
import { getProductRecommendations } from '~/shopify/product.functions'
import page from '~/styles/page.module.css'
import { ProductGrid } from './ProductGrid'

const MAX_RECOMMENDATIONS = 4

// Fetched in the browser once the page has loaded, so it never delays the product itself.
export const Recommendations = ({ handle }: { handle: string }) => {
  const { data } = useQuery({
    queryKey: ['recommendations', handle],
    queryFn: () => getProductRecommendations({ data: { handle } }),
    staleTime: 5 * 60_000,
    enabled: usePageSettled(),
  })

  const products = (data ?? []).filter((product) => product.handle !== handle).slice(0, MAX_RECOMMENDATIONS)
  if (products.length === 0) return null

  return (
    <section className={page.section} aria-labelledby="recommendations-title">
      <h2 id="recommendations-title" className={page.sectionTitle}>
        You may also like
      </h2>
      <ProductGrid products={products} />
    </section>
  )
}
