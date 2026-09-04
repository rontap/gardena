// COMMANDMENT: never test specifically for versions, ever. expect(SAVE_VERSION) or PROTOCOL .toBe is disallowed.
import { describe, expect, test } from 'vitest'
import {
  JAM_BUFFER,
  MILL_GRASS,
  MILL_IN,
  MILL_WORK,
  BARREL_MATURE,
  CASK_SALE,
  AXES,
  COMPOST_NEED,
  COMPOST_SECONDS,
  COMPOST_VALUE,
  FURNACE_ASH,
  FURNACE_CAP,
  FURNACE_HASTE,
  FURNACE_NEED,
  FURNACE_REACH,
  FURNACE_SECONDS,
  FURNACE_VALUE,
  MIXED_MUL,
  SPIRIT_RARITY,
  SPIRIT_SALE,
  STILL_CAP,
  STILL_SECONDS,
  SUGAR_BAG,
  SUGAR_MILL,
  SUGAR_SHOP,
} from '../defs/items.ts'
import { paid } from './market.ts'
import {
  bakeCaskSale,
  bakeSpiritSale,
  barrelNeed,
  furnaceAccept,
  furnaceCoveringCells,
  furnaceMul,
  furnaceStateVfx,
  furnaceWorking,
  meanRarity,
  millNeed,
  millProduct,
  millRecipeOf,
  spiritKind,
} from './machine.ts'
import { furnaceValue } from './item.ts'
import { Barrel, Chest, CompostBox, Freezer, Furnace, Grinder, JamMachine, Mill, PAD, PotStill } from './building.ts'
import { lookText } from './look.ts'
import { Lever } from './sensor.ts'
import { BIG_TICK } from './soil.ts'
import { DT_MAX, World } from './world.ts'

const AT = { col: 10, row: 12 }

function wheat(n: number) {
  return { kind: 'fruit' as const, crop: 'wheat' as const, rarity: 'common' as const, count: n, unitSale: 8, freshness: 1, bio: true }
}

function ticks(w: World, seconds: number): void {
  const n = Math.ceil(seconds / DT_MAX) + 1
  for (let i = 0; i < n; i++) {
    if (w.seam.kind === 'recap') w.dismissRecap()
    w.tick(DT_MAX)
  }
  if (w.seam.kind === 'recap') w.dismissRecap()
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

  test('Barrel locks one `BarrelCrop` on first dump: grape → wine, apple → cider. No mix. Collect clears `crop`. No whisky. `barrelNeed(\'apple\')` 4, `barrelNeed(\'grape\')` 5. `recipesOf(\'barrel\')` lists `BARREL_CROPS`. Rows: 2. Catalog/recipe rows use `barrelNeed`. `CASK_SALE.cider` unchanged.', () => {
    expect(barrelNeed('apple')).toBe(4)
    expect(barrelNeed('grape')).toBe(5)
    expect(meanRarity([{ rarity: 'common', count: 1 }, { rarity: 'heirloom', count: 1 }], 0)).toBe('rare')
    expect(meanRarity([{ rarity: 'common', count: 1 }, { rarity: 'heirloom', count: 1 }], 0.5)).toBe('uncommon')
    expect(meanRarity([{ rarity: 'heirloom', count: 1 }], 0.99)).toBe('heirloom')
    expect(meanRarity([{ rarity: 'common', count: 1 }], 0.99)).toBe('common')
    expect(bakeCaskSale('cider', 'common', BARREL_MATURE)).toBe(CASK_SALE.cider)
    const w = new World(1)
    const at = { col: AT.col, row: AT.row + 6 }
    w.setCell(at, new Barrel({ shape: 'rect', col: at.col, row: at.row, w: 1, h: 1 }))
    w.seats[0].actor.x = at.col + 0.5
    w.seats[0].actor.y = at.row + 1.5
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'apple', rarity: 'common', count: 2, unitSale: 15.4, freshness: 1, bio: true },
    }
    w.enqueue({ act: 'barrel', at })
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    const barrel = w.cell(at) as Barrel
    expect(barrel.crop).toBe('apple')
    expect(barrel.feed[0].count).toBe(2)
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'grape', rarity: 'common', count: 3, unitSale: 18, freshness: 1, bio: true },
    }
    w.enqueue({ act: 'barrel', at })
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    expect(barrel.feed[0].count).toBe(2)
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'apple', rarity: 'common', count: 2, unitSale: 15.4, freshness: 1, bio: true },
    }
    w.enqueue({ act: 'barrel', at })
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    expect(barrel.feed[0].count).toBe(barrelNeed('apple'))
    barrel.age = BARREL_MATURE
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'cask', cask: 'cider', rarity: 'common', count: 1, unitSale: CASK_SALE.cider },
    }
    w.enqueue({ act: 'barrel', at })
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    const hand = w.seats[0].hand
    expect(hand.kind === 'hold' && hand.item.kind === 'cask' && hand.item.cask).toBe('cider')
    expect(hand.kind === 'hold' && hand.item.kind === 'cask' && hand.item.count).toBe(2)
    expect(barrel.crop).toBe('none')
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
      full.slots[i] = { kind: 'hold', item: { kind: 'tree-seed', tree: 'olive' } }
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

