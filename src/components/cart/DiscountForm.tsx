import { useId } from 'react'
import type { Cart } from '~/shopify/types'
import { useDiscountCodes } from './hooks'
import styles from './Cart.module.css'

export const DiscountForm = ({ codes }: { codes: Cart['discountCodes'] }) => {
  const discount = useDiscountCodes()
  const inputId = useId()
  const current = codes.map((entry) => entry.code)

  return (
    <div className={styles.discount}>
      <form
        className={styles.discountForm}
        onSubmit={(event) => {
          event.preventDefault()
          const form = event.currentTarget
          const code = String(new FormData(form).get('code') ?? '').trim()
          if (!code || discount.isPending) return
          const others = current.filter((existing) => existing.toLowerCase() !== code.toLowerCase())
          discount.mutate({ discountCodes: [...others, code] }, { onSuccess: () => form.reset() })
        }}
      >
        <label htmlFor={inputId} className={styles.discountLabel}>
          Discount code
        </label>
        <div className={styles.discountRow}>
          <input
            id={inputId}
            name="code"
            type="text"
            className={styles.input}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={100}
            required
          />
          <button type="submit" className={styles.secondaryButton} aria-disabled={discount.isPending}>
            {discount.isPending ? 'Applying…' : 'Apply'}
          </button>
        </div>
      </form>
      {codes.length > 0 ? (
        <ul role="list" className={styles.codes}>
          {codes.map((entry) => (
            <li key={entry.code} className={styles.code}>
              <span>
                <span className={styles.codeName}>{entry.code}</span>{' '}
                <span className={entry.applicable ? styles.codeApplied : styles.codeRejected}>
                  {entry.applicable ? 'Applied' : 'Not applied'}
                </span>
              </span>
              <button
                type="button"
                className={styles.textButton}
                onClick={() =>
                  discount.mutate({ discountCodes: current.filter((existing) => existing !== entry.code) })
                }
              >
                Remove<span className="visually-hidden"> code {entry.code}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
