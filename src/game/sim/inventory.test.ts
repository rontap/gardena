// COMMANDMENT: never test specifically for versions, ever. expect(SAVE_VERSION) or PROTOCOL .toBe is disallowed.
import { describe, expect, test } from 'vitest'
import { GRASS_PACK, SILO_H, SILO_SEED_CAP, SILO_W, SUGAR_BAG } from '../defs/items.ts'
import { SKUS } from '../defs/research.ts'
import { SHELF_SKUS } from '../defs/shelf.ts'
import type { VarietyId } from '../defs/varieties.ts'
import { ADDITIVE_BAG, SiloSeed, SiloSpray } from './building.ts'
import { packSku, type AnnualId, type SkuId } from './ids.ts'
import { skuItem, type Item } from './item.ts'
import { Act } from './log.ts'
import { Soil, SOIL_WATER_MID, WEED_CHANCE } from './soil.ts'
import { DT_MAX, World } from './world.ts'

const AT = { col: 10, row: 12 }

function bed(water = SOIL_WATER_MID, fertilizer = 1): Soil {
  return new Soil(water, fertilizer, WEED_CHANCE)
}

function siloCount(w: World, crop: AnnualId, variety: VarietyId): number {
  const hit = w.silo.seeds.find(st => st.crop === crop && st.variety === variety)
  if (hit === undefined) return 0
  return hit.count
}


describe('inventory.silo-buy', () => {
  test("Seed silo Buy row click `buy(packSku)`, Ctrl+click `buyPacks(packSku)`. Packs `'base'` quality 0. No pack: no Buy. `pack-chilli` after `unlock-infusion`. `pack-grass` after `unlock-landscaping`, `GRASS_PACK`, `{ kind: 'seeds'; crop: 'grass'; variety: 'base'; quality: 0 }`.", () => {
    expect(packSku('vanilla')).toBeUndefined()
    expect(packSku('carrot')).toBe('pack-carrot')
    const sku: SkuId = 'pack-carrot'
    const w = new World(1)
    w.money = 0
    expect(w.buy(sku)).toBe('Cannot afford')
    w.buyPacks(sku)
    expect(siloCount(w, 'carrot', 'base')).toBe(7)
    w.money = 50
    expect(w.buy(sku)).toBeUndefined()
    expect(siloCount(w, 'carrot', 'base')).toBe(12)
    const bulk = new World(1)
    bulk.money = 50
    bulk.buyPacks(sku)
    expect(siloCount(bulk, 'carrot', 'base')).toBe(32)
    const full = new World(1)
    full.money = 50
    full.silo.seeds.length = 0
    full.silo.seeds.push({ crop: 'carrot', variety: 'base', quality: 0, count: SILO_SEED_CAP })
    expect(full.buy(sku)).toBe('Seed silo full')
    full.buyPacks(sku)
    expect(siloCount(full, 'carrot', 'base')).toBe(SILO_SEED_CAP)

    expect(SKUS['pack-chilli']).toMatchObject({ unlock: 'unlock-infusion', show: 'unlock-infusion' })
    const chilli = new World(1)
    chilli.money = 50
    expect(chilli.buy('pack-chilli')).toBeUndefined()
    expect(siloCount(chilli, 'chilli', 'base')).toBe(0)
    chilli.done.add('unlock-infusion')
    expect(chilli.buy('pack-chilli')).toBeUndefined()
    expect(siloCount(chilli, 'chilli', 'base')).toBe(5)

    expect(skuItem('pack-grass')).toEqual({ kind: 'seeds', crop: 'grass', variety: 'base', quality: 0, count: GRASS_PACK })
    const grass = new World(1)
    grass.money = 50
    expect(grass.buy('pack-grass')).toBeUndefined()
    expect(siloCount(grass, 'grass', 'base')).toBe(0)
    grass.done.add('unlock-landscaping')
    expect(grass.buy('pack-grass')).toBeUndefined()
    const st = grass.silo.seeds.find(s => s.crop === 'grass' && s.variety === 'base')
    expect(st).toEqual({ crop: 'grass', variety: 'base', quality: 0, count: GRASS_PACK })
  })
})

