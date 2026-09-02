import { describe, expect, test } from 'vitest'
import {
  JAM_BUFFER,
  MILL_GRASS,
  MILL_IN,
  MILL_WORK,
  MIXED_MUL,
  SPIRIT_RARITY,
  SPIRIT_SALE,
  STILL_CAP,
  SUGAR_BAG,
  SUGAR_MILL,
  SUGAR_SHOP,
} from '../defs/items.ts'
import { PROTOCOL } from './mp.ts'
import { paid } from './market.ts'
import { SAVE_VERSION } from './save.ts'
import {
  bakeSpiritSale,
  meanRarity,
  millNeed,
  millProduct,
  millRecipeOf,
  spiritKind,
} from './machine.ts'
import { Chest, CompostBox, Freezer, JamMachine, Mill, PAD, PotStill } from './building.ts'
import { BIG_TICK } from './soil.ts'
import { DT_MAX, World } from './world.ts'

const AT = { col: 10, row: 12 }

function wheat(n: number) {
  return { kind: 'fruit' as const, crop: 'wheat' as const, rarity: 'common' as const, count: n, unitSale: 8, freshness: 1, bio: true }
}

function ticks(w: World, seconds: number): void {
  const n = Math.ceil(seconds / DT_MAX) + 1
  for (let i = 0; i < n; i++) w.tick(DT_MAX)
}

