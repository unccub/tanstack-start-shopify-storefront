// An allowlist sanitiser for HTML written in the Shopify admin. Nothing from the input is passed
// through as markup: allowed tags are rebuilt from scratch and everything else becomes text.

const ALLOWED_TAGS = new Set([
  'a', 'abbr', 'b', 'blockquote', 'br', 'caption', 'code', 'dd', 'del', 'div', 'dl', 'dt', 'em',
  'figcaption', 'figure', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'ins', 'li', 'mark', 'ol',
  'p', 'pre', 'q', 's', 'small', 'span', 'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'tfoot',
  'th', 'thead', 'tr', 'u', 'ul',
])

const VOID_TAGS = new Set(['br', 'hr', 'img'])

// Removed together with everything inside them.
const DROPPED_WITH_CONTENT = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template', 'svg', 'math', 'form',
  'select', 'textarea', 'button', 'title', 'head', 'video', 'audio',
])

const ALLOWED_ATTRIBUTES: Record<string, ReadonlyArray<string>> = {
  a: ['href', 'title'],
  img: ['src', 'alt', 'width', 'height'],
  td: ['colspan', 'rowspan'],
  th: ['colspan', 'rowspan', 'scope'],
  ol: ['start'],
}

// Far beyond any real description. Longer input is cut, which bounds the work a malformed one can cause.
const MAX_LENGTH = 200_000
// A tag's attributes are capped too, so an unclosed tag cannot make every later "<" rescan the rest.
const TOKEN = /<!--[\s\S]*?(?:-->|$)|<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*'){0,500})>|<|[^<]+/g
const ATTRIBUTE = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
const ENTITY = /&(?:[a-zA-Z][a-zA-Z0-9]*|#\d+|#x[0-9a-fA-F]+);/y

const escapeText = (text: string) => {
  let output = ''
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '<') output += '&lt;'
    else if (character === '>') output += '&gt;'
    else if (character === '&') {
      ENTITY.lastIndex = index
      output += ENTITY.test(text) ? '&' : '&amp;'
    } else output += character
  }
  return output
}

const escapeAttribute = (value: string) => escapeText(value).replace(/"/g, '&quot;')

const decodeEntities = (value: string) =>
  value
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16) || 0xfffd))
    .replace(/&#(\d+);?/g, (_, decimal: string) => String.fromCodePoint(Number.parseInt(decimal, 10) || 0xfffd))
    .replace(/&(colon|tab|newline|amp);?/gi, (_, name: string) =>
      ({ colon: ':', tab: '\t', newline: '\n', amp: '&' })[name.toLowerCase()] ?? '',
    )

// Control, space and zero-width characters that browsers ignore inside a URL scheme.
const isInvisible = (code: number) =>
  code <= 0x20 || (code >= 0x7f && code <= 0x9f) || (code >= 0x200b && code <= 0x200f) || code === 0x2028 || code === 0x2029 || code === 0xfeff

const isSafeUrl = (value: string, allowed: ReadonlyArray<string>) => {
  let decoded: string
  try {
    decoded = decodeEntities(value)
  } catch {
    return false
  }
  const compact = [...decoded].filter((character) => !isInvisible(character.codePointAt(0) ?? 0)).join('').toLowerCase()
  const scheme = /^([a-z][a-z0-9+.-]*):/.exec(compact)?.[1]
  return scheme ? allowed.includes(scheme) : true
}

const buildAttributes = (tag: string, source: string) => {
  const allowed = ALLOWED_ATTRIBUTES[tag]
  if (!allowed) return ''
  const seen = new Set<string>()
  let output = ''
  for (const match of source.matchAll(ATTRIBUTE)) {
    const name = match[1]?.toLowerCase()
    const value = match[2] ?? match[3] ?? match[4] ?? ''
    if (!name || !allowed.includes(name) || seen.has(name)) continue
    if (name === 'href' && !isSafeUrl(value, ['http', 'https', 'mailto', 'tel'])) continue
    if (name === 'src' && !isSafeUrl(value, ['http', 'https'])) continue
    if (['width', 'height', 'colspan', 'rowspan', 'start'].includes(name) && !/^\d{1,5}$/.test(value)) continue
    seen.add(name)
    output += ` ${name}="${escapeAttribute(value)}"`
  }
  if (tag === 'img') {
    if (!seen.has('src')) return null
    if (!seen.has('alt')) output += ' alt=""'
    output += ' loading="lazy" decoding="async"'
  }
  return output
}

const closers = new Map<string, RegExp>()

const closerFor = (tag: string) => {
  const existing = closers.get(tag)
  if (existing) return existing
  const created = new RegExp(`</${tag}`, 'gi')
  closers.set(tag, created)
  return created
}

export const sanitiseHtml = (input: string) => {
  const capped = input.length > MAX_LENGTH ? input.slice(0, MAX_LENGTH) : input
  // Nothing after the last ">" can be a tag, so it is handled as text without the tag pattern trying each "<".
  const lastClose = capped.lastIndexOf('>')
  const html = capped.slice(0, lastClose + 1)
  const tail = capped.slice(lastClose + 1)
  const open: Array<string> = []
  let output = ''
  let droppedToEnd = false
  TOKEN.lastIndex = 0

  for (let match = TOKEN.exec(html); match; match = TOKEN.exec(html)) {
    const [token, closing, rawName, attributes = ''] = match
    if (token.startsWith('<!--')) continue
    if (!rawName) {
      output += escapeText(token)
      continue
    }

    const lowered = rawName.toLowerCase()
    // A second h1 would compete with the page heading.
    const tag = lowered === 'h1' ? 'h2' : lowered

    if (DROPPED_WITH_CONTENT.has(tag)) {
      if (closing) continue
      const closer = closerFor(tag)
      closer.lastIndex = TOKEN.lastIndex
      const end = closer.exec(html)
      if (!end) {
        droppedToEnd = true
        break
      }
      TOKEN.lastIndex = end.index
      continue
    }
    if (!ALLOWED_TAGS.has(tag)) continue

    if (closing) {
      const position = open.lastIndexOf(tag)
      if (position === -1) continue
      while (open.length > position) output += `</${open.pop()}>`
      continue
    }

    const built = buildAttributes(tag, attributes)
    if (built === null) continue
    output += `<${tag}${built}>`
    if (!VOID_TAGS.has(tag)) open.push(tag)
  }

  if (!droppedToEnd) {
    const comment = tail.indexOf('<!--')
    output += escapeText(comment === -1 ? tail : tail.slice(0, comment))
  }
  while (open.length > 0) output += `</${open.pop()}>`
  return output
}
