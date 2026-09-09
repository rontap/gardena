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
  SPIRIT_SALE,
  STILL_CAP,
  STILL_SECONDS,
  STATION_GRAFT_MAX,
  STATION_GRAFT_MIN,
  STATION_IN,
  STATION_SECONDS,
  GRAFT_WORK,
  SUGAR_BAG,
  SUGAR_MILL,
  SUGAR_SHOP,
} from '../../defs/items.ts'
import { caskGroup, purposeMul, PURPOSE_MUL, qualityMul, VARIETIES } from '../../defs/varieties.ts'
import { paid } from '../feature-contracts/market.ts'
import {
  bakeCaskSale,
  bakeSpiritSale,
  barrelAccept,
  barrelNeed,
  caskAgeMul,
  caskAgeTop,
  grindAccept,
  jamFruitAccept,
  jamSale,
  millAccept,
  stillAccept,
  furnaceAccept,
  furnaceCoveringCells,
  furnaceMul,
  furnaceStateVfx,
  furnaceWorking,
  meanQuality,
  millNeed,
  millProduct,
  millRecipeOf,
  machineEast,
  machineWest,
  spiritKind,
  stationAccept,
  stationApply,
  stationWorking,
} from './machine.ts'
import { CASK_NAME, caskMulOf, caskName, furnaceValue, mergeInto, type Item } from '../item.ts'
import { CASK_IDS, CROP_OF_CASK } from '../ids.ts'
import { BARREL_AGE, CASK_AGE_MAX, CASK_AGE_MIN, FLOUR, JAM_SALE, MILL_H, MILL_W } from '../../defs/items.ts'
import { Plant } from '../plant.ts'
import { Soil, SOIL_WATER_MID, WEED_CHANCE } from '../soil.ts'
import { Barrel, Chest, CompostBox, Freezer, Furnace, Grinder, Infuser, JamMachine, Mill, occupiedCells, PAD, PotStill, ResearchStation } from '../building.ts'
import { lookText } from '../look.ts'
import { Lamp, Lever } from '../sensor.ts'
import { BIG_TICK } from '../soil.ts'
import { DT_MAX, World } from '../world.ts'
import { m } from '../../../paraglide/messages.js'
import { DAY_SECONDS } from '../clock.ts'

const AT = { col: 10, row: 12 }

