import { useEffect, useId, useMemo, useState } from 'react'
import type { FocusEvent, FormEvent, KeyboardEvent } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { ShopifyImage } from '~/components/catalogue/ShopifyImage'
import { SearchIcon } from '~/components/ui/Icons'
import { formatMoney } from '~/lib/money'
import { useSyncedState } from '~/lib/use-synced-state'
import { predictiveSearch } from '~/shopify/search.functions'
import type { ImageData } from '~/shopify/types'
import styles from './SearchCombobox.module.css'

type SearchComboboxProps = {
  // Names the landmark and the text box, so two search boxes on one page can be told apart.
  label: string
  defaultValue?: string
  className?: string
}

type Suggestion = {
  key: string
  kind: 'collection' | 'product'
  handle: string
  title: string
  detail: string | null
  image: ImageData | null
}

const MIN_LENGTH = 2
const DEBOUNCE_MS = 200

// A plain GET form to /search until it hydrates, then a combobox with suggestions.
export const SearchCombobox = ({ label, defaultValue = '', className }: SearchComboboxProps) => {
  const id = useId()
  const listId = `${id}-list`
  const navigate = useNavigate()
  const [value, setValue] = useSyncedState(defaultValue)
  const [term, setTerm] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    const timer = setTimeout(() => setTerm(value.trim()), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [value])

  const enabled = open && term.length >= MIN_LENGTH
  const { data, isFetching } = useQuery({
    queryKey: ['predictive-search', term],
    queryFn: () => predictiveSearch({ data: { query: term } }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })

  const suggestions = useMemo<Array<Suggestion>>(() => {
    if (!enabled || !data) return []
    return [
      ...data.collections.map((collection) => ({
        key: `collection-${collection.id}`,
        kind: 'collection' as const,
        handle: collection.handle,
        title: collection.title,
        detail: 'Collection',
        image: null,
      })),
      ...data.products.map((product) => ({
        key: `product-${product.id}`,
        kind: 'product' as const,
        handle: product.handle,
        title: product.title,
        detail: formatMoney(product.priceRange.minVariantPrice),
        image: product.featuredImage,
      })),
    ]
  }, [data, enabled])

  const expanded = suggestions.length > 0
  // While newer suggestions are on their way, the list on screen cannot be picked with the keyboard.
  const stale = value.trim() !== term || data?.query !== term
  const active = stale ? undefined : suggestions[activeIndex]
  const optionId = (index: number) => `${id}-option-${index}`

  const close = () => {
    setOpen(false)
    setActiveIndex(-1)
  }

  const goTo = (suggestion: Suggestion) => {
    close()
    setValue('')
    const params = { handle: suggestion.handle }
    void (suggestion.kind === 'product' ? navigate({ to: '/products/$handle', params }) : navigate({ to: '/collections/$handle', params }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    close()
    void navigate({ to: '/search', search: { q: value.trim() || undefined } })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        // Reopening lands on the first suggestion once the list is back.
        setOpen(true)
        setActiveIndex(event.key === 'ArrowDown' ? 0 : -1)
        return
      }
      if (suggestions.length === 0 || stale) return
      const step = event.key === 'ArrowDown' ? 1 : -1
      // -1 is the text box itself, so the arrows wrap through it.
      setActiveIndex((index) => ((index + 1 + step + suggestions.length + 1) % (suggestions.length + 1)) - 1)
    } else if (event.key === 'Escape') {
      if (expanded) {
        event.preventDefault()
        close()
      } else {
        setValue('')
      }
    } else if (event.key === 'Enter' && active) {
      event.preventDefault()
      goTo(active)
    }
  }

  const handleBlur = (event: FocusEvent<HTMLFormElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) close()
  }

  const status = !enabled || isFetching ? '' : expanded ? `${suggestions.length} ${suggestions.length === 1 ? 'suggestion' : 'suggestions'}` : 'No suggestions'

  return (
    <form
      role="search"
      aria-label={label}
      action="/search"
      method="get"
      className={[styles.form, className ?? ''].filter(Boolean).join(' ')}
      onSubmit={handleSubmit}
      onBlur={handleBlur}
    >
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <span className={styles.icon}>
        <SearchIcon />
      </span>
      <input
        id={id}
        className={styles.input}
        type="search"
        name="q"
        placeholder="Search"
        autoComplete="off"
        enterKeyHint="search"
        maxLength={200}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={active ? optionId(activeIndex) : undefined}
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          setOpen(true)
          setActiveIndex(-1)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />
      <ul id={listId} role="listbox" aria-label="Suggestions" className={styles.list} hidden={!expanded}>
        {suggestions.map((suggestion, index) => (
          <li
            key={suggestion.key}
            id={optionId(index)}
            role="option"
            aria-selected={!stale && index === activeIndex}
            className={styles.option}
            // Keeps focus in the text box, so the click is not lost to a blur.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => goTo(suggestion)}
            onMouseEnter={() => setActiveIndex(index)}
          >
            {suggestion.image ? (
              <ShopifyImage image={suggestion.image} alt="" sizes="2.5rem" className={styles.thumb} />
            ) : (
              <span className={styles.thumb} aria-hidden="true" />
            )}
            <span className={styles.optionTitle}>{suggestion.title}</span>
            {suggestion.detail ? <span className={styles.optionDetail}>{suggestion.detail}</span> : null}
          </li>
        ))}
      </ul>
      <span className="visually-hidden" role="status">
        {status}
      </span>
    </form>
  )
}