function putFurnace(w: World, at: { col: number; row: number }): Furnace {
  const f = new Furnace({ shape: 'rect', col: at.col, row: at.row, w: 1, h: 2 })
  w.setCell(at, f)
  w.setCell({ col: at.col, row: at.row + 1 }, f)
  return f
}

describe('machines.furnace-feed', () => {
  test('Accept compost feedstock + oil + spirit + wood + tree-seed. Values as `FURNACE_VALUE`. Mix. Cap `FURNACE_CAP`. Refuse jam/cask/flour/extract/ash/tools.', () => {
    expect(FURNACE_CAP).toBe(100)
    expect(FURNACE_VALUE).toEqual({ green: 1, fruit: 3, oil: 25, spirit: 36, wood: 40 })
    expect(AXES.axe).toEqual({ uses: 40, workSeconds: 5 })
    const w = new World(1)
    const at = { col: AT.col, row: AT.row + 12 }
    const f = putFurnace(w, at)
    expect(furnaceValue({ kind: 'weed', count: 3 })).toBe(FURNACE_VALUE.green * 3)
    expect(furnaceValue({ kind: 'tree-seed', tree: 'apple' })).toBe(FURNACE_VALUE.green)
    expect(furnaceValue({ kind: 'fruit', crop: 'carrot', rarity: 'heirloom', count: 2, unitSale: 1, freshness: 1, bio: true })).toBe(
      FURNACE_VALUE.fruit * 2,
    )
    expect(furnaceValue({ kind: 'sugar', liters: 3, capacityLiters: 3, unitSale: 1 })).toBe(FURNACE_VALUE.fruit * 3)
    expect(furnaceValue({ kind: 'oil', count: 1, unitSale: 1 })).toBe(FURNACE_VALUE.oil)
    expect(furnaceValue({ kind: 'spirit', spirit: 'vodka', rarity: 'common', count: 1, unitSale: 1 })).toBe(FURNACE_VALUE.spirit)
    expect(furnaceValue({ kind: 'wood', count: 1 })).toBe(FURNACE_VALUE.wood)
    expect(furnaceValue({ kind: 'jam', crop: 'grape', count: 1, unitSale: 1 })).toBe(0)
    expect(furnaceValue({ kind: 'ash', count: 1 })).toBe(0)
    expect(furnaceValue({ kind: 'axe', usesLeft: 3, workSeconds: 1 })).toBe(0)
    w.seats[0].actor.x = at.col + 0.5
    w.seats[0].actor.y = at.row + 2.5
    w.seats[0].hand = { kind: 'hold', item: { kind: 'wood', count: 1 } }
    w.enqueue({ act: 'furnace', at })
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    expect(f.units).toBe(FURNACE_VALUE.wood)
    w.seats[0].hand = { kind: 'hold', item: { kind: 'weed', count: 2 } }
    w.enqueue({ act: 'furnace', at })
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    expect(f.units).toBe(FURNACE_VALUE.wood + FURNACE_VALUE.green * 2)
    w.seats[0].hand = { kind: 'hold', item: { kind: 'jam', crop: 'grape', count: 1, unitSale: 1 } }
    w.enqueue({ act: 'furnace', at })
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    expect(f.units).toBe(FURNACE_VALUE.wood + FURNACE_VALUE.green * 2)
    f.units = FURNACE_CAP - 1
    expect(furnaceAccept(f, { kind: 'wood', count: 1 })).toBe(0)
    expect(furnaceAccept(f, { kind: 'sugar', liters: 4, capacityLiters: 4, unitSale: 1 })).toBe(1 / FURNACE_VALUE.fruit)
  })
})

