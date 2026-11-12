// Close steps, so a phone is never sent much more than its screen can show.
const DEFAULT_WIDTHS = [160, 240, 320, 400, 480, 560, 640, 720, 800, 960, 1280, 1600, 2048] as const

// Shopify's CDN resizes on the `width` query parameter and picks the format from Accept.
export const shopifyImageUrl = (url: string, width: number) => {
  const size = String(Math.round(width))
  try {
    const parsed = new URL(url)
    parsed.searchParams.set('width', size)
    parsed.searchParams.delete('height')
    return parsed.toString()
  } catch {
    return `${url}${url.includes('?') ? '&' : '?'}width=${size}`
  }
}

type SrcSetOptions = {
  widths?: ReadonlyArray<number>
  // The image's intrinsic width: larger candidates would only be upscaled, so they are skipped.
  maxWidth?: number | null
}

export const shopifySrcSet = (url: string, { widths = DEFAULT_WIDTHS, maxWidth }: SrcSetOptions = {}) => {
  const candidates = maxWidth ? widths.filter((width) => width <= maxWidth) : [...widths]
  if (maxWidth && !candidates.includes(maxWidth) && maxWidth < Math.max(...widths)) candidates.push(maxWidth)
  if (candidates.length === 0) candidates.push(maxWidth ?? widths[0] ?? 640)
  return candidates.map((width) => `${shopifyImageUrl(url, width)} ${width}w`).join(', ')
}
