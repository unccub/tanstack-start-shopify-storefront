import type { FormEvent } from 'react'
import { useSyncedState } from '~/lib/use-synced-state'
import type { Filter } from '~/shopify/types'
import controls from '~/styles/controls.module.css'
import styles from './SortFilterForm.module.css'

export type SortFilterValues = {
  sort: string
  filter: Array<string>
  price_min: string
  price_max: string
}

type SortFilterFormProps = {
  sort: string
  sortOptions: ReadonlyArray<{ value: string; label: string }>
  filters: ReadonlyArray<Filter>
  activeFilters: ReadonlyArray<string>
  priceMin?: number
  priceMax?: number
  onChange: (values: SortFilterValues) => void
}

const readValues = (form: HTMLFormElement): SortFilterValues => {
  const data = new FormData(form)
  const text = (name: string) => {
    const value = data.get(name)
    return typeof value === 'string' ? value : ''
  }
  return {
    sort: text('sort'),
    filter: data.getAll('filter').filter((value): value is string => typeof value === 'string'),
    price_min: text('price_min'),
    price_max: text('price_max'),
  }
}

const priceBounds = (filter: Filter) => {
  try {
    const parsed: unknown = JSON.parse(filter.values[0]?.input ?? '{}')
    const price = (parsed as { price?: { min?: number; max?: number } }).price
    return { min: price?.min, max: price?.max }
  } catch {
    return { min: undefined, max: undefined }
  }
}

const toPriceText = (price: number | undefined) => (price === undefined ? '' : String(price))

// A real GET form: it submits without JavaScript. With it, sort and checkboxes apply at once and keep focus.
export const SortFilterForm = ({ sort, sortOptions, filters, activeFilters, priceMin, priceMax, onChange }: SortFilterFormProps) => {
  const usable = filters.filter((filter) => filter.values.length > 0)
  const hasActive = activeFilters.length > 0 || priceMin !== undefined || priceMax !== undefined
  const [values, setValues] = useSyncedState<SortFilterValues>({
    sort,
    filter: [...activeFilters],
    price_min: toPriceText(priceMin),
    price_max: toPriceText(priceMax),
  })

  const update = (patch: Partial<SortFilterValues>, apply: boolean) => {
    const next = { ...values, ...patch }
    setValues(next)
    if (apply) onChange(next)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onChange(readValues(event.currentTarget))
  }

  return (
    <form method="get" className={styles.form} onSubmit={handleSubmit}>
      {usable.length > 0 ? (
        <details className={styles.filters} open={hasActive}>
          <summary className={styles.summary}>Filters</summary>
          <div className={styles.groups}>
            {usable.map((filter) =>
              filter.type === 'PRICE_RANGE' ? (
                <fieldset key={filter.id} className={styles.group}>
                  <legend className={styles.legend}>{filter.label}</legend>
                  <div className={styles.priceRow}>
                    <label className={styles.priceField}>
                      <span className={controls.label}>From</span>
                      <input
                        className={controls.input}
                        type="number"
                        name="price_min"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        placeholder={String(priceBounds(filter).min ?? 0)}
                        value={values.price_min}
                        onChange={(event) => update({ price_min: event.target.value }, false)}
                      />
                    </label>
                    <label className={styles.priceField}>
                      <span className={controls.label}>To</span>
                      <input
                        className={controls.input}
                        type="number"
                        name="price_max"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        placeholder={String(priceBounds(filter).max ?? '')}
                        value={values.price_max}
                        onChange={(event) => update({ price_max: event.target.value }, false)}
                      />
                    </label>
                  </div>
                </fieldset>
              ) : (
                <fieldset key={filter.id} className={styles.group}>
                  <legend className={styles.legend}>{filter.label}</legend>
                  <ul role="list" className={styles.options}>
                    {filter.values.map((value) => {
                      const checked = values.filter.includes(value.input)
                      return (
                        <li key={value.id}>
                          <label className={styles.option}>
                            <input
                              type="checkbox"
                              name="filter"
                              value={value.input}
                              checked={checked}
                              onChange={(event) =>
                                update(
                                  {
                                    filter: event.target.checked
                                      ? [...values.filter, value.input]
                                      : values.filter.filter((input) => input !== value.input),
                                  },
                                  true,
                                )
                              }
                              disabled={value.count === 0 && !checked}
                            />
                            <span>
                              {value.label} <span className={styles.count}>({value.count})</span>
                            </span>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                </fieldset>
              ),
            )}
          </div>
          <div className={styles.actions}>
            <button type="submit" className={controls.button}>
              Apply filters
            </button>
            {hasActive ? (
              <button
                type="button"
                className={controls.buttonSecondary}
                onClick={() => update({ filter: [], price_min: '', price_max: '' }, true)}
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </details>
      ) : null}
      <label className={styles.sort}>
        <span className={controls.label}>Sort by</span>
        <select className={controls.select} name="sort" value={values.sort} onChange={(event) => update({ sort: event.target.value }, true)}>
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <noscript>
        <button type="submit" className={controls.buttonSecondary}>
          Apply
        </button>
      </noscript>
    </form>
  )
}
