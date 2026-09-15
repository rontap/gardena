import { expect, test } from '@playwright/test'
import { CONTRACT_OFFERS, rollBoard } from '../src/game/sim/feature-contracts/market.ts'
import type { Prize } from '../src/game/sim/feature-contracts/market.h.ts'
import { Rng } from '../src/game/sim/rng.ts'
import { DT_MAX } from '../src/game/sim/world.ts'
import { gotoPlay } from './helpers.ts'

type Snap = {
  money: number
  points: number
  prizeSlots: number
  prizeFreezers: number
  fert: number
  postbox: { kind: string; tree?: string; variety?: string; crop?: string; count?: number; id?: string }[]
  silo: { crop: string; variety: string; count: number }[]
}

test('Contracts prize: accept, complete, goods paid', async ({ page }) => {
  await gotoPlay(page, { unlock: true })
  await page.getByRole('button', { name: 'Contracts', exact: true }).click()
  const board = page.locator('[data-contract-board]')
  await expect(board).toBeVisible()
  const { seed, day, repDay } = await page.evaluate(() => {
    const w = (
      window as unknown as {
        __world?: { rng: { seed: number }; clock: { day: number }; contracts: { repDay: number } }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    return { seed: w.rng.seed, day: w.clock.day, repDay: w.contracts.repDay }
  })
  const offers = rollBoard(new Rng(seed), day, CONTRACT_OFFERS, repDay)
  const index = offers.findIndex(o => o.prize.kind !== 'cash')
  if (index < 0) throw new Error('no prize')
  const prize = offers[index].prize
  const cards = board.getByRole('button')
  await expect(cards).toHaveCount(offers.length)
  const before = await snap(page)
  await cards.nth(index).click()
  await expect
    .poll(() =>
      page.evaluate(() => {
        const w = (window as unknown as { __world?: { contracts: { active: unknown[] } } }).__world
        if (w === undefined) throw new Error('no __world')
        return w.contracts.active.length
      }),
    )
    .toBe(1)
  await page.evaluate(dt => {
    const w = (
      window as unknown as {
        __world?: {
          contracts: { active: { bins: { filled: number; demand: { amount: number } }[]; dueDay: number }[] }
          nowDay: () => number
          tick: (d: number) => void
        }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    const a = w.contracts.active[0]
    a.bins.forEach(b => {
      b.filled = b.demand.amount
    })
    a.dueDay = w.nowDay()
    w.tick(dt)
  }, DT_MAX)
  const after = await snap(page)
  expect(after.active).toBe(0)
  paid(before, after, prize)
})

async function snap(page: Parameters<typeof gotoPlay>[0]): Promise<Snap & { active: number }> {
  return page.evaluate(() => {
    const w = (
      window as unknown as {
        __world?: {
          money: number
          points: number
          prizeSlots: number
          prizeFreezers: number
          contracts: { active: unknown[] }
          postbox: {
            slots: { kind: string; item?: { kind: string; tree?: string; variety?: string; crop?: string; count?: number; id?: string } }[]
          }
          silo: { seeds: { crop: string; variety: string; count: number }[] }
          additives: { litersOf: (id: string) => number }
        }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    return {
      money: w.money,
      points: w.points,
      prizeSlots: w.prizeSlots,
      prizeFreezers: w.prizeFreezers,
      fert: w.additives.litersOf('fertilizer'),
      active: w.contracts.active.length,
      postbox: w.postbox.slots.flatMap(s => (s.item === undefined ? [] : [s.item])),
      silo: w.silo.seeds.map(s => ({ crop: s.crop, variety: s.variety, count: s.count })),
    }
  })
}

function paid(before: Snap, after: Snap, prize: Prize): void {
  expect(after.money).toBe(before.money)
  if (prize.kind === 'tree-seed') {
    const hit = after.postbox.find(d => d.kind === 'tree-seed' && d.tree === prize.tree && d.variety === prize.variety)
    if (hit === undefined) throw new Error('tree-seed')
    return
  }
  if (prize.kind === 'seeds') {
    const had = before.silo.find(s => s.crop === prize.crop && s.variety === prize.variety)
    const st = after.silo.find(s => s.crop === prize.crop && s.variety === prize.variety)
    if (st === undefined) throw new Error('seeds')
    expect(st.count).toBe((had === undefined ? 0 : had.count) + prize.count)
    return
  }
  if (prize.kind === 'fertilizer') {
    expect(after.fert).toBeGreaterThan(before.fert)
    return
  }
  if (prize.kind === 'tool') {
    const hit = after.postbox.find(d => d.kind === 'shovel' || d.kind === 'pickaxe')
    if (hit === undefined) throw new Error('tool')
    return
  }
  if (prize.kind === 'skill-points') {
    expect(after.points).toBe(before.points + prize.n)
    return
  }
  if (prize.kind === 'freezer') {
    expect(after.prizeFreezers).toBe(before.prizeFreezers + 1)
    return
  }
  expect(after.prizeSlots).toBe(before.prizeSlots + 1)
}
