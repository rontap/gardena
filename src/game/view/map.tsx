import { memo, useEffect, useRef, useState, type PointerEvent, type WheelEvent } from 'react'
import { HEALTH } from '../defs/crops.ts'
import { COLS, DOOR, ROWS, inWorld, type Coord } from '../sim/building.ts'
import { onCell, type Drop } from '../sim/drop.ts'
import { itemTip } from '../sim/item.ts'
import { isPlot, type Plot } from '../sim/plot.ts'
import type { World } from '../sim/world.ts'
import { TILE, type Camera } from './camera.ts'
import { ACTOR, GRASS, HOUSE, PUMP, WATER, cropInner, itemInner } from './svgs.ts'

type Props = {
  world: World
  cam: Camera
  rev: number
  onCam: (c: Camera) => void
  onClickCell: (c: Coord) => void
}

export function MapView({ world, cam, rev, onCam, onClickCell }: Props) {
  const drag = useRef<{ x: number; y: number; cx: number; cy: number } | undefined>(undefined)
  const svgRef = useRef<SVGSVGElement>(null)
  const [view, setView] = useState({ w: 800, h: 600 })
  const [hover, setHover] = useState<Coord | undefined>(undefined)
  const [ptr, setPtr] = useState({ x: 0, y: 0 })

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

  const prompt = hover !== undefined ? world.prompt(hover) : undefined
  const dropTip =
    hover !== undefined && inWorld(hover)
      ? onCell(world.drops, hover).at(-1)
      : undefined

  return (
    <div className="relative h-full w-full">
      <svg
        ref={svgRef}
        className="h-full w-full cursor-crosshair bg-grass"
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
          setHover(toCell(e))
        }}
        onPointerUp={e => {
          const d = drag.current
          drag.current = undefined
          if (d === undefined) return
          if (e.button === 2) return
          if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 3) return
          onClickCell(toCell(e))
        }}
        onPointerLeave={() => setHover(undefined)}
      >
        <g
          transform={`translate(${view.w / 2},${view.h / 2}) scale(${cam.scale}) translate(${-cam.x * TILE}, ${-cam.y * TILE})`}
        >
          <Field world={world} rev={rev} />
          {hover !== undefined && (
            <g pointerEvents="none">
              <rect
                x={hover.col * TILE}
                y={hover.row * TILE}
                width={TILE}
                height={TILE}
                fill="none"
                stroke="#1c1710"
                strokeWidth={2}
              />
              {prompt !== undefined && (
                <text
                  x={(hover.col + 0.5) * TILE}
                  y={hover.row * TILE - 4}
                  textAnchor="middle"
                  fill="#1c1710"
                  fontSize={11}
                >
                  {prompt.text}
                </text>
              )}
            </g>
          )}
        </g>
      </svg>
      {dropTip !== undefined && (
        <div
          className="pointer-events-none fixed z-20 border border-ink bg-ink px-2 py-1 text-xs text-house"
          style={{ left: ptr.x + 12, top: ptr.y + 12 }}
        >
          {itemTip(dropTip.item)}
        </div>
      )}
    </div>
  )
}

const Field = memo(function Field({ world, rev }: { world: World; rev: number }) {
  const plots: { col: number; row: number; cell: Plot }[] = []
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = world.grid[row][col]
      if (isPlot(cell) && cell.kind !== 'untilled') plots.push({ col, row, cell })
    }
  }
  return (
    <g data-rev={rev}>
      <defs>
        <pattern id="untilled-grass" width={TILE * 4} height={TILE * 4} patternUnits="userSpaceOnUse">
          {[0, 1, 2, 3].flatMap(row =>
            [0, 1, 2, 3].map(col => (
              <g
                key={`${col},${row}`}
                transform={`translate(${col * TILE},${row * TILE}) scale(${TILE / 16})`}
                dangerouslySetInnerHTML={{ __html: GRASS[(col + row) % 4] }}
              />
            )),
          )}
        </pattern>
      </defs>
      <rect x={0} y={0} width={COLS * TILE} height={ROWS * TILE} fill="url(#untilled-grass)" />
      {plots.map(t => (
        <PlotGfx key={`${t.col},${t.row}`} col={t.col} row={t.row} cell={t.cell} />
      ))}
      <g transform={`translate(${14 * TILE},0) scale(2)`} dangerouslySetInnerHTML={{ __html: HOUSE }} />
      <g transform={`translate(${18 * TILE},${TILE}) scale(2)`} dangerouslySetInnerHTML={{ __html: PUMP }} />
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
      <g
        transform={`translate(${(world.actor.x - 0.5) * TILE},${(world.actor.y - 0.5) * TILE}) scale(2)`}
        dangerouslySetInnerHTML={{ __html: ACTOR }}
      />
      <circle cx={(DOOR.col + 0.5) * TILE} cy={(DOOR.row + 0.5) * TILE} r={3} className="fill-roof" />
    </g>
  )
})

function PlotGfx({ col, row, cell }: { col: number; row: number; cell: Plot }) {
  const x = col * TILE
  const y = row * TILE
  const fill = cell.kind === 'empty' ? '#8a5a32' : '#6b4423'
  const bar = (cell.kind === 'growing' || cell.kind === 'ripe') && cell.plant.thirst < HEALTH
  return (
    <g>
      <rect x={x} y={y} width={TILE} height={TILE} fill={fill} />
      {(cell.kind === 'growing' || cell.kind === 'ripe' || cell.kind === 'dead') && (
        <g
          transform={`translate(${x},${y}) scale(${TILE / 16})`}
          dangerouslySetInnerHTML={{
            __html: cropInner(cell.plant.crop, cell.plant.stage(cell.kind)),
          }}
        />
      )}
      {(cell.kind === 'growing' || cell.kind === 'ripe') && cell.plant.thirsty && (
        <g
          transform={`translate(${x},${y}) scale(${TILE / 16})`}
          opacity={cell.plant.critical ? 1 : 0.7}
          dangerouslySetInnerHTML={{ __html: WATER }}
        />
      )}
      {bar && (cell.kind === 'growing' || cell.kind === 'ripe') && (
        <g>
          <rect x={x + 2} y={y + TILE - 6} width={TILE - 4} height={4} fill="#1c1710" />
          <rect
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
  const s = 22
  return (
    <g
      transform={`translate(${drop.at.col * TILE + 4 + (n % 2) * 6},${drop.at.row * TILE + 4 + Math.floor(n / 2) * 6}) scale(${s / 16})`}
      dangerouslySetInnerHTML={{ __html: itemInner(drop.item) }}
    />
  )
}
