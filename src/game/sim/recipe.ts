import { m } from '../../paraglide/messages.js'
import {
  BARREL_MATURE,
  COMPOST_LITERS,
  COMPOST_NEED,
  COMPOST_SECONDS,
  COMPOST_VALUE,
  FURNACE_ASH,
  FURNACE_NEED,
  FURNACE_SECONDS,
  FURNACE_VALUE,
  GRIND_MAX,
  GRIND_MIN,
  GRIND_WORK,
  JAM_IN,
  JAM_SECONDS,
  JAM_SUGAR,
  MILL_WORK,
  STILL_CAP,
  STILL_SECONDS,
  STILL_WATER,
} from '../defs/items.ts'
import type { CropClass } from '../defs/crops.ts'
import type { AnnualId, BarrelCrop, CropId, JamCrop, MillRecipe, SkuId, SpiritKind, StillCrop } from './ids.ts'
import { ANNUAL_IDS, BARREL_CROPS, CASK_OF, JAM_CROPS, MILL_RECIPES, SPIRIT_KINDS, STILL_CROPS, TREE_IDS } from './ids.ts'
import type { Barrel, CompostBox, Furnace, Grinder, JamMachine, Mill, PotStill } from './building.ts'
import type { Face, Item } from './item.ts'
import {
  bakeCaskSale,
  bakeSpiritSale,
  barrelNeed,
  barrelWorking,
  feedUnits,
  jamSale,
  jamWorking,
  millNeed,
  millProduct,
  millWorking,
  spiritKind,
  stillReady,
  stillWorking,
} from './machine.ts'

export type MachineId = 'mill' | 'jam' | 'still' | 'barrel' | 'grinder' | 'compost-box' | 'furnace'

export const MACHINE_IDS: readonly MachineId[] = ['mill', 'jam', 'still', 'barrel', 'grinder', 'compost-box', 'furnace']

export type Amount = { kind: 'units'; n: number } | { kind: 'liters'; l: number } | { kind: 'waste'; n: number }

export type Ingredient =
  | { kind: 'one'; face: Face; amount: Amount }
  | { kind: 'any'; faces: readonly Face[]; amount: Amount }

export type Yield =
  | { kind: 'exact'; face: Face; amount: Amount }
  | { kind: 'range'; faces: readonly Face[]; min: number; max: number }

export type Duration =
  | { kind: 'work'; seconds: number }
  | { kind: 'fixed'; seconds: number }
  | { kind: 'age'; seconds: number }

export type Recipe = {
  machine: MachineId
  inputs: readonly Ingredient[]
  out: Yield
  duration: Duration
}

export type Craft =
  | { kind: 'idle'; machine: MachineId }
  | { kind: 'filling'; recipe: Recipe; at: number; have: number; need: number }
  | { kind: 'paused'; recipe: Recipe }
  | { kind: 'thirsty'; recipe: Recipe }
  | { kind: 'working'; recipe: Recipe; progress: number; left: number }
  | { kind: 'ready'; recipe: Recipe }

export type CraftCell = Mill | JamMachine | PotStill | Barrel | Grinder | CompostBox | Furnace

export function isCraftCell(c: { kind: string }): c is CraftCell {
  return MACHINE_IDS.some(m => m === c.kind)
}

export function machineOfSku(id: SkuId): MachineId | undefined {
  if (id === 'buy-mill') return 'mill'
  if (id === 'buy-jam') return 'jam'
  if (id === 'buy-still') return 'still'
  if (id === 'buy-barrel') return 'barrel'
  if (id === 'buy-grinder') return 'grinder'
  if (id === 'buy-compost-box') return 'compost-box'
  if (id === 'buy-furnace') return 'furnace'
  return undefined
}

function amountOf(item: Item): Amount {
  if ('liters' in item) return { kind: 'liters', l: item.liters }
  if ('count' in item) return { kind: 'units', n: item.count }
  return { kind: 'units', n: 1 }
}

function fruitFace(crop: CropId): Face {
  return { kind: 'fruit', crop, rarity: 'common', count: 1, unitSale: 0, freshness: 1, bio: false }
}

