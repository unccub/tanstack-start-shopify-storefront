import { useId } from 'react'
import { Link } from '@tanstack/react-router'
import type { ProductOption, SelectedOption } from '~/shopify/types'
import styles from './VariantPicker.module.css'

type VariantPickerProps = {
  handle: string
  options: ReadonlyArray<ProductOption>
}

const toSearch = (selectedOptions: ReadonlyArray<SelectedOption>) =>
  Object.fromEntries(selectedOptions.map((option) => [option.name, option.value]))

const OptionGroup = ({ handle, option, optionNames }: { handle: string; option: ProductOption; optionNames: ReadonlyArray<string> }) => {
  const labelId = useId()
  const selected = option.values.find((value) => value.selected)

  return (
    <div role="group" aria-labelledby={labelId} className={styles.group}>
      <p id={labelId} className={styles.label}>
        {option.name}
        {selected ? <span className={styles.current}>{selected.name}</span> : null}
      </p>
      <ul role="list" className={styles.values}>
        {option.values.map((value) => (
          <li key={value.name}>
            {/* Each value is a link, so every variant has its own URL. */}
            <Link
              to="/products/$handle"
              params={{ handle }}
              // Reads the URL at click time, so a second pick made while the first is still loading keeps it.
              search={(current: Record<string, unknown>) => {
                const next = toSearch(value.selectedOptions)
                if (!value.exists) return next
                for (const other of optionNames) {
                  const pending = current[other]
                  if (other !== option.name && typeof pending === 'string') next[other] = pending
                }
                return next
              }}
              replace
              resetScroll={false}
              // The router marks a link whose URL matches as the current page; selection is what matters here.
              activeProps={{ 'aria-current': value.selected ? 'true' : undefined }}
              inactiveProps={{ 'aria-current': value.selected ? 'true' : undefined }}
              className={[
                styles.value,
                value.selected ? styles.selected : '',
                value.available ? '' : styles.soldOut,
                value.exists ? '' : styles.elsewhere,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {value.swatchColor ? <span className={styles.swatch} style={{ background: value.swatchColor }} aria-hidden="true" /> : null}
              {value.name}
              {value.available ? null : <span className="visually-hidden"> (sold out)</span>}
              {value.exists || !value.available ? null : <span className="visually-hidden"> (changes other options)</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export const VariantPicker = ({ handle, options }: VariantPickerProps) => (
  <div className={styles.picker}>
    {options.map((option) => (
      <OptionGroup key={option.name} handle={handle} option={option} optionNames={options.map((entry) => entry.name)} />
    ))}
  </div>
)
