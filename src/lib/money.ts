import { locale } from '~/config'
import type { MoneyData } from '~/shopify/types'

const formatters = new Map<string, Intl.NumberFormat>()

export const formatMoney = ({ amount, currencyCode }: MoneyData) => {
  let formatter = formatters.get(currencyCode)
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode })
    formatters.set(currencyCode, formatter)
  }
  return formatter.format(Number(amount))
}

export const isMoreThan = (a: MoneyData | null | undefined, b: MoneyData) => Boolean(a) && Number(a?.amount) > Number(b.amount)
