import { m } from '../../paraglide/messages.js'
import '../defs/math.ts'
import { useEffect, type ReactNode } from 'react'
import { heldText, itemGauge, toolName, type Gauge, type Hand } from '../sim/item.ts'
import type { Modifier } from '../sim/modifiers.ts'
import { cellGauge, lookText } from '../sim/look.ts'
import { onCell } from '../sim/drop.ts'
import type { Prompt, PromptHit } from '../sim/prompt.ts'
import type { Intent, World } from '../sim/world.ts'
import { Chrome } from './frame.tsx'
import { DashFace, ItemLineView } from './held.tsx'
import { faceGfx } from '../view/svgs.ts'
import { FERT_PLOT_MAX, SOIL_WATER_MAX, SOIL_WATER_MID } from '../sim/soil.ts'
import { isPlot } from '../sim/plot.ts'
import { HAPPY_START } from '../defs/crops.ts'
import { craftState, isCraftCell } from '../sim/feature-machines/recipe.ts'
import { caskAgeMul, meanQuality } from '../sim/feature-machines/machine.ts'
import { BARREL_AGE, BARREL_MATURE } from '../defs/items.ts'
import { bindCraft } from '../view/motion.ts'
import { Recipes } from './recipe.tsx'

type Segment = { from: number; to: number; color: 'green' | 'orange' | 'red' }

export const STAT_COLOR: Record<'green' | 'orange' | 'red', string> = {
  green: '#4f9d69',
  orange: '#d69a3a',
  red: '#c9574b',
}

const GROWTH_BLUE = '#4b91c2'
const GROWTH_EMPTY = '#8b887d'

function SegmentBar({ value, segments }: { value: number; segments: readonly Segment[] }) {
  return (
    <div className="relative flex h-3 min-w-0 flex-1 overflow-hidden rounded-sm border border-ink/50 bg-ink/20">
      {segments.map(segment => (
        <div
          key={`${segment.from}-${segment.to}`}
          className="h-full"
          style={{ width: `${(segment.to - segment.from) * 100}%`, backgroundColor: STAT_COLOR[segment.color] }}
        />
      ))}
      <div
        className="absolute -top-1 z-10 h-5 w-1 -translate-x-1/2 rounded-sm border border-ink bg-[#fff6d5] shadow-[0_0_0_1px_#fff6d5]"
        style={{ left: `${value * 100}%` }}
      />
    </div>
  )
}

function FillBar({ value }: { value: number }) {
  return (
    <div className="relative h-3 min-w-0 flex-1 overflow-hidden rounded-sm border border-ink/50 bg-ink/20">
      <div className="h-full" style={{ width: `${value * 100}%`, backgroundColor: GROWTH_BLUE }} />
      <div className="absolute inset-y-0 right-0" style={{ width: `${(1 - value) * 100}%`, backgroundColor: GROWTH_EMPTY }} />
    </div>
  )
}

function Rows({ children }: { children: ReactNode }) {
  return <div className="space-y-1.5 bg-dirt/25 px-3 py-2.5">{children}</div>
}

function Row({ label, bar, text }: { label: string; bar: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-28 shrink-0 font-semibold text-ink/70">{label}</span>
      {bar}
      <span className="w-12 shrink-0 text-right tabular-nums">{text}</span>
    </div>
  )
}

function FillRow({ label, value, text }: { label: string; value: number; text: string }) {
  return <Row label={label} bar={<FillBar value={value} />} text={text} />
}

function StatRow({ label, value, text, segments }: { label: string; value: number; text: string; segments: readonly Segment[] }) {
  return <Row label={label} bar={<SegmentBar value={value} segments={segments} />} text={text} />
}

function GaugeRow({ gauge }: { gauge: Gauge }) {
  return <FillRow label={gauge.label} value={gauge.value / gauge.max} text={String(Math.visualRound(gauge.value))} />
}

function pct(n: number): string {
  return `${Math.floor(n * 100)}%`
}

