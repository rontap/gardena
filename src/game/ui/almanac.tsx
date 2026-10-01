import { m } from '../../paraglide/messages.js'
import { createContext, Fragment, useContext, useState, type ReactNode } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { catalogEntries, type CatalogEntry } from '../defs/catalog.ts'
import {
  AGARIC_LOOT_COUNT,
  BURROW_ENTRIES,
  BURROW_RARE_STEP,
  BURROW_RARITIES,
  BURROW_START_N,
  TRUFFLE_LOOT_COUNT,
  WEED_LOOT_COUNT,
  type BurrowEntry,
  type BurrowRarity,
} from '../defs/burrow.ts'
import { MUSHROOM_CHANCE, MUSHROOM_DAYS, MUSHROOM_TRUFFLE } from '../defs/mushroom.ts'
import { WEATHER_KINDS, WEATHER_NAME } from '../defs/weather.ts'
import { CROP_NAME, CROPS, varietyName } from '../defs/crops.ts'
import {
  ALMANAC_AT,
  HEIRLOOM_AT,
  HEIRLOOM_PLACE_AT,
  HEIRLOOM_PURPOSE_AT,
  needsNeighbour,
  PURPOSE_MUL,
  tierOf,
  VARIANT_AT,
  VARIANT_PURPOSE_AT,
  VARIETIES,
  VARIETY,
  VARIETY_TIERS,
  type AlmanacEntry,
  type Purpose,
  type VarietyId,
} from '../defs/varieties.ts'
import { JAM_ROT, SKILLS } from '../defs/skills.ts'
import { TREES, TREE_RATE_HAPPY, TREE_RATE_ON, TREE_YIELD_DAYS } from '../defs/trees.ts'
import { INFUSABLE_KINDS, PLANT_CROPS, TREE_IDS, type GrownCrop, type SkuId, type TreeId } from '../sim/ids.ts'
import { toolItem } from '../sim/feature-burrow/burrow.ts'
import { faceName, infuseGoodsText, REAGENT_NAME, tierLabel, type Face } from '../sim/item.ts'
import { difficultyModifier, statsOf, type Stats } from '../sim/modifiers.ts'
import { HARDNESS, type Rules } from '../defs/rules.ts'
import { FERT_PLOT_MAX, SOIL_WATER_MID, TREE_FERT_MAX, TREE_WATER_MID } from '../sim/soil.ts'
import { DAY_SECONDS, days } from '../sim/clock.ts'
import type { World } from '../sim/world.ts'
import {
  AXES,
  CONTAINERS,
  COUNTER_MAX,
  INFUSE_REAGENTS,
  MILL_TRUFFLE_OUT,
  NEIGHBOUR_REACH,
  PICKAXES,
  SHOVELS,
} from '../defs/items.ts'
import { SKUS } from '../defs/research.ts'
import {
  buttonArt,
  counterArt,
  cropInner,
  daySensorArt,
  EXPAND_LAND,
  SKILL_POINT,
  faceGfx,
  fertSensorArt,
  harvestSensorArt,
  itemInner,
  lampArt,
  leverArt,
  logicArt,
  PIPE_I,
  PIPE_L,
  PIPE_STUB,
  PIPE_T,
  PIPE_X,
  PROP_NOT,
  pulserArt,
  ripeGroup,
  treeStage,
  UI_ARROW_FILL,
  UI_ARROW_INK,
  varietySensorArt,
  vehicleDetectorArt,
  waterSensorArt,
  weatherSensorArt,
} from '../view/svgs.ts'
import { CalloutHover } from './callout-hover.tsx'
import { Coin, Label, Overlay, tabSelectClass, tabSelectListClass, tabTriggerClass } from './frame.tsx'
import { useCycle } from './cycle.ts'
import { MACHINE_IDS, recipesUsing, type MachineId, type Recipe } from '../sim/feature-machines/recipe.ts'
import { Recipes } from './recipe.tsx'

type AlmanacTab = 'fruits' | 'utility' | 'water' | 'machines' | 'vehicles' | 'sensors' | 'concepts' | 'misc'

type ConceptId =
  | 'variety'
  | 'quality'
  | 'freshness'
  | 'happiness'
  | 'day'
  | 'market'
  | 'skills'
  | 'family'
  | 'research'
  | 'luck'
  | 'burrow'
  | 'mushrooms'
  | 'infusion'

type AlmanacNav = { tab: AlmanacTab; id: string }

type ListRow =
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

type Price = { kind: 'sku'; sku: SkuId } | { kind: 'prize' }

type ToolFamily =
  | { kind: 'work'; desc: () => string; tools: readonly { id: string; price: Price; uses: number; workSeconds: number }[] }
  | { kind: 'hold'; desc: () => string; tools: readonly { id: string; price: Price; liters: number }[] }

const sold = (sku: SkuId): Price => ({ kind: 'sku', sku })
const PRIZE: Price = { kind: 'prize' }

function toolIds(family: ToolFamily): string[] {
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

const LISTS: { readonly [K in AlmanacTab]: readonly ListItem[] } = {
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
    ...['pumpjack', 'well', 'tap', 'pipe', 'valve'].map(sku),
    forms(() => m.names_building_sprinkler(), ['sprinkler', 'sprinkler-vert', 'sprinkler-large']),
  ],
  machines: [
    overview,
    ...['grinder', 'mill', 'jam', 'still', 'barrel', 'infuser', 'compost-box', 'furnace', 'station', 'sorter'].map(sku),
  ],
  vehicles: [
    ...['hangar', 'refuel', 'dispatch', 'traffic-light'].map(sku),
  ],
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
    concept('luck'),
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
    ...['rotten', 'dead', 'wood', 'ash', 'fly-agaric', 'truffle'].map(sku),
  ],
}

const CONCEPT_LABEL: { readonly [K in ConceptId]: () => string } = {
  variety: () => m.almanac_concept_variety(),
  quality: () => m.almanac_concept_quality(),
  freshness: () => m.almanac_concept_freshness(),
  happiness: () => m.almanac_concept_happiness(),
  day: () => m.almanac_concept_day(),
  market: () => m.names_role_market(),
  skills: () => m.almanac_concept_skills(),
  family: () => m.family_title(),
  research: () => m.names_role_research(),
  luck: () => m.almanac_concept_luck(),
  burrow: () => m.almanac_concept_burrow(),
  mushrooms: () => m.almanac_concept_mushrooms(),
  infusion: () => m.almanac_concept_infusion(),
}

const TABS: { id: AlmanacTab; label: () => string }[] = [
  { id: 'fruits', label: () => m.almanac_tab_fruits() },
  { id: 'utility', label: () => m.almanac_tab_utility() },
  { id: 'water', label: () => m.almanac_tab_water() },
  { id: 'machines', label: () => m.almanac_tab_machines() },
  { id: 'vehicles', label: () => m.almanac_tab_vehicles() },
  { id: 'sensors', label: () => m.almanac_tab_sensors() },
  { id: 'concepts', label: () => m.almanac_tab_concepts() },
  { id: 'misc', label: () => m.almanac_tab_misc() },
]

const CROP_IDS: readonly GrownCrop[] = PLANT_CROPS

type Tip = { title: string; recipe: Recipe } | undefined

const AlmanacGo = createContext<(to: AlmanacNav) => void>(() => {
  throw new Error('AlmanacLink')
})

const AlmanacTip = createContext<(tip: Tip) => void>(() => {
  throw new Error('AlmanacTip')
})

