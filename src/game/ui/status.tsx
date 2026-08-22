import { heldText } from '../sim/item.ts'
import { lookText } from '../sim/look.ts'
import type { PromptHit } from '../sim/prompt.ts'
import type { World } from '../sim/world.ts'
import { Chrome } from './frame.tsx'
import { ItemLineView } from './held.tsx'
import { faceGfx } from '../view/svgs.ts'
import { FERT_PLOT_MAX, SOIL_WATER_MAX, SOIL_WATER_MID } from '../sim/soil.ts'
import { isPlot } from '../sim/plot.ts'
import { HAPPY_START } from '../defs/rarity.ts'

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
  if (!isPlot(world.cell(hover.at))) return null
  const cell = world.cell(hover.at)
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
          <span className="w-20 shrink-0 font-semibold text-ink/70">Growth</span>
          <FillBar value={cell.plant.maturity} />
          <span className="w-12 shrink-0 text-right tabular-nums">{Math.floor(cell.plant.maturity * 100)}%</span>
        </div>
        <StatRow label="Happiness" value={cell.plant.happiness} text={`${Math.floor(cell.plant.happiness * 100)}%`} segments={[{ from: 0, to: HAPPY_START / 2, color: 'red' }, { from: HAPPY_START / 2, to: HAPPY_START, color: 'orange' }, { from: HAPPY_START, to: 1, color: 'green' }]} />
        <StatRow label="Fertilizer" value={cell.soil.fertilizer} text={`${Math.floor(cell.soil.fertilizer * 100)}%`} segments={[{ from: 0, to: fertFloor / 2, color: 'red' }, { from: fertFloor / 2, to: fertFloor, color: 'orange' }, { from: fertFloor, to: 1, color: 'green' }]} />
        <StatRow label="Water" value={cell.soil.water / SOIL_WATER_MAX} text={`${Number(cell.soil.water.toFixed(2))}L`} segments={[{ from: 0, to: waterRed, color: 'red' }, { from: waterRed, to: waterGreenStart, color: 'orange' }, { from: waterGreenStart, to: waterGreenEnd, color: 'green' }, { from: waterGreenEnd, to: waterRedEnd, color: 'orange' }, { from: waterRedEnd, to: 1, color: 'red' }]} />
      </div>
    )
  }
  if (cell.kind === 'ripe') {
    return (
      <div className="bg-dirt/25 px-3 py-2.5">
        <StatRow label="Freshness" value={cell.plant.freshness} text={`${Math.floor(cell.plant.freshness * 100)}%`} segments={[{ from: 0, to: 0.8, color: 'red' }, { from: 0.8, to: 1, color: 'green' }]} />
      </div>
    )
  }
  return null
}

export function Status({ world, hover }: { world: World; hover: PromptHit | undefined }) {
  const hand = world.hand
  return (
    <Chrome className="relative w-full">
      <div className="relative flex items-center gap-3 px-3 py-3">
        {hand.kind === 'hold' ? (
          <svg viewBox="0 0 24 24" className="h-12 w-12 shrink-0" dangerouslySetInnerHTML={{ __html: faceGfx(hand.item) }} />
        ) : (
          <div className="h-12 w-12 shrink-0 bg-dirt-dark" />
        )}
        <div className="min-w-0 text-base leading-snug font-semibold">
          {hand.kind === 'hold' && (hand.item.kind === 'fruit' || hand.item.kind === 'berry') ? (
            <ItemLineView item={hand.item} />
          ) : (
            heldText(hand, world.modifiers)
          )}
        </div>
      </div>
      <div
        className={`relative px-3 py-3 leading-snug whitespace-pre-line ${
          world.place.kind !== 'none' ? 'bg-roof/20 text-sm text-roof' : 'bg-dirt/25 text-sm text-ink/80'
        }`}
      >
          {lookText(world, hover, false)}
        </div>
        {hover !== undefined && <PlantStats world={world} hover={hover} />}
    </Chrome>
  )
}
