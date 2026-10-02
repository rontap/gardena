import { expect, test } from '@playwright/test'
import { gotoPlay } from './helpers.ts'

test('Boot wordmark opens changelog; Close returns home', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' })
  await expect(page.getByRole('button', { name: 'New Game' })).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Version history' }).click()
  await expect(page.getByRole('button', { name: 'New Game' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Version history' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Close' })).toBeVisible()
  expect(await page.getByRole('button').count()).toBeGreaterThan(2)
  await page.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByRole('button', { name: 'New Game' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Version history' })).toHaveAttribute('aria-pressed', 'false')
})

test('Play wordmark opens changelog; Close returns to play home', async ({ page }) => {
  await gotoPlay(page)
  await page.getByRole('button', { name: 'Gear' }).click()
  await expect(page.getByRole('button', { name: 'Back to game' })).toBeVisible()
  await page.getByRole('button', { name: 'Version history' }).click()
  await expect(page.getByRole('button', { name: 'Back to game' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Version history' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Close' })).toBeVisible()
  expect(await page.getByRole('button').count()).toBeGreaterThan(2)
  await page.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByRole('button', { name: 'Back to game' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Version history' })).toHaveAttribute('aria-pressed', 'false')
})
