import { expect, type Page } from '@playwright/test'

export const TILE = 48
export const CAM_X = 15.5
export const CAM_Y = 9.5

export async function waitPlay(page: Page): Promise<void> {
  await expect(page.getByRole('button', { name: 'Shop', exact: true })).toBeVisible({ timeout: 30_000 })
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const w = window as Window & { __view?: object; __world?: object }
          return w.__view !== undefined && w.__world !== undefined
        }),
      { timeout: 30_000 },
    )
    .toBe(true)
}

export async function gotoPlay(page: Page, opts?: { unlock?: boolean; speed?: number }): Promise<void> {
  const params = new URLSearchParams()
  if (opts?.speed !== undefined) params.set('speed', String(opts.speed))
  params.set('start', opts?.unlock === true ? 'unlock' : 'now')
  await page.goto(`/?${params.toString()}`, { waitUntil: 'domcontentloaded' })
  await waitPlay(page)
}

export async function dismissRecap(page: Page): Promise<void> {
  const recap = page.getByRole('button', { name: /^Day \d+$/ })
  if (await recap.isVisible({ timeout: 0 })) {
    await recap.click()
    await expect(recap).toHaveCount(0)
  }
  const resume = page.getByRole('button', { name: 'Resume' })
  if (await resume.isVisible({ timeout: 0 })) await resume.click()
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
  const box = await page.locator('.bg-grass').first().boundingBox()
  if (box === null) throw new Error('map host')
  return box
}

export async function screenOf(page: Page, wx: number, wy: number) {
  const b = await svgBox(page)
  const cam = await page.evaluate(() => {
    const v = (window as unknown as { __view?: { cam: { x: number; y: number; scale: number } } }).__view
    if (v === undefined) throw new Error('no __view')
    return v.cam
  })
  return {
    x: b.x + b.width / 2 + (wx - cam.x) * TILE * cam.scale,
    y: b.y + b.height / 2 + (wy - cam.y) * TILE * cam.scale,
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
  await dismissRecap(page)
  await page.getByRole('button', { name: 'Close' }).click()
}

export async function openShop(page: Page): Promise<void> {
  await dismissRecap(page)
  const seeds = page.getByRole('tab', { name: 'Seeds' })
  if (await seeds.isVisible()) return
  await page.getByRole('button', { name: 'Shop', exact: true }).click()
  await expect(seeds).toBeVisible({ timeout: 10_000 })
}

export async function openBuild(page: Page): Promise<void> {
  await dismissRecap(page)
  const water = page.getByRole('tab', { name: 'Water' })
  if (await water.isVisible()) return
  await page.getByRole('button', { name: 'Build', exact: true }).click()
  await expect(water).toBeVisible({ timeout: 10_000 })
}

export async function armSku(
  page: Page,
  sku: string,
  tab: 'Water' | 'Vehicles' | 'Processing' | 'Sensors' | 'Storage' | 'Land' = 'Water',
): Promise<void> {
  await openBuild(page)
  await page.getByRole('tab', { name: tab }).click()
  const btn = page.getByRole('button', { name: skuButton(sku) })
  await expect(btn).toBeVisible({ timeout: 10_000 })
  await btn.click()
}

function skuButton(sku: string): RegExp {
  const m = sku.match(/^(.*) (\d+)$/)
  if (m === null) return new RegExp(sku)
  return new RegExp(`^${m[1]}(?: placing)? ${m[2]}$`)
}
