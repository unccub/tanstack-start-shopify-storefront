import { useEffect, useRef } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { CloseIcon } from '~/components/ui/Icons'
import { CartLines } from './CartLines'
import { CartMessages } from './CartMessages'
import { useCart, useIsAddingToCart } from './hooks'
import { formatMoney } from '~/lib/money'
import { announceCart, closeCartDrawer, setCartMessages, takeCartDrawerOpener, useCartDrawerOpen } from './store'
import cartStyles from './Cart.module.css'
import styles from './CartDrawer.module.css'

const TITLE_ID = 'cart-drawer-title'

const DrawerContent = () => {
  const { data: cart, isPending, isError, refetch } = useCart()
  const adding = useIsAddingToCart()
  const hasLines = Boolean(cart && cart.lines.length > 0)

  if (isPending) return <p className={styles.state}>Loading your cart…</p>

  if (isError) {
    return (
      <div className={styles.state}>
        <p>Your cart could not be loaded.</p>
        <button type="button" className={cartStyles.secondaryButton} onClick={() => void refetch()}>
          Try again
        </button>
      </div>
    )
  }

  if (!cart || (!hasLines && !adding)) {
    return (
      <div className={styles.state}>
        <p>Your cart is empty.</p>
        <Link to="/collections" className={cartStyles.secondaryButton}>
          Browse collections
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className={styles.scroll}>
        <CartLines lines={cart.lines} />
      </div>
      <div className={styles.footer}>
        <p className={cartStyles.totalRow}>
          <span>Subtotal</span>
          <span>{formatMoney(cart.subtotal)}</span>
        </p>
        <p className={cartStyles.note}>Taxes and shipping are calculated at checkout.</p>
        <a href={cart.checkoutUrl} className={cartStyles.primaryButton}>
          Checkout
        </a>
        <Link to="/cart" className={cartStyles.secondaryButton}>
          View cart
        </Link>
      </div>
    </>
  )
}

export const CartDrawer = () => {
  const open = useCartDrawerOpen()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const pathname = useLocation({ select: (location) => location.pathname })
  const count = useCart().data?.totalQuantity ?? 0

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // A new page takes focus itself, so the drawer forgets what opened it before closing.
  useEffect(
    () => () => {
      takeCartDrawerOpener()
      closeCartDrawer()
    },
    [pathname],
  )

  return (
    <dialog
      ref={dialogRef}
      className={styles.drawer}
      aria-labelledby={TITLE_ID}
      // Fires for Escape and for close(); a click on the dialog itself is a click on the backdrop.
      onClose={() => {
        closeCartDrawer()
        setCartMessages([])
        announceCart('')
        takeCartDrawerOpener()?.focus()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeCartDrawer()
      }}
    >
      {open ? (
        <div className={styles.panel}>
          <div className={styles.header}>
            <h2 id={TITLE_ID} className={styles.title}>
              Cart{count > 0 ? ` (${count})` : ''}
            </h2>
            <button type="button" className={styles.close} aria-label="Close cart" onClick={closeCartDrawer}>
              <CloseIcon />
            </button>
          </div>
          <CartMessages />
          <DrawerContent />
        </div>
      ) : null}
    </dialog>
  )
}
