import { expect, test, type Page } from '@playwright/test'
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

test('house hover is one outline path', async ({ page }) => {
  const stroke = page.locator('[data-cell-stroke]')
  await hoverWorld(page, 16, 7.5)
  await expect(stroke).toHaveCount(1)
  expect((await stroke.getAttribute('d'))?.match(/M/g)).toHaveLength(1)
})

test('shop close exits pipe layer', async ({ page }) => {
  await armSku(page, 'Pipe 3')
  await tapWorld(page, 18.5, 7)
  await hoverWorld(page, 12.5, 10.5)
  await expect(page.locator('[data-pipe]')).not.toHaveCount(0)
  await closeDock(page)
  await expect.poll(() => placeKind(page)).toBe('none')
  await expect(page.getByRole('button', { name: 'Lens', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Lens pipes/i })).toHaveCount(0)
  await setPipesLens(page)
  await page.getByRole('button', { name: /Lock view/ }).click()
  await expect(page.getByRole('button', { name: /^Lens pipes/i })).toBeVisible()
  await expect(page.locator('[data-pipe]')).not.toHaveCount(0)
  await armSku(page, 'Pipe 3')
  await expect.poll(() => placeKind(page)).toBe('sku')
  await openShop(page)
  await page.getByRole('button', { name: 'Shop', exact: true }).click()
  await expect(page.getByRole('tab', { name: 'Seeds' })).toHaveCount(0)
  await expect.poll(() => placeKind(page)).toBe('none')
  await expect(page.getByRole('button', { name: /^Lens pipes/i })).toBeVisible()
  await armSku(page, 'Pipe 3')
  await openShop(page)
  await page.keyboard.press('Escape')
  await expect.poll(() => placeKind(page)).toBe('none')
  await expect(page.getByRole('button', { name: /^Lens pipes/i })).toBeVisible()
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
  await armSku(page, 'Pipe 3')
  await tapWorld(page, 18.5, 7)
  await armSku(page, 'Sprinkler 16')
  await tapWorld(page, 19, 7)
  await expect(page.locator('[data-sprinkler]')).toHaveCount(1)
  await page.keyboard.press('Escape')
  const water0 = await page.evaluate(async () => {
    const w = (
      window as unknown as {
        __world: {
          setCell: (at: { col: number; row: number }, c: unknown) => void
          cell: (at: { col: number; row: number }) => { kind: string; soil?: { water: number } }
        }
      }
    ).__world
    const plant = await import('/src/game/sim/plant.ts')
    const soil = await import('/src/game/sim/soil.ts')
    w.setCell({ col: 18, row: 6 }, { kind: 'growing', soil: new soil.Soil(0.2, 1, 0.03), plant: new plant.Plant('carrot', 'base', 0) })
    const c = w.cell({ col: 18, row: 6 })
    if (c.kind !== 'growing' || c.soil === undefined) throw new Error('growing')
    return c.soil.water
  })
  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const c = (
          window as unknown as {
            __world: { cell: (at: { col: number; row: number }) => { kind: string; soil?: { water: number } } }
          }
        ).__world.cell({ col: 18, row: 6 })
        if (c.kind !== 'growing' || c.soil === undefined) return -1
        return c.soil.water
      })
    })
    .toBeGreaterThan(water0)
})

async function setPipesLens(page: Page) {
  const on = page.getByRole('button', { name: /^Lens pipes/i })
  if (await on.isVisible()) return
  await page.getByRole('button', { name: /^Lens/ }).click()
  await page.getByRole('button', { name: /^Pipes / }).click()
  await expect(on).toBeVisible()
}

async function placeKind(page: Page): Promise<string> {
  return page.evaluate(() => {
    const w = (window as unknown as { __world: { seats: { place: { kind: string } }[] } }).__world
    return w.seats[0].place.kind
  })
}