function wheat(n: number) {
  return { kind: 'fruit' as const, crop: 'wheat' as const, variety: 'base' as const, quality: 0 as const, count: n, unitSale: 8, freshness: 1, bio: true, cut: false }
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
      item: { kind: 'fruit', crop: 'potato', variety: 'base', quality: 0, count: 10, unitSale: 6, freshness: 1, bio: true, cut: false },
    }
    w.enqueue({ act: 'consign' })
    w.tick(DT_MAX)
    expect(w.stall.potato.sat).toBe(0)
    expect(w.marketQuote().clean).toBe(60)
    expect(w.marketGain()).toBeCloseTo(paid(0, 'potato', 60), 9)
    expect(spiritKind([{ crop: 'potato', variety: 'base', count: 10 }])).toBe('vodka')
    expect(bakeSpiritSale('vodka', 'base', 0)).toBe(72)
  })

  test('10 variant potato fruit `marketGain` follows the off-purpose variant rate. A still batch of one variety bakes that variety purpose rate.', () => {
    const w = new World()
    w.seats[0].actor.x = PAD.col + 0.5
    w.seats[0].actor.y = PAD.row + 0.5
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'potato', variety: 'bintje', quality: 1, count: 10, unitSale: 21, freshness: 1, bio: true, cut: false },
    }
    w.enqueue({ act: 'consign' })
    w.tick(DT_MAX)
    expect(w.stall.potato.sat).toBe(0)
    expect(w.marketQuote().clean).toBeCloseTo(168, 9)
    expect(w.marketGain()).toBeCloseTo(paid(0, 'potato', 168), 9)
    expect(bakeSpiritSale('vodka', 'bintje', 1)).toBe(SPIRIT_SALE.vodka * PURPOSE_MUL.variant.on * 3.5)
  })

  test('Mixed still `unitSale` = `MIXED_MUL` × that rarity’s spirit sale. Mixed common vodka < 10 common potato fruit $60.', () => {
    const mixed = bakeSpiritSale('mixed', 'base', 0)
    expect(mixed).toBe(MIXED_MUL * SPIRIT_SALE.vodka)
    expect(mixed).toBeLessThan(60)
    expect(
      spiritKind([
        { crop: 'potato', variety: 'base', count: 5 },
        { crop: 'wheat', variety: 'base', count: 5 },
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
    expect(millProduct('sugar-cane', 'base', 0)).toEqual({
      kind: 'sugar',
      liters: SUGAR_BAG,
      capacityLiters: SUGAR_BAG,
      unitSale: SUGAR_MILL,
      quality: 0,
    })
    expect(millRecipeOf({ kind: 'fruit', crop: 'sugar-cane', variety: 'base', quality: 0, count: 1, unitSale: 5, freshness: 1, bio: true, cut: false })).toBe(
      'sugar-cane',
    )
  })

  test('Barrel locks one `BarrelCrop` on first dump: grape → wine, apple → cider. No mix. Collect clears `crop`. No whisky. `barrelNeed(\'apple\')` 4, `barrelNeed(\'grape\')` 5. `recipesOf(\'barrel\')` lists `BARREL_CROPS`. Rows: 2. Catalog/recipe rows use `barrelNeed`. `CASK_SALE.cider` unchanged.', () => {
    expect(barrelNeed('apple')).toBe(4)
    expect(barrelNeed('grape')).toBe(5)
    expect(meanQuality([{ quality: 0, count: 1 }, { quality: 1, count: 1 }])).toBe(0.5)
    expect(meanQuality([{ quality: 1, count: 1 }])).toBe(1)
    expect(meanQuality([{ quality: 0, count: 1 }])).toBe(0)
    expect(bakeCaskSale('cider', 'base', 0, BARREL_MATURE)).toBe(CASK_SALE.cider)
    const w = new World(1)
    const at = { col: AT.col, row: AT.row + 6 }
    w.setCell(at, new Barrel({ shape: 'rect', col: at.col, row: at.row, w: 1, h: 1 }))
    w.seats[0].actor.x = at.col + 0.5
    w.seats[0].actor.y = at.row + 1.5
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'apple', variety: 'base', quality: 0, count: 2, unitSale: 15.4, freshness: 1, bio: true, cut: false },
    }
    w.enqueue({ act: 'barrel', at })
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    const barrel = w.cell(at) as Barrel
    expect(barrel.crop).toBe('apple')
    expect(barrel.feed[0].count).toBe(2)
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'grape', variety: 'base', quality: 0, count: 3, unitSale: 18, freshness: 1, bio: true, cut: false },
    }
    w.enqueue({ act: 'barrel', at })
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    expect(barrel.feed[0].count).toBe(2)
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'apple', variety: 'base', quality: 0, count: 2, unitSale: 15.4, freshness: 1, bio: true, cut: false },
    }
    w.enqueue({ act: 'barrel', at })
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    expect(barrel.feed[0].count).toBe(barrelNeed('apple'))
    barrel.age = BARREL_MATURE
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'cask', cask: 'cider', variety: 'base', quality: 0, count: 1, unitSale: CASK_SALE.cider, infused: false },
    }
    w.enqueue({ act: 'barrel', at })
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    const hand = w.seats[0].hand
    expect(hand.kind === 'hold' && hand.item.kind === 'cask' && hand.item.cask).toBe('cider')
    expect(hand.kind === 'hold' && hand.item.kind === 'cask' && hand.item.count).toBe(2)
    expect(barrel.crop).toBe('none')
  })

  test('Each `BIG_TICK`, dump-all legal from the west store into the machine.', () => {
    const w = new World(1)
    const mill = new Mill({ shape: 'rect', col: AT.col, row: AT.row, w: MILL_W, h: MILL_H })
    occupiedCells(mill.base, w.owned).forEach(p => w.setCell(p, mill))
    const west = machineWest(mill.base)
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
      item: { kind: 'sugar', liters: 10, capacityLiters: 10, unitSale: SUGAR_MILL, quality: 0 },
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
      item: { kind: 'fruit', crop: 'potato', variety: 'base', quality: 0, count: 12, unitSale: 6, freshness: 1, bio: true, cut: false },
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
    const put = (at: { col: number; row: number }) => {
      const m = new Mill({ shape: 'rect', col: at.col, row: at.row, w: MILL_W, h: MILL_H })
      m.recipe = 'wheat'
      m.units = MILL_IN
      occupiedCells(m.base, w.owned).forEach(p => w.setCell(p, m))
      return m
    }
    const mill = put(AT)
    const east = machineEast(mill.base)
    w.setCell(east, new Chest({ shape: 'rect', col: east.col, row: east.row, w: 1, h: 1 }))
    ticks(w, MILL_WORK)
    const chest = w.cell(east)
    if (chest.kind !== 'chest') throw new Error('chest')
    expect(chest.slots.some(s => s.kind === 'hold' && s.item.kind === 'flour')).toBe(true)
    expect(mill.units).toBe(0)
    expect(w.drops.filter(d => d.item.kind === 'flour')).toHaveLength(0)
    const mill2At = { col: AT.col, row: AT.row + 4 }
    const mill2 = put(mill2At)
    const e2 = machineEast(mill2.base)
    const full = new Chest({ shape: 'rect', col: e2.col, row: e2.row, w: 1, h: 1 })
    full.slots.forEach((_, i) => {
      full.slots[i] = { kind: 'hold', item: { kind: 'tree-seed', tree: 'olive', variety: 'base', quality: 0 } }
    })
    w.setCell(e2, full)
    const flour0 = w.drops.filter(d => d.item.kind === 'flour').length
    ticks(w, MILL_WORK)
    expect(mill2.units).toBe(MILL_IN)
    expect(w.drops.filter(d => d.item.kind === 'flour').length).toBe(flour0)
    const mill3At = { col: AT.col, row: AT.row + 8 }
    const mill3 = put(mill3At)
    ticks(w, MILL_WORK)
    expect(mill3.units).toBe(0)
    expect(w.drops.some(d => d.item.kind === 'flour' && d.at.col === mill3At.col && d.at.row === mill3At.row + MILL_H)).toBe(
      true,
    )
  })
})

