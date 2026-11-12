import { graphql } from '../graphql'
import type { FragmentOf } from '../graphql'
import { imageFragment } from './image'

export const collectionCardFragment = graphql(
  `
    fragment CollectionCard on Collection {
      id
      handle
      title
      description
      image {
        ...Image
      }
    }
  `,
  [imageFragment],
)

export type CollectionCardData = FragmentOf<typeof collectionCardFragment>
