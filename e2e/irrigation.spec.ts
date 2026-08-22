import { expect, test, type Page } from '@playwright/test'
import { DAY_SECONDS } from '../src/game/sim/clock.ts'

const TILE = 48
const CAM_X = 15.5
const CAM_Y = 9.5

test.beforeEach(async ({ page }) => {
  await page.goto('/#start_now')
  await expect(page.locator('svg.bg-grass')).toBeVisible()
  await expect(hudMoney(page)).toHaveText('50')
})

test('hover outline', async ({ page }) => {
  const stroke = page.locator('[data-cell-stroke]')
  await hoverWorld(page, 12.5, 10.5)
  await expect(stroke).toHaveCount(1)
  await expect(stroke).toHaveClass(/stroke-ink/)
  await unlockAll(page)
  await armSku(page, 'Pipe 4')
  await hoverWorld(page, 12.5, 10.5)
  await expect(stroke).toHaveCount(1)
  await expect(stroke).toHaveClass(/stroke-ink/)
  await armSku(page, 'Sprinkler 15')
  await hoverWorld(page, 12.5, 10.5)
  await expect(stroke).toHaveCount(1)
  await expect(stroke).toHaveClass(/stroke-ink/)
  await page.getByRole('button', { name: 'Delete' }).click({ force: true })
  await hoverWorld(page, 12.5, 10.5)
  await expect(stroke).toHaveCount(1)
  await expect(stroke).toHaveClass(/stroke-ink/)
  await page.getByRole('button', { name: 'Almanac', exact: true }).hover()
  await expect(stroke).toHaveCount(0)
})

test('shop close exits pipe layer', async ({ page }) => {
  await unlockAll(page)
  await armSku(page, 'Pipe 4')
  await tapWorld(page, 18.5, 7)
  await hoverWorld(page, 12.5, 10.5)
  await expect(page.locator('[data-pipe]')).not.toHaveCount(0)
  await setPipesLens(page)
  await page.getByRole('button', { name: '×' }).click()
  await expectPipeLayerOff(page)
  await setPipesLens(page)
  await expect(page.locator('[data-pipe]')).not.toHaveCount(0)
  await openShop(page)
  await page.getByRole('button', { name: 'Shop', exact: true }).click()
  await expect(page.getByText('General store')).toHaveCount(0)
  await expectPipeLayerOff(page)
  await setPipesLens(page)
  await expect(page.locator('[data-pipe]')).not.toHaveCount(0)
  await openShop(page)
  await page.keyboard.press('Escape')
  await expectPipeLayerOff(page)
})

test('sprinkler place without pipes', async ({ page }) => {
  await unlockAll(page)
  const before = moneyValue(await hudMoney(page).textContent())
  await armSku(page, 'Sprinkler 15')
  await tapWorld(page, 19, 7)
  await expect(page.locator('[data-sprinkler]')).toHaveCount(1)
  await expect.poll(async () => moneyValue(await hudMoney(page).textContent())).toBe(before - 15)
})

test('pipe ghost is pipe art', async ({ page }) => {
  await unlockAll(page)
  await armSku(page, 'Pipe 4')
  await hoverWorld(page, 18.5, 7)
  const ghost = page.locator('[data-pipe-ghost]').first()
  await expect(ghost).toBeVisible()
  const html = await ghost.innerHTML()
  expect(html.includes('<rect')).toBe(true)
  expect(html.trim().startsWith('<line') && !html.includes('<rect')).toBe(false)
})

test('dry pipes', async ({ page }) => {
  await unlockAll(page)
  await armSku(page, 'Pipe 4')
  await tapWorld(page, 10.5, 20)
  await hoverWorld(page, 10.5, 20.5)
  const dry = page.locator('[data-pipe][data-wet="0"]').first()
  await expect(dry).toBeVisible()
  const html = await dry.innerHTML()
  expect(html.includes('#3d7ea6')).toBe(false)
})

