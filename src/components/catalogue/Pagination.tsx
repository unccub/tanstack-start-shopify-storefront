import type { ReactNode } from 'react'
import styles from './Pagination.module.css'

type PaginationProps = {
  // Links built by the route, so their search params stay typed. Pass null when there is no such page.
  previous: ReactNode
  next: ReactNode
}

export const paginationLinkClass = styles.link

export const Pagination = ({ previous, next }: PaginationProps) =>
  previous || next ? (
    <nav aria-label="Pagination" className={styles.nav}>
      {previous ?? <span />}
      {next}
    </nav>
  ) : null
