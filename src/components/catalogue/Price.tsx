import { formatMoney, isMoreThan } from '~/lib/money'
import type { MoneyData } from '~/shopify/types'
import styles from './Price.module.css'

type PriceProps = {
  price: MoneyData
  compareAt?: MoneyData | null
  // Shown before the price when it is the lowest of a range.
  from?: boolean
  className?: string
}

export const Price = ({ price, compareAt, from = false, className }: PriceProps) => {
  const onSale = compareAt ? isMoreThan(compareAt, price) : false

  return (
    <span className={[styles.price, className ?? ''].filter(Boolean).join(' ')}>
      {from ? <span className={styles.from}>From </span> : null}
      {onSale && compareAt ? (
        <>
          <span className="visually-hidden">Sale price </span>
          <span className={styles.sale}>{formatMoney(price)}</span>
          <span className="visually-hidden"> Was </span>
          <s className={styles.compareAt}>{formatMoney(compareAt)}</s>
        </>
      ) : (
        <span>{formatMoney(price)}</span>
      )}
    </span>
  )
}
