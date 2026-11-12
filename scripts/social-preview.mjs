// Builds the storefront, serves it and captures the home page as .github/social-preview.png (1280x640).
//   npm run social-preview
import { spawn, spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const output = join(root, '.github', 'social-preview.png')

const portFlag = process.argv.indexOf('--port')
const port = Number(portFlag > -1 ? process.argv[portFlag + 1] : 3000)
const origin = `http://localhost:${port}`

if (!process.argv.includes('--no-build')) {
  console.log('Building…')
  const build = spawnSync('npm', ['run', 'build'], { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] })
  if (build.status !== 0) process.exit(build.status ?? 1)
}

const server = spawn(process.execPath, [join(root, 'scripts', 'serve.mjs'), '--port', String(port)], {
  cwd: root,
  stdio: ['ignore', 'ignore', 'inherit'],
})
process.on('exit', () => server.kill())

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

const capture = async () => {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 640 },
      deviceScaleFactor: 1,
      colorScheme: 'light',
      reducedMotion: 'reduce',
    })
    await page.goto(origin, { waitUntil: 'networkidle' })
    // Lazy images in view only start once laid out, so wait for every visible one to finish.
    await page.waitForFunction(() =>
      [...document.images]
        .filter((image) => image.getBoundingClientRect().top < window.innerHeight)
        .every((image) => image.complete && image.naturalWidth > 0),
    )
    await page.screenshot({ path: output, type: 'png' })
  } finally {
    await browser.close()
  }
}

try {
  await waitForServer()
  await capture()
  console.log(`Saved ${output}`)
} finally {
  server.kill()
}
