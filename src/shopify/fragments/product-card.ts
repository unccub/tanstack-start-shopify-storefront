import { graphql } from '../graphql'
import type { FragmentOf } from '../graphql'
import { imageFragment } from './image'
import { moneyFragment } from './money'

export const productCardFragment = graphql(
  `
    fragment ProductCard on Product {
      id
      handle
      title
      vendor
      availableForSale
      featuredImage {
        ...Image
      }
      priceRange {
        minVariantPrice {
          ...Money
        }
        maxVariantPrice {
          ...Money
        }
      }
      compareAtPriceRange {
        minVariantPrice {
          ...Money
        }
      }
    }
  `,
  [imageFragment, moneyFragment],
)

export type ProductCardData = FragmentOf<typeof productCardFragment>
