import { expect, test } from '@playwright/test'
import { SLOT_KEY } from '../src/game/sim/feature-save/save.ts'
import { waitPlay } from './helpers.ts'

test('New Game, Hard and Fast, Play Now, Quick Save writes the rules; Play Now keeps the New Game box', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' })
  const neu = page.getByRole('button', { name: 'New Game', exact: true })
  await expect(neu).toBeVisible({ timeout: 30_000 })
  const box = await neu.boundingBox()
  if (box === null) throw new Error('New Game')
  await neu.click()
  await page.getByRole('tab', { name: 'Hard', exact: true }).click()
  await page.getByRole('tab', { name: 'Fast', exact: true }).click()
  const play = page.getByRole('button', { name: 'Play Now', exact: true })
  await expect(play).toBeVisible()
  expect(await play.boundingBox()).toEqual(box)
  await play.click()
  await waitPlay(page)
  await page.getByRole('button', { name: 'Gear', exact: true }).click()
  await page.getByRole('button', { name: 'Quick Save', exact: true }).click()
  const rules = await page.evaluate(key => {
    const raw = localStorage.getItem(key)
    if (raw === null) throw new Error('slot')
    return (JSON.parse(raw) as { rules: { difficulty: string; speed: string } }).rules
  }, SLOT_KEY)
  expect(rules).toEqual({ difficulty: 'hard', speed: 'fast' })
})