function liters(n: number): string {
  return `${Math.visualRound(n)}L`
}

const FRESH_SEGMENTS: readonly Segment[] = [
  { from: 0, to: 0.8, color: 'red' },
  { from: 0.8, to: 1, color: 'green' },
]

function FruitStats({ quality, freshness }: { quality: number; freshness: number }) {
  return (
    <Rows>
      <FillRow label={m.hud_quality()} value={quality} text={pct(quality)} />
      <StatRow label={m.hud_freshness()} value={freshness} text={pct(freshness)} segments={FRESH_SEGMENTS} />
    </Rows>
  )
}

function CellGauge({ world, hover }: { world: World; hover: PromptHit }) {
  if (hover.kind !== 'cell' || !world.inWorld(hover.at)) return null
  const gauge = cellGauge(world.cell(hover.at))
  if (gauge === undefined) return null
  return (
    <Rows>
      <GaugeRow gauge={gauge} />
    </Rows>
  )
}

function DropStats({ world, hover }: { world: World; hover: PromptHit }) {
  if (hover.kind !== 'cell' || !world.inWorld(hover.at)) return null
  const item = onCell(world.drops, hover.at).at(-1)?.item
  if (item === undefined) return null
  if (item.kind === 'fruit') return <FruitStats quality={item.quality} freshness={item.freshness} />
  const gauge = itemGauge(item)
  if (gauge === undefined) return null
  return (
    <Rows>
      <GaugeRow gauge={gauge} />
    </Rows>
  )
}

function SoilRows({ fertilizer, water }: { fertilizer: number; water: number }) {
  return (
    <>
      <FillRow label={m.hud_fertilizer()} value={fertilizer / FERT_PLOT_MAX} text={pct(fertilizer)} />
      <FillRow label={m.names_face_water()} value={water / SOIL_WATER_MAX} text={liters(water)} />
    </>
  )
}

function PlantStats({ world, hover }: { world: World; hover: PromptHit }) {
  if (hover.kind !== 'cell' || !world.inWorld(hover.at)) return null
  const cell = world.cell(hover.at)
  if (cell.kind === 'tree') {
    const value = cell.juvenile < 1 ? cell.juvenile : cell.fruit
    return (
      <Rows>
        <FillRow label={m.hud_growth()} value={value} text={pct(value)} />
      </Rows>
    )
  }
  if (!isPlot(cell)) return null
  if (cell.kind === 'growing') {
    const stats = cell.plant.stats(world.modifiers)
    const fertFloor = FERT_PLOT_MAX - stats.fertTolerance
    const waterTol = stats.waterTolerance
    const waterRedDistance = (SOIL_WATER_MID + waterTol) / 2
    const waterRed = (SOIL_WATER_MID - waterRedDistance) / SOIL_WATER_MAX
    const waterGreenStart = (SOIL_WATER_MID - waterTol) / SOIL_WATER_MAX
    const waterGreenEnd = (SOIL_WATER_MID + waterTol) / SOIL_WATER_MAX
    const waterRedEnd = (SOIL_WATER_MID + waterRedDistance) / SOIL_WATER_MAX
    return (
      <Rows>
        <FillRow label={m.hud_growth()} value={cell.plant.maturity} text={pct(cell.plant.maturity)} />
        <StatRow label={m.hud_happiness()} value={cell.plant.happiness} text={pct(cell.plant.happiness)} segments={[{ from: 0, to: HAPPY_START / 2, color: 'red' }, { from: HAPPY_START / 2, to: HAPPY_START, color: 'orange' }, { from: HAPPY_START, to: 1, color: 'green' }]} />
        <StatRow label={m.hud_fertilizer()} value={cell.soil.fertilizer} text={pct(cell.soil.fertilizer)} segments={[{ from: 0, to: fertFloor / 2, color: 'red' }, { from: fertFloor / 2, to: fertFloor, color: 'orange' }, { from: fertFloor, to: 1, color: 'green' }]} />
        <StatRow label={m.names_face_water()} value={cell.soil.water / SOIL_WATER_MAX} text={liters(cell.soil.water)} segments={[{ from: 0, to: waterRed, color: 'red' }, { from: waterRed, to: waterGreenStart, color: 'orange' }, { from: waterGreenStart, to: waterGreenEnd, color: 'green' }, { from: waterGreenEnd, to: waterRedEnd, color: 'orange' }, { from: waterRedEnd, to: 1, color: 'red' }]} />
      </Rows>
    )
  }
  if (cell.kind === 'weed') {
    return (
      <Rows>
        <FillRow label={m.hud_growth()} value={cell.weed.maturity} text={pct(cell.weed.maturity)} />
        <SoilRows fertilizer={cell.soil.fertilizer} water={cell.soil.water} />
      </Rows>
    )
  }
  if (cell.kind === 'ripe') {
    return <FruitStats quality={cell.plant.quality} freshness={cell.plant.freshness} />
  }
  if (cell.kind === 'empty') {
    const resist = Math.min(1, Math.max(0, (1 - cell.soil.weedChance) / 2))
    return (
      <Rows>
        <SoilRows fertilizer={cell.soil.fertilizer} water={cell.soil.water} />
        <StatRow
          label={m.hud_weed_resistance()}
          value={resist}
          text={pct(resist)}
          segments={[
            { from: 0, to: 0.5, color: 'red' },
            { from: 0.5, to: 1, color: 'green' },
          ]}
        />
      </Rows>
    )
  }
  return null
}

