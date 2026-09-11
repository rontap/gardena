import { expect, test, type Page } from '@playwright/test'
import { COMPOST_VALUE, FURNACE_ASH, FURNACE_HASTE, FURNACE_NEED, FURNACE_SECONDS, FURNACE_VALUE, MILL_H, MILL_IN, MILL_W, MILL_WORK } from '../src/game/defs/items.ts'
import { DT_MAX } from '../src/game/sim/world.ts'
import { armSku, gotoPlay, hoverWorld, tapWorld } from './helpers.ts'

type At = { col: number; row: number }

const FURNACE_AT: At = { col: 12, row: 11 }
const BOX_AT: At = { col: 14, row: 11 }
const MILL_AT: At = { col: 8, row: 14 }
const F1: At = { col: 10, row: 16 }
const F2: At = { col: 6, row: 14 }
const CTRL: At = { col: 8, row: 22 }

function rectFoot(at: At, w: number, h: number): At[] {
  return Array.from({ length: h }, (_, r) => Array.from({ length: w }, (_, c) => ({ col: at.col + c, row: at.row + r }))).flat()
}

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

test('research furnace, place 1×2, dump mixed feedstock, ash, compost', async ({ page }) => {
  test.setTimeout(120_000)
  await gotoPlay(page, { speed: 3 })
  await viewReady(page)

  await page.evaluate(spots => {
    const w = (
      window as unknown as {
        __world?: {
          done: Set<string>
          cheatMoney: () => void
          setCell: (at: { col: number; row: number }, cell: unknown) => void
        }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    w.done.add('unlock-grinder')
    w.done.add('unlock-fermentation')
    w.cheatMoney()
    spots.forEach(at => w.setCell(at, { kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'bare' } }))
  }, [FURNACE_AT, { col: FURNACE_AT.col, row: FURNACE_AT.row + 1 }, BOX_AT])

  await page.getByRole('button', { name: 'Research', exact: true }).click()
  await expect(page.getByText('Research', { exact: true }).first()).toBeVisible()
  await page.getByRole('tab', { name: 'Trade' }).click()
  const card = page.getByRole('button', { name: /Furnace/ })
  await expect(card).toBeVisible()
  await card.click()
  await ticks(page, 100)
  expect(await readWorld<boolean>(page, null, 'w.done.has("unlock-furnace")')).toBe(true)
  await page.getByRole('button', { name: 'Close' }).click()

  await armSku(page, 'Furnace 55', 'Automation')
  await expect
    .poll(async () => {
      const kind = await readWorld<string>(page, FURNACE_AT, 'w.cell(at).kind')
      if (kind !== 'furnace') await tapWorld(page, FURNACE_AT.col + 0.5, FURNACE_AT.row + 0.5)
      return kind
    }, { timeout: 20_000 })
    .toBe('furnace')
  const foot = await readWorld<{ origin: string; south: string; w: number; h: number }>(
    page,
    FURNACE_AT,
    '(() => { const a = w.cell(at); const b = w.cell({ col: at.col, row: at.row + 1 }); return { origin: a.kind, south: b.kind, w: a.base.w, h: a.base.h } })()',
  )
  expect(foot).toEqual({ origin: 'furnace', south: 'furnace', w: 1, h: 2 })
  await page.keyboard.press('Escape')

  await page.evaluate(at => {
    const w = (
      window as unknown as {
        __world?: {
          seats: { actor: { x: number; y: number }; hand: unknown }[]
          enqueue: (i: { act: string; at: { col: number; row: number } }) => void
        }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    w.seats[0].actor.x = at.col + 0.5
    w.seats[0].actor.y = at.row + 0.5
    w.seats[0].hand = { kind: 'hold', item: { kind: 'weed', count: 8 } }
    w.enqueue({ act: 'furnace', at })
  }, FURNACE_AT)
  await drain(page)
  await page.evaluate(at => {
    const w = (
      window as unknown as {
        __world?: {
          seats: { hand: unknown }[]
          enqueue: (i: { act: string; at: { col: number; row: number } }) => void
        }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'carrot', variety: 'base', quality: 0, count: 4, unitSale: 1, freshness: 1, bio: true, cut: false },
    }
    w.enqueue({ act: 'furnace', at })
  }, FURNACE_AT)
  await drain(page)
  const units = await readWorld<number>(page, FURNACE_AT, 'w.cell(at).units')
  expect(units).toBe(FURNACE_VALUE.green * 8 + FURNACE_VALUE.fruit * 4)
  expect(units).toBe(FURNACE_NEED)

  await ticks(page, FURNACE_SECONDS + 1)
  const ash = await readWorld<{ n: number; east: boolean }>(
    page,
    FURNACE_AT,
    `(() => {
      const east = w.cell({ col: at.col + 1, row: at.row })
      const chest = east.kind === 'chest' || east.kind === 'freezer'
        ? east.slots.filter(s => s.kind === 'hold' && s.item.kind === 'ash').reduce((n, s) => n + s.item.count, 0)
        : 0
      const ground = w.drops.filter(d => d.item.kind === 'ash').reduce((n, d) => n + d.item.count, 0)
      return { n: chest + ground, east: chest > 0 }
    })()`,
  )
  expect(ash.n).toBe(FURNACE_ASH)

  await page.evaluate(at => {
    const w = (
      window as unknown as {
        __world?: {
          buy: (id: string) => void
          confirmPlace: (at: { col: number; row: number }) => void
          seats: { actor: { x: number; y: number }; hand: unknown; place: { kind: string } }[]
          enqueue: (i: { act: string; at: { col: number; row: number } }) => void
          drops: { at: { col: number; row: number }; item: { kind: string; count: number } }[]
        }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    if (w.seats[0].place.kind !== 'none') w.seats[0].place = { kind: 'none' }
    w.buy('buy-compost-box')
    w.confirmPlace(at)
    const drop = w.drops.find(d => d.item.kind === 'ash')
    w.seats[0].hand = drop === undefined ? { kind: 'empty' } : { kind: 'hold', item: drop.item }
    if (drop !== undefined) w.drops.splice(w.drops.indexOf(drop), 1)
    w.seats[0].actor.x = at.col + 0.5
    w.seats[0].actor.y = at.row + 1.5
    w.enqueue({ act: 'compost', at })
  }, BOX_AT)
  await drain(page)
  const waste = await readWorld<number>(page, BOX_AT, 'w.cell(at).units')
  expect(waste).toBe(COMPOST_VALUE.ash * FURNACE_ASH)
})

test('two working furnaces overlapping a mill vs a control mill', async ({ page }) => {
  test.setTimeout(90_000)
  await gotoPlay(page)
  await viewReady(page)
  await page.evaluate(
    ([spots, millAt, f1, f2, ctrl, millIn]) => {
      const w = (
        window as unknown as {
          __world?: {
            unlockAll: () => void
            setCell: (at: { col: number; row: number }, cell: unknown) => void
            buy: (id: string) => void
            confirmPlace: (at: { col: number; row: number }) => void
            cell: (at: { col: number; row: number }) => {
              kind: string
              recipe?: string
              units: number
              progress: number
              inn?: number
            }
          }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      spots.forEach(at => {
        w.setCell(at, { kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'bare' } })
      })
      w.unlockAll()
      w.buy('buy-mill')
      w.confirmPlace(millAt)
      w.buy('buy-mill')
      w.confirmPlace(ctrl)
      w.buy('buy-furnace')
      w.confirmPlace(f1)
      w.buy('buy-furnace')
      w.confirmPlace(f2)
      const mill = w.cell(millAt)
      mill.recipe = 'wheat'
      mill.units = millIn
      mill.progress = 0
      const control = w.cell(ctrl)
      control.recipe = 'wheat'
      control.units = millIn
      control.progress = 0
      const a = w.cell(f1)
      a.units = 20
      a.progress = 0
      if (a.inn !== undefined) a.inn = 0
      const b = w.cell(f2)
      b.units = 20
      b.progress = 0
      if (b.inn !== undefined) b.inn = 0
    },
    [
      [
        ...rectFoot(MILL_AT, MILL_W, MILL_H),
        ...rectFoot(CTRL, MILL_W, MILL_H),
        F1,
        { col: F1.col, row: F1.row + 1 },
        F2,
        { col: F2.col, row: F2.row + 1 },
      ],
      MILL_AT,
      F1,
      F2,
      CTRL,
      MILL_IN,
    ],
  )
  expect(await readWorld<string>(page, MILL_AT, 'w.cell(at).kind')).toBe('mill')
  expect(await readWorld<string>(page, F1, 'w.cell(at).kind')).toBe('furnace')
  expect(await readWorld<string>(page, F2, 'w.cell(at).kind')).toBe('furnace')
  const delta = await page.evaluate(
    ([millAt, ctrl, dt]) => {
      const w = (
        window as unknown as {
          __world?: {
            seam: { kind: string }
            dismissRecap: () => void
            tick: (dt: number) => void
            cell: (at: { col: number; row: number }) => { progress: number }
          }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      if (w.seam.kind === 'recap') w.dismissRecap()
      const mill = w.cell(millAt)
      const control = w.cell(ctrl)
      mill.progress = 0
      control.progress = 0
      w.tick(dt)
      return { mill: mill.progress, ctrl: control.progress }
    },
    [MILL_AT, CTRL, DT_MAX],
  )
  const n = 2
  expect(delta.mill).toBeCloseTo((DT_MAX * (1 + FURNACE_HASTE * n)) / MILL_WORK)
  expect(delta.ctrl).toBeCloseTo(DT_MAX / MILL_WORK)
})

async function lookAt(page: Page, at: At): Promise<string> {
  return page.evaluate(a => {
    const w = (window as unknown as { __world?: unknown }).__world
    const e = (
      window as unknown as { __e2e?: { lookText: (w: unknown, hit: { kind: string; at: At }, armed: boolean) => string } }
    ).__e2e
    if (w === undefined || e === undefined) throw new Error('no __world')
    return e.lookText(w, { kind: 'cell', at: a }, false)
  }, at)
}

function extraLines(before: string, after: string): string[] {
  const prev = new Set(before.split('\n'))
  return after.split('\n').filter(l => !prev.has(l))
}

test('covering stroke on buy-furnace place and unarmed hover of a placed furnace', async ({ page }) => {
  test.setTimeout(60_000)
  await gotoPlay(page)
  await viewReady(page)
  await page.evaluate(at => {
    const w = (
      window as unknown as {
        __world?: {
          unlockAll: () => void
          cheatMoney: () => void
          setCell: (at: { col: number; row: number }, cell: unknown) => void
        }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    w.unlockAll()
    w.cheatMoney()
    w.setCell(at, { kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'bare' } })
    w.setCell({ col: at.col, row: at.row + 1 }, { kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'bare' } })
  }, FURNACE_AT)
  const cover = page.locator('[data-furnace-cover]')
  await hoverWorld(page, FURNACE_AT.col + 0.5, FURNACE_AT.row + 0.5)
  await expect(cover).toHaveCount(0)
  await armSku(page, 'Furnace 55', 'Automation')
  await hoverWorld(page, FURNACE_AT.col + 0.5, FURNACE_AT.row + 0.5)
  await expect(cover).toHaveCount(1)
  await expect(cover).toHaveAttribute('fill', 'none')
  expect((await cover.getAttribute('d'))?.match(/M/g)).toHaveLength(1)
  await expect(page.locator('[data-cell-stroke]')).toHaveCount(1)
  await expect
    .poll(async () => {
      const kind = await readWorld<string>(page, FURNACE_AT, 'w.cell(at).kind')
      if (kind !== 'furnace') await tapWorld(page, FURNACE_AT.col + 0.5, FURNACE_AT.row + 0.5)
      return kind
    }, { timeout: 20_000 })
    .toBe('furnace')
  await page.keyboard.press('Escape')
  await hoverWorld(page, 8.5, 10.5)
  await expect(cover).toHaveCount(0)
  await hoverWorld(page, FURNACE_AT.col + 0.5, FURNACE_AT.row + 0.5)
  await expect(cover).toHaveCount(1)
  expect((await cover.getAttribute('d'))?.match(/M/g)).toHaveLength(1)
  await hoverWorld(page, FURNACE_AT.col + 0.5, FURNACE_AT.row + 1.5)
  await expect(cover).toHaveCount(1)
  expect((await cover.getAttribute('d'))?.match(/M/g)).toHaveLength(1)
  await expect(page.locator('[data-cell-stroke]')).toHaveCount(1)
})

test('working furnace mounts furnace and furnace-smoke vfx', async ({ page }) => {
  test.setTimeout(60_000)
  await gotoPlay(page)
  await viewReady(page)
  await page.evaluate(
    at => {
      const w = (
        window as unknown as {
          __world?: {
            unlockAll: () => void
            setCell: (at: { col: number; row: number }, cell: unknown) => void
            buy: (id: string) => void
            confirmPlace: (at: { col: number; row: number }) => void
            cell: (at: { col: number; row: number }) => { units: number; progress: number; recipe: string; inn?: number }
          }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      w.setCell(at, { kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'bare' } })
      w.setCell({ col: at.col, row: at.row + 1 }, { kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'bare' } })
      w.unlockAll()
      w.buy('buy-furnace')
      w.confirmPlace(at)
      const f = w.cell(at)
      f.units = 0
      f.progress = 0
      if (f.inn !== undefined) f.inn = 0
    },
    FURNACE_AT,
  )
  await expect(page.locator('[data-vfx="furnace"]')).toHaveCount(0)
  await expect(page.locator('[data-vfx="furnace-smoke"]')).toHaveCount(0)
  await page.evaluate(
    ([at, need]) => {
      const w = (
        window as unknown as {
          __world?: { cell: (at: { col: number; row: number }) => { units: number; progress: number; recipe: string; inn?: number } }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      const f = w.cell(at)
      f.units = need
      f.recipe = 'ash'
      f.progress = 0
      if (f.inn !== undefined) f.inn = 0
    },
    [FURNACE_AT, FURNACE_NEED],
  )
  await expect(page.locator('[data-vfx="furnace"]')).toHaveCount(1)
  await expect(page.locator('[data-vfx="furnace-smoke"]')).toHaveCount(1)
  await expect.poll(async () =>
    page.evaluate(() => (window as unknown as { __view: { vfxN: number } }).__view.vfxN),
  ).toBeGreaterThan(0)
  await page.evaluate(at => {
    const w = (
      window as unknown as {
        __world?: { cell: (at: { col: number; row: number }) => { units: number; progress: number } }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    const f = w.cell(at)
    f.units = 0
    f.progress = 0
  }, FURNACE_AT)
  await expect(page.locator('[data-vfx="furnace"]')).toHaveCount(0)
  await expect(page.locator('[data-vfx="furnace-smoke"]')).toHaveCount(0)
})

test('covering haste look on mill jam still grinder compost-box furnace, never barrel', async ({ page }) => {
  test.setTimeout(60_000)
  await gotoPlay(page)
  await viewReady(page)
  const mill = MILL_AT
  const jam = { col: 10, row: 14 }
  const grind = { col: 11, row: 14 }
  const box = { col: 12, row: 14 }
  const still = { col: 8, row: 16 }
  const barrel = { col: 6, row: 14 }
  const furnace = F1
  await page.evaluate(
    ([spots, millAt, jamAt, grindAt, boxAt, stillAt, barrelAt, furnaceAt]) => {
      const w = (
        window as unknown as {
          __world?: {
            unlockAll: () => void
            setCell: (at: { col: number; row: number }, cell: unknown) => void
            buy: (id: string) => void
            confirmPlace: (at: { col: number; row: number }) => void
            cell: (at: { col: number; row: number }) => { units: number; progress: number; recipe: string; inn?: number }
          }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      spots.forEach(at => w.setCell(at, { kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'bare' } }))
      w.unlockAll()
      w.buy('buy-mill')
      w.confirmPlace(millAt)
      w.buy('buy-jam')
      w.confirmPlace(jamAt)
      w.buy('buy-grinder')
      w.confirmPlace(grindAt)
      w.buy('buy-compost-box')
      w.confirmPlace(boxAt)
      w.buy('buy-still')
      w.confirmPlace(stillAt)
      w.buy('buy-barrel')
      w.confirmPlace(barrelAt)
      w.buy('buy-furnace')
      w.confirmPlace(furnaceAt)
      const f = w.cell(furnaceAt)
      f.units = 0
      f.progress = 0
      if (f.inn !== undefined) f.inn = 0
    },
    [
      [
        ...rectFoot(mill, MILL_W, MILL_H),
        jam,
        grind,
        box,
        still,
        { col: still.col + 1, row: still.row },
        barrel,
        furnace,
        { col: furnace.col, row: furnace.row + 1 },
      ],
      mill,
      jam,
      grind,
      box,
      still,
      barrel,
      furnace,
    ],
  )
  const idle = {
    mill: await lookAt(page, mill),
    barrel: await lookAt(page, barrel),
  }
  await page.evaluate(
    ([at, need]) => {
      const w = (
        window as unknown as {
          __world?: { cell: (at: { col: number; row: number }) => { units: number; progress: number; recipe: string; inn?: number } }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      const f = w.cell(at)
      f.units = need
      f.recipe = 'ash'
      f.progress = 0
      if (f.inn !== undefined) f.inn = 0
    },
    [furnace, FURNACE_NEED],
  )
  await hoverWorld(page, mill.col + 0.5, mill.row + 0.5)
  const haste = extraLines(idle.mill, await lookAt(page, mill))
  expect(haste).toHaveLength(1)
  const line = haste[0]
  await hoverWorld(page, jam.col + 0.5, jam.row + 0.5)
  expect((await lookAt(page, jam)).split('\n')).toContain(line)
  await hoverWorld(page, grind.col + 0.5, grind.row + 0.5)
  expect((await lookAt(page, grind)).split('\n')).toContain(line)
  await hoverWorld(page, box.col + 0.5, box.row + 0.5)
  expect((await lookAt(page, box)).split('\n')).toContain(line)
  await hoverWorld(page, still.col + 0.5, still.row + 0.5)
  expect((await lookAt(page, still)).split('\n')).toContain(line)
  await hoverWorld(page, still.col + 1.5, still.row + 0.5)
  expect((await lookAt(page, { col: still.col + 1, row: still.row })).split('\n')).toContain(line)
  await hoverWorld(page, furnace.col + 0.5, furnace.row + 0.5)
  expect((await lookAt(page, furnace)).split('\n')).not.toContain(line)
  await hoverWorld(page, furnace.col + 0.5, furnace.row + 1.5)
  expect((await lookAt(page, { col: furnace.col, row: furnace.row + 1 })).split('\n')).not.toContain(line)
  await hoverWorld(page, barrel.col + 0.5, barrel.row + 0.5)
  expect((await lookAt(page, barrel)).split('\n')).not.toContain(line)
  expect(extraLines(idle.barrel, await lookAt(page, barrel))).toHaveLength(0)
})