function seedFace(crop: AnnualId): Face {
  return { kind: 'seeds', crop, rarity: 'common', count: 1 }
}

function units(n: number): Amount {
  return { kind: 'units', n }
}

const WATER: Ingredient = { kind: 'one', face: { kind: 'water' }, amount: { kind: 'liters', l: STILL_WATER } }

function millRecipe(r: MillRecipe): Recipe {
  const face: Face = r === 'grass' ? { kind: 'grass', count: 1 } : fruitFace(r)
  const out = millProduct(r)
  return {
    machine: 'mill',
    inputs: [{ kind: 'one', face, amount: units(millNeed(r)) }],
    out: { kind: 'exact', face: out, amount: amountOf(out) },
    duration: { kind: 'work', seconds: MILL_WORK },
  }
}

function jamRecipe(crop: JamCrop): Recipe {
  return {
    machine: 'jam',
    inputs: [
      { kind: 'one', face: fruitFace(crop), amount: units(JAM_IN) },
      {
        kind: 'one',
        face: { kind: 'sugar', liters: JAM_SUGAR, capacityLiters: JAM_SUGAR, unitSale: 0 },
        amount: { kind: 'liters', l: JAM_SUGAR },
      },
    ],
    out: { kind: 'exact', face: { kind: 'jam', crop, count: 1, unitSale: jamSale(crop) }, amount: units(1) },
    duration: { kind: 'work', seconds: JAM_SECONDS },
  }
}

function spiritFace(spirit: SpiritKind): Face {
  return { kind: 'spirit', spirit, rarity: 'common', count: 1, unitSale: bakeSpiritSale(spirit, 'common') }
}

function stillRecipe(crop: StillCrop): Recipe {
  return {
    machine: 'still',
    inputs: [{ kind: 'one', face: fruitFace(crop), amount: units(STILL_CAP) }, WATER],
    out: { kind: 'exact', face: spiritFace(spiritKind([{ crop, count: STILL_CAP }])), amount: units(1) },
    duration: { kind: 'fixed', seconds: STILL_SECONDS },
  }
}

const MIXED_STILL: Recipe = {
  machine: 'still',
  inputs: [{ kind: 'any', faces: STILL_CROPS.map(fruitFace), amount: units(STILL_CAP) }, WATER],
  out: { kind: 'exact', face: spiritFace('mixed'), amount: units(1) },
  duration: { kind: 'fixed', seconds: STILL_SECONDS },
}

function barrelRecipe(crop: BarrelCrop): Recipe {
  return {
    machine: 'barrel',
    inputs: [{ kind: 'one', face: fruitFace(crop), amount: units(barrelNeed(crop)) }],
    out: {
      kind: 'exact',
      face: {
        kind: 'cask',
        cask: CASK_OF[crop],
        rarity: 'common',
        count: 1,
        unitSale: bakeCaskSale(CASK_OF[crop], 'common', BARREL_MATURE),
      },
      amount: units(1),
    },
    duration: { kind: 'age', seconds: BARREL_MATURE },
  }
}

const GRINDER: Recipe = {
  machine: 'grinder',
  inputs: [{ kind: 'any', faces: ANNUAL_IDS.map(fruitFace), amount: units(1) }],
  out: {
    kind: 'range',
    faces: ANNUAL_IDS.map(seedFace),
    min: GRIND_MIN,
    max: GRIND_MAX,
  },
  duration: { kind: 'work', seconds: GRIND_WORK },
}

const COMPOST_OUT: Yield = {
  kind: 'exact',
  face: { kind: 'compost', liters: COMPOST_LITERS, capacityLiters: COMPOST_LITERS },
  amount: { kind: 'liters', l: COMPOST_LITERS },
}

const COMPOST_FRUIT: Recipe = {
  machine: 'compost-box',
  inputs: [
    {
      kind: 'any',
      faces: [...ANNUAL_IDS, ...TREE_IDS].map(fruitFace),
      amount: units(COMPOST_NEED / COMPOST_VALUE.fruit),
    },
  ],
  out: COMPOST_OUT,
  duration: { kind: 'fixed', seconds: COMPOST_SECONDS },
}

