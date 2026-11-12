import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const PRODUCT = '/products/men-crewneck'

// Server-rendered controls do nothing until React has hydrated the page.
const hydrated = (page: Page) =>
  page.waitForFunction(() => {
    const main = document.querySelector('main')
    return main !== null && Object.keys(main).some((key) => key.startsWith('__reactFiber'))
  })

const amount = (text: string | null) => Number((text ?? '').replace(/[^\d.]/g, ''))

const addCrewneckToCart = async (page: Page) => {
  await page.goto(`${PRODUCT}?Size=Medium&Color=Ocean`)
  await hydrated(page)
  await page.getByRole('button', { name: 'Add to cart' }).click()
  const drawer = page.getByRole('dialog', { name: /^Cart/ })
  await expect(drawer).toBeVisible()
  return drawer
}

test('home shows the shop and its products', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('main').locator('a[href^="/products/"]').first()).toBeVisible()
})

test('collection shows a grid and sorting updates the URL', async ({ page }) => {
  await page.goto('/collections/men')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const products = page.getByRole('main').locator('a[href^="/products/"]')
  await expect(products.first()).toBeVisible()

  await hydrated(page)
  const sort = page.getByLabel('Sort by')
  await sort.focus()
  await sort.selectOption('price-desc')
  await expect(page).toHaveURL(/sort=price-desc/)
  await expect(products.first()).toBeVisible()
  // The control must survive the navigation, or keyboard users lose their place.
  await expect(sort).toBeFocused()
  await expect(sort).toHaveValue('price-desc')
})

test('a stale pagination cursor falls back to the first page', async ({ page }) => {
  const response = await page.goto('/collections/men?after=bogus')
  expect(response?.status()).toBe(200)
  await expect(page.getByRole('main').locator('a[href^="/products/"]').first()).toBeVisible()
})

test('picking a variant gives it its own URL', async ({ page }) => {
  await page.goto(PRODUCT)
  await hydrated(page)

  const size = page.getByRole('group', { name: /^Size/ })
  const colour = page.getByRole('group', { name: /^Color/ })
  await size.getByRole('link', { name: 'Medium', exact: true }).click()
  await expect(page).toHaveURL(/Size=Medium/)
  await expect(size.getByRole('link', { name: 'Medium', exact: true })).toHaveAttribute('aria-current', /true|page/)
  await colour.getByRole('link', { name: 'Ocean', exact: true }).click()
  await expect(page).toHaveURL(/Size=Medium/)
  await expect(page).toHaveURL(/Color=Ocean/)

  await expect(size.getByRole('link', { name: 'Medium', exact: true })).toHaveAttribute('aria-current', /true|page/)
  await expect(colour.getByRole('link', { name: 'Ocean', exact: true })).toHaveAttribute('aria-current', /true|page/)
  await expect(size.getByRole('link', { name: 'Small', exact: true })).not.toHaveAttribute('aria-current')
})

test('cart: add a variant, change quantity, remove', async ({ page, context }) => {
  const drawer = await addCrewneckToCart(page)
  await expect(drawer).toContainText('Medium')
  await expect(drawer).toContainText('Ocean')

  const drawerCheckout = drawer.getByRole('link', { name: 'Checkout' })
  await expect(drawerCheckout).toHaveAttribute('href', /^https:\/\/.+/)
  const checkoutUrl = await drawerCheckout.getAttribute('href')

  const cookie = (await context.cookies()).find((entry) => entry.name === 'cart')
  expect(cookie?.httpOnly).toBe(true)
  expect(cookie?.sameSite).toBe('Lax')

  await drawer.getByRole('link', { name: 'View cart' }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await expect(drawer).toBeHidden()

  const items = page.getByRole('region', { name: 'Items in your cart' })
  await expect(items.getByRole('listitem')).toHaveCount(1)
  await expect(items).toContainText('Medium')
  await expect(items).toContainText('Ocean')

  const summary = page.getByRole('region', { name: 'Summary' })
  await expect(summary.getByRole('link', { name: 'Checkout' })).toHaveAttribute('href', checkoutUrl ?? '')

  const subtotal = summary.getByRole('definition').first()
  const quantity = items.getByRole('group', { name: /^Quantity of/ })
  await expect(quantity).toContainText('Quantity 1')
  const before = amount(await subtotal.textContent())
  expect(before).toBeGreaterThan(0)

  const saved = page.waitForResponse((response) => response.url().includes('/_serverFn/') && response.request().method() === 'POST')
  await items.getByRole('button', { name: /^Increase quantity of/ }).click()
  await expect(quantity).toContainText('Quantity 2')
  await expect.poll(async () => amount(await subtotal.textContent())).toBe(before * 2)

  // A reload once the change is saved proves the server agrees with the optimistic state.
  await saved
  await page.reload()
  await expect(quantity).toContainText('Quantity 2')

  await hydrated(page)
  await items.getByRole('button', { name: "Remove Men's Crewneck, Medium / Ocean" }).click()
  await expect(page.getByRole('main').getByText('Your cart is empty.')).toBeVisible()
  expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe('BODY')
})

test('cart drawer closes on Escape and returns focus', async ({ page }) => {
  await page.goto('/')
  const cartLink = page.getByRole('banner').getByRole('link', { name: /^Cart/ })
  await expect(async () => {
    await cartLink.click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('dialog', { name: /^Cart/ })).toBeVisible({ timeout: 2_000 })
  }).toPass()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: /^Cart/ })).toBeHidden()
  await expect(cartLink).toBeFocused()
})

test('a missing product is a real 404', async ({ request }) => {
  const response = await request.get('/products/this-product-does-not-exist')
  expect(response.status()).toBe(404)
})

test('robots.txt and sitemap.xml are served', async ({ request }) => {
  const robots = await request.get('/robots.txt')
  expect(robots.status()).toBe(200)
  expect(robots.headers()['content-type']).toContain('text/plain')
  expect(await robots.text()).toContain('Sitemap:')

  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.status()).toBe(200)
  expect(sitemap.headers()['content-type']).toContain('xml')
  expect(await sitemap.text()).toContain('<sitemapindex')
})
