import { Link } from '@tanstack/react-router'
import type { CollectionCardData } from '~/shopify/types'
import { ShopifyImage } from './ShopifyImage'
import styles from './CollectionCard.module.css'

type CollectionCardProps = {
  collection: CollectionCardData
  sizes: string
  priority?: boolean
  eager?: boolean
}

export const CollectionCard = ({ collection, sizes, priority, eager }: CollectionCardProps) => (
  <article>
    <Link to="/collections/$handle" params={{ handle: collection.handle }} className={styles.link}>
      {collection.image ? (
        <ShopifyImage image={collection.image} alt="" sizes={sizes} priority={priority} eager={eager} />
      ) : (
        <div className={styles.placeholder} aria-hidden="true" />
      )}
      <h2 className={styles.title}>{collection.title}</h2>
    </Link>
    {collection.description ? <p className={styles.description}>{collection.description}</p> : null}
  </article>
)
