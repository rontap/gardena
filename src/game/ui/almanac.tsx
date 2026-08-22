import { useEffect, useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { catalogEntries, type CatalogEntry } from '../defs/catalog.ts'
import { CROPS, cropVariety } from '../defs/crops.ts'
import { SHRUB_GROW } from '../defs/items.ts'
import { BERRY_SALE, RARITY_SALE, type Rarity } from '../defs/rarity.ts'
import { statsOf } from '../sim/modifiers.ts'
import { FERT_PLOT_MAX, SOIL_WATER_MID } from '../sim/soil.ts'
import { DAY_SECONDS, days } from '../sim/clock.ts'
import type { CropId } from '../sim/ids.ts'
import { BERRY_SHRUB, SHRUB, appleTreeStage, cropInner, faceGfx, itemInner, meterInner } from '../view/svgs.ts'
import { Coin, Overlay, tabTriggerClass } from './frame.tsx'

const SEED_IDS = [
  'carrot',
  'potato',
  'wheat',
  'tomato',
  'raspberry',
  'watermelon',
  'apple',
  'berry',
  'shrub',
  'soil',
  'weed',
  'grass-seeds',
  'grass',
  'rotten',
  'dead',
]
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
]

const TABS = [
  { id: 'seeds', label: 'Seeds', ids: SEED_IDS },
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

const CROP_IDS = Object.keys(CROPS) as CropId[]

function colMin(key: 'growSeconds' | 'waterUsePerSec' | 'sale' | 'seed' | 'rotSeconds'): number {
  return Math.min(...CROP_IDS.map(id => CROPS[id][key]))
}

function colMax(key: 'growSeconds' | 'waterUsePerSec' | 'sale' | 'seed' | 'rotSeconds'): number {
  return Math.max(...CROP_IDS.map(id => CROPS[id][key]))
}

function meterN(v: number, min: number, max: number): number {
  return 1 + Math.round((4 * (v - min)) / (max - min))
}

function liters(n: number): string {
  return `${Number(n.toFixed(2))}L`
}

const STAGES = ['sprout', 'grow', 'ripe'] as const

export function Almanac({ onClose }: { onClose: () => void }) {
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
              {shownEntry !== undefined && <Pane entry={shownEntry} />}
            </div>
          </div>
        </Tabs.Root>
    </Overlay>
  )
}

function Pane({ entry }: { entry: CatalogEntry }) {
  if (entry.id === 'berry') return <BerryPane title={entry.title} />
  if (entry.id === 'apple') return <ApplePane />
  const crop = CROP_IDS.find(id => id === entry.id)
  if (crop !== undefined) return <CropPane id={crop} />
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

function CropPane({ id }: { id: CropId }) {
  const d = CROPS[id]
  const [preview, setPreview] = useState<Rarity>('common')
  const [stage, setStage] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setStage(s => (s + 1) % 3), 800)
    return () => window.clearInterval(t)
  }, [])
  const ripe = ripeStage(preview)
  const st = statsOf(id, preview, [])
  return (
    <>
      <div className="mb-2 text-lg leading-relaxed text-ink">{cropVariety(id, preview)}</div>
      <div className="mb-3 text-base leading-relaxed text-ink/70">{d.desc}</div>
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
                unitSale: st.sale,
                freshness: 1,
                bio: true,
              }),
            }}
          />
        </div>
        <div className="flex h-20 w-20 items-center justify-center bg-dirt-dark">
          <svg
            className="h-16 w-16"
            viewBox="0 0 24 24"
            dangerouslySetInnerHTML={{ __html: cropInner(id, STAGES[stage] === 'ripe' ? ripe : STAGES[stage]) }}
          />
        </div>
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

function BerryPane({ title }: { title: string }) {
  const [preview, setPreview] = useState<Rarity>('common')
  const [ripe, setRipe] = useState(false)
  useEffect(() => {
    const t = window.setInterval(() => setRipe(v => !v), 800)
    return () => window.clearInterval(t)
  }, [])
  return (
    <>
      <div className="mb-3 text-lg leading-relaxed text-ink">
        {preview === 'rare' ? 'Golden berry' : preview === 'heirloom' ? 'Black raspberry' : title}
      </div>
      <RarityTabs preview={preview} onPreview={setPreview} />
      <div className="mb-3 flex gap-3">
        <div className="flex h-20 w-20 items-center justify-center bg-dirt-dark">
          <svg
            className="h-16 w-16"
            viewBox="0 0 24 24"
            dangerouslySetInnerHTML={{ __html: faceGfx({ kind: 'berry', rarity: preview, count: 1 }) }}
          />
        </div>
        <div className="flex h-20 w-20 items-center justify-center bg-dirt-dark">
          <svg
            className="h-16 w-16"
            viewBox="0 0 24 24"
            dangerouslySetInnerHTML={{ __html: ripe ? BERRY_SHRUB : SHRUB }}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2 text-base text-ink">
        <div className="flex items-center gap-2">
          <div className="w-24 shrink-0">Grow time</div>
          <span>{Number(days(SHRUB_GROW).toFixed(2))} days</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 shrink-0">Sell</div>
          <Coin n={BERRY_SALE * RARITY_SALE[preview]} />
        </div>
      </div>
    </>
  )
}

function ApplePane() {
  const [ripe, setRipe] = useState(false)
  const [preview, setPreview] = useState<Rarity>('common')
  useEffect(() => {
    const t = window.setInterval(() => setRipe(v => !v), 800)
    return () => window.clearInterval(t)
  }, [])
  return (
    <>
      <div className="mb-2 text-lg leading-relaxed text-ink">{cropVariety('apple', preview)}</div>
      <div className="mb-3 text-base leading-relaxed text-ink/70">{CROPS.apple.desc}</div>
      <RarityTabs preview={preview} onPreview={setPreview} />
      <div className="mb-3 flex gap-3">
        <div className="flex h-20 w-20 items-center justify-center bg-dirt-dark">
          <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: faceGfx({ kind: 'fruit', crop: 'apple', rarity: preview, count: 1, unitSale: CROPS.apple.sale * RARITY_SALE[preview], freshness: 1, bio: true }) }} />
        </div>
        <div className="flex h-20 w-20 items-center justify-center bg-dirt-dark">
          <svg className="h-16 w-10" viewBox="0 0 24 48" dangerouslySetInnerHTML={{ __html: appleTreeStage(ripe) }} />
        </div>
      </div>
      <div className="flex flex-col gap-2 text-base text-ink">
        <div className="flex items-center gap-2"><div className="w-24 shrink-0">Grow time</div><span>3 days</span></div>
        <div className="flex items-center gap-2"><div className="w-24 shrink-0">Water</div><span>None</span></div>
        <div className="flex items-center gap-2"><div className="w-24 shrink-0">Sell</div><Coin n={CROPS.apple.sale * RARITY_SALE[preview]} /></div>
      </div>
    </>
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