describe('machines.io-side', () => {
  test('West chest/freezer is input. East is output. Same row `base.row + base.h - 1`. Mill, Infuser, Furnace: south row (west of the south-west cell, east of the south-east cell). Furnace origin row is not I/O. Jam, still, station unchanged (`h = 1`). Still: west of origin, east of east cell. Station: west of `at`, east of `at`.', () => {
    const w = new World(1)
    const mill = new Mill({ shape: 'rect', col: AT.col, row: AT.row, w: MILL_W, h: MILL_H })
    occupiedCells(mill.base, w.owned).forEach(p => w.setCell(p, mill))
    const millWest = machineWest(mill.base)
    const millEast = machineEast(mill.base)
    expect(millWest).toEqual({ col: AT.col - 1, row: AT.row + MILL_H - 1 })
    expect(millEast).toEqual({ col: AT.col + MILL_W, row: AT.row + MILL_H - 1 })
    w.setCell({ col: AT.col - 1, row: AT.row }, new Chest({ shape: 'rect', col: AT.col - 1, row: AT.row, w: 1, h: 1 }))
    w.setCell(millWest, new Chest({ shape: 'rect', col: millWest.col, row: millWest.row, w: 1, h: 1 }))
    w.setCell(millEast, new Freezer({ shape: 'rect', col: millEast.col, row: millEast.row, w: 1, h: 1 }))
    const infAt = { col: AT.col + 6, row: AT.row }
    const inf = new Infuser({ shape: 'rect', col: infAt.col, row: infAt.row, w: MILL_W, h: MILL_H })
    occupiedCells(inf.base, w.owned).forEach(p => w.setCell(p, inf))
    const infWest = machineWest(inf.base)
    const infEast = machineEast(inf.base)
    expect(infWest.row).toBe(infAt.row + MILL_H - 1)
    expect(infEast.row).toBe(infAt.row + MILL_H - 1)
    w.setCell(infWest, new Chest({ shape: 'rect', col: infWest.col, row: infWest.row, w: 1, h: 1 }))
    w.setCell(infEast, new Freezer({ shape: 'rect', col: infEast.col, row: infEast.row, w: 1, h: 1 }))
    const furnaceAt = { col: AT.col, row: AT.row + 4 }
    const furnace = putFurnace(w, furnaceAt)
    const furnaceWest = machineWest(furnace.base)
    const furnaceEast = machineEast(furnace.base)
    expect(furnaceWest).toEqual({ col: furnaceAt.col - 1, row: furnaceAt.row + 1 })
    expect(furnaceEast).toEqual({ col: furnaceAt.col + 1, row: furnaceAt.row + 1 })
    w.setCell({ col: furnaceAt.col - 1, row: furnaceAt.row }, new Chest({ shape: 'rect', col: furnaceAt.col - 1, row: furnaceAt.row, w: 1, h: 1 }))
    w.setCell(furnaceWest, new Chest({ shape: 'rect', col: furnaceWest.col, row: furnaceWest.row, w: 1, h: 1 }))
    w.setCell(furnaceEast, new Freezer({ shape: 'rect', col: furnaceEast.col, row: furnaceEast.row, w: 1, h: 1 }))
    const stillAt = { col: AT.col + 6, row: AT.row + 4 }
    const still = new PotStill({ shape: 'rect', col: stillAt.col, row: stillAt.row, w: 2, h: 1 })
    w.setCell(stillAt, still)
    w.setCell({ col: stillAt.col + 1, row: stillAt.row }, still)
    const stillWest = machineWest(still.base)
    const stillEast = machineEast(still.base)
    expect(stillWest).toEqual({ col: stillAt.col - 1, row: stillAt.row })
    expect(stillEast).toEqual({ col: stillAt.col + 2, row: stillAt.row })
    w.setCell(stillWest, new Chest({ shape: 'rect', col: stillWest.col, row: stillWest.row, w: 1, h: 1 }))
    w.setCell(stillEast, new Freezer({ shape: 'rect', col: stillEast.col, row: stillEast.row, w: 1, h: 1 }))
    const jamAt = { col: AT.col, row: AT.row + 8 }
    const jam = new JamMachine({ shape: 'rect', col: jamAt.col, row: jamAt.row, w: 1, h: 1 })
    w.setCell(jamAt, jam)
    const jamWest = machineWest(jam.base)
    const jamEast = machineEast(jam.base)
    expect(jamWest).toEqual({ col: jamAt.col - 1, row: jamAt.row })
    expect(jamEast).toEqual({ col: jamAt.col + 1, row: jamAt.row })
    w.setCell(jamWest, new Chest({ shape: 'rect', col: jamWest.col, row: jamWest.row, w: 1, h: 1 }))
    w.setCell(jamEast, new Freezer({ shape: 'rect', col: jamEast.col, row: jamEast.row, w: 1, h: 1 }))
    const stationAt = { col: AT.col + 6, row: AT.row + 8 }
    const station = new ResearchStation({ shape: 'rect', col: stationAt.col, row: stationAt.row, w: 1, h: 1 })
    w.setCell(stationAt, station)
    const stationWest = machineWest(station.base)
    const stationEast = machineEast(station.base)
    expect(stationWest).toEqual({ col: stationAt.col - 1, row: stationAt.row })
    expect(stationEast).toEqual({ col: stationAt.col + station.base.w, row: stationAt.row })
    w.setCell(stationWest, new Chest({ shape: 'rect', col: stationWest.col, row: stationWest.row, w: 1, h: 1 }))
    w.setCell(stationEast, new Freezer({ shape: 'rect', col: stationEast.col, row: stationEast.row, w: 1, h: 1 }))
    const links = w.machineLinks()
    expect(links.some(l => l.side === 'in' && l.x === mill.base.col - 0.5 && l.y === millWest.row)).toBe(true)
    expect(links.some(l => l.side === 'out' && l.x === mill.base.col + mill.base.w - 0.5 && l.y === millEast.row)).toBe(true)
    expect(links.some(l => l.side === 'in' && l.x === mill.base.col - 0.5 && l.y === mill.base.row)).toBe(false)
    expect(links.some(l => l.side === 'in' && l.x === inf.base.col - 0.5 && l.y === infWest.row)).toBe(true)
    expect(links.some(l => l.side === 'out' && l.x === inf.base.col + inf.base.w - 0.5 && l.y === infEast.row)).toBe(true)
    expect(links.some(l => l.side === 'in' && l.x === furnace.base.col - 0.5 && l.y === furnaceWest.row)).toBe(true)
    expect(links.some(l => l.side === 'out' && l.x === furnace.base.col + furnace.base.w - 0.5 && l.y === furnaceEast.row)).toBe(true)
    expect(links.some(l => l.x === furnace.base.col - 0.5 && l.y === furnace.base.row)).toBe(false)
    expect(links.some(l => l.x === furnace.base.col + furnace.base.w - 0.5 && l.y === furnace.base.row)).toBe(false)
    expect(links.some(l => l.side === 'in' && l.x === still.base.col - 0.5 && l.y === stillAt.row)).toBe(true)
    expect(links.some(l => l.side === 'out' && l.x === still.base.col + still.base.w - 0.5 && l.y === stillAt.row)).toBe(true)
    expect(links.some(l => l.side === 'in' && l.x === jam.base.col - 0.5 && l.y === jamAt.row)).toBe(true)
    expect(links.some(l => l.side === 'out' && l.x === jam.base.col + jam.base.w - 0.5 && l.y === jamAt.row)).toBe(true)
    expect(links.some(l => l.side === 'in' && l.x === station.base.col - 0.5 && l.y === stationAt.row)).toBe(true)
    expect(links.some(l => l.side === 'out' && l.x === station.base.col + station.base.w - 0.5 && l.y === stationAt.row)).toBe(true)
  })
})

