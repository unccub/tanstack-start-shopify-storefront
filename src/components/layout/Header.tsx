import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { SearchIcon } from '~/components/ui/Icons'
import { CartButton } from './CartButton'
import type { NavLink } from './types'
import styles from './Header.module.css'

type HeaderProps = {
  shopName: string
  links: ReadonlyArray<NavLink>
  // Slot for predictive search. Defaults to a plain link to /search.
  search?: ReactNode
  // Slot for the cart trigger. Defaults to a link to /cart with no count.
  cart?: ReactNode
}

const DefaultSearch = () => (
  <a className={styles.iconLink} href="/search" aria-label="Search">
    <SearchIcon />
  </a>
)

export const Header = ({ shopName, links, search, cart }: HeaderProps) => (
  <header className={styles.header}>
    <div className={styles.inner}>
      <Link to="/" className={styles.brand}>
        {shopName}
      </Link>
      {links.length > 0 ? (
        <nav className={styles.nav} aria-label="Main">
          <ul role="list" className={styles.navList}>
            {links.map((link) => (
              <li key={link.href}>
                <Link to={link.href} className={styles.navLink} activeProps={{ 'aria-current': 'page' }}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      <div className={styles.actions}>
        {search ?? <DefaultSearch />}
        {cart ?? <CartButton count={0} />}
      </div>
    </div>
  </header>
)
