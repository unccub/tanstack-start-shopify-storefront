import type { ImageData } from '~/shopify/types'
import { ShopifyImage } from './ShopifyImage'
import styles from './ProductGallery.module.css'

type ProductGalleryProps = {
  images: ReadonlyArray<ImageData>
  // Shown first, so the gallery follows the selected variant.
  leadImage: ImageData | null
  title: string
}

// The images' real widths in ProductGallery.module.css and the product layout. Keep them in step.
const DESKTOP_MAIN = '(min-width: 80rem) 39.5rem, (min-width: 48rem) calc(50vw - 1.5rem)'
const SINGLE_SIZES = `${DESKTOP_MAIN}, 92vw`
const MAIN_SIZES = `${DESKTOP_MAIN}, 81vw`
const REST_SIZES = '(min-width: 80rem) 19.5rem, (min-width: 48rem) calc(25vw - 1rem), 81vw'

export const ProductGallery = ({ images, leadImage, title }: ProductGalleryProps) => {
  const ordered = leadImage ? [leadImage, ...images.filter((image) => image.url !== leadImage.url)] : [...images]

  if (ordered.length === 0) return <div className={styles.placeholder} aria-hidden="true" />

  const many = ordered.length > 1

  return (
    <ul
      role="list"
      className={[styles.gallery, many ? styles.many : ''].filter(Boolean).join(' ')}
      aria-label={many ? 'Product images' : undefined}
      // A scrolling list must be reachable by keyboard.
      tabIndex={many ? 0 : undefined}
    >
      {ordered.map((image, index) => (
        <li key={image.url} className={styles.item}>
          <ShopifyImage
            image={image}
            alt={index === 0 ? title : `${title}, image ${index + 1}`}
            sizes={index > 0 ? REST_SIZES : many ? MAIN_SIZES : SINGLE_SIZES}
            priority={index === 0}
          />
        </li>
      ))}
    </ul>
  )
}
