import { mkdir } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { gotoPlay, unlockWorld } from './helpers.ts'

test('hud shots', async ({ page }) => {
  await mkdir('e2e/shots', { recursive: true })
  await gotoPlay(page)
  await page.screenshot({ path: 'e2e/shots/hud.png' })
  await page.getByRole('button', { name: 'Shop', exact: true }).click()
  await expect(page.getByText('General store')).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/shop.png' })
  await unlockWorld(page)
  await page.getByRole('button', { name: 'Research', exact: true }).click()
  await expect(page.getByText('Research', { exact: true }).first()).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/research.png' })
  await page.getByRole('button', { name: 'Almanac', exact: true }).click()
  await expect(page.locator('div.font-display').filter({ hasText: /^Almanac$/ })).toBeVisible()
  await page.getByRole('button', { name: 'Carrot' }).click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: 'e2e/shots/almanac.png' })
})
