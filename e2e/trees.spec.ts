import { expect, test, type Page } from '@playwright/test'
import { AXES, CONTAINERS, FERT_BAG_LITERS, SHOVELS } from '../src/game/defs/items.ts'
import { TREES } from '../src/game/defs/trees.ts'
import { FERT_PLOT_MAX, SOIL_WATER_MAX, SOIL_WATER_MID, TREE_FERT_MAX, TREE_WATER_MAX, TREE_WATER_MID } from '../src/game/sim/soil.ts'
import { NOTICE_SECONDS } from '../src/game/ui/notices.ts'
import { DT_MAX } from '../src/game/sim/world.ts'
import { dismissRecap, gotoPlay, hoverWorld, tapWorld } from './helpers.ts'

type At = { col: number; row: number }

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

async function wildApple(page: Page): Promise<At> {
  return readWorld<At>(page, null, `(() => {
    for (let row = 0; row < 32; row++) {
      for (let col = 0; col < 32; col++) {
        const c = w.cell({ col, row })
        if (c.kind === 'tree' && c.base.col === col && c.base.row === row) return { col, row }
      }
    }
    throw new Error('tree')
  })()`)
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

test('axe on mature tree, trunk, grow, mature; axe no-op; shovel trunk', async ({ page }) => {
  test.setTimeout(120_000)
  await gotoPlay(page, { speed: 3 })
  await viewReady(page)

  const at = await readWorld<At>(page, null, `(() => {
    for (let row = 0; row < 32; row++) {
      for (let col = 0; col < 32; col++) {
        const c = w.cell({ col, row })
        if (c.kind === 'tree' && c.base.col === col && c.base.row === row) return { col, row }
      }
    }
    throw new Error('tree')
  })()`)
  await page.evaluate(
    ({ at, uses, work }) => {
      const w = (
        window as unknown as {
          __world?: {
            seats: { actor: { x: number; y: number }; hand: unknown }[]
            cell: (c: { col: number; row: number }) => { kind: string }
          }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      w.seats[0].actor.x = at.col + 0.5
      w.seats[0].actor.y = at.row + 0.5
      w.seats[0].hand = { kind: 'hold', item: { kind: 'axe', id: 'axe', usesLeft: uses, workSeconds: work } }
    },
    { at, uses: AXES.axe.uses, work: AXES.axe.workSeconds },
  )

  await ticks(page, TREES.apple.juvenileSeconds + 1)
  const mature = await readWorld<{ kind: string; juvenile: number; trunk: boolean }>(
    page,
    at,
    '(() => { const c = w.cell(at); return { kind: c.kind, juvenile: c.juvenile, trunk: c.trunk } })()',
  )
  expect(mature.kind).toBe('tree')
  expect(mature.juvenile).toBeGreaterThanOrEqual(1)
  expect(mature.trunk).toBe(false)

  await page.evaluate(at => {
    const w = (
      window as unknown as {
        __world?: {
          seam: { kind: string }
          dismissRecap: () => void
          seats: { actor: { x: number; y: number } }[]
          enqueue: (i: { act: string; at: { col: number; row: number } }) => void
          cell: (c: { col: number; row: number }) => { juvenile: number }
        }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    if (w.seam.kind === 'recap') w.dismissRecap()
    const c = w.cell(at)
    if (c.juvenile < 1) c.juvenile = 1
    w.seats[0].actor.x = at.col + 0.5
    w.seats[0].actor.y = at.row + 0.5
    w.enqueue({ act: 'chop', at })
  }, at)
  await drain(page)
  const chopped = await readWorld<{ trunk: boolean; juvenile: number; wood: number; uses: number }>(
    page,
    at,
    `(() => {
      const c = w.cell(at)
      const wood = w.drops.filter(d => d.item.kind === 'wood').reduce((n, d) => n + d.item.count, 0)
      const hand = w.seats[0].hand
      return {
        trunk: c.trunk,
        juvenile: c.juvenile,
        wood,
        uses: hand.kind === 'hold' && hand.item.kind === 'axe' ? hand.item.usesLeft : 0,
      }
    })()`,
  )
  expect(chopped.trunk).toBe(true)
  expect(chopped.wood).toBe(1)
  expect(chopped.uses).toBe(AXES.axe.uses - 1)

  await page.evaluate(at => {
    const w = (
      window as unknown as {
        __world?: { enqueue: (i: { act: string; at: { col: number; row: number } }) => void }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    w.enqueue({ act: 'chop', at })
  }, at)
  await drain(page)
  const trunkNoop = await readWorld<{ trunk: boolean; wood: number; uses: number }>(
    page,
    at,
    `(() => {
      const c = w.cell(at)
      const wood = w.drops.filter(d => d.item.kind === 'wood').reduce((n, d) => n + d.item.count, 0)
      const hand = w.seats[0].hand
      return {
        trunk: c.trunk,
        wood,
        uses: hand.kind === 'hold' && hand.item.kind === 'axe' ? hand.item.usesLeft : 0,
      }
    })()`,
  )
  expect(trunkNoop.trunk).toBe(true)
  expect(trunkNoop.wood).toBe(1)
  expect(trunkNoop.uses).toBe(AXES.axe.uses - 1)

  await ticks(page, TREES.apple.juvenileSeconds + 1)
  const grow = await readWorld<{ trunk: boolean; juvenile: number; stage: string }>(
    page,
    at,
    '(() => { const c = w.cell(at); return { trunk: c.trunk, juvenile: c.juvenile, stage: c.stage() } })()',
  )
  expect(grow.trunk).toBe(false)
  expect(grow.juvenile).toBeLessThan(1)
  expect(grow.stage).toBe('grow')

  await page.evaluate(at => {
    const w = (
      window as unknown as {
        __world?: { enqueue: (i: { act: string; at: { col: number; row: number } }) => void }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    w.enqueue({ act: 'chop', at })
  }, at)
  await drain(page)
  const growNoop = await readWorld<{ trunk: boolean; wood: number; uses: number; stage: string }>(
    page,
    at,
    `(() => {
      const c = w.cell(at)
      const wood = w.drops.filter(d => d.item.kind === 'wood').reduce((n, d) => n + d.item.count, 0)
      const hand = w.seats[0].hand
      return {
        trunk: c.trunk,
        wood,
        uses: hand.kind === 'hold' && hand.item.kind === 'axe' ? hand.item.usesLeft : 0,
        stage: c.stage(),
      }
    })()`,
  )
  expect(growNoop.trunk).toBe(false)
  expect(growNoop.stage).toBe('grow')
  expect(growNoop.wood).toBe(1)
  expect(growNoop.uses).toBe(AXES.axe.uses - 1)

  await ticks(page, TREES.apple.juvenileSeconds + 1)
  const again = await readWorld<{ trunk: boolean; juvenile: number }>(
    page,
    at,
    '(() => { const c = w.cell(at); return { trunk: c.trunk, juvenile: c.juvenile } })()',
  )
  expect(again.trunk).toBe(false)
  expect(again.juvenile).toBe(1)

  await page.evaluate(at => {
    const w = (
      window as unknown as {
        __world?: { enqueue: (i: { act: string; at: { col: number; row: number } }) => void }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    w.enqueue({ act: 'chop', at })
  }, at)
  await drain(page)
  expect(await readWorld<boolean>(page, at, 'w.cell(at).trunk')).toBe(true)

  await page.evaluate(
    ({ at, uses, work }) => {
      const w = (
        window as unknown as {
          __world?: {
            seats: { hand: unknown }[]
            enqueue: (i: { act: string; at: { col: number; row: number } }) => void
          }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      w.seats[0].hand = { kind: 'hold', item: { kind: 'shovel', id: 'shovel', usesLeft: uses, workSeconds: work } }
      w.enqueue({ act: 'shovel', at })
    },
    { at, uses: SHOVELS.shovel.uses, work: SHOVELS.shovel.workSeconds },
  )
  await drain(page)
  const dug = await readWorld<{ origin: string; south: string; seed: boolean }>(
    page,
    at,
    `(() => {
      const a = w.cell(at)
      const b = w.cell({ col: at.col, row: at.row + 1 })
      return {
        origin: a.kind,
        south: b.kind,
        seed: w.drops.some(d => d.item.kind === 'tree-seed' && d.item.tree === 'apple'),
      }
    })()`,
  )
  expect(dug.origin).toBe('untilled')
  expect(dug.south).toBe('untilled')
  expect(dug.seed).toBe(true)
})

test('chop with Chainsaw', async ({ page }) => {
  test.setTimeout(120_000)
  await gotoPlay(page, { speed: 3 })
  await viewReady(page)

  const at = await readWorld<At>(page, null, `(() => {
    for (let row = 0; row < 32; row++) {
      for (let col = 0; col < 32; col++) {
        const c = w.cell({ col, row })
        if (c.kind === 'tree' && c.base.col === col && c.base.row === row) return { col, row }
      }
    }
    throw new Error('tree')
  })()`)
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
      w.seats[0].hand = { kind: 'hold', item: { kind: 'axe', id: 'chainsaw', usesLeft: uses, workSeconds: work } }
      const c = w.cell(at)
      if (c.kind === 'tree' && c.juvenile < 1) c.juvenile = 1
    },
    { at, uses: AXES.chainsaw.uses, work: AXES.chainsaw.workSeconds },
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
  const chopped = await readWorld<{ trunk: boolean; wood: number; uses: number; id: string }>(
    page,
    at,
    `(() => {
      const c = w.cell(at)
      const wood = w.drops.filter(d => d.item.kind === 'wood').reduce((n, d) => n + d.item.count, 0)
      const hand = w.seats[0].hand
      return {
        trunk: c.trunk,
        wood,
        id: hand.kind === 'hold' && hand.item.kind === 'axe' ? hand.item.id : 'empty',
        uses: hand.kind === 'hold' && hand.item.kind === 'axe' ? hand.item.usesLeft : 0,
      }
    })()`,
  )
  expect(chopped.trunk).toBe(true)
  expect(chopped.wood).toBe(1)
  expect(chopped.id).toBe('chainsaw')
  expect(chopped.uses).toBe(AXES.chainsaw.uses - 1)
})

async function lookAt(page: Page, at: At): Promise<void> {
  await page.evaluate(at => {
    const v = (window as unknown as { __view?: { cam: { x: number; y: number } } }).__view
    if (v === undefined) throw new Error('no __view')
    v.cam.x = at.col + 0.5
    v.cam.y = at.row + 0.5
  }, at)
}

async function hoverTreeNotice(page: Page): Promise<void> {
  const column = page.getByRole('button', { name: 'Hide' }).locator('xpath=../..')
  await expect
    .poll(
      async () => {
        const rows = column.locator('div.cursor-pointer')
        const n = await rows.count()
        for (let i = 0; i < n; i++) {
          await rows.nth(i).hover()
          if ((await page.locator('[data-notice-cells]').count()) > 0) return true
        }
        return false
      },
      { timeout: NOTICE_SECONDS * 5000 },
    )
    .toBe(true)
}

test('tree inspect bars, bucket, Fertilizer bag; 3-arg Soil plot defaults', async ({ page }) => {
  test.setTimeout(60_000)
  await gotoPlay(page)
  await viewReady(page)
  await dismissRecap(page)

  const caps = await page.evaluate(() => {
    const e = (
      window as unknown as {
        __e2e?: { Soil: new (a: number, b: number, c: number) => { waterMax: number; waterMid: number; fertMax: number } }
      }
    ).__e2e
    if (e === undefined) throw new Error('no __e2e')
    const s = new e.Soil(1, 0.5, 0.03)
    return { waterMax: s.waterMax, waterMid: s.waterMid, fertMax: s.fertMax }
  })
  expect(caps).toEqual({ waterMax: SOIL_WATER_MAX, waterMid: SOIL_WATER_MID, fertMax: FERT_PLOT_MAX })

  const at = await wildApple(page)
  await lookAt(page, at)
  await hoverWorld(page, at.col + 0.5, at.row + 0.5)
  const inspect = page.locator('[data-look]').locator('xpath=..')
  await expect(inspect.getByText('Growth', { exact: true })).toBeVisible()
  await expect(inspect.getByText('Happiness', { exact: true })).toBeVisible()
  await expect(inspect.getByText('Fertilizer', { exact: true })).toBeVisible()
  await expect(inspect.getByText('Water', { exact: true })).toBeVisible()

  const poured = await page.evaluate(
    ({ at, liters, cap }) => {
      const w = (
        window as unknown as {
          __world?: {
            seats: { actor: { x: number; y: number }; hand: unknown }[]
            cell: (c: { col: number; row: number }) => { soil: { water: number; drink: (n: number) => void } }
          }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      const c = w.cell(at)
      c.soil.drink(c.soil.water)
      w.seats[0].actor.x = at.col + 0.5
      w.seats[0].actor.y = at.row + 0.5
      w.seats[0].hand = {
        kind: 'hold',
        item: { kind: 'container', id: 'bucket', liters, capacityLiters: cap },
      }
      return c.soil.water
    },
    { at, liters: CONTAINERS.bucket.capacityLiters, cap: CONTAINERS.bucket.capacityLiters },
  )
  expect(poured).toBe(0)
  await lookAt(page, at)
  await tapWorld(page, at.col + 0.5, at.row + 0.5)
  await drain(page)
  const afterPour = await readWorld<number>(page, at, 'w.cell(at).soil.water')
  expect(afterPour).toBeGreaterThan(0)

  const fed0 = await page.evaluate(
    ({ at, liters }) => {
      const w = (
        window as unknown as {
          __world?: {
            seats: { actor: { x: number; y: number }; hand: unknown }[]
            cell: (c: { col: number; row: number }) => { soil: { fertilizer: number; starve: (n: number) => void } }
          }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      const c = w.cell(at)
      c.soil.starve(c.soil.fertilizer)
      w.seats[0].actor.x = at.col + 0.5
      w.seats[0].actor.y = at.row + 0.5
      w.seats[0].hand = {
        kind: 'hold',
        item: { kind: 'fertilizer', liters, capacityLiters: liters },
      }
      return c.soil.fertilizer
    },
    { at, liters: FERT_BAG_LITERS },
  )
  expect(fed0).toBe(0)
  await lookAt(page, at)
  await tapWorld(page, at.col + 0.5, at.row + 0.5)
  await drain(page)
  const afterFeed = await readWorld<number>(page, at, 'w.cell(at).soil.fertilizer')
  expect(afterFeed).toBeGreaterThan(0)
})

test('Command Center wilting drowning starving for a tree', async ({ page }) => {
  test.setTimeout(60_000)
  await gotoPlay(page)
  await viewReady(page)
  await dismissRecap(page)
  const at = await wildApple(page)

  await page.evaluate(
    ({ at, fertMax }) => {
      const w = (
        window as unknown as {
          __world?: {
            cell: (c: { col: number; row: number }) => {
              soil: { drink: (n: number) => void; water: number; feed: (n: number) => void }
            }
          }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      const c = w.cell(at)
      c.soil.drink(c.soil.water)
      c.soil.feed(fertMax)
    },
    { at, fertMax: TREE_FERT_MAX },
  )
  await expect(page.getByText('Command Center', { exact: true })).toBeVisible()
  await hoverTreeNotice(page)
  await expect(page.locator('[data-notice-cells]')).toHaveCount(1)

  await page.evaluate(
    ({ at, waterMax, fertMax }) => {
      const w = (
        window as unknown as {
          __world?: {
            cell: (c: { col: number; row: number }) => {
              soil: { soak: (n: number) => void; feed: (n: number) => void }
            }
          }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      const c = w.cell(at)
      c.soil.soak(waterMax)
      c.soil.feed(fertMax)
    },
    { at, waterMax: TREE_WATER_MAX, fertMax: TREE_FERT_MAX },
  )
  await hoverTreeNotice(page)
  await expect(page.locator('[data-notice-cells]')).toHaveCount(1)

  await page.evaluate(
    ({ at, mid }) => {
      const w = (
        window as unknown as {
          __world?: {
            cell: (c: { col: number; row: number }) => {
              soil: { water: number; drink: (n: number) => void; soak: (n: number) => void; starve: (n: number) => void; fertilizer: number }
            }
          }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      const c = w.cell(at)
      c.soil.drink(c.soil.water)
      c.soil.soak(mid)
      c.soil.starve(c.soil.fertilizer)
    },
    { at, mid: TREE_WATER_MID },
  )
  await hoverTreeNotice(page)
  await expect(page.locator('[data-notice-cells]')).toHaveCount(1)
})
