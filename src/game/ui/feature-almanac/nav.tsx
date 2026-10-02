import { m } from '../../../paraglide/messages.js'
import { createContext, useContext, type ReactNode } from 'react'
import type { CatalogEntry } from '../../defs/catalog.ts'
import { SKILLS } from '../../defs/skills.ts'
import { AXES, CONTAINERS, PICKAXES, SHOVELS } from '../../defs/items.ts'
import { PLANT_CROPS, TREE_IDS, type GrownCrop, type SkuId } from '../../sim/ids.ts'
import type { Recipe } from '../../sim/feature-machines/recipe.ts'

export type AlmanacTab = 'fruits' | 'utility' | 'water' | 'machines' | 'vehicles' | 'sensors' | 'concepts' | 'misc'

export type ConceptId =
  | 'variety'
  | 'quality'
  | 'freshness'
  | 'happiness'
  | 'day'
  | 'market'
  | 'skills'
  | 'family'
  | 'research'
  | 'burrow'
  | 'mushrooms'
  | 'infusion'

export type AlmanacNav = { tab: AlmanacTab; id: string }

export type ListRow =
  | { kind: 'overview' }
  | { kind: 'concept'; id: ConceptId }
  | { kind: 'sku'; id: string }
  | { kind: 'forms'; id: string; title: () => string; ids: readonly string[] }
  | { kind: 'tools'; id: string; title: () => string; family: ToolFamily }

type ListItem = ListRow | { kind: 'heading'; label: () => string }

const overview: ListRow = { kind: 'overview' }
const heading = (label: () => string): ListItem => ({ kind: 'heading', label })
const sku = (id: string): ListRow => ({ kind: 'sku', id })
const concept = (id: ConceptId): ListRow => ({ kind: 'concept', id })
const forms = (title: () => string, ids: readonly string[]): ListRow => ({ kind: 'forms', id: ids[0], title, ids })
const tools = (title: () => string, family: ToolFamily): ListRow => ({
  kind: 'tools',
  id: toolIds(family)[0],
  title,
  family,
})

export type Price = { kind: 'sku'; sku: SkuId } | { kind: 'prize' }

export type ToolFamily =
  | { kind: 'work'; desc: () => string; tools: readonly { id: string; price: Price; uses: number; workSeconds: number }[] }
  | { kind: 'hold'; desc: () => string; tools: readonly { id: string; price: Price; liters: number }[] }

const sold = (sku: SkuId): Price => ({ kind: 'sku', sku })
const PRIZE: Price = { kind: 'prize' }

export function toolIds(family: ToolFamily): string[] {
  switch (family.kind) {
    case 'work':
      return family.tools.map(t => t.id)
    case 'hold':
      return family.tools.map(t => t.id)
  }
}

const SHOVEL_TOOLS: ToolFamily = {
  kind: 'work',
  desc: () => m.almanac_tool_shovel(),
  tools: [
    { id: 'shovel', price: sold('buy-shovel'), ...SHOVELS.shovel },
    { id: 'better-shovel', price: sold('buy-better-shovel'), ...SHOVELS['better-shovel'] },
    { id: 'rotary-shovel', price: PRIZE, ...SHOVELS['rotary-shovel'] },
  ],
}

const PICKAXE_TOOLS: ToolFamily = {
  kind: 'work',
  desc: () => m.almanac_tool_pickaxe(),
  tools: [
    { id: 'pickaxe', price: sold('buy-pickaxe'), ...PICKAXES.pickaxe },
    { id: 'better-pickaxe', price: sold('buy-better-pickaxe'), ...PICKAXES['better-pickaxe'] },
    { id: 'diamond-pickaxe', price: PRIZE, ...PICKAXES['diamond-pickaxe'] },
  ],
}

const AXE_TOOLS: ToolFamily = {
  kind: 'work',
  desc: () => m.almanac_tool_axe({ skill: SKILLS.grafting.name }),
  tools: [
    { id: 'axe', price: sold('buy-axe'), ...AXES.axe },
    { id: 'chainsaw', price: sold('buy-chainsaw'), ...AXES.chainsaw },
    { id: 'electric-chainsaw', price: PRIZE, ...AXES['electric-chainsaw'] },
  ],
}

