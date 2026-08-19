import { mkdir } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

test('hud shots', async ({ page }) => {
  await mkdir('e2e/shots', { recursive: true })
  await page.goto('/')
  await expect(page.locator('svg.bg-grass')).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/hud.png' })
  await page.getByRole('button', { name: 'Shop', exact: true }).click()
  await expect(page.getByText('General store')).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/shop.png' })
  await page.getByRole('button', { name: 'Research', exact: true }).click()
  const unlock = page.getByRole('button', { name: 'unlock all instantly' })
  await expect(unlock).toBeVisible()
  await unlock.click()
  await page.screenshot({ path: 'e2e/shots/research.png' })
  await page.getByRole('button', { name: 'Almanac', exact: true }).click()
  await expect(page.locator('div.font-medium').filter({ hasText: /^Almanac$/ })).toBeVisible()
  await page.getByRole('button', { name: 'Carrot' }).click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: 'e2e/shots/almanac.png' })
})
