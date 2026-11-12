import { storefrontConfig } from '../storefront.config'

const MOCK_SHOP_API = 'https://mock.shop/api'

const stripProtocol = (domain: string) => domain.replace(/^https?:\/\//, '').replace(/\/+$/, '')

export const isMockShop = storefrontConfig.storeDomain === ''

export const storefrontApiUrl = isMockShop
  ? MOCK_SHOP_API
  : `https://${stripProtocol(storefrontConfig.storeDomain)}/api/${storefrontConfig.apiVersion}/graphql.json`

export const noindex = import.meta.env.PUBLIC_NOINDEX === 'true'

export const siteUrl = import.meta.env.PUBLIC_SITE_URL.replace(/\/+$/, '')

export const absoluteUrl = (path = '/') => `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`

export const htmlLang = storefrontConfig.language.toLowerCase().replace('_', '-')

export const locale = `${htmlLang}-${storefrontConfig.country}`

export { storefrontConfig }
