import { Link } from '@tanstack/react-router'
import type { ProductCardData } from '~/shopify/types'
import { Price } from './Price'
import { ShopifyImage } from './ShopifyImage'
import styles from './ProductCard.module.css'

type ProductCardProps = {
  product: ProductCardData
  sizes: string
  headingLevel?: 2 | 3
  priority?: boolean
  eager?: boolean
}

export const ProductCard = ({ product, sizes, headingLevel = 3, priority, eager }: ProductCardProps) => {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  const { minVariantPrice, maxVariantPrice } = product.priceRange

  return (
    <article className={styles.card}>
      <Link to="/products/$handle" params={{ handle: product.handle }} className={styles.link}>
        {product.featuredImage ? (
          <ShopifyImage image={product.featuredImage} alt={product.title} sizes={sizes} priority={priority} eager={eager} />
        ) : (
          <div className={styles.placeholder} aria-hidden="true" />
        )}
        <Heading className={styles.title}>{product.title}</Heading>
      </Link>
      <p className={styles.meta}>
        <Price
          price={minVariantPrice}
          compareAt={product.compareAtPriceRange.minVariantPrice}
          from={minVariantPrice.amount !== maxVariantPrice.amount}
        />
        {product.availableForSale ? null : <span className={styles.badge}>Sold out</span>}
      </p>
    </article>
  )
}