describe('inventory.restock', () => {
  const SILO = { col: AT.col, row: AT.row }

  function seedSilo(w: World): SiloSeed {
    const made = new SiloSeed({ shape: 'rect', col: SILO.col, row: SILO.row, w: SILO_W, h: SILO_H })
    w.setCell(SILO, made)
    return made
  }

  test('Only a field silo has the flag; the house Seed silo and Additive store do not.', () => {
    const w = new World(1)
    expect('restock' in w.silo).toBe(false)
    expect('restock' in w.additives).toBe(false)
    expect(seedSilo(w).restock).toBe(false)
  })

  test('On, a take buys whole packs back to the level held, stops when money runs out, and leaves a named Variety alone.', () => {
    const w = new World(1)
    const silo = seedSilo(w)
    w.money = 100
    silo.put('carrot', 'base', 0, 7)
    w.takeSilo(SILO, 'carrot', 'base')
    expect(silo.baseCount('carrot')).toBe(0)
    expect(w.money).toBe(100)

    w.setRestock(SILO, true)
    expect(silo.restock).toBe(true)
    silo.put('carrot', 'base', 0, 7)
    const price = w.skuPrice('pack-carrot')
    w.takeSilo(SILO, 'carrot', 'base')
    expect(silo.baseCount('carrot')).toBe(10)
    expect(w.money).toBe(100 - 2 * price)

    silo.put('potato', 'bintje', 0, 5)
    const before = w.money
    w.takeSilo(SILO, 'potato', 'bintje')
    expect(silo.seeds.filter(st => st.variety === 'bintje')).toHaveLength(0)
    expect(w.money).toBe(before)

    w.money = 0
    silo.put('carrot', 'base', 0, 5)
    w.takeSilo(SILO, 'carrot', 'base')
    expect(w.money).toBe(0)
    expect(silo.baseCount('carrot')).toBe(0)
  })

  test('Additive silo rows restock a bag at a time; compost has no sku to buy.', () => {
    const w = new World(1)
    const made = new SiloSpray({ shape: 'rect', col: SILO.col, row: SILO.row, w: SILO_W, h: SILO_H })
    w.setCell(SILO, made)
    w.money = 500
    w.setRestock(SILO, true)
    expect(made.restock).toBe(true)

    made.putAdditive('fertilizer', ADDITIVE_BAG.fertilizer * 2)
    const held = made.litersOf('fertilizer')
    const price = w.skuPrice('buy-fertilizer')
    w.takeAdditive(SILO, 'fertilizer')
    expect(made.litersOf('fertilizer')).toBe(held)
    expect(w.money).toBe(500 - price)

    made.putAdditive('compost', ADDITIVE_BAG.compost)
    const paid = w.money
    w.takeAdditive(SILO, 'compost')
    expect(w.money).toBe(paid)
    expect(made.litersOf('compost')).toBe(0)
  })
})

