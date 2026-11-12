// Builds the storefront, serves the production build and runs Lighthouse (mobile, default throttling)
// on the home page, one collection and one product.
//   npm run lighthouse -- --runs 3
// The build is made with PUBLIC_NOINDEX off, because a noindex page fails the SEO audit by design.
import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const reportDir = join(root, '.lighthouse')

const flag = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`)
  return index > -1 ? process.argv[index + 1] : fallback
}

const runs = Math.max(1, Number(flag('runs', 1)))
const port = Number(flag('port', 3000))
const origin = `http://localhost:${port}`

const pages = [
  { name: 'home', path: '/' },
  { name: 'collection', path: '/collections/men' },
  { name: 'product', path: '/products/men-crewneck' },
]

const categories = ['performance', 'accessibility', 'best-practices', 'seo']
const minimum = { performance: 98, accessibility: 100, 'best-practices': 100, seo: 100 }

if (process.env.PUBLIC_NOINDEX === 'true') {
  console.log('PUBLIC_NOINDEX=true is ignored for this run: a noindex page fails the SEO audit by design.')
}

// The canonical URLs must match the address Lighthouse visits.
const buildEnv = { ...process.env, PUBLIC_NOINDEX: '', PUBLIC_SITE_URL: origin }

if (!process.argv.includes('--no-build')) {
  console.log('Building…')
  const build = spawnSync('npm', ['run', 'build'], { cwd: root, env: buildEnv, stdio: ['ignore', 'ignore', 'inherit'] })
  if (build.status !== 0) process.exit(build.status ?? 1)
}

const server = spawn(process.execPath, [join(root, 'scripts', 'serve.mjs'), '--port', String(port)], {
  cwd: root,
  env: buildEnv,
  stdio: ['ignore', 'ignore', 'inherit'],
})

const stop = () => server.kill()
process.on('exit', stop)

const sleep = (ms) => new Promise((done) => setTimeout(done, ms))

const waitForServer = async () => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      if ((await fetch(`${origin}/robots.txt`)).ok) return
    } catch {
      // Not listening yet.
    }
    await sleep(200)
  }
  throw new Error(`The server did not start on ${origin}`)
}

const audit = async (page, run) => {
  const chrome = await launch({ chromeFlags: ['--headless=new', '--no-first-run', '--disable-extensions'] })
  try {
    const result = await lighthouse(`${origin}${page.path}`, {
      port: chrome.port,
      output: ['json', 'html'],
      onlyCategories: categories,
      logLevel: 'error',
    })
    if (!result) throw new Error(`Lighthouse returned nothing for ${page.path}`)
    const [json, html] = result.report
    writeFileSync(join(reportDir, `${page.name}-run${run}.report.json`), json)
    writeFileSync(join(reportDir, `${page.name}-run${run}.report.html`), html)

    const scores = Object.fromEntries(categories.map((id) => [id, Math.round((result.lhr.categories[id]?.score ?? 0) * 100)]))
    const failed = categories.flatMap((id) =>
      scores[id] >= minimum[id]
        ? []
        : (result.lhr.categories[id]?.auditRefs ?? [])
            .filter((ref) => ref.weight > 0 || id !== 'performance')
            .map((ref) => result.lhr.audits[ref.id])
            .filter((entry) => entry && entry.score !== null && entry.score < (id === 'performance' ? 0.9 : 1))
            .map((entry) => `${id}: ${entry.id}${entry.displayValue ? ` (${entry.displayValue})` : ''}`),
    )
    return { scores, failed }
  } finally {
    chrome.kill()
  }
}

await waitForServer()
rmSync(reportDir, { recursive: true, force: true })
mkdirSync(reportDir, { recursive: true })

// One request per page first, so the run measures a warm server rather than its first module load.
await Promise.all(pages.map((page) => fetch(`${origin}${page.path}`).then((response) => response.text())))

const rows = []
let passed = true

for (let run = 1; run <= runs; run += 1) {
  for (const page of pages) {
    const { scores, failed } = await audit(page, run)
    const ok = categories.every((id) => scores[id] >= minimum[id])
    passed &&= ok
    rows.push({ run, page: page.path, ...scores, result: ok ? 'pass' : 'FAIL' })
    for (const line of failed) console.log(`  run ${run} ${page.path} · ${line}`)
  }
}

console.table(rows)
console.log(`Reports: ${reportDir}`)
console.log(`Thresholds: performance ${minimum.performance}, accessibility, best practices and SEO 100.`)
console.log('Pages are rendered on every request, with no CDN in front: each one waits for the Storefront API.')

stop()
process.exit(passed ? 0 : 1)
