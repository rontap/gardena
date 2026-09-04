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
  STATION_GRAFT_MAX,
  STATION_GRAFT_MIN,
  STATION_IN,
  STATION_SECONDS,
  STILL_CAP,
  STILL_SECONDS,
  STILL_WATER,
} from '../defs/items.ts'
import type { CropClass } from '../defs/crops.ts'
import { ratedVarieties, tierOf, VARIETIES, type Path, type VarietyId } from '../defs/varieties.ts'
import type { AnnualId, BarrelCrop, CropId, JamCrop, MillRecipe, SkuId, SpiritKind, StillCrop } from './ids.ts'
import {
  ANNUAL_IDS,
  BARREL_CROPS,
  CASK_OF,
  JAM_CROPS,
  MILL_RECIPES,
  SPIRIT_KINDS,
  STILL_CROPS,
  TREE_IDS,
} from './ids.ts'
import type { Barrel, CompostBox, Furnace, Grinder, JamMachine, Mill, PotStill, ResearchStation } from './building.ts'
import type { Face, Item } from './item.ts'
import {
  bakeCaskSale,
  bakeSpiritSale,
  barrelNeed,
  barrelWorking,
  feedUnits,
  feedVariety,
  grindProduct,
  jamSale,
  jamWorking,
  millNeed,
  millProduct,
  millWorking,
  spiritKind,
  stillReady,
  stillWorking,
} from './machine.ts'

export type MachineId = 'mill' | 'jam' | 'still' | 'barrel' | 'grinder' | 'compost-box' | 'furnace' | 'station'

export const MACHINE_IDS: readonly MachineId[] = [
  'mill',
  'jam',
  'still',
  'barrel',
  'grinder',
  'compost-box',
  'furnace',
  'station',
]

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

export type CraftCell = Mill | JamMachine | PotStill | Barrel | Grinder | CompostBox | Furnace | ResearchStation

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
  if (id === 'buy-research-station') return 'station'
  return undefined
}

function amountOf(item: Item): Amount {
  if ('liters' in item) return { kind: 'liters', l: item.liters }
  if ('count' in item) return { kind: 'units', n: item.count }
  return { kind: 'units', n: 1 }
}

function fruitFace(crop: CropId, variety: VarietyId): Face {
  return { kind: 'fruit', crop, variety, quality: 0, count: 1, unitSale: 0, freshness: 1, bio: false, cut: false }
}

function baseFruit(crop: CropId): Face {
  return fruitFace(crop, 'base')
}

function seedFace(crop: AnnualId, variety: VarietyId): Face {
  return { kind: 'seeds', crop, variety, quality: 0, count: 1 }
}

export type Pin<C> = { crop: C; variety: VarietyId }

function pins<C extends CropId>(crops: readonly C[], path: Path): readonly Pin<C>[] {
  return crops.flatMap(crop => ratedVarieties(crop, path).map(variety => ({ crop, variety })))
}

function units(n: number): Amount {
  return { kind: 'units', n }
}

const WATER: Ingredient = { kind: 'one', face: { kind: 'water' }, amount: { kind: 'liters', l: STILL_WATER } }

export type MillPin = { recipe: MillRecipe; variety: VarietyId }

export const MILL_PINS: readonly MillPin[] = MILL_RECIPES.flatMap((recipe): MillPin[] =>
  recipe === 'grass' ? [{ recipe, variety: 'base' }] : ratedVarieties(recipe, 'preserve').map(variety => ({ recipe, variety })),
)

function millRecipe(pin: MillPin): Recipe {
  const face: Face = pin.recipe === 'grass' ? { kind: 'grass', count: 1 } : fruitFace(pin.recipe, pin.variety)
  const out = millProduct(pin.recipe, pin.variety, 0)
  return {
    machine: 'mill',
    inputs: [{ kind: 'one', face, amount: units(millNeed(pin.recipe)) }],
    out: { kind: 'exact', face: out, amount: amountOf(out) },
    duration: { kind: 'work', seconds: MILL_WORK },
  }
}

