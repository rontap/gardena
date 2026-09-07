import { expect, test, type Page } from '@playwright/test'
import { PUMP_BASE } from '../src/game/sim/building.ts'
import { DT_MAX } from '../src/game/sim/world.ts'
import { armSku, gotoPlay, hoverWorld, tapWorld } from './helpers.ts'

type At = { col: number; row: number }

const LOGIC: At = { col: 13, row: 12 }
const VARIETY: At = { col: 13, row: 13 }
const WEATHER: At = { col: 13, row: 14 }
const PRESSURE: At = { col: 14, row: 12 }
const FENCE_A: At = { col: 12, row: 14 }
const FENCE_B: At = { col: 12, row: 16 }
const HOLE: At = { col: 13, row: 16 }
const LEVER: At = { col: 16, row: 11 }

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

async function untilled(page: Page, cells: At[]): Promise<void> {
  await page.evaluate(list => {
    const w = (
      window as unknown as {
        __world?: {
          setCell: (at: At, c: { kind: string; ground: string; hardness: number; cover: { kind: string } }) => void
        }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    list.forEach(at => w.setCell(at, { kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'bare' } }))
  }, cells)
}

async function place(page: Page, id: string, at: At): Promise<void> {
  await page.evaluate(
    ([sku, cell]) => {
      const w = (
        window as unknown as {
          __world?: {
            cheatMoney: () => void
            buy: (id: string) => void
            confirmPlace: (at: At) => void
            cancelPlace: () => void
          }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      w.cheatMoney()
      w.buy(sku)
      w.confirmPlace(cell)
      w.cancelPlace()
    },
    [id, at] as const,
  )
}

async function disarm(page: Page): Promise<void> {
  await page.keyboard.press('Escape')
  await expect
    .poll(() =>
      page.evaluate(() => {
        const w = (window as unknown as { __world?: { seats: { place: { kind: string } }[] } }).__world
        if (w === undefined) throw new Error('no __world')
        return w.seats[0].place.kind
      }),
    )
    .toBe('none')
}

function ring3(hole: At): At[] {
  return [-1, 0, 1].flatMap(dr =>
    [-1, 0, 1].filter(dc => dc !== 0 || dr !== 0).map(dc => ({ col: hole.col + dc, row: hole.row + dr })),
  )
}

test.beforeEach(async ({ page }) => {
  await gotoPlay(page, { unlock: true })
})

test('logic HUD', async ({ page }) => {
  await untilled(page, [LOGIC])
  await armSku(page, 'Logic gate', 'Sensors')
  await tapWorld(page, LOGIC.col + 0.5, LOGIC.row + 0.5)
  await disarm(page)
  await tapWorld(page, LOGIC.col + 0.5, LOGIC.row + 0.5)
  const radios = page.getByRole('radio')
  await expect(radios).toHaveCount(2)
  await expect(radios.nth(0)).toHaveAttribute('aria-checked', 'true')
  await radios.nth(1).click()
  await expect
    .poll(() => readWorld<string>(page, LOGIC, 'w.cell(at).kind === "logic" ? w.cell(at).mode : ""'))
    .toBe('and')
  await expect(radios).toHaveCount(2)
})

test('variety weather pressure HUD', async ({ page }) => {
  await untilled(page, [VARIETY, WEATHER, PRESSURE])
  await place(page, 'buy-sensor-variety', VARIETY)
  await tapWorld(page, VARIETY.col + 0.5, VARIETY.row + 0.5)
  const variety = page.getByRole('checkbox')
  await expect(variety).toHaveCount(3)
  await expect(variety.nth(0)).toHaveAttribute('aria-checked', 'true')
  await variety.nth(0).click()
  await expect
    .poll(() => readWorld<boolean>(page, VARIETY, 'w.cell(at).kind === "sensor-variety" && w.cell(at).baseOn === false'))
    .toBe(true)
  await disarm(page)

  await place(page, 'buy-sensor-weather', WEATHER)
  await tapWorld(page, WEATHER.col + 0.5, WEATHER.row + 0.5)
  const weather = page.getByRole('checkbox')
  await expect(weather).toHaveCount(5)
  await expect(weather.nth(0)).toHaveAttribute('aria-checked', 'true')
  await weather.nth(1).click()
  await expect
    .poll(() => readWorld<boolean>(page, WEATHER, 'w.cell(at).kind === "sensor-weather" && w.cell(at).rain === true'))
    .toBe(true)
  await disarm(page)

  await place(page, 'buy-vehicle-detector', PRESSURE)
  await tapWorld(page, PRESSURE.col + 0.5, PRESSURE.row + 0.5)
  const pressure = page.getByRole('checkbox')
  await expect(pressure).toHaveCount(3)
  await expect(pressure.nth(0)).toHaveAttribute('aria-checked', 'true')
  await pressure.nth(1).click()
  await expect
    .poll(() =>
      readWorld<boolean>(page, PRESSURE, 'w.cell(at).kind === "vehicle-detector" && w.cell(at).player === true'),
    )
    .toBe(true)
})

test('fence then sensor and sensor then fence', async ({ page }) => {
  await untilled(page, [FENCE_A, FENCE_B])
  await place(page, 'buy-fence', FENCE_A)
  await place(page, 'buy-sensor-water', FENCE_A)
  expect(
    await readWorld<{ kind: string; fence: boolean }>(
      page,
      FENCE_A,
      '{ kind: w.cell(at).kind, fence: w.hasFence(at) }',
    ),
  ).toEqual({ kind: 'sensor-water', fence: true })
  await place(page, 'buy-sensor-water', FENCE_B)
  await place(page, 'buy-fence', FENCE_B)
  expect(
    await readWorld<{ kind: string; fence: boolean }>(
      page,
      FENCE_B,
      '{ kind: w.cell(at).kind, fence: w.hasFence(at) }',
    ),
  ).toEqual({ kind: 'sensor-water', fence: true })
})

test('delete sensor then fence remains', async ({ page }) => {
  await untilled(page, [FENCE_A])
  await place(page, 'buy-sensor-water', FENCE_A)
  await place(page, 'buy-fence', FENCE_A)
  await armSku(page, 'Water sensor', 'Sensors')
  await page.getByRole('button', { name: 'Delete' }).click({ force: true })
  await page.evaluate(at => {
    const w = (
      window as unknown as { __world?: { armDelete: () => void; deleteBuilding: (at: At) => void } }
    ).__world
    if (w === undefined) throw new Error('no __world')
    w.armDelete()
    w.deleteBuilding(at)
  }, FENCE_A)
  expect(
    await readWorld<{ kind: string; fence: boolean }>(
      page,
      FENCE_A,
      '{ kind: w.cell(at).kind, fence: w.hasFence(at) }',
    ),
  ).toEqual({ kind: 'empty', fence: true })
})

test('closed-ring wash', async ({ page }) => {
  const fences = ring3(HOLE)
  await untilled(page, [HOLE, ...fences])
  for (const at of fences) await place(page, 'buy-fence', at)
  await place(page, 'buy-sensor-water', fences[0])
  const n = await page.evaluate(at => {
    const w = (window as unknown as { __world?: unknown }).__world
    const e = (window as unknown as { __e2e?: { sensorWashCells: (w: unknown, at: At, o: boolean) => unknown[] } }).__e2e
    if (w === undefined || e === undefined) throw new Error('no __world')
    return e.sensorWashCells(w, at, false).length
  }, fences[0])
  expect(n).toBe(1)
})

test('open-fence look', async ({ page }) => {
  const fences = ring3(HOLE).filter(at => at.col !== HOLE.col || at.row !== HOLE.row + 1)
  await untilled(page, [HOLE, ...fences])
  for (const at of fences) await place(page, 'buy-fence', at)
  await place(page, 'buy-sensor-water', fences[0])
  const wash = await page.evaluate(at => {
    const w = (window as unknown as { __world?: unknown }).__world
    const e = (window as unknown as { __e2e?: { sensorWashCells: (w: unknown, at: At, o: boolean) => unknown[] } }).__e2e
    if (w === undefined || e === undefined) throw new Error('no __world')
    return e.sensorWashCells(w, at, false).length
  }, fences[0])
  expect(wash).toBe(0)
  await hoverWorld(page, fences[0].col + 0.5, fences[0].row + 0.5)
  const first = await page.evaluate(at => {
    const w = (window as unknown as { __world?: unknown }).__world
    const e = (
      window as unknown as { __e2e?: { lookText: (w: unknown, hit: { kind: string; at: At }, armed: boolean) => string } }
    ).__e2e
    if (w === undefined || e === undefined) throw new Error('no __world')
    return e.lookText(w, { kind: 'cell', at }, false).split('\n')[0]
  }, fences[0])
  expect(/ - (on|off)$/.test(first)).toBe(false)
  await expect(page.locator('[data-look]')).toBeVisible()
})

test('pump wire skips gather', async ({ page }) => {
  await untilled(page, [LEVER])
  const origin = { col: PUMP_BASE.col, row: PUMP_BASE.row }
  await place(page, 'buy-lever', LEVER)
  const stored = await page.evaluate(
    async ([lever, pump, dt]) => {
      const w = (
        window as unknown as {
          __world?: {
            pumps: { inn: number; water: { stored: number; take: (n: number) => number } }[]
            armWire: (from: { kind: string; at: At; port: string }) => void
            placeWire: (
              from: { kind: string; at: At; port: string },
              to: { kind: string; at: At; port: string },
            ) => void
            cell: (at: At) => { kind: string; on?: boolean; out?: number }
            tick: (dt: number) => void
            seam: { kind: string }
            dismissRecap: () => void
          }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      const p = w.pumps[0]
      p.water.stored = 10
      if (w.seam.kind === 'recap') w.dismissRecap()
      w.tick(dt)
      const grew = p.water.stored > 10
      w.armWire({ kind: 'cell', at: lever, port: 'out' })
      w.placeWire({ kind: 'cell', at: lever, port: 'out' }, { kind: 'cell', at: pump, port: 'in' })
      const lev = w.cell(lever)
      if (lev.kind !== 'lever') throw new Error('lever')
      lev.on = true
      lev.out = 1
      w.tick(dt)
      p.water.stored = 10
      w.tick(dt)
      return { grew, inn: p.inn, held: p.water.stored, took: p.water.take(2) }
    },
    [LEVER, origin, DT_MAX] as const,
  )
  expect(stored.grew).toBe(true)
  expect(stored.inn).toBe(1)
  expect(stored.held).toBe(10)
  expect(stored.took).toBe(2)
})
