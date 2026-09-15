import { expect, test, type Page } from '@playwright/test'
import { gotoPlay, openBuild, pickTreeNode } from './helpers.ts'

async function asGuest(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = (
      window as unknown as {
        __world?: { join: (id: string) => unknown; local: number; ping: () => void }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    w.join('g')
    w.local = 1
    w.ping()
  })
}

test('Guest research card starts a job', async ({ page }) => {
  await gotoPlay(page)
  await asGuest(page)
  await page.getByRole('button', { name: 'Research', exact: true }).click()
  await expect(page.getByText('Multi-Crop Farming').first()).toBeAttached({ timeout: 20_000 })
  await page.evaluate(() => {
    const w = (window as unknown as { __world?: { startResearch: (id: string) => void } }).__world
    if (w === undefined) throw new Error('no __world')
    w.startResearch('unlock-multi-crop')
  })
  const job = await page.evaluate(() => {
    const w = (window as unknown as { __world?: { job: { kind: string; id?: string } } }).__world
    if (w === undefined) throw new Error('no __world')
    return w.job
  })
  expect(job.kind).toBe('run')
  expect(job.id).toBe('unlock-multi-crop')
})

test('Guest Family offers stay unclickable', async ({ page }) => {
  await gotoPlay(page)
  await page.evaluate(() => {
    const w = (window as unknown as { __world?: { grantPoints: (n: number) => void; ping: () => void } }).__world
    if (w === undefined) throw new Error('no __world')
    w.grantPoints(1)
    w.ping()
  })
  await asGuest(page)
  await page.getByRole('button', { name: 'Family', exact: true }).click()
  await pickTreeNode(page, 'skill_boots')
  const get = page.getByRole('button', { name: 'Get skill' })
  await expect(get).toBeDisabled()
  const points = await page.evaluate(() => {
    const w = (window as unknown as { __world?: { points: number } }).__world
    if (w === undefined) throw new Error('no __world')
    return w.points
  })
  await get.click({ force: true })
  const after = await page.evaluate(() => {
    const w = (window as unknown as { __world?: { points: number } }).__world
    if (w === undefined) throw new Error('no __world')
    return w.points
  })
  expect(after).toBe(points)
})

test('Guest Expand plates and Cheat are gone; Pipe and Wooden fence arm', async ({ page }) => {
  await gotoPlay(page, { unlock: true })
  await expect(page.getByRole('button', { name: 'Cheat' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Expand/ }).first()).toBeVisible()
  await asGuest(page)
  await expect(page.getByRole('button', { name: 'Cheat' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Expand/ })).toHaveCount(0)
  await openBuild(page)
  await page.getByRole('tab', { name: 'Water' }).click()
  const pipe = page.getByRole('button', { name: /^Pipe(?: placing)? 3$/ })
  await expect(pipe).toBeVisible()
  await expect(pipe).toHaveAttribute('aria-disabled', 'false')
  await page.getByRole('tab', { name: 'Land' }).click()
  const fence = page.getByRole('button', { name: /^Wooden fence(?: placing)? 2$/ })
  await expect(fence).toBeVisible()
  await expect(fence).toHaveAttribute('aria-disabled', 'false')
})

test('Guest Market Accept takes an offer', async ({ page }) => {
  await gotoPlay(page)
  await page.evaluate(() => {
    const w = (
      window as unknown as { __world?: { done: Set<string>; cheatMoney: () => void; ping: () => void } }
    ).__world
    if (w === undefined) throw new Error('no __world')
    w.done.add('unlock-contracts')
    w.cheatMoney()
    w.ping()
  })
  await asGuest(page)
  await page.getByRole('button', { name: 'Contracts', exact: true }).click()
  const board = page.locator('[data-contract-board]')
  await expect(board).toBeVisible()
  const before = await page.evaluate(() => {
    const w = (window as unknown as { __world?: { contracts: { active: unknown[] } } }).__world
    if (w === undefined) throw new Error('no __world')
    return w.contracts.active.length
  })
  await board.getByRole('button').first().click()
  const after = await page.evaluate(() => {
    const w = (window as unknown as { __world?: { contracts: { active: unknown[] } } }).__world
    if (w === undefined) throw new Error('no __world')
    return w.contracts.active.length
  })
  expect(after).toBe(before + 1)
})
