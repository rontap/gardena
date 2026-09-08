import { describe, expect, test } from 'vitest'
import { CROPS } from '../defs/crops.ts'
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
  MILL_VANILLA_IN,
  MILL_VANILLA_OUT,
  MILL_W,
  MILL_H,
  MILL_WORK,
} from '../defs/items.ts'
import { RESEARCH, SKUS } from '../defs/research.ts'
import { SKILLS } from '../defs/skills.ts'
import { qualityMul, VARIETIES } from '../defs/varieties.ts'
import { millNeed, millProduct, millRecipeOf } from './feature-machines/machine.ts'
import { machineOfSku, recipesOf } from './feature-machines/recipe.ts'
import { ANNUAL_IDS, MILL_RECIPES, packSku } from './ids.ts'
import { skuItem, stackable, type Item } from './item.ts'
import { millProductName } from './prompt.ts'
import { STALL_IDS } from './stall.ts'
import { catalogEntries } from '../defs/catalog.ts'
import { CONCEPT_IDS } from '../ui/almanac.tsx'
import { itemInner, OVERLAY_INFUSED } from '../view/svgs.ts'

const ASSETS = import.meta.glob('../../assets/**/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>
import { Furnace, Infuser, Mill, occupiedCells, PAD } from './building.ts'
import { dump, parse } from './feature-save/save.ts'
import { Accepts, mul, paid, SAT_DEPTH, REP_DONE, REP_MAX } from './feature-contracts/market.ts'
import type { Demand } from './feature-contracts/market.h.ts'
import { DT_MAX, World } from './world.ts'

describe('infusion.chilli', () => {
  test("`AnnualId` includes `chilli`. No `unlock-chilli`. `pack-chilli` `PACK_N` at 10, show and buy `unlock-infusion`, `'base'` quality 0. `growSeconds` 190, slower than potato, faster than vanilla. `rotSeconds` longer than potato. One Variety `'base'`. No `better-chilli`.", () => {
    expect(ANNUAL_IDS).toContain('chilli')
    expect(CROPS.chilli.cls).toBe('fruit')
    expect(VARIETIES.chilli).toEqual(['base'])
    expect(Object.keys(RESEARCH).includes('unlock-chilli')).toBe(false)
    expect('better-chilli' in SKILLS).toBe(false)
    expect(packSku('chilli')).toBe('pack-chilli')
    expect(SKUS['pack-chilli']).toMatchObject({
      price: 10,
      unlock: 'unlock-infusion',
      show: 'unlock-infusion',
    })
    expect(skuItem('pack-chilli')).toEqual({ kind: 'seeds', crop: 'chilli', variety: 'base', quality: 0, count: 5 })
    expect(CROPS.chilli.growSeconds).toBe(190)
    expect(CROPS.chilli.growSeconds).toBeLessThan(CROPS.vanilla.growSeconds)
    expect(CROPS.chilli.growSeconds).toBeGreaterThan(CROPS.potato.growSeconds)
    expect(CROPS.chilli.rotSeconds).toBeGreaterThan(CROPS.potato.rotSeconds)
  })
})

describe('infusion.item', () => {
  test('`infused: boolean` required on jam, cask, spirit, oil. Machine output `false`. Infuser output `true`. Oil is infusable. Illegal: optional `infused`. `infused` is in the stack identity key.', () => {
    const jam: Item = {
      kind: 'jam',
      crop: 'grape',
      variety: 'base',
      quality: 0,
      count: 1,
      unitSale: 1,
      infused: false,
    }
    const jamInfused: Item = { ...jam, infused: true }
    expect(stackable(jam, jam)).toBe(true)
    expect(stackable(jam, jamInfused)).toBe(false)
    const oil: Item = { kind: 'oil', quality: 0, count: 1, unitSale: 1, infused: false }
    const oilInfused: Item = { ...oil, infused: true }
    expect(stackable(oil, oil)).toBe(true)
    expect(stackable(oil, oilInfused)).toBe(false)
    const cask: Item = {
      kind: 'cask',
      cask: 'wine',
      variety: 'base',
      quality: 0,
      count: 1,
      unitSale: 1,
      infused: false,
    }
    expect(stackable(cask, { ...cask, infused: true })).toBe(false)
    const spirit: Item = {
      kind: 'spirit',
      spirit: 'vodka',
      variety: 'base',
      quality: 0,
      count: 1,
      unitSale: 1,
      infused: false,
    }
    expect(stackable(spirit, { ...spirit, infused: true })).toBe(false)
    expect(millProduct('olive', 'base', 0)).toMatchObject({ kind: 'oil', infused: false })
  })
})

describe('infusion.extract', () => {
  test("Vanilla mill `MILL_VANILLA_IN` 1 → `{ kind: 'vanilla-extract' }` count `MILL_VANILLA_OUT` 4. Not `{ kind: 'extract' }`. Grass mill stays stall `'extract'`. Flakes and vanilla-extract are not `StallGoodId`. Illegal: `unitSale` on either.", () => {
    expect(MILL_VANILLA_IN).toBe(1)
    expect(MILL_VANILLA_OUT).toBe(4)
    expect(MILL_CHILLI_IN).toBe(3)
    expect(MILL_CHILLI_OUT).toBe(2)
    expect(INFUSE_IN).toBe(1)
    expect(INFUSE_FLAKES).toBe(1)
    expect(INFUSE_EXTRACT).toBe(1)
    expect(INFUSE_SECONDS).toBe(90)
    expect(MILL_RECIPES).toEqual(['sugar-cane', 'olive', 'wheat', 'grass', 'vanilla', 'chilli'])
    expect(millNeed('vanilla')).toBe(MILL_VANILLA_IN)
    expect(millNeed('chilli')).toBe(MILL_CHILLI_IN)
    const vanilla = millProduct('vanilla', 'base', 0)
    expect(vanilla).toEqual({ kind: 'vanilla-extract', quality: 0, count: MILL_VANILLA_OUT })
    expect('unitSale' in vanilla).toBe(false)
    const flakes = millProduct('chilli', 'base', 0)
    expect(flakes).toEqual({ kind: 'flakes', quality: 0, count: MILL_CHILLI_OUT })
    expect('unitSale' in flakes).toBe(false)
    expect(millProduct('grass', 'base', 0)).toMatchObject({ kind: 'extract' })
    expect(STALL_IDS.includes('extract')).toBe(true)
    expect((STALL_IDS as readonly string[]).includes('flakes')).toBe(false)
    expect((STALL_IDS as readonly string[]).includes('vanilla-extract')).toBe(false)
  })
})

function ticks(w: World, seconds: number): void {
  const n = Math.ceil(seconds / DT_MAX) + 1
  for (let i = 0; i < n; i++) w.tick(DT_MAX)
}

function drain(w: World): void {
  for (let i = 0; i < 60 && w.seats[0].queue.length > 0; i++) w.tick(DT_MAX)
}

const AT = { col: 10, row: 12 }

describe('machines.mill-vanilla', () => {
  test("Mill recipe `'vanilla'`: `MILL_VANILLA_IN` 1 vanilla fruit → `{ kind: 'vanilla-extract'; quality }` count `MILL_VANILLA_OUT` 4. Not stall `'extract'`. `millProductName('vanilla')` is `vanilla extract`. Grass mill stays `{ kind: 'extract' }` stall `'extract'`, quality 0. `MILL_RECIPES` order sugar-cane olive wheat grass vanilla chilli. Almanac vanilla-extract plate is Ingredients via `recipesUsing`, not a fruit-row plate.", () => {
    expect(millNeed('vanilla')).toBe(MILL_VANILLA_IN)
    expect(millProductName('vanilla').toLowerCase()).toContain('vanilla extract')
    expect(millRecipeOf({ kind: 'fruit', crop: 'vanilla', variety: 'base', quality: 0.5, count: 1, unitSale: 1, freshness: 1, bio: true, cut: false })).toBe(
      'vanilla',
    )
    const w = new World(1)
    const mill = new Mill({ shape: 'rect', col: AT.col, row: AT.row, w: MILL_W, h: MILL_H })
    occupiedCells(mill.base, w.owned).forEach(p => w.setCell(p, mill))
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    w.seats[0].hand = {
      kind: 'hold',
      item: {
        kind: 'fruit',
        crop: 'vanilla',
        variety: 'base',
        quality: 0.5,
        count: MILL_VANILLA_IN,
        unitSale: 1,
        freshness: 1,
        bio: true,
        cut: false,
      },
    }
    w.enqueue({ act: 'mill', at: AT })
    drain(w)
    expect(mill.recipe).toBe('vanilla')
    expect(mill.units).toBe(MILL_VANILLA_IN)
    ticks(w, MILL_WORK)
    expect(mill.units).toBe(0)
    const drop = w.drops.find(d => d.item.kind === 'vanilla-extract')
    expect(drop?.item).toEqual({ kind: 'vanilla-extract', quality: 0.5, count: MILL_VANILLA_OUT })
    expect(drop && 'unitSale' in drop.item).toBe(false)
  })
})

describe('machines.mill-chilli', () => {
  test("Mill recipe `'chilli'`: `MILL_CHILLI_IN` 3 chilli fruit → `{ kind: 'flakes'; quality }` count `MILL_CHILLI_OUT` 2. Not stall. `millProductName('chilli')` is `flakes`.", () => {
    expect(millNeed('chilli')).toBe(MILL_CHILLI_IN)
    expect(millProductName('chilli').toLowerCase()).toContain('flakes')
    expect(millRecipeOf({ kind: 'fruit', crop: 'chilli', variety: 'base', quality: 0.25, count: 3, unitSale: 1, freshness: 1, bio: true, cut: false })).toBe(
      'chilli',
    )
    const w = new World(1)
    const mill = new Mill({ shape: 'rect', col: AT.col, row: AT.row, w: MILL_W, h: MILL_H })
    occupiedCells(mill.base, w.owned).forEach(p => w.setCell(p, mill))
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    w.seats[0].hand = {
      kind: 'hold',
      item: {
        kind: 'fruit',
        crop: 'chilli',
        variety: 'base',
        quality: 0.25,
        count: MILL_CHILLI_IN,
        unitSale: 1,
        freshness: 1,
        bio: true,
        cut: false,
      },
    }
    w.enqueue({ act: 'mill', at: AT })
    drain(w)
    expect(mill.recipe).toBe('chilli')
    ticks(w, MILL_WORK)
    const drop = w.drops.find(d => d.item.kind === 'flakes')
    expect(drop?.item).toEqual({ kind: 'flakes', quality: 0.25, count: MILL_CHILLI_OUT })
    expect(drop && 'unitSale' in drop.item).toBe(false)
  })
})

describe('infusion.overlay', () => {
  test('Infused face is the plain face plus one `overlay-infused.svg`. No per-product infused SVG. Almanac: one Game concepts Infusion page, not a pane per infused good.', () => {
    const jam: Item = {
      kind: 'jam',
      crop: 'grape',
      variety: 'base',
      quality: 0,
      count: 1,
      unitSale: 1,
      infused: false,
    }
    expect(itemInner({ ...jam, infused: true })).toBe(`${itemInner(jam)}${OVERLAY_INFUSED}`)
    expect(itemInner(jam).includes(OVERLAY_INFUSED)).toBe(false)
    expect(Object.keys(ASSETS).filter(f => f.includes('infused'))).toEqual(['../../assets/overlay-infused.svg'])
    expect(catalogEntries().some(e => e.id === 'infusion')).toBe(false)
    expect(catalogEntries().some(e => e.id.startsWith('infused-'))).toBe(false)
    expect(CONCEPT_IDS.filter(id => id === 'infusion')).toEqual(['infusion'])
  })
})

describe('infusion.machine', () => {
  test('Infuser 2×2 `Machine`, `MILL_W` × `MILL_H`, `INFUSE_SECONDS` 90 `fixed`, mill I/O, pads, `inn`. `furnaceMul` applies. Not machinery. Not `work`. Not `machineMul`. Need `INFUSE_IN` good + 1 reagent: `INFUSE_FLAKES` flakes or `INFUSE_EXTRACT` vanilla-extract, not both. Same `infused: true` either way. Output same good, quality and `unitSale` unchanged. Refuses `infused === true`. `MachineId` += `infuser`.', () => {
    expect(INFUSE_SECONDS).toBe(90)
    expect(machineOfSku('buy-infuser')).toBe('infuser')
    expect(recipesOf('infuser').length).toBe(4)
    expect(recipesOf('infuser').every(r => r.duration.kind === 'fixed' && r.duration.seconds === INFUSE_SECONDS)).toBe(true)
    const w = new World(1)
    const inf = new Infuser({ shape: 'rect', col: AT.col, row: AT.row, w: MILL_W, h: MILL_H })
    expect(inf.base.w).toBe(MILL_W)
    expect(inf.base.h).toBe(MILL_H)
    expect([...inf.ports]).toEqual(['in'])
    expect(inf.pads).toBe('both')
    expect(inf.hasted).toBe(true)
    expect(inf.ticks).toBe(true)
    occupiedCells(inf.base, w.owned).forEach(p => w.setCell(p, inf))
    expect(w.cell({ col: AT.col + 1, row: AT.row + 1 })).toBe(inf)
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    const jam: Item = {
      kind: 'jam',
      crop: 'grape',
      variety: 'base',
      quality: 0.4,
      count: 1,
      unitSale: 72,
      infused: false,
    }
    w.seats[0].hand = { kind: 'hold', item: jam }
    w.enqueue({ act: 'infuse', at: AT })
    drain(w)
    expect(inf.lock).toEqual({ kind: 'jam', crop: 'grape', variety: 'base' })
    expect(inf.units).toBe(INFUSE_IN)
    w.seats[0].hand = { kind: 'hold', item: { ...jam, infused: true } }
    w.enqueue({ act: 'infuse', at: AT })
    drain(w)
    expect(inf.units).toBe(INFUSE_IN)
    w.seats[0].hand = { kind: 'hold', item: { kind: 'flakes', quality: 1, count: INFUSE_FLAKES } }
    w.enqueue({ act: 'infuse', at: AT })
    drain(w)
    expect(inf.flakes).toBe(INFUSE_FLAKES)
    const p0 = inf.progress
    w.tick(DT_MAX)
    expect(inf.progress - p0).toBeCloseTo(DT_MAX / INFUSE_SECONDS)
    ticks(w, INFUSE_SECONDS)
    expect(inf.units).toBe(0)
    expect(inf.lock).toBe('none')
    const out = w.drops.find(d => d.item.kind === 'jam')
    expect(out?.item).toMatchObject({ kind: 'jam', crop: 'grape', variety: 'base', quality: 0.4, unitSale: 72, infused: true, count: 1 })
    const oil: Item = { kind: 'oil', quality: 0.2, count: 1, unitSale: 96, infused: false }
    w.seats[0].hand = { kind: 'hold', item: oil }
    w.enqueue({ act: 'infuse', at: AT })
    drain(w)
    w.seats[0].hand = { kind: 'hold', item: { kind: 'vanilla-extract', quality: 1, count: INFUSE_EXTRACT } }
    w.enqueue({ act: 'infuse', at: AT })
    drain(w)
    ticks(w, INFUSE_SECONDS)
    const oilOut = w.drops.find(d => d.item.kind === 'oil' && d.item.infused)
    expect(oilOut?.item).toMatchObject({ kind: 'oil', quality: 0.2, unitSale: 96, infused: true })
  })
})

describe('infusion.furnace', () => {
  test("Furnace locks `'ash' | 'bread'`. Flour is bread. Ash feedstock is ash. No mix. Bread `{ kind: 'bread' }` is a stall good. Not infusable.", () => {
    expect(FURNACE_BREAD_IN).toBe(1)
    const w = new World(1)
    const at = { col: AT.col, row: AT.row + 4 }
    const f = new Furnace({ shape: 'rect', col: at.col, row: at.row, w: 1, h: 2 })
    w.setCell(at, f)
    w.setCell({ col: at.col, row: at.row + 1 }, f)
    w.seats[0].actor.x = at.col + 0.5
    w.seats[0].actor.y = at.row + 0.5
    w.seats[0].hand = { kind: 'hold', item: { kind: 'flour', quality: 0.5, count: FURNACE_BREAD_IN, unitSale: 72 } }
    w.enqueue({ act: 'furnace', at })
    drain(w)
    expect(f.recipe).toBe('bread')
    expect(f.units).toBe(FURNACE_BREAD_IN)
    w.seats[0].hand = { kind: 'hold', item: { kind: 'wood', count: 1 } }
    w.enqueue({ act: 'furnace', at })
    drain(w)
    expect(f.recipe).toBe('bread')
    expect(f.units).toBe(FURNACE_BREAD_IN)
    ticks(w, FURNACE_SECONDS)
    expect(f.recipe).toBe('none')
    const loaf = w.drops.find(d => d.item.kind === 'bread')
    expect(loaf?.item).toEqual({ kind: 'bread', quality: 0.5, count: 1, unitSale: BREAD * qualityMul(0.5) })
    w.seats[0].hand = { kind: 'hold', item: { kind: 'wood', count: 1 } }
    w.enqueue({ act: 'furnace', at })
    drain(w)
    expect(f.recipe).toBe('ash')
    w.seats[0].hand = { kind: 'hold', item: { kind: 'flour', quality: 0, count: 1, unitSale: 72 } }
    w.enqueue({ act: 'furnace', at })
    drain(w)
    expect(f.recipe).toBe('ash')
  })
})

describe('infusion.stall', () => {
  test('Infused clean `V_inf` pays `V_inf × mul(sat, good)` and does not raise `sat`. Plain trapezoid still raises `sat`. Infused samples sat at the start of that good.', () => {
    const w = new World(1)
    w.stall.oil.takeSpirit('base', 2, 100, false)
    w.stall.oil.takeSpirit('base', 3, 100, true)
    w.stall.oil.sat = 0.4
    const plainV = 200
    const infV = 300
    expect(w.marketGain()).toBeCloseTo(paid(0.4, 'oil', plainV) + infV * mul(0.4, 'oil'), 9)
    w.sellAll()
    expect(w.stall.oil.sat).toBeCloseTo(Math.min(1, 0.4 + plainV / SAT_DEPTH), 9)
    expect(w.stall.oil.sat).not.toBeCloseTo(Math.min(1, 0.4 + (plainV + infV) / SAT_DEPTH), 9)

    const inf = new Infuser({ shape: 'rect', col: AT.col, row: AT.row, w: MILL_W, h: MILL_H })
    occupiedCells(inf.base, w.owned).forEach(p => w.setCell(p, inf))
    inf.lock = { kind: 'oil' }
    inf.quality = 0.3
    inf.unitSale = 96
    inf.units = 1
    inf.flakes = 2
    inf.extract = 1
    inf.progress = 0.4
    inf.inn = 1
    const furnaceAt = { col: AT.col, row: AT.row + 4 }
    const f = new Furnace({ shape: 'rect', col: furnaceAt.col, row: furnaceAt.row, w: 1, h: 2 })
    w.setCell(furnaceAt, f)
    w.setCell({ col: furnaceAt.col, row: furnaceAt.row + 1 }, f)
    f.recipe = 'bread'
    f.quality = 0.5
    f.units = 1
    w.seats[0].hand = { kind: 'hold', item: { kind: 'flakes', quality: 0.2, count: 2 } }
    w.seats[0].inventory[0] = { kind: 'hold', item: { kind: 'vanilla-extract', quality: 0.1, count: 4 } }
    w.seats[0].inventory[1] = { kind: 'hold', item: { kind: 'bread', quality: 0.5, count: 1, unitSale: 108 } }
    w.seats[0].inventory[2] = {
      kind: 'hold',
      item: { kind: 'jam', crop: 'grape', variety: 'base', quality: 0, count: 1, unitSale: 72, infused: true },
    }
    w.stall['jam-grape'].takeSpirit('base', 1, 72, true)
    const s = dump(w)
    const loaded = parse(JSON.stringify(s))
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    const back = loaded.world.cell(AT)
    expect(back.kind).toBe('infuser')
    if (back.kind !== 'infuser') return
    expect(back.lock).toEqual({ kind: 'oil' })
    expect(back.quality).toBe(0.3)
    expect(back.unitSale).toBe(96)
    expect(back.units).toBe(1)
    expect(back.flakes).toBe(2)
    expect(back.extract).toBe(1)
    expect(back.progress).toBe(0.4)
    expect(back.inn).toBe(1)
    const fb = loaded.world.cell(furnaceAt)
    expect(fb.kind).toBe('furnace')
    if (fb.kind !== 'furnace') return
    expect(fb.recipe).toBe('bread')
    expect(fb.quality).toBe(0.5)
    expect(fb.units).toBe(1)
    expect(loaded.world.seats[0].hand).toEqual({ kind: 'hold', item: { kind: 'flakes', quality: 0.2, count: 2 } })
    expect(loaded.world.seats[0].inventory[0]).toEqual({ kind: 'hold', item: { kind: 'vanilla-extract', quality: 0.1, count: 4 } })
    expect(loaded.world.seats[0].inventory[1]).toEqual({ kind: 'hold', item: { kind: 'bread', quality: 0.5, count: 1, unitSale: 108 } })
    expect(loaded.world.seats[0].inventory[2]).toEqual({
      kind: 'hold',
      item: { kind: 'jam', crop: 'grape', variety: 'base', quality: 0, count: 1, unitSale: 72, infused: true },
    })
    expect(loaded.world.stall['jam-grape'].worth.base.synth).toBe(72)

    const stripped = JSON.parse(JSON.stringify(s)) as {
      seats: { hand: { kind: string; item: Record<string, unknown> }; inventory: { kind: string; item?: Record<string, unknown> }[] }[]
      chunks: { cells: { kind: string; recipe?: string; units?: number }[][] }[]
    }
    stripped.seats[0].inventory[2] = {
      kind: 'hold',
      item: { kind: 'jam', crop: 'grape', variety: 'base', quality: 0, count: 1, unitSale: 72 },
    }
    const rawFurnace = stripped.chunks[0].cells.flat().find(c => c.kind === 'furnace')
    if (rawFurnace !== undefined) delete rawFurnace.recipe
    const missing = parse(JSON.stringify(stripped))
    expect(missing.ok).toBe(true)
    if (!missing.ok) return
    const jam = missing.world.seats[0].inventory[2]
    expect(jam.kind).toBe('hold')
    if (jam.kind !== 'hold') return
    expect(jam.item.kind).toBe('jam')
    if (jam.item.kind !== 'jam') return
    expect(jam.item.infused).toBe(false)
    const fMissing = missing.world.cell(furnaceAt)
    expect(fMissing.kind).toBe('furnace')
    if (fMissing.kind !== 'furnace') return
    expect(fMissing.recipe).toBe('ash')
    const millRaw = JSON.parse(JSON.stringify(s)) as {
      chunks: { cells: { kind: string; recipe?: string; units?: number }[][] }[]
    }
    millRaw.chunks[0].cells.flat().forEach(c => {
      if (c.kind === 'furnace') {
        delete c.recipe
        c.units = 0
      }
    })
    const noneHydrate = parse(JSON.stringify(millRaw))
    expect(noneHydrate.ok).toBe(true)
    if (!noneHydrate.ok) return
    const fNone = noneHydrate.world.cell(furnaceAt)
    expect(fNone.kind).toBe('furnace')
    if (fNone.kind !== 'furnace') return
    expect(fNone.recipe).toBe('none')
    expect((STALL_IDS as readonly string[]).includes('bread')).toBe(true)
    expect((STALL_IDS as readonly string[]).includes('flakes')).toBe(false)
  })
})

describe('infusion.rep', () => {
  test('Complete: `REP_DONE[stars] × (1 + 0.25 × infusedFilled / amount)`, clamp `[0, REP_MAX]`. Miss and cancel do not.', () => {
    const demand: Demand = { kind: 'plain', good: 'jam-grape', amount: 4 }
    const offer = {
      id: 0,
      slot: 0,
      company: 'whole-cart' as const,
      difficulty: 1,
      stars: 1 as const,
      band: 'long' as const,
      days: 4,
      lines: [demand] as const,
      prize: { kind: 'cash' } as const,
      clean: 4,
      markup: 0.2,
      reward: 5,
      penalty: 1,
    }
    const jam = (n: number, infused: boolean) => ({
      kind: 'jam' as const,
      crop: 'grape' as const,
      variety: 'base' as const,
      quality: 0,
      count: n,
      unitSale: 72,
      infused,
    })
    const drop = (world: World, n: number, infused: boolean) => {
      world.seats[0].actor.x = PAD.col + 0.5
      world.seats[0].actor.y = PAD.row + 0.5
      world.seats[0].hand = { kind: 'hold', item: jam(n, infused) }
      world.enqueue({ act: 'consign' })
      world.tick(DT_MAX)
    }
    const done = new World(1)
    done.contracts.active.push({ offer, dueDay: 10, bins: [{ demand, filled: 0, infusedFilled: 0 }] })
    drop(done, 4, true)
    expect(done.contracts.active).toHaveLength(0)
    expect(done.contracts.rep).toBeCloseTo(REP_DONE[1] * (1 + 0.25 * 1), 9)

    const half = new World(1)
    half.contracts.active.push({ offer, dueDay: 10, bins: [{ demand, filled: 0, infusedFilled: 0 }] })
    drop(half, 2, true)
    drop(half, 2, false)
    expect(half.contracts.active).toHaveLength(0)
    expect(half.contracts.rep).toBeCloseTo(REP_DONE[1] * (1 + 0.25 * 0.5), 9)

    const prize = new World(1)
    prize.contracts.active.push({
      offer: { ...offer, prize: { kind: 'tree-seed', tree: 'cherry' } },
      dueDay: 10,
      bins: [{ demand, filled: 0, infusedFilled: 0 }],
    })
    drop(prize, 4, true)
    expect(prize.contracts.rep).toBeCloseTo(REP_DONE[1] * (1 + 0.25 * 1), 9)

    const miss = new World(1)
    miss.contracts.rep = 5
    miss.contracts.active.push({ offer, dueDay: 10, bins: [{ demand, filled: 0, infusedFilled: 0 }] })
    drop(miss, 2, true)
    expect(miss.contracts.active[0].bins[0].infusedFilled).toBe(2)
    miss.contracts.active[0].dueDay = miss.nowDay() + 1e-12
    miss.tick(DT_MAX)
    expect(miss.contracts.active).toHaveLength(0)
    expect(miss.contracts.rep).toBe(4)

    const cancel = new World(1)
    cancel.contracts.rep = 5
    cancel.contracts.active.push({ offer, dueDay: 10, bins: [{ demand, filled: 0, infusedFilled: 0 }] })
    drop(cancel, 2, true)
    cancel.cancelContract(0)
    expect(cancel.contracts.rep).toBe(4)

    const cap = new World(1)
    cap.contracts.rep = REP_MAX
    cap.contracts.active.push({ offer, dueDay: 10, bins: [{ demand, filled: 0, infusedFilled: 0 }] })
    drop(cap, 4, true)
    expect(cap.contracts.rep).toBe(REP_MAX)

    const mid = new World(1)
    mid.contracts.active.push({ offer, dueDay: 10, bins: [{ demand, filled: 0, infusedFilled: 0 }] })
    drop(mid, 2, true)
    expect(mid.contracts.active[0].bins[0].infusedFilled).toBe(2)
    const saved = dump(mid)
    expect(saved.contracts.active[0].bins[0].infusedFilled).toBe(2)
    const parsed = parse(JSON.stringify(saved))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.world.contracts.active[0].bins[0].infusedFilled).toBe(2)
    const raw = JSON.parse(JSON.stringify(saved)) as { contracts: { active: { bins: { filled: number; infusedFilled?: number }[] }[] } }
    delete raw.contracts.active[0].bins[0].infusedFilled
    const missing = parse(JSON.stringify(raw))
    expect(missing.ok).toBe(true)
    if (!missing.ok) return
    expect(missing.world.contracts.active[0].bins[0].infusedFilled).toBe(0)
    expect(Accepts({ kind: 'plain', good: 'jam-grape', amount: 1 }, 'jam-grape')).toBe(true)
  })
})
