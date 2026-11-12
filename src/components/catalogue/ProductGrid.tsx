import type { ProductCardData } from '~/shopify/types'
import { ProductCard } from './ProductCard'
import styles from './ProductGrid.module.css'

type ProductGridProps = {
  products: ReadonlyArray<ProductCardData>
  headingLevel?: 2 | 3
  // How many leading cards sit above the fold and should not lazy load.
  eagerCount?: number
  // Gives the first card's image a high fetch priority, for a grid at the top of the page.
  priority?: boolean
}

// The card's real width at each breakpoint of ProductGrid.module.css: columns, less the page gutter and gaps.
// Keep the two in step, or phones download a larger image than they show.
export const GRID_SIZES =
  '(min-width: 80rem) 17.625rem, (min-width: 64rem) calc(25vw - 2.375rem), (min-width: 40rem) calc(30.67vw - 1rem), calc(46vw - 0.5rem)'

export const ProductGrid = ({ products, headingLevel, eagerCount = 0, priority = false }: ProductGridProps) => (
  <ul role="list" className={styles.grid}>
    {products.map((product, index) => (
      <li key={product.id}>
        <ProductCard
          product={product}
          sizes={GRID_SIZES}
          headingLevel={headingLevel}
          priority={priority && index === 0}
          eager={index < eagerCount}
        />
      </li>
    ))}
  </ul>
)
