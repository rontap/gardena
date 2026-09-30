import { expect, test, type Page } from '@playwright/test'
import { BURROW_START_N } from '../src/game/defs/burrow.ts'
import { DT_MAX } from '../src/game/sim/world.ts'
import { gotoPlay, hudMoney } from './helpers.ts'

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

async function standAndEnqueue(page: Page, at: At, act: string): Promise<void> {
  await page.evaluate(
    ([at, act]) => {
      const w = (
        window as unknown as {
          __world?: {
            seam: { kind: string }
            dismissRecap: () => void
            seats: { actor: { x: number; y: number } }[]
            enqueue: (i: { act: string; at: { col: number; row: number } }) => void
          }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      if (w.seam.kind === 'recap') w.dismissRecap()
      w.seats[0].actor.x = at.col + 0.5
      w.seats[0].actor.y = at.row + 0.5
      w.enqueue({ act, at })
    },
    [at, act] as const,
  )
  await drain(page)
}

test('start farm has burrows; shovel extract drops beside the hole; treasure pays on pick up', async ({ page }) => {
  test.setTimeout(120_000)
  await gotoPlay(page, { speed: 3 })
  await viewReady(page)
  await expect(page.getByRole('button', { name: 'Build', exact: true })).toBeVisible()
  await expect(hudMoney(page)).toBeVisible()

  const n = await readWorld<number>(page, null, 'w.burrows.size')
  expect(n).toBe(BURROW_START_N)

  const startAt = await readWorld<At>(
    page,
    null,
    `(() => {
      const at = [...w.burrows.values()][0]
      if (at === undefined) throw new Error('burrow')
      return { col: at.col, row: at.row }
    })()`,
  )
  const slots0 = await readWorld<number>(page, null, 'w.prizeSlots')
  await standAndEnqueue(page, startAt, 'shovel')

  const dug = await readWorld<{ cover: string; onCell: string; dropKind: string; dropAt: At; slots: number }>(
    page,
    startAt,
    `(() => {
      const c = w.cell(at)
      const near = [
        { col: at.col, row: at.row + 1 },
        { col: at.col - 1, row: at.row },
        { col: at.col + 1, row: at.row },
        { col: at.col, row: at.row - 1 },
      ]
      const here = w.drops.find(d => d.at.col === at.col && d.at.row === at.row)
      const drop = w.drops.find(d => near.some(p => p.col === d.at.col && p.row === d.at.row))
      return {
        cover: c.kind === 'untilled' ? c.cover.kind : c.kind,
        onCell: here === undefined ? '' : here.item.kind,
        dropKind: drop === undefined ? '' : drop.item.kind,
        dropAt: drop === undefined ? at : drop.at,
        slots: w.prizeSlots,
      }
    })()`,
  )
  expect(dug.cover).toBe('bare')
  expect(dug.onCell).toBe('')
  expect(dug.dropKind.length > 0 || dug.slots === slots0 + 1).toBe(true)

  if (dug.dropKind !== 'treasure') {
    await readWorld<null>(
      page,
      startAt,
      `(() => {
        w.drops.push({ at: { col: at.col, row: at.row }, item: { kind: 'treasure', coins: 9 } })
        return null
      })()`,
    )
  }
  const lying = await readWorld<{ at: At; coins: number }>(
    page,
    startAt,
    `(() => {
      const near = [
        { col: at.col, row: at.row },
        { col: at.col, row: at.row + 1 },
        { col: at.col - 1, row: at.row },
        { col: at.col + 1, row: at.row },
        { col: at.col, row: at.row - 1 },
      ]
      const d = w.drops.find(
        x => x.item.kind === 'treasure' && near.some(p => p.col === x.at.col && p.row === x.at.row),
      )
      if (d === undefined) throw new Error('treasure')
      return { at: d.at, coins: d.item.coins }
    })()`,
  )
  expect(lying.coins).toBeGreaterThan(0)

  const money0 = await readWorld<number>(page, null, 'w.money')
  const hand0 = await readWorld<string>(page, null, 'w.seats[0].hand.kind')
  await standAndEnqueue(page, lying.at, 'pickup')
  const after = await readWorld<{ money: number; hand: string; left: number }>(
    page,
    lying.at,
    `(() => ({
      money: w.money,
      hand: w.seats[0].hand.kind,
      left: w.drops.filter(d => d.at.col === at.col && d.at.row === at.row && d.item.kind === 'treasure').length,
    }))()`,
  )
  expect(after.money).toBe(money0 + lying.coins)
  expect(after.hand).toBe(hand0)
  expect(after.left).toBe(0)
  await expect(hudMoney(page)).toBeVisible()
})
