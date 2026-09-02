import { createContext, useContext, useState, type ReactNode } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { catalogEntries, type CatalogEntry } from '../defs/catalog.ts'
import { CROPS, cropVariety } from '../defs/crops.ts'
import { RARITY_SALE, raritySale, type Rarity } from '../defs/rarity.ts'
import { TREES, TREE_OFF_MUL, TREE_YIELD_DAYS, TREE_YIELD_MUL } from '../defs/trees.ts'
import { ANNUAL_IDS, TREE_IDS, type TreeId } from '../sim/ids.ts'
import { statsOf } from '../sim/modifiers.ts'
import { FERT_PLOT_MAX, SOIL_WATER_MID } from '../sim/soil.ts'
import { DAY_SECONDS, days } from '../sim/clock.ts'
import type { CropId, JamCrop } from '../sim/ids.ts'
import type { World } from '../sim/world.ts'
import { JAM_SALE } from '../defs/items.ts'
import { cropInner, faceGfx, itemInner, meterInner, PIPE_I, PIPE_L, PIPE_STUB, PIPE_T, PIPE_X, rarityInner, treeStage } from '../view/svgs.ts'
import { Coin, Overlay, tabTriggerClass } from './frame.tsx'
import { useCycle } from './cycle.ts'
import { MACHINE_IDS, type MachineId } from '../sim/recipe.ts'
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
  | 'rarity'
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
  'watermelon',
  'olive',
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
  'bucket',
  'large-bucket',
  'fertilizer',
  'synth-fertilizer',
  'weed-spray',
  'compost',
  'sugar',
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
  'rarity',
  'freshness',
  'happiness',
  'day',
  'market',
  'skills',
  'family',
  'research',
  'automation',
]

const CONCEPT_LABEL: { readonly [K in ConceptId]: string } = {
  rarity: 'Rarity',
  freshness: 'Freshness',
  happiness: 'Happiness',
  day: 'Day & Night',
  market: 'Market',
  skills: 'Skills',
  family: 'Family',
  research: 'Research',
  automation: 'Automation',
}

const TABS: { id: AlmanacTab; label: string }[] = [
  { id: 'seeds', label: 'Seeds' },
  { id: 'trees', label: 'Trees' },
  { id: 'utility', label: 'Utility' },
  { id: 'sensors', label: 'Sensors' },
  { id: 'automation', label: 'Automation' },
  { id: 'water', label: 'Water systems' },
  { id: 'building', label: 'Building' },
  { id: 'concepts', label: 'Game concepts' },
]

const RARITY_TABS: { id: Rarity; label: string }[] = [
  { id: 'common', label: 'Common' },
  { id: 'uncommon', label: 'Uncommon' },
  { id: 'rare', label: 'Rare' },
  { id: 'heirloom', label: 'Heirloom' },
]

const CROP_IDS = [...ANNUAL_IDS] as CropId[]