test('connected sprinkler waters', async ({ page }) => {
  test.setTimeout(90_000)
  await unlockAll(page)
  await armSku(page, 'Pipe 4')
  await tapWorld(page, 18.5, 7)
  await armSku(page, 'Sprinkler 15')
  await tapWorld(page, 19, 7)
  await expect(page.locator('[data-sprinkler]')).toHaveCount(1)
  await page.keyboard.press('Escape')
  await tapWorld(page, 18.5, 6.5)
  await tapWorld(page, 15.5, 8.5)
  const inv = page.locator('div.font-medium').filter({ hasText: /^Inventory$/ })
  await expect(inv).toBeVisible({ timeout: 15_000 })
  await page.getByText('Carrot seed - 5, plant it').locator('..').getByRole('button').click()
  await inv.locator('..').getByRole('button', { name: '×' }).click()
  await expect(inv).toHaveCount(0)
  await tapWorld(page, 18.5, 6.5)
  await expect(page.locator('[data-queue-bar]')).toBeVisible()
  await expect(page.locator('[data-queue-bar]')).toHaveCount(0, { timeout: 15_000 })
  await hoverWorld(page, 18.5, 6.5)
  await expect(page.getByText(/Carrot - growing/)).toBeVisible()
  const t0 = await remaining(page)
  await expect
    .poll(async () => t0 - (await remaining(page)), { timeout: 80_000 })
    .toBeGreaterThanOrEqual(31)
  await hoverWorld(page, 18.5, 6.5)
  await expect(page.getByText(/Carrot - growing/)).toBeVisible()
  await expect(page.locator('[data-thirst="18,6"]')).toHaveCount(0)
})

function hudMoney(page: Page) {
  return page.locator('[data-hud-money] span').last()
}

function moneyValue(text: string | null): number {
  if (text === null) throw new Error('money')
  return Number(text.trim())
}

async function svgBox(page: Page) {
  const box = await page.locator('svg.bg-grass').boundingBox()
  if (box === null) throw new Error('map svg')
  return box
}

async function screenOf(page: Page, wx: number, wy: number) {
  const b = await svgBox(page)
  return {
    x: b.x + b.width / 2 + (wx - CAM_X) * TILE,
    y: b.y + b.height / 2 + (wy - CAM_Y) * TILE,
  }
}

async function hoverWorld(page: Page, wx: number, wy: number) {
  const p = await screenOf(page, wx, wy)
  await page.mouse.move(p.x, p.y)
}

async function tapWorld(page: Page, wx: number, wy: number) {
  const p = await screenOf(page, wx, wy)
  await page.mouse.move(p.x, p.y)
  await page.mouse.down()
  await page.mouse.up()
}

async function unlockAll(page: Page) {
  await page.getByRole('button', { name: 'Cheat', exact: true }).click()
  const unlock = page.getByRole('button', { name: 'Unlock all instantly' })
  await expect(unlock).toBeVisible()
  await unlock.click()
  await expect(hudMoney(page)).toHaveText('1049')
  await page.getByRole('button', { name: '×' }).click()
  await expect(unlock).toHaveCount(0)
}

async function openShop(page: Page) {
  const dock = page.getByText('General store')
  if (await dock.isVisible()) return
  await page.getByRole('button', { name: 'Shop', exact: true }).click()
  await expect(dock).toBeVisible({ timeout: 10_000 })
}

async function armSku(page: Page, sku: string) {
  await openShop(page)
  await page.getByRole('tab', { name: 'Automation' }).click()
  await page.getByRole('button', { name: sku }).click()
}

async function setPipesLens(page: Page) {
  const on = page.getByRole('button', { name: 'Lens · Pipes', exact: true })
  if (await on.isVisible()) return
  await page.getByRole('button', { name: 'Lens', exact: true }).click()
  await page.getByRole('button', { name: 'Pipes', exact: true }).click()
  await expect(on).toBeVisible()
}

async function expectPipeLayerOff(page: Page) {
  await expect(page.getByRole('button', { name: 'Lens', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Lens · Pipes', exact: true })).toHaveCount(0)
  await expect(page.locator('[data-pipe]')).toHaveCount(0)
}

async function remaining(page: Page): Promise<number> {
  const t = await page.locator('[data-clock]').getAttribute('data-clock-t')
  if (t === null) throw new Error('clock')
  return DAY_SECONDS - Number(t)
}
