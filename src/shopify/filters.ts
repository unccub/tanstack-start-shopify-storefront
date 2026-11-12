import { z } from 'zod'

const metafieldFilter = z.object({ namespace: z.string(), key: z.string(), value: z.string() })

// One criterion per entry, as the Storefront API's ProductFilter input expects.
export const productFilterSchema = z
  .object({
    available: z.boolean(),
    price: z.object({ min: z.number().optional(), max: z.number().optional() }),
    variantOption: z.object({ name: z.string(), value: z.string() }),
    productType: z.string(),
    productVendor: z.string(),
    tag: z.string(),
    productMetafield: metafieldFilter,
    variantMetafield: metafieldFilter,
    taxonomyMetafield: metafieldFilter,
    category: z.object({ id: z.string() }),
  })
  .partial()
  .strict()

export type ProductFilterInput = z.infer<typeof productFilterSchema>

// Filter values travel in the URL as the JSON strings the API hands out; anything malformed is dropped.
export const parseProductFilters = (inputs: ReadonlyArray<string>) =>
  inputs.flatMap((input) => {
    try {
      const parsed = productFilterSchema.safeParse(JSON.parse(input))
      return parsed.success && Object.keys(parsed.data).length > 0 ? [parsed.data] : []
    } catch {
      return []
    }
  })
