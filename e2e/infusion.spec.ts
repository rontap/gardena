import { expect, test, type Page } from '@playwright/test'
import {
  BREAD,
  FURNACE_BREAD_IN,
  FURNACE_SECONDS,
  INFUSE_EXTRACT,
  INFUSE_FLAKES,
  INFUSE_IN,
  INFUSE_SECONDS,
  MILL_CHILLI_IN,
  MILL_CHILLI_OUT,
  MILL_H,
  MILL_VANILLA_IN,
  MILL_VANILLA_OUT,
  MILL_W,
  MILL_WORK,
} from '../src/game/defs/items.ts'
import { qualityMul } from '../src/game/defs/varieties.ts'
import { PAD } from '../src/game/sim/building.ts'
import { REP_DONE } from '../src/game/sim/feature-contracts/market.ts'
import { DT_MAX } from '../src/game/sim/world.ts'
import { gotoPlay } from './helpers.ts'

type At = { col: number; row: number }

const SOW: At = { col: 13, row: 11 }
const MILL_AT: At = { col: 8, row: 14 }
const INF_AT: At = { col: 8, row: 11 }
const FURNACE_AT: At = { col: 12, row: 16 }

const OVERLAY_FILL = 'fill="#d4a017"'

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
      const n = Math.ceil(seconds / dt) + 1
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

async function heldOverlay(page: Page): Promise<boolean> {
  return page.locator('svg').evaluateAll((els, fill) => els.some(el => el.innerHTML.includes(fill)), OVERLAY_FILL)
}

