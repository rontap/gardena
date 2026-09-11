import { expect, test, type Page } from '@playwright/test'
import { gotoPlay, waitPlay } from './helpers.ts'

function recapRow(page: Page) {
  return page.getByText(/Day \d+ Finished/)
}

async function endDay(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = (window as unknown as { __world?: { endDay: () => void; tick: (dt: number) => void } }).__world
    if (w === undefined) throw new Error('no __world')
    w.endDay()
    w.tick(1)
  })
}

test('End day: no recap dialog; Command Center recap row; the farm keeps running; data-banner Day n', async ({ page }) => {
  await gotoPlay(page)
  await endDay(page)
  await expect(page.getByText('turned in')).toHaveCount(0)
  await expect(recapRow(page)).toBeVisible()
  const seam = await page.evaluate(
    () => (window as unknown as { __world: { seam: { kind: string } } }).__world.seam.kind,
  )
  expect(seam).toBe('play')
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Resume' })).toHaveCount(0)
  await expect(page.locator('[data-banner]')).toHaveText(/Day \d+/)
})

test('Click recap row opens summary; Close removes the row and popup', async ({ page }) => {
  await gotoPlay(page)
  await endDay(page)
  await recapRow(page).click()
  await expect(page.getByText('turned in')).toBeVisible()
  await expect(page.locator('button[aria-label="Resume"]')).toBeVisible()
  await page.getByRole('button', { name: /Close/ }).click()
  await expect(page.getByText('turned in')).toHaveCount(0)
  await expect(recapRow(page)).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
})

test('recap stipend line omitted at 0', async ({ page }) => {
  await gotoPlay(page)
  await page.evaluate(() => {
    const w = (window as unknown as { __world?: { clock: { day: number }; endDay: () => void; tick: (dt: number) => void } }).__world
    if (w === undefined) throw new Error('no __world')
    w.clock.day = 11
    w.endDay()
    w.tick(1)
  })
  await page.getByText('Day 11 Finished').click()
  const dlg = page.getByRole('dialog', { name: 'Day 11' })
  await expect(dlg.getByText('turned in')).toBeVisible()
  await expect(dlg.getByText('+', { exact: true })).toHaveCount(0)
  const stipend = await page.evaluate(
    () => (window as unknown as { __world: { recapAt: (d: number) => { stipend: number } } }).__world.recapAt(11).stipend,
  )
  expect(stipend).toBe(0)
})

test('Right-click recap row: gone, no popup', async ({ page }) => {
  await gotoPlay(page)
  await endDay(page)
  await recapRow(page).click({ button: 'right' })
  await expect(recapRow(page)).toHaveCount(0)
  await expect(page.getByText('turned in')).toHaveCount(0)
})

test('Loading visible before __view; gone after waitPlay', async ({ page }) => {
  await page.goto('/?start=now', { waitUntil: 'domcontentloaded' })
  await expect
    .poll(() =>
      page.evaluate(() => {
        const loading = [...document.querySelectorAll('span')].some(el => /Loading/.test(el.textContent ?? ''))
        const view = (window as unknown as { __view?: object }).__view !== undefined
        if (view) return 'view'
        return loading ? 'loading' : 'wait'
      }),
    )
    .toBe('loading')
  await waitPlay(page)
  await expect(page.getByText(/Loading/)).toHaveCount(0)
})
