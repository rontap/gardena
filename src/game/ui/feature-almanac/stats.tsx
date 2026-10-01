import { Fragment, useContext, useState, type ReactNode } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { m } from '../../../paraglide/messages.js'
import type { CatalogEntry } from '../../defs/catalog.ts'
import { CROP_NAME, CROPS, varietyName } from '../../defs/crops.ts'
import { NEIGHBOUR_REACH } from '../../defs/items.ts'
import type { Rules } from '../../defs/rules.ts'
import { SKUS } from '../../defs/research.ts'
import { TREES, TREE_RATE_HAPPY, TREE_RATE_ON } from '../../defs/trees.ts'
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
  type AlmanacEntry,
  type Purpose,
  type VarietyId,
} from '../../defs/varieties.ts'
import { PLANT_CROPS, TREE_IDS, type GrownCrop, type TreeId } from '../../sim/ids.ts'
import { faceName, type Face } from '../../sim/item.ts'
import { difficultyModifier, statsOf, type Stats } from '../../sim/modifiers.ts'
import { recipesUsing, type MachineId, type Recipe } from '../../sim/feature-machines/recipe.ts'
import { DAY_SECONDS, days } from '../../sim/clock.ts'
import type { World } from '../../sim/world.ts'
import { FERT_PLOT_MAX, SOIL_WATER_MID, TREE_FERT_MAX, TREE_WATER_MID } from '../../sim/soil.ts'
import { cropInner, faceGfx, itemInner, ripeGroup, treeStage, UI_ARROW_FILL, UI_ARROW_INK } from '../../view/svgs.ts'
import { Coin, tabSelectClass, tabSelectListClass } from '../frame.tsx'
import { useCycle } from '../cycle.ts'
import { BLUE, BROWN, GREEN, Portrait } from './almanac-cards.tsx'
import type { AlmanacDone } from './almanac.tsx'
import { AlmanacTip, skuEntry, STAGES, toolIds, TREE_STAGES, type Price, type ToolFamily } from './nav.tsx'

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
        <Portrait caption={m.almanac_caption_fruit()} fill={BROWN}>
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

export function CropPane({ crop, n, done, rules }: { crop: GrownCrop; n: number; done: AlmanacDone; rules: Rules }) {
  return (
    <CropShell
      crop={crop}
      n={n}
      done={done}
      ground={BROWN}
      growing={v => <PlantGrowing crop={crop} variety={v} />}
      lines={v => plantLines(crop, v, n, rules)}
    />
  )
}

export function TreePane({ tree, n, done, rules }: { tree: TreeId; n: number; done: AlmanacDone; rules: Rules }) {
  return (
    <CropShell
      crop={tree}
      n={n}
      done={done}
      ground={GREEN}
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

export function ToolPane({ title, family, byId, world }: { title: string; family: ToolFamily; byId: Map<string, CatalogEntry>; world: World }) {
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
            <Portrait key={id} caption={entry.title} fill={BLUE}>
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

export function RecipeSale({ recipe }: { recipe: Recipe }) {
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
    <div onPointerEnter={() => setTip({ title: faceName(face), recipes: [recipe] })} onPointerLeave={() => setTip(undefined)}>
      <Portrait caption={faceName(face)} fill={BLUE}>
        <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: faceGfx(face) }} />
      </Portrait>
    </div>
  )
}
