import { useEffect, useState } from 'react'
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
import { cropInner, faceGfx, itemInner, meterInner, PIPE_I, PIPE_L, PIPE_STUB, PIPE_T, PIPE_X, treeStage } from '../view/svgs.ts'
import { Coin, Overlay, tabTriggerClass } from './frame.tsx'

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
  'box',
  'box-large',
  'fertilizer',
  'synth-fertilizer',
  'compost',
  'sugar',
  'rotary-shovel',
  'diamond-pickaxe',
]

const BUILD_IDS = ['fence', 'tile-cobble', 'tile-brick', 'tile-paved']
const AUTO_IDS = [
  'pumpjack',
  'well',
  'rain-tank',
  'tap',
  'pipe',
  'valve',
  'sprinkler',
  'sprinkler-vert',
  'sprinkler-large',
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

const TABS = [
  { id: 'seeds', label: 'Seeds', ids: SEED_IDS },
  { id: 'trees', label: 'Trees', ids: TREE_TAB_IDS },
  { id: 'utility', label: 'Utility', ids: UTIL_IDS },
  { id: 'automation', label: 'Automation', ids: AUTO_IDS },
  { id: 'building', label: 'Building', ids: BUILD_IDS },
] as const

type Tab = (typeof TABS)[number]['id']

const RARITY_TABS: { id: Rarity; label: string }[] = [
  { id: 'common', label: 'Common' },
  { id: 'uncommon', label: 'Uncommon' },
  { id: 'rare', label: 'Rare' },
  { id: 'heirloom', label: 'Heirloom' },
]

const CROP_IDS = [...ANNUAL_IDS] as CropId[]

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
  const [tab, setTab] = useState<Tab>('seeds')
  const [id, setId] = useState(SEED_IDS[0])
  const byId = new Map(entries.map(e => [e.id, e]))
  const shown = TABS.find(t => t.id === tab)
  const list = shown === undefined ? [] : shown.ids.flatMap(i => {
    const e = byId.get(i)
    return e === undefined ? [] : [e]
  })
  const entry = byId.get(id)
  const shownEntry = entry !== undefined && list.some(e => e.id === id) ? entry : list[0]
  return (
    <Overlay title="Almanac" onClose={onClose} className="max-h-[min(36rem,calc(100%-6rem))] w-[36rem]">
        <Tabs.Root
          value={tab}
          onValueChange={v => {
            const next = v as Tab
            setTab(next)
            const first = TABS.find(t => t.id === next)
            if (first !== undefined) setId(first.ids[0])
          }}
          className="relative z-20 flex min-h-0 flex-1 flex-col"
        >
          <Tabs.List className="sticky top-0 z-10 flex gap-1 border-b border-ink/20 bg-house px-4">
            {TABS.map(t => (
              <Tabs.Trigger key={t.id} value={t.id} className={tabTriggerClass}>
                {t.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <div className="relative z-20 flex min-h-0 flex-1 mx-[-0.75rem]">
            <div className="w-44 shrink-0 overflow-y-auto border-r border-ink/20">
              {list.map(e => (
                <button
                  key={e.id}
                  type="button"
                  className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-lg ${
                    e.id === shownEntry.id ? 'bg-dirt text-house' : 'text-ink hover:bg-dirt/30'
                  }`}
                  onClick={() => setId(e.id)}
                >
                  <svg
                    className="h-4 w-4 shrink-0"
                    viewBox="0 0 24 24"
                    dangerouslySetInnerHTML={{ __html: itemInner(e.icon) }}
                  />
                  <span className="truncate">{e.title}</span>
                </button>
              ))}
            </div>
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4">
              {shownEntry !== undefined && <Pane entry={shownEntry} jam={world.done.has('unlock-preservatives')} />}
            </div>
          </div>
        </Tabs.Root>
    </Overlay>
  )
}

const PIPE_JOINS = [PIPE_STUB, PIPE_I, PIPE_L, PIPE_T, PIPE_X] as const

function Pane({ entry, jam }: { entry: CatalogEntry; jam: boolean }) {
  const tree = TREE_IDS.find(id => id === entry.id)
  if (tree !== undefined) return <TreePane id={tree} jam={jam} />
  const crop = CROP_IDS.find(id => id === entry.id)
  if (crop !== undefined) return <CropPane id={crop} jam={jam} />
  if (entry.id === 'pipe') return <PipePane title={entry.title} blurb={entry.blurb} />
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
    </>
  )
}

function PipePane({ title, blurb }: { title: string; blurb: string }) {
  const [stage, setStage] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setStage(s => (s + 1) % 5), 800)
    return () => window.clearInterval(t)
  }, [])
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
    <Tabs.Root value={preview} onValueChange={v => onPreview(v as Rarity)} className="mb-3">
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
  const [stage, setStage] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setStage(s => (s + 1) % 3), 800)
    return () => window.clearInterval(t)
  }, [])
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
  const [stage, setStage] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setStage(s => (s + 1) % 3), 800)
    return () => window.clearInterval(t)
  }, [])
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
