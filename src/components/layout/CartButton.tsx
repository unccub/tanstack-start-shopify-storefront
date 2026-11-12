import type { MouseEventHandler } from 'react'
import { BagIcon } from '~/components/ui/Icons'
import styles from './Header.module.css'

type CartButtonProps = {
  count: number
  // Call preventDefault here to open a drawer; without JavaScript the link goes to /cart.
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

export const CartButton = ({ count, onClick }: CartButtonProps) => (
  <a
    className={styles.iconLink}
    href="/cart"
    onClick={onClick}
    aria-label={count > 0 ? `Cart, ${count} ${count === 1 ? 'item' : 'items'}` : 'Cart'}
  >
    <BagIcon />
    {count > 0 ? (
      <span className={styles.count} aria-hidden="true">
        {count > 99 ? '99+' : count}
      </span>
    ) : null}
  </a>
)
