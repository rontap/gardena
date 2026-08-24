import { expect, type Page } from '@playwright/test'

export const TILE = 48
export const CAM_X = 15.5
export const CAM_Y = 9.5

export async function gotoPlay(page: Page, opts?: { unlock?: boolean; speed?: number }): Promise<void> {
  const q = opts?.speed !== undefined ? `?speed=${opts.speed}` : ''
  const hash = opts?.unlock === true ? '#unlockall' : '#start_now'
  await page.goto(`/${q}${hash}`)
  await expect(page.locator('svg.bg-grass')).toBeVisible()
}

export function hudMoney(page: Page) {
  return page.locator('[data-hud-money] span').last()
}

export function moneyValue(text: string | null): number {
  if (text === null) throw new Error('money')
  return Number(text.trim())
}

export async function unlockWorld(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = (window as unknown as { __world?: { unlockAll: () => void } }).__world
    if (w === undefined) throw new Error('no __world')
    w.unlockAll()
  })
}

async function svgBox(page: Page) {
  const box = await page.locator('svg.bg-grass').boundingBox()
  if (box === null) throw new Error('map svg')
  return box
}

export async function screenOf(page: Page, wx: number, wy: number) {
  const b = await svgBox(page)
  return {
    x: b.x + b.width / 2 + (wx - CAM_X) * TILE,
    y: b.y + b.height / 2 + (wy - CAM_Y) * TILE,
  }
}

export async function hoverWorld(page: Page, wx: number, wy: number) {
  const p = await screenOf(page, wx, wy)
  await page.mouse.move(p.x, p.y)
}

export async function tapWorld(page: Page, wx: number, wy: number) {
  const p = await screenOf(page, wx, wy)
  await page.mouse.move(p.x, p.y)
  await page.mouse.down()
  await page.mouse.up()
}

export async function closeDock(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Close' }).click()
}

export async function openShop(page: Page): Promise<void> {
  const dock = page.getByText('General store')
  if (await dock.isVisible()) return
  await page.getByRole('button', { name: 'Shop', exact: true }).click()
  await expect(dock).toBeVisible({ timeout: 10_000 })
}

export async function openBuild(page: Page): Promise<void> {
  const title = page.locator('div.font-display').filter({ hasText: /^Build$/ })
  if (await title.isVisible()) return
  await page.getByRole('button', { name: 'Build', exact: true }).click()
  await expect(title).toBeVisible({ timeout: 10_000 })
}

export async function armSku(
  page: Page,
  sku: string | RegExp,
  tab: 'Water' | 'Vehicles' = 'Water',
): Promise<void> {
  await openBuild(page)
  await page.getByRole('tab', { name: tab }).click()
  const name = typeof sku === 'string' ? skuName(sku) : sku
  await page.getByRole('button', { name }).click()
}

function skuName(sku: string): RegExp {
  const m = sku.match(/^(.*) (\d+)$/)
  if (m === null) return new RegExp(sku)
  return new RegExp(`^${m[1]}(?: placing)? ${m[2]}$`)
}