function jamRecipe({ crop, variety }: Pin<JamCrop>): Recipe {
  return {
    machine: 'jam',
    inputs: [
      { kind: 'one', face: fruitFace(crop, variety), amount: units(JAM_IN) },
      {
        kind: 'one',
        face: { kind: 'sugar', liters: JAM_SUGAR, capacityLiters: JAM_SUGAR, unitSale: 0, quality: 0 },
        amount: { kind: 'liters', l: JAM_SUGAR },
      },
    ],
    out: {
      kind: 'exact',
      face: { kind: 'jam', crop, variety, quality: 0, count: 1, unitSale: jamSale(crop, variety, 0) },
      amount: units(1),
    },
    duration: { kind: 'work', seconds: JAM_SECONDS },
  }
}

function spiritFace(spirit: SpiritKind, variety: VarietyId): Face {
  return { kind: 'spirit', spirit, variety, quality: 0, count: 1, unitSale: bakeSpiritSale(spirit, variety, 0) }
}

function stillRecipe({ crop, variety }: Pin<StillCrop>): Recipe {
  const spirit = spiritKind([{ crop, variety, count: STILL_CAP }])
  return {
    machine: 'still',
    inputs: [{ kind: 'one', face: fruitFace(crop, variety), amount: units(STILL_CAP) }, WATER],
    out: { kind: 'exact', face: spiritFace(spirit, variety), amount: units(1) },
    duration: { kind: 'fixed', seconds: STILL_SECONDS },
  }
}

const MIXED_STILL: Recipe = {
  machine: 'still',
  inputs: [{ kind: 'any', faces: STILL_CROPS.map(baseFruit), amount: units(STILL_CAP) }, WATER],
  out: { kind: 'exact', face: spiritFace('mixed', 'base'), amount: units(1) },
  duration: { kind: 'fixed', seconds: STILL_SECONDS },
}

function barrelRecipe({ crop, variety }: Pin<BarrelCrop>): Recipe {
  return {
    machine: 'barrel',
    inputs: [{ kind: 'one', face: fruitFace(crop, variety), amount: units(barrelNeed(crop)) }],
    out: {
      kind: 'exact',
      face: {
        kind: 'cask',
        cask: CASK_OF[crop],
        variety,
        quality: 0,
        count: 1,
        unitSale: bakeCaskSale(CASK_OF[crop], variety, 0, BARREL_MATURE),
      },
      amount: units(1),
    },
    duration: { kind: 'age', seconds: BARREL_MATURE },
  }
}

export const GRIND_PINS: readonly Pin<CropId>[] = [...ANNUAL_IDS, ...TREE_IDS].flatMap(crop =>
  VARIETIES[crop].map(variety => ({ crop, variety })),
)

const GRINDER: Recipe = {
  machine: 'grinder',
  inputs: [{ kind: 'any', faces: GRIND_PINS.map(p => fruitFace(p.crop, p.variety)), amount: units(1) }],
  out: {
    kind: 'range',
    faces: GRIND_PINS.map(p => grindProduct({ crop: p.crop, variety: p.variety, quality: 0 }, 1)),
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
      faces: [...ANNUAL_IDS, ...TREE_IDS].map(baseFruit),
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
        ...ANNUAL_IDS.map(c => seedFace(c, 'base')),
        { kind: 'grass-seeds', count: 1 },
        ...TREE_IDS.map(t => ({ kind: 'tree-seed' as const, tree: t, variety: 'base' as const, quality: 0 })),
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
      faces: [...ANNUAL_IDS, ...TREE_IDS].map(baseFruit),
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
      face: { kind: 'sugar', liters: 1, capacityLiters: 1, unitSale: 0, quality: 0 },
      amount: { kind: 'liters', l: FURNACE_NEED / FURNACE_VALUE.fruit },
    },
  ],
  out: FURNACE_OUT,
  duration: { kind: 'fixed', seconds: FURNACE_SECONDS },
}

