import { m } from '../../paraglide/messages.js'
import { createContext, useContext, useState, type ReactNode } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { catalogEntries, type CatalogEntry } from '../defs/catalog.ts'
import { CROPS, cropVariety } from '../defs/crops.ts'
import { RATING_SALE, VARIETIES, useOf, type Rating, type VarietyId } from '../defs/varieties.ts'
import { JAM_ROT, SKILLS } from '../defs/skills.ts'
import { TREES, TREE_OFF_MUL, TREE_YIELD_DAYS, TREE_YIELD_MUL } from '../defs/trees.ts'
import { ANNUAL_IDS, TREE_IDS, type CropId, type TreeId } from '../sim/ids.ts'
import { faceName, type Face } from '../sim/item.ts'
import { statsOf } from '../sim/modifiers.ts'
import { FERT_PLOT_MAX, SOIL_WATER_MID } from '../sim/soil.ts'
import { DAY_SECONDS, days } from '../sim/clock.ts'
import type { World } from '../sim/world.ts'
import { MILL_IN, SUGAR_BAG } from '../defs/items.ts'
import { cropInner, faceGfx, itemInner, meterInner, PIPE_I, PIPE_L, PIPE_STUB, PIPE_T, PIPE_X, ripeGroup, treeStage } from '../view/svgs.ts'
import { CalloutHover } from './callout-hover.tsx'
import { Coin, Overlay, tabTriggerClass } from './frame.tsx'
import { useCycle } from './cycle.ts'
import { MACHINE_IDS, recipesUsing, type MachineId, type Recipe } from '../sim/recipe.ts'
import { Recipes } from './recipe.tsx'

type AlmanacTab =
  | 'seeds'
  | 'trees'
  | 'utility'
  | 'sensors'
  | 'automation'
  | 'water'
  | 'building'
  | 'concepts'

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
  | 'automation'

type AlmanacNav = { tab: AlmanacTab; id: string }

type ListRow =
  | { kind: 'overview' }
  | { kind: 'concept'; id: ConceptId }
  | { kind: 'sku'; id: string }

const SEED_IDS = [
  'carrot',
  'potato',
  'wheat',
  'tomato',
  'raspberry',
  'grape',
  'vanilla',
  'sugar-cane',
  'soil',
  'weed',
  'grass-seeds',
  'grass',
  'rotten',
  'dead',
]
const TREE_TAB_IDS = [...TREE_IDS]
const UTIL_IDS = [
  'shovel',
  'better-shovel',
  'pickaxe',
  'better-pickaxe',
  'axe',
  'bucket',
  'large-bucket',
  'fertilizer',
  'synth-fertilizer',
  'weed-spray',
  'compost',
  'sugar',
  'wood',
  'ash',
  'rotary-shovel',
  'diamond-pickaxe',
]
const SENSOR_IDS = [
  'lever',
  'button',
  'lamp',
  'or',
  'and',
  'not',
  'pulser',
  'counter',
  'sensor-water',
  'sensor-fert',
  'sensor-harvest',
  'water-system',
  'vehicle-detector',
  'traffic-light',
  'sensor-day',
]
const AUTO_IDS = [
  'chest',
  'grinder',
  'compost-box',
  'mill',
  'furnace',
  'station',
  'still',
  'barrel',
  'jam',
  'freezer',
  'hangar',
  'silo-seed',
  'silo-spray',
  'silo-produce',
]
const WATER_IDS = [
  'pumpjack',
  'well',
  'rain-tank',
  'tap',
  'pipe',
  'valve',
  'sprinkler',
  'sprinkler-vert',
  'sprinkler-large',
]
const BUILD_IDS = ['fence', 'tile-cobble', 'tile-brick', 'tile-paved']
const CONCEPT_IDS: ConceptId[] = [
  'variety',
  'quality',
  'freshness',
  'happiness',
  'day',
  'market',
  'skills',
  'family',
  'research',
  'automation',
]

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
  automation: () => m.hud_research_automation(),
}