const BUCKET_TOOLS: ToolFamily = {
  kind: 'hold',
  desc: () => m.almanac_tool_bucket(),
  tools: [
    { id: 'bucket', price: sold('buy-bucket'), liters: CONTAINERS.bucket.capacityLiters },
    { id: 'large-bucket', price: sold('buy-bucket-large'), liters: CONTAINERS['large-bucket'].capacityLiters },
  ],
}

export const LISTS: { readonly [K in AlmanacTab]: readonly ListItem[] } = {
  fruits: [
    overview,
    heading(() => m.almanac_group_crops()),
    ...PLANT_CROPS.map(sku),
    heading(() => m.almanac_group_trees()),
    ...TREE_IDS.map(sku),
  ],
  utility: [
    heading(() => m.almanac_group_tools()),
    tools(() => m.names_shovel_shovel(), SHOVEL_TOOLS),
    tools(() => m.names_pickaxe_pickaxe(), PICKAXE_TOOLS),
    tools(() => m.names_item_axe(), AXE_TOOLS),
    tools(() => m.names_container_bucket(), BUCKET_TOOLS),
    heading(() => m.almanac_group_bags()),
    ...['fertilizer', 'compost', 'weed-spray', 'extract', 'sugar'].map(sku),
    heading(() => m.almanac_group_storage()),
    ...['chest', 'freezer', 'silo-seed', 'silo-spray', 'silo-produce'].map(sku),
  ],
  water: [
    overview,
    ...['pumpjack', 'well', 'tap', 'pipe', 'valve'].map(sku),
    forms(() => m.names_building_sprinkler(), ['sprinkler', 'sprinkler-vert', 'sprinkler-large']),
  ],
  machines: [
    overview,
    ...['grinder', 'mill', 'jam', 'still', 'barrel', 'infuser', 'compost-box', 'furnace', 'station', 'sorter'].map(sku),
  ],
  vehicles: [overview, ...['hangar', 'refuel', 'dispatch', 'traffic-light'].map(sku)],
  sensors: [
    overview,
    heading(() => m.almanac_group_signal()),
    ...['lever', 'button', 'lamp', 'logic', 'not', 'pulser', 'counter'].map(sku),
    heading(() => m.almanac_group_readers()),
    ...['sensor-water', 'sensor-fert', 'sensor-harvest', 'sensor-variety', 'sensor-weather', 'sensor-day', 'vehicle-detector'].map(sku),
  ],
  concepts: [
    heading(() => m.almanac_group_plants()),
    ...(['variety', 'quality', 'freshness', 'happiness'] as const).map(concept),
    heading(() => m.almanac_group_days()),
    concept('day'),
    heading(() => m.almanac_group_money()),
    concept('market'),
    heading(() => m.almanac_group_family()),
    ...(['family', 'skills', 'research'] as const).map(concept),
    heading(() => m.almanac_group_other()),
    concept('burrow'),
    concept('mushrooms'),
    concept('infusion'),
    sku('necronomicon'),
  ],
  misc: [
    heading(() => m.almanac_group_ground()),
    sku('soil'),
    sku('fence'),
    forms(() => m.almanac_forms_paving(), ['tile-asphalt', 'tile-cobble', 'tile-brick', 'tile-paved']),
    heading(() => m.almanac_group_compostable()),
    sku('weed'),
    forms(() => m.names_ground_grass(), ['grass', 'grass-seeds']),
    forms(() => m.almanac_forms_rotten(), ['rotten', 'rotten-root', 'dead']),
    ...['wood', 'ash', 'fly-agaric', 'truffle'].map(sku),
  ],
}

export const CONCEPT_LABEL: { readonly [K in ConceptId]: () => string } = {
  variety: () => m.almanac_concept_variety(),
  quality: () => m.almanac_concept_quality(),
  freshness: () => m.almanac_concept_freshness(),
  happiness: () => m.almanac_concept_happiness(),
  day: () => m.almanac_concept_day(),
  market: () => m.names_role_market(),
  skills: () => m.almanac_concept_skills(),
  family: () => m.family_title(),
  research: () => m.names_role_research(),
  burrow: () => m.almanac_concept_burrow(),
  mushrooms: () => m.almanac_concept_mushrooms(),
  infusion: () => m.almanac_concept_infusion(),
}