test('chilli sow and mill flakes', async ({ page }) => {
  test.setTimeout(90_000)
  await gotoPlay(page)
  await viewReady(page)
  await page.evaluate(
    ([sow, millAt, millW, millH]) => {
      const w = (
        window as unknown as {
          __world?: {
            unlockAll: () => void
            setCell: (at: At, cell: unknown) => void
            buy: (id: string) => void
            confirmPlace: (at: At) => void
            enqueue: (i: { act: string; at: At }) => void
            seats: { actor: { x: number; y: number }; hand: unknown }[]
          }
        }
      ).__world
      const e = (window as unknown as { __e2e?: { Soil: new (a: number, b: number, c: number) => unknown } }).__e2e
      if (w === undefined || e === undefined) throw new Error('no __world')
      w.unlockAll()
      w.setCell(sow, { kind: 'empty', soil: new e.Soil(1, 1, 0) })
      Array.from({ length: millH }, (_, r) =>
        Array.from({ length: millW }, (_, c) => ({ col: millAt.col + c, row: millAt.row + r })),
      )
        .flat()
        .forEach(at => w.setCell(at, { kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'bare' } }))
      w.buy('buy-mill')
      w.confirmPlace(millAt)
      w.seats[0].actor.x = sow.col + 0.5
      w.seats[0].actor.y = sow.row + 0.5
      w.seats[0].hand = { kind: 'hold', item: { kind: 'seeds', crop: 'chilli', variety: 'base', quality: 0, count: 5 } }
      w.enqueue({ act: 'plant', at: sow })
    },
    [SOW, MILL_AT, MILL_W, MILL_H],
  )
  await drain(page)
  const growing = await readWorld<{ kind: string; crop?: string }>(
    page,
    SOW,
    '(() => { const c = w.cell(at); return { kind: c.kind, crop: c.plant && c.plant.crop } })()',
  )
  expect(growing).toEqual({ kind: 'growing', crop: 'chilli' })
  await page.evaluate(
    ([millAt, millIn]) => {
      const w = (
        window as unknown as {
          __world?: {
            seats: { actor: { x: number; y: number }; hand: unknown }[]
            enqueue: (i: { act: string; at: At }) => void
          }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      w.seats[0].actor.x = millAt.col + 0.5
      w.seats[0].actor.y = millAt.row + 0.5
      w.seats[0].hand = {
        kind: 'hold',
        item: {
          kind: 'fruit',
          crop: 'chilli',
          variety: 'base',
          quality: 0.25,
          count: millIn,
          unitSale: 1,
          freshness: 1,
          cut: false,
        },
      }
      w.enqueue({ act: 'mill', at: millAt })
    },
    [MILL_AT, MILL_CHILLI_IN],
  )
  await drain(page)
  expect(await readWorld<string>(page, MILL_AT, 'w.cell(at).recipe')).toBe('chilli')
  await ticks(page, MILL_WORK)
  const flakes = await readWorld<{ kind: string; count: number; quality: number } | undefined>(
    page,
    null,
    '(() => { const d = w.drops.find(x => x.item.kind === "flakes"); return d && d.item })()',
  )
  expect(flakes).toEqual({ kind: 'flakes', quality: 0.25, count: MILL_CHILLI_OUT })
})

test('vanilla mill 1 fruit to 4 vanilla-extract', async ({ page }) => {
  test.setTimeout(60_000)
  await gotoPlay(page)
  await viewReady(page)
  await page.evaluate(
    ([millAt, millW, millH, millIn]) => {
      const w = (
        window as unknown as {
          __world?: {
            unlockAll: () => void
            setCell: (at: At, cell: unknown) => void
            buy: (id: string) => void
            confirmPlace: (at: At) => void
            seats: { actor: { x: number; y: number }; hand: unknown }[]
            enqueue: (i: { act: string; at: At }) => void
          }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      w.unlockAll()
      Array.from({ length: millH }, (_, r) =>
        Array.from({ length: millW }, (_, c) => ({ col: millAt.col + c, row: millAt.row + r })),
      )
        .flat()
        .forEach(at => w.setCell(at, { kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'bare' } }))
      w.buy('buy-mill')
      w.confirmPlace(millAt)
      w.seats[0].actor.x = millAt.col + 0.5
      w.seats[0].actor.y = millAt.row + 0.5
      w.seats[0].hand = {
        kind: 'hold',
        item: {
          kind: 'fruit',
          crop: 'vanilla',
          variety: 'base',
          quality: 0.5,
          count: millIn,
          unitSale: 1,
          freshness: 1,
          cut: false,
        },
      }
      w.enqueue({ act: 'mill', at: millAt })
    },
    [MILL_AT, MILL_W, MILL_H, MILL_VANILLA_IN],
  )
  await drain(page)
  expect(await readWorld<string>(page, MILL_AT, 'w.cell(at).recipe')).toBe('vanilla')
  await ticks(page, MILL_WORK)
  const out = await readWorld<{ kind: string; count: number; quality: number } | undefined>(
    page,
    null,
    '(() => { const d = w.drops.find(x => x.item.kind === "vanilla-extract"); return d && d.item })()',
  )
  expect(out).toEqual({ kind: 'vanilla-extract', quality: 0.5, count: MILL_VANILLA_OUT })
  expect(MILL_VANILLA_IN).toBe(1)
  expect(MILL_VANILLA_OUT).toBe(4)
})

test('Infuser dump flakes or vanilla-extract; overlay on held and drop', async ({ page }) => {
  test.setTimeout(90_000)
  await gotoPlay(page)
  await viewReady(page)
  await page.evaluate(
    ([infAt, millW, millH, infIn]) => {
      const w = (
        window as unknown as {
          __world?: {
            unlockAll: () => void
            setCell: (at: At, cell: unknown) => void
            buy: (id: string) => void
            confirmPlace: (at: At) => void
            seats: { actor: { x: number; y: number }; hand: unknown }[]
            enqueue: (i: { act: string; at: At }) => void
          }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      w.unlockAll()
      Array.from({ length: millH }, (_, r) =>
        Array.from({ length: millW }, (_, c) => ({ col: infAt.col + c, row: infAt.row + r })),
      )
        .flat()
        .forEach(at => w.setCell(at, { kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'bare' } }))
      w.buy('buy-infuser')
      w.confirmPlace(infAt)
      w.seats[0].actor.x = infAt.col + 0.5
      w.seats[0].actor.y = infAt.row + 0.5
      w.seats[0].hand = {
        kind: 'hold',
        item: { kind: 'jam', crop: 'grape', variety: 'base', quality: 0.4, count: infIn, unitSale: 72, infused: false },
      }
      w.enqueue({ act: 'infuse', at: infAt })
    },
    [INF_AT, MILL_W, MILL_H, INFUSE_IN],
  )
  await drain(page)
  expect(await readWorld<string>(page, INF_AT, 'w.cell(at).lock.kind')).toBe('jam')
  await page.evaluate(
    ([infAt, flakesN]) => {
      const w = (
        window as unknown as {
          __world?: { seats: { hand: unknown }[]; enqueue: (i: { act: string; at: At }) => void }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      w.seats[0].hand = { kind: 'hold', item: { kind: 'flakes', quality: 1, count: flakesN } }
      w.enqueue({ act: 'infuse', at: infAt })
    },
    [INF_AT, INFUSE_FLAKES],
  )
  await drain(page)
  await ticks(page, INFUSE_SECONDS)
  const jamDrop = await readWorld<{ kind: string; infused?: boolean; count: number } | undefined>(
    page,
    null,
    '(() => { const d = w.drops.find(x => x.item.kind === "jam"); return d && d.item })()',
  )
  expect(jamDrop).toMatchObject({ kind: 'jam', infused: true, count: 1 })
  await page.evaluate(() => {
    const w = (window as unknown as { __world?: { seats: { hand: unknown }[]; drops: { item: unknown }[]; ping: () => void } }).__world
    if (w === undefined) throw new Error('no __world')
    const d = w.drops.find(x => (x.item as { kind: string }).kind === 'jam')
    if (d === undefined) throw new Error('jam drop')
    w.seats[0].hand = { kind: 'hold', item: d.item }
    w.ping()
  })
  await expect.poll(async () => heldOverlay(page)).toBe(true)
  await page.evaluate(
    ([infAt, infIn]) => {
      const w = (
        window as unknown as {
          __world?: { seats: { hand: unknown }[]; enqueue: (i: { act: string; at: At }) => void }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      w.seats[0].hand = { kind: 'hold', item: { kind: 'oil', quality: 0.2, count: infIn, unitSale: 96, infused: false } }
      w.enqueue({ act: 'infuse', at: infAt })
    },
    [INF_AT, INFUSE_IN],
  )
  await drain(page)
  await page.evaluate(
    ([infAt, extractN]) => {
      const w = (
        window as unknown as {
          __world?: { seats: { hand: unknown }[]; enqueue: (i: { act: string; at: At }) => void }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      w.seats[0].hand = { kind: 'hold', item: { kind: 'vanilla-extract', quality: 1, count: extractN } }
      w.enqueue({ act: 'infuse', at: infAt })
    },
    [INF_AT, INFUSE_EXTRACT],
  )
  await drain(page)
  await ticks(page, INFUSE_SECONDS)
  const oilDrop = await readWorld<{ kind: string; infused?: boolean } | undefined>(
    page,
    null,
    '(() => { const d = w.drops.find(x => x.item.kind === "oil" && x.item.infused); return d && d.item })()',
  )
  expect(oilDrop).toMatchObject({ kind: 'oil', infused: true })
  await page.evaluate(() => {
    const w = (
      window as unknown as { __world?: { seats: { hand: unknown }[]; drops: { at: At; item: { kind: string; infused?: boolean } }[]; ping: () => void } }
    ).__world
    if (w === undefined) throw new Error('no __world')
    const d = w.drops.find(x => x.item.kind === 'oil' && x.item.infused)
    if (d === undefined) throw new Error('oil drop')
    w.seats[0].hand = { kind: 'hold', item: d.item }
    w.ping()
  })
  await expect.poll(async () => heldOverlay(page)).toBe(true)
  const stillDropped = await readWorld<boolean>(
    page,
    null,
    'w.drops.some(d => d.item.kind === "jam" && d.item.infused)',
  )
  expect(stillDropped).toBe(true)
})

test('infused Sell all does not raise sat', async ({ page }) => {
  test.setTimeout(60_000)
  await gotoPlay(page)
  await viewReady(page)
  const snap = await page.evaluate(() => {
    const w = (
      window as unknown as {
        __world?: {
          unlockAll: () => void
          clock: { t: number }
          stall: { oil: { takeSpirit: (v: string, n: number, u: number, inf: boolean) => void; sat: number } }
          marketOpen: () => boolean
          sellAll: () => void
        }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    w.unlockAll()
    w.clock.t = 10
    w.stall.oil.takeSpirit('base', 3, 100, true)
    w.stall.oil.sat = 0.4
    const open = w.marketOpen()
    const before = w.stall.oil.sat
    w.sellAll()
    return { open, before, after: w.stall.oil.sat }
  })
  expect(snap.open).toBe(true)
  expect(snap.before).toBe(0.4)
  expect(snap.after).toBeCloseTo(0.4, 9)
})

test('contract complete uses infused reputation fraction', async ({ page }) => {
  test.setTimeout(60_000)
  await gotoPlay(page)
  await viewReady(page)
  await page.evaluate(pad => {
    const w = (
      window as unknown as {
        __world?: {
          unlockAll: () => void
          contracts: {
            active: {
              offer: unknown
              dueDay: number
              bins: { demand: unknown; filled: number; infusedFilled: number }[]
            }[]
          }
          seats: { actor: { x: number; y: number }; hand: unknown }[]
          enqueue: (i: { act: string }) => void
        }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    w.unlockAll()
    const demand = { kind: 'plain', good: 'jam-grape', amount: 4 }
    w.contracts.active.push({
      offer: {
        id: 0,
        slot: 0,
        company: 'whole-cart',
        difficulty: 1,
        stars: 1,
        band: 'long',
        days: 4,
        lines: [demand],
        prize: { kind: 'cash' },
        clean: 4,
        markup: 0.2,
        reward: 5,
        penalty: 1,
      },
      dueDay: 10,
      bins: [{ demand, filled: 0, infusedFilled: 0 }],
    })
    w.seats[0].actor.x = pad.col + 0.5
    w.seats[0].actor.y = pad.row + 0.5
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'jam', crop: 'grape', variety: 'base', quality: 0, count: 4, unitSale: 72, infused: true },
    }
    w.enqueue({ act: 'consign' })
  }, PAD)
  await drain(page)
  const snap = await readWorld<{ n: number; rep: number }>(
    page,
    null,
    '({ n: w.contracts.active.length, rep: w.contracts.rep })',
  )
  expect(snap.n).toBe(0)
  expect(snap.rep).toBeCloseTo(REP_DONE[1] * (1 + 0.25 * 1), 9)
})

test('furnace bread vs ash', async ({ page }) => {
  test.setTimeout(90_000)
  await gotoPlay(page)
  await viewReady(page)
  await page.evaluate(
    ([at, breadIn]) => {
      const w = (
        window as unknown as {
          __world?: {
            unlockAll: () => void
            setCell: (at: At, cell: unknown) => void
            buy: (id: string) => void
            confirmPlace: (at: At) => void
            seats: { actor: { x: number; y: number }; hand: unknown }[]
            enqueue: (i: { act: string; at: At }) => void
          }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      w.unlockAll()
      w.setCell(at, { kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'bare' } })
      w.setCell({ col: at.col, row: at.row + 1 }, { kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'bare' } })
      w.buy('buy-furnace')
      w.confirmPlace(at)
      w.seats[0].actor.x = at.col + 0.5
      w.seats[0].actor.y = at.row + 0.5
      w.seats[0].hand = { kind: 'hold', item: { kind: 'flour', quality: 0.5, count: breadIn, unitSale: 72 } }
      w.enqueue({ act: 'furnace', at })
    },
    [FURNACE_AT, FURNACE_BREAD_IN],
  )
  await drain(page)
  expect(await readWorld<string>(page, FURNACE_AT, 'w.cell(at).recipe')).toBe('bread')
  await page.evaluate(at => {
    const w = (
      window as unknown as {
        __world?: { seats: { hand: unknown }[]; enqueue: (i: { act: string; at: At }) => void }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    w.seats[0].hand = { kind: 'hold', item: { kind: 'wood', count: 1 } }
    w.enqueue({ act: 'furnace', at })
  }, FURNACE_AT)
  await drain(page)
  expect(await readWorld<string>(page, FURNACE_AT, 'w.cell(at).recipe')).toBe('bread')
  expect(await readWorld<number>(page, FURNACE_AT, 'w.cell(at).units')).toBe(FURNACE_BREAD_IN)
  await ticks(page, FURNACE_SECONDS)
  expect(await readWorld<string>(page, FURNACE_AT, 'w.cell(at).recipe')).toBe('none')
  const loaf = await readWorld<{ kind: string; quality: number; count: number; unitSale: number } | undefined>(
    page,
    null,
    '(() => { const d = w.drops.find(x => x.item.kind === "bread"); return d && d.item })()',
  )
  expect(loaf).toEqual({ kind: 'bread', quality: 0.5, count: 1, unitSale: BREAD * qualityMul(0.5) })
  await page.evaluate(at => {
    const w = (
      window as unknown as {
        __world?: { seats: { hand: unknown }[]; enqueue: (i: { act: string; at: At }) => void }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    w.seats[0].hand = { kind: 'hold', item: { kind: 'wood', count: 1 } }
    w.enqueue({ act: 'furnace', at })
  }, FURNACE_AT)
  await drain(page)
  expect(await readWorld<string>(page, FURNACE_AT, 'w.cell(at).recipe')).toBe('ash')
  await page.evaluate(at => {
    const w = (
      window as unknown as {
        __world?: { seats: { hand: unknown }[]; enqueue: (i: { act: string; at: At }) => void }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    w.seats[0].hand = { kind: 'hold', item: { kind: 'flour', quality: 0, count: 1, unitSale: 72 } }
    w.enqueue({ act: 'furnace', at })
  }, FURNACE_AT)
  await drain(page)
  expect(await readWorld<string>(page, FURNACE_AT, 'w.cell(at).recipe')).toBe('ash')
})