function StoreContents({ world, hover }: { world: World; hover: PromptHit }) {
  if (hover.kind !== 'cell' || !world.inWorld(hover.at)) return null
  const cell = world.cell(hover.at)
  if (cell.kind !== 'chest' && cell.kind !== 'freezer') return null
  if (!cell.slots.some(s => s.kind === 'hold')) return null
  return (
    <div className="flex flex-wrap gap-1.5 bg-dirt/25 px-3 py-2.5">
      {cell.slots.map((s, i) => (s.kind === 'hold' ? <DashFace key={i} item={s.item} /> : null))}
    </div>
  )
}

function BarrelAge({ world, hover }: { world: World; hover: PromptHit }) {
  if (hover.kind !== 'cell' || !world.inWorld(hover.at)) return null
  const cell = world.cell(hover.at)
  if (cell.kind !== 'barrel' || cell.crop === 'none' || cell.age < BARREL_MATURE) return null
  const mul = caskAgeMul(cell.age, meanQuality(cell.feed))
  return (
    <Rows>
      <FillRow
        label={m.hud_aging()}
        value={Math.min(1, (cell.age - BARREL_MATURE) / BARREL_AGE)}
        text={`×${Math.visualRound(mul)}`}
      />
    </Rows>
  )
}

function MachineCraft({ world, hover }: { world: World; hover: PromptHit }) {
  const cell = hover.kind === 'cell' && world.inWorld(hover.at) ? world.cell(hover.at) : undefined
  const machine = cell !== undefined && isCraftCell(cell) ? cell : undefined
  useEffect(() => {
    bindCraft(machine)
    return () => bindCraft(undefined)
  }, [machine])
  if (machine === undefined) return null
  return (
    <div className="bg-dirt/25 px-3 py-2.5">
      <Recipes view={{ kind: 'live', craft: craftState(machine, world.machineMul(), world.furnaceMulFor(machine.base)) }} size="md" />
    </div>
  )
}

function LookBlock({ body, armed }: { body: string; armed: boolean }) {
  const nl = body.indexOf('\n')
  const title = nl < 0 ? body : body.slice(0, nl)
  const rest = nl < 0 ? '' : body.slice(nl + 1)
  return (
    <div
      data-look
      className={`relative px-3 py-3 leading-snug ${
        armed ? 'bg-roof/20 text-sm text-roof' : 'bg-dirt/25 text-sm text-ink/80'
      }`}
    >
      <div className="truncate font-display text-sm leading-tight whitespace-nowrap">{title}</div>
      {rest !== '' && <div className="mt-1 whitespace-pre-line">{rest}</div>}
    </div>
  )
}

