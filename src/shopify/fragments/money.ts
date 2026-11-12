import { graphql } from '../graphql'
import type { FragmentOf } from '../graphql'

export const moneyFragment = graphql(`
  fragment Money on MoneyV2 {
    amount
    currencyCode
  }
`)

export type MoneyData = FragmentOf<typeof moneyFragment>
