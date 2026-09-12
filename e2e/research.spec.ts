import { expect, test } from '@playwright/test'
import { gotoPlay, openBuild } from './helpers.ts'

test('Crop variants shows Seed Variety Station', async ({ page }) => {
  await gotoPlay(page)
  await openBuild(page)
  await page.getByRole('tab', { name: 'Automation' }).click()
  const station = page.getByRole('button', { name: /Seed Variety Station/ })
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

test('Land sells paving and Wooden fence at the new prices', async ({ page }) => {
  await gotoPlay(page, { unlock: true })
  await openBuild(page)
  await page.getByRole('tab', { name: 'Land' }).click()
  await expect(page.getByRole('button', { name: /^Cobblestone(?: placing)? 4$/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Paving slab(?: placing)? 5$/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Brickwork(?: placing)? 6$/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Asphalt(?: placing)? 3$/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Wooden fence(?: placing)? 2$/ })).toBeVisible()
})

test('#debug-techtree draws an svg and has no OR/AND leaf', async ({ page }) => {
  await page.goto('/#debug-techtree', { waitUntil: 'load' })
  const svg = page.locator('.overflow-x-auto svg')
  await expect(svg).toBeVisible({ timeout: 30_000 })
  const html = await svg.innerHTML()
  expect(html).not.toContain('sku_buy_or')
  expect(html).not.toContain('sku_buy_and')
})

test('Chest buy on a new farm', async ({ page }) => {
  await gotoPlay(page)
  await openBuild(page)
  await page.getByRole('tab', { name: 'Storage' }).click()
  const chest = page.getByRole('button', { name: /^Chest(?: placing)? / })
  await expect(chest).toBeVisible()
  await expect(chest).toHaveAttribute('aria-disabled', 'false')
})

test('Pickaxe buy after Gardening tools, not before', async ({ page }) => {
  await gotoPlay(page)
  await openBuild(page)
  await page.getByRole('tab', { name: 'Tools' }).click()
  const pick = page.getByRole('button', { name: /^Pickaxe(?: placing)? / })
  await expect(pick).toBeVisible()
  await expect(pick).toHaveAttribute('aria-disabled', 'true')
  await page.evaluate(() => {
    const w = (window as unknown as { __world?: { done: Set<string>; cheatMoney: () => void; ping: () => void } }).__world
    if (w === undefined) throw new Error('no __world')
    w.done.add('unlock-better-tools')
    w.cheatMoney()
    w.ping()
  })
  await expect(pick).toHaveAttribute('aria-disabled', 'false')
  await pick.click()
  const place = await page.evaluate(() => {
    const w = (
      window as unknown as { __world?: { seats: { place: { kind: string; id?: string } }[] } }
    ).__world
    if (w === undefined) throw new Error('no __world')
    return w.seats[0].place
  })
  expect(place).toEqual({ kind: 'sku', id: 'buy-pickaxe' })
})

test('Better shovel buy after Hardened tools, not after Gardening tools alone', async ({ page }) => {
  await gotoPlay(page)
  await openBuild(page)
  await page.getByRole('tab', { name: 'Tools' }).click()
  const shovel = page.getByRole('button', { name: /^Better shovel(?: placing)? / })
  await expect(shovel).toHaveCount(0)
  await page.evaluate(() => {
    const w = (window as unknown as { __world?: { done: Set<string>; ping: () => void } }).__world
    if (w === undefined) throw new Error('no __world')
    w.done.add('unlock-better-tools')
    w.ping()
  })
  await expect(shovel).toHaveCount(0)
  await page.evaluate(() => {
    const w = (window as unknown as { __world?: { done: Set<string>; cheatMoney: () => void; ping: () => void } }).__world
    if (w === undefined) throw new Error('no __world')
    w.done.add('unlock-hardened-tools')
    w.cheatMoney()
    w.ping()
  })
  await expect(shovel).toBeVisible()
  await expect(shovel).toHaveAttribute('aria-disabled', 'false')
})

test('Build Water Source has no rainwater tank', async ({ page }) => {
  await gotoPlay(page, { unlock: true })
  await openBuild(page)
  await page.getByRole('tab', { name: 'Water' }).click()
  await expect(page.getByRole('button', { name: /Rainwater tank/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Pumpjack(?: placing)? / })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Well(?: placing)? / })).toBeVisible()
})
