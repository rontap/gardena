import { memo, useEffect, useRef, useState, type PointerEvent, type WheelEvent } from 'react'
import { HEALTH } from '../defs/crops.ts'
import { COLS, DOOR, ROWS, type Coord } from '../sim/building.ts'
import type { Drop } from '../sim/drop.ts'
import { isPlot, type Plot } from '../sim/plot.ts'
import { skuItem } from '../sim/item.ts'
import type { World } from '../sim/world.ts'
import { TILE, tileVariant, type Camera } from './camera.ts'
import { ACTOR, DIRT, GRASS, HOUSE, PUMP, cropInner, itemInner } from './svgs.ts'

const GRASS_FIELD = (() => {
  let s = ''
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      s += `<g transform="translate(${col * TILE},${row * TILE}) scale(${TILE / 24})">${GRASS[tileVariant(col, row, 5)]}</g>`
    }
  }
  return s
})()

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
    onCam({ x: cam.x + px * k, y: cam.y + py * k, scale })
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
              onCam({
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
          <Ground />
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
            </g>
          )}
        </g>
      </svg>
      {ghost !== undefined && ghost.kind !== 'pumpjack' && (
        <svg
          className="pointer-events-none fixed z-30 h-8 w-8"
          style={{ left: ptr.x + 12, top: ptr.y + 12 }}
          viewBox="0 0 24 24"
          dangerouslySetInnerHTML={{ __html: itemInner(ghost) }}
        />
      )}
    </div>
  )
}

const Ground = memo(function Ground() {
  return <g dangerouslySetInnerHTML={{ __html: GRASS_FIELD }} />
})

const Marks = memo(function Marks({ world, rev }: { world: World; rev: number }) {
  void rev
  const plots: { col: number; row: number; cell: Plot }[] = []
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = world.grid[row][col]
      if (isPlot(cell) && cell.kind !== 'untilled') plots.push({ col, row, cell })
    }
  }
  return (
    <g>
      {plots.map(t => (
        <PlotGfx key={`${t.col},${t.row}`} col={t.col} row={t.row} cell={t.cell} />
      ))}
      <g transform={`translate(${14 * TILE},0) scale(${TILE / 24})`} dangerouslySetInnerHTML={{ __html: HOUSE }} />
      <g transform={`translate(${18 * TILE},${TILE}) scale(${TILE / 24})`} dangerouslySetInnerHTML={{ __html: PUMP }} />
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
    </g>
  )
})

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
  return (
    <g
      transform={`translate(${drop.at.col * TILE + 4 + (n % 2) * 6},${drop.at.row * TILE + 4 + Math.floor(n / 2) * 6}) scale(${s / 24})`}
      dangerouslySetInnerHTML={{ __html: itemInner(drop.item) }}
    />
  )
}
