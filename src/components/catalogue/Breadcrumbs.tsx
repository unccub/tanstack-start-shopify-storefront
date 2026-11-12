import { Link } from '@tanstack/react-router'
import styles from './Breadcrumbs.module.css'

export type Crumb = {
  label: string
  // Left out for the current page.
  href?: string
}

export const Breadcrumbs = ({ items }: { items: ReadonlyArray<Crumb> }) => (
  <nav aria-label="Breadcrumb" className={styles.nav}>
    <ol role="list" className={styles.list}>
      {items.map((item) => (
        <li key={item.label} className={styles.item}>
          {item.href ? (
            <Link to={item.href} className={styles.link}>
              {item.label}
            </Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </li>
      ))}
    </ol>
  </nav>
)