describe('machines.furnace-burn', () => {
  test('`FURNACE_NEED` units, `FURNACE_SECONDS`, consume `FURNACE_NEED` at finish, drop `FURNACE_ASH` ash, leftover stays, `inn === 1` skips.', () => {
    expect(FURNACE_NEED).toBe(20)
    expect(FURNACE_SECONDS).toBe(240)
    expect(FURNACE_ASH).toBe(5)
    const w = new World(1)
    const at = { col: AT.col, row: AT.row + 12 }
    const f = putFurnace(w, at)
    f.units = FURNACE_NEED + 4
    ticks(w, FURNACE_SECONDS)
    expect(f.units).toBe(4)
    expect(f.progress).toBe(0)
    expect(w.drops.some(d => d.item.kind === 'ash' && d.item.count === FURNACE_ASH)).toBe(true)
    f.units = FURNACE_NEED
    const leverAt = { col: at.col, row: at.row - 1 }
    const lever = new Lever({ shape: 'rect', col: leverAt.col, row: leverAt.row, w: 1, h: 1 })
    lever.on = true
    lever.out = 1
    w.setCell(leverAt, lever)
    w.wires.push({
      from: { kind: 'cell', at: leverAt, port: 'out' },
      to: { kind: 'cell', at, port: 'in' },
    })
    const p0 = f.progress
    ticks(w, FURNACE_SECONDS)
    expect(f.inn).toBe(1)
    expect(f.progress).toBe(p0)
    expect(f.units).toBe(FURNACE_NEED)
  })
})

describe('machines.furnace-haste', () => {
  test('Working furnace Chebyshev ≤ `FURNACE_REACH` on footprint. `1 + FURNACE_HASTE × n` including self. Still and compost take it. Barrel does not. Waiting / empty / gated do not count.', () => {
    const w = new World(1)
    const at = { col: 8, row: 14 }
    const f = putFurnace(w, at)
    f.units = FURNACE_NEED
    expect(furnaceWorking(f)).toBe(true)
    expect(furnaceMul([f], f.base)).toBe(1 + FURNACE_HASTE)
    expect(FURNACE_REACH).toBe(3)
    expect(FURNACE_HASTE).toBe(0.25)
    const millAt = { col: at.col + 3, row: at.row }
    const mill = new Mill({ shape: 'rect', col: millAt.col, row: millAt.row, w: 1, h: 1 })
    mill.recipe = 'wheat'
    mill.units = MILL_IN
    w.setCell(millAt, mill)
    w.tick(DT_MAX)
    expect(mill.progress).toBeCloseTo((DT_MAX * (1 + FURNACE_HASTE)) / MILL_WORK)
    const stillAt = { col: 8, row: 18 }
    const still = new PotStill({ shape: 'rect', col: stillAt.col, row: stillAt.row, w: 2, h: 1 })
    still.feed = [{ crop: 'potato', rarity: 'common', count: STILL_CAP }]
    still.progress = 0.01
    w.setCell(stillAt, still)
    w.setCell({ col: stillAt.col + 1, row: stillAt.row }, still)
    const pStill = still.progress
    w.tick(DT_MAX)
    expect(still.progress - pStill).toBeCloseTo((DT_MAX * (1 + FURNACE_HASTE)) / STILL_SECONDS)
    const boxAt = { col: 10, row: 14 }
    const box = new CompostBox({ shape: 'rect', col: boxAt.col, row: boxAt.row, w: 1, h: 1 })
    box.units = COMPOST_NEED
    w.setCell(boxAt, box)
    w.tick(DT_MAX)
    expect(box.progress).toBeCloseTo((DT_MAX * (1 + FURNACE_HASTE)) / COMPOST_SECONDS)
    const barrelAt = { col: 6, row: 14 }
    const barrel = new Barrel({ shape: 'rect', col: barrelAt.col, row: barrelAt.row, w: 1, h: 1 })
    barrel.crop = 'grape'
    barrel.feed = [{ rarity: 'common', count: 5 }]
    w.setCell(barrelAt, barrel)
    w.tick(DT_MAX)
    expect(barrel.age).toBeCloseTo(DT_MAX)
    f.progress = 1
    expect(furnaceWorking(f)).toBe(false)
    f.progress = 0
    f.inn = 1
    expect(furnaceWorking(f)).toBe(false)
    f.inn = 0
    f.units = 0
    expect(furnaceWorking(f)).toBe(false)
  })
})

