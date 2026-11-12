import { collectionSortValues, searchSortValues } from '~/shopify/sort'
import type { CollectionSort, SearchSort } from '~/shopify/sort'

type RawSearch = Record<string, unknown>

const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

// Search params are plain strings, with a repeated key for a list, so GET forms work without JavaScript.
export const parseSearch = (searchString: string): RawSearch => {
  const params = new URLSearchParams(searchString)
  const search: RawSearch = {}
  for (const key of new Set(params.keys())) {
    if (UNSAFE_KEYS.has(key)) continue
    const values = params.getAll(key)
    search[key] = values.length > 1 ? values : values[0]
  }
  return search
}

export const stringifySearch = (search: RawSearch) => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    const values = Array.isArray(value) ? value : [value]
    for (const entry of values) {
      if (entry === undefined || entry === null || entry === '') continue
      params.append(key, String(entry))
    }
  }
  const result = params.toString()
  return result ? `?${result}` : ''
}

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value)

const toText = (value: unknown, maxLength: number) => {
  const text = first(value)
  return typeof text === 'string' && text !== '' && text.length <= maxLength ? text : undefined
}

const toCursor = (value: unknown) => toText(value, 2000)

const MAX_PRICE = 1_000_000

const toPrice = (value: unknown) => {
  const text = toText(value, 20)
  const amount = text === undefined ? Number.NaN : Number(text)
  return Number.isFinite(amount) && amount >= 0 && amount <= MAX_PRICE ? amount : undefined
}

const toOneOf = <T extends string>(value: unknown, allowed: ReadonlyArray<T>) => allowed.find((entry) => entry === first(value))

const MAX_FILTERS = 30

const toFilterList = (value: unknown) => {
  const list = value === undefined || value === null ? [] : Array.isArray(value) ? value : [value]
  return list.filter((entry): entry is string => typeof entry === 'string' && entry !== '' && entry.length <= 1000).slice(0, MAX_FILTERS)
}

export type CollectionSearch = {
  sort?: CollectionSort
  // FilterValue.input JSON strings, exactly as the API returned them.
  filter?: Array<string>
  price_min?: number
  price_max?: number
  after?: string
  before?: string
}

// Hand-written so the browser bundle does not carry a schema library. Bad values fall back to the defaults,
// and defaults are left out so a clean URL stays clean.
export const validateCollectionSearch = (raw: RawSearch): CollectionSearch => {
  const sort = toOneOf(raw.sort, collectionSortValues)
  const filter = toFilterList(raw.filter)
  const after = toCursor(raw.after)
  return {
    sort: sort === 'featured' ? undefined : sort,
    filter: filter.length > 0 ? filter : undefined,
    price_min: toPrice(raw.price_min),
    price_max: toPrice(raw.price_max),
    after,
    before: after ? undefined : toCursor(raw.before),
  }
}

export const toFilterInputs = ({ filter = [], price_min, price_max }: CollectionSearch) =>
  price_min === undefined && price_max === undefined
    ? filter
    : [...filter, JSON.stringify({ price: { min: price_min, max: price_max } })]

export type SearchPageSearch = {
  q?: string
  sort?: SearchSort
  after?: string
  before?: string
}

export const validateSearchPageSearch = (raw: RawSearch): SearchPageSearch => {
  const q = first(raw.q)
  const sort = toOneOf(raw.sort, searchSortValues)
  const after = toCursor(raw.after)
  return {
    q: typeof q === 'string' ? q.trim().slice(0, 200) || undefined : undefined,
    sort: sort === 'relevance' ? undefined : sort,
    after,
    before: after ? undefined : toCursor(raw.before),
  }
}

const MAX_OPTIONS = 10

// One param per option name, such as ?Size=Medium&Color=Ocean. Unknown names are ignored by the API.
export const validateProductSearch = (raw: RawSearch): Record<string, string> =>
  Object.fromEntries(
    Object.entries(raw)
      .flatMap(([name, value]) => (typeof value === 'string' && value !== '' && name.length <= 255 && value.length <= 255 ? [[name, value]] : []))
      .slice(0, MAX_OPTIONS),
  )
