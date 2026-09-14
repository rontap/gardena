import { expect, test, type Page } from '@playwright/test'
import { CROPS, HAPPY_MAX, cropVariety } from '../src/game/defs/crops.ts'
import { purposeMul, qualityMul, STARTER_VARIETY_PACKS, VARIETY } from '../src/game/defs/varieties.ts'
import { WEATHER_FRUIT_IMPACT } from '../src/game/defs/weather.ts'

import { PAD, SILO_BASE, WAREHOUSE_BASE } from '../src/game/sim/building.ts'
import { DT_MAX } from '../src/game/sim/world.ts'
import { closeDock, dismissRecap, gotoPlay, tapWorld } from './helpers.ts'

type At = { col: number; row: number }

const PLOT_A: At = { col: 13, row: 11 }
const PLOT_B: At = { col: 14, row: 11 }
const SILO: At = { col: SILO_BASE.col, row: SILO_BASE.row }
const WAREHOUSE: At = { col: WAREHOUSE_BASE.col, row: WAREHOUSE_BASE.row }

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

async function queueLen(page: Page): Promise<number> {
  await dismissRecap(page)
  return readWorld<number>(page, null, 'w.seats[0].queue.length')
}

async function cellKind(page: Page, at: At): Promise<string> {
  await dismissRecap(page)
  return readWorld<string>(page, at, 'w.cell(at).kind')
}

async function tapUntil(page: Page, at: At, ok: () => Promise<boolean>, timeout = 45_000): Promise<void> {
  await expect
    .poll(
      async () => {
        if (await ok()) return true
        if ((await queueLen(page)) > 0) return false
        await tapWorld(page, at.col + 0.5, at.row + 0.5)
        return false
      },
      { timeout },
    )
    .toBe(true)
}

async function openSilo(page: Page) {
  await tapUntil(page, SILO, async () => page.getByRole('dialog', { name: 'Seed silo' }).isVisible(), 30_000)
  return page.getByRole('dialog', { name: 'Seed silo' })
}


test('silo shows the seven starter variety packs', async ({ page }) => {
  await gotoPlay(page)
  await viewReady(page)
  const silo = await openSilo(page)
  const packs = await readWorld<{ variety: string; crop: string; count: number }[]>(
    page,
    null,
    'w.silo.seeds.filter(st => st.variety !== "base").map(st => ({ variety: st.variety, crop: st.crop, count: st.count }))',
  )
  expect(packs.map(p => p.variety).sort()).toEqual([...STARTER_VARIETY_PACKS].sort())
  expect(packs.every(p => p.count === 5)).toBe(true)
  for (const p of packs) {
    const id = p.variety as (typeof STARTER_VARIETY_PACKS)[number]
    expect(VARIETY[id].crop).toBe(p.crop)
    await expect(silo.getByRole('button', { name: `${cropVariety(VARIETY[id].crop, id)} - 5` })).toBeVisible()
  }
})

test("plant 'base' and one named annual variety", async ({ page }) => {
  test.setTimeout(180_000)
  await gotoPlay(page, { speed: 10 })
  await viewReady(page)

  await tapUntil(page, PLOT_A, async () => (await cellKind(page, PLOT_A)) === 'empty' && (await queueLen(page)) === 0)
  await tapUntil(page, PLOT_B, async () => (await cellKind(page, PLOT_B)) === 'empty' && (await queueLen(page)) === 0)

  const silo = await openSilo(page)
  await silo
    .getByRole('button', { name: `${cropVariety('carrot', 'base')} - 7` })
    .evaluate((el: HTMLElement) => el.click())
  await expect
    .poll(async () => readWorld<string>(page, null, 'w.seats[0].hand.kind === "hold" ? w.seats[0].hand.item.kind : ""'))
    .toBe('seeds')
  await closeDock(page)
  await expect.poll(async () => queueLen(page)).toBe(0)
  await tapUntil(page, PLOT_A, async () => (await cellKind(page, PLOT_A)) === 'growing' && (await queueLen(page)) === 0)
  expect(await readWorld<string>(page, PLOT_A, 'w.cell(at).plant.variety')).toBe('base')
  expect(await readWorld<string>(page, PLOT_A, 'w.cell(at).plant.crop')).toBe('carrot')

  await tapWorld(page, SILO.col + 0.5, SILO.row + 0.5)
  const silo2 = page.getByRole('dialog', { name: 'Seed silo' })
  await expect(silo2).toBeVisible({ timeout: 30_000 })
  await silo2
    .getByRole('button', { name: `${cropVariety('tomato', 'green-zebra')} - 5` })
    .evaluate((el: HTMLElement) => el.click())
  await expect
    .poll(async () => readWorld<string>(page, null, 'w.seats[0].hand.kind === "hold" ? w.seats[0].hand.item.variety : ""'))
    .toBe('green-zebra')
  await closeDock(page)
  await expect.poll(async () => queueLen(page)).toBe(0)
  await tapUntil(page, PLOT_B, async () => (await cellKind(page, PLOT_B)) === 'growing' && (await queueLen(page)) === 0)
  expect(await readWorld<string>(page, PLOT_B, 'w.cell(at).plant.variety')).toBe('green-zebra')
  expect(await readWorld<string>(page, PLOT_B, 'w.cell(at).plant.crop')).toBe('tomato')
})

