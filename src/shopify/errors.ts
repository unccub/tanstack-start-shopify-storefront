export type StorefrontGraphQLError = {
  message: string
  extensions?: { code?: string }
}

export type StorefrontUserError = {
  field?: ReadonlyArray<string> | null
  message: string
  code?: string | null
}

export class StorefrontApiError extends Error {
  readonly status: number
  readonly graphqlErrors: ReadonlyArray<StorefrontGraphQLError>

  constructor(message: string, status: number, graphqlErrors: ReadonlyArray<StorefrontGraphQLError> = []) {
    super(message)
    this.name = 'StorefrontApiError'
    this.status = status
    this.graphqlErrors = graphqlErrors
  }

  get code() {
    return this.graphqlErrors[0]?.extensions?.code
  }
}