const FURNACE_OIL: Recipe = {
  machine: 'furnace',
  inputs: [{ kind: 'one', face: { kind: 'oil', quality: 0, count: 1, unitSale: 0 }, amount: units(FURNACE_NEED / FURNACE_VALUE.oil) }],
  out: FURNACE_OUT,
  duration: { kind: 'fixed', seconds: FURNACE_SECONDS },
}

const FURNACE_SPIRIT: Recipe = {
  machine: 'furnace',
  inputs: [
    {
      kind: 'any',
      faces: SPIRIT_KINDS.map(k => spiritFace(k, 'base')),
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

export const STATION_PINS: readonly Pin<CropId>[] = [...ANNUAL_IDS, ...TREE_IDS].flatMap(crop =>
  VARIETIES[crop].filter(v => tierOf(v) === 'heirloom').map(variety => ({ crop, variety })),
)

function stationRecipe({ crop, variety }: Pin<CropId>): Recipe {
  return {
    machine: 'station',
    inputs: [{ kind: 'one', face: fruitFace(crop, variety), amount: units(STATION_IN) }],
    out: {
      kind: 'range',
      faces: [{ kind: 'graft', crop, variety, quality: 0, count: 1 }],
      min: STATION_GRAFT_MIN,
      max: STATION_GRAFT_MAX,
    },
    duration: { kind: 'fixed', seconds: STATION_SECONDS },
  }
}

export const JAM_PINS: readonly Pin<JamCrop>[] = pins(JAM_CROPS, 'preserve')
export const STILL_PINS: readonly Pin<StillCrop>[] = pins(STILL_CROPS, 'alcohol')
export const BARREL_PINS: readonly Pin<BarrelCrop>[] = pins(BARREL_CROPS, 'alcohol')

const MILL_ROWS: readonly Recipe[] = MILL_PINS.map(millRecipe)
const JAM_ROWS: readonly Recipe[] = JAM_PINS.map(jamRecipe)
const STILL_ROWS: readonly Recipe[] = [...STILL_PINS.map(stillRecipe), MIXED_STILL]
const BARREL_ROWS: readonly Recipe[] = BARREL_PINS.map(barrelRecipe)
const FURNACE_ROWS: readonly Recipe[] = [FURNACE_GREEN, FURNACE_FRUIT, FURNACE_SUGAR, FURNACE_OIL, FURNACE_SPIRIT, FURNACE_WOOD]
const STATION_ROWS: readonly Recipe[] = STATION_PINS.map(stationRecipe)

export function recipesOf(m: MachineId): readonly Recipe[] {
  if (m === 'mill') return MILL_ROWS
  if (m === 'jam') return JAM_ROWS
  if (m === 'still') return STILL_ROWS
  if (m === 'barrel') return BARREL_ROWS
  if (m === 'grinder') return [GRINDER]
  if (m === 'furnace') return FURNACE_ROWS
  if (m === 'station') return STATION_ROWS
  return [COMPOST_FRUIT, COMPOST_GREEN, COMPOST_ROTTEN, COMPOST_ASH]
}

function sameIdentity(a: Face, b: Face): boolean {
  if (a.kind === 'fruit' && b.kind === 'fruit') return a.crop === b.crop && a.variety === b.variety
  if (a.kind === 'jam' && b.kind === 'jam') return a.crop === b.crop && a.variety === b.variety
  if (a.kind === 'seeds' && b.kind === 'seeds') return a.crop === b.crop && a.variety === b.variety
  if (a.kind === 'graft' && b.kind === 'graft') return a.crop === b.crop && a.variety === b.variety
  if (a.kind === 'spirit' && b.kind === 'spirit') {
    return a.spirit === b.spirit && (a.spirit === 'mixed' || a.variety === b.variety)
  }
  if (a.kind === 'cask' && b.kind === 'cask') return a.cask === b.cask && a.variety === b.variety
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
  const recipe = MILL_ROWS[MILL_PINS.findIndex(p => p.recipe === c.recipe && p.variety === c.variety)]
  if (c.inn === 1) return { kind: 'paused', recipe }
  if (millWorking(c)) return stage(recipe, c.progress, mul, haste)
  return { kind: 'filling', recipe, at: 0, have: c.units, need: millNeed(c.recipe) }
}

function jamCraft(c: JamMachine, mul: number, haste: number): Craft {
  if (c.crop === 'none') return { kind: 'idle', machine: 'jam' }
  const recipe = JAM_ROWS[JAM_PINS.findIndex(p => p.crop === c.crop && p.variety === c.variety)]
  if (c.inn === 1) return { kind: 'paused', recipe }
  if (jamWorking(c)) return stage(recipe, c.progress, mul, haste)
  if (c.fruit < JAM_IN) return { kind: 'filling', recipe, at: 0, have: c.fruit, need: JAM_IN }
  return { kind: 'filling', recipe, at: 1, have: c.sugar, need: JAM_SUGAR }
}

function stillCraft(c: PotStill, mul: number, haste: number): Craft {
  const n = feedUnits(c.feed)
  if (n === 0) return { kind: 'idle', machine: 'still' }
  const kind = spiritKind(c.feed)
  const recipe =
    kind === 'mixed'
      ? MIXED_STILL
      : STILL_ROWS[STILL_PINS.findIndex(p => p.crop === c.feed[0].crop && p.variety === c.feed[0].variety)]
  if (c.inn === 1) return { kind: 'paused', recipe }
  if (stillWorking(c)) return stage(recipe, c.progress, mul, haste)
  if (stillReady(c)) return { kind: 'thirsty', recipe }
  return { kind: 'filling', recipe, at: 0, have: n, need: STILL_CAP }
}

function barrelCraft(c: Barrel): Craft {
  if (c.crop === 'none') return { kind: 'idle', machine: 'barrel' }
  const variety = feedVariety(c.feed)
  const recipe = BARREL_ROWS[BARREL_PINS.findIndex(p => p.crop === c.crop && p.variety === variety)]
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
    inputs: [{ kind: 'one', face: fruitFace(c.crop, c.variety), amount: units(1) }],
    out: {
      kind: 'range',
      faces: [grindProduct(c, 1)],
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

function stationCraft(c: ResearchStation, haste: number): Craft {
  if (c.crop === 'none') return { kind: 'idle', machine: 'station' }
  const recipe = STATION_ROWS[STATION_PINS.findIndex(p => p.crop === c.crop && p.variety === c.variety)]
  if (c.inn === 1) return { kind: 'paused', recipe }
  if (c.progress >= 1) return { kind: 'ready', recipe }
  if (c.units < STATION_IN) return { kind: 'filling', recipe, at: 0, have: c.units, need: STATION_IN }
  return stage(recipe, c.progress, 1, haste)
}

export function craftState(cell: CraftCell, mul: number, haste = 1): Craft {
  if (cell.kind === 'mill') return millCraft(cell, mul, haste)
  if (cell.kind === 'jam') return jamCraft(cell, mul, haste)
  if (cell.kind === 'still') return stillCraft(cell, mul, haste)
  if (cell.kind === 'barrel') return barrelCraft(cell)
  if (cell.kind === 'grinder') return grinderCraft(cell, mul, haste)
  if (cell.kind === 'furnace') return furnaceCraft(cell, mul, haste)
  if (cell.kind === 'station') return stationCraft(cell, 1)
  return compostCraft(cell, mul, haste)
}

export function craftMachine(craft: Craft): MachineId {
  return craft.kind === 'idle' ? craft.machine : craft.recipe.machine
}
