import { m } from '../../paraglide/messages.js'
import { useEffect } from 'react'
import { heldText } from '../sim/item.ts'
import { lookText } from '../sim/look.ts'
import type { PromptHit } from '../sim/prompt.ts'
import type { World } from '../sim/world.ts'
import { Chrome } from './frame.tsx'
import { DashFace, ItemLineView } from './held.tsx'
import { faceGfx } from '../view/svgs.ts'
import { FERT_PLOT_MAX, SOIL_WATER_MAX, SOIL_WATER_MID } from '../sim/soil.ts'
import { isPlot } from '../sim/plot.ts'
import { HAPPY_START } from '../defs/rarity.ts'
import { craftState, isCraftCell } from '../sim/recipe.ts'
import { caskAgeMul } from '../sim/machine.ts'
import { BARREL_AGE, BARREL_MATURE } from '../defs/items.ts'
import { bindCraft } from '../view/motion.ts'
import { Recipes } from './recipe.tsx'

type Segment = { from: number; to: number; color: 'green' | 'orange' | 'red' }

const STAT_COLOR: Record<Segment['color'], string> = {
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

function StatRow({ label, value, text, segments }: { label: string; value: number; text: string; segments: readonly Segment[] }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-20 shrink-0 font-semibold text-ink/70">{label}</span>
      <SegmentBar value={value} segments={segments} />
      <span className="w-12 shrink-0 text-right tabular-nums">{text}</span>
    </div>
  )
}

function PlantStats({ world, hover }: { world: World; hover: PromptHit }) {
  if (hover.kind !== 'cell' || !world.inWorld(hover.at)) return null
  const cell = world.cell(hover.at)
  if (cell.kind === 'tree') {
    const value = cell.juvenile < 1 ? cell.juvenile : cell.fruit
    return (
      <div className="space-y-1.5 bg-dirt/25 px-3 py-2.5">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-20 shrink-0 font-semibold text-ink/70">{m.hud_growth()}</span>
          <FillBar value={value} />
          <span className="w-12 shrink-0 text-right tabular-nums">{Math.floor(value * 100)}%</span>
        </div>
      </div>
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
      <div className="space-y-1.5 bg-dirt/25 px-3 py-2.5">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-20 shrink-0 font-semibold text-ink/70">{m.hud_growth()}</span>
          <FillBar value={cell.plant.maturity} />
          <span className="w-12 shrink-0 text-right tabular-nums">{Math.floor(cell.plant.maturity * 100)}%</span>
        </div>
        <StatRow label={m.hud_happiness()} value={cell.plant.happiness} text={`${Math.floor(cell.plant.happiness * 100)}%`} segments={[{ from: 0, to: HAPPY_START / 2, color: 'red' }, { from: HAPPY_START / 2, to: HAPPY_START, color: 'orange' }, { from: HAPPY_START, to: 1, color: 'green' }]} />
        <StatRow label={m.hud_fertilizer()} value={cell.soil.fertilizer} text={`${Math.floor(cell.soil.fertilizer * 100)}%`} segments={[{ from: 0, to: fertFloor / 2, color: 'red' }, { from: fertFloor / 2, to: fertFloor, color: 'orange' }, { from: fertFloor, to: 1, color: 'green' }]} />
        <StatRow label={m.names_face_water()} value={cell.soil.water / SOIL_WATER_MAX} text={`${Number(cell.soil.water.toFixed(2))}L`} segments={[{ from: 0, to: waterRed, color: 'red' }, { from: waterRed, to: waterGreenStart, color: 'orange' }, { from: waterGreenStart, to: waterGreenEnd, color: 'green' }, { from: waterGreenEnd, to: waterRedEnd, color: 'orange' }, { from: waterRedEnd, to: 1, color: 'red' }]} />
      </div>
    )
  }
  if (cell.kind === 'ripe') {
    return (
      <div className="bg-dirt/25 px-3 py-2.5">
        <StatRow label={m.hud_freshness()} value={cell.plant.freshness} text={`${Math.floor(cell.plant.freshness * 100)}%`} segments={[{ from: 0, to: 0.8, color: 'red' }, { from: 0.8, to: 1, color: 'green' }]} />
      </div>
    )
  }
  if (cell.kind === 'empty') {
    const resist = Math.min(1, Math.max(0, (1 - cell.soil.weedChance) / 2))
    return (
      <div className="space-y-1.5 bg-dirt/25 px-3 py-2.5">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-32 shrink-0 font-semibold text-ink/70">{m.hud_fertilizer()}</span>
          <FillBar value={cell.soil.fertilizer / FERT_PLOT_MAX} />
          <span className="w-12 shrink-0 text-right tabular-nums">{Math.floor(cell.soil.fertilizer * 100)}%</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-32 shrink-0 font-semibold text-ink/70">{m.names_face_water()}</span>
          <FillBar value={cell.soil.water / SOIL_WATER_MAX} />
          <span className="w-12 shrink-0 text-right tabular-nums">{Number(cell.soil.water.toFixed(2))}L</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-32 shrink-0 font-semibold text-ink/70">{m.hud_weed_resistance()}</span>
          <SegmentBar
            value={resist}
            segments={[
              { from: 0, to: 0.5, color: 'red' },
              { from: 0.5, to: 1, color: 'green' },
            ]}
          />
          <span className="w-12 shrink-0 text-right tabular-nums">{Math.floor(resist * 100)}%</span>
        </div>
      </div>
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
  const mul = caskAgeMul(cell.feed[0].rarity, cell.age)
  return (
    <div className="bg-dirt/25 px-3 py-2.5">
      <div className="flex items-center gap-2 text-sm">
        <span className="w-20 shrink-0 font-semibold text-ink/70">{m.hud_aging()}</span>
        <FillBar value={Math.min(1, (cell.age - BARREL_MATURE) / BARREL_AGE)} />
        <span className="w-12 shrink-0 text-right tabular-nums">×{Number(mul.toFixed(2))}</span>
      </div>
    </div>
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
  const hand = seat.hand
  const look = lookText(world, hover, false)
  const body = addHint === undefined ? look : look === '' ? addHint : `${addHint}\n${look}`
  return (
    <Chrome className="relative w-full">
      <div className="relative flex items-center gap-3 px-3 py-3">
        {hand.kind === 'hold' ? (
          <svg viewBox="0 0 24 24" className="h-12 w-12 shrink-0" dangerouslySetInnerHTML={{ __html: faceGfx(hand.item) }} />
        ) : (
          <div className="h-12 w-12 shrink-0 bg-dirt-dark" />
        )}
        <div className="min-w-0 text-base leading-snug font-semibold">
          {hand.kind === 'hold' && (hand.item.kind === 'fruit' || hand.item.kind === 'sugar') ? (
            <ItemLineView item={hand.item} />
          ) : (
            heldText(hand, world.modifiers)
          )}
        </div>
      </div>
      <div
        className={`relative px-3 py-3 leading-snug whitespace-pre-line ${
          seat.place.kind !== 'none' ? 'bg-roof/20 text-sm text-roof' : 'bg-dirt/25 text-sm text-ink/80'
        }`}
      >
          {body}
        </div>
        {hover !== undefined && <PlantStats world={world} hover={hover} />}
        {hover !== undefined && <StoreContents world={world} hover={hover} />}
        {hover !== undefined && <MachineCraft world={world} hover={hover} />}
        {hover !== undefined && <BarrelAge world={world} hover={hover} />}
    </Chrome>
  )
}