describe('machines.furnace-haste-look', () => {
  test('Hover mill / jam / still / grinder / compost-box / furnace: one look line iff covering working count `n > 0`. `{%}` is `FURNACE_HASTE × n` as percent. `{n}` is covering count. Barrel never. `n === 0`: no line. Live working set, not `furnaceSnap`.', () => {
    const w = new World(1)
    const millAt = { col: AT.col, row: AT.row + 12 }
    const jamAt = { col: AT.col, row: AT.row + 14 }
    const grindAt = { col: AT.col - 4, row: AT.row + 14 }
    const boxAt = { col: AT.col - 4, row: AT.row + 16 }
    const stillAt = { col: AT.col, row: AT.row + 16 }
    const barrelAt = { col: AT.col - 4, row: AT.row + 12 }
    const f1At = { col: AT.col - 2, row: AT.row + 14 }
    const f2At = { col: AT.col + 2, row: AT.row + 14 }
    w.setCell(millAt, new Mill({ shape: 'rect', col: millAt.col, row: millAt.row, w: 1, h: 1 }))
    w.setCell(jamAt, new JamMachine({ shape: 'rect', col: jamAt.col, row: jamAt.row, w: 1, h: 1 }))
    w.setCell(grindAt, new Grinder({ shape: 'rect', col: grindAt.col, row: grindAt.row, w: 1, h: 1 }))
    w.setCell(boxAt, new CompostBox({ shape: 'rect', col: boxAt.col, row: boxAt.row, w: 1, h: 1 }))
    const still = new PotStill({ shape: 'rect', col: stillAt.col, row: stillAt.row, w: 2, h: 1 })
    w.setCell(stillAt, still)
    w.setCell({ col: stillAt.col + 1, row: stillAt.row }, still)
    w.setCell(barrelAt, new Barrel({ shape: 'rect', col: barrelAt.col, row: barrelAt.row, w: 1, h: 1 }))
    const one = `Finishes ${FURNACE_HASTE * 100}% faster with 1 working Furnace than without a Furnace.`
    const two = `Finishes ${FURNACE_HASTE * 2 * 100}% faster with 2 working Furnaces than without a Furnace.`
    const mill0 = lookText(w, { kind: 'cell', at: millAt }, false)
    expect(mill0.split('\n')).not.toContain(one)
    const f1 = putFurnace(w, f1At)
    f1.units = FURNACE_NEED
    const mill1 = lookText(w, { kind: 'cell', at: millAt }, false).split('\n')
    expect(mill1[0]).toBe('Mill')
    expect(mill1[1]).toBe(one)
    expect(mill1.filter(l => l === one)).toHaveLength(1)
    expect(lookText(w, { kind: 'cell', at: jamAt }, false).split('\n')).toContain(one)
    expect(lookText(w, { kind: 'cell', at: grindAt }, false).split('\n')).toContain(one)
    expect(lookText(w, { kind: 'cell', at: boxAt }, false).split('\n')).toContain(one)
    const stillOrigin = lookText(w, { kind: 'cell', at: stillAt }, false).split('\n')
    const stillEast = lookText(w, { kind: 'cell', at: { col: stillAt.col + 1, row: stillAt.row } }, false).split('\n')
    expect(stillOrigin.filter(l => l === one)).toHaveLength(1)
    expect(stillEast.filter(l => l === one)).toHaveLength(1)
    const furnaceOrigin = lookText(w, { kind: 'cell', at: f1At }, false).split('\n')
    const furnaceSouth = lookText(w, { kind: 'cell', at: { col: f1At.col, row: f1At.row + 1 } }, false).split('\n')
    expect(furnaceOrigin[1]).toBe(one)
    expect(furnaceOrigin.filter(l => l === one)).toHaveLength(1)
    expect(furnaceSouth.filter(l => l === one)).toHaveLength(1)
    expect(lookText(w, { kind: 'cell', at: barrelAt }, false).split('\n')).not.toContain(one)
    const f2 = putFurnace(w, f2At)
    f2.units = FURNACE_NEED
    const mill2 = lookText(w, { kind: 'cell', at: millAt }, false).split('\n')
    expect(mill2[1]).toBe(two)
    expect(mill2.filter(l => l === two)).toHaveLength(1)
    w.tick(DT_MAX)
    f1.inn = 1
    f2.inn = 1
    expect(lookText(w, { kind: 'cell', at: millAt }, false).split('\n')).not.toContain(one)
    expect(lookText(w, { kind: 'cell', at: millAt }, false).split('\n')).not.toContain(two)
  })
})