const TABS: { id: AlmanacTab; label: () => string }[] = [
  { id: 'seeds', label: () => m.almanac_tab_seeds() },
  { id: 'trees', label: () => m.almanac_tab_trees() },
  { id: 'utility', label: () => m.almanac_tab_utility() },
  { id: 'sensors', label: () => m.almanac_tab_sensors() },
  { id: 'automation', label: () => m.hud_research_automation() },
  { id: 'water', label: () => m.almanac_tab_water() },
  { id: 'building', label: () => m.almanac_tab_building() },
  { id: 'concepts', label: () => m.almanac_tab_concepts() },
]

const CROP_IDS = [...ANNUAL_IDS] as CropId[]

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

function rowsOf(tab: AlmanacTab): ListRow[] {
  switch (tab) {
    case 'seeds':
      return [{ kind: 'overview' }, ...SEED_IDS.map(id => ({ kind: 'sku' as const, id }))]
    case 'trees':
      return TREE_TAB_IDS.map(id => ({ kind: 'sku' as const, id }))
    case 'utility':
      return UTIL_IDS.map(id => ({ kind: 'sku' as const, id }))
    case 'sensors':
      return [{ kind: 'overview' }, ...SENSOR_IDS.map(id => ({ kind: 'sku' as const, id }))]
    case 'automation':
      return [{ kind: 'overview' }, ...AUTO_IDS.map(id => ({ kind: 'sku' as const, id }))]
    case 'water':
      return WATER_IDS.map(id => ({ kind: 'sku' as const, id }))
    case 'building':
      return BUILD_IDS.map(id => ({ kind: 'sku' as const, id }))
    case 'concepts':
      return CONCEPT_IDS.map(id => ({ kind: 'concept' as const, id }))
  }
}

