import { expect, test, type Page } from '@playwright/test'
import { AXES, SHOVELS } from '../src/game/defs/items.ts'
import { TREES } from '../src/game/defs/trees.ts'
import { DT_MAX } from '../src/game/sim/world.ts'
import { gotoPlay } from './helpers.ts'

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
    ([at, uses, work]) => {
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
      w.seats[0].hand = { kind: 'hold', item: { kind: 'axe', usesLeft: uses, workSeconds: work } }
    },
    [at, AXES.axe.uses, AXES.axe.workSeconds],
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
    ([at, uses, work]) => {
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
    [at, SHOVELS.shovel.uses, SHOVELS.shovel.workSeconds],
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
    ([at, uses, work]) => {
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
      w.seats[0].hand = { kind: 'hold', item: { kind: 'chainsaw', usesLeft: uses, workSeconds: work } }
      const c = w.cell(at)
      if (c.kind === 'tree' && c.juvenile < 1) c.juvenile = 1
    },
    [at, AXES.chainsaw.uses, AXES.chainsaw.workSeconds],
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
  const chopped = await readWorld<{ trunk: boolean; wood: number; uses: number; kind: string }>(
    page,
    at,
    `(() => {
      const c = w.cell(at)
      const wood = w.drops.filter(d => d.item.kind === 'wood').reduce((n, d) => n + d.item.count, 0)
      const hand = w.seats[0].hand
      return {
        trunk: c.trunk,
        wood,
        kind: hand.kind === 'hold' ? hand.item.kind : 'empty',
        uses: hand.kind === 'hold' && hand.item.kind === 'chainsaw' ? hand.item.usesLeft : 0,
      }
    })()`,
  )
  expect(chopped.trunk).toBe(true)
  expect(chopped.wood).toBe(1)
  expect(chopped.kind).toBe('chainsaw')
  expect(chopped.uses).toBe(AXES.chainsaw.uses - 1)
})
