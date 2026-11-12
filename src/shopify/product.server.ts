import { inContext, storefront } from './client.server'
import { imageFragment, moneyFragment, productCardFragment, productVariantFragment } from './fragments'
import { graphql } from './graphql'
import { sanitiseHtml } from './sanitise'
import type { ProductCardData, ProductDetail, ProductOption, ProductVariantData, SelectedOption } from './types'

const productQuery = graphql(
  `
    query Product($handle: String!, $selectedOptions: [SelectedOptionInput!]!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
      product(handle: $handle) {
        id
        handle
        title
        vendor
        description
        descriptionHtml
        availableForSale
        updatedAt
        seo {
          title
          description
        }
        featuredImage {
          ...Image
        }
        images(first: 20) {
          nodes {
            ...Image
          }
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
          maxVariantPrice {
            ...Money
          }
        }
        options {
          name
          optionValues {
            name
            swatch {
              color
            }
            firstSelectableVariant {
              ...ProductVariant
            }
          }
        }
        selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
          ...ProductVariant
        }
        adjacentVariants(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
          ...ProductVariant
        }
      }
    }
  `,
  [imageFragment, moneyFragment, productVariantFragment],
)

const recommendationsQuery = graphql(
  `
    query ProductRecommendations($handle: String!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
      productRecommendations(productHandle: $handle, intent: RELATED) {
        ...ProductCard
      }
    }
  `,
  [productCardFragment],
)

const matches = (variant: ProductVariantData, selection: ReadonlyArray<SelectedOption>) =>
  selection.every((wanted) => variant.selectedOptions.some((option) => option.name === wanted.name && option.value === wanted.value))

type RawOption = {
  name: string
  optionValues: Array<{
    name: string
    swatch: { color: string | null } | null
    firstSelectableVariant: ProductVariantData | null
  }>
}

const buildOptions = (
  options: ReadonlyArray<RawOption>,
  selectedVariant: ProductVariantData | null,
  adjacentVariants: ReadonlyArray<ProductVariantData>,
): Array<ProductOption> => {
  const current = selectedVariant?.selectedOptions ?? []
  const known = selectedVariant ? [selectedVariant, ...adjacentVariants] : [...adjacentVariants]

  return options.map((option) => ({
    name: option.name,
    values: option.optionValues.map((value) => {
      const wanted = current.some((entry) => entry.name === option.name)
        ? current.map((entry) => (entry.name === option.name ? { name: option.name, value: value.name } : entry))
        : [...current, { name: option.name, value: value.name }]
      const exact = known.find((variant) => matches(variant, wanted))
      // No variant with this exact mix: fall back to one that has the value, which moves the other options.
      const target = exact ?? value.firstSelectableVariant

      return {
        name: value.name,
        swatchColor: value.swatch?.color ?? null,
        selected: current.some((entry) => entry.name === option.name && entry.value === value.name),
        exists: Boolean(exact),
        available: target?.availableForSale ?? false,
        selectedOptions: target ? target.selectedOptions : wanted,
      }
    }),
  }))
}

type ProductInput = {
  handle: string
  selectedOptions: Array<SelectedOption>
}

export const fetchProduct = async ({ handle, selectedOptions }: ProductInput): Promise<ProductDetail | null> => {
  const data = await storefront(productQuery, { handle, selectedOptions, ...inContext })
  const product = data.product
  if (!product) return null

  const selectedVariant = product.selectedOrFirstAvailableVariant
  const firstOption = product.options[0]

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    vendor: product.vendor,
    description: product.description,
    descriptionHtml: sanitiseHtml(product.descriptionHtml),
    availableForSale: product.availableForSale,
    updatedAt: product.updatedAt,
    seo: { title: product.seo.title, description: product.seo.description },
    featuredImage: product.featuredImage,
    images: product.images.nodes,
    priceRange: product.priceRange,
    compareAtPriceRange: product.compareAtPriceRange,
    hasOnlyDefaultVariant: product.options.length === 1 && firstOption?.name === 'Title' && firstOption.optionValues.length === 1,
    options: buildOptions(product.options, selectedVariant, product.adjacentVariants),
    selectedVariant,
  }
}

export const fetchProductRecommendations = async (handle: string): Promise<Array<ProductCardData>> => {
  const data = await storefront(recommendationsQuery, { handle, ...inContext })
  return data.productRecommendations ?? []
}
