import { graphql } from '../graphql'
import type { FragmentOf } from '../graphql'
import { imageFragment } from './image'
import { moneyFragment } from './money'

export const productVariantFragment = graphql(
  `
    fragment ProductVariant on ProductVariant {
      id
      title
      sku
      availableForSale
      selectedOptions {
        name
        value
      }
      price {
        ...Money
      }
      compareAtPrice {
        ...Money
      }
      image {
        ...Image
      }
    }
  `,
  [imageFragment, moneyFragment],
)

export type ProductVariantData = FragmentOf<typeof productVariantFragment>
