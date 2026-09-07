import { expect, test, type Page } from '@playwright/test'
import { SOIL_WATER_MID, waterBand } from '../src/game/sim/soil.ts'
import { closeDock, dismissRecap, gotoPlay, tapWorld } from './helpers.ts'

type At = { col: number; row: number }

const PLOT: At = { col: 13, row: 11 }
const SILO: At = { col: 17, row: 9 }
const DOOR: At = { col: 15, row: 9 }
const PUMP: At = { col: 18, row: 7 }

type HandSnap = { kind: string; itemKind?: string; liters?: number; capacityLiters?: number }

type PlotSnap = { kind: string; water?: number; tol?: number }

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

async function handSnap(page: Page): Promise<HandSnap> {
  await dismissRecap(page)
  return readWorld<HandSnap>(
    page,
    null,
    '(() => { const h = w.seats[0].hand; return h.kind === "hold" ? { kind: h.kind, itemKind: h.item.kind, liters: h.item.liters, capacityLiters: h.item.capacityLiters } : { kind: h.kind } })()',
  )
}

async function plotSnap(page: Page, at: At): Promise<PlotSnap> {
  await dismissRecap(page)
  return readWorld<PlotSnap>(
    page,
    at,
    '(() => { const c = w.cell(at); return c.plant === undefined ? { kind: c.kind } : { kind: c.kind, water: c.soil.water, tol: c.plant.stats(w.modifiers).waterTolerance } })()',
  )
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

test('till, plant, pour, ripe', async ({ page }) => {
  test.setTimeout(180_000)
  await gotoPlay(page, { speed: 10 })
  await viewReady(page)

  await tapUntil(
    page,
    PLOT,
    async () => (await cellKind(page, PLOT)) === 'empty' && (await queueLen(page)) === 0,
  )

  await tapWorld(page, SILO.col + 0.5, SILO.row + 0.5)
  const silo = page.getByRole('dialog', { name: 'Seed silo' })
  await expect(silo).toBeVisible({ timeout: 30_000 })
  const take = page.getByRole('button', { name: /Carrot - 7/ })
  await take.evaluate((el: HTMLElement) => el.click())
  await expect
    .poll(async () => {
      const h = await handSnap(page)
      return h.kind === 'hold' && h.itemKind === 'seeds'
    })
    .toBe(true)
  await closeDock(page)
  await expect(silo).toHaveCount(0)
  await expect.poll(async () => queueLen(page)).toBe(0)

  await tapUntil(
    page,
    PLOT,
    async () => (await cellKind(page, PLOT)) === 'growing' && (await queueLen(page)) === 0,
  )

  await tapUntil(page, DOOR, async () => {
    const h = await handSnap(page)
    return (await queueLen(page)) === 0 && h.kind === 'hold' && h.itemKind === 'container'
  })

  await tapUntil(page, PUMP, async () => {
    const h = await handSnap(page)
    return (
      (await queueLen(page)) === 0 &&
      h.kind === 'hold' &&
      h.itemKind === 'container' &&
      h.liters === h.capacityLiters
    )
  })

  await tapUntil(page, PLOT, async () => {
    if ((await queueLen(page)) !== 0) return false
    const p = await plotSnap(page, PLOT)
    if (p.water === undefined || p.tol === undefined) return false
    if (p.kind !== 'growing' && p.kind !== 'ripe') return false
    return p.water >= SOIL_WATER_MID && waterBand(p.water, p.tol) === 'green'
  })

  await expect.poll(async () => cellKind(page, PLOT), { timeout: 120_000 }).toBe('ripe')
})