const AlmanacGo = createContext<(to: AlmanacNav) => void>(() => {
  throw new Error('AlmanacLink')
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
      return 'Overview'
    case 'concept':
      return CONCEPT_LABEL[row.id]
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

function rarityOf(id: string): Rarity {
  const t = RARITY_TABS.find(x => x.id === id)
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
  const byId = new Map(entries.map(e => [e.id, e]))
  const rows = rowsOf(tab)
  const row = rows.find(r => rowId(r) === id)
  if (row === undefined) throw new Error('AlmanacNav')
  const go = (to: AlmanacNav) => {
    setTab(to.tab)
    setId(to.id)
  }
  return (
    <Overlay title="Almanac" onClose={onClose} className="h-[min(48rem,calc(100vh-6rem))] w-[48rem]">
      <AlmanacGo.Provider value={go}>
        <Tabs.Root
          value={tab}
          onValueChange={v => {
            const next = tabOf(v)
            setTab(next)
            setId(firstId(next))
          }}
          className="relative z-20 flex min-h-0 flex-1 flex-col"
        >
          <Tabs.List className="sticky top-0 z-10 flex shrink-0 flex-wrap gap-1 border-b border-ink/20 bg-house px-4">
            {TABS.map(t => (
              <Tabs.Trigger key={t.id} value={t.id} className={tabTriggerClass}>
                {t.label}
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
                    onClick={() => setId(rid)}
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
              <RowPane row={row} byId={byId} jam={world.done.has('unlock-preservatives')} tab={tab} />
            </div>
          </div>
        </Tabs.Root>
      </AlmanacGo.Provider>
    </Overlay>
  )
}

function RowPane({
  row,
  byId,
  jam,
  tab,
}: {
  row: ListRow
  byId: Map<string, CatalogEntry>
  jam: boolean
  tab: AlmanacTab
}) {
  switch (row.kind) {
    case 'overview':
      return <OverviewPane tab={tab} />
    case 'concept':
      return <ConceptPane id={row.id} />
    case 'sku':
      return <Pane entry={skuEntry(byId, row.id)} jam={jam} />
  }
}

function OverviewPane({ tab }: { tab: AlmanacTab }) {
  return (
    <>
      <div className="mb-3 text-lg leading-relaxed text-ink">Overview</div>
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
        Seeds are what you sow in a tilled bed so a plant can grow. You need them to raise fruit you sell at the{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink>, and to keep a crop going after harvest.
      </div>
      <div>
        Buy a pack of five in the shop, or shovel a growing or ripe plant for one seed. That seed keeps the plant's{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'rarity' }}>rarity</AlmanacLink>. Sow it on empty soil, then water and
        feed the plant until it is ripe. Harvest ripe fruit empty-handed. Shovel Rotten produce or a Dead plant and you
        get no seed back.
      </div>
      <div>
        Fruit of the same crop is not all worth the same money.{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'rarity' }}>Rarity</AlmanacLink> and{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>Freshness</AlmanacLink> change what the{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink> pays for that fruit.{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'happiness' }}>Happiness</AlmanacLink> is how the plant is doing while it
        grows — happier plants more often ripen as a{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'rarity' }}>better rarity</AlmanacLink>.
      </div>
      <div>
        See <AlmanacLink to={{ tab: 'concepts', id: 'rarity' }}>Rarity</AlmanacLink>,{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'happiness' }}>Happiness</AlmanacLink>,{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>Freshness</AlmanacLink>, and{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink>.
      </div>
    </>
  )
}

function SensorsOverview() {
  return (
    <>
      <div>
        Sensors send on or off through a wire so you do not have to stand at the bed. You need them to watch water,
        harvest, and machines, then let a wire act while you garden.
      </div>
      <div>
        A <AlmanacLink to={{ tab: 'sensors', id: 'lever' }}>Lever</AlmanacLink> is a switch you flip by hand. Its output
        is on or off. Run a wire from that output to pause a mill or stop a sprinkler.
      </div>
      <div>
        <AlmanacLink to={{ tab: 'concepts', id: 'automation' }}>Automation</AlmanacLink> is the machines and stores those
        wires can run. Open that concept for what the machines are for.
      </div>
      <div>
        See <AlmanacLink to={{ tab: 'concepts', id: 'automation' }}>Automation</AlmanacLink>.
      </div>
    </>
  )
}

function AutomationOverview() {
  return (
    <>
      <div>
        Automation is machines and stores so you walk less. You need it so plants stay watered, machines keep working,
        and fruit waits until you take it to the <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink>.
      </div>
      <div>
        A <AlmanacLink to={{ tab: 'automation', id: 'mill' }}>Mill</AlmanacLink> is one machine: it turns fruit into
        goods the <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink> pays money for. You get those
        goods, a place to hold a haul, and less walking between beds. The Freezer keeps fruit from losing freshness.
      </div>
      <div>
        <AlmanacLink to={{ tab: 'concepts', id: 'research' }}>Research</AlmanacLink> is how new machines show up in the
        shop and the Build menu.{' '}
        <AlmanacLink to={{ tab: 'sensors', id: 'overview' }}>Sensors Overview</AlmanacLink> covers the wires that can
        pause a mill or a sprinkler.
      </div>
      <div>
        See <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink>,{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'research' }}>Research</AlmanacLink>, and{' '}
        <AlmanacLink to={{ tab: 'sensors', id: 'overview' }}>Sensors Overview</AlmanacLink>.
      </div>
    </>
  )
}

function ConceptPane({ id }: { id: ConceptId }) {
  return (
    <>
      <div className="mb-3 text-lg leading-relaxed text-ink">{CONCEPT_LABEL[id]}</div>
      <div className="flex flex-col gap-3 text-base leading-relaxed text-ink">{conceptBody(id)}</div>
    </>
  )
}

function conceptBody(id: ConceptId) {
  switch (id) {
    case 'rarity':
      return <RarityConcept />
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

function RarityHead({ rarity, label }: { rarity: Rarity; label: string }) {
  if (rarity === 'common') {
    return (
      <div className="flex items-center gap-2">
        <span>{label}</span>
      </div>
    )
  }
  const mark = rarityInner(rarity)
  if (mark === undefined) throw new Error(rarity)
  return (
    <div className="flex items-center gap-2">
      <span>{label}</span>
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: mark }} />
    </div>
  )
}

function RarityConcept() {
  return (
    <>
      <div>
        Rarity is the grade of fruit and seed: Common, Uncommon, Rare, or Heirloom. Four grades only.{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>Bio farmer</AlmanacLink> is a skill, not a fifth grade.
      </div>
      <div>
        Uncommon, Rare, and Heirloom fruit show a small colored mark: green, blue, or gold. Common fruit has none.
      </div>
      <div className="flex flex-col gap-1">
        <RarityHead rarity="common" label="Common" />
        <div>
          Common fruit of that crop sells at the crop's ordinary price at the{' '}
          <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink>. The Common plant finishes growing in
          the time written on the crop. Ripe Common fruit stays fresh for the crop's{' '}
          <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>freshness time</AlmanacLink>. The Common plant uses the
          crop's usual water and feed range.
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <RarityHead rarity="uncommon" label="Uncommon" />
        <div>
          Uncommon fruit of the same crop sells for a quarter more money at the{' '}
          <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink> than Common fruit. The Uncommon plant
          finishes growing a little sooner than Common of the same crop. Ripe Uncommon fruit{' '}
          <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>keeps as long as</AlmanacLink> Common fruit of that
          crop. The Uncommon plant needs a slightly tighter water and feed range than Common of the same crop.
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <RarityHead rarity="rare" label="Rare" />
        <div>
          Rare fruit of the same crop sells for twice the Common fruit price at the{' '}
          <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink>. Rare vanilla fruit sells for three
          times the Common vanilla price at the <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink>.
          The Rare plant finishes growing sooner than Common of the same crop. Ripe Rare fruit{' '}
          <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>loses freshness</AlmanacLink> faster than Common fruit of
          that crop. The Rare plant needs a tighter water and feed range than Uncommon of the same crop.
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <RarityHead rarity="heirloom" label="Heirloom" />
        <div>
          Heirloom fruit of the same crop sells for three and a half times the Common fruit price at the{' '}
          <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink>. Heirloom vanilla fruit sells for six
          times the Common vanilla price at the <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink>.
          The Heirloom plant finishes growing at the Common pace of that crop. Ripe Heirloom fruit{' '}
          <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>loses freshness</AlmanacLink> faster than Common fruit of
          that crop. The Heirloom plant needs the tightest water and feed range of the four grades.
        </div>
      </div>
      <div>
        Seed you shovel off a plant keeps that plant's grade. Fruit that drops from a tree has its own grade — most
        Common, some Uncommon, few Rare, almost never Heirloom. The tree itself has no grade.
      </div>
      <div>
        Happier plants more often ripen as a better grade. A plant below the middle of{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'happiness' }}>Happiness</AlmanacLink> can ripen one grade lower than the
        seed you planted. A plant at or above the middle can ripen one grade higher than the seed you planted, and
        sometimes two grades higher than the seed you planted.{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>Careful tending</AlmanacLink> and{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>the crop skills on Family</AlmanacLink> help a happy plant
        ripen higher.
      </div>
      <div>
        Shop packs of five seeds are Common unless you learned{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>Trusted seed bank</AlmanacLink>. Trusted seed bank is one of{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>your skills on Family</AlmanacLink>. Each rank, a shop pack
        of five seeds is 5% Uncommon, 1.2% Rare, or 0.2% Heirloom.
      </div>
      <div>
        See <AlmanacLink to={{ tab: 'concepts', id: 'happiness' }}>Happiness</AlmanacLink>,{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>Skills</AlmanacLink>,{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>Freshness</AlmanacLink>, and{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink>.
      </div>
    </>
  )
}

function FreshnessConcept() {
  return (
    <>
      <div>
        Freshness is how much quality ripe fruit still has. You need it because the{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink> pays less money for fruit that has gone
        off.
      </div>
      <div>
        Ripe fruit loses freshness while it sits on the plant. When freshness goes to empty, the plot becomes{' '}
        <AlmanacLink to={{ tab: 'seeds', id: 'rotten' }}>Rotten produce</AlmanacLink>. Picked fruit keeps losing
        freshness in your hand, the house, a <AlmanacLink to={{ tab: 'automation', id: 'chest' }}>Chest</AlmanacLink>, and on
        the ground until you{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Sell all</AlmanacLink>. A{' '}
        <AlmanacLink to={{ tab: 'automation', id: 'freezer' }}>Freezer</AlmanacLink> holds freshness still.{' '}
        <AlmanacLink to={{ tab: 'utility', id: 'sugar' }}>Sugar</AlmanacLink> does not lose freshness.
      </div>
      <div>
        Above 80% freshness, the <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink> pays the full{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink> price for that fruit. Below 80%
        freshness, the money the <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink> pays for that
        fruit falls with its freshness.{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>Still good for jam</AlmanacLink> keeps 10% of the fruit's{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink> price as a floor at rank I, 20% at rank
        II, and 30% at rank III.{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>Clearance sale</AlmanacLink> pays <Coin n={1} /> for each
        fruit whose freshness has gone to empty.
      </div>
      <div>
        <AlmanacLink to={{ tab: 'concepts', id: 'rarity' }}>Rare</AlmanacLink> and{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'rarity' }}>Heirloom</AlmanacLink> fruit lose freshness faster than{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'rarity' }}>Common</AlmanacLink> fruit of the same crop.{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'rarity' }}>Uncommon</AlmanacLink> fruit keeps as long as{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'rarity' }}>Common</AlmanacLink> fruit of that crop.
      </div>
      <div>
        See <AlmanacLink to={{ tab: 'concepts', id: 'rarity' }}>Rarity</AlmanacLink>,{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink>, and{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>Skills</AlmanacLink>.
      </div>
    </>
  )
}

function HappinessConcept() {
  return (
    <>
      <div>
        Happiness is how the plant is doing while it grows. Happiness does not set how fast the plant grows. Too little
        water, too much water, or too little feed all make the plant finish growing later than it would in the water and
        feed range written on that crop in this Almanac.
      </div>
      <div>
        You need it because happier plants more often ripen as a{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'rarity' }}>better rarity</AlmanacLink>, and a plant whose Happiness goes
        to empty while still growing can die.
      </div>
      <div>
        A new plant starts in the middle of Happiness. Empty-handed,{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>Careful tending</AlmanacLink> lifts Happiness a short way
        toward full, once, before the plant is ripe. Good water and feed slowly raise Happiness. Too much water drains
        Happiness fastest, then too little water, then hungry for feed.
      </div>
      <div>
        Too much water also slows growth, not only drains Happiness. Too little water slows growth and can wilt a
        growing plant to a <AlmanacLink to={{ tab: 'seeds', id: 'dead' }}>Dead plant</AlmanacLink>. If Happiness goes to
        empty while the plant is still growing: too much water drowns it into{' '}
        <AlmanacLink to={{ tab: 'seeds', id: 'rotten' }}>Rotten produce</AlmanacLink>; too little water or no feed leaves
        a <AlmanacLink to={{ tab: 'seeds', id: 'dead' }}>Dead plant</AlmanacLink>. Ripe plants do not die of water or
        feed; they only <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>lose freshness</AlmanacLink>.
      </div>
      <div>
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>The crop skills on Family</AlmanacLink> add a slightly higher
        chance the ripe fruit is one rarity above the seed when the plant is happy.
      </div>
      <div>
        A <AlmanacLink to={{ tab: 'sensors', id: 'sensor-water' }}>Water sensor</AlmanacLink> is one way to watch for
        wilt and overwater. See <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>Skills</AlmanacLink> and{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'rarity' }}>Rarity</AlmanacLink>.
      </div>
    </>
  )
}

function DayConcept() {
  return (
    <>
      <div>A day has four parts: sunrise, day, sunset, twilight. There is no night.</div>
      <div>
        When twilight ends, the recap opens. The recap is the end-of-day summary: daily pay, tax, what you harvested and
        lost, <AlmanacLink to={{ tab: 'concepts', id: 'research' }}>research</AlmanacLink> that finished. Play waits until
        you dismiss it. Dismissing starts the next day and gives{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>You</AlmanacLink>,{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>Husband</AlmanacLink>, and{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>Daughter</AlmanacLink> one{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>skill point</AlmanacLink> each.
      </div>
      <div>
        The <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink> stays open through sunrise and day.
        At sunset it needs <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>Open late</AlmanacLink>. At twilight it
        needs <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>Open 24/7</AlmanacLink>. You can still drop goods off
        when it is closed; you cannot <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Sell all</AlmanacLink> until it
        opens.
      </div>
      <div>
        See <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink>,{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>Family</AlmanacLink>, and{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>Skills</AlmanacLink>.
      </div>
    </>
  )
}

function MarketConcept() {
  return (
    <>
      <div>
        The Market is where you sell fruit, sugar, and machine goods for money. Walk them to the market truck, then open
        Market. The picture is not a building you place.
      </div>
      <div>
        Sell all pays one money total; <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>Freshness</AlmanacLink> and{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'rarity' }}>Rarity</AlmanacLink> are already in that total. You can drop
        off while the Market is shut. You cannot Sell all until it opens.
      </div>
      <div>
        Daughter skills on <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>Family</AlmanacLink> change the money and
        hours: each rank of <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>Saleswoman</AlmanacLink> raises the money
        the Market pays for every good by 2%. Each rank of{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>Őstermelő</AlmanacLink> raises the money the Market pays for{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'rarity' }}>Heirloom</AlmanacLink> fruit, spirit, and wine by 5%. Each
        rank of <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>Bio farmer</AlmanacLink> raises the money the Market
        pays for organic fruit by 4%. <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>Still good for jam</AlmanacLink>{' '}
        keeps 10% of the fruit's Market price as a floor at rank I, 20% at rank II, and 30% at rank III.{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>Clearance sale</AlmanacLink> pays <Coin n={1} /> for each
        fruit whose freshness has gone to empty.{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>Open late</AlmanacLink> keeps Sell all legal at sunset.{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>Open 24/7</AlmanacLink> keeps Sell all legal at twilight.
      </div>
      <div>
        See <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>Skills</AlmanacLink>,{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'day' }}>Day & Night</AlmanacLink>,{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>Freshness</AlmanacLink>, and{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'rarity' }}>Rarity</AlmanacLink>.
      </div>
    </>
  )
}

function SkillsConcept() {
  return (
    <>
      <div>
        Skills are the three people's learned work. The farm is three people. You garden, your husband researches, your
        daughter runs the <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink>. Each{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'day' }}>end-of-day summary</AlmanacLink> gives three skill points to
        one shared bank, spent on <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>Family</AlmanacLink>. The three
        skill choices stay until that person picks. Any point can go to any person.
      </div>
      <div>
        Your skills help the garden:{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'happiness' }}>happier plants</AlmanacLink>,{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'rarity' }}>better rarity</AlmanacLink>. Boots lets you walk across the
        farm faster than without that skill. Speedy research makes research jobs finish in less time than without that
        skill. Contracts makes utility and automation goods in the shop cost <Coin n={1} /> less money per rank of
        Contracts, never below <Coin n={1} />. Hers change the money the{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink> pays for fruit and goods, and the hours{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Sell all</AlmanacLink> is allowed.
      </div>
      <div>
        See <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>Family</AlmanacLink>,{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'research' }}>Research</AlmanacLink>,{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'rarity' }}>Rarity</AlmanacLink>,{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>Freshness</AlmanacLink>,{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'happiness' }}>Happiness</AlmanacLink>,{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink>, and{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'day' }}>Day & Night</AlmanacLink>.
      </div>
    </>
  )
}

function FamilyConcept() {
  return (
    <>
      <div>
        Family is You, Husband, and Daughter. Open Family from the same buttons as Almanac,{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink>, and{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'research' }}>Research</AlmanacLink>. Left to right: You the Gardener,
        Husband on <AlmanacLink to={{ tab: 'concepts', id: 'research' }}>Research</AlmanacLink>, Daughter on{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink>. You work the beds. He runs{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'research' }}>research</AlmanacLink>. She minds the{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink>. Spend{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>skill points</AlmanacLink> on{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>Skills</AlmanacLink> here. This Almanac page does not replace
        Family.
      </div>
      <div>
        See <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>Skills</AlmanacLink> and{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'research' }}>Research</AlmanacLink>.
      </div>
    </>
  )
}

function ResearchConcept() {
  return (
    <>
      <div>
        Research is your husband's work so the farm can grow past the starter tools and crops. Open Research from the
        same buttons as Shop and the Build menu to pick a job.
      </div>
      <div>
        He can run only one job at a time. Starting a job spends money up front. The job takes time in seconds while you
        garden. When it finishes, new things appear in the shop and the Build menu, and you can buy more land.
      </div>
      <div>
        Research is how you get new crops, tools, water,{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'automation' }}>machines</AlmanacLink>, and sensors.{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>Skills</AlmanacLink> are not research — spend those on{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>Family</AlmanacLink>.
      </div>
      <div>
        See <AlmanacLink to={{ tab: 'concepts', id: 'family' }}>Family</AlmanacLink>,{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'skills' }}>Skills</AlmanacLink>, and{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'automation' }}>Automation</AlmanacLink>.
      </div>
    </>
  )
}

function AutomationConcept() {
  return (
    <>
      <div>
        Automation is machines, stores, and wires so you walk less. Plants stay watered. Machines keep working. A wire
        that is on can pause a <AlmanacLink to={{ tab: 'automation', id: 'mill' }}>Mill</AlmanacLink>.
      </div>
      <div>
        Machines turn fruit into goods you sell at the{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink>. A{' '}
        <AlmanacLink to={{ tab: 'automation', id: 'chest' }}>Chest</AlmanacLink> or{' '}
        <AlmanacLink to={{ tab: 'automation', id: 'freezer' }}>Freezer</AlmanacLink> holds what you picked; the{' '}
        <AlmanacLink to={{ tab: 'automation', id: 'freezer' }}>Freezer</AlmanacLink> keeps fruit from{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>losing freshness</AlmanacLink>. The{' '}
        <AlmanacLink to={{ tab: 'automation', id: 'hangar' }}>Vehicle hangar</AlmanacLink> and field silos sit on the
        Automation list with those machines.
      </div>
      <div>
        Wires and sensors send on or off. Open{' '}
        <AlmanacLink to={{ tab: 'sensors', id: 'overview' }}>Sensors at Overview</AlmanacLink>. A wire can pause a mill,
        stop a sprinkler, or open a <AlmanacLink to={{ tab: 'water', id: 'valve' }}>Valve</AlmanacLink>.
      </div>
      <div>
        See <AlmanacLink to={{ tab: 'concepts', id: 'research' }}>Research</AlmanacLink>,{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'market' }}>Market</AlmanacLink>,{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'freshness' }}>Freshness</AlmanacLink>, and{' '}
        <AlmanacLink to={{ tab: 'concepts', id: 'happiness' }}>Happiness</AlmanacLink>.
      </div>
    </>
  )
}

const PIPE_JOINS = [PIPE_STUB, PIPE_I, PIPE_L, PIPE_T, PIPE_X] as const

function Pane({ entry, jam }: { entry: CatalogEntry; jam: boolean }) {
  const tree = TREE_IDS.find(id => id === entry.id)
  if (tree !== undefined) return <TreePane id={tree} jam={jam} />
  const crop = CROP_IDS.find(id => id === entry.id)
  if (crop !== undefined) return <CropPane id={crop} jam={jam} />
  if (entry.id === 'pipe') return <PipePane title={entry.title} blurb={entry.blurb} />
  const machine = MACHINE_IDS.find(m => m === entry.id)
  return (
    <>
      <div className="mb-3 text-lg leading-relaxed text-ink">{entry.title}</div>
      <div className="mb-3 flex h-20 w-20 items-center justify-center bg-dirt-dark">
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
      <div className="mb-1 font-display text-xs leading-none text-ink">Recipes</div>
      <Recipes view={{ kind: 'list', machine }} size="md" />
    </div>
  )
}

function PipePane({ title, blurb }: { title: string; blurb: string }) {
  const stage = useCycle(PIPE_JOINS.length)
  return (
    <>
      <div className="mb-3 text-lg leading-relaxed text-ink">{title}</div>
      <div className="mb-3 flex h-20 w-20 items-center justify-center bg-dirt-dark">
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

function ripeStage(r: Rarity): 'ripe' | 'ripe-rare' | 'ripe-heirloom' {
  if (r === 'rare') return 'ripe-rare'
  if (r === 'heirloom') return 'ripe-heirloom'
  return 'ripe'
}

function RarityTabs({ preview, onPreview }: { preview: Rarity; onPreview: (p: Rarity) => void }) {
  return (
    <Tabs.Root value={preview} onValueChange={v => onPreview(rarityOf(v))} className="mb-3">
      <Tabs.List className="flex flex-wrap gap-1 border-b border-ink/20">
        {RARITY_TABS.map(t => (
          <Tabs.Trigger key={t.id} value={t.id} className={tabTriggerClass}>
            {t.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  )
}

function CropPane({ id, jam }: { id: CropId; jam: boolean }) {
  const d = CROPS[id]
  const [preview, setPreview] = useState<Rarity>('common')
  const stage = useCycle(3)
  const ripe = ripeStage(preview)
  const st = statsOf(id, preview, [])
  const product = faceGfx({
    kind: 'fruit',
    crop: id,
    rarity: preview,
    count: 1,
    unitSale: st.sale,
    freshness: 1,
    bio: true,
  })
  const jamCrop = id === 'grape' || id === 'raspberry' || id === 'tomato' ? id : undefined
  return (
    <>
      <div className="mb-2 text-lg leading-relaxed text-ink">{cropVariety(id, preview)}</div>
      <div className="mb-3 text-base leading-relaxed text-ink/70">{d.desc}</div>
      {id === 'sugar-cane' ? (
        <div className="mb-3 text-base leading-relaxed text-ink/70">Mill 5 cane into 2 L sugar.</div>
      ) : null}
      <RarityTabs preview={preview} onPreview={setPreview} />
      <div className="mb-3 flex gap-3">
        <div className="flex h-20 w-20 items-center justify-center bg-dirt-dark">
          <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: product }} />
        </div>
        <div className="flex h-20 w-20 items-center justify-center bg-dirt-dark">
          <svg
            className="h-16 w-16"
            viewBox="0 0 24 24"
            dangerouslySetInnerHTML={{ __html: cropInner(id, STAGES[stage] === 'ripe' ? ripe : STAGES[stage]) }}
          />
        </div>
        {jam && jamCrop !== undefined ? <JamPlate crop={jamCrop} /> : null}
      </div>
      <div className="flex flex-col gap-2 text-base text-ink">
        <Stat
          label="Grow time"
          n={meterN(d.growSeconds, colMin('growSeconds'), colMax('growSeconds'))}
          kind={{ t: 'raw', raw: `${Number(days(st.growSeconds).toFixed(2))} days` }}
        />
        <Stat
          label="Drink"
          n={meterN(d.waterUsePerSec, colMin('waterUsePerSec'), colMax('waterUsePerSec'))}
          kind={{ t: 'raw', raw: `${Number((d.waterUsePerSec * DAY_SECONDS).toPrecision(1))} L/day` }}
        />
        <Stat
          label="Water range"
          n={meterN(st.waterTolerance, 0.25, 1)}
          kind={{ t: 'raw', raw: `${liters(SOIL_WATER_MID - st.waterTolerance)}–${liters(SOIL_WATER_MID + st.waterTolerance)}` }}
        />
        <Stat
          label="Fertilizer"
          n={meterN(st.fertTolerance, 0.25, 1)}
          kind={{ t: 'raw', raw: `happy above ${Math.round((FERT_PLOT_MAX - st.fertTolerance) * 100)}%` }}
        />
        <Stat label="Sell" n={meterN(d.sale, colMin('sale'), colMax('sale'))} kind={{ t: 'coin', n: st.sale }} />
        <Stat
          label="Seed price"
          n={meterN(d.seed, colMin('seed'), colMax('seed'))}
          kind={{ t: 'coin', n: d.seed * RARITY_SALE[preview] }}
        />
        <Stat
          label="Freshness"
          n={meterN(d.rotSeconds, colMin('rotSeconds'), colMax('rotSeconds'))}
          kind={{ t: 'raw', raw: `${Number(days(st.rotSeconds).toFixed(2))} days` }}
        />
      </div>
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

function TreePane({ id, jam }: { id: TreeId; jam: boolean }) {
  const d = CROPS[id]
  const def = TREES[id]
  const [preview, setPreview] = useState<Rarity>('common')
  const stage = useCycle(3)
  const stages = ['grow', 'unripe', 'ripe'] as const
  const st = statsOf(id, preview, [])
  const every = 1 / def.fruitSeconds
  const everyMin = 1 / treeMax('fruitSeconds')
  const everyMax = 1 / treeMin('fruitSeconds')
  return (
    <>
      <div className="mb-2 text-lg leading-relaxed text-ink">{cropVariety(id, preview)}</div>
      <div className="mb-3 text-base leading-relaxed text-ink/70">{d.desc}</div>
      <div className="mb-3 text-base leading-relaxed text-ink/70">
        Drops on the grass. {TREE_YIELD_DAYS} days at ×{TREE_YIELD_MUL}, then ×{TREE_OFF_MUL}.
      </div>
      <RarityTabs preview={preview} onPreview={setPreview} />
      <div className="mb-3 flex gap-3">
        <div className="flex h-20 w-20 items-center justify-center bg-dirt-dark">
          <svg
            className="h-16 w-16"
            viewBox="0 0 24 24"
            dangerouslySetInnerHTML={{
              __html: faceGfx({
                kind: 'fruit',
                crop: id,
                rarity: preview,
                count: 1,
                unitSale: d.sale * raritySale(d, preview),
                freshness: 1,
                bio: true,
              }),
            }}
          />
        </div>
        <div className="flex h-20 w-10 items-center justify-center bg-grass">
          <svg className="h-16 w-8" viewBox="0 0 24 48" dangerouslySetInnerHTML={{ __html: treeStage(id, stages[stage]) }} />
        </div>
        {jam && (id === 'apple' || id === 'apricot' || id === 'cherry') ? <JamPlate crop={id} /> : null}
      </div>
      <div className="flex flex-col gap-2 text-base text-ink">
        <Stat
          label="Juvenile"
          n={meterN(def.juvenileSeconds, treeMin('juvenileSeconds'), treeMax('juvenileSeconds'))}
          kind={{ t: 'raw', raw: `${Number(days(def.juvenileSeconds).toFixed(2))} days` }}
        />
        <Stat
          label="Fruit every"
          n={meterN(every, everyMin, everyMax)}
          kind={{ t: 'raw', raw: `${Number(days(def.fruitSeconds).toFixed(2))} days` }}
        />
        <Stat
          label="Sell"
          n={meterN(d.sale, treeSaleMin(), treeSaleMax())}
          kind={{ t: 'coin', n: d.sale * raritySale(d, preview) }}
        />
        <Stat
          label="Freshness"
          n={meterN(d.rotSeconds, treeRotMin(), treeRotMax())}
          kind={{ t: 'raw', raw: `${Number(days(st.rotSeconds).toFixed(2))} days` }}
        />
      </div>
    </>
  )
}

function JamPlate({ crop }: { crop: JamCrop }) {
  return (
    <div className="flex h-20 w-20 items-center justify-center bg-dirt-dark">
      <svg
        className="h-16 w-16"
        viewBox="0 0 24 24"
        dangerouslySetInnerHTML={{
          __html: faceGfx({ kind: 'jam', crop, count: 1, unitSale: JAM_SALE[crop] }),
        }}
      />
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