function rowId(row: ListRow): string {
  switch (row.kind) {
    case 'overview':
      return 'overview'
    case 'concept':
    case 'sku':
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

function colMin(key: 'growSeconds' | 'waterUsePerSec' | 'sale' | 'seed' | 'rotSeconds'): number {
  return Math.min(...CROP_IDS.map(id => CROPS[id][key]))
}

function colMax(key: 'growSeconds' | 'waterUsePerSec' | 'sale' | 'seed' | 'rotSeconds'): number {
  return Math.max(...CROP_IDS.map(id => CROPS[id][key]))
}

function meterN(v: number, min: number, max: number): number {
  if (max === min) return 3
  return 1 + Math.round((4 * (v - min)) / (max - min))
}

function liters(n: number): string {
  return `${Number(n.toFixed(2))}L`
}

const STAGES = ['sprout', 'grow', 'ripe'] as const

export function Almanac({ world, onClose }: { world: World; onClose: () => void }) {
  const entries = catalogEntries()
  const [tab, setTab] = useState<AlmanacTab>('seeds')
  const [id, setId] = useState(firstId('seeds'))
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
                <Recipes view={{ kind: 'one', recipe: tip.recipe }} size="sm" />
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
              {rows.map(r => {
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
                    {r.kind === 'sku' ? (
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
                done={{
                  fermentation: world.done.has('unlock-fermentation'),
                  grinder: world.done.has('unlock-grinder'),
                  preservatives: world.done.has('unlock-preservatives'),
                  furnace: world.done.has('unlock-furnace'),
                }}
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

type AlmanacDone = { fermentation: boolean; grinder: boolean; preservatives: boolean; furnace: boolean }

function RowPane({
  row,
  byId,
  done,
  tab,
}: {
  row: ListRow
  byId: Map<string, CatalogEntry>
  done: AlmanacDone
  tab: AlmanacTab
}) {
  switch (row.kind) {
    case 'overview':
      return <OverviewPane tab={tab} />
    case 'concept':
      return <ConceptPane id={row.id} />
    case 'sku':
      return <Pane entry={skuEntry(byId, row.id)} done={done} tab={tab} />
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
    case 'seeds':
      return <SeedsOverview />
    case 'sensors':
      return <SensorsOverview />
    case 'automation':
      return <AutomationOverview />
    case 'trees':
    case 'utility':
    case 'water':
    case 'building':
    case 'concepts':
      throw new Error(tab)
  }
}

function SeedsOverview() {
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
        <AlmanacLink to={{ tab: 'concepts', id: 'automation' }}>{m.hud_research_automation()}</AlmanacLink>
        {m.almanac_sensors_p3_a()}
      </div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'concepts', id: 'automation' }}>{m.hud_research_automation()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function AutomationOverview() {
  return (
    <>
      <div>
        {m.almanac_auto_p1_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_auto_p1_b()}
      </div>
      <div>
        {m.almanac_auto_p2_a()}
        <AlmanacLink to={{ tab: 'automation', id: 'mill' }}>{m.names_building_mill()}</AlmanacLink>
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

function ConceptPane({ id }: { id: ConceptId }) {
  return (
    <>
      <div className="mb-3 text-lg leading-relaxed text-ink">{CONCEPT_LABEL[id]()}</div>
      <div className="flex flex-col gap-3 text-base leading-relaxed text-ink">{conceptBody(id)}</div>
    </>
  )
}

function conceptBody(id: ConceptId) {
  switch (id) {
    case 'variety':
      return <VarietyConcept />
    case 'quality':
      return <QualityConcept />
    case 'freshness':
      return <FreshnessConcept />
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
    case 'automation':
      return <AutomationConcept />
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

function FreshnessConcept() {
  const full = 80
  return (
    <>
      <div>
        {m.almanac_fresh_p1_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_fresh_p1_b()}
      </div>
      <div>
        {m.almanac_fresh_p2_a()}
        <AlmanacLink to={{ tab: 'seeds', id: 'rotten' }}>{m.almanac_rotten_produce()}</AlmanacLink>
        {m.almanac_fresh_p2_b()}
        <AlmanacLink to={{ tab: 'automation', id: 'chest' }}>{m.names_building_chest()}</AlmanacLink>
        {m.almanac_fresh_p2_c()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.market_sell_all_label()}</AlmanacLink>
        {m.almanac_fresh_p2_d()}
        <AlmanacLink to={{ tab: 'automation', id: 'freezer' }}>{m.names_building_freezer()}</AlmanacLink>
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
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{SKILLS.clearance.name}</AlmanacLink>
        {m.almanac_fresh_p3_f()}
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
        <AlmanacLink to={{ tab: 'seeds', id: 'dead' }}>{m.almanac_dead_plant()}</AlmanacLink>
        {m.almanac_happy_p4_b()}
        <AlmanacLink to={{ tab: 'seeds', id: 'rotten' }}>{m.almanac_rotten_produce()}</AlmanacLink>
        {m.almanac_happy_p4_c()}
        <AlmanacLink to={{ tab: 'seeds', id: 'dead' }}>{m.almanac_dead_plant()}</AlmanacLink>
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
        {m.almanac_day_p3_b()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{SKILLS['open-late'].name}</AlmanacLink>
        {m.almanac_day_p3_c()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{SKILLS['open-24'].name}</AlmanacLink>
        {m.almanac_day_p3_d()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.market_sell_all_label()}</AlmanacLink>
        {m.almanac_day_p3_e()}
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
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{SKILLS.bio.name}</AlmanacLink>
        {m.almanac_market_p3_f({ bio: 4 })}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{SKILLS.jam.name}</AlmanacLink>
        {m.almanac_market_p3_g({ jam: JAM_ROT * 100 })}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{SKILLS.clearance.name}</AlmanacLink>
        {m.almanac_market_p3_h()}
        <Coin n={1} />
        {m.almanac_market_p3_i()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{SKILLS['open-late'].name}</AlmanacLink>
        {m.almanac_market_p3_j()}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>{SKILLS['open-24'].name}</AlmanacLink>
        {m.almanac_market_p3_k()}
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
        <AlmanacLink to={{ tab: 'concepts', id: 'automation' }}>{m.almanac_word_machines()}</AlmanacLink>
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
        <AlmanacLink to={{ tab: 'concepts', id: 'automation' }}>{m.hud_research_automation()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

function AutomationConcept() {
  return (
    <>
      <div>
        {m.almanac_auto_c_p1_a()}
        <AlmanacLink to={{ tab: 'automation', id: 'mill' }}>{m.names_building_mill()}</AlmanacLink>
        {m.almanac_auto_c_p1_b()}
      </div>
      <div>
        {m.almanac_auto_c_p2_a()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_auto_c_p2_b()}
        <AlmanacLink to={{ tab: 'automation', id: 'chest' }}>{m.names_building_chest()}</AlmanacLink>
        {m.almanac_auto_c_p2_c()}
        <AlmanacLink to={{ tab: 'automation', id: 'freezer' }}>{m.names_building_freezer()}</AlmanacLink>
        {m.almanac_auto_c_p2_d()}
        <AlmanacLink to={{ tab: 'automation', id: 'freezer' }}>{m.names_building_freezer()}</AlmanacLink>
        {m.almanac_auto_c_p2_e()}
        <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>{m.almanac_losing_freshness()}</AlmanacLink>
        {m.almanac_auto_c_p2_f()}
        <AlmanacLink to={{ tab: 'automation', id: 'hangar' }}>{m.names_building_hangar()}</AlmanacLink>
        {m.almanac_auto_c_p2_g()}
      </div>
      <div>
        {m.almanac_auto_c_p3_a()}
        <AlmanacLink to={{ tab: 'sensors', id: 'overview' }}>{m.almanac_sensors_at_overview()}</AlmanacLink>
        {m.almanac_auto_c_p3_b()}
        <AlmanacLink to={{ tab: 'water', id: 'valve' }}>{m.names_building_valve()}</AlmanacLink>
        {m.almanac_auto_c_p3_c()}
      </div>
      <div>
        {m.almanac_see()}
        <AlmanacLink to={{ tab: 'concepts', id: 'research' }}>{m.names_role_research()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>{m.names_role_market()}</AlmanacLink>
        {m.almanac_comma()}
        <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>{m.almanac_concept_freshness()}</AlmanacLink>
        {m.almanac_and()}
        <AlmanacLink to={{ tab: 'concepts', id: 'happiness' }}>{m.almanac_concept_happiness()}</AlmanacLink>
        {m.almanac_period()}
      </div>
    </>
  )
}

const PIPE_JOINS = [PIPE_STUB, PIPE_I, PIPE_L, PIPE_T, PIPE_X] as const

function skuFill(tab: AlmanacTab, id: string): string {
  if (id === 'sugar' || id === 'ash') return 'bg-water'
  if (tab === 'sensors' || tab === 'automation' || tab === 'water') return 'bg-grass'
  return 'bg-dirt-dark'
}

function Pane({ entry, done, tab }: { entry: CatalogEntry; done: AlmanacDone; tab: AlmanacTab }) {
  const tree = TREE_IDS.find(id => id === entry.id)
  if (tree !== undefined) return <TreePane id={tree} done={done} />
  const crop = CROP_IDS.find(id => id === entry.id)
  if (crop !== undefined) return <CropPane id={crop} done={done} />
  if (entry.id === 'pipe') return <PipePane title={entry.title} blurb={entry.blurb} />
  const machine = MACHINE_IDS.find(m => m === entry.id)
  return (
    <>
      <div className="mb-3 text-lg leading-relaxed text-ink">{entry.title}</div>
      <div className={`mb-3 flex h-20 w-20 items-center justify-center ${skuFill(tab, entry.id)}`}>
        <svg
          className="h-16 w-16"
          viewBox="0 0 24 24"
          dangerouslySetInnerHTML={{ __html: itemInner(entry.icon) }}
        />
      </div>
      <div className="text-base leading-relaxed text-ink">{entry.blurb}</div>
      {machine !== undefined && <MachineRecipes machine={machine} />}
    </>
  )
}

function MachineRecipes({ machine }: { machine: MachineId }) {
  return (
    <div className="mt-4">
      <div className="mb-1 font-display text-xs leading-none text-ink">{m.hud_recipes()}</div>
      <Recipes view={{ kind: 'list', machine }} size="md" />
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

const BASE_VARIETY_DESC: { readonly [K in CropId]: () => string } = {
  carrot: () => m.almanac_variety_desc_carrot(),
  potato: () => m.almanac_variety_desc_potato(),
  wheat: () => m.almanac_variety_desc_wheat(),
  tomato: () => m.almanac_variety_desc_tomato(),
  raspberry: () => m.almanac_variety_desc_raspberry(),
  grape: () => m.almanac_variety_desc_grape(),
  vanilla: () => m.almanac_variety_desc_vanilla(),
  'sugar-cane': () => m.almanac_variety_desc_sugar_cane(),
  apple: () => m.almanac_variety_desc_apple(),
  apricot: () => m.almanac_variety_desc_apricot(),
  olive: () => m.almanac_variety_desc_olive(),
  cherry: () => m.almanac_variety_desc_cherry(),
}

const NAMED_VARIETY_DESC: { readonly [K in Exclude<VarietyId, 'base'>]: () => string } = {
  bintje: () => m.almanac_variety_desc_bintje(),
  'russian-banana': () => m.almanac_variety_desc_russian_banana(),
  sonora: () => m.almanac_variety_desc_sonora(),
  'red-fife': () => m.almanac_variety_desc_red_fife(),
  'green-zebra': () => m.almanac_variety_desc_green_zebra(),
  'san-marzano': () => m.almanac_variety_desc_san_marzano(),
  'black-raspberry': () => m.almanac_variety_desc_black_raspberry(),
  concord: () => m.almanac_variety_desc_concord(),
  thompson: () => m.almanac_variety_desc_thompson(),
  keknyelu: () => m.almanac_variety_desc_keknyelu(),
  'kingston-black': () => m.almanac_variety_desc_kingston_black(),
  'pink-lady': () => m.almanac_variety_desc_pink_lady(),
  moorpark: () => m.almanac_variety_desc_moorpark(),
  klosterneuburger: () => m.almanac_variety_desc_klosterneuburger(),
  blenheim: () => m.almanac_variety_desc_blenheim(),
  kalamata: () => m.almanac_variety_desc_kalamata(),
  arbequina: () => m.almanac_variety_desc_arbequina(),
  montmorency: () => m.almanac_variety_desc_montmorency(),
  bing: () => m.almanac_variety_desc_bing(),
}

function varietyDesc(crop: CropId, v: VarietyId): string {
  if (v === 'base') return BASE_VARIETY_DESC[crop]()
  return NAMED_VARIETY_DESC[v]()
}

function pathLabel(path: 'preserve' | 'fresh' | 'alcohol'): string {
  if (path === 'preserve') return m.names_path_preserve()
  if (path === 'fresh') return m.names_path_fresh()
  return m.names_path_alcohol()
}

function PathLine({ path, rating }: { path: 'preserve' | 'fresh' | 'alcohol'; rating: Rating | 'none' }) {
  if (rating === 'none') return null
  return (
    <div className="text-sm">
      {pathLabel(path)} {rating}
    </div>
  )
}

function fruitFace(crop: CropId, variety: VarietyId, sale: number): Face {
  return { kind: 'fruit', crop, variety, quality: 0, count: 1, unitSale: sale, freshness: 1, bio: true, cut: false }
}

function VarietyRow({
  crop,
  selected,
  onSelect,
}: {
  crop: CropId
  selected: VarietyId
  onSelect: (v: VarietyId) => void
}) {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {VARIETIES[crop].map(v => {
        const use = useOf(crop, v)
        return (
          <button
            key={v}
            type="button"
            onClick={() => onSelect(v)}
            className={`flex min-w-24 flex-col gap-1 px-2 py-2 text-left ${v === selected ? 'bg-dirt' : 'bg-ink/6 hover:bg-ink/12'}`}
          >
            <div className="flex h-20 w-20 items-center justify-center bg-dirt-dark">
              <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: faceGfx(fruitFace(crop, v, 0)) }} />
            </div>
            <div className="text-sm font-semibold">{cropVariety(crop, v)}</div>
            <PathLine path="preserve" rating={use.preserve} />
            <PathLine path="fresh" rating={use.fresh} />
            <PathLine path="alcohol" rating={use.alcohol} />
            <div className="text-sm text-ink/70">{varietyDesc(crop, v)}</div>
          </button>
        )
      })}
    </div>
  )
}

function CropPane({ id, done }: { id: CropId; done: AlmanacDone }) {
  const d = CROPS[id]
  const [preview, setPreview] = useState<VarietyId>('base')
  const stage = useCycle(3)
  const ripe = ripeGroup(id, preview)
  const st = statsOf(id, preview, 0, [])
  const product = faceGfx(fruitFace(id, preview, st.sale))
  const plant = STAGES[stage] === 'ripe' ? ripe : STAGES[stage]
  return (
    <>
      <div className="mb-2 text-lg leading-relaxed text-ink">{cropVariety(id, preview)}</div>
      <div className="mb-3 text-base leading-relaxed text-ink/70">{d.desc()}</div>
      {id === 'sugar-cane' ? (
        <div className="mb-3 text-base leading-relaxed text-ink/70">{m.almanac_mill_cane({ cane: MILL_IN, liters: SUGAR_BAG })}</div>
      ) : null}
      <div className="mb-3 flex flex-wrap gap-3">
        <div className="flex h-20 w-20 items-center justify-center bg-dirt-dark">
          <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: product }} />
        </div>
        <div className="flex h-20 w-20 items-center justify-center bg-dirt-dark">
          <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: cropInner(id, plant) }} />
        </div>
      </div>
      <VarietyRow crop={id} selected={preview} onSelect={setPreview} />
      <div className="flex flex-col gap-2 text-base text-ink">
        <Stat
          label={m.almanac_stat_grow()}
          n={meterN(d.growSeconds, colMin('growSeconds'), colMax('growSeconds'))}
          kind={{ t: 'raw', raw: m.almanac_days({ n: Number(days(st.growSeconds).toFixed(2)) }) }}
        />
        <Stat
          label={m.almanac_stat_drink()}
          n={meterN(d.waterUsePerSec, colMin('waterUsePerSec'), colMax('waterUsePerSec'))}
          kind={{ t: 'raw', raw: m.almanac_l_day({ n: Number((d.waterUsePerSec * DAY_SECONDS).toPrecision(1)) }) }}
        />
        <Stat
          label={m.almanac_stat_water_range()}
          n={meterN(st.waterTolerance, 0.25, 1)}
          kind={{ t: 'raw', raw: `${liters(SOIL_WATER_MID - st.waterTolerance)}–${liters(SOIL_WATER_MID + st.waterTolerance)}` }}
        />
        <Stat
          label={m.hud_fertilizer()}
          n={meterN(st.fertTolerance, 0.25, 1)}
          kind={{ t: 'raw', raw: m.almanac_happy_above({ n: Math.round((FERT_PLOT_MAX - st.fertTolerance) * 100) }) }}
        />
        <Stat label={m.almanac_stat_sell()} n={meterN(d.sale, colMin('sale'), colMax('sale'))} kind={{ t: 'coin', n: st.sale }} />
        <Stat
          label={m.almanac_stat_seed_price()}
          n={meterN(d.seed, colMin('seed'), colMax('seed'))}
          kind={{ t: 'coin', n: d.seed }}
        />
        <Stat
          label={m.almanac_concept_freshness()}
          n={meterN(d.rotSeconds, colMin('rotSeconds'), colMax('rotSeconds'))}
          kind={{ t: 'raw', raw: m.almanac_days({ n: Number(days(st.rotSeconds).toFixed(2)) }) }}
        />
      </div>
      <Ingredients face={fruitFace(id, preview, st.sale)} done={done} />
    </>
  )
}

function treeMin(key: 'juvenileSeconds' | 'fruitSeconds'): number {
  return Math.min(...TREE_IDS.map(id => TREES[id][key]))
}

function treeMax(key: 'juvenileSeconds' | 'fruitSeconds'): number {
  return Math.max(...TREE_IDS.map(id => TREES[id][key]))
}

function treeSaleMin(): number {
  return Math.min(...TREE_IDS.map(id => CROPS[id].sale))
}

function treeSaleMax(): number {
  return Math.max(...TREE_IDS.map(id => CROPS[id].sale))
}

function treeRotMin(): number {
  return Math.min(...TREE_IDS.map(id => CROPS[id].rotSeconds))
}

function treeRotMax(): number {
  return Math.max(...TREE_IDS.map(id => CROPS[id].rotSeconds))
}

function TreePane({ id, done }: { id: TreeId; done: AlmanacDone }) {
  const d = CROPS[id]
  const def = TREES[id]
  const [preview, setPreview] = useState<VarietyId>('base')
  const stages = ['trunk', 'grow', 'unripe', 'ripe'] as const
  const stage = useCycle(stages.length)
  const st = statsOf(id, preview, 0, [])
  const every = 1 / def.fruitSeconds
  const everyMin = 1 / treeMax('fruitSeconds')
  const everyMax = 1 / treeMin('fruitSeconds')
  const sale = d.sale * RATING_SALE[useOf(id, preview).fresh]
  return (
    <>
      <div className="mb-2 text-lg leading-relaxed text-ink">{cropVariety(id, preview)}</div>
      <div className="mb-3 text-base leading-relaxed text-ink/70">{d.desc()}</div>
      <div className="mb-3 text-base leading-relaxed text-ink/70">
        {m.almanac_tree_drops({ days: TREE_YIELD_DAYS, mul: TREE_YIELD_MUL, off: TREE_OFF_MUL })}
      </div>
      <div className="mb-3 flex flex-wrap gap-3">
        <div className="flex h-20 w-20 items-center justify-center bg-dirt-dark">
          <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: faceGfx(fruitFace(id, preview, sale)) }} />
        </div>
        <div className="flex h-20 w-10 items-center justify-center bg-grass">
          <svg className="h-16 w-8" viewBox="0 0 24 48" dangerouslySetInnerHTML={{ __html: treeStage(id, stages[stage], preview) }} />
        </div>
      </div>
      <VarietyRow crop={id} selected={preview} onSelect={setPreview} />
      <div className="flex flex-col gap-2 text-base text-ink">
        <Stat
          label={m.almanac_stat_juvenile()}
          n={meterN(def.juvenileSeconds, treeMin('juvenileSeconds'), treeMax('juvenileSeconds'))}
          kind={{ t: 'raw', raw: m.almanac_days({ n: Number(days(def.juvenileSeconds).toFixed(2)) }) }}
        />
        <Stat
          label={m.almanac_stat_fruit_every()}
          n={meterN(every, everyMin, everyMax)}
          kind={{ t: 'raw', raw: m.almanac_days({ n: Number(days(def.fruitSeconds).toFixed(2)) }) }}
        />
        <Stat
          label={m.almanac_stat_sell()}
          n={meterN(d.sale, treeSaleMin(), treeSaleMax())}
          kind={{ t: 'coin', n: sale }}
        />
        <Stat
          label={m.almanac_concept_freshness()}
          n={meterN(d.rotSeconds, treeRotMin(), treeRotMax())}
          kind={{ t: 'raw', raw: m.almanac_days({ n: Number(days(st.rotSeconds).toFixed(2)) }) }}
        />
      </div>
      <Ingredients face={fruitFace(id, preview, sale)} done={done} />
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
      return false
    case 'furnace':
      return done.furnace
    case 'station':
      return true
  }
}

function yieldFace(recipe: Recipe): Face {
  return recipe.out.kind === 'exact' ? recipe.out.face : recipe.out.faces[0]
}

function yieldSale(recipe: Recipe): number | undefined {
  const face = yieldFace(recipe)
  return 'unitSale' in face ? face.unitSale : undefined
}

function Ingredients({ face, done }: { face: Face; done: AlmanacDone }) {
  const rows = recipesUsing(face).filter(r => recipeOpen(r.machine, done))
  if (rows.length === 0) return null
  return (
    <div className="mt-3 border-t border-ink/20 pt-3">
      <div className="mb-1 font-display text-xs leading-none text-ink">{m.hud_recipes()}</div>
      <div className="flex flex-wrap gap-3">
        {rows.map((recipe, i) => (
          <IngredientPlate key={i} recipe={recipe} />
        ))}
      </div>
    </div>
  )
}

function RecipeSale({ recipe }: { recipe: Recipe }) {
  const sale = yieldSale(recipe)
  if (sale === undefined) return null
  return <Coin n={sale} />
}

function IngredientPlate({ recipe }: { recipe: Recipe }) {
  const setTip = useContext(AlmanacTip)
  const face = yieldFace(recipe)
  return (
    <div
      className="flex h-20 w-20 items-center justify-center bg-water"
      onPointerEnter={() => setTip({ title: faceName(face), recipe })}
      onPointerLeave={() => setTip(undefined)}
    >
      <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: faceGfx(face) }} />
    </div>
  )
}

function Stat({
  label,
  n,
  kind,
}: {
  label: string
  n: number
  kind: { t: 'raw'; raw: string } | { t: 'coin'; n: number }
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 shrink-0">{label}</div>
      <svg viewBox="0 0 40 8" className="h-2 w-20 shrink-0" dangerouslySetInnerHTML={{ __html: meterInner(n, 'leaf') }} />
      {kind.t === 'coin' ? <Coin n={kind.n} /> : <span>{kind.raw}</span>}
    </div>
  )
}
