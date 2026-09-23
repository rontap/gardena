import { expect, test } from '@playwright/test'
import { gotoPlay, openBuild } from './helpers.ts'

test('Crop variants shows Crop Variety Station', async ({ page }) => {
  await gotoPlay(page)
  await openBuild(page)
  await page.getByRole('tab', { name: 'Automation' }).click()
  const station = page.getByRole('button', { name: /Crop Variety Station/ })
  await expect(station).toHaveCount(0)
  await page.evaluate(() => {
    const w = (window as unknown as { __world?: { done: Set<string>; cheatMoney: () => void; ping: () => void } }).__world
    if (w === undefined) throw new Error('no __world')
    w.done.add('unlock-crop-variants')
    w.cheatMoney()
    w.ping()
  })
  await expect(station).toBeVisible()
  await expect(station).toHaveAttribute('aria-disabled', 'false')
})

test('Hardened tools sells Hardened pickaxe and Chainsaw', async ({ page }) => {
  await gotoPlay(page, { unlock: true })
  await openBuild(page)
  await page.getByRole('tab', { name: 'Tools' }).click()
  const pick = page.getByRole('button', { name: /Hardened pickaxe/ })
  const saw = page.getByRole('button', { name: /Chainsaw/ })
  await expect(pick).toBeVisible()
  await expect(saw).toBeVisible()
  await expect(pick).toHaveAttribute('aria-disabled', 'false')
  await expect(saw).toHaveAttribute('aria-disabled', 'false')
  await saw.click()
  const place = await page.evaluate(() => {
    const w = (
      window as unknown as { __world?: { seats: { place: { kind: string; id?: string } }[] } }
    ).__world
    if (w === undefined) throw new Error('no __world')
    return w.seats[0].place
  })
  expect(place).toEqual({ kind: 'sku', id: 'buy-chainsaw' })
})

test('Decorative sells paving, Sensors sells Wooden fence', async ({ page }) => {
  await gotoPlay(page, { unlock: true })
  await openBuild(page)
  await page.getByRole('tab', { name: 'Decorative' }).click()
  await expect(page.getByRole('button', { name: /^Cobblestone(?: placing)? 4$/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Paving slab(?: placing)? 5$/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Brickwork(?: placing)? 6$/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Asphalt(?: placing)? 3$/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Wooden fence(?: placing)? 2$/ })).toHaveCount(0)
  await page.getByRole('tab', { name: 'Sensors' }).click()
  await expect(page.getByRole('button', { name: /^Wooden fence(?: placing)? 2$/ })).toBeVisible()
})

test('#debug-techtree draws an svg', async ({ page }) => {
  await page.goto('/#debug-techtree', { waitUntil: 'load' })
  await expect(page.locator('.overflow-x-auto svg')).toBeVisible({ timeout: 30_000 })
})

test('Chest buy on a new farm', async ({ page }) => {
  await gotoPlay(page)
  await openBuild(page)
  await page.getByRole('tab', { name: 'Storage' }).click()
  const chest = page.getByRole('button', { name: /^Chest(?: placing)? / })
  await expect(chest).toBeVisible()
  await expect(chest).toHaveAttribute('aria-disabled', 'false')
})

