import { graphql } from '../graphql'
import type { FragmentOf } from '../graphql'
import { imageFragment } from './image'
import { moneyFragment } from './money'

export const cartLineFragment = graphql(
  `
    fragment CartLine on BaseCartLine {
      id
      quantity
      cost {
        amountPerQuantity {
          ...Money
        }
        compareAtAmountPerQuantity {
          ...Money
        }
        subtotalAmount {
          ...Money
        }
        totalAmount {
          ...Money
        }
      }
      merchandise {
        __typename
        ... on ProductVariant {
          id
          title
          availableForSale
          selectedOptions {
            name
            value
          }
          image {
            ...Image
          }
          product {
            handle
            title
          }
        }
      }
    }
  `,
  [imageFragment, moneyFragment],
)

// 50 lines keeps every cart operation near half of the 1,000 complexity limit for tokenless access.
export const cartFragment = graphql(
  `
    fragment Cart on Cart {
      id
      checkoutUrl
      totalQuantity
      cost {
        subtotalAmount {
          ...Money
        }
        totalAmount {
          ...Money
        }
      }
      discountCodes {
        code
        applicable
      }
      lines(first: 50) {
        nodes {
          ...CartLine
        }
      }
    }
  `,
  [cartLineFragment, moneyFragment],
)

export type CartLineData = FragmentOf<typeof cartLineFragment>
export type CartData = FragmentOf<typeof cartFragment>
