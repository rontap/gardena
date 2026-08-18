import { memo, useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react'
import { HEALTH } from '../defs/crops.ts'
import { DOOR, HOUSE_BASE, type Coord } from '../sim/building.ts'
import { onCell, type Drop } from '../sim/drop.ts'
import { isPlot, type Plot } from '../sim/plot.ts'
import { itemLine, skuItem, skuLabel } from '../sim/item.ts'
import type { World } from '../sim/world.ts'
import { TILE, clampCam, tileVariant, type Camera } from './camera.ts'
import {
  ACTOR,
  BERRY_SHRUB,
  DIRT,
  GRASS,
  HARD,
  HOUSE,
  PUMP,
  ROCK,
  ROCK_LONG,
  SHRUB,
  VERY_HARD,
  cropInner,
  itemInner,
} from './svgs.ts'

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
  hover: Coord | undefined
  onHover: (c: Coord | undefined) => void
  onCam: (c: Camera) => void
  onClickCell: (c: Coord) => void
}

export function MapView({ world, cam, rev, hover, onHover, onCam, onClickCell }: Props) {
  const drag = useRef<{ x: number; y: number; cx: number; cy: number } | undefined>(undefined)
  const svgRef = useRef<SVGSVGElement>(null)
  const [view, setView] = useState({ w: 800, h: 600 })
  const [ptr, setPtr] = useState({ x: 0, y: 0 })
  const placing = world.place.kind === 'sku'
  const prompt = hover !== undefined ? world.prompt(hover) : undefined
  const canPlace = placing && prompt?.kind === 'place'
  const ghost = world.place.kind === 'sku' ? skuItem(world.place.id) : undefined
  const pumpjack = ghost?.kind === 'pumpjack'
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
      ? itemLine(tipDrop.item)
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
          <Marks world={world} rev={rev} />
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
        </g>
      </svg>
      {ghost !== undefined && ghost.kind !== 'pumpjack' && world.place.kind === 'sku' && (
        <div className="pointer-events-none fixed z-30" style={{ left: ptr.x + 16, top: ptr.y + 16 }}>
          <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: itemInner(ghost) }} />
          <div className="mt-1 bg-house px-2 py-0.5 text-sm text-ink">{`Place ${skuLabel(world.place.id)}`}</div>
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
      {pumpjack && world.place.kind === 'sku' && hover === undefined && (
        <div className="pointer-events-none fixed z-30" style={{ left: ptr.x + 16, top: ptr.y + 16 }}>
          <svg className="h-8 w-16" viewBox="0 0 48 24" dangerouslySetInnerHTML={{ __html: PUMP }} />
          <div className="mt-1 bg-house px-2 py-0.5 text-sm text-ink">{`Place ${skuLabel(world.place.id)}`}</div>
        </div>
      )}
    </div>
  )
}

const Ground = memo(function Ground({ world, owned }: { world: World; owned: number }) {
  const html = useMemo(() => bakeGround(world), [world, owned])
  return <g dangerouslySetInnerHTML={{ __html: html }} />
})

const Marks = memo(function Marks({ world, rev }: { world: World; rev: number }) {
  void rev
  const plots: { col: number; row: number; cell: Plot }[] = []
  const rocks: { col: number; row: number; w: number; h: number }[] = []
  const shrubs: { col: number; row: number; ripe: boolean }[] = []
  world.forEachCell((at, cell) => {
    if (isPlot(cell) && cell.kind !== 'untilled' && cell.kind !== 'infertile') {
      plots.push({ col: at.col, row: at.row, cell })
    }
    if (cell.kind === 'rock' && cell.base.col === at.col && cell.base.row === at.row) {
      rocks.push({ col: at.col, row: at.row, w: cell.base.w, h: cell.base.h })
    }
    if (cell.kind === 'shrub') shrubs.push({ col: at.col, row: at.row, ripe: cell.ripe })
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
      <g
        transform={`translate(${HOUSE_BASE.col * TILE},${HOUSE_BASE.row * TILE}) scale(${TILE / 24})`}
        dangerouslySetInnerHTML={{ __html: HOUSE }}
      />
      {world.drops.map((d, i) => (
        <DropGfx key={i} drop={d} i={i} />
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
      {world.faces().map(face => (
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
          <rect x={4} y={16} width={40} height={14} className="fill-house" />
          <text x={TILE / 2} y={27} textAnchor="middle" fill="#1c1710" fontSize={8}>
            {`expand ${face.price}`}
          </text>
        </g>
      ))}
    </g>
  )
})

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
        <g>
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

function DropGfx({ drop, i }: { drop: Drop; i: number }) {
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
      {tool && <title>{itemLine(drop.item)}</title>}
    </g>
  )
}