describe('inventory.swap', () => {
  const SILO = { col: AT.col, row: AT.row }

  function held(w: World): Item {
    const h = w.seats[0].hand
    if (h.kind !== 'hold') throw new Error('hand')
    return h.item
  }

  function seedSilo(w: World): SiloSeed {
    const made = new SiloSeed({ shape: 'rect', col: SILO.col, row: SILO.row, w: SILO_W, h: SILO_H })
    w.setCell(SILO, made)
    w.seats[0].hand = { kind: 'empty' }
    return made
  }

  function spraySilo(w: World): SiloSpray {
    const made = new SiloSpray({ shape: 'rect', col: SILO.col, row: SILO.row, w: SILO_W, h: SILO_H })
    w.setCell(SILO, made)
    w.seats[0].hand = { kind: 'empty' }
    return made
  }

  test('Taking the row already in hand joins it: the counts add, quality averages by count, and the row goes.', () => {
    const w = new World(1)
    const silo = seedSilo(w)
    const dropped = w.drops.length
    silo.put('carrot', 'base', 0, 4)
    w.takeSilo(SILO, 'carrot', 'base')
    silo.put('carrot', 'base', 1, 4)
    w.takeSilo(SILO, 'carrot', 'base')
    const it = held(w)
    expect(it.kind === 'seeds' && it.count).toBe(8)
    expect(it.kind === 'seeds' && it.quality).toBe(0.5)
    expect(silo.baseCount('carrot')).toBe(0)
    expect(w.drops).toHaveLength(dropped)
  })

  test('Taking a different row puts the held seeds back in that store instead of on the ground.', () => {
    const w = new World(1)
    const silo = seedSilo(w)
    const dropped = w.drops.length
    silo.put('carrot', 'base', 0, 4)
    silo.put('potato', 'base', 0, 3)
    w.takeSilo(SILO, 'carrot', 'base')
    w.takeSilo(SILO, 'potato', 'base')
    const it = held(w)
    expect(it.kind === 'seeds' && it.crop).toBe('potato')
    expect(it.kind === 'seeds' && it.count).toBe(3)
    expect(silo.baseCount('carrot')).toBe(4)
    expect(w.drops).toHaveLength(dropped)
  })

  test('An item the store has no room for still goes on the ground.', () => {
    const w = new World(1)
    const silo = seedSilo(w)
    const dropped = w.drops.length
    silo.put('carrot', 'base', 0, silo.cap - 1)
    w.setCell({ col: AT.col + 3, row: AT.row }, { kind: 'empty', soil: bed() })
    w.seats[0].actor.x = AT.col + 3.5
    w.seats[0].actor.y = AT.row + 0.5
    w.seats[0].hand = { kind: 'hold', item: { kind: 'seeds', crop: 'potato', variety: 'base', quality: 0, count: 4 } }
    w.takeSilo(SILO, 'carrot', 'base')
    expect(w.drops).toHaveLength(dropped + 1)
    const spill = w.drops[dropped].item
    expect(spill.kind === 'seeds' && spill.count).toBe(3)
    expect(silo.baseCount('potato')).toBe(1)
  })

  test('An Additive store row already in hand tops the bag up to its capacity and no further.', () => {
    const w = new World(1)
    const store = spraySilo(w)
    store.putAdditive('fertilizer', ADDITIVE_BAG.fertilizer * 2)
    w.takeAdditive(SILO, 'fertilizer')
    const first = held(w)
    expect(first.kind === 'fertilizer' && first.liters).toBe(ADDITIVE_BAG.fertilizer)
    w.takeAdditive(SILO, 'fertilizer')
    const again = held(w)
    expect(again.kind === 'fertilizer' && again.liters).toBe(ADDITIVE_BAG.fertilizer)
    expect(store.litersOf('fertilizer')).toBe(ADDITIVE_BAG.fertilizer)
    if (again.kind === 'fertilizer') again.liters = 2
    w.takeAdditive(SILO, 'fertilizer')
    const topped = held(w)
    expect(topped.kind === 'fertilizer' && topped.liters).toBe(ADDITIVE_BAG.fertilizer)
    expect(store.litersOf('fertilizer')).toBe(2)
  })

  test('A different Additive store row swaps: the held bag pours back in and the new one comes out.', () => {
    const w = new World(1)
    const store = spraySilo(w)
    const dropped = w.drops.length
    store.putAdditive('fertilizer', ADDITIVE_BAG.fertilizer)
    store.putAdditive('weed-spray', ADDITIVE_BAG['weed-spray'])
    w.takeAdditive(SILO, 'fertilizer')
    w.takeAdditive(SILO, 'weed-spray')
    expect(held(w).kind).toBe('weed-spray')
    expect(store.litersOf('fertilizer')).toBe(ADDITIVE_BAG.fertilizer)
    expect(store.litersOf('weed-spray')).toBe(0)
    expect(w.drops).toHaveLength(dropped)
  })

  test('Sugar in hand tops up from the bin and averages unit sale and quality by liters.', () => {
    const w = new World(1)
    const store = spraySilo(w)
    store.putSugar(SUGAR_BAG, 4, 0)
    w.seats[0].hand = {
      kind: 'hold',
      item: { kind: 'sugar', liters: SUGAR_BAG / 2, capacityLiters: SUGAR_BAG, unitSale: 8, quality: 1 },
    }
    w.takeSugar(SILO)
    const it = held(w)
    expect(it.kind === 'sugar' && it.liters).toBe(SUGAR_BAG)
    expect(it.kind === 'sugar' && it.unitSale).toBe(6)
    expect(it.kind === 'sugar' && it.quality).toBe(0.5)
    expect(store.sugar.liters).toBe(SUGAR_BAG / 2)
  })
})