const OPEN_ACTS: readonly Intent['act'][] = ['inventory', 'chest', 'silo', 'additives', 'hangar', 'vehicle']

export function actionText(world: World, prompt: Prompt): string | undefined {
  if (prompt.kind === 'blocked') return undefined
  if (prompt.kind === 'place') return prompt.text
  const act = prompt.intent.act
  if (act === 'station') {
    if (world.canStation(prompt.intent.at)) return prompt.text
    return m.prompt_open({ name: m.prompt_station() })
  }
  if (OPEN_ACTS.includes(act)) return m.prompt_open({ name: prompt.text })
  return prompt.text
}

function ActionBand({ action }: { action: string | undefined }) {
  return (
    <div data-action className="bg-dirt/45 px-3 py-2.5 text-sm">
      {action === undefined ? (
        <span className="text-ink/45">{m.prompt_emdash()}</span>
      ) : (
        <span className="font-semibold text-ink">{m.prompt_click_to({ action })}</span>
      )}
    </div>
  )
}

function HandBlock({ hand, mods }: { hand: Hand; mods: readonly Modifier[] }) {
  return (
    <div data-hand className="relative flex h-20 items-center gap-3 px-3">
      {hand.kind === 'hold' ? (
        <svg viewBox="0 0 24 24" className="h-12 w-12 shrink-0" dangerouslySetInnerHTML={{ __html: faceGfx(hand.item) }} />
      ) : (
        <div className="h-12 w-12 shrink-0 bg-dirt-dark" />
      )}
      <div className="min-w-0 flex-1">
        <HandLine hand={hand} mods={mods} />
      </div>
    </div>
  )
}

function HandName({ children }: { children: ReactNode }) {
  return <div className="truncate font-display text-sm leading-tight whitespace-nowrap">{children}</div>
}

function HandLine({ hand, mods }: { hand: Hand; mods: readonly Modifier[] }) {
  const gauge = hand.kind === 'hold' ? itemGauge(hand.item) : undefined
  if (gauge !== undefined) {
    return (
      <div className="space-y-1.5">
        <HandName>{toolName(hand)}</HandName>
        <GaugeRow gauge={gauge} />
      </div>
    )
  }
  if (
    hand.kind === 'hold' &&
    (hand.item.kind === 'fruit' || hand.item.kind === 'sugar' || hand.item.kind === 'treasure')
  ) {
    return (
      <HandName>
        <ItemLineView item={hand.item} />
      </HandName>
    )
  }
  return <HandName>{heldText(hand, mods)}</HandName>
}

export function Status({
  world,
  hover,
  addHint,
}: {
  world: World
  hover: PromptHit | undefined
  addHint?: string
}) {
  const seat = world.seats[world.local]
  const prompt = world.promptHit(hover)
  const action = actionText(world, prompt)
  const look = lookText(world, hover, false)
  const info = action !== undefined || look === prompt.text ? look : `${look}\n${prompt.text}`
  const body = addHint === undefined ? info : `${addHint}\n${info}`
  return (
    <Chrome className="relative w-full">
      <LookBlock body={body} armed={seat.place.kind !== 'none'} />
      {hover !== undefined && <CellGauge world={world} hover={hover} />}
      {hover !== undefined && <PlantStats world={world} hover={hover} />}
      {hover !== undefined && <DropStats world={world} hover={hover} />}
      {hover !== undefined && <StoreContents world={world} hover={hover} />}
      {hover !== undefined && <MachineCraft world={world} hover={hover} />}
      {hover !== undefined && <BarrelAge world={world} hover={hover} />}
      <ActionBand action={action} />
      <HandBlock hand={seat.hand} mods={world.modifiers} />
    </Chrome>
  )
}
