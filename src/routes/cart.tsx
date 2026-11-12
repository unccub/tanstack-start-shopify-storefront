import { Link, createFileRoute } from '@tanstack/react-router'
import { CartLines } from '~/components/cart/CartLines'
import { CartMessages } from '~/components/cart/CartMessages'
import { DiscountForm } from '~/components/cart/DiscountForm'
import { useCart, useIsAddingToCart } from '~/components/cart/hooks'
import { formatMoney } from '~/lib/money'
import { RouteError } from '~/components/layout/StatusPage'
import { absoluteUrl, storefrontConfig } from '~/config'
import cartStyles from '~/components/cart/Cart.module.css'
import styles from './cart.module.css'

const CartContent = () => {
  const { data: cart, isPending, isError, refetch } = useCart()
  const adding = useIsAddingToCart()

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

  if (!cart || (cart.lines.length === 0 && !adding)) {
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
    <div className={styles.layout}>
      <section aria-label="Items in your cart">
        <CartLines lines={cart.lines} />
      </section>
      <section className={styles.summary} aria-labelledby="cart-summary-title">
        <h2 id="cart-summary-title" className={styles.summaryTitle}>
          Summary
        </h2>
        <DiscountForm codes={cart.discountCodes} />
        <dl className={styles.totals}>
          <div className={styles.totalRow}>
            <dt>Subtotal</dt>
            <dd>{formatMoney(cart.subtotal)}</dd>
          </div>
          <div className={`${styles.totalRow} ${styles.grandTotal}`}>
            <dt>Total</dt>
            <dd>{formatMoney(cart.total)}</dd>
          </div>
        </dl>
        <p className={cartStyles.note}>Taxes and shipping are calculated at checkout.</p>
        <a href={cart.checkoutUrl} className={cartStyles.primaryButton}>
          Checkout
        </a>
      </section>
    </div>
  )
}

const CartPage = () => (
  <div className={styles.page}>
    <h1 className={styles.title}>Cart</h1>
    <CartMessages />
    <CartContent />
  </div>
)

export const Route = createFileRoute('/cart')({
  head: () => ({
    meta: [{ title: `Cart | ${storefrontConfig.shopName}` }, { name: 'robots', content: 'noindex, nofollow' }],
    links: [{ rel: 'canonical', href: absoluteUrl('/cart') }],
  }),
  headers: () => ({ 'Cache-Control': 'no-store' }),
  component: CartPage,
  errorComponent: RouteError,
})
