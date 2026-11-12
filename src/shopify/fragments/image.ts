import { graphql } from '../graphql'
import type { FragmentOf } from '../graphql'

export const imageFragment = graphql(`
  fragment Image on Image {
    url
    altText
    width
    height
  }
`)

export type ImageData = FragmentOf<typeof imageFragment>