const COMPOST_GREEN: Recipe = {
  machine: 'compost-box',
  inputs: [
    {
      kind: 'any',
      faces: [
        { kind: 'weed', count: 1 },
        { kind: 'grass', count: 1 },
      ],
      amount: units(COMPOST_NEED / COMPOST_VALUE.weed),
    },
  ],
  out: COMPOST_OUT,
  duration: { kind: 'fixed', seconds: COMPOST_SECONDS },
}

const CROP_CLASSES: readonly CropClass[] = ['root', 'grain', 'fruit']

const COMPOST_ROTTEN: Recipe = {
  machine: 'compost-box',
  inputs: [
    {
      kind: 'any',
      faces: CROP_CLASSES.map(cls => ({ kind: 'rotten' as const, cls, count: 1 })),
      amount: units(COMPOST_NEED / COMPOST_VALUE.rotten),
    },
  ],
  out: COMPOST_OUT,
  duration: { kind: 'fixed', seconds: COMPOST_SECONDS },
}

const COMPOST_ASH: Recipe = {
  machine: 'compost-box',
  inputs: [{ kind: 'one', face: { kind: 'ash', count: 1 }, amount: units(COMPOST_NEED / COMPOST_VALUE.ash) }],
  out: COMPOST_OUT,
  duration: { kind: 'fixed', seconds: COMPOST_SECONDS },
}

const FURNACE_OUT: Yield = {
  kind: 'exact',
  face: { kind: 'ash', count: FURNACE_ASH },
  amount: units(FURNACE_ASH),
}

const FURNACE_GREEN: Recipe = {
  machine: 'furnace',
  inputs: [
    {
      kind: 'any',
      faces: [
        ...CROP_CLASSES.map(cls => ({ kind: 'rotten' as const, cls, count: 1 })),
        ...ANNUAL_IDS.map(seedFace),
        { kind: 'grass-seeds', count: 1 },
        ...TREE_IDS.map(t => ({ kind: 'tree-seed' as const, tree: t })),
        { kind: 'weed', count: 1 },
        { kind: 'grass', count: 1 },
        ...CROP_CLASSES.map(cls => ({ kind: 'dead' as const, cls, count: 1 })),
      ],
      amount: units(FURNACE_NEED / FURNACE_VALUE.green),
    },
  ],
  out: FURNACE_OUT,
  duration: { kind: 'fixed', seconds: FURNACE_SECONDS },
}

const FURNACE_FRUIT: Recipe = {
  machine: 'furnace',
  inputs: [
    {
      kind: 'any',
      faces: [...ANNUAL_IDS, ...TREE_IDS].map(fruitFace),
      amount: units(FURNACE_NEED / FURNACE_VALUE.fruit),
    },
  ],
  out: FURNACE_OUT,
  duration: { kind: 'fixed', seconds: FURNACE_SECONDS },
}

const FURNACE_SUGAR: Recipe = {
  machine: 'furnace',
  inputs: [
    {
      kind: 'one',
      face: { kind: 'sugar', liters: 1, capacityLiters: 1, unitSale: 0 },
      amount: { kind: 'liters', l: FURNACE_NEED / FURNACE_VALUE.fruit },
    },
  ],
  out: FURNACE_OUT,
  duration: { kind: 'fixed', seconds: FURNACE_SECONDS },
}

const FURNACE_OIL: Recipe = {
  machine: 'furnace',
  inputs: [{ kind: 'one', face: { kind: 'oil', count: 1, unitSale: 0 }, amount: units(FURNACE_NEED / FURNACE_VALUE.oil) }],
  out: FURNACE_OUT,
  duration: { kind: 'fixed', seconds: FURNACE_SECONDS },
}

