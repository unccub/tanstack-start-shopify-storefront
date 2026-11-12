import { shopifyImageUrl, shopifySrcSet } from '~/shopify/images'
import type { ImageData } from '~/shopify/types'
import styles from './ShopifyImage.module.css'

type ShopifyImageProps = {
  image: ImageData
  // Used when the store has no alt text for the image.
  alt: string
  sizes: string
  // The largest image above the fold: loads eagerly with a high fetch priority.
  priority?: boolean
  // Above the fold, but not the largest image.
  eager?: boolean
  square?: boolean
  className?: string
}

const FALLBACK_SIZE = 1024
const DEFAULT_SRC_WIDTH = 640

export const ShopifyImage = ({ image, alt, sizes, priority = false, eager = false, square = true, className }: ShopifyImageProps) => {
  const width = image.width ?? FALLBACK_SIZE
  const height = square ? width : (image.height ?? width)

  return (
    <img
      className={[styles.image, square ? styles.square : '', className ?? ''].filter(Boolean).join(' ')}
      src={shopifyImageUrl(image.url, Math.min(width, DEFAULT_SRC_WIDTH))}
      srcSet={shopifySrcSet(image.url, { maxWidth: image.width })}
      sizes={sizes}
      width={width}
      height={height}
      alt={image.altText || alt}
      loading={priority || eager ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
    />
  )
}