describe('machines', () => {
  test('10 common potato fruit `marketGain` $60. One still batch of 10 common potato is vodka `unitSale` $72.', () => {
    const w = new World()
    w.seats[0].actor.x = PAD.col + 0.5
    w.seats[0].actor.y = PAD.row + 0.5
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'potato', rarity: 'common', count: 10, unitSale: 6, freshness: 1, bio: true },
    }
    w.enqueue({ act: 'consign' })
    w.tick(DT_MAX)
    expect(w.stall.potato.sat).toBe(0)
    expect(w.marketQuote().clean).toBe(60)
    expect(w.marketGain()).toBeCloseTo(paid(0, 'potato', 60), 9)
    expect(spiritKind([{ crop: 'potato', count: 10 }])).toBe('vodka')
    expect(bakeSpiritSale('vodka', 'common')).toBe(72)
  })

  test('10 heirloom potato fruit `marketGain` $210. One still batch of 10 heirloom potato is vodka `unitSale` $104.', () => {
    const w = new World()
    w.seats[0].actor.x = PAD.col + 0.5
    w.seats[0].actor.y = PAD.row + 0.5
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'potato', rarity: 'heirloom', count: 10, unitSale: 21, freshness: 1, bio: true },
    }
    w.enqueue({ act: 'consign' })
    w.tick(DT_MAX)
    expect(w.stall.potato.sat).toBe(0)
    expect(w.marketQuote().clean).toBe(210)
    expect(w.marketGain()).toBeCloseTo(paid(0, 'potato', 210), 9)
    expect(bakeSpiritSale('vodka', 'heirloom')).toBe(SPIRIT_SALE.vodka * SPIRIT_RARITY.heirloom)
  })

  test('Mixed still `unitSale` = `MIXED_MUL` × that rarity’s spirit sale. Mixed common vodka < 10 common potato fruit $60.', () => {
    const mixed = bakeSpiritSale('mixed', 'common')
    expect(mixed).toBe(MIXED_MUL * SPIRIT_SALE.vodka * SPIRIT_RARITY.common)
    expect(mixed).toBeLessThan(60)
    expect(
      spiritKind([
        { crop: 'potato', count: 5 },
        { crop: 'wheat', count: 5 },
      ]),
    ).toBe('mixed')
  })

  test('`SUGAR_MILL` 5 / L < `SUGAR_SHOP` 8 / L. `buy-sugar` $16 for `SUGAR_BAG` 2 L.', () => {
    expect(SUGAR_MILL).toBe(5)
    expect(SUGAR_SHOP).toBe(8)
    expect(SUGAR_MILL).toBeLessThan(SUGAR_SHOP)
    expect(SUGAR_BAG).toBe(2)
    expect(SUGAR_SHOP * SUGAR_BAG).toBe(16)
    expect(millNeed('sugar-cane')).toBe(MILL_IN)
    expect(millNeed('grass')).toBe(MILL_GRASS)
    expect(millProduct('sugar-cane')).toEqual({
      kind: 'sugar',
      liters: SUGAR_BAG,
      capacityLiters: SUGAR_BAG,
      unitSale: SUGAR_MILL,
    })
    expect(millRecipeOf({ kind: 'fruit', crop: 'sugar-cane', rarity: 'common', count: 1, unitSale: 5, freshness: 1, bio: true })).toBe(
      'sugar-cane',
    )
  })

  test('Barrel is grapes → wine only. No whisky. No migrate.', () => {
    expect(SAVE_VERSION).toBe(2.02)
    expect(PROTOCOL).toBe(2.02)
    expect(meanRarity([{ rarity: 'common', count: 1 }, { rarity: 'heirloom', count: 1 }], 0)).toBe('rare')
    expect(meanRarity([{ rarity: 'common', count: 1 }, { rarity: 'heirloom', count: 1 }], 0.5)).toBe('uncommon')
    expect(meanRarity([{ rarity: 'heirloom', count: 1 }], 0.99)).toBe('heirloom')
    expect(meanRarity([{ rarity: 'common', count: 1 }], 0.99)).toBe('common')
  })

  test('West chest/freezer is input. East is output. Still: west of origin, east of east cell.', () => {
    const w = new World(1)
    const mill = new Mill({ shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 1 })
    const west = { col: AT.col - 1, row: AT.row }
    const east = { col: AT.col + 1, row: AT.row }
    w.setCell(AT, mill)
    w.setCell(west, new Chest({ shape: 'rect', col: west.col, row: west.row, w: 1, h: 1 }))
    w.setCell(east, new Freezer({ shape: 'rect', col: east.col, row: east.row, w: 1, h: 1 }))
    const links = w.machineLinks()
    expect(links.some(l => l.side === 'in' && l.x === AT.col - 0.5 && l.y === AT.row)).toBe(true)
    expect(links.some(l => l.side === 'out' && l.x === AT.col + 0.5 && l.y === AT.row)).toBe(true)
    const stillAt = { col: AT.col, row: AT.row + 4 }
    const still = new PotStill({ shape: 'rect', col: stillAt.col, row: stillAt.row, w: 2, h: 1 })
    w.setCell(stillAt, still)
    w.setCell({ col: stillAt.col + 1, row: stillAt.row }, still)
    const sw = { col: stillAt.col - 1, row: stillAt.row }
    const se = { col: stillAt.col + 2, row: stillAt.row }
    w.setCell(sw, new Chest({ shape: 'rect', col: sw.col, row: sw.row, w: 1, h: 1 }))
    w.setCell(se, new Freezer({ shape: 'rect', col: se.col, row: se.row, w: 1, h: 1 }))
    const sl = w.machineLinks()
    expect(sl.some(l => l.side === 'in' && l.x === stillAt.col - 0.5 && l.y === stillAt.row)).toBe(true)
    expect(sl.some(l => l.side === 'out' && l.x === stillAt.col + 1.5 && l.y === stillAt.row)).toBe(true)
  })

  test('Each `BIG_TICK`, dump-all legal from the west store into the machine.', () => {
    const w = new World(1)
    const mill = new Mill({ shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 1 })
    const west = { col: AT.col - 1, row: AT.row }
    w.setCell(AT, mill)
    w.setCell(west, new Chest({ shape: 'rect', col: west.col, row: west.row, w: 1, h: 1 }))
    const chest = w.cell(west)
    if (chest.kind !== 'chest') throw new Error('chest')
    chest.slots[0] = { kind: 'hold', item: wheat(MILL_IN) }
    chest.slots[1] = { kind: 'hold', item: wheat(2) }
    ticks(w, BIG_TICK)
    expect(mill.recipe).toBe('wheat')
    expect(mill.units).toBe(MILL_IN + 2)
    expect(chest.slots.every(s => s.kind === 'empty')).toBe(true)
    const jamAt = { col: AT.col, row: AT.row + 6 }
    const jam = new JamMachine({ shape: 'rect', col: jamAt.col, row: jamAt.row, w: 1, h: 1 })
    const jw = { col: jamAt.col - 1, row: jamAt.row }
    w.setCell(jamAt, jam)
    w.setCell(jw, new Chest({ shape: 'rect', col: jw.col, row: jw.row, w: 1, h: 1 }))
    const jc = w.cell(jw)
    if (jc.kind !== 'chest') throw new Error('chest')
    jc.slots[0] = {
      kind: 'hold',
      item: { kind: 'sugar', liters: 10, capacityLiters: 10, unitSale: SUGAR_MILL },
    }
    ticks(w, BIG_TICK)
    expect(jam.sugar).toBe(JAM_BUFFER)
    expect(jc.slots[0].kind === 'hold' && jc.slots[0].item.kind === 'sugar' && jc.slots[0].item.liters).toBe(10 - JAM_BUFFER)
    const stillAt = { col: AT.col, row: AT.row + 8 }
    const still = new PotStill({ shape: 'rect', col: stillAt.col, row: stillAt.row, w: 2, h: 1 })
    w.setCell(stillAt, still)
    w.setCell({ col: stillAt.col + 1, row: stillAt.row }, still)
    const sw = { col: stillAt.col - 1, row: stillAt.row }
    w.setCell(sw, new Chest({ shape: 'rect', col: sw.col, row: sw.row, w: 1, h: 1 }))
    const sc = w.cell(sw)
    if (sc.kind !== 'chest') throw new Error('chest')
    sc.slots[0] = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'potato', rarity: 'common', count: 12, unitSale: 6, freshness: 1, bio: true },
    }
    ticks(w, BIG_TICK)
    expect(still.feed.reduce((n, f) => n + f.count, 0)).toBe(STILL_CAP)
    expect(sc.slots[0].kind === 'hold' && sc.slots[0].item.kind === 'fruit' && sc.slots[0].item.count).toBe(2)
    const boxAt = { col: AT.col, row: AT.row + 10 }
    const box = new CompostBox({ shape: 'rect', col: boxAt.col, row: boxAt.row, w: 1, h: 1 })
    const bw = { col: boxAt.col - 1, row: boxAt.row }
    w.setCell(boxAt, box)
    w.setCell(bw, new Chest({ shape: 'rect', col: bw.col, row: bw.row, w: 1, h: 1 }))
    const bc = w.cell(bw)
    if (bc.kind !== 'chest') throw new Error('chest')
    bc.slots[0] = { kind: 'hold', item: wheat(2) }
    ticks(w, BIG_TICK)
    expect(box.units).toBe(10)
    expect(bc.slots.every(s => s.kind === 'empty')).toBe(true)
  })

  test('Produce inserts into the east store if present; else `frontOf`. East store full → wait.', () => {
    const w = new World(1)
    const mill = new Mill({ shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 1 })
    mill.recipe = 'wheat'
    mill.units = MILL_IN
    const east = { col: AT.col + 1, row: AT.row }
    w.setCell(AT, mill)
    w.setCell(east, new Chest({ shape: 'rect', col: east.col, row: east.row, w: 1, h: 1 }))
    ticks(w, MILL_WORK)
    const chest = w.cell(east)
    if (chest.kind !== 'chest') throw new Error('chest')
    expect(chest.slots.some(s => s.kind === 'hold' && s.item.kind === 'flour')).toBe(true)
    expect(mill.units).toBe(0)
    expect(w.drops.filter(d => d.item.kind === 'flour')).toHaveLength(0)
    const mill2At = { col: AT.col, row: AT.row + 3 }
    const mill2 = new Mill({ shape: 'rect', col: mill2At.col, row: mill2At.row, w: 1, h: 1 })
    mill2.recipe = 'wheat'
    mill2.units = MILL_IN
    const e2 = { col: mill2At.col + 1, row: mill2At.row }
    w.setCell(mill2At, mill2)
    const full = new Chest({ shape: 'rect', col: e2.col, row: e2.row, w: 1, h: 1 })
    full.slots.forEach((_, i) => {
      full.slots[i] = { kind: 'hold', item: { kind: 'sapling', tree: 'olive' } }
    })
    w.setCell(e2, full)
    const flour0 = w.drops.filter(d => d.item.kind === 'flour').length
    ticks(w, MILL_WORK)
    expect(mill2.units).toBe(MILL_IN)
    expect(w.drops.filter(d => d.item.kind === 'flour').length).toBe(flour0)
    const mill3At = { col: AT.col, row: AT.row + 6 }
    const mill3 = new Mill({ shape: 'rect', col: mill3At.col, row: mill3At.row, w: 1, h: 1 })
    mill3.recipe = 'wheat'
    mill3.units = MILL_IN
    w.setCell(mill3At, mill3)
    ticks(w, MILL_WORK)
    expect(mill3.units).toBe(0)
    expect(w.drops.some(d => d.item.kind === 'flour' && d.at.col === mill3At.col && d.at.row === mill3At.row + 1)).toBe(true)
  })
})
