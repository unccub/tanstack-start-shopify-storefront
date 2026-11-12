import { useState } from 'react'
import { analytics } from '~/lib/analytics'
import { useAddToCart } from './hooks'
import { announceCart, openCartDrawer } from './store'
import styles from './Cart.module.css'

type AddToCartButtonProps = {
  variantId: string | null
  available: boolean
  quantity?: number
}

const label = (variantId: string | null, available: boolean, pending: boolean) => {
  if (!variantId) return 'Unavailable'
  if (!available) return 'Sold out'
  return pending ? 'Adding…' : 'Add to cart'
}

export const AddToCartButton = ({ variantId, available, quantity = 1 }: AddToCartButtonProps) => {
  const add = useAddToCart()
  const [status, setStatus] = useState('')
  const disabled = !variantId || !available

  return (
    <div className={styles.addToCart}>
      <button
        type="button"
        className={styles.primaryButton}
        // aria-disabled keeps the button focusable, so focus is not lost while a request runs.
        aria-disabled={disabled || add.isPending}
        onClick={(event) => {
          if (disabled || add.isPending || !variantId) return
          const button = event.currentTarget
          setStatus('')
          add.mutate(
            { variantId, quantity },
            {
              onSuccess: (result) => {
                if (result.cart) {
                  analytics.addToCart({ variantId, quantity })
                  openCartDrawer(button)
                  // The page behind a modal is silent, so this is said inside the drawer once it has opened.
                  setTimeout(() => announceCart('Added to cart.'), 150)
                } else {
                  setStatus(result.messages[0] ?? 'This could not be added to your cart.')
                }
              },
              onError: () => setStatus('This could not be added to your cart. Please try again.'),
            },
          )
        }}
      >
        {label(variantId, available, add.isPending)}
      </button>
      <p className="visually-hidden" role="status">
        {status}
      </p>
    </div>
  )
}
