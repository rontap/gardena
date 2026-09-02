import { expect, test, type Page } from '@playwright/test'
import { DAY_SECONDS } from '../src/game/sim/clock.ts'
import {
  armSku,
  closeDock,
  gotoPlay,
  hoverWorld,
  hudMoney,
  moneyValue,
  openShop,
  tapWorld,
} from './helpers.ts'

test.beforeEach(async ({ page }) => {
  await gotoPlay(page, { unlock: true })
  await expect(hudMoney(page)).toHaveText('1049')
})

test('hover outline', async ({ page }) => {
  const stroke = page.locator('[data-cell-stroke]')
  await hoverWorld(page, 12.5, 10.5)
  await expect(stroke).toHaveCount(1)
  await expect(stroke).toHaveClass(/stroke-ink/)
  await armSku(page, 'Pipe 3')
  await hoverWorld(page, 12.5, 10.5)
  await expect(stroke).toHaveCount(1)
  await expect(stroke).toHaveClass(/stroke-ink/)
  await armSku(page, 'Sprinkler 16')
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
  await armSku(page, 'Pipe 3')
  await tapWorld(page, 18.5, 7)
  await hoverWorld(page, 12.5, 10.5)
  await expect(page.locator('[data-pipe]')).not.toHaveCount(0)
  await closeDock(page)
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
  const before = moneyValue(await hudMoney(page).textContent())
  await armSku(page, 'Sprinkler 16')
  await tapWorld(page, 19, 7)
  await expect(page.locator('[data-sprinkler]')).toHaveCount(1)
  await expect.poll(async () => moneyValue(await hudMoney(page).textContent())).toBe(before - 16)
})

test('pipe ghost is pipe art', async ({ page }) => {
  await armSku(page, 'Pipe 3')
  await hoverWorld(page, 18.5, 7)
  const ghost = page.locator('[data-pipe-ghost]').first()
  await expect(ghost).toBeVisible()
  const html = await ghost.innerHTML()
  expect(html.includes('<use')).toBe(true)
  expect(html.includes('<line')).toBe(false)
})

test('dry pipes', async ({ page }) => {
  await armSku(page, 'Pipe 3')
  await tapWorld(page, 10.5, 20)
  await hoverWorld(page, 10.5, 20.5)
  const dry = page.locator('[data-pipe][data-wet="0"]').first()
  await expect(dry).toBeVisible()
  const html = await dry.innerHTML()
  expect(html.includes('#3d7ea6')).toBe(false)
})

test('connected sprinkler waters', async ({ page }) => {
  test.setTimeout(90_000)
  await armSku(page, 'Pipe 3')
  await tapWorld(page, 18.5, 7)
  await armSku(page, 'Sprinkler 16')
  await tapWorld(page, 19, 7)
  await expect(page.locator('[data-sprinkler]')).toHaveCount(1)
  await page.keyboard.press('Escape')
  await page.evaluate(async () => {
    const w = (window as unknown as { __world: { setCell: (at: { col: number; row: number }, c: unknown) => void } }).__world
    const plant = await import('/src/game/sim/plant.ts')
    const soil = await import('/src/game/sim/soil.ts')
    w.setCell({ col: 18, row: 6 }, { kind: 'growing', soil: new soil.Soil(0.2, 1), plant: new plant.Plant('carrot', 'common') })
  })
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

async function setPipesLens(page: Page) {
  const on = page.getByRole('button', { name: 'Lens pipes', exact: true })
  if (await on.isVisible()) return
  await page.getByRole('button', { name: /^Lens/ }).click()
  await page.getByRole('button', { name: /^Pipes / }).click()
  await expect(on).toBeVisible()
}

async function expectPipeLayerOff(page: Page) {
  await expect(page.getByRole('button', { name: 'Lens', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Lens pipes', exact: true })).toHaveCount(0)
}

async function remaining(page: Page): Promise<number> {
  const t = await page.locator('[data-clock]').getAttribute('data-clock-t')
  if (t === null) throw new Error('clock')
  return DAY_SECONDS - Number(t)
}
