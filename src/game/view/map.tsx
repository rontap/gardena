import { memo, useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react'
import { HEALTH, WITHER } from '../defs/crops.ts'
import { DOOR, HOUSE_BASE, type Coord } from '../sim/building.ts'
import { onCell, type Drop } from '../sim/drop.ts'
import { isPlot, type Cell, type Plot } from '../sim/plot.ts'
import { itemLine, skuLabel } from '../sim/item.ts'
import type { SkuId } from '../sim/ids.ts'
import type { Modifier } from '../sim/modifiers.ts'
import type { World } from '../sim/world.ts'
import { TILE, clampCam, tileVariant, type Camera } from './camera.ts'
import {
  ACTOR,
  BERRY_SHRUB,
  CHEST,
  DIRT,
  GRASS,
  GRINDER,
  HARD,
  HOUSE,
  PUMP,
  ROCK,
  ROCK_LONG,
  SHRUB,
  VERY_HARD,
  cropInner,
  itemInner,
  skuInner,
} from './svgs.ts'

export type Lens = 'off' | 'water' | 'ripe' | 'kind'

const ROOF = '#8b3a2a'
const LEAF = '#6bc04a'
const WATER = '#3d7ea6'
const INK = '#1c1710'
const WASH = '#cfc6b0'
const LENS_BAD = '#e23b2e'
const LENS_MID = '#d4a017'
const LENS_GOOD = '#2fd15a'
const LENS_DONE = '#1e9be6'

const PLACE_LINE: { readonly [id: string]: string } = {
  'buy-chest': 'Place Chest',
  'buy-grinder': 'Place Seed grinder',
  'buy-pumpjack': 'Place Pumpjack',
}

function bakeGround(world: World): string {
  let s = ''
  world.forEachCell((at, cell) => {
    const art =
      cell.kind === 'untilled' && cell.ground === 'hard'
        ? HARD[tileVariant(at.col, at.row, 2)]
        : (cell.kind === 'untilled' && cell.ground === 'very-hard') || cell.kind === 'infertile'
          ? VERY_HARD
          : GRASS[tileVariant(at.col, at.row, 5)]
    s += `<g transform="translate(${at.col * TILE},${at.row * TILE}) scale(${TILE / 24})">${art}</g>`
  })
  return s
}

type Props = {
  world: World
  cam: Camera
  rev: number
  lens: Lens
  hover: Coord | undefined
  onHover: (c: Coord | undefined) => void
  onCam: (c: Camera) => void
  onClickCell: (c: Coord) => void
}

export function MapView({ world, cam, rev, lens, hover, onHover, onCam, onClickCell }: Props) {
  const drag = useRef<{ x: number; y: number; cx: number; cy: number } | undefined>(undefined)
  const svgRef = useRef<SVGSVGElement>(null)
  const [view, setView] = useState({ w: 800, h: 600 })
  const [ptr, setPtr] = useState({ x: 0, y: 0 })
  const placing = world.place.kind === 'sku'
  const prompt = hover !== undefined ? world.prompt(hover) : undefined
  const canPlace = placing && prompt?.kind === 'place'
  const placeId = world.place.kind === 'sku' ? world.place.id : undefined
  const pumpjack = placeId === 'buy-pumpjack'
  const tipDrop =
    hover !== undefined
      ? onCell(world.drops, hover)
          .at(-1)
      : undefined
  const tip =
    tipDrop !== undefined &&
    (tipDrop.item.kind === 'shovel' ||
      tipDrop.item.kind === 'pickaxe' ||
      tipDrop.item.kind === 'container' ||
      tipDrop.item.kind === 'box')
      ? itemLine(tipDrop.item, world.modifiers)
      : undefined

  function pushCam(next: Camera): void {
    onCam(clampCam(next, world.bounds()))
  }

  useEffect(() => {
    const el = svgRef.current
    if (el === null) return
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      setView({ w: r.width, h: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  function cellAt(clientX: number, clientY: number, el: SVGSVGElement): Coord {
    const r = el.getBoundingClientRect()
    const wx = cam.x + (clientX - r.left - r.width / 2) / (TILE * cam.scale)
    const wy = cam.y + (clientY - r.top - r.height / 2) / (TILE * cam.scale)
    return { col: Math.floor(wx), row: Math.floor(wy) }
  }

  function toCell(e: PointerEvent<SVGSVGElement>): Coord {
    return cellAt(e.clientX, e.clientY, e.currentTarget)
  }

  function onWheel(e: WheelEvent<SVGSVGElement>): void {
    e.preventDefault()
    const next = cam.scale * (e.deltaY < 0 ? 1.1 : 1 / 1.1)
    const scale = Math.min(3, Math.max(0.5, next))
    const r = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - r.left - r.width / 2
    const py = e.clientY - r.top - r.height / 2
    const k = 1 / (TILE * cam.scale) - 1 / (TILE * scale)
    pushCam({ x: cam.x + px * k, y: cam.y + py * k, scale })
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg
        ref={svgRef}
        className={`h-full w-full overflow-hidden bg-grass ${canPlace ? 'cursor-pointer' : 'cursor-crosshair'}`}
        onWheel={onWheel}
        onContextMenu={e => {
          e.preventDefault()
          const r = e.currentTarget.getBoundingClientRect()
          const wx = cam.x + (e.clientX - r.left - r.width / 2) / (TILE * cam.scale)
          const wy = cam.y + (e.clientY - r.top - r.height / 2) / (TILE * cam.scale)
          world.rightClick({ col: Math.floor(wx), row: Math.floor(wy) })
        }}
        onPointerDown={e => {
          if (e.button === 2) return
          drag.current = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y }
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={e => {
          setPtr({ x: e.clientX, y: e.clientY })
          const d = drag.current
          if (d !== undefined && (e.buttons & 1) === 1) {
            if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 3) {
              pushCam({
                x: d.cx - (e.clientX - d.x) / (TILE * cam.scale),
                y: d.cy - (e.clientY - d.y) / (TILE * cam.scale),
                scale: cam.scale,
              })
              return
            }
          }
          onHover(toCell(e))
        }}
        onPointerUp={e => {
          const d = drag.current
          drag.current = undefined
          if (d === undefined) return
          if (e.button === 2) return
          if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 3) return
          onClickCell(toCell(e))
        }}
        onPointerLeave={() => onHover(undefined)}
      >
        <g
          transform={`translate(${view.w / 2},${view.h / 2}) scale(${cam.scale}) translate(${-cam.x * TILE}, ${-cam.y * TILE})`}
        >
          <Ground world={world} owned={world.owned.length} />
          <Marks world={world} rev={rev} lens={lens} />
          {hover !== undefined && (
            <g pointerEvents="none">
              <rect
                x={hover.col * TILE}
                y={hover.row * TILE}
                width={TILE}
                height={TILE}
                fill="none"
                className={placing && prompt?.kind !== 'place' ? 'stroke-roof' : 'stroke-ink'}
                strokeWidth={2}
              />
              {pumpjack && (
                <rect
                  x={(hover.col + 1) * TILE}
                  y={hover.row * TILE}
                  width={TILE}
                  height={TILE}
                  fill="none"
                  className={placing && prompt?.kind !== 'place' ? 'stroke-roof' : 'stroke-ink'}
                  strokeWidth={2}
                />
              )}
            </g>
          )}
          {pumpjack && hover !== undefined && (
            <g
              pointerEvents="none"
              opacity={0.7}
              transform={`translate(${hover.col * TILE},${hover.row * TILE}) scale(${TILE / 24})`}
              dangerouslySetInnerHTML={{ __html: PUMP }}
            />
          )}
          <foreignObject
            data-speech
            pointerEvents="none"
            x={0}
            y={0}
            width={200}
            height={40}
            visibility="hidden"
          >
            <div className="flex justify-center">
              <div data-speech-text className="bg-house px-2 py-0.5 text-xs text-ink" />
            </div>
          </foreignObject>
        </g>
      </svg>
      {placeId !== undefined && !pumpjack && (
        <div className="pointer-events-none fixed z-30" style={{ left: ptr.x + 16, top: ptr.y + 16 }}>
          <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: skuInner(placeId) }} />
          <div className="mt-1 bg-house px-2 py-0.5 text-sm text-ink">{placeLine(placeId)}</div>
        </div>
      )}
      {tip !== undefined && (
        <div
          className="pointer-events-none fixed z-30 bg-ink px-2 py-1 text-xs text-house"
          style={{ left: ptr.x + 14, top: ptr.y - 28 }}
        >
          {tip}
        </div>
      )}
      {pumpjack && placeId !== undefined && hover === undefined && (
        <div className="pointer-events-none fixed z-30" style={{ left: ptr.x + 16, top: ptr.y + 16 }}>
          <svg className="h-8 w-16" viewBox="0 0 48 24" dangerouslySetInnerHTML={{ __html: PUMP }} />
          <div className="mt-1 bg-house px-2 py-0.5 text-sm text-ink">{placeLine(placeId)}</div>
        </div>
      )}
    </div>
  )
}

function placeLine(id: SkuId): string {
  const extra = PLACE_LINE[id]
  if (extra !== undefined) return extra
  return `Place ${skuLabel(id)}`
}

const Ground = memo(function Ground({ world, owned }: { world: World; owned: number }) {
  const html = useMemo(() => bakeGround(world), [world, owned])
  return <g dangerouslySetInnerHTML={{ __html: html }} />
})

const Marks = memo(function Marks({ world, rev, lens }: { world: World; rev: number; lens: Lens }) {
  void rev
  const plots: { col: number; row: number; cell: Plot }[] = []
  const rocks: { col: number; row: number; w: number; h: number }[] = []
  const shrubs: { col: number; row: number; ripe: boolean }[] = []
  const chests: Coord[] = []
  const grinders: Coord[] = []
  const tints: { col: number; row: number; fill: string; op: number; hard: boolean }[] = []
  world.forEachCell((at, cell) => {
    if (isPlot(cell) && cell.kind !== 'untilled' && cell.kind !== 'infertile') {
      plots.push({ col: at.col, row: at.row, cell })
    }
    if (cell.kind === 'rock' && cell.base.col === at.col && cell.base.row === at.row) {
      rocks.push({ col: at.col, row: at.row, w: cell.base.w, h: cell.base.h })
    }
    if (cell.kind === 'shrub') shrubs.push({ col: at.col, row: at.row, ripe: cell.ripe })
    if (cell.kind === 'chest') chests.push(at)
    if (cell.kind === 'grinder') grinders.push(at)
    const tint = lensFill(lens, cell)
    if (tint !== undefined) tints.push({ col: at.col, row: at.row, ...tint })
  })
  return (
    <g>
      {plots.map(t => (
        <PlotGfx key={`${t.col},${t.row}`} col={t.col} row={t.row} cell={t.cell} />
      ))}
      {rocks.map(r => (
        <RockGfx key={`${r.col},${r.row}`} col={r.col} row={r.row} w={r.w} h={r.h} />
      ))}
      {shrubs.map(s => (
        <g
          key={`${s.col},${s.row}`}
          transform={`translate(${s.col * TILE},${s.row * TILE}) scale(${TILE / 24})`}
          dangerouslySetInnerHTML={{ __html: s.ripe ? BERRY_SHRUB : SHRUB }}
        />
      ))}
      {world.pumps.map((p, i) => {
        const col = p.base.shape === 'rect' ? p.base.col : Math.floor(p.base.cx - p.base.r)
        const row = p.base.shape === 'rect' ? p.base.row : Math.floor(p.base.cy - p.base.r)
        return (
          <g
            key={i}
            transform={`translate(${col * TILE},${row * TILE}) scale(${TILE / 24})`}
            dangerouslySetInnerHTML={{ __html: PUMP }}
          />
        )
      })}
      {chests.map(c => (
        <g
          key={`chest-${c.col},${c.row}`}
          transform={`translate(${c.col * TILE},${c.row * TILE}) scale(${TILE / 24})`}
          dangerouslySetInnerHTML={{ __html: CHEST }}
        />
      ))}
      {grinders.map(g => (
        <g
          key={`grinder-${g.col},${g.row}`}
          transform={`translate(${g.col * TILE},${g.row * TILE}) scale(${TILE / 24})`}
          dangerouslySetInnerHTML={{ __html: GRINDER }}
        />
      ))}
      <g
        transform={`translate(${HOUSE_BASE.col * TILE},${HOUSE_BASE.row * TILE}) scale(${TILE / 24})`}
        dangerouslySetInnerHTML={{ __html: HOUSE }}
      />
      {tints.map(t => (
        <rect
          key={`tint-${t.col},${t.row}`}
          x={t.col * TILE}
          y={t.row * TILE}
          width={TILE}
          height={TILE}
          fill={t.fill}
          fillOpacity={t.op}
          style={t.hard ? { mixBlendMode: 'multiply' } : undefined}
          pointerEvents="none"
        />
      ))}
      {world.drops.map((d, i) => (
        <DropGfx key={i} drop={d} i={i} mods={world.modifiers} />
      ))}
      {world.pulse !== undefined && (
        <g pointerEvents="none">
          <rect
            x={world.pulse.at.col * TILE}
            y={world.pulse.at.row * TILE}
            width={TILE}
            height={TILE}
            fill="#d4a017"
            opacity={0.28}
          />
          <text
            x={(world.pulse.at.col + 0.5) * TILE}
            y={world.pulse.at.row * TILE + TILE - 3}
            textAnchor="middle"
            fill="#1c1710"
            fontSize={10}
          >
            {world.pulse.text}
          </text>
        </g>
      )}
      <circle cx={(DOOR.col + 0.5) * TILE} cy={(DOOR.row + 0.5) * TILE} r={3} className="fill-roof" />
      <g
        data-actor
        transform={`translate(${(world.actor.x - 0.5) * TILE},${(world.actor.y - 0.5) * TILE}) scale(${TILE / 24})`}
        dangerouslySetInnerHTML={{ __html: ACTOR }}
      />
      {world.faces().map(face => {
        const s = TILE * 0.85
        const o = (TILE - s) / 2
        const poor = world.money < face.price
        return (
          <g
            key={`${face.id.cx},${face.id.cy}`}
            className="cursor-pointer"
            transform={`translate(${face.at.col * TILE},${face.at.row * TILE})`}
            onPointerDown={e => e.stopPropagation()}
            onPointerUp={e => {
              e.stopPropagation()
              world.expand(face.id)
            }}
          >
            <rect x={o} y={o} width={s} height={s} className={poor ? 'fill-dirt-dark' : 'fill-house'} />
            <text
              x={TILE / 2}
              y={TILE / 2 + 3}
              textAnchor="middle"
              className={poor ? 'fill-ink/50' : 'fill-ink'}
              fontSize={8}
            >
              {`Expand $${face.price}`}
            </text>
          </g>
        )
      })}
    </g>
  )
})

function lensFill(lens: Lens, cell: Cell): { fill: string; op: number; hard: boolean } | undefined {
  if (lens === 'off') return undefined
  const hit = lensHit(lens, cell)
  if (hit === undefined) return { fill: WASH, op: 0.35, hard: false }
  return { fill: hit, op: 0.72, hard: true }
}

function lensHit(lens: Lens, cell: Cell): string | undefined {
  if (lens === 'water') {
    if (cell.kind !== 'growing' && cell.kind !== 'ripe') return undefined
    if (cell.plant.thirst === 1) return LENS_DONE
    return scaleTint(cell.plant.thirst)
  }
  if (lens === 'ripe') {
    if (cell.kind === 'growing') return scaleTint(cell.plant.maturity)
    if (cell.kind === 'ripe') return LENS_DONE
    if (cell.kind === 'dead') return LENS_BAD
    return undefined
  }
  if (cell.kind === 'growing' || cell.kind === 'ripe' || cell.kind === 'dead' || cell.kind === 'shrub') return LEAF
  if (cell.kind === 'pump' || cell.kind === 'chest' || cell.kind === 'grinder') return WATER
  if (cell.kind === 'rock') return INK
  if (cell.kind === 'house') return ROOF
  return undefined
}

function scaleTint(t: number): string {
  if (t < 0.5) return mix(LENS_BAD, LENS_MID, t * 2)
  return mix(LENS_MID, LENS_GOOD, (t - 0.5) * 2)
}

function mix(a: string, b: string, t: number): string {
  const pa = [Number.parseInt(a.slice(1, 3), 16), Number.parseInt(a.slice(3, 5), 16), Number.parseInt(a.slice(5, 7), 16)]
  const pb = [Number.parseInt(b.slice(1, 3), 16), Number.parseInt(b.slice(3, 5), 16), Number.parseInt(b.slice(5, 7), 16)]
  const hex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${hex(Math.round(pa[0] + (pb[0] - pa[0]) * t))}${hex(Math.round(pa[1] + (pb[1] - pa[1]) * t))}${hex(Math.round(pa[2] + (pb[2] - pa[2]) * t))}`
}

function RockGfx({ col, row, w, h }: { col: number; row: number; w: number; h: number }) {
  if (w === 1 && h === 2) {
    return (
      <g
        transform={`translate(${col * TILE + TILE},${row * TILE}) rotate(90) scale(${TILE / 24})`}
        dangerouslySetInnerHTML={{ __html: ROCK_LONG }}
      />
    )
  }
  if (w === 2 && h === 1) {
    return (
      <g
        transform={`translate(${col * TILE},${row * TILE}) scale(${TILE / 24})`}
        dangerouslySetInnerHTML={{ __html: ROCK_LONG }}
      />
    )
  }
  return (
    <g
      transform={`translate(${col * TILE},${row * TILE}) scale(${TILE / 24})`}
      dangerouslySetInnerHTML={{ __html: ROCK }}
    />
  )
}

function PlotGfx({ col, row, cell }: { col: number; row: number; cell: Plot }) {
  const x = col * TILE
  const y = row * TILE
  const bar = (cell.kind === 'growing' || cell.kind === 'ripe') && cell.plant.thirst < HEALTH
  const wilt = cell.kind === 'growing' && cell.plant.thirst < WITHER
  return (
    <g>
      <g
        transform={`translate(${x},${y}) scale(${TILE / 24})`}
        dangerouslySetInnerHTML={{ __html: DIRT[tileVariant(col, row, 2)] }}
      />
      {(cell.kind === 'growing' || cell.kind === 'ripe' || cell.kind === 'dead') && (
        <g
          transform={`translate(${x},${y}) scale(${TILE / 24})`}
          dangerouslySetInnerHTML={{
            __html: cropInner(cell.plant.crop, cell.plant.stage(cell.kind)),
          }}
        />
      )}
      {bar && (cell.kind === 'growing' || cell.kind === 'ripe') && (
        <g className={wilt ? 'animate-pulse' : undefined}>
          <rect x={x + 2} y={y + TILE - 6} width={TILE - 4} height={4} fill="#1c1710" />
          <rect
            data-thirst={`${col},${row}`}
            x={x + 3}
            y={y + TILE - 5}
            width={(TILE - 6) * cell.plant.thirst}
            height={2}
            fill={cell.plant.critical ? '#8b3a2a' : '#3d7ea6'}
          />
        </g>
      )}
    </g>
  )
}

function DropGfx({ drop, i, mods }: { drop: Drop; i: number; mods: readonly Modifier[] }) {
  const n = i % 4
  const s = 33
  const tool =
    drop.item.kind === 'shovel' ||
    drop.item.kind === 'pickaxe' ||
    drop.item.kind === 'container' ||
    drop.item.kind === 'box'
  return (
    <g
      transform={`translate(${drop.at.col * TILE + 4 + (n % 2) * 6},${drop.at.row * TILE + 4 + Math.floor(n / 2) * 6}) scale(${s / 24})`}
    >
      <g dangerouslySetInnerHTML={{ __html: itemInner(drop.item) }} />
      {tool && <title>{itemLine(drop.item, mods)}</title>}
    </g>
  )
}
