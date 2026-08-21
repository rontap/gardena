import { memo, useEffect, useMemo, useRef, useState, type WheelEvent } from 'react'
import { HEALTH, WITHER } from '../defs/crops.ts'
import { SKUS } from '../defs/research.ts'
import { DOOR, HOUSE_BASE, occupiedCells, type Coord } from '../sim/building.ts'
import { onCell, type Drop } from '../sim/drop.ts'
import { isPlot, type Cell, type Plot } from '../sim/plot.ts'
import { itemLine, skuLabel } from '../sim/item.ts'
import { Coin } from '../ui/frame.tsx'
import type { SkuId } from '../sim/ids.ts'
import type { Modifier } from '../sim/modifiers.ts'
import { aoe, edgeKey, incident, type Edge, type Sprinkler, type Vertex } from '../sim/pipe.ts'
import type { PromptHit } from '../sim/prompt.ts'
import type { Place, World } from '../sim/world.ts'
import { TILE, clampCam, tileVariant, type Camera } from './camera.ts'
import {
  ACTOR,
  BERRY_SHRUB,
  appleTreeStage,
  CHEST,
  CROP_ROTTEN,
  DIRT,
  GRASS,
  GRINDER,
  HARD,
  HOUSE,
  OVERLAY_WATER,
  PUMP,
  ROCK,
  ROCK_LONG,
  SHRUB,
  TRUCK,
  SPRINKLER,
  SPRINKLER_LARGE,
  SPRINKLER_VERT,
  VERY_HARD,
  WELL,
  cropInner,
  faceGfx,
  pipeFit,
  qualityPip,
  ripeGroup,
  skuInner,
} from './svgs.ts'

export type Lens = 'off' | 'water' | 'ripe' | 'kind' | 'rarity' | 'pipes'

export type { Edge, Sprinkler, Vertex }

export type MapClick = PromptHit

const ROOF = '#8b3a2a'
const LEAF = '#6bc04a'
const WATER = '#3d7ea6'
const INK = '#1c1710'
const WASH = '#cfc6b0'
const LENS_BAD = '#e23b2e'
const LENS_MID = '#d4a017'
const LENS_GOOD = '#2fd15a'
const LENS_DONE = '#1e9be6'

const EDGE_HIT = 0.35

const PLACE_LINE: { readonly [id: string]: string } = {
  'buy-chest': 'Place Chest',
  'buy-grinder': 'Place Seed grinder',
  'buy-pumpjack': 'Place Pumpjack',
  'buy-well': 'Place Well',
  'buy-pipe': 'Place Pipe',
  'buy-sprinkler': 'Place Sprinkler',
  'buy-sprinkler-vert': 'Place Vertical sprinkler',
  'buy-sprinkler-large': 'Place Large sprinkler',
}

const PIPE_PLACE: readonly SkuId[] = [
  'buy-pipe',
  'buy-sprinkler',
  'buy-sprinkler-vert',
  'buy-sprinkler-large',
  'buy-well',
  'buy-pumpjack',
]

const AOE_WASH: readonly SkuId[] = [
  'buy-pipe',
  'buy-sprinkler',
  'buy-sprinkler-vert',
  'buy-sprinkler-large',
]

const STAY_ARMED: readonly SkuId[] = [
  'buy-pipe',
  'buy-sprinkler',
  'buy-sprinkler-vert',
  'buy-sprinkler-large',
]

const SPRINKLER_SKU: readonly SkuId[] = ['buy-sprinkler', 'buy-sprinkler-vert', 'buy-sprinkler-large']

type Props = {
  world: World
  cam: Camera
  rev: number
  lens: Lens
  hover: PromptHit | undefined
  onHover: (c: PromptHit | undefined) => void
  onCam: (c: Camera) => void
  onClick: (hit: MapClick) => void
}