const FURNACE_SPIRIT: Recipe = {
  machine: 'furnace',
  inputs: [
    {
      kind: 'any',
      faces: SPIRIT_KINDS.map(spiritFace),
      amount: units(FURNACE_NEED / FURNACE_VALUE.spirit),
    },
  ],
  out: FURNACE_OUT,
  duration: { kind: 'fixed', seconds: FURNACE_SECONDS },
}

const FURNACE_WOOD: Recipe = {
  machine: 'furnace',
  inputs: [{ kind: 'one', face: { kind: 'wood', count: 1 }, amount: units(FURNACE_NEED / FURNACE_VALUE.wood) }],
  out: FURNACE_OUT,
  duration: { kind: 'fixed', seconds: FURNACE_SECONDS },
}

const MILL_ROWS: readonly Recipe[] = MILL_RECIPES.map(millRecipe)
const JAM_ROWS: readonly Recipe[] = JAM_CROPS.map(jamRecipe)
const STILL_ROWS: readonly Recipe[] = [...STILL_CROPS.map(stillRecipe), MIXED_STILL]
const BARREL_ROWS: readonly Recipe[] = BARREL_CROPS.map(barrelRecipe)
const FURNACE_ROWS: readonly Recipe[] = [FURNACE_GREEN, FURNACE_FRUIT, FURNACE_SUGAR, FURNACE_OIL, FURNACE_SPIRIT, FURNACE_WOOD]

export function recipesOf(m: MachineId): readonly Recipe[] {
  if (m === 'mill') return MILL_ROWS
  if (m === 'jam') return JAM_ROWS
  if (m === 'still') return STILL_ROWS
  if (m === 'barrel') return BARREL_ROWS
  if (m === 'grinder') return [GRINDER]
  if (m === 'furnace') return FURNACE_ROWS
  return [COMPOST_FRUIT, COMPOST_GREEN, COMPOST_ROTTEN, COMPOST_ASH]
}

function sameIdentity(a: Face, b: Face): boolean {
  if (a.kind === 'fruit' && b.kind === 'fruit') return a.crop === b.crop
  if (a.kind === 'jam' && b.kind === 'jam') return a.crop === b.crop
  if (a.kind === 'seeds' && b.kind === 'seeds') return a.crop === b.crop
  if (a.kind === 'spirit' && b.kind === 'spirit') return a.spirit === b.spirit
  if (a.kind === 'cask' && b.kind === 'cask') return a.cask === b.cask
  return a.kind === b.kind
}

export function recipesUsing(face: Face): readonly Recipe[] {
  return MACHINE_IDS.flatMap(id =>
    recipesOf(id).filter(r => r.inputs.some(input => input.kind === 'one' && sameIdentity(input.face, face))),
  )
}

export function clockText(seconds: number): string {
  return m.hud_clock_sec({ secs: Math.round(seconds) })
}

function recipeSeconds(d: Duration, mul: number, haste: number): number {
  if (d.kind === 'work') return d.seconds / (mul * haste)
  if (d.kind === 'fixed') return d.seconds / haste
  return d.seconds
}

function stage(recipe: Recipe, progress: number, mul: number, haste: number): Craft {
  if (progress >= 1) return { kind: 'ready', recipe }
  return { kind: 'working', recipe, progress, left: (1 - progress) * recipeSeconds(recipe.duration, mul, haste) }
}

function millCraft(c: Mill, mul: number, haste: number): Craft {
  if (c.recipe === 'none') return { kind: 'idle', machine: 'mill' }
  const recipe = MILL_ROWS[MILL_RECIPES.indexOf(c.recipe)]
  if (c.inn === 1) return { kind: 'paused', recipe }
  if (millWorking(c)) return stage(recipe, c.progress, mul, haste)
  return { kind: 'filling', recipe, at: 0, have: c.units, need: millNeed(c.recipe) }
}