describe('machines.furnace-io', () => {
  test('West pull, east push, pads, `in` top, `out` bottom high iff `units === 0`. Origin row only. South cell no port.', () => {
    const w = new World(1)
    const at = { col: AT.col, row: AT.row + 12 }
    const f = putFurnace(w, at)
    const west = { col: at.col - 1, row: at.row }
    const east = { col: at.col + 1, row: at.row }
    const southWest = { col: at.col - 1, row: at.row + 1 }
    w.setCell(west, new Chest({ shape: 'rect', col: west.col, row: west.row, w: 1, h: 1 }))
    w.setCell(east, new Chest({ shape: 'rect', col: east.col, row: east.row, w: 1, h: 1 }))
    w.setCell(southWest, new Chest({ shape: 'rect', col: southWest.col, row: southWest.row, w: 1, h: 1 }))
    const links = w.machineLinks()
    expect(links.some(l => l.side === 'in' && l.x === at.col - 0.5 && l.y === at.row)).toBe(true)
    expect(links.some(l => l.side === 'out' && l.x === at.col + 0.5 && l.y === at.row)).toBe(true)
    expect(links.some(l => l.y === at.row + 1)).toBe(false)
    const westChest = w.cell(west)
    if (westChest.kind !== 'chest') throw new Error('chest')
    westChest.slots[0] = { kind: 'hold', item: { kind: 'weed', count: 1 } }
    const southChest = w.cell(southWest)
    if (southChest.kind !== 'chest') throw new Error('chest')
    southChest.slots[0] = { kind: 'hold', item: { kind: 'wood', count: 1 } }
    ticks(w, BIG_TICK)
    expect(f.units).toBe(FURNACE_VALUE.green)
    expect(southChest.slots[0].kind).toBe('hold')
    f.units = FURNACE_NEED
    ticks(w, FURNACE_SECONDS)
    const eastChest = w.cell(east)
    if (eastChest.kind !== 'chest') throw new Error('chest')
    expect(eastChest.slots.some(s => s.kind === 'hold' && s.item.kind === 'ash')).toBe(true)
    expect(f.units).toBe(0)
    w.tick(DT_MAX)
    expect(f.out).toBe(1)
    f.units = 1
    w.tick(DT_MAX)
    expect(f.out).toBe(0)
    const pads = w.machinePads()
    expect(pads.some(p => p.side === 'dropoff' && p.row === at.row - 1 && p.col === at.col)).toBe(true)
    expect(pads.some(p => p.side === 'takeup' && p.row === at.row + 2 && p.col === at.col)).toBe(true)
  })
})

describe('machines.furnace-smoke', () => {
  test('Working furnace mounts two state VFX: `furnace` at the south cell (opening) and `furnace-smoke` at the origin cell (chimney). File `src/assets/vfx/vfx-furnace-smoke.svg`. Reduced motion: frame 0 both. Idle: neither.', () => {
    const origin = { col: 10, row: 12 }
    const f = new Furnace({ shape: 'rect', col: origin.col, row: origin.row, w: 1, h: 2 })
    expect(furnaceWorking(f)).toBe(false)
    expect(furnaceStateVfx(origin)).toEqual([
      { id: 'furnace', col: origin.col, row: origin.row + 1 },
      { id: 'furnace-smoke', col: origin.col, row: origin.row },
    ])
    f.units = FURNACE_NEED
    expect(furnaceWorking(f)).toBe(true)
    f.inn = 1
    expect(furnaceWorking(f)).toBe(false)
    f.inn = 0
    f.progress = 1
    expect(furnaceWorking(f)).toBe(false)
  })
})

