import { expect, test, type Page } from '@playwright/test'
import { AXES } from '../src/game/defs/items.ts'
import { RESEARCH_IDS } from '../src/game/defs/research.ts'
import { TREES } from '../src/game/defs/trees.ts'
import { SILO_BASE } from '../src/game/sim/building.ts'
import { DT_MAX } from '../src/game/sim/world.ts'
import { gotoPlay, openBuild, pickTreeNode, tapWorld, unlockWorld } from './helpers.ts'

type At = { col: number; row: number }

const SILO: At = { col: SILO_BASE.col, row: SILO_BASE.row }

function readWorld<R>(page: Page, arg: unknown, body: string): Promise<R> {
  return page.evaluate(
    ([a, src]) => {
      const w = (window as unknown as { __world?: never }).__world
      if (w === undefined) throw new Error('no __world')
      return new Function('w', 'at', `"use strict";return (${src})`)(w, a) as R
    },
    [arg, body],
  ) as Promise<R>
}

async function viewReady(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { __view?: unknown }).__view !== undefined &&
          (window as unknown as { __world?: unknown }).__world !== undefined,
      ),
    )
    .toBe(true)
}

async function ticks(page: Page, seconds: number): Promise<void> {
  await page.evaluate(
    ([seconds, dt]) => {
      const w = (
        window as unknown as {
          __world?: { seam: { kind: string }; dismissRecap: () => void; tick: (dt: number) => void }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      const n = Math.ceil(seconds / dt) + 2
      for (let i = 0; i < n; i++) {
        if (w.seam.kind === 'recap') w.dismissRecap()
        w.tick(dt)
      }
      if (w.seam.kind === 'recap') w.dismissRecap()
    },
    [seconds, DT_MAX],
  )
}

async function drain(page: Page): Promise<void> {
  await page.evaluate(dt => {
    const w = (
      window as unknown as {
        __world?: {
          seam: { kind: string }
          dismissRecap: () => void
          tick: (dt: number) => void
          seats: { queue: unknown[] }[]
        }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    let n = 0
    while (w.seats[0].queue.length > 0 && n < 4000) {
      if (w.seam.kind === 'recap') w.dismissRecap()
      w.tick(dt)
      n += 1
    }
  }, DT_MAX)
}

async function tapUntil(page: Page, at: At, ok: () => Promise<boolean>, timeout = 45_000): Promise<void> {
  await expect
    .poll(
      async () => {
        if (await ok()) return true
        const q = await readWorld<number>(page, null, 'w.seats[0].queue.length')
        if (q > 0) return false
        await tapWorld(page, at.col + 0.5, at.row + 0.5)
        return false
      },
      { timeout },
    )
    .toBe(true)
}

function weatherCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const clock = document.querySelector('[data-clock]')
    if (clock === null) throw new Error('clock')
    const day = clock.parentElement
    if (day === null) throw new Error('day')
    const block = day.parentElement
    if (block === null) throw new Error('block')
    const weather = block.nextElementSibling
    if (weather === null) throw new Error('weather')
    const glyphs = weather.nextElementSibling
    if (glyphs === null) throw new Error('glyphs')
    return glyphs.querySelectorAll('svg').length
  })
}

test('Research dock has no category rail and shows mystery cards', async ({ page }) => {
  await gotoPlay(page)
  await page.getByRole('button', { name: 'Research', exact: true }).click()
  await expect(page.locator('div.font-display').filter({ hasText: /^Research$/ })).toBeVisible()
  await expect(page.getByRole('tab')).toHaveCount(0)
  await expect(page.locator('g.node').first()).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Multi-Crop Farming').first()).toBeVisible()
  await expect(page.getByText('Unknown').first()).toBeVisible()
  const mystery = await readWorld<number>(
    page,
    RESEARCH_IDS,
    'at.filter(id => !w.researchKnown(id)).length',
  )
  expect(mystery).toBeGreaterThan(0)
})

test('Family dock host can buy Boots for 1 point', async ({ page }) => {
  await gotoPlay(page)
  await page.evaluate(() => {
    const w = (window as unknown as { __world?: { grantPoints: (n: number) => void; ping: () => void } }).__world
    if (w === undefined) throw new Error('no __world')
    w.grantPoints(1)
    w.ping()
  })
  await page.getByRole('button', { name: 'Family', exact: true }).click()
  await expect(page.locator('div.font-display').filter({ hasText: /^Family$/ })).toBeVisible()
  await pickTreeNode(page, 'skill_boots')
  const get = page.getByRole('button', { name: 'Get skill' })
  await expect(get).toBeEnabled()
  await get.click()
  const after = await readWorld<{ points: number; tier: number }>(
    page,
    null,
    '({ points: w.points, tier: w.skillTier("boots") })',
  )
  expect(after.points).toBe(0)
  expect(after.tier).toBe(1)
})

test('wheat pack is not buyable on a new farm', async ({ page }) => {
  await gotoPlay(page)
  await viewReady(page)
  await tapUntil(page, SILO, async () => page.getByRole('dialog', { name: 'Seed silo' }).isVisible(), 30_000)
  const silo = page.getByRole('dialog', { name: 'Seed silo' })
  await expect(silo).toBeVisible()
  const buy = silo.getByRole('button', { name: 'Buy Wheat seeds' })
  await expect(buy).toBeVisible()
  await expect(buy).toHaveAttribute('aria-disabled', 'true')
  const before = await readWorld<{ money: number; wheat: number }>(
    page,
    null,
    `(() => {
      const st = w.silo.seeds.find(s => s.crop === 'wheat' && s.variety === 'base')
      return { money: w.money, wheat: st === undefined ? 0 : st.count }
    })()`,
  )
  await buy.click({ force: true })
  await page.evaluate(() => {
    const w = (window as unknown as { __world?: { buy: (id: string) => unknown } }).__world
    if (w === undefined) throw new Error('no __world')
    w.buy('pack-wheat')
  })
  const after = await readWorld<{ money: number; wheat: number }>(
    page,
    null,
    `(() => {
      const st = w.silo.seeds.find(s => s.crop === 'wheat' && s.variety === 'base')
      return { money: w.money, wheat: st === undefined ? 0 : st.count }
    })()`,
  )
  expect(after).toEqual(before)
})

test('chop without Tree Grafting drops wood and no grafts', async ({ page }) => {
  test.setTimeout(120_000)
  await gotoPlay(page, { speed: 3 })
  await viewReady(page)
  const at = await readWorld<At>(
    page,
    null,
    `(() => {
      for (let row = 0; row < 32; row++) {
        for (let col = 0; col < 32; col++) {
          const c = w.cell({ col, row })
          if (c.kind === 'tree' && c.base.col === col && c.base.row === row) return { col, row }
        }
      }
      throw new Error('tree')
    })()`,
  )
  await page.evaluate(
    ({ at, uses, work }) => {
      const w = (
        window as unknown as {
          __world?: {
            seats: { actor: { x: number; y: number }; hand: unknown }[]
            cell: (c: { col: number; row: number }) => { kind: string; juvenile: number }
          }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      w.seats[0].actor.x = at.col + 0.5
      w.seats[0].actor.y = at.row + 0.5
      w.seats[0].hand = { kind: 'hold', item: { kind: 'axe', usesLeft: uses, workSeconds: work } }
      const c = w.cell(at)
      if (c.kind === 'tree' && c.juvenile < 1) c.juvenile = 1
    },
    { at, uses: AXES.axe.uses, work: AXES.axe.workSeconds },
  )
  await ticks(page, TREES.apple.juvenileSeconds + 1)
  await page.evaluate(at => {
    const w = (
      window as unknown as {
        __world?: {
          seam: { kind: string }
          dismissRecap: () => void
          enqueue: (i: { act: string; at: { col: number; row: number } }) => void
          cell: (c: { col: number; row: number }) => { juvenile: number }
        }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    if (w.seam.kind === 'recap') w.dismissRecap()
    const c = w.cell(at)
    if (c.juvenile < 1) c.juvenile = 1
    w.enqueue({ act: 'chop', at })
  }, at)
  await drain(page)
  const chopped = await readWorld<{ trunk: boolean; wood: number; grafts: number }>(
    page,
    at,
    `(() => {
      const c = w.cell(at)
      return {
        trunk: c.trunk,
        wood: w.drops.filter(d => d.item.kind === 'wood').reduce((n, d) => n + d.item.count, 0),
        grafts: w.drops.filter(d => d.item.kind === 'graft').reduce((n, d) => n + d.item.count, 0),
      }
    })()`,
  )
  expect(chopped.trunk).toBe(true)
  expect(chopped.wood).toBe(1)
  expect(chopped.grafts).toBe(0)
})

test('place Weather Forecast Station shows tomorrow on the HUD, demolish the last one hides it', async ({ page }) => {
  await gotoPlay(page)
  await unlockWorld(page)
  await expect.poll(() => weatherCount(page)).toBe(1)
  await openBuild(page)
  await page.getByRole('tab', { name: 'Land' }).click()
  const card = page.getByRole('button', { name: /24$/ })
  await expect(card).toBeVisible()
  await card.click()
  const at = await readWorld<At>(
    page,
    null,
    `(() => {
      const b = w.bounds()
      for (let row = b.row0; row < b.row1 - 1; row++) {
        for (let col = b.col0; col < b.col1; col++) {
          const a = { col, row }
          const c = { col, row: row + 1 }
          if (w.cell(a).kind === 'untilled' && w.cell(c).kind === 'untilled') return a
        }
      }
      throw new Error('site')
    })()`,
  )
  await page.evaluate(at => {
    const w = (window as unknown as { __world?: { confirmPlace: (at: { col: number; row: number }) => void } }).__world
    if (w === undefined) throw new Error('no __world')
    w.confirmPlace(at)
  }, at)
  await expect.poll(() => readWorld<number>(page, null, 'w.forecastCount')).toBe(1)
  await expect.poll(() => weatherCount(page)).toBe(2)
  await page.getByRole('button', { name: 'Demolish' }).click()
  await page.evaluate(at => {
    const w = (window as unknown as { __world?: { click: (at: { col: number; row: number }) => void } }).__world
    if (w === undefined) throw new Error('no __world')
    w.click(at)
  }, at)
  await expect.poll(() => readWorld<number>(page, null, 'w.forecastCount')).toBe(0)
  await expect.poll(() => weatherCount(page)).toBe(1)
})