function jamCraft(c: JamMachine, mul: number, haste: number): Craft {
  if (c.crop === 'none') return { kind: 'idle', machine: 'jam' }
  const recipe = JAM_ROWS[JAM_CROPS.indexOf(c.crop)]
  if (c.inn === 1) return { kind: 'paused', recipe }
  if (jamWorking(c)) return stage(recipe, c.progress, mul, haste)
  if (c.fruit < JAM_IN) return { kind: 'filling', recipe, at: 0, have: c.fruit, need: JAM_IN }
  return { kind: 'filling', recipe, at: 1, have: c.sugar, need: JAM_SUGAR }
}

function stillCraft(c: PotStill, mul: number, haste: number): Craft {
  const n = feedUnits(c.feed)
  if (n === 0) return { kind: 'idle', machine: 'still' }
  const kind = spiritKind(c.feed)
  const recipe = kind === 'mixed' ? MIXED_STILL : STILL_ROWS[STILL_CROPS.indexOf(c.feed[0].crop)]
  if (c.inn === 1) return { kind: 'paused', recipe }
  if (stillWorking(c)) return stage(recipe, c.progress, mul, haste)
  if (stillReady(c)) return { kind: 'thirsty', recipe }
  return { kind: 'filling', recipe, at: 0, have: n, need: STILL_CAP }
}

function barrelCraft(c: Barrel): Craft {
  if (c.crop === 'none') return { kind: 'idle', machine: 'barrel' }
  const recipe = BARREL_ROWS[BARREL_CROPS.indexOf(c.crop)]
  const n = feedUnits(c.feed)
  const need = barrelNeed(c.crop)
  if (n < need) return { kind: 'filling', recipe, at: 0, have: n, need }
  if (!barrelWorking(c) || c.age >= BARREL_MATURE) return { kind: 'ready', recipe }
  return { kind: 'working', recipe, progress: c.age / BARREL_MATURE, left: BARREL_MATURE - c.age }
}

function grinderCraft(c: Grinder, mul: number, haste: number): Craft {
  if (c.crop === 'none') return { kind: 'idle', machine: 'grinder' }
  const recipe: Recipe = {
    ...GRINDER,
    inputs: [{ kind: 'one', face: fruitFace(c.crop), amount: units(1) }],
    out: {
      kind: 'range',
      faces: [{ kind: 'seeds', crop: c.crop, rarity: c.rarity, count: 1 }],
      min: GRIND_MIN,
      max: GRIND_MAX,
    },
  }
  if (c.units < 1) return { kind: 'filling', recipe, at: 0, have: c.units, need: 1 }
  return stage(recipe, c.progress, mul, haste)
}

function compostCraft(c: CompostBox, mul: number, haste: number): Craft {
  if (c.units === 0) return { kind: 'idle', machine: 'compost-box' }
  if (c.units < COMPOST_NEED) return { kind: 'filling', recipe: COMPOST_FRUIT, at: 0, have: c.units, need: COMPOST_NEED }
  return stage(COMPOST_FRUIT, c.progress, mul, haste)
}

function furnaceCraft(c: Furnace, mul: number, haste: number): Craft {
  if (c.units === 0) return { kind: 'idle', machine: 'furnace' }
  const recipe = FURNACE_ROWS[0]
  if (c.inn === 1) return { kind: 'paused', recipe }
  if (c.progress >= 1) return { kind: 'ready', recipe }
  if (c.units < FURNACE_NEED) return { kind: 'filling', recipe, at: 0, have: c.units, need: FURNACE_NEED }
  return stage(recipe, c.progress, mul, haste)
}

export function craftState(cell: CraftCell, mul: number, haste = 1): Craft {
  if (cell.kind === 'mill') return millCraft(cell, mul, haste)
  if (cell.kind === 'jam') return jamCraft(cell, mul, haste)
  if (cell.kind === 'still') return stillCraft(cell, mul, haste)
  if (cell.kind === 'barrel') return barrelCraft(cell)
  if (cell.kind === 'grinder') return grinderCraft(cell, mul, haste)
  if (cell.kind === 'furnace') return furnaceCraft(cell, mul, haste)
  return compostCraft(cell, mul, haste)
}

export function craftMachine(craft: Craft): MachineId {
  return craft.kind === 'idle' ? craft.machine : craft.recipe.machine
}