describe('machines.furnace-cover', () => {
  test('Covering area is Chebyshev ≤ `FURNACE_REACH` over the 1×2 (derived 7×8). Armed `buy-furnace` and unarmed hover of a placed furnace (either cell) paint that area stroke-only. Footprint `data-cell-stroke` stays. Not a lens. Not a dock. Not sprinkler fill.', () => {
    const base = { shape: 'rect' as const, col: 10, row: 12, w: 1, h: 2 }
    const cells = furnaceCoveringCells(base)
    const cols = cells.map(c => c.col)
    const rows = cells.map(c => c.row)
    expect(new Set(cells.map(c => `${c.col},${c.row}`)).size).toBe(7 * 8)
    expect(Math.max(...cols) - Math.min(...cols) + 1).toBe(7)
    expect(Math.max(...rows) - Math.min(...rows) + 1).toBe(8)
    expect(Math.min(...cols)).toBe(10 - FURNACE_REACH)
    expect(Math.max(...cols)).toBe(10 + FURNACE_REACH)
    expect(Math.min(...rows)).toBe(12 - FURNACE_REACH)
    expect(Math.max(...rows)).toBe(13 + FURNACE_REACH)
    const origin = { col: 10, row: 12 }
    const south = { col: 10, row: 13 }
    const cheb = (a: { col: number; row: number }, b: { col: number; row: number }) =>
      Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row))
    expect(cells.every(c => cheb(c, origin) <= FURNACE_REACH || cheb(c, south) <= FURNACE_REACH)).toBe(true)
    expect(cells.some(c => c.col === origin.col && c.row === origin.row)).toBe(true)
    expect(cells.some(c => c.col === south.col && c.row === south.row)).toBe(true)
  })
})

describe('view.furnace-cover', () => {
  test('Armed `buy-furnace` (ghost follows hover) and unarmed hover of a placed furnace (either cell): one `data-furnace-cover` path, the union of covering cells (Chebyshev ≤ `FURNACE_REACH` over the 1×2, derived 7×8). `fill-none` `stroke-ink` `strokeWidth` 2. Clip to owned (`inWorld`); drop fade and off-farm cells. Internal edges dropped. Footprint `data-cell-stroke` stays. Not sprinkler fill. Not a lens. Not a dock. Not Pixi overlay wash.', () => {
    const w = new World(1)
    const origin = { shape: 'rect' as const, col: 0, row: 0, w: 1, h: 2 }
    const clipped = furnaceCoveringCells(origin).filter(c => w.inWorld(c))
    expect(clipped.length).toBeGreaterThan(0)
    expect(clipped.length).toBeLessThan(7 * 8)
    expect(clipped.every(c => w.inWorld(c))).toBe(true)
    expect(clipped.some(c => c.col < 0 || c.row < 0)).toBe(false)
    const far = furnaceCoveringCells({ shape: 'rect', col: 100, row: 100, w: 1, h: 2 }).filter(c => w.inWorld(c))
    expect(far).toEqual([])
    const f = putFurnace(w, { col: 8, row: 14 })
    const south = w.cell({ col: f.base.col, row: f.base.row + 1 })
    if (south.kind !== 'furnace') throw new Error('furnace')
    expect(furnaceCoveringCells(south.base)).toEqual(furnaceCoveringCells(f.base))
  })
})

describe('inventory.ash', () => {
  test('1 ash = `COMPOST_VALUE.ash` compost waste. Wood/ash not stall goods.', () => {
    expect(COMPOST_VALUE.ash).toBe(4)
    const w = new World(1)
    const at = { col: AT.col, row: AT.row + 12 }
    const box = new CompostBox({ shape: 'rect', col: at.col, row: at.row, w: 1, h: 1 })
    w.setCell(at, box)
    w.seats[0].actor.x = at.col + 0.5
    w.seats[0].actor.y = at.row + 1.5
    w.seats[0].hand = { kind: 'hold', item: { kind: 'ash', count: 2 } }
    w.enqueue({ act: 'compost', at })
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    expect(box.units).toBe(COMPOST_VALUE.ash * 2)
    w.seats[0].hand = { kind: 'hold', item: { kind: 'wood', count: 1 } }
    w.enqueue({ act: 'compost', at })
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    expect(box.units).toBe(COMPOST_VALUE.ash * 2)
    expect(Object.keys(w.stall).includes('ash')).toBe(false)
    expect(Object.keys(w.stall).includes('wood')).toBe(false)
  })
})
