import { initGraphQLTada } from 'gql.tada'
import type { introspection } from '../graphql-env.d.ts'

// Masking is off so components can take fragment results as plain props.
export const graphql = initGraphQLTada<{
  introspection: introspection
  disableMasking: true
  scalars: {
    Color: string
    DateTime: string
    Decimal: string
    HTML: string
    ISO8601DateTime: string
    JSON: string
    URL: string
    UnsignedInt64: string
  }
}>()

export type { FragmentOf, ResultOf, VariablesOf, TadaDocumentNode } from 'gql.tada'