export const TABS: { id: AlmanacTab; label: () => string }[] = [
  { id: 'fruits', label: () => m.almanac_tab_fruits() },
  { id: 'utility', label: () => m.almanac_tab_utility() },
  { id: 'water', label: () => m.almanac_tab_water() },
  { id: 'machines', label: () => m.almanac_tab_machines() },
  { id: 'vehicles', label: () => m.almanac_tab_vehicles() },
  { id: 'sensors', label: () => m.almanac_tab_sensors() },
  { id: 'concepts', label: () => m.almanac_tab_concepts() },
  { id: 'misc', label: () => m.almanac_tab_misc() },
]

export const CROP_IDS: readonly GrownCrop[] = PLANT_CROPS

export type Tip = { title: string; recipes: readonly Recipe[] } | undefined

export const AlmanacGo = createContext<(to: AlmanacNav) => void>(() => {
  throw new Error('AlmanacLink')
})

export const AlmanacTip = createContext<(tip: Tip) => void>(() => {
  throw new Error('AlmanacTip')
})

export function AlmanacLink({ to, children }: { to: AlmanacNav; children: ReactNode }) {
  const go = useContext(AlmanacGo)
  return (
    <button
      type="button"
      className="inline cursor-pointer text-base text-dirt underline decoration-dirt hover:text-dirt-dark hover:decoration-dirt-dark"
      onClick={() => go(to)}
    >
      {children}
    </button>
  )
}

export const CONCEPT_IDS: ConceptId[] = Object.values(LISTS).flatMap(list =>
  list.flatMap(r => (r.kind === 'concept' ? [r.id] : [])),
)

export function rowsOf(tab: AlmanacTab): ListRow[] {
  return LISTS[tab].filter((r): r is ListRow => r.kind !== 'heading')
}

export function rowId(row: ListRow): string {
  switch (row.kind) {
    case 'overview':
      return 'overview'
    case 'concept':
    case 'sku':
    case 'forms':
    case 'tools':
      return row.id
  }
}

export function skuEntry(byId: Map<string, CatalogEntry>, id: string): CatalogEntry {
  const e = byId.get(id)
  if (e === undefined) throw new Error(id)
  return e
}

export function rowTitle(row: ListRow, byId: Map<string, CatalogEntry>): string {
  switch (row.kind) {
    case 'overview':
      return m.almanac_overview()
    case 'concept':
      return CONCEPT_LABEL[row.id]()
    case 'sku':
      return skuEntry(byId, row.id).title
    case 'forms':
    case 'tools':
      return row.title()
  }
}

export function firstId(tab: AlmanacTab): string {
  return rowId(rowsOf(tab)[0])
}

export type Trail = { stack: AlmanacNav[]; at: number }

export function trailStart(loc: AlmanacNav): Trail {
  return { stack: [loc], at: 0 }
}

export function trailPush(trail: Trail, loc: AlmanacNav): Trail {
  const here = trail.stack[trail.at]
  if (here.tab === loc.tab && here.id === loc.id) return trail
  const stack = trail.stack.slice(0, trail.at + 1)
  stack.push(loc)
  return { stack, at: stack.length - 1 }
}

export function trailBack(trail: Trail): Trail {
  return trail.at === 0 ? trail : { stack: trail.stack, at: trail.at - 1 }
}

export function trailForward(trail: Trail): Trail {
  return trail.at === trail.stack.length - 1 ? trail : { stack: trail.stack, at: trail.at + 1 }
}

export function tabOf(id: string): AlmanacTab {
  const t = TABS.find(x => x.id === id)
  if (t === undefined) throw new Error(id)
  return t.id
}

const LINK = /\[([^\]]+)\]\((\w+):([\w-]+)\)/

export function linksResolve(text: string): boolean {
  const parts = text.split(LINK)
  return parts.every(
    (part, i) => i % 4 !== 2 || (TABS.some(t => t.id === part) && rowsOf(tabOf(part)).some(r => rowId(r) === parts[i + 1])),
  )
}

export function Rich({ text }: { text: string }) {
  const parts = text.split(LINK)
  return parts.map((part, i) => {
    if (i % 4 === 0) return part
    if (i % 4 !== 1) return null
    return (
      <AlmanacLink key={i} to={{ tab: tabOf(parts[i + 1]), id: parts[i + 2] }}>
        {part}
      </AlmanacLink>
    )
  })
}

export const STAGES = ['sprout', 'grow', 'ripe'] as const
export const TREE_STAGES = ['trunk', 'grow', 'unripe', 'ripe'] as const