describe('inventory.grass-silo', () => {
  test("`pack-grass` is not on Build. After `unlock-landscaping` it is sold at the Seed silo on the same path as `pack-chilli`: column when shown, Buy / bulk Buy, lands in the silo as a `'base'` stack, take to hand, walk-up deposits, field Seeding silos included. Item `{ kind: 'seeds'; crop: 'grass'; variety: 'base'; quality: 0; count }`. `packSku('grass')` is `pack-grass`. No `SeedStore.grass`. No `Act.takeStore` `k: 'grass'`. Take is `k: 'silo'` `c: 'grass'` `r: 'base'`. No extra grass store type. Sow is turf.", () => {
    expect(SHELF_SKUS.includes('pack-grass')).toBe(false)
    expect(packSku('grass')).toBe('pack-grass')
    const w = new World(1)
    expect('grass' in w.silo).toBe(false)
    w.money = 50
    w.done.add('unlock-landscaping')
    expect(w.buy('pack-grass')).toBeUndefined()
    expect(siloCount(w, 'grass', 'base')).toBe(GRASS_PACK)
    w.takeSilo(w.houseCell(), 'grass', 'base')
    expect(w.seats[0].hand).toEqual({
      kind: 'hold',
      item: { kind: 'seeds', crop: 'grass', variety: 'base', quality: 0, count: GRASS_PACK },
    })
    expect(w.log.some(c => c.a === Act.takeStore && c.k === 'silo' && c.c === 'grass' && c.r === 'base')).toBe(true)
    const house = w.houseCell()
    w.seats[0].actor.x = house.col + 0.5
    w.seats[0].actor.y = house.row + 0.5
    w.enqueue({ act: 'silo', at: house })
    while (w.seats[0].queue.length > 0) w.tick(DT_MAX)
    expect(siloCount(w, 'grass', 'base')).toBe(GRASS_PACK)
    expect(w.seats[0].hand.kind).toBe('empty')

    const field = new World(1)
    field.unlockAll()
    field.money = 99999
    const at = { col: 6, row: 20 }
    field.buy('buy-silo-seed')
    field.confirmPlace(at)
    expect(field.buyInto(at, 'pack-grass')).toBeUndefined()
    const silo = field.cell(at)
    expect(silo.kind).toBe('silo-seed')
    if (silo.kind !== 'silo-seed') throw new Error('silo')
    expect(silo.seeds.find(st => st.crop === 'grass')).toEqual({
      crop: 'grass',
      variety: 'base',
      quality: 0,
      count: GRASS_PACK,
    })
    field.buyPacksInto(at, 'pack-grass')
    expect(silo.seeds.find(st => st.crop === 'grass')?.count).toBe(GRASS_PACK * 6)
  })
})