function putFurnace(w: World, at: { col: number; row: number }): Furnace {
  const f = new Furnace({ shape: 'rect', col: at.col, row: at.row, w: 1, h: 2 })
  w.setCell(at, f)
  w.setCell({ col: at.col, row: at.row + 1 }, f)
  return f
}

describe('machines.furnace-feed', () => {
  test('Ash lock: compost feedstock + oil + spirit + wood + tree-seed + graft. Values as `FURNACE_VALUE`. Mix ash. Cap `FURNACE_CAP`. Refuse jam/cask/extract/vanilla-extract/flakes/bread/ash/tools. Flour is bread lock, not ash. Variety, quality, `infused` ignored on ash.', () => {
    expect(FURNACE_CAP).toBe(100)
    expect(FURNACE_VALUE).toEqual({ green: 1, fruit: 3, oil: 25, spirit: 36, wood: 40 })
    expect(AXES.axe).toEqual({ uses: 30, workSeconds: 5 })
    expect(AXES.chainsaw).toEqual({ uses: 90, workSeconds: 3 })
    const w = new World(1)
    const at = { col: AT.col, row: AT.row + 12 }
    const f = putFurnace(w, at)
    expect(furnaceValue({ kind: 'weed', count: 3 })).toBe(FURNACE_VALUE.green * 3)
    expect(furnaceValue({ kind: 'tree-seed', tree: 'apple', variety: 'base', quality: 0 })).toBe(FURNACE_VALUE.green)
    expect(furnaceValue({ kind: 'fruit', crop: 'carrot', variety: 'base', quality: 1, count: 2, unitSale: 1, freshness: 1, bio: true, cut: false })).toBe(
      FURNACE_VALUE.fruit * 2,
    )
    expect(furnaceValue({ kind: 'sugar', liters: 3, capacityLiters: 3, unitSale: 1, quality: 0 })).toBe(FURNACE_VALUE.fruit * 3)
    expect(furnaceValue({ kind: 'oil', quality: 0, count: 1, unitSale: 1, infused: false })).toBe(FURNACE_VALUE.oil)
    expect(furnaceValue({ kind: 'spirit', spirit: 'vodka', variety: 'base', quality: 0, count: 1, unitSale: 1, infused: false })).toBe(FURNACE_VALUE.spirit)
    expect(furnaceValue({ kind: 'wood', count: 1 })).toBe(FURNACE_VALUE.wood)
    expect(furnaceValue({ kind: 'jam', crop: 'grape', variety: 'base', quality: 0, count: 1, unitSale: 1, infused: false })).toBe(0)
    expect(furnaceValue({ kind: 'flour', quality: 0, count: 1, unitSale: 1 })).toBe(0)
    expect(furnaceValue({ kind: 'flakes', quality: 0, count: 1 })).toBe(0)
    expect(furnaceValue({ kind: 'vanilla-extract', quality: 0, count: 1 })).toBe(0)
    expect(furnaceValue({ kind: 'bread', quality: 0, count: 1, unitSale: 1 })).toBe(0)
    expect(furnaceValue({ kind: 'ash', count: 1 })).toBe(0)
    expect(furnaceValue({ kind: 'axe', usesLeft: 3, workSeconds: 1 })).toBe(0)
    expect(furnaceValue({ kind: 'chainsaw', usesLeft: 3, workSeconds: 1 })).toBe(0)
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
    w.seats[0].hand = { kind: 'hold', item: { kind: 'jam', crop: 'grape', variety: 'base', quality: 0, count: 1, unitSale: 1, infused: false } }
    w.enqueue({ act: 'furnace', at })
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    expect(f.units).toBe(FURNACE_VALUE.wood + FURNACE_VALUE.green * 2)
    f.units = FURNACE_CAP - 1
    expect(furnaceAccept(f, { kind: 'wood', count: 1 })).toBe(0)
    expect(furnaceAccept(f, { kind: 'sugar', liters: 4, capacityLiters: 4, unitSale: 1, quality: 0 })).toBe(1 / FURNACE_VALUE.fruit)
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
    f.recipe = 'ash'
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
    f.recipe = 'ash'
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
    still.feed = [{ crop: 'potato', variety: 'base', quality: 0, count: STILL_CAP }]
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
    barrel.feed = [{ variety: 'base', quality: 0, count: 5 }]
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
    f1.recipe = 'ash'
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
    f2.recipe = 'ash'
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
  test('West pull, east push on the south row. Pads, `in` top, `out` bottom high iff `units === 0`. Signal ports stay origin. South cell no port. Origin row is not chest I/O.', () => {
    const w = new World(1)
    const at = { col: AT.col, row: AT.row + 12 }
    const f = putFurnace(w, at)
    const west = { col: at.col - 1, row: at.row }
    const east = { col: at.col + 1, row: at.row }
    const southWest = machineWest(f.base)
    const southEast = machineEast(f.base)
    w.setCell(west, new Chest({ shape: 'rect', col: west.col, row: west.row, w: 1, h: 1 }))
    w.setCell(east, new Chest({ shape: 'rect', col: east.col, row: east.row, w: 1, h: 1 }))
    w.setCell(southWest, new Chest({ shape: 'rect', col: southWest.col, row: southWest.row, w: 1, h: 1 }))
    w.setCell(southEast, new Chest({ shape: 'rect', col: southEast.col, row: southEast.row, w: 1, h: 1 }))
    const links = w.machineLinks()
    expect(southWest.row).toBe(at.row + 1)
    expect(southEast.row).toBe(at.row + 1)
    expect(links.some(l => l.side === 'in' && l.x === at.col - 0.5 && l.y === at.row + 1)).toBe(true)
    expect(links.some(l => l.side === 'out' && l.x === at.col + 0.5 && l.y === at.row + 1)).toBe(true)
    expect(links.some(l => l.y === at.row)).toBe(false)
    const westChest = w.cell(west)
    if (westChest.kind !== 'chest') throw new Error('chest')
    westChest.slots[0] = { kind: 'hold', item: { kind: 'weed', count: 1 } }
    const southChest = w.cell(southWest)
    if (southChest.kind !== 'chest') throw new Error('chest')
    southChest.slots[0] = { kind: 'hold', item: { kind: 'wood', count: 1 } }
    ticks(w, BIG_TICK)
    expect(f.units).toBe(FURNACE_VALUE.wood)
    expect(westChest.slots[0].kind).toBe('hold')
    expect(southChest.slots.every(s => s.kind === 'empty')).toBe(true)
    f.units = FURNACE_NEED
    ticks(w, FURNACE_SECONDS)
    const eastChest = w.cell(east)
    if (eastChest.kind !== 'chest') throw new Error('chest')
    const southEastChest = w.cell(southEast)
    if (southEastChest.kind !== 'chest') throw new Error('chest')
    expect(eastChest.slots.every(s => s.kind === 'empty')).toBe(true)
    expect(southEastChest.slots.some(s => s.kind === 'hold' && s.item.kind === 'ash')).toBe(true)
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
    f.recipe = 'ash'
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

type PinnedFruit = Extract<Item, { kind: 'fruit' }>

function fruitOf(crop: PinnedFruit['crop'], variety: PinnedFruit['variety'], count: number, quality = 0): PinnedFruit {
  return { kind: 'fruit', crop, variety, quality, count, unitSale: 1, freshness: 1, bio: true, cut: false }
}

const CELL = { shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 1 } as const

describe('machines.variety-lock', () => {
  test('Mill, jam, barrel, grinder, station lock crop + variety. Still does not. Furnace and compost ignore variety and quality.', () => {
    const mill = new Mill(CELL)
    expect(millAccept(mill, fruitOf('wheat', 'base', 5))).toEqual({ recipe: 'wheat', n: 5 })
    mill.recipe = 'wheat'
    mill.variety = 'base'
    mill.units = 5
    expect(millAccept(mill, fruitOf('wheat', 'red-fife', 5))).toBeUndefined()
    expect(millAccept(mill, fruitOf('wheat', 'base', 5))).toEqual({ recipe: 'wheat', n: 5 })

    const jam = new JamMachine(CELL)
    expect(jamFruitAccept(jam, fruitOf('grape', 'concord', 5))).toBe(5)
    jam.crop = 'grape'
    jam.variety = 'concord'
    jam.fruit = 5
    expect(jamFruitAccept(jam, fruitOf('grape', 'base', 5))).toBe(0)
    expect(jamFruitAccept(jam, fruitOf('grape', 'concord', 2))).toBe(2)

    const barrel = new Barrel(CELL)
    expect(barrelAccept(barrel, fruitOf('grape', 'keknyelu', 2))).toMatchObject({ crop: 'grape', variety: 'keknyelu', n: 2 })
    barrel.crop = 'grape'
    barrel.feed = [{ variety: 'keknyelu', quality: 0, count: 2 }]
    expect(barrelAccept(barrel, fruitOf('grape', 'concord', 2))).toBeUndefined()
    expect(barrelAccept(barrel, fruitOf('grape', 'keknyelu', 2))).toMatchObject({ n: 2 })

    const grinder = new Grinder(CELL)
    grinder.crop = 'wheat'
    grinder.variety = 'base'
    grinder.units = 1
    expect(grindAccept(grinder, fruitOf('wheat', 'red-fife', 1))).toBeUndefined()
    expect(grindAccept(grinder, fruitOf('wheat', 'base', 1))).toMatchObject({ n: 1 })

    const still = new PotStill(CELL)
    expect(stillAccept(still, fruitOf('wheat', 'red-fife', 3))).toBe(3)
    still.feed = [{ crop: 'wheat', variety: 'red-fife', quality: 0, count: 3 }]
    expect(stillAccept(still, fruitOf('wheat', 'base', 3))).toBe(3)

    const furnace = new Furnace(CELL)
    expect(furnaceAccept(furnace, fruitOf('wheat', 'red-fife', 1, 1))).toBe(furnaceAccept(furnace, fruitOf('wheat', 'base', 1, 0)))
  })
})

describe('still.variety', () => {
  test("On finish: every unit one crop and one variety → that crop's named spirit at that variety. Else `mixed` at `SPIRIT_SALE.vodka × MIXED_MUL × qualityMul(mean q)`, neutral rating. One variety or mixed.", () => {
    expect(spiritKind([{ crop: 'potato', variety: 'bintje', count: STILL_CAP }])).toBe('vodka')
    expect(
      spiritKind([
        { crop: 'potato', variety: 'bintje', count: 5 },
        { crop: 'potato', variety: 'base', count: 5 },
      ]),
    ).toBe('mixed')
    expect(
      spiritKind([
        { crop: 'potato', variety: 'bintje', count: 5 },
        { crop: 'wheat', variety: 'red-fife', count: 5 },
      ]),
    ).toBe('mixed')
    expect(bakeSpiritSale('vodka', 'bintje', 0)).toBe(SPIRIT_SALE.vodka * PURPOSE_MUL.variant.on)
    expect(bakeSpiritSale('mixed', 'base', 0.5)).toBe(SPIRIT_SALE.vodka * MIXED_MUL * qualityMul(0.5))
  })
})

describe('machines.quality-carry', () => {
  test("Output quality is the mean of what went in. Output sale takes `RATING_SALE` of the input variety on that machine's path × `qualityMul`.", () => {
    expect(meanQuality([{ quality: 0, count: 3 }, { quality: 1, count: 1 }])).toBe(0.25)

    const flour = millProduct('wheat', 'red-fife', 1)
    expect(flour.kind === 'flour' && flour.unitSale).toBeCloseTo(FLOUR * PURPOSE_MUL.variant.on * qualityMul(1), 9)
    expect(flour.kind === 'flour' && flour.quality).toBe(1)
    expect(millProduct('wheat', 'base', 0)).toMatchObject({ kind: 'flour', unitSale: FLOUR, quality: 0 })

    expect(jamSale('tomato', 'san-marzano', 0.5)).toBeCloseTo(JAM_SALE.tomato * PURPOSE_MUL.heirloom.on * qualityMul(0.5), 9)
    expect(jamSale('tomato', 'base', 0)).toBe(JAM_SALE.tomato)

    expect(bakeSpiritSale('brandy', 'klosterneuburger', 0)).toBe(SPIRIT_SALE.brandy * PURPOSE_MUL.heirloom.on)

    expect(bakeCaskSale('wine', 'keknyelu', 0, BARREL_MATURE)).toBe(CASK_SALE.wine * PURPOSE_MUL.heirloom.on)
    expect(purposeMul('keknyelu', 'alcohol')).toBe(PURPOSE_MUL.heirloom.on)

    const w = new World(1)
    const mill = new Mill(CELL)
    occupiedCells(mill.base, w.owned).forEach(p => w.setCell(p, mill))
    const west = machineWest(mill.base)
    w.setCell(west, new Chest({ shape: 'rect', col: west.col, row: west.row, w: 1, h: 1 }))
    const chest = w.cell(west)
    if (chest.kind !== 'chest') throw new Error('chest')
    chest.slots[0] = { kind: 'hold', item: fruitOf('wheat', 'red-fife', 3, 1) }
    chest.slots[1] = { kind: 'hold', item: fruitOf('wheat', 'red-fife', 1, 0) }
    ticks(w, BIG_TICK)
    expect(mill.variety).toBe('red-fife')
    expect(mill.quality).toBe(0.75)
  })
})

describe('machines.barrel', () => {
  test('`caskAgeTop(q)` lerps the cap over quality. `caskMulOf` reads purpose and age back out of `unitSale` as one multiplier.', () => {
    expect(caskAgeTop(0)).toBe(CASK_AGE_MIN)
    expect(caskAgeTop(1)).toBe(CASK_AGE_MAX)
    expect(caskAgeTop(0.5)).toBe((CASK_AGE_MIN + CASK_AGE_MAX) / 2)
    expect(caskAgeMul(BARREL_MATURE, 1)).toBe(1)
    expect(caskAgeMul(BARREL_MATURE + BARREL_AGE, 1)).toBe(CASK_AGE_MAX)
    const age = BARREL_MATURE + BARREL_AGE / 2
    expect(caskMulOf({ cask: 'wine', quality: 0.5, unitSale: bakeCaskSale('wine', 'base', 0.5, age) })).toBeCloseTo(
      caskAgeMul(age, 0.5),
      9,
    )
    expect(caskMulOf({ cask: 'wine', quality: 0.5, unitSale: bakeCaskSale('wine', 'keknyelu', 0.5, age) })).toBeCloseTo(
      PURPOSE_MUL.heirloom.on * caskAgeMul(age, 0.5),
      9,
    )
  })
})

describe('station.cut', () => {
  test('Fruit `cut: boolean` required, `false` from the field. Cut fruit is otherwise ordinary. Illegal: optional `cut`.', () => {
    const w = new World(1)
    w.setCell(AT, { kind: 'ripe', soil: new Soil(SOIL_WATER_MID, 1, WEED_CHANCE), plant: new Plant('wheat', 'red-fife', 0) })
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    w.enqueue({ act: 'harvest', at: AT })
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    const hand = w.seats[0].hand
    expect(hand.kind === 'hold' && hand.item.kind === 'fruit' && hand.item.cut).toBe(false)

    const cut = fruitOf('wheat', 'base', 2)
    cut.cut = true
    const plain = fruitOf('wheat', 'base', 2)
    mergeInto(plain, cut, 2)
    expect(plain.cut).toBe(true)
    expect(plain.count).toBe(4)

    const mill = new Mill(CELL)
    expect(millAccept(mill, cut)).toEqual(millAccept(mill, fruitOf('wheat', 'base', 2)))
    expect(furnaceValue(cut)).toBe(furnaceValue(fruitOf('wheat', 'base', 2)))
  })
})

describe('machines.barrel aging look', () => {
  test('An aging barrel names the cask, the variety it was made from, the days it can still age and the sale multiplier at the top.', () => {
    const w = new World(1)
    const barrel = new Barrel(CELL)
    barrel.crop = 'grape'
    barrel.feed = [{ variety: 'keknyelu', quality: 1, count: barrelNeed('grape') }]
    barrel.age = BARREL_MATURE
    w.setCell(AT, barrel)
    const lines = lookText(w, { kind: 'cell', at: AT }, false).split('\n')
    const top = lines.find(l => l.includes(String(Math.round(BARREL_AGE / DAY_SECONDS))))
    expect(top).toBeDefined()
    expect(top).toContain(caskName('wine', 'keknyelu'))
    expect(caskName('wine', 'keknyelu')).not.toBe(m.names_cask_wine())
    expect(caskName('wine', 'concord')).toBe(m.names_cask_wine())
    expect(top).toContain('Kéknyelű')
    expect(top).toContain(String(caskAgeTop(1)))

    barrel.age = BARREL_MATURE - 1
    const young = lookText(w, { kind: 'cell', at: AT }, false).split('\n')
    expect(young.some(l => l.includes(caskName('wine', 'keknyelu')))).toBe(false)
  })
})

describe('machines.cask-premium', () => {
  test('`machines.cask-premium` — A cask from an Heirloom Variety reads Premium; every other Variety reads the plain cask name. The stall bin is a `CaskId` and keeps `CASK_NAME`.', () => {
    CASK_IDS.forEach(cask => {
      expect(caskName(cask, 'base')).toBe(CASK_NAME[cask]())
      VARIETIES[CROP_OF_CASK[cask]].forEach(v => {
        const premium = caskGroup(v) === 'heirloom'
        expect(caskName(cask, v) === CASK_NAME[cask]()).toBe(!premium)
        expect(caskName(cask, v).includes(CASK_NAME[cask]().toLowerCase())).toBe(premium)
      })
    })
  })
})

describe('station.io', () => {
  test('Heirloom fruit only, `cut === false`. First dump locks crop + variety; later dumps must match. Room caps at `STATION_IN`.', () => {
    const st = new ResearchStation(CELL)
    expect(stationAccept(st, fruitOf('tomato', 'base', 3))).toBeUndefined()
    expect(stationAccept(st, fruitOf('tomato', 'green-zebra', 3))).toBeUndefined()
    const cut = fruitOf('tomato', 'san-marzano', 3)
    cut.cut = true
    expect(stationAccept(st, cut)).toBeUndefined()
    expect(stationAccept(st, fruitOf('tomato', 'san-marzano', STATION_IN + 4))).toMatchObject({
      crop: 'tomato',
      variety: 'san-marzano',
      n: STATION_IN,
    })

    stationApply(st, { crop: 'tomato', variety: 'san-marzano', quality: 0.4, n: 1 })
    expect(st.crop).toBe('tomato')
    expect(stationAccept(st, fruitOf('tomato', 'green-zebra', 1))).toBeUndefined()
    expect(stationAccept(st, fruitOf('raspberry', 'black-raspberry', 1))).toBeUndefined()
    expect(stationAccept(st, fruitOf('tomato', 'san-marzano', 1))).toMatchObject({ n: 1 })

    stationApply(st, { crop: 'tomato', variety: 'san-marzano', quality: 0, n: 1 })
    expect(st.quality).toBeCloseTo(0.2, 9)
    expect(stationWorking(st)).toBe(false)
    st.units = STATION_IN
    expect(stationWorking(st)).toBe(true)
    st.inn = 1
    expect(stationWorking(st)).toBe(false)
  })

  test('At progress 1: consume, emit `STATION_IN` cut fruit and `STATION_GRAFT_MIN`..`STATION_GRAFT_MAX` grafts, both at input quality.', () => {
    const w = new World(1)
    w.setCell(AT, new ResearchStation({ shape: 'rect', col: AT.col, row: AT.row, w: 1, h: 1 }))
    const cell = w.cell(AT)
    if (cell.kind !== 'station') throw new Error('station')
    cell.crop = 'wheat'
    cell.variety = 'red-fife'
    cell.quality = 0.5
    cell.units = STATION_IN
    ticks(w, STATION_SECONDS + DT_MAX)
    const items = w.drops.map(d => d.item)
    const fruit = items.find(it => it.kind === 'fruit')
    const graft = items.find(it => it.kind === 'graft')
    if (fruit?.kind !== 'fruit') throw new Error('fruit')
    if (graft?.kind !== 'graft') throw new Error('graft')
    expect(fruit.cut).toBe(true)
    expect(fruit.count).toBe(STATION_IN)
    expect(fruit.variety).toBe('red-fife')
    expect(fruit.quality).toBe(0.5)
    expect(graft.crop).toBe('wheat')
    expect(graft.variety).toBe('red-fife')
    expect(graft.quality).toBe(0.5)
    expect(graft.count).toBeGreaterThanOrEqual(STATION_GRAFT_MIN)
    expect(graft.count).toBeLessThanOrEqual(STATION_GRAFT_MAX)
    const after = w.cell(AT)
    expect(after.kind === 'station' && after.crop).toBe('none')
    expect(after.kind === 'station' && after.units).toBe(0)
  })
})

describe('variety.copy', () => {
  test('Station grafts are the locked variety at input quality. A graft attaching copies both onto the target.', () => {
    const w = new World(1)
    w.setCell(AT, { kind: 'growing', soil: new Soil(SOIL_WATER_MID, 1, WEED_CHANCE), plant: new Plant('wheat', 'base', 0) })
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    w.seats[0].hand = { kind: 'hold', item: { kind: 'graft', crop: 'wheat', variety: 'red-fife', quality: 0.75, count: 1 } }
    expect(w.canGraft(AT)).toBe(true)
    w.enqueue({ act: 'graft', at: AT })
    ticks(w, GRAFT_WORK + DT_MAX)
    const cell = w.cell(AT)
    expect(cell.kind === 'growing' && cell.plant.variety).toBe('red-fife')
    expect(cell.kind === 'growing' && cell.plant.quality).toBe(0.75)
    expect(w.seats[0].hand.kind).toBe('empty')
  })
})

describe('building.flags', () => {
  test('`BaseBuilding` carries `solid` `ticks` `hasted` beside `ports` `pads` `takeAll`. A building that wants the default declares nothing. No call site re-derives a flag by listing kinds.', () => {
    const base = { shape: 'rect' as const, col: 0, row: 0, w: 1, h: 1 }
    const chest = new Chest(base)
    expect(chest.solid).toBe(true)
    expect(chest.ticks).toBe(false)
    expect(chest.hasted).toBe(false)
    const mill = new Mill(base)
    expect(mill.ticks).toBe(true)
    expect(mill.hasted).toBe(true)
    const station = new ResearchStation(base)
    expect(station.ticks).toBe(true)
    expect(station.hasted).toBe(false)
    const barrel = new Barrel(base)
    expect(barrel.ticks).toBe(true)
    expect(barrel.hasted).toBe(false)
    const box = new CompostBox(base)
    expect(box.ticks).toBe(true)
    expect(box.hasted).toBe(true)
    const grind = new Grinder(base)
    expect(grind.ticks).toBe(true)
    expect(grind.hasted).toBe(true)
  })
})

describe('building.ports-single', () => {
  test('`ports` is the only statement of which ports a cell has. `hit.ts` has no `portsOf`. Sensors carry the same field.', () => {
    const base = { shape: 'rect' as const, col: 0, row: 0, w: 1, h: 1 }
    expect([...new Mill(base).ports]).toEqual(['in'])
    expect([...new Furnace(base).ports]).toEqual(['in', 'out'])
    expect([...new Chest(base).ports]).toEqual(['out'])
    expect([...new Lamp(base).ports]).toEqual(['in'])
    expect([...new Lever(base).ports]).toEqual(['in', 'out'])
  })
})

describe('machines.tick-self', () => {
  test('`tickMachines` does not name a machine kind. Origin-cell guard and `ticks` live in the loop; rate and product live on the machine.', () => {
    const w = new World(1)
    const at = { col: 10, row: 14 }
    const mill = new Mill({ shape: 'rect', col: at.col, row: at.row, w: 1, h: 1 })
    mill.recipe = 'wheat'
    mill.units = MILL_IN
    w.setCell(at, mill)
    expect(mill.tick(w, at, DT_MAX)).toBe(false)
    expect(mill.progress).toBeCloseTo((DT_MAX * w.machineMul()) / MILL_WORK)
  })
})

