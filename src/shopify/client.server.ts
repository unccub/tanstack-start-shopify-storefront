import { print } from '@0no-co/graphql.web'
import type { DocumentNode } from '@0no-co/graphql.web'
import { getRequest, getRequestIP } from '@tanstack/react-start/server'
import { isMockShop, storefrontApiUrl, storefrontConfig } from '~/config'
import { getPrivateStorefrontToken } from './env.server'
import { StorefrontApiError } from './errors'
import type { StorefrontGraphQLError } from './errors'
import type { TadaDocumentNode } from './graphql'

type RequestOptions = {
  // False for requests no buyer triggered, such as the sitemap: the buyer IP is left out.
  buyer?: boolean
}

type GraphQLResponse<TResult> = {
  data?: TResult | null
  errors?: ReadonlyArray<StorefrontGraphQLError>
  extensions?: { cost?: { requestedQueryCost?: number } }
}

export const inContext = {
  country: storefrontConfig.country,
  language: storefrontConfig.language,
} as const

const printed = new WeakMap<object, string>()

const toQueryString = (document: DocumentNode) => {
  const cached = printed.get(document)
  if (cached) return cached
  const query = print(document)
  printed.set(document, query)
  return query
}

const getBuyerIp = () => {
  try {
    const headers = getRequest().headers
    return (
      headers.get('x-nf-client-connection-ip') ??
      headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      getRequestIP({ xForwardedFor: true })
    )
  } catch {
    return undefined
  }
}

const buildHeaders = (buyer: boolean) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  // mock.shop answers 401 to any private token, so it never gets one.
  const token = isMockShop ? undefined : getPrivateStorefrontToken()
  if (!token) return headers

  headers['Shopify-Storefront-Private-Token'] = token
  const ip = buyer ? getBuyerIp() : undefined
  if (ip) headers['Shopify-Storefront-Buyer-IP'] = ip
  return headers
}

const operationName = (document: DocumentNode) => {
  const definition = document.definitions.find((node) => node.kind === 'OperationDefinition')
  return definition && 'name' in definition ? definition.name?.value : undefined
}

const TIMEOUT_MS = 10_000
const PUBLIC_MESSAGE = 'The store could not be reached.'

// Error text can end up in the page, so production builds log the detail and pass on a plain message.
const failure = (detail: string, status: number, errors: ReadonlyArray<StorefrontGraphQLError> = []) => {
  if (!import.meta.env.PROD) return new StorefrontApiError(detail, status, errors)
  console.error(`[storefront] ${detail}`)
  return new StorefrontApiError(
    PUBLIC_MESSAGE,
    status,
    errors.map((error) => ({ message: PUBLIC_MESSAGE, extensions: { code: error.extensions?.code } })),
  )
}

const send = async (body: string, buyer: boolean) => {
  try {
    return await fetch(storefrontApiUrl, {
      method: 'POST',
      headers: buildHeaders(buyer),
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError'
    throw timedOut
      ? failure(`Storefront API did not answer within ${TIMEOUT_MS / 1000} seconds`, 504)
      : failure(`Storefront API request failed: ${error instanceof Error ? error.message : 'unknown error'}`, 502)
  }
}

export const storefront = async <TResult, TVariables>(
  document: TadaDocumentNode<TResult, TVariables>,
  variables: TVariables,
  { buyer = true }: RequestOptions = {},
): Promise<TResult> => {
  const response = await send(JSON.stringify({ query: toQueryString(document), variables }), buyer)

  if (!response.ok) {
    throw failure(`Storefront API responded with ${response.status}`, response.status)
  }

  const body = (await response.json()) as GraphQLResponse<TResult>

  if (process.env.STOREFRONT_LOG_COST) {
    console.info(`[storefront] ${operationName(document) ?? 'anonymous'} cost ${body.extensions?.cost?.requestedQueryCost ?? 'n/a'}`)
  }

  // GraphQL errors arrive with HTTP 200.
  if (body.errors?.length) {
    throw failure(body.errors.map((error) => error.message).join(' '), response.status, body.errors)
  }
  if (!body.data) {
    throw failure('Storefront API returned no data', response.status)
  }
  return body.data
}