export function MapView({ world, cam, rev, lens, hover, onHover, onCam, onClick }: Props) {
  const drag = useRef<{ x: number; y: number; cx: number; cy: number } | undefined>(undefined)
  const svgRef = useRef<SVGSVGElement>(null)
  const [view, setView] = useState({ w: 800, h: 600 })
  const [ptr, setPtr] = useState({ x: 0, y: 0 })
  const [worldPtr, setWorldPtr] = useState<{ x: number; y: number } | undefined>(undefined)
  const placing = world.place.kind === 'sku' || world.place.kind === 'delete'
  const placeId = world.place.kind === 'sku' ? world.place.id : undefined
  const pumpjack = placeId === 'buy-pumpjack'
  const pipeTool = placeId === 'buy-pipe'
  const deleteTool = world.place.kind === 'delete'
  const sprinklerTool = placeId !== undefined && SPRINKLER_SKU.includes(placeId)
  const stay = deleteTool || (placeId !== undefined && STAY_ARMED.includes(placeId))
  const skuStroke = placing && !pipeTool && !deleteTool && !sprinklerTool
  const followSku = placeId !== undefined && !pumpjack && !pipeTool && !sprinklerTool
  const edgeHit = worldPtr !== undefined ? nearestEdge(worldPtr.x, worldPtr.y) : undefined
  const vertexHit = worldPtr !== undefined ? nearestVertex(worldPtr.x, worldPtr.y) : undefined
  const strokeCell =
    worldPtr !== undefined ? { col: Math.floor(worldPtr.x), row: Math.floor(worldPtr.y) } : undefined
  const ghostVerts = pipeTool && edgeHit !== undefined ? vertsOf(edgeHit) : undefined
  const ghostWet = edgeHit !== undefined && pendingWet(world, edgeHit)
  const ghostSprinkler =
    sprinklerTool && world.place.kind === 'sku' && vertexHit !== undefined
      ? makeSprinkler(world.place, vertexHit)
      : undefined
  const deleteTarget = deleteTool ? deleteHit(world, edgeHit, vertexHit) : undefined
  const hoverCell = hover !== undefined && hover.kind === 'cell' ? hover.at : undefined
  const prompt = hoverCell !== undefined ? world.prompt(hoverCell) : world.promptHit(hover)
  const hitOk =
    stay && !deleteTool
      ? stayOk(world, placeId, edgeHit, ghostSprinkler, deleteTarget)
      : prompt?.kind === 'place'
  const canPlace = placing && hitOk
  const tipDrop =
    hoverCell !== undefined
      ? onCell(world.drops, hoverCell)
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

  function worldAt(clientX: number, clientY: number, el: SVGSVGElement): { x: number; y: number } {
    const r = el.getBoundingClientRect()
    return {
      x: cam.x + (clientX - r.left - r.width / 2) / (TILE * cam.scale),
      y: cam.y + (clientY - r.top - r.height / 2) / (TILE * cam.scale),
    }
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

  const stayHit: PromptHit | undefined = pipeTool
    ? edgeHit !== undefined
      ? { kind: 'edge', edge: edgeHit }
      : undefined
    : sprinklerTool && ghostSprinkler !== undefined
      ? { kind: 'sprinkler', sprinkler: ghostSprinkler }
      : deleteTarget?.kind === 'pipe'
        ? { kind: 'delete-pipe', edge: deleteTarget.edge }
        : deleteTarget?.kind === 'sprinkler'
          ? { kind: 'delete-sprinkler', at: deleteTarget.at }
          : undefined
  const followText = stay
    ? world.promptHit(stayHit).text
    : placeId !== undefined
      ? placeLine(placeId)
      : undefined

  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg
        ref={svgRef}
        className={`h-full w-full overflow-hidden bg-grass ${canPlace ? 'cursor-pointer' : 'cursor-crosshair'}`}
        onWheel={onWheel}
        onContextMenu={e => {
          e.preventDefault()
          const w = worldAt(e.clientX, e.clientY, e.currentTarget)
          world.rightClick({ col: Math.floor(w.x), row: Math.floor(w.y) })
        }}
        onPointerDown={e => {
          if (e.button === 2) return
          drag.current = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y }
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={e => {
          setPtr({ x: e.clientX, y: e.clientY })
          const w = worldAt(e.clientX, e.clientY, e.currentTarget)
          setWorldPtr(w)
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
          onHover(clickHit(world, w.x, w.y))
        }}
        onPointerUp={e => {
          const d = drag.current
          drag.current = undefined
          if (d === undefined) return
          if (e.button === 2) return
          if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 3) return
          const w = worldAt(e.clientX, e.clientY, e.currentTarget)
          const hit = clickHit(world, w.x, w.y)
          if (hit !== undefined) onClick(hit)
        }}
        onPointerLeave={() => {
          onHover(undefined)
          setWorldPtr(undefined)
        }}
      >
        <g
          transform={`translate(${view.w / 2},${view.h / 2}) scale(${cam.scale}) translate(${-cam.x * TILE}, ${-cam.y * TILE})`}
        >
          <Ground world={world} owned={world.owned.length} />
          <Marks world={world} rev={rev} lens={lens} hideVerts={ghostVerts} />
          {strokeCell !== undefined && (
            <g pointerEvents="none">
              <rect
                data-cell-stroke
                x={strokeCell.col * TILE}
                y={strokeCell.row * TILE}
                width={TILE}
                height={TILE}
                fill="none"
                className={
                  skuStroke && world.prompt(strokeCell).kind !== 'place' ? 'stroke-roof' : 'stroke-ink'
                }
                strokeWidth={2}
              />
              {pumpjack && (
                <rect
                  x={(strokeCell.col + 1) * TILE}
                  y={strokeCell.row * TILE}
                  width={TILE}
                  height={TILE}
                  fill="none"
                  className={
                    skuStroke && world.prompt(strokeCell).kind !== 'place' ? 'stroke-roof' : 'stroke-ink'
                  }
                  strokeWidth={2}
                />
              )}
            </g>
          )}
          {ghostVerts !== undefined &&
            edgeHit !== undefined &&
            ghostVerts.map(v => {
              const a = arms(world, v, edgeHit)
              const fit = pipeFit(a.n, a.e, a.s, a.w)
              if (fit === undefined) return undefined
              return (
                <g
                  key={`ghost-${v.col},${v.row}`}
                  data-pipe-ghost
                  pointerEvents="none"
                  transform={`translate(${v.col * TILE},${v.row * TILE}) rotate(${fit.rot}) translate(${-TILE / 2},${-TILE / 2}) scale(${TILE / 24})`}
                  dangerouslySetInnerHTML={{ __html: ghostWet ? fit.html : stripWater(fit.html) }}
                />
              )
            })}
          {ghostSprinkler !== undefined && (
            <g pointerEvents="none">
              {aoe(ghostSprinkler).map(at => (
                <rect
                  key={`aoe-${at.col},${at.row}`}
                  x={at.col * TILE}
                  y={at.row * TILE}
                  width={TILE}
                  height={TILE}
                  className="fill-water"
                  fillOpacity={0.35}
                />
              ))}
              <SprinklerGfx s={ghostSprinkler} opacity={0.7} placed={false} />
            </g>
          )}
          {deleteTool && deleteTarget?.kind === 'pipe' && (
            <EdgeStroke edge={deleteTarget.edge} ok />
          )}
          {deleteTool && deleteTarget?.kind === 'sprinkler' && (
            <VertexStroke v={deleteTarget.at} ok />
          )}
          {deleteTool && deleteTarget === undefined && edgeHit !== undefined && (
            <EdgeStroke edge={edgeHit} ok={false} />
          )}
          {deleteTool && deleteTarget === undefined && edgeHit === undefined && vertexHit !== undefined && (
            <VertexStroke v={vertexHit} ok={false} />
          )}
          {pumpjack && hoverCell !== undefined && (
            <g
              pointerEvents="none"
              opacity={0.7}
              transform={`translate(${hoverCell.col * TILE},${hoverCell.row * TILE}) scale(${TILE / 24})`}
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
      {followSku && placeId !== undefined && (
        <div className="pointer-events-none fixed z-30" style={{ left: ptr.x + 16, top: ptr.y + 16 }}>
          <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: skuInner(placeId) }} />
          <div className="mt-1 bg-house px-2 py-0.5 text-sm text-ink">{followText}</div>
        </div>
      )}
      {(pipeTool || sprinklerTool || deleteTool) && followText !== undefined && (
        <div className="pointer-events-none fixed z-30" style={{ left: ptr.x + 16, top: ptr.y + 16 }}>
          <div className="bg-house px-2 py-0.5 text-sm text-ink">{followText}</div>
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
      {pumpjack && placeId !== undefined && hoverCell === undefined && (
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

const Marks = memo(function Marks({
  world,
  rev,
  lens,
  hideVerts,
}: {
  world: World
  rev: number
  lens: Lens
  hideVerts: readonly Vertex[] | undefined
}) {
  void rev
  const plots: { col: number; row: number; cell: Plot }[] = []
  const rocks: { col: number; row: number; w: number; h: number }[] = []
  const shrubs: { col: number; row: number; ripe: boolean }[] = []
  const appleTrees: { col: number; row: number; ripe: boolean }[] = []
  const chests: Coord[] = []
  const grinders: Coord[] = []
  const truck = { col: world.truck.base.col, row: world.truck.base.row }
  const tints: { col: number; row: number; fill: string; op: number; hard: boolean }[] = []
  const pipes: { v: Vertex; html: string; rot: number; wet: boolean }[] = []
  const sprinklers: Sprinkler[] = []
  const showPipes =
    lens === 'pipes' ||
    world.place.kind === 'delete' ||
    (world.place.kind === 'sku' && PIPE_PLACE.includes(world.place.id))
  const washAoe =
    lens === 'pipes' ||
    world.place.kind === 'delete' ||
    (world.place.kind === 'sku' && AOE_WASH.includes(world.place.id))
  const aoeWash = new Set<string>()
  if (washAoe) {
    world.sprinklers.forEach(s => {
      aoe(s).forEach(at => {
        if (world.inWorld(at)) aoeWash.add(`${at.col},${at.row}`)
      })
    })
  }
  const hide = new Set<string>()
  if (hideVerts !== undefined) hideVerts.forEach(v => hide.add(`${v.col},${v.row}`))
  world.forEachCell((at, cell) => {
    if (isPlot(cell) && cell.kind !== 'untilled' && cell.kind !== 'infertile') {
      plots.push({ col: at.col, row: at.row, cell })
    }
    if (cell.kind === 'rock' && cell.base.col === at.col && cell.base.row === at.row) {
      rocks.push({ col: at.col, row: at.row, w: cell.base.w, h: cell.base.h })
    }
    if (cell.kind === 'shrub') shrubs.push({ col: at.col, row: at.row, ripe: cell.ripe })
    if (cell.kind === 'apple-tree' && cell.base.col === at.col && cell.base.row === at.row) appleTrees.push({ col: at.col, row: at.row, ripe: cell.ripe })
    if (cell.kind === 'chest') chests.push(at)
    if (cell.kind === 'grinder') grinders.push(at)
    const tint = lensFill(lens, cell, aoeWash.has(`${at.col},${at.row}`))
    if (tint !== undefined) tints.push({ col: at.col, row: at.row, ...tint })
  })
  visitVerts(world, v => {
    if (showPipes && !hide.has(`${v.col},${v.row}`)) {
      const a = arms(world, v, undefined)
      const fit = pipeFit(a.n, a.e, a.s, a.w)
      if (fit !== undefined) {
        const wet = vertexWet(world, v)
        pipes.push({ v, html: wet ? fit.html : stripWater(fit.html), rot: fit.rot, wet })
      }
    }
    const s = world.sprinklerAt(v)
    if (s !== undefined) sprinklers.push(s)
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
      {appleTrees.map(t => (
        <g key={`apple-tree-${t.col},${t.row}`} transform={`translate(${t.col * TILE},${t.row * TILE}) scale(${TILE / 24})`} dangerouslySetInnerHTML={{ __html: appleTreeStage(t.ripe) }} />
      ))}
      {world.pumps.map((p, i) => {
        const col = p.base.shape === 'rect' ? p.base.col : Math.floor(p.base.cx - p.base.r)
        const row = p.base.shape === 'rect' ? p.base.row : Math.floor(p.base.cy - p.base.r)
        const art = p.form === 'well' ? WELL : PUMP
        return (
          <g key={i}>
            <g
              transform={`translate(${col * TILE},${row * TILE}) scale(${TILE / 24})`}
              dangerouslySetInnerHTML={{ __html: art }}
            />
            {lens === 'pipes' && (
              <g
                transform={`translate(${col * TILE},${row * TILE}) scale(${TILE / 24})`}
                dangerouslySetInnerHTML={{ __html: OVERLAY_WATER }}
              />
            )}
          </g>
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
        data-truck
        transform={`translate(${truck.col * TILE},${truck.row * TILE}) scale(${TILE / 24})`}
        dangerouslySetInnerHTML={{ __html: TRUCK }}
      />
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
      {[...aoeWash].map(k => {
        const comma = k.indexOf(',')
        const col = Number(k.slice(0, comma))
        const row = Number(k.slice(comma + 1))
        if (world.cell({ col, row }).kind === 'pump') return undefined
        return (
          <rect
            key={`aoe-${k}`}
            x={col * TILE}
            y={row * TILE}
            width={TILE}
            height={TILE}
            className="fill-water"
            fillOpacity={0.2}
            pointerEvents="none"
          />
        )
      })}
      {pipes.map(p => (
        <g
          key={`pipe-${p.v.col},${p.v.row}`}
          data-pipe
          data-wet={p.wet ? '1' : '0'}
          transform={`translate(${p.v.col * TILE},${p.v.row * TILE}) rotate(${p.rot}) translate(${-TILE / 2},${-TILE / 2}) scale(${TILE / 24})`}
          dangerouslySetInnerHTML={{ __html: p.html }}
        />
      ))}
      {sprinklers.map(s => (
        <g key={`sp-${s.at.col},${s.at.row}`}>
          {lens === 'kind' && (
            <circle
              cx={s.at.col * TILE}
              cy={s.at.row * TILE}
              r={TILE * 0.22}
              fill={WATER}
              fillOpacity={0.72}
              style={{ mixBlendMode: 'multiply' }}
              pointerEvents="none"
            />
          )}
          {lens === 'pipes' && (
            <g
              transform={`translate(${s.at.col * TILE},${s.at.row * TILE}) translate(${-TILE / 2},${-TILE / 2}) scale(${TILE / 24})`}
              dangerouslySetInnerHTML={{ __html: OVERLAY_WATER }}
            />
          )}
          <SprinklerGfx s={s} placed />
          {working(world, s) && <SprinklerVfx s={s} />}
        </g>
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
      >
        <g dangerouslySetInnerHTML={{ __html: ACTOR }} />
        {world.hand.kind === 'hold' && (
          <g transform={`translate(15,13) scale(${8 / 24})`} dangerouslySetInnerHTML={{ __html: faceGfx(world.hand.item) }} />
        )}
      </g>
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
            <foreignObject x={o} y={o} width={s} height={s} pointerEvents="none">
              <div
                className={`flex h-full w-full items-center justify-center gap-0.5 text-[8px] leading-none ${
                  poor ? 'text-ink/50' : 'text-ink'
                }`}
              >
                Expand
                <Coin n={face.price} />
              </div>
            </foreignObject>
          </g>
        )
      })}
    </g>
  )
})

function bakeGround(world: World): string {
  let s = ''
  world.forEachCell((at, cell) => {
    const art =
      cell.kind === 'untilled' && cell.ground === 'hard'
        ? HARD[tileVariant(at.col, at.row, 2)]
        : (cell.kind === 'untilled' && cell.ground === 'very-hard') || cell.kind === 'infertile'
          ? VERY_HARD
          : GRASS[tileVariant(at.col, at.row, 8)]
    s += `<g transform="translate(${at.col * TILE},${at.row * TILE}) scale(${TILE / 24})">${art}</g>`
  })
  return s
}

function lensFill(
  lens: Lens,
  cell: Cell,
  aoe: boolean,
): { fill: string; op: number; hard: boolean } | undefined {
  if (lens === 'off') return undefined
  if (lens === 'rarity') {
    if (cell.kind !== 'growing' && cell.kind !== 'ripe' && cell.kind !== 'dead') return undefined
    if (cell.plant.rarity === 'common') return { fill: WASH, op: 0.35, hard: false }
    if (cell.plant.rarity === 'uncommon') return { fill: LEAF, op: 0.45, hard: false }
    if (cell.plant.rarity === 'rare') return { fill: WATER, op: 0.45, hard: false }
    return { fill: LENS_MID, op: 0.45, hard: false }
  }
  if (lens === 'pipes') {
    if (cell.kind === 'pump') return { fill: WATER, op: 0.72, hard: true }
    if (aoe) return undefined
    return { fill: WASH, op: 0.35, hard: false }
  }
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
  const bar = cell.kind === 'growing' && cell.plant.thirst < HEALTH
  const wilt = cell.kind === 'growing' && cell.plant.thirst < WITHER
  const fresh = cell.kind === 'ripe' && cell.plant.freshness < 0.8
  const pip =
    (cell.kind === 'growing' || cell.kind === 'ripe' || cell.kind === 'dead') && qualityPip(cell.plant.rarity)
  const stage =
    cell.kind === 'ripe'
      ? ripeGroup(cell.plant.rarity)
      : cell.kind === 'growing' || cell.kind === 'dead'
        ? cell.plant.stage(cell.kind)
        : undefined
  return (
    <g>
      <g
        transform={`translate(${x},${y}) scale(${TILE / 24})`}
        dangerouslySetInnerHTML={{ __html: DIRT[tileVariant(col, row, 2)] }}
      />
      {cell.kind === 'rotten' && (
        <g
          transform={`translate(${x},${y}) scale(${TILE / 24})`}
          dangerouslySetInnerHTML={{ __html: CROP_ROTTEN }}
        />
      )}
      {stage !== undefined && (cell.kind === 'growing' || cell.kind === 'ripe' || cell.kind === 'dead') && (
        <g
          transform={`translate(${x},${y}) scale(${TILE / 24})`}
          dangerouslySetInnerHTML={{
            __html: cropInner(cell.plant.crop, stage),
          }}
        />
      )}
      {pip !== undefined && pip !== false && (
        <g
          transform={`translate(${x},${y}) scale(${TILE / 24}) translate(16,16)`}
          dangerouslySetInnerHTML={{ __html: pip }}
        />
      )}
      {bar && cell.kind === 'growing' && (
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
      {fresh && cell.kind === 'ripe' && (
        <g>
          <rect x={x + 2} y={y + TILE - 6} width={TILE - 4} height={4} fill="#1c1710" />
          <rect
            data-fresh={`${col},${row}`}
            x={x + 3}
            y={y + TILE - 5}
            width={(TILE - 6) * cell.plant.freshness}
            height={2}
            className="fill-lens-bad"
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
      <g dangerouslySetInnerHTML={{ __html: faceGfx(drop.item) }} />
      {tool && <title>{itemLine(drop.item, mods)}</title>}
    </g>
  )
}

function SprinklerGfx({ s, opacity, placed }: { s: Sprinkler; opacity?: number; placed: boolean }) {
  const rot = s.variant === 'vert' && s.facing === 'ns' ? 90 : 0
  const html = s.variant === 'basic' ? SPRINKLER : s.variant === 'large' ? SPRINKLER_LARGE : SPRINKLER_VERT
  return (
    <g
      data-sprinkler={placed ? '' : undefined}
      pointerEvents="none"
      opacity={opacity}
      transform={`translate(${s.at.col * TILE},${s.at.row * TILE}) rotate(${rot}) translate(${-TILE / 2},${-TILE / 2}) scale(${TILE / 24})`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function SprinklerVfx({ s }: { s: Sprinkler }) {
  const x = s.at.col * TILE
  const y = s.at.row * TILE
  if (s.variant === 'vert') {
    const ew = s.facing === 'ew'
    return (
      <line
        x1={ew ? x - 2 * TILE : x}
        y1={ew ? y : y - 2 * TILE}
        x2={ew ? x + 2 * TILE : x}
        y2={ew ? y : y + 2 * TILE}
        className="stroke-water"
        strokeWidth={2}
        strokeDasharray="4 6"
        pointerEvents="none"
      >
        <animate attributeName="stroke-dashoffset" from="0" to="20" dur="0.45s" repeatCount="indefinite" />
      </line>
    )
  }
  return (
    <g transform={`translate(${x},${y})`} pointerEvents="none">
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="1.2s" repeatCount="indefinite" />
        <rect x={6} y={-1} width={8} height={2} className="fill-water" />
        <rect x={-14} y={-1} width={8} height={2} className="fill-water" />
        <rect x={-1} y={6} width={2} height={8} className="fill-water" />
        <rect x={-1} y={-14} width={2} height={8} className="fill-water" />
      </g>
    </g>
  )
}

function EdgeStroke({ edge, ok }: { edge: Edge; ok: boolean }) {
  const cls = ok ? 'stroke-ink' : 'stroke-roof'
  if (edge.axis === 'h') {
    return (
      <line
        x1={edge.col * TILE}
        y1={edge.row * TILE}
        x2={(edge.col + 1) * TILE}
        y2={edge.row * TILE}
        className={cls}
        strokeWidth={3}
        pointerEvents="none"
      />
    )
  }
  return (
    <line
      x1={edge.col * TILE}
      y1={edge.row * TILE}
      x2={edge.col * TILE}
      y2={(edge.row + 1) * TILE}
      className={cls}
      strokeWidth={3}
      pointerEvents="none"
    />
  )
}

function VertexStroke({ v, ok }: { v: Vertex; ok: boolean }) {
  const s = 10
  return (
    <rect
      x={v.col * TILE - s / 2}
      y={v.row * TILE - s / 2}
      width={s}
      height={s}
      fill="none"
      className={ok ? 'stroke-ink' : 'stroke-roof'}
      strokeWidth={2}
      pointerEvents="none"
    />
  )
}

type DeleteTarget = { kind: 'pipe'; edge: Edge } | { kind: 'sprinkler'; at: Vertex }

function nearestEdge(wx: number, wy: number): Edge | undefined {
  const col = Math.floor(wx)
  const row = Math.floor(wy)
  const fx = wx - col
  const fy = wy - row
  const hits: { edge: Edge; d: number }[] = [
    { edge: { axis: 'h', col, row }, d: fy },
    { edge: { axis: 'h', col, row: row + 1 }, d: 1 - fy },
    { edge: { axis: 'v', col, row }, d: fx },
    { edge: { axis: 'v', col: col + 1, row }, d: 1 - fx },
  ]
  let best = hits[0]
  for (const h of hits) {
    if (h.d < best.d) best = h
  }
  if (best.d > EDGE_HIT) return undefined
  return best.edge
}

function nearestVertex(wx: number, wy: number): Vertex {
  return { col: Math.round(wx), row: Math.round(wy) }
}

function makeSprinkler(place: Extract<Place, { kind: 'sku' }>, at: Vertex): Sprinkler {
  if (place.id === 'buy-sprinkler-large') return { variant: 'large', at }
  if (place.id === 'buy-sprinkler-vert') return { variant: 'vert', at, facing: place.facing }
  return { variant: 'basic', at }
}

function arms(
  world: World,
  v: Vertex,
  extra: Edge | undefined,
): { n: boolean; e: boolean; s: boolean; w: boolean } {
  const has = (e: Edge) => world.hasPipe(e) || (extra !== undefined && edgeKey(e) === edgeKey(extra))
  return {
    n: has({ axis: 'v', col: v.col, row: v.row - 1 }),
    e: has({ axis: 'h', col: v.col, row: v.row }),
    s: has({ axis: 'v', col: v.col, row: v.row }),
    w: has({ axis: 'h', col: v.col - 1, row: v.row }),
  }
}

function visitVerts(world: World, fn: (v: Vertex) => void): void {
  const seen = new Set<string>()
  world.forEachCell(at => {
    const vs: Vertex[] = [
      { col: at.col, row: at.row },
      { col: at.col + 1, row: at.row },
      { col: at.col, row: at.row + 1 },
      { col: at.col + 1, row: at.row + 1 },
    ]
    vs.forEach(v => {
      const k = `${v.col},${v.row}`
      if (seen.has(k)) return
      seen.add(k)
      fn(v)
    })
  })
}

function pipeOk(world: World, e: Edge): boolean {
  return world.edgeOwned(e) && !world.hasPipe(e) && world.money >= SKUS['buy-pipe'].price
}

function sprinklerOk(world: World, s: Sprinkler): boolean {
  if (world.sprinklerAt(s.at) !== undefined) return false
  if (!aoe(s).every(at => world.inWorld(at))) return false
  const { col, row } = s.at
  return (
    world.inWorld({ col: col - 1, row: row - 1 }) ||
    world.inWorld({ col, row: row - 1 }) ||
    world.inWorld({ col: col - 1, row }) ||
    world.inWorld({ col, row })
  )
}

function vertsOf(e: Edge): [Vertex, Vertex] {
  if (e.axis === 'h') return [{ col: e.col, row: e.row }, { col: e.col + 1, row: e.row }]
  return [{ col: e.col, row: e.row }, { col: e.col, row: e.row + 1 }]
}

function boundsOf(at: Coord): Edge[] {
  return [
    { axis: 'h', col: at.col, row: at.row },
    { axis: 'h', col: at.col, row: at.row + 1 },
    { axis: 'v', col: at.col, row: at.row },
    { axis: 'v', col: at.col + 1, row: at.row },
  ]
}

function stripWater(html: string): string {
  return html.replace(/<rect fill="#3d7ea6"[^/]*\/>/g, '')
}

function vertexWet(world: World, v: Vertex): boolean {
  return incident(v).some(e => world.hasPipe(e) && world.system(e).C > 0)
}

function pendingWet(world: World, e: Edge): boolean {
  const has = (x: Edge) => world.hasPipe(x) || edgeKey(x) === edgeKey(e)
  const seen = new Set<string>([edgeKey(e)])
  const q: Edge[] = [e]
  while (q.length > 0) {
    const cur = q[q.length - 1]
    q.pop()
    vertsOf(cur).forEach(v => {
      incident(v).forEach(n => {
        const k = edgeKey(n)
        if (seen.has(k) || !has(n)) return
        seen.add(k)
        q.push(n)
      })
    })
  }
  return world.pumps.some(p =>
    occupiedCells(p.base, world.owned).some(cell =>
      boundsOf(cell).some(edge => seen.has(edgeKey(edge))),
    ),
  )
}

function working(world: World, s: Sprinkler): boolean {
  if (world.rate(s.at) <= 0) return false
  return aoe(s).some(at => world.inWorld(at) && world.cell(at).kind === 'growing')
}

function deleteHit(world: World, edge: Edge | undefined, v: Vertex | undefined): DeleteTarget | undefined {
  if (edge !== undefined && world.hasPipe(edge) && world.edgeOwned(edge)) {
    return { kind: 'pipe', edge }
  }
  if (v !== undefined && world.sprinklerAt(v) !== undefined) return { kind: 'sprinkler', at: v }
  return undefined
}

function stayOk(
  world: World,
  placeId: SkuId | undefined,
  edge: Edge | undefined,
  s: Sprinkler | undefined,
  del: DeleteTarget | undefined,
): boolean {
  if (world.place.kind === 'delete') {
    if (del !== undefined) return true
    if (edge === undefined && s === undefined) return false
    return del !== undefined
  }
  if (placeId === undefined) return false
  if (world.money < SKUS[placeId].price) return false
  if (placeId === 'buy-pipe') return edge !== undefined && pipeOk(world, edge)
  if (s === undefined) return false
  return sprinklerOk(world, s)
}

function clickHit(world: World, wx: number, wy: number): MapClick | undefined {
  const place = world.place
  if (place.kind === 'sku' && place.id === 'buy-pipe') {
    const edge = nearestEdge(wx, wy)
    if (edge === undefined) return undefined
    return { kind: 'edge', edge }
  }
  if (place.kind === 'sku' && SPRINKLER_SKU.includes(place.id)) {
    const at = nearestVertex(wx, wy)
    return { kind: 'sprinkler', sprinkler: makeSprinkler(place, at) }
  }
  if (place.kind === 'delete') {
    const edge = nearestEdge(wx, wy)
    const at = nearestVertex(wx, wy)
    const del = deleteHit(world, edge, at)
    if (del?.kind === 'pipe') return { kind: 'delete-pipe', edge: del.edge }
    if (del?.kind === 'sprinkler') return { kind: 'delete-sprinkler', at: del.at }
    return { kind: 'cell', at: { col: Math.floor(wx), row: Math.floor(wy) } }
  }
  return { kind: 'cell', at: { col: Math.floor(wx), row: Math.floor(wy) } }
}
