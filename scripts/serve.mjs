// Serves the production build on plain Node: static files from dist/client, everything else through the
// server entry, compressed as a CDN would. Nothing is cached, so every page waits for the Storefront API.
// For local checks and Lighthouse; Netlify does this job in production.
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, resolve, sep } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { constants, createBrotliCompress, createGzip } from 'node:zlib'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const clientDir = join(root, 'dist', 'client')
const serverEntry = join(root, 'dist', 'server', 'server.js')

const portFlag = process.argv.indexOf('--port')
const port = Number(portFlag > -1 ? process.argv[portFlag + 1] : (process.env.PORT ?? 3000))

if (!existsSync(serverEntry)) {
  console.error('No production build found. Run `npm run build` first.')
  process.exit(1)
}

const { default: server } = await import(pathToFileURL(serverEntry).href)

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2',
}

const isCompressible = (type) => /^(text\/|application\/(json|xml|javascript|ld\+json)|image\/svg\+xml)/.test(type ?? '')

const pickEncoding = (accept = '') => (/\bbr\b/.test(accept) ? 'br' : /\bgzip\b/.test(accept) ? 'gzip' : null)

const compressor = (encoding) =>
  encoding === 'br'
    ? createBrotliCompress({ params: { [constants.BROTLI_PARAM_QUALITY]: 5 }, flush: constants.BROTLI_OPERATION_FLUSH })
    : createGzip({ flush: constants.Z_SYNC_FLUSH })

const send = async (req, res, status, headers, body) => {
  const encoding = isCompressible(headers['content-type']) && !headers['content-encoding'] ? pickEncoding(req.headers['accept-encoding']) : null
  if (encoding) {
    headers['content-encoding'] = encoding
    headers.vary = headers.vary ? `${headers.vary}, Accept-Encoding` : 'Accept-Encoding'
    delete headers['content-length']
  }
  res.writeHead(status, headers)
  if (!body || req.method === 'HEAD') return void res.end()
  await (encoding ? pipeline(body, compressor(encoding), res) : pipeline(body, res))
}

const decodePath = (pathname) => {
  try {
    return decodeURIComponent(pathname)
  } catch {
    return null
  }
}

const staticFile = (pathname) => {
  const file = resolve(clientDir, `.${pathname}`)
  if (!file.startsWith(clientDir + sep) || !existsSync(file) || !statSync(file).isFile()) return null
  return file
}

const toRequest = (req) => {
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  const headers = new Headers()
  for (const [name, value] of Object.entries(req.headers)) {
    for (const entry of Array.isArray(value) ? value : [value]) if (entry !== undefined) headers.append(name, entry)
  }
  return new Request(`http://${req.headers.host ?? `localhost:${port}`}${req.url}`, {
    method: req.method,
    headers,
    body: hasBody ? Readable.toWeb(req) : undefined,
    duplex: hasBody ? 'half' : undefined,
  })
}

const handle = async (req, res) => {
  const pathname = decodePath(new URL(req.url ?? '/', 'http://localhost').pathname)
  if (pathname === null) {
    res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' })
    return void res.end('Bad request')
  }
  const file = pathname === '/' ? null : staticFile(pathname)

  if (file) {
    const headers = {
      'content-type': contentTypes[extname(file)] ?? 'application/octet-stream',
      // Files under /assets carry a content hash in their name.
      'cache-control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
    }
    return send(req, res, 200, headers, createReadStream(file))
  }

  const response = await server.fetch(toRequest(req))
  const headers = {}
  response.headers.forEach((value, name) => {
    if (name !== 'set-cookie') headers[name] = value
  })
  const cookies = response.headers.getSetCookie()
  if (cookies.length > 0) headers['set-cookie'] = cookies
  return send(req, res, response.status, headers, response.body ? Readable.fromWeb(response.body) : null)
}

const ABORTED = new Set(['ERR_STREAM_PREMATURE_CLOSE', 'ERR_STREAM_UNABLE_TO_PIPE', 'ECONNRESET', 'ABORT_ERR'])

createServer((req, res) => {
  handle(req, res).catch((error) => {
    // A browser that goes away mid-response is not an error worth a stack trace.
    if (ABORTED.has(error?.code) || req.destroyed) return void res.destroy()
    console.error(error)
    if (!res.headersSent) res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('Internal server error')
  })
}).listen(port, () => console.log(`Production build on http://localhost:${port}`))
