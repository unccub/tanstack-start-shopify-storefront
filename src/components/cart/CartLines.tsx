import { Link } from '@tanstack/react-router'
import { shopifyImageUrl } from '~/shopify/images'
import type { CartLine } from '~/shopify/types'
import { formatMoney } from '~/lib/money'
import { MAX_LINE_QUANTITY, useIsAddingToCart, useRemoveCartLine, useStepCartLine } from './hooks'
import { announceCart } from './store'
import styles from './Cart.module.css'

const IMAGE_SIZE = 80

const REMOVE_BUTTON = '[data-cart-remove]'

// The line is about to leave the page, so focus moves to a neighbouring line, or to the first control left.
const moveFocusFrom = (control: HTMLElement) => {
  const item = control.closest('li')
  const neighbour =
    item?.nextElementSibling?.querySelector<HTMLElement>(REMOVE_BUTTON) ??
    item?.previousElementSibling?.querySelector<HTMLElement>(REMOVE_BUTTON)
  const fallback = control.closest('dialog')?.querySelector<HTMLElement>('button') ?? document.querySelector<HTMLElement>('main')
  ;(neighbour ?? fallback)?.focus()
}

const CartLineItem = ({ line }: { line: CartLine }) => {
  const step = useStepCartLine()
  const remove = useRemoveCartLine()
  const options = line.selectedOptions.filter((option) => option.name !== 'Title')
  // Two variants of one product need different names for their controls.
  const name = options.length > 0 ? `${line.productTitle}, ${options.map((option) => option.value).join(' / ')}` : line.productTitle

  const leave = (control: HTMLElement) => {
    moveFocusFrom(control)
    announceCart(`Removed ${name}.`)
  }

  return (
    <li className={styles.line}>
      <div className={styles.lineImage}>
        {line.image ? (
          <img
            src={shopifyImageUrl(line.image.url, IMAGE_SIZE)}
            srcSet={`${shopifyImageUrl(line.image.url, IMAGE_SIZE)} 1x, ${shopifyImageUrl(line.image.url, IMAGE_SIZE * 2)} 2x`}
            alt={line.image.altText ?? ''}
            width={IMAGE_SIZE}
            height={IMAGE_SIZE}
            loading="lazy"
            decoding="async"
          />
        ) : null}
      </div>
      <div className={styles.lineBody}>
        <div className={styles.lineHeading}>
          <Link
            to="/products/$handle"
            params={{ handle: line.productHandle }}
            search={Object.fromEntries(options.map((option) => [option.name, option.value]))}
            className={styles.lineTitle}
          >
            {line.productTitle}
          </Link>
          <p className={styles.linePrice}>{formatMoney(line.total)}</p>
        </div>
        {options.length > 0 ? (
          <dl className={styles.lineOptions}>
            {options.map((option) => (
              <div key={option.name}>
                <dt>{option.name}:</dt> <dd>{option.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <div className={styles.lineControls}>
          <div className={styles.stepper} role="group" aria-label={`Quantity of ${name}`}>
            <button
              type="button"
              className={styles.stepperButton}
              aria-label={`Decrease quantity of ${name}`}
              onClick={(event) => {
                if (line.quantity <= 1) leave(event.currentTarget)
                step(line.id, -1)
              }}
            >
              <span aria-hidden="true">−</span>
            </button>
            <span className={styles.stepperValue} aria-live="polite">
              <span className="visually-hidden">Quantity </span>
              {line.quantity}
            </span>
            <button
              type="button"
              className={styles.stepperButton}
              aria-label={`Increase quantity of ${name}`}
              aria-disabled={line.quantity >= MAX_LINE_QUANTITY}
              onClick={() => step(line.id, 1)}
            >
              <span aria-hidden="true">+</span>
            </button>
          </div>
          <button
            type="button"
            className={styles.textButton}
            data-cart-remove
            onClick={(event) => {
              leave(event.currentTarget)
              remove.mutate({ lineId: line.id })
            }}
          >
            Remove<span className="visually-hidden"> {name}</span>
          </button>
        </div>
      </div>
    </li>
  )
}

export const CartLines = ({ lines }: { lines: ReadonlyArray<CartLine> }) => {
  const adding = useIsAddingToCart()

  return (
    <ul role="list" className={styles.lines}>
      {lines.map((line) => (
        <CartLineItem key={line.id} line={line} />
      ))}
      {adding ? <li className={styles.pendingLine}>Adding to your cart…</li> : null}
    </ul>
  )
}