function AlmanacLink({ to, children }: { to: AlmanacNav; children: ReactNode }) {
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

function rowsOf(tab: AlmanacTab): ListRow[] {
  return LISTS[tab].filter((r): r is ListRow => r.kind !== 'heading')
}

function rowId(row: ListRow): string {
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

function skuEntry(byId: Map<string, CatalogEntry>, id: string): CatalogEntry {
  const e = byId.get(id)
  if (e === undefined) throw new Error(id)
  return e
}

function rowTitle(row: ListRow, byId: Map<string, CatalogEntry>): string {
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

function firstId(tab: AlmanacTab): string {
  return rowId(rowsOf(tab)[0])
}

function tabOf(id: string): AlmanacTab {
  const t = TABS.find(x => x.id === id)
  if (t === undefined) throw new Error(id)
  return t.id
}

const STAGES = ['sprout', 'grow', 'ripe'] as const
const TREE_STAGES = ['trunk', 'grow', 'unripe', 'ripe'] as const

export function Almanac({ world, onClose }: { world: World; onClose: () => void }) {
  const entries = catalogEntries(world.pace)
  const [tab, setTab] = useState<AlmanacTab>('fruits')
  const [id, setId] = useState(firstId('fruits'))
  const [tip, setTip] = useState<Tip>(undefined)
  const byId = new Map(entries.map(e => [e.id, e]))
  const rows = rowsOf(tab)
  const row = rows.find(r => rowId(r) === id)
  if (row === undefined) throw new Error('AlmanacNav')
  const go = (to: AlmanacNav) => {
    setTab(to.tab)
    setId(to.id)
    setTip(undefined)
  }
  return (
    <Overlay
      title={m.hud_almanac()}
      onClose={onClose}
      className="h-[min(48rem,calc(100vh-6rem))] w-[48rem]"
      aside={
        tip !== undefined ? (
          <CalloutHover
            title={tip.title}
            description={
              <>
                <RecipeSale recipe={tip.recipe} />
                <Recipes view={{ kind: 'one', recipe: tip.recipe }} size="sm" world={world} />
              </>
            }
          />
        ) : undefined
      }
    >
      <AlmanacGo.Provider value={go}>
        <AlmanacTip.Provider value={setTip}>
        <Tabs.Root
          value={tab}
          onValueChange={v => {
            const next = tabOf(v)
            setTab(next)
            setId(firstId(next))
            setTip(undefined)
          }}
          className="relative z-20 flex min-h-0 flex-1 flex-col"
        >
          <Tabs.List className="sticky top-0 z-10 flex shrink-0 flex-wrap gap-1 border-b border-ink/20 bg-house px-4">
            {TABS.map(t => (
              <Tabs.Trigger key={t.id} value={t.id} className={tabTriggerClass}>
                {t.label()}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <div className="relative z-20 flex min-h-0 flex-1 mx-[-0.75rem]">
            <div className="scroll-pane w-44 shrink-0 min-h-0 overflow-y-auto border-r border-ink/20">
              {LISTS[tab].map(r => {
                if (r.kind === 'heading') {
                  return (
                    <div key={r.label()} className="px-2 pt-2">
                      <Label>{r.label()}</Label>
                    </div>
                  )
                }
                const rid = rowId(r)
                return (
                  <button
                    key={rid}
                    type="button"
                    className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-lg ${
                      rid === id ? 'bg-dirt text-house' : 'text-ink hover:bg-dirt/30'
                    }`}
                    onClick={() => {
                      setId(rid)
                      setTip(undefined)
                    }}
                  >
                    {r.kind === 'sku' || r.kind === 'forms' || r.kind === 'tools' ? (
                      <svg
                        className="h-4 w-4 shrink-0"
                        viewBox="0 0 24 24"
                        dangerouslySetInnerHTML={{ __html: itemInner(skuEntry(byId, r.id).icon) }}
                      />
                    ) : null}
                    <span className="truncate">{rowTitle(r, byId)}</span>
                  </button>
                )
              })}
            </div>
            <div className="scroll-pane min-h-0 min-w-0 flex-1 overflow-y-auto p-4">
              <RowPane
                row={row}
                byId={byId}
                world={world}
                done={{
                  fermentation: world.done.has('unlock-fermentation'),
                  grinder: world.done.has('unlock-grinder'),
                  preservatives: world.done.has('unlock-preservatives'),
                  furnace: world.done.has('unlock-furnace'),
                  infusion: world.done.has('unlock-infusion'),
                }}
                familiarity={world.familiarity}
                tab={tab}
              />
            </div>
          </div>
        </Tabs.Root>
        </AlmanacTip.Provider>
      </AlmanacGo.Provider>
    </Overlay>
  )
}

type AlmanacDone = { fermentation: boolean; grinder: boolean; preservatives: boolean; furnace: boolean; infusion: boolean }

function RowPane({
  row,
  byId,
  world,
  done,
  familiarity,
  tab,
}: {
  row: ListRow
  byId: Map<string, CatalogEntry>
  world: World
  done: AlmanacDone
  familiarity: World['familiarity']
  tab: AlmanacTab
}) {
  switch (row.kind) {
    case 'overview':
      return <OverviewPane tab={tab} />
    case 'concept':
      return <ConceptPane id={row.id} rules={world.rules} />
    case 'sku':
      return <Pane entry={skuEntry(byId, row.id)} done={done} familiarity={familiarity} tab={tab} world={world} />
    case 'forms':
      return <FormsPane title={row.title()} entries={row.ids.map(id => skuEntry(byId, id))} tab={tab} />
    case 'tools':
      return <ToolPane title={row.title()} family={row.family} byId={byId} world={world} />
  }
}

function OverviewPane({ tab }: { tab: AlmanacTab }) {
  return (
    <>
      <div className="mb-3 text-lg leading-relaxed text-ink">{m.almanac_overview()}</div>
      <div className="flex flex-col gap-3 text-base leading-relaxed text-ink">{overviewBody(tab)}</div>
    </>
  )
}

function overviewBody(tab: AlmanacTab) {
  switch (tab) {
    case 'fruits':
      return <FruitsOverview />
    case 'sensors':
      return <SensorsOverview />
    case 'machines':
      return <MachinesOverview />
    case 'utility':
    case 'water':
    case 'vehicles':
    case 'concepts':
    case 'misc':
      throw new Error(tab)
  }
}

function FruitsOverview() {
  return (
    <>
      <div>
        {m.almanac_seeds_p1_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_seeds_p1_b()}
      </div>
      <div>
        {m.almanac_seeds_p2_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'variety' }}>{m.almanac_concept_variety()}</AlmanacLink>
        {m.almanac_seeds_p2_b()}
      </div>
      <div>
        {m.almanac_seeds_p3_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'variety' }}>{m.almanac_concept_variety()}</AlmanacLink>
        {m.almanac_seeds_p3_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'quality' }}>{m.almanac_concept_quality()}</AlmanacLink>
        {m.almanac_seeds_p3_c()}
        <AlmanacLink to={{ tab: 'concepts', id: 'happiness' }}>{m.almanac_concept_happiness()}</AlmanacLink>
        {m.almanac_seeds_p3_d()}
        <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>{m.almanac_concept_freshness()}</AlmanacLink>
        {m.almanac_seeds_p3_e()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_seeds_p3_f()}
      </div>
      <div>{m.almanac_tree_seasons({ days: TREE_YIELD_DAYS })}</div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'concepts', id: 'variety' }}>{m.almanac_concept_variety()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'quality' }}>{m.almanac_concept_quality()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'happiness' }}>{m.almanac_concept_happiness()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>{m.almanac_concept_freshness()}</AlmanacLink>
        {m.almanac_and()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function SensorsOverview() {
  return (
    <>
      <div>{m.almanac_sensors_p1()}</div>
      <div>
        {m.almanac_sensors_p2_a()}
        <AlmanacLink to={{ tab: 'sensors', id: 'lever' }}>{m.names_sensor_lever()}</AlmanacLink>
        {m.almanac_sensors_p2_b()}
      </div>
      <div>
        <AlmanacLink to={{ tab: 'machines', id: 'overview' }}>{m.hud_research_automation()}</AlmanacLink>
        {m.almanac_sensors_p3_a()}
      </div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'machines', id: 'overview' }}>{m.hud_research_automation()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function MachinesOverview() {
  return (
    <>
      <div>
        {m.almanac_auto_p1_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_auto_p1_b()}
      </div>
      <div>
        {m.almanac_auto_p2_a()}
        <AlmanacLink to={{ tab: 'machines', id: 'mill' }}>{m.names_building_mill()}</AlmanacLink>
        {m.almanac_auto_p2_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_auto_p2_c()}
      </div>
      <div>
        <AlmanacLink to={{ tab: 'concepts', id: 'research' }}>{m.names_role_research()}</AlmanacLink>
        {m.almanac_auto_p3_a()}
        <AlmanacLink to={{ tab: 'sensors', id: 'overview' }}>{m.almanac_sensors_overview_link()}</AlmanacLink>
        {m.almanac_auto_p3_b()}
      </div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'research' }}>{m.names_role_research()}</AlmanacLink>
        {m.almanac_and()}
        <AlmanacLink to={{ tab: 'sensors', id: 'overview' }}>{m.almanac_sensors_overview_link()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function ConceptPane({ id, rules }: { id: ConceptId; rules: Rules }) {
  return (
    <>
      <div className="mb-3 text-lg leading-relaxed text-ink">{CONCEPT_LABEL[id]()}</div>
      <div className="flex flex-col gap-3 text-base leading-relaxed text-ink">{conceptBody(id, rules)}</div>
    </>
  )
}

function conceptBody(id: ConceptId, rules: Rules) {
  switch (id) {
    case 'variety':
      return <VarietyConcept />
    case 'quality':
      return <QualityConcept />
    case 'freshness':
      return <FreshnessConcept rules={rules} />
    case 'happiness':
      return <HappinessConcept />
    case 'day':
      return <DayConcept />
    case 'market':
      return <MarketConcept />
    case 'skills':
      return <SkillsConcept />
    case 'family':
      return <FamilyConcept />
    case 'research':
      return <ResearchConcept />
    case 'luck':
      return <LuckConcept />
    case 'burrow':
      return <BurrowConcept />
    case 'mushrooms':
      return <MushroomsConcept />
    case 'infusion':
      return <InfusionConcept />
  }
}

function VarietyConcept() {
  return (
    <>
      <div>{m.almanac_variety_p1()}</div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'concepts', id: 'quality' }}>{m.almanac_concept_quality()}</AlmanacLink>
        {m.almanac_and()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function QualityConcept() {
  return (
    <>
      <div>{m.almanac_quality_p1()}</div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'concepts', id: 'variety' }}>{m.almanac_concept_variety()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'happiness' }}>{m.almanac_concept_happiness()}</AlmanacLink>
        {m.almanac_and()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function FreshnessConcept({ rules }: { rules: Rules }) {
  const full = Math.round(HARDNESS[rules.difficulty].freshFull * 100)
  return (
    <>
      <div>
        {m.almanac_fresh_p1_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_fresh_p1_b()}
      </div>
      <div>
        {m.almanac_fresh_p2_a()}
        <AlmanacLink to={{ tab: 'misc', id: 'rotten' }}>{m.almanac_rotten_produce()}</AlmanacLink>
        {m.almanac_fresh_p2_b()}
        <AlmanacLink to={{ tab: 'utility', id: 'chest' }}>{m.names_building_chest()}</AlmanacLink>
        {m.almanac_fresh_p2_c()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.market_sell_all_label()}</AlmanacLink>
        {m.almanac_fresh_p2_d()}
        <AlmanacLink to={{ tab: 'utility', id: 'freezer' }}>{m.names_building_freezer()}</AlmanacLink>
        {m.almanac_fresh_p2_e()}
        <AlmanacLink to={{ tab: 'utility', id: 'sugar' }}>{m.names_item_sugar()}</AlmanacLink>
        {m.almanac_fresh_p2_f()}
      </div>
      <div>
        {m.almanac_fresh_p3_a({ full })}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_fresh_p3_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_fresh_p3_c({ full })}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_fresh_p3_d()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{SKILLS.jam.name}</AlmanacLink>
        {m.almanac_fresh_p3_e({ i: JAM_ROT * 100, ii: JAM_ROT * 200, iii: JAM_ROT * 300 })}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_fresh_p3_rotten()}
        <Coin n={1} />
        {m.almanac_fresh_p3_g()}
      </div>
      <div>
        <AlmanacLink to={{ tab: 'concepts', id: 'variety' }}>{m.almanac_concept_variety()}</AlmanacLink>
        {m.almanac_and_word()}
        <AlmanacLink to={{ tab: 'concepts', id: 'quality' }}>{m.almanac_concept_quality()}</AlmanacLink>
        {m.almanac_fresh_p4_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'variety' }}>{m.almanac_concept_variety()}</AlmanacLink>
        {m.almanac_fresh_p4_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'quality' }}>{m.almanac_concept_quality()}</AlmanacLink>
        {m.almanac_fresh_p4_c()}
        <AlmanacLink to={{ tab: 'concepts', id: 'variety' }}>{m.almanac_concept_variety()}</AlmanacLink>
        {m.almanac_fresh_p4_d()}
      </div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'concepts', id: 'variety' }}>{m.almanac_concept_variety()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_and()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{m.almanac_concept_skills()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function HappinessConcept() {
  return (
    <>
      <div>{m.almanac_happy_p1()}</div>
      <div>
        {m.almanac_happy_p2_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'quality' }}>{m.almanac_concept_quality()}</AlmanacLink>
        {m.almanac_happy_p2_b()}
      </div>
      <div>
        {m.almanac_happy_p3_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{SKILLS.tending.name}</AlmanacLink>
        {m.almanac_happy_p3_b()}
      </div>
      <div>
        {m.almanac_happy_p4_a()}
        <AlmanacLink to={{ tab: 'misc', id: 'dead' }}>{m.almanac_dead_plant()}</AlmanacLink>
        {m.almanac_happy_p4_b()}
        <AlmanacLink to={{ tab: 'misc', id: 'rotten' }}>{m.almanac_rotten_produce()}</AlmanacLink>
        {m.almanac_happy_p4_c()}
        <AlmanacLink to={{ tab: 'misc', id: 'dead' }}>{m.almanac_dead_plant()}</AlmanacLink>
        {m.almanac_happy_p4_d()}
        <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>{m.almanac_loses_freshness()}</AlmanacLink>
        {m.almanac_happy_p4_e()}
      </div>
      <div>
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>{m.almanac_crop_skills_family_cap()}</AlmanacLink>
        {m.almanac_happy_p5_a()}
      </div>
      <div>
        {m.almanac_happy_p6_a()}
        <AlmanacLink to={{ tab: 'sensors', id: 'sensor-water' }}>{m.names_sensor_water()}</AlmanacLink>
        {m.almanac_happy_p6_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{m.almanac_concept_skills()}</AlmanacLink>
        {m.almanac_happy_p6_c()}
        <AlmanacLink to={{ tab: 'concepts', id: 'variety' }}>{m.almanac_concept_variety()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function DayConcept() {
  return (
    <>
      <div>{m.almanac_day_p1()}</div>
      <div>
        {m.almanac_day_p2_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'research' }}>{m.almanac_word_research()}</AlmanacLink>
        {m.almanac_day_p2_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>{m.names_member_player()}</AlmanacLink>
        {m.almanac_day_p2_c()}
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>{m.names_member_husband()}</AlmanacLink>
        {m.almanac_day_p2_d()}
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>{m.names_member_daughter()}</AlmanacLink>
        {m.almanac_day_p2_e()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{m.almanac_skill_point()}</AlmanacLink>
        {m.almanac_day_p2_f()}
      </div>
      <div>
        {m.almanac_day_p3_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_day_p3_hours()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.market_sell_all_label()}</AlmanacLink>
        {m.almanac_day_p3_open()}
      </div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>{m.family_title()}</AlmanacLink>
        {m.almanac_and()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{m.almanac_concept_skills()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function MarketConcept() {
  return (
    <>
      <div>{m.almanac_market_p1()}</div>
      <div>
        {m.almanac_market_p2_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>{m.almanac_concept_freshness()}</AlmanacLink>
        {m.almanac_market_p2_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'variety' }}>{m.almanac_concept_variety()}</AlmanacLink>
        {m.almanac_market_p2_c()}
      </div>
      <div>
        {m.almanac_market_p3_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>{m.family_title()}</AlmanacLink>
        {m.almanac_market_p3_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{SKILLS.saleswoman.name}</AlmanacLink>
        {m.almanac_market_p3_c({ saleswoman: 2 })}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{SKILLS.heirloom.name}</AlmanacLink>
        {m.almanac_market_p3_d()}
        <AlmanacLink to={{ tab: 'concepts', id: 'variety' }}>{m.almanac_concept_variety()}</AlmanacLink>
        {m.almanac_market_p3_e({ heirloom: 5 })}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{SKILLS.jam.name}</AlmanacLink>
        {m.almanac_market_p3_g({ jam: JAM_ROT * 100 })}
        {m.almanac_market_p3_rotten_a()}
        <Coin n={1} />
        {m.almanac_market_p3_rotten_b()}
      </div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{m.almanac_concept_skills()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'day' }}>{m.almanac_concept_day()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>{m.almanac_concept_freshness()}</AlmanacLink>
        {m.almanac_and()}
        <AlmanacLink to={{ tab: 'concepts', id: 'variety' }}>{m.almanac_concept_variety()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function SkillsConcept() {
  return (
    <>
      <div>
        {m.almanac_skills_p1_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_skills_p1_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'day' }}>{m.almanac_end_of_day()}</AlmanacLink>
        {m.almanac_skills_p1_c()}
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>{m.family_title()}</AlmanacLink>
        {m.almanac_skills_p1_d()}
      </div>
      <div>
        {m.almanac_skills_p2_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'happiness' }}>{m.almanac_happier_plants()}</AlmanacLink>
        {m.almanac_skills_p2_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'quality' }}>{m.almanac_concept_quality()}</AlmanacLink>
        {m.almanac_skills_p2_c()}
        <Coin n={1} />
        {m.almanac_skills_p2_d()}
        <Coin n={1} />
        {m.almanac_skills_p2_e()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_skills_p2_f()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.market_sell_all_label()}</AlmanacLink>
        {m.almanac_skills_p2_g()}
      </div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>{m.family_title()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'research' }}>{m.names_role_research()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'variety' }}>{m.almanac_concept_variety()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>{m.almanac_concept_freshness()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'happiness' }}>{m.almanac_concept_happiness()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_and()}
        <AlmanacLink to={{ tab: 'concepts', id: 'day' }}>{m.almanac_concept_day()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function FamilyConcept() {
  return (
    <>
      <div>
        {m.almanac_family_p1_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_family_p1_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'research' }}>{m.names_role_research()}</AlmanacLink>
        {m.almanac_family_p1_c()}
        <AlmanacLink to={{ tab: 'concepts', id: 'research' }}>{m.names_role_research()}</AlmanacLink>
        {m.almanac_family_p1_d()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_family_p1_e()}
        <AlmanacLink to={{ tab: 'concepts', id: 'research' }}>{m.almanac_word_research()}</AlmanacLink>
        {m.almanac_family_p1_f()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_family_p1_g()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{m.almanac_skill_points()}</AlmanacLink>
        {m.almanac_family_p1_h()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{m.almanac_concept_skills()}</AlmanacLink>
        {m.almanac_family_p1_i()}
      </div>
      <div>
        {m.almanac_family_p2_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{m.almanac_concept_skills()}</AlmanacLink>
        {m.almanac_family_p2_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'research' }}>{m.names_role_research()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function ResearchConcept() {
  return (
    <>
      <div>{m.almanac_research_p1()}</div>
      <div>{m.almanac_research_p2()}</div>
      <div>
        {m.almanac_research_p3_a()}
        <AlmanacLink to={{ tab: 'machines', id: 'overview' }}>{m.almanac_word_machines()}</AlmanacLink>
        {m.almanac_research_p3_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{m.almanac_concept_skills()}</AlmanacLink>
        {m.almanac_research_p3_c()}
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>{m.family_title()}</AlmanacLink>
        {m.almanac_research_p3_d()}
      </div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>{m.family_title()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{m.almanac_concept_skills()}</AlmanacLink>
        {m.almanac_and()}
        <AlmanacLink to={{ tab: 'machines', id: 'overview' }}>{m.hud_research_automation()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function LuckConcept() {
  return (
    <>
      <div>{m.almanac_luck_p1()}</div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{m.almanac_concept_skills()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function BurrowConcept() {
  return (
    <>
      <div>{m.almanac_burrow_p1()}</div>
      <div>{m.almanac_burrow_p2({ start: BURROW_START_N })}</div>
      <div>{m.almanac_burrow_p3({ step: BURROW_RARE_STEP })}</div>
      <BurrowCard />
    </>
  )
}

const RARITY_NAME: { readonly [K in BurrowRarity]: () => string } = {
  common: () => m.names_rarity_common(),
  uncommon: () => m.names_rarity_uncommon(),
  rare: () => m.names_rarity_rare(),
}

type EntryCard = { caption: string; arts: readonly string[] }

function oneCard(face: Face): EntryCard {
  return { caption: faceName(face), arts: [itemInner(face)] }
}

function entryCard(entry: BurrowEntry): EntryCard {
  switch (entry.kind) {
    case 'treasure':
      return {
        caption: m.almanac_caption_treasure({ min: entry.min, max: entry.max }),
        arts: [itemInner({ kind: 'treasure', coins: entry.min })],
      }
    case 'seeds':
      return {
        caption: m.almanac_caption_seeds({ tier: tierLabel(tierOf(entry.pool[0].variety)) }),
        arts: entry.pool.map(p => itemInner({ kind: 'seeds', crop: p.crop, variety: p.variety, quality: 0, count: entry.count })),
      }
    case 'tree-seed':
      return {
        caption: m.almanac_caption_tree_seed({ tier: tierLabel(tierOf(entry.pool[0].variety)) }),
        arts: entry.pool.map(p => itemInner({ kind: 'tree-seed', tree: p.tree, variety: p.variety, quality: 0 })),
      }
    case 'weed':
      return oneCard({ kind: 'weed', count: WEED_LOOT_COUNT })
    case 'fly-agaric':
      return oneCard({ kind: 'fly-agaric', count: AGARIC_LOOT_COUNT })
    case 'truffle':
      return oneCard({ kind: 'truffle', count: TRUFFLE_LOOT_COUNT })
    case 'skill-point':
      return { caption: m.almanac_caption_skill_point(), arts: [SKILL_POINT] }
    case 'tool':
    case 'special-tool':
      return { caption: m.almanac_caption_tool(), arts: entry.pool.map(tool => itemInner(toolItem(tool, uses => uses))) }
    case 'permit':
      return { caption: m.market_expansion_permit(), arts: [EXPAND_LAND] }
  }
}

function BurrowCard() {
  return (
    <div className="flex flex-col gap-3">
      {BURROW_RARITIES.map(rarity => (
        <div key={rarity} className="w-fit rounded-lg border-2 border-ink/25 px-2 pb-2">
          <Label>{RARITY_NAME[rarity]()}</Label>
          <div className="flex gap-2">
            {BURROW_ENTRIES[rarity].map((entry, i) => (
              <EntryPortrait key={i} card={entryCard(entry)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EntryPortrait({ card }: { card: EntryCard }) {
  const art = card.arts[useCycle(card.arts.length)]
  return (
    <Portrait caption={card.caption} fill="bg-dirt-dark">
      <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: art }} />
    </Portrait>
  )
}

function ShareGrid({ rows }: { rows: readonly { key: string; label: string; share: number }[] }) {
  return (
    <div className="grid w-fit grid-cols-[auto_auto] gap-x-6">
      {rows.map(r => (
        <Fragment key={r.key}>
          <div>{r.label}</div>
          <div className="text-right">{m.almanac_pct({ n: Math.round(r.share * 100) })}</div>
        </Fragment>
      ))}
    </div>
  )
}

function MushroomsConcept() {
  return (
    <>
      <div>{m.almanac_mushrooms_p1()}</div>
      <div className="flex gap-2">
        <EntryPortrait card={oneCard({ kind: 'fly-agaric', count: 1 })} />
        <EntryPortrait card={oneCard({ kind: 'truffle', count: 1 })} />
      </div>
      <div>{m.almanac_mushrooms_p2()}</div>
      <ShareGrid rows={WEATHER_KINDS.map(k => ({ key: k, label: WEATHER_NAME[k](), share: MUSHROOM_CHANCE[k] }))} />
      <div>{m.almanac_mushrooms_p3()}</div>
      <ShareGrid rows={VARIETY_TIERS.map(t => ({ key: t, label: tierLabel(t), share: MUSHROOM_TRUFFLE[t] }))} />
      <div>{m.almanac_mushrooms_p4({ days: MUSHROOM_DAYS })}</div>
      <div>{m.almanac_mushrooms_p5({ n: MILL_TRUFFLE_OUT })}</div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'concepts', id: 'infusion' }}>{m.almanac_concept_infusion()}</AlmanacLink>
        {m.almanac_and()}
        <AlmanacLink to={{ tab: 'concepts', id: 'burrow' }}>{m.almanac_concept_burrow()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function InfusionConcept() {
  return (
    <>
      <div>{m.almanac_infusion_p1()}</div>
      <div className="grid w-fit grid-cols-[auto_auto] gap-x-6">
        {INFUSABLE_KINDS.map(k => {
          const [first, second] = INFUSE_REAGENTS[k]
          return (
            <Fragment key={k}>
              <div className="first-letter:uppercase">{infuseGoodsText([k], 'conjunction')}</div>
              <div>{m.almanac_infuse_row({ first: REAGENT_NAME[first](), second: REAGENT_NAME[second]() })}</div>
            </Fragment>
          )
        })}
      </div>
      <div>
        {m.almanac_infusion_p2()}{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'mushrooms' }}>{m.almanac_concept_mushrooms()}</AlmanacLink>
      </div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_and()}
        <AlmanacLink to={{ tab: 'machines', id: 'overview' }}>{m.hud_research_automation()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

const PIPE_JOINS = [PIPE_STUB, PIPE_I, PIPE_L, PIPE_T, PIPE_X] as const

const SILO_IDS: readonly string[] = ['silo-seed', 'silo-spray', 'silo-produce']

function CardPane({ entry, fill }: { entry: CatalogEntry; fill: string }) {
  return (
    <>
      <div className="mb-2 text-lg leading-relaxed text-ink">{entry.title}</div>
      <p className="mb-4 text-base leading-relaxed text-ink/75">{entry.blurb}</p>
      <Portrait caption={entry.title} fill={fill}>
        <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: itemInner(entry.icon) }} />
      </Portrait>
    </>
  )
}

const SENSOR_IDS = [
  'lever',
  'button',
  'lamp',
  'logic',
  'not',
  'pulser',
  'counter',
  'sensor-water',
  'sensor-fert',
  'sensor-harvest',
  'sensor-variety',
  'sensor-weather',
  'sensor-day',
  'vehicle-detector',
] as const

type SensorId = (typeof SENSOR_IDS)[number]

type SensorState = { art: string; caption: () => string }

type SensorPage = { states: readonly SensorState[]; input: () => string; output: () => string }

function onOff(art: (on: boolean) => string): readonly SensorState[] {
  return [
    { art: art(false), caption: () => m.almanac_state_off() },
    { art: art(true), caption: () => m.almanac_state_on() },
  ]
}

const COUNTER_STATES: readonly SensorState[] = [
  ...(['s0', 's1', 's2', 's3'] as const).map(g => ({ art: counterArt(g), caption: () => m.almanac_state_off() })),
  { art: counterArt('s4'), caption: () => m.almanac_state_on() },
]

const SENSOR_PAGE: { readonly [K in SensorId]: SensorPage } = {
  lever: { states: onOff(leverArt), input: () => m.almanac_in_lever(), output: () => m.almanac_out_lever() },
  button: { states: onOff(buttonArt), input: () => m.almanac_in_button(), output: () => m.almanac_out_button() },
  lamp: { states: onOff(lampArt), input: () => m.almanac_in_lamp(), output: () => m.almanac_out_lamp() },
  logic: {
    states: [
      { art: logicArt('or'), caption: () => m.sensors_or() },
      { art: logicArt('and'), caption: () => m.sensors_and() },
    ],
    input: () => m.almanac_in_logic(),
    output: () => m.almanac_out_logic(),
  },
  not: {
    states: [{ art: PROP_NOT, caption: () => m.names_sensor_not() }],
    input: () => m.almanac_in_one(),
    output: () => m.almanac_out_not(),
  },
  pulser: { states: onOff(pulserArt), input: () => m.almanac_in_pulser(), output: () => m.almanac_out_pulser() },
  counter: {
    states: COUNTER_STATES,
    input: () => m.almanac_in_counter(),
    output: () => m.almanac_out_counter({ max: COUNTER_MAX, reset: m.sensors_reset({ n: 0 }) }),
  },
  'sensor-water': { states: onOff(waterSensorArt), input: () => m.almanac_in_watch(), output: () => m.almanac_out_water() },
  'sensor-fert': { states: onOff(fertSensorArt), input: () => m.almanac_in_watch(), output: () => m.almanac_out_fert() },
  'sensor-harvest': {
    states: onOff(harvestSensorArt),
    input: () => m.almanac_in_watch(),
    output: () => m.almanac_out_harvest(),
  },
  'sensor-variety': {
    states: onOff(varietySensorArt),
    input: () => m.almanac_in_watch(),
    output: () => m.almanac_out_variety(),
  },
  'sensor-weather': {
    states: onOff(weatherSensorArt),
    input: () => m.almanac_in_none(),
    output: () => m.almanac_out_weather(),
  },
  'sensor-day': { states: onOff(daySensorArt), input: () => m.almanac_in_none(), output: () => m.almanac_out_day() },
  'vehicle-detector': {
    states: onOff(vehicleDetectorArt),
    input: () => m.almanac_in_pressure(),
    output: () => m.almanac_out_pressure(),
  },
}

function SensorCard({ states }: { states: readonly SensorState[] }) {
  const state = states[useCycle(states.length)]
  return (
    <Portrait caption={state.caption()} fill="bg-grass">
      <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: state.art }} />
    </Portrait>
  )
}

function SensorPane({ entry, page }: { entry: CatalogEntry; page: SensorPage }) {
  return (
    <>
      <div className="mb-2 text-lg leading-relaxed text-ink">{entry.title}</div>
      <p className="mb-4 text-base leading-relaxed text-ink/75">{entry.blurb}</p>
      <SensorCard states={page.states} />
      <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-ink">
        <li>
          <span className="font-semibold">{m.almanac_io_input()}</span> {page.input()}
        </li>
        <li>
          <span className="font-semibold">{m.almanac_io_output()}</span> {page.output()}
        </li>
      </ul>
    </>
  )
}

function skuFill(tab: AlmanacTab, id: string): string {
  if (id === 'sugar' || id === 'ash') return 'bg-water'
  if (tab === 'water' || tab === 'machines' || tab === 'vehicles' || tab === 'sensors') return 'bg-grass'
  if (id === 'chest' || id === 'freezer' || id === 'necronomicon') return 'bg-grass'
  return 'bg-dirt-dark'
}

function Plate({ entry, tab }: { entry: CatalogEntry; tab: AlmanacTab }) {
  return (
    <div className={`flex h-20 w-20 items-center justify-center ${skuFill(tab, entry.id)}`}>
      <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: itemInner(entry.icon) }} />
    </div>
  )
}

function Pane({
  entry,
  done,
  familiarity,
  tab,
  world,
}: {
  entry: CatalogEntry
  done: AlmanacDone
  familiarity: World['familiarity']
  tab: AlmanacTab
  world: World
}) {
  const tree = TREE_IDS.find(id => id === entry.id)
  if (tree !== undefined) return <TreePane key={tree} tree={tree} n={familiarity[tree]} done={done} rules={world.rules} />
  const crop = CROP_IDS.find(id => id === entry.id)
  if (crop !== undefined) return <CropPane key={crop} crop={crop} n={familiarity[crop]} done={done} rules={world.rules} />
  if (entry.id === 'pipe') return <PipePane title={entry.title} blurb={entry.blurb} />
  if (SILO_IDS.includes(entry.id)) return <CardPane entry={entry} fill="bg-grass" />
  const sensor = SENSOR_IDS.find(id => id === entry.id)
  if (sensor !== undefined) return <SensorPane key={sensor} entry={entry} page={SENSOR_PAGE[sensor]} />
  const machine = MACHINE_IDS.find(m => m === entry.id)
  return (
    <>
      <div className="mb-3 text-lg leading-relaxed text-ink">{entry.title}</div>
      <div className="mb-3">
        <Plate entry={entry} tab={tab} />
      </div>
      <div className="text-base leading-relaxed text-ink">{entry.blurb}</div>
      {machine !== undefined && <MachineRecipes machine={machine} world={world} />}
    </>
  )
}

function FormsPane({ title, entries, tab }: { title: string; entries: CatalogEntry[]; tab: AlmanacTab }) {
  const blurbs = [...new Set(entries.map(e => e.blurb))]
  return (
    <>
      <div className="mb-3 text-lg leading-relaxed text-ink">{title}</div>
      <div className="flex flex-col gap-4">
        {blurbs.map(blurb => (
          <div key={blurb}>
            <div className="mb-2 flex flex-wrap gap-3">
              {entries
                .filter(e => e.blurb === blurb)
                .map(e => (
                  <div key={e.id} className="flex w-20 flex-col gap-1">
                    <Plate entry={e} tab={tab} />
                    <div className="text-sm leading-tight text-ink">{e.title}</div>
                  </div>
                ))}
            </div>
            <div className="text-base leading-relaxed text-ink">{blurb}</div>
          </div>
        ))}
      </div>
    </>
  )
}

function MachineRecipes({ machine, world }: { machine: MachineId; world: World }) {
  return (
    <div className="mt-4">
      <div className="mb-1 font-display text-xs leading-none text-ink">{m.hud_recipes()}</div>
      <Recipes view={{ kind: 'list', machine }} size="md" world={world} />
    </div>
  )
}

function PipePane({ title, blurb }: { title: string; blurb: string }) {
  const stage = useCycle(PIPE_JOINS.length)
  return (
    <>
      <div className="mb-3 text-lg leading-relaxed text-ink">{title}</div>
      <div className="mb-3 flex h-20 w-20 items-center justify-center bg-grass">
        <svg
          className="h-16 w-16"
          viewBox="0 0 24 24"
          dangerouslySetInnerHTML={{ __html: PIPE_JOINS[stage] }}
        />
      </div>
      <div className="text-base leading-relaxed text-ink">{blurb}</div>
    </>
  )
}

function fruitFace(crop: GrownCrop, variety: VarietyId, sale: number): Face {
  return { kind: 'fruit', crop, variety, quality: 0, count: 1, unitSale: sale, freshness: 1, cut: false }
}

type Better = 'less' | 'more'

type Scale = { lo: number; hi: number; better: Better }

function scaleOf(values: readonly number[], better: Better): Scale {
  return { lo: Math.min(...values), hi: Math.max(...values), better }
}

function goodness(v: number, s: Scale): number {
  if (s.hi === s.lo) return 1
  const t = (v - s.lo) / (s.hi - s.lo)
  return s.better === 'more' ? t : 1 - t
}

type GroupScales = { water: Scale; range: Scale; fert: Scale; sale: Scale; fresh: Scale }

function groupScales(crops: readonly GrownCrop[]): GroupScales {
  const all = crops.flatMap(crop => VARIETIES[crop].map(variety => statsOf(crop, variety, 0, [])))
  const of = (f: (s: Stats) => number, better: Better) => scaleOf(all.map(f), better)
  return {
    water: of(s => s.waterUsePerSec, 'less'),
    range: of(s => s.waterTolerance, 'more'),
    fert: of(s => s.fertTolerance, 'more'),
    sale: of(s => s.sale, 'more'),
    fresh: of(s => s.rotSeconds, 'more'),
  }
}

const PLANT_SCALES = groupScales(PLANT_CROPS)
const TREE_SCALES = groupScales(TREE_IDS)
const GROW_SCALE = scaleOf(
  PLANT_CROPS.flatMap(crop => VARIETIES[crop].map(variety => statsOf(crop, variety, 0, []).growSeconds)),
  'less',
)
const SEED_SCALE = scaleOf(PLANT_CROPS.map(crop => CROPS[crop].seed), 'less')
const FIRST_FRUIT_SCALE = scaleOf(TREE_IDS.map(id => TREES[id].juvenileSeconds), 'less')
const FRUIT_EVERY_SCALE = scaleOf(TREE_IDS.map(id => TREES[id].fruitSeconds), 'less')

const PURPOSE_LABEL: { readonly [K in Purpose]: () => string } = {
  produce: m.names_purpose_produce,
  processed: m.names_purpose_processed,
  alcohol: m.names_purpose_alcohol,
}

const BEST_NOTE: { readonly [K in Purpose]: (p: { on: number; off: number; crop: string }) => string } = {
  produce: m.almanac_best_produce,
  processed: m.almanac_best_processed,
  alcohol: m.almanac_best_alcohol,
}

type Line =
  | { kind: 'bar'; label: string; value: ReactNode; good: number }
  | { kind: 'note'; label: string; value: string; note: string }
  | { kind: 'unknown'; label: string; left: number }

function round2(n: number): number {
  return Number(n.toFixed(2))
}

function daysText(seconds: number): string {
  return m.almanac_days({ n: round2(days(seconds)) })
}

function entryAt(entry: AlmanacEntry): number {
  const at = ALMANAC_AT.find(a => a.entry === entry)
  if (at === undefined) throw new Error(entry)
  return at.level
}

function studied(n: number, level: number, line: Line): Line {
  return n >= level ? line : { kind: 'unknown', label: line.label, left: level - n }
}

function varietyLines(crop: GrownCrop, variety: VarietyId, n: number, tree: boolean): Line[] {
  if (variety === 'base') return []
  const { tier, purpose } = VARIETY[variety]
  const { on, off } = PURPOSE_MUL[tier]
  const best = studied(n, tier === 'variant' ? VARIANT_PURPOSE_AT : HEIRLOOM_PURPOSE_AT, {
    kind: 'note',
    label: m.almanac_stat_best_for(),
    value: PURPOSE_LABEL[purpose](),
    note: BEST_NOTE[purpose]({ on, off, crop: CROP_NAME[crop]() }),
  })
  if (tier !== 'heirloom' || n < HEIRLOOM_PLACE_AT || !needsNeighbour(variety)) return [best]
  const args = { crop: CROP_NAME[crop](), reach: NEIGHBOUR_REACH }
  return [
    best,
    {
      kind: 'note',
      label: m.almanac_stat_needs(),
      value: m.almanac_neighbour(),
      note: tree ? m.almanac_neighbour_tree(args) : m.almanac_neighbour_plant(args),
    },
  ]
}

function waterLines(st: Stats, g: GroupScales, mid: number, n: number): Line[] {
  return [
    studied(n, entryAt('water'), {
      kind: 'bar',
      label: m.almanac_stat_water_use(),
      value: m.almanac_l_day({ n: round2(st.waterUsePerSec * DAY_SECONDS) }),
      good: goodness(st.waterUsePerSec, g.water),
    }),
    studied(n, entryAt('water'), {
      kind: 'bar',
      label: m.almanac_stat_water_range(),
      value: m.almanac_litres_between({ lo: round2(mid - st.waterTolerance), hi: round2(mid + st.waterTolerance) }),
      good: goodness(st.waterTolerance, g.range),
    }),
  ]
}

function plantLines(crop: GrownCrop, variety: VarietyId, n: number, rules: Rules): Line[] {
  const st = statsOf(crop, variety, 0, [difficultyModifier(rules.difficulty)])
  const g = PLANT_SCALES
  const seed: Line[] =
    variety === 'base'
      ? [{ kind: 'bar', label: m.almanac_stat_seed_price(), value: <Coin n={CROPS[crop].seed} />, good: goodness(CROPS[crop].seed, SEED_SCALE) }]
      : []
  return [
    ...varietyLines(crop, variety, n, false),
    { kind: 'bar', label: m.almanac_stat_sell(), value: <Coin n={st.sale} />, good: goodness(st.sale, g.sale) },
    ...seed,
    studied(n, entryAt('grow'), {
      kind: 'bar',
      label: m.almanac_stat_grow(),
      value: daysText(st.growSeconds),
      good: goodness(st.growSeconds, GROW_SCALE),
    }),
    ...waterLines(st, g, SOIL_WATER_MID, n),
    studied(n, entryAt('fert'), {
      kind: 'bar',
      label: m.almanac_stat_fert(),
      value: m.almanac_fert_above_pct({ n: Math.round(((FERT_PLOT_MAX - st.fertTolerance) / FERT_PLOT_MAX) * 100) }),
      good: goodness(st.fertTolerance, g.fert),
    }),
    studied(n, entryAt('fresh'), {
      kind: 'bar',
      label: m.almanac_stat_fresh(),
      value: daysText(st.rotSeconds),
      good: goodness(st.rotSeconds, g.fresh),
    }),
  ]
}

function treeLines(tree: TreeId, variety: VarietyId, n: number, rules: Rules): Line[] {
  const st = statsOf(tree, variety, 0, [difficultyModifier(rules.difficulty)])
  const def = TREES[tree]
  const g = TREE_SCALES
  return [
    ...varietyLines(tree, variety, n, true),
    { kind: 'bar', label: m.almanac_stat_sell(), value: <Coin n={st.sale} />, good: goodness(st.sale, g.sale) },
    studied(n, entryAt('grow'), {
      kind: 'bar',
      label: m.almanac_stat_first_fruit(),
      value: daysText(def.juvenileSeconds),
      good: goodness(def.juvenileSeconds, FIRST_FRUIT_SCALE),
    }),
    studied(n, entryAt('grow'), {
      kind: 'bar',
      label: m.almanac_stat_fruit_every(),
      value: m.almanac_days_in_season({ n: round2(days(def.fruitSeconds / (TREE_RATE_ON + TREE_RATE_HAPPY))) }),
      good: goodness(def.fruitSeconds, FRUIT_EVERY_SCALE),
    }),
    ...waterLines(st, g, TREE_WATER_MID, n),
    studied(n, entryAt('fert'), {
      kind: 'bar',
      label: m.almanac_stat_fert(),
      value: m.almanac_fert_above_litres({ n: round2(TREE_FERT_MAX - st.fertTolerance) }),
      good: goodness(st.fertTolerance, g.fert),
    }),
    studied(n, entryAt('fresh'), {
      kind: 'bar',
      label: m.almanac_stat_fresh(),
      value: daysText(st.rotSeconds),
      good: goodness(st.rotSeconds, g.fresh),
    }),
  ]
}

function foundVarieties(crop: GrownCrop, n: number): VarietyId[] {
  return VARIETIES[crop].filter(v => {
    const tier = tierOf(v)
    if (tier === 'base') return true
    return n >= (tier === 'variant' ? VARIANT_AT : HEIRLOOM_AT)
  })
}

function varietyLabel(variety: VarietyId): string {
  return variety === 'base' ? m.almanac_variety_plain() : varietyName(variety)
}

function Portrait({ caption, fill, children }: { caption: string; fill: string; children: ReactNode }) {
  return (
    <div
      className={`relative flex h-32 w-24 shrink-0 items-start justify-center overflow-hidden rounded-lg border-2 border-ink/25 pt-3 shadow-sm shadow-ink/15 ${fill}`}
    >
      {children}
      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink/75 to-transparent px-1 pt-5 pb-1.5 text-center text-sm leading-tight font-semibold text-white">
        {caption}
      </div>
    </div>
  )
}

function PlantGrowing({ crop, variety }: { crop: GrownCrop; variety: VarietyId }) {
  const stage = STAGES[useCycle(STAGES.length)]
  return (
    <svg
      className="h-16 w-16"
      viewBox="0 0 24 24"
      dangerouslySetInnerHTML={{ __html: cropInner(crop, stage === 'ripe' ? ripeGroup(variety) : stage) }}
    />
  )
}

function TreeGrowing({ tree, variety }: { tree: TreeId; variety: VarietyId }) {
  const stage = TREE_STAGES[useCycle(TREE_STAGES.length)]
  return <svg className="h-20 w-10" viewBox="0 0 24 48" dangerouslySetInnerHTML={{ __html: treeStage(tree, stage, variety) }} />
}

const RATING_DOTS = [0, 1, 2, 3, 4] as const

function Rating({ good }: { good: number }) {
  const score = 1 + 4 * good
  return (
    <div aria-hidden className="flex gap-1">
      {RATING_DOTS.map(i => (
        <div key={i} className="h-2.5 w-2.5 overflow-hidden rounded-full bg-ink/12">
          <div
            className="h-full bg-grass transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${Math.min(1, Math.max(0, score - i)) * 100}%` }}
          />
        </div>
      ))}
    </div>
  )
}

function LineCells({ line }: { line: Line }) {
  const label = <span className="text-base text-ink">{line.label}</span>
  switch (line.kind) {
    case 'bar':
      return (
        <>
          {label}
          <Rating good={line.good} />
          <span className="text-base text-ink tabular-nums">{line.value}</span>
        </>
      )
    case 'note':
      return (
        <>
          {label}
          <span className="col-span-2 text-base font-semibold text-ink">{line.value}</span>
          <p className="col-span-3 -mt-1 mb-1 text-sm leading-snug text-ink/60">{line.note}</p>
        </>
      )
    case 'unknown':
      return (
        <>
          {label}
          <span className="col-span-2 text-sm text-ink/40 italic">
            {line.left === 1 ? m.almanac_study_hint_once() : m.almanac_study_hint({ n: line.left })}
          </span>
        </>
      )
  }
}

function CropShell({
  crop,
  n,
  done,
  ground,
  growing,
  lines,
}: {
  crop: GrownCrop
  n: number
  done: AlmanacDone
  ground: string
  growing: (variety: VarietyId) => ReactNode
  lines: (variety: VarietyId) => Line[]
}) {
  const [variety, setVariety] = useState<VarietyId>('base')
  const found = foundVarieties(crop, n)
  const fruit = (v: VarietyId) => fruitFace(crop, v, statsOf(crop, v, 0, []).sale)
  const products = recipesUsing(fruit(variety)).filter(r => recipeOpen(r.machine, done))
  return (
    <>
      <div className="mb-2 text-lg leading-relaxed text-ink">{CROP_NAME[crop]()}</div>
      <p className="mb-4 text-base leading-relaxed text-ink/75">{CROPS[crop].desc()}</p>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Portrait caption={m.almanac_caption_fruit()} fill="bg-dirt-dark">
          <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: faceGfx(fruit(variety)) }} />
        </Portrait>
        <Portrait caption={m.almanac_caption_growing()} fill={ground}>
          {growing(variety)}
        </Portrait>
        {products.length > 0 && <ProductArrow />}
        {products.map((recipe, i) => (
          <ProductPortrait key={i} recipe={recipe} />
        ))}
      </div>
      <Tabs.Root
        value={variety}
        onValueChange={v => {
          const next = found.find(x => x === v)
          if (next === undefined) throw new Error(v)
          setVariety(next)
        }}
      >
        {VARIETIES[crop].length > 1 && (
          <Tabs.List className={`mb-3 ${tabSelectListClass}`}>
            {found.map(v => (
              <Tabs.Trigger key={v} value={v} className={tabSelectClass}>
                {varietyLabel(v)}
              </Tabs.Trigger>
            ))}
            {found.length < VARIETIES[crop].length && (
              <Tabs.Trigger value="unknown" disabled className={tabSelectClass}>
                {m.almanac_variety_unknown()}
              </Tabs.Trigger>
            )}
          </Tabs.List>
        )}
        {found.map(v => (
          <Tabs.Content key={v} value={v}>
            <div className="grid grid-cols-[max-content_5rem_1fr] items-center gap-x-3 gap-y-2">
              {lines(v).map(line => (
                <LineCells key={line.label} line={line} />
              ))}
            </div>
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </>
  )
}

function CropPane({ crop, n, done, rules }: { crop: GrownCrop; n: number; done: AlmanacDone; rules: Rules }) {
  return (
    <CropShell
      crop={crop}
      n={n}
      done={done}
      ground="bg-dirt-dark"
      growing={v => <PlantGrowing crop={crop} variety={v} />}
      lines={v => plantLines(crop, v, n, rules)}
    />
  )
}

function TreePane({ tree, n, done, rules }: { tree: TreeId; n: number; done: AlmanacDone; rules: Rules }) {
  return (
    <CropShell
      crop={tree}
      n={n}
      done={done}
      ground="bg-grass"
      growing={v => <TreeGrowing tree={tree} variety={v} />}
      lines={v => treeLines(tree, v, n, rules)}
    />
  )
}

type Cell = { kind: 'value'; value: ReactNode } | { kind: 'prize' }

type StatRow = { label: string; cells: readonly Cell[] }

function priceRow(prices: readonly Price[]): StatRow {
  return {
    label: m.almanac_stat_price(),
    cells: prices.map((p): Cell => (p.kind === 'sku' ? { kind: 'value', value: <Coin n={SKUS[p.sku].price} /> } : { kind: 'prize' })),
  }
}

function familyRows(family: ToolFamily, world: World): StatRow[] {
  switch (family.kind) {
    case 'work':
      return [
        priceRow(family.tools.map(t => t.price)),
        {
          label: m.almanac_stat_durability(),
          cells: family.tools.map((t): Cell => ({ kind: 'value', value: m.almanac_uses({ n: t.uses }) })),
        },
        {
          label: m.almanac_stat_use_time(),
          cells: family.tools.map((t): Cell => ({ kind: 'value', value: m.almanac_seconds({ n: Math.round(world.realSeconds(t.workSeconds)) }) })),
        },
      ]
    case 'hold':
      return [
        priceRow(family.tools.map(t => t.price)),
        {
          label: m.almanac_stat_content(),
          cells: family.tools.map((t): Cell => ({ kind: 'value', value: m.almanac_litres({ n: t.liters }) })),
        },
      ]
  }
}

function StatCell({ cell }: { cell: Cell }) {
  switch (cell.kind) {
    case 'value':
      return <span className="text-center text-base text-ink tabular-nums">{cell.value}</span>
    case 'prize':
      return <span className="text-center text-sm leading-tight text-ink/60">{m.almanac_price_prize()}</span>
  }
}

function ToolPane({ title, family, byId, world }: { title: string; family: ToolFamily; byId: Map<string, CatalogEntry>; world: World }) {
  const ids = toolIds(family)
  return (
    <>
      <div className="mb-2 text-lg leading-relaxed text-ink">{title}</div>
      <p className="mb-4 text-base leading-relaxed text-ink/75">{family.desc()}</p>
      <div
        className="grid items-center gap-x-4 gap-y-3"
        style={{ gridTemplateColumns: `repeat(${ids.length}, 6rem) max-content` }}
      >
        {ids.map(id => {
          const entry = skuEntry(byId, id)
          return (
            <Portrait key={id} caption={entry.title} fill="bg-dirt-dark">
              <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: itemInner(entry.icon) }} />
            </Portrait>
          )
        })}
        <span />
        {familyRows(family, world).map(row => (
          <Fragment key={row.label}>
            {row.cells.map((cell, i) => (
              <StatCell key={i} cell={cell} />
            ))}
            <span className="text-base text-ink/65">{row.label}</span>
          </Fragment>
        ))}
      </div>
    </>
  )
}

function recipeOpen(machine: MachineId, done: AlmanacDone): boolean {
  switch (machine) {
    case 'mill':
      return done.grinder
    case 'jam':
      return done.preservatives
    case 'still':
    case 'barrel':
      return done.fermentation
    case 'grinder':
    case 'compost-box':
    case 'refuel':
      return false
    case 'furnace':
      return done.furnace
    case 'infuser':
      return done.infusion
  }
}

function yieldFace(recipe: Recipe): Face {
  return recipe.out.kind === 'exact' ? recipe.out.face : recipe.out.faces[0]
}

function yieldSale(recipe: Recipe): number | undefined {
  const face = yieldFace(recipe)
  return 'unitSale' in face ? face.unitSale : undefined
}

function RecipeSale({ recipe }: { recipe: Recipe }) {
  const sale = yieldSale(recipe)
  if (sale === undefined) return null
  return <Coin n={sale} />
}

function ProductArrow() {
  return (
    <span className="relative block h-6 w-12 shrink-0">
      <svg
        viewBox="0 0 24 24"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        dangerouslySetInnerHTML={{ __html: UI_ARROW_INK }}
      />
      <svg
        viewBox="0 0 24 24"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        dangerouslySetInnerHTML={{ __html: UI_ARROW_FILL }}
      />
    </span>
  )
}

function ProductPortrait({ recipe }: { recipe: Recipe }) {
  const setTip = useContext(AlmanacTip)
  const face = yieldFace(recipe)
  return (
    <div onPointerEnter={() => setTip({ title: faceName(face), recipe })} onPointerLeave={() => setTip(undefined)}>
      <Portrait caption={faceName(face)} fill="bg-water">
        <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: faceGfx(face) }} />
      </Portrait>
    </div>
  )
}
