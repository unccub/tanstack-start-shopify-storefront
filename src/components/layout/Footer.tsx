import { Link } from '@tanstack/react-router'
import type { NavLink } from './types'
import styles from './Footer.module.css'

type FooterProps = {
  shopName: string
  links?: ReadonlyArray<NavLink>
}

export const Footer = ({ shopName, links = [] }: FooterProps) => (
  <footer className={styles.footer}>
    <div className={styles.inner}>
      {links.length > 0 ? (
        <nav aria-label="Footer">
          <ul role="list" className={styles.links}>
            {links.map((link) => (
              <li key={link.href}>
                <Link to={link.href} className={styles.link}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      <p className={styles.small}>
        &copy; {new Date().getFullYear()} {shopName}
      </p>
      {/* Remove this paragraph to drop the credit. */}
      <p className={styles.small}>
        <a className={styles.link} href="https://unccub.com/open-source/tanstack-start-shopify-storefront">
          Starter by UNCCUB
        </a>
      </p>
    </div>
  </footer>
)
