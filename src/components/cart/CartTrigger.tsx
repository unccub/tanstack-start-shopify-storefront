import type { MouseEvent } from 'react'
import { useLocation } from '@tanstack/react-router'
import { CartButton } from '~/components/layout/CartButton'
import { useCartCount } from './hooks'
import { openCartDrawer } from './store'

export const CartTrigger = () => {
  const count = useCartCount()
  const onCartPage = useLocation({ select: (location) => location.pathname === '/cart' })

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Modified clicks keep their browser meaning, and the cart page needs no drawer.
    if (onCartPage || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    openCartDrawer(event.currentTarget)
  }

  return <CartButton count={count} onClick={onClick} />
}