test('ripen bakes quality: happy plant quality > seed; neglected walks down', async ({ page }) => {
  test.setTimeout(180_000)
  await gotoPlay(page, { speed: 10 })
  await viewReady(page)

  await tapUntil(page, PLOT_A, async () => (await cellKind(page, PLOT_A)) === 'empty' && (await queueLen(page)) === 0)
  const silo = await openSilo(page)
  await silo
    .getByRole('button', { name: `${cropVariety('carrot', 'base')} - 7` })
    .evaluate((el: HTMLElement) => el.click())
  await closeDock(page)
  await tapUntil(page, PLOT_A, async () => (await cellKind(page, PLOT_A)) === 'growing' && (await queueLen(page)) === 0)
  const seedQ = await readWorld<number>(page, PLOT_A, 'w.cell(at).plant.quality')
  expect(seedQ).toBe(0)

  await page.evaluate(
    ([at, happy, dt]) => {
      const w = (window as unknown as { __world: { cell: (a: At) => { plant: { happiness: number; maturity: number } }; tick: (d: number) => void } }).__world
      const p = w.cell(at).plant
      p.happiness = happy
      p.maturity = 1
      w.tick(dt)
    },
    [PLOT_A, HAPPY_MAX, DT_MAX] as const,
  )
  await expect.poll(async () => cellKind(page, PLOT_A)).toBe('ripe')
  const happyQ = await readWorld<number>(page, PLOT_A, 'w.cell(at).plant.quality')
  expect(happyQ).toBeGreaterThan(seedQ)

  await page.evaluate(([at, dt]) => {
    const w = (
      window as unknown as {
        __world: { setCell: (a: At, c: unknown) => void; tick: (d: number) => void }
      }
    ).__world
    const e = (
      window as unknown as {
        __e2e?: {
          Plant: new (crop: string, variety: string, quality: number) => { happiness: number; maturity: number }
          Soil: new (water: number, fertilizer: number, weed: number) => unknown
        }
      }
    ).__e2e
    if (e === undefined) throw new Error('no __e2e')
    const plant = new e.Plant('potato', 'base', 0.5)
    plant.happiness = 0
    plant.maturity = 1
    w.setCell(at, { kind: 'growing', soil: new e.Soil(1, 1, 0.03), plant })
    w.tick(dt)
  }, [PLOT_B, DT_MAX] as const)
  await expect.poll(async () => cellKind(page, PLOT_B)).toBe('ripe')
  const down = await readWorld<number>(page, PLOT_B, 'w.cell(at).plant.quality')
  expect(down).toBeLessThan(0.5)
})

test('warehouse drop-off pays quality × fresh rating and says so', async ({ page }) => {
  test.setTimeout(120_000)
  await gotoPlay(page)
  await viewReady(page)

  const quality = 0.5
  const produce = purposeMul('green-zebra', 'produce')
  await page.evaluate(
    ([item, pad]) => {
      const w = (
        window as unknown as {
          __world: { seats: { hand: unknown; actor: { x: number; y: number } }[] }
        }
      ).__world
      w.seats[0].hand = { kind: 'hold', item }
      w.seats[0].actor.x = pad.col + 0.5
      w.seats[0].actor.y = pad.row + 0.5
    },
    [
      {
        kind: 'fruit',
        crop: 'tomato',
        variety: 'green-zebra',
        quality,
        count: 1,
        unitSale: 1,
        freshness: 1,
      },
      PAD,
    ] as const,
  )

  const kind = await readWorld<string>(page, null, 'w.weather(w.clock.day)')
  const wx = kind === 'flood' || kind === 'drought' ? WEATHER_FRUIT_IMPACT : 0
  const before = await readWorld<number>(page, null, 'w.money')
  await tapWorld(page, WAREHOUSE.col + 0.5, WAREHOUSE.row + 0.5)

  await expect
    .poll(() => readWorld<string>(page, null, 'w.seats[0].hand.kind'), { timeout: 30_000 })
    .toBe('empty')
  const after = await readWorld<number>(page, null, 'w.money')
  const expected = qualityMul(quality) * produce * CROPS.tomato.sale * (1 + wx)
  expect(after - before).toBeCloseTo(expected, 6)
  expect(await readWorld<string>(page, null, 'w.speech.text')).toContain('I sold 1')
})

test('rotten consign pays after Fermentation, refused before', async ({ page }) => {
  await gotoPlay(page)
  await viewReady(page)
  const snap = await page.evaluate(
    ([pad, dt]) => {
      const w = (
        window as unknown as {
          __world?: {
            done: Set<string>
            seats: { hand: unknown; actor: { x: number; y: number }; queue: unknown[] }[]
            enqueue: (i: { act: string }) => void
            tick: (d: number) => void
            money: number
            ping: () => void
          }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      const rotten = { kind: 'rotten', cls: 'root', count: 10, createdAt: 1 }
      w.seats[0].actor.x = pad.col + 0.5
      w.seats[0].actor.y = pad.row + 0.5
      w.seats[0].hand = { kind: 'hold', item: rotten }
      const start = w.money
      w.enqueue({ act: 'consign' })
      w.tick(dt)
      const refused = {
        hand: (w.seats[0].hand as { kind: string }).kind,
        gained: w.money - start,
      }
      w.done.add('unlock-fermentation')
      const before = w.money
      w.enqueue({ act: 'consign' })
      w.tick(dt)
      w.ping()
      return {
        refused,
        hand: (w.seats[0].hand as { kind: string }).kind,
        gained: w.money - before,
      }
    },
    [PAD, DT_MAX] as const,
  )
  expect(snap.refused.hand).toBe('hold')
  expect(snap.refused.gained).toBe(0)
  expect(snap.hand).toBe('empty')
  expect(snap.gained).toBe(10)
})

