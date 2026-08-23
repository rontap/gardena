import { memo, useEffect, useMemo, useRef, useState, type CSSProperties, type WheelEvent } from 'react'
import { COMPOST_NEED } from '../defs/items.ts'
import { CROPS, tolerance } from '../defs/crops.ts'
import { fertBand, waterBand, SOIL_WATER_MAX, SOIL_WATER_MID, type Band } from '../sim/soil.ts'
import { goodness, HARD_MAX, VERY_HARD_MAX } from '../sim/noise.ts'
import { DOOR, FADE, HOUSE_BASE, chunkKey, chunkOf, occupiedCells, type Base, type Coord } from '../sim/building.ts'
import { onCell, type Drop } from '../sim/drop.ts'
import { isPlot, isTilled, type Cell, type Cover, type Plot } from '../sim/plot.ts'
import { itemLine, skuLabel } from '../sim/item.ts'
import { Coin } from '../ui/frame.tsx'
import type { CropId, SkuId } from '../sim/ids.ts'
import type { Rarity } from '../defs/rarity.ts'
import type { Soil } from '../sim/soil.ts'
import type { Modifier } from '../sim/modifiers.ts'
import { aoe, edgeKey, type Edge, type Sprinkler, type Vertex } from '../sim/pipe.ts'
import type { PromptHit } from '../sim/prompt.ts'
import type { Place, SeatId, World } from '../sim/world.ts'
import { TILE, clampCam, tileVariant, type Camera } from './camera.ts'
import {
  ACTOR,
  treeStage,
  BUILDING_TILES,
  CHEST,
  COMPOST_BOX,
  CROP_ROTTEN,
  DIRT,
  DIRT_EDGE,
  DIRT_INSET,
  GRASS,
  GRASS_TUFT,
  GRINDER,
  HARD,
  HOUSE,
  PIPE_SOURCE,
  PUMP,
  RAIN_TANK,
  TAP,
  ROCK,
  ROCK_LONG,

  TRUCK,
  SPRINKLER,
  SPRINKLER_LARGE,
  SPRINKLER_VERT,
  VERY_HARD,
  WELL,
  cropInner,
  faceGfx,
  fenceFit,
  pipeFit,
  turfInner,
  qualityPip,
  ripeGroup,
  skuInner,
  dryOf,
  valveArt,
  weedInner,
} from './svgs.ts'

export type Lens = 'off' | 'water' | 'land' | 'ripe' | 'kind' | 'rarity' | 'pipes'

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
const VERTEX_HIT = 0.3

const PIPE_PLACE: readonly SkuId[] = [
  'buy-pipe',
  'buy-valve',
  'buy-rain-tank',
  'buy-tap',
  'buy-sprinkler',
  'buy-sprinkler-vert',
  'buy-sprinkler-large',
  'buy-well',
  'buy-pumpjack',
]

const AOE_WASH: readonly SkuId[] = [
  'buy-pipe',
  'buy-valve',
  'buy-sprinkler',
  'buy-sprinkler-vert',
  'buy-sprinkler-large',
]

const STAY_ARMED: readonly SkuId[] = [
  'buy-pipe',
  'buy-valve',
  'buy-sprinkler',
  'buy-sprinkler-vert',
  'buy-sprinkler-large',
  'buy-tile-paved',
  'buy-tile-brick',
  'buy-tile-cobble',
  'buy-fence',
]

const SPRINKLER_SKU: readonly SkuId[] = ['buy-sprinkler', 'buy-sprinkler-vert', 'buy-sprinkler-large']

const HAT: { readonly [K in SeatId]: string } = {
  0: '#d4a017',
  1: '#ff3d8e',
  2: '#2de8ff',
  3: '#b85cff',
}

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
  const pendingMove = useRef<{ x: number; y: number; buttons: number } | undefined>(undefined)
  const camRef = useRef(cam)
  const lastHoverKey = useRef('')
  const [view, setView] = useState({ w: 800, h: 600 })
  const [ptr, setPtr] = useState({ x: 0, y: 0 })
  const [worldPtr, setWorldPtr] = useState<{ x: number; y: number } | undefined>(undefined)
  camRef.current = cam
  const place = world.seats[world.local].place
  const placing = place.kind === 'sku' || place.kind === 'delete'
  const placeId = place.kind === 'sku' ? place.id : undefined
  const pumpjack = placeId === 'buy-pumpjack' || placeId === 'buy-rain-tank'
  const edgeTool = placeId === 'buy-pipe' || placeId === 'buy-valve' || placeId === 'buy-well'
  const deleteTool = place.kind === 'delete'
  const sprinklerTool = placeId !== undefined && SPRINKLER_SKU.includes(placeId)
  const stay = deleteTool || (placeId !== undefined && STAY_ARMED.includes(placeId))
  const skuStroke = placing && !edgeTool && !deleteTool && !sprinklerTool
  const followSku = placeId !== undefined && !pumpjack && !edgeTool && !sprinklerTool
  const edgeHit = worldPtr !== undefined ? nearestEdge(worldPtr.x, worldPtr.y) : undefined
  const vertexHit = worldPtr !== undefined ? nearestVertex(worldPtr.x, worldPtr.y) : undefined
  const strokeCell =
    worldPtr !== undefined ? { col: Math.floor(worldPtr.x), row: Math.floor(worldPtr.y) } : undefined
  const ghostVerts = useMemo(
    () =>
      edgeTool && placeId !== 'buy-well' && edgeHit !== undefined
        ? vertsOf(edgeHit)
        : undefined,
    [edgeTool, placeId, edgeHit?.axis, edgeHit?.col, edgeHit?.row],
  )
  const ghostWet = edgeHit !== undefined && world.pendingWet(edgeHit)
  const ghostSprinkler =
    sprinklerTool && place.kind === 'sku' && vertexHit !== undefined
      ? makeSprinkler(place, vertexHit)
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
    const b = world.bounds()
    onCam(
      clampCam(next, {
        col0: b.col0 - FADE,
        row0: b.row0 - FADE,
        col1: b.col1 + FADE,
        row1: b.row1 + FADE,
      }),
    )
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

  useEffect(() => {
    let id = 0
    const flush = () => {
      id = requestAnimationFrame(flush)
      const p = pendingMove.current
      if (p === undefined) return
      pendingMove.current = undefined
      const el = svgRef.current
      if (el === null) return
      const camNow = camRef.current
      const r = el.getBoundingClientRect()
      const w = {
        x: camNow.x + (p.x - r.left - r.width / 2) / (TILE * camNow.scale),
        y: camNow.y + (p.y - r.top - r.height / 2) / (TILE * camNow.scale),
      }
      setPtr(prev => (prev.x === p.x && prev.y === p.y ? prev : { x: p.x, y: p.y }))
      setWorldPtr(prev => (prev !== undefined && prev.x === w.x && prev.y === w.y ? prev : w))
      const d = drag.current
      if (d !== undefined && (p.buttons & 1) === 1) {
        if (Math.hypot(p.x - d.x, p.y - d.y) > 3) {
          pushCam({
            x: d.cx - (p.x - d.x) / (TILE * camNow.scale),
            y: d.cy - (p.y - d.y) / (TILE * camNow.scale),
            scale: camNow.scale,
          })
          return
        }
      }
      const key = `${Math.floor(w.x)},${Math.floor(w.y)}|${Math.round(w.x)},${Math.round(w.y)}|${place.kind}`
      if (key !== lastHoverKey.current) {
        lastHoverKey.current = key
        onHover(clickHit(world, w.x, w.y))
      }
    }
    id = requestAnimationFrame(flush)
    return () => cancelAnimationFrame(id)
  }, [world, onHover])

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

  const stayHit: PromptHit | undefined = edgeTool
    ? edgeHit !== undefined
      ? { kind: 'edge', edge: edgeHit }
      : undefined
    : sprinklerTool && ghostSprinkler !== undefined
      ? { kind: 'sprinkler', sprinkler: ghostSprinkler }
      : deleteTarget?.kind === 'pipe'
        ? { kind: 'delete-pipe', edge: deleteTarget.edge }
        : deleteTarget?.kind === 'well'
          ? { kind: 'delete-well', edge: deleteTarget.edge }
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
          pendingMove.current = { x: e.clientX, y: e.clientY, buttons: e.buttons }
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
          pendingMove.current = undefined
          lastHoverKey.current = ''
          onHover(undefined)
          setWorldPtr(undefined)
        }}
      >
        <g
          transform={`translate(${view.w / 2},${view.h / 2}) scale(${cam.scale}) translate(${-cam.x * TILE}, ${-cam.y * TILE})`}
        >
          <Ground world={world} owned={world.owned.length} groundRev={world.groundRev} />
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
                  dangerouslySetInnerHTML={{ __html: ghostWet ? fit.html : dryOf(fit.html) }}
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
          {placeId === 'buy-valve' && edgeHit !== undefined && (
            <g
              data-valve-ghost
              pointerEvents="none"
              opacity={0.7}
              transform={edgeTransform(edgeHit)}
              dangerouslySetInnerHTML={{ __html: valveArt(true) }}
            />
          )}
          {placeId === 'buy-well' && edgeHit !== undefined && (
            <g data-well-ghost pointerEvents="none" opacity={0.7}>
              <WellGfx at={edgeHit} />
            </g>
          )}
          {deleteTool && deleteTarget?.kind === 'pipe' && (
            <EdgeStroke edge={deleteTarget.edge} ok />
          )}
          {deleteTool && deleteTarget?.kind === 'well' && (
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
              dangerouslySetInnerHTML={{ __html: placeId === 'buy-pumpjack' ? PUMP : RAIN_TANK }}
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
              <div data-speech-text className="bg-house px-2 py-0.5 text-base text-ink" />
            </div>
          </foreignObject>
        </g>
      </svg>
      {followSku && placeId !== undefined && (
        <div className="pointer-events-none fixed z-30" style={{ left: ptr.x + 16, top: ptr.y + 16 }}>
          <svg className="h-16 w-16" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: skuInner(placeId) }} />
          <div className="mt-1 bg-house px-2 py-0.5 text-base text-ink">{followText}</div>
        </div>
      )}
      {(edgeTool || sprinklerTool || deleteTool) && followText !== undefined && (
        <div className="pointer-events-none fixed z-30" style={{ left: ptr.x + 16, top: ptr.y + 16 }}>
          <div className="bg-house px-2 py-0.5 text-base text-ink">{followText}</div>
        </div>
      )}
      {tip !== undefined && (
        <div
          className="pointer-events-none fixed z-30 bg-ink px-2 py-1 text-base text-house"
          style={{ left: ptr.x + 14, top: ptr.y - 28 }}
        >
          {tip}
        </div>
      )}
      {pumpjack && placeId !== undefined && hoverCell === undefined && (
        <div className="pointer-events-none fixed z-30" style={{ left: ptr.x + 16, top: ptr.y + 16 }}>
          <svg className="h-8 w-16" viewBox="0 0 48 24" dangerouslySetInnerHTML={{ __html: PUMP }} />
          <div className="mt-1 bg-house px-2 py-0.5 text-base text-ink">{placeLine(placeId)}</div>
        </div>
      )}
    </div>
  )
}

function placeLine(id: SkuId): string {
  return `Place ${skuLabel(id)}`
}

const Ground = memo(function Ground({
  world,
  owned,
  groundRev,
}: {
  world: World
  owned: number
  groundRev: number
}) {
  const html = useMemo(() => bakeGround(world), [world, owned, groundRev])
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
  const tufts: { col: number; row: number; cover: Cover }[] = []
  const trees: { col: number; row: number; species: 'apple' | 'apricot' | 'lemon' | 'cherry'; stage: 'grow' | 'unripe' | 'ripe' }[] = []
  const chests: Coord[] = []
  const grinders: Coord[] = []
  const composters: { col: number; row: number; units: number; progress: number }[] = []
  const truck = { col: world.truck.base.col, row: world.truck.base.row }
  const tints: { col: number; row: number; fill: string; op: number; hard: boolean }[] = []
  const pipes: { v: Vertex; html: string; rot: number; wet: boolean }[] = []
  const sprinklers: Sprinkler[] = []
  const fences: { col: number; row: number; html: string; rot: number }[] = []
  const valves: { at: Edge; open: boolean }[] = []
  const wellEdges: Edge[] = []
  world.wells.forEach(w => wellEdges.push(w.at))
  world.segments.forEach(seg => {
    if (seg.gate.kind === 'valve') valves.push({ at: seg.at, open: seg.gate.open })
  })
  const place = world.seats[world.local].place
  const showPipes =
    lens === 'pipes' ||
    place.kind === 'delete' ||
    (place.kind === 'sku' && PIPE_PLACE.includes(place.id))
  const washAoe =
    lens === 'pipes' ||
    place.kind === 'delete' ||
    (place.kind === 'sku' && AOE_WASH.includes(place.id))
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
  const expandUnlocked = world.done.has('unlock-expand')
  const purchases = world.purchases
  const faces = useMemo(() => world.faces(), [world, expandUnlocked, purchases])
  world.forEachCell((at, cell) => {
    if (isPlot(cell) && cell.kind !== 'untilled' && cell.kind !== 'infertile') {
      plots.push({ col: at.col, row: at.row, cell })
    }
    if (cell.kind === 'untilled' && cell.cover.kind === 'grass') {
      tufts.push({ col: at.col, row: at.row, cover: cell.cover })
    }
    if (cell.kind === 'rock' && cell.base.col === at.col && cell.base.row === at.row) {
      rocks.push({ col: at.col, row: at.row, w: cell.base.w, h: cell.base.h })
    }
    if (cell.kind === 'tree' && cell.base.col === at.col && cell.base.row === at.row) {
      const stage = cell.juvenile < 1 ? 'grow' : cell.yield.kind === 'on' || cell.fruit >= 1 ? 'ripe' : 'unripe'
      trees.push({ col: at.col, row: at.row, species: cell.species, stage })
    }
    if (cell.kind === 'chest') chests.push(at)
    if (cell.kind === 'grinder') grinders.push(at)
    if (cell.kind === 'compost-box') {
      composters.push({ col: at.col, row: at.row, units: cell.units, progress: cell.progress })
    }
    if (world.hasFence(at)) {
      const a = world.fenceArms(at)
      const fit = fenceFit(a.n, a.e, a.s, a.w)
      fences.push({ col: at.col, row: at.row, html: fit.html, rot: fit.rot })
    }
    const g = lens === 'land' ? goodness(world.rng, at.col, at.row) : 0
    const tint = lensFill(lens, cell, aoeWash.has(`${at.col},${at.row}`), g)
    if (tint !== undefined) tints.push({ col: at.col, row: at.row, ...tint })
  })
  visitVerts(world, v => {
    if (showPipes && !hide.has(`${v.col},${v.row}`)) {
      const a = arms(world, v, undefined)
      const fit = pipeFit(a.n, a.e, a.s, a.w)
      if (fit !== undefined) {
        const wet = world.vertexWet(v)
        pipes.push({ v, html: wet ? fit.html : dryOf(fit.html), rot: fit.rot, wet })
      }
    }
    const s = world.sprinklerAt(v)
    if (s !== undefined) sprinklers.push(s)
  })
  return (
    <g>
      {tufts.map(t => (
        <g
          key={`tuft-${t.col},${t.row}`}
          data-tuft={`${t.col},${t.row}`}
          transform={`translate(${t.col * TILE},${t.row * TILE}) scale(${TILE / 24})`}
          dangerouslySetInnerHTML={{
            __html: t.cover.kind === 'grass' ? GRASS_TUFT[t.cover.variant] : '',
          }}
        />
      ))}
      {plots.map(t => (
        <PlotGfx
          key={`${t.col},${t.row}`}
          col={t.col}
          row={t.row}
          cell={t.cell}
          edge={dirtEdges(world, t.col, t.row)}
        />
      ))}
      {fences.map(f => (
        <g
          key={`fence-${f.col},${f.row}`}
          data-fence={`${f.col},${f.row}`}
          transform={`translate(${f.col * TILE},${f.row * TILE}) scale(${TILE / 24}) rotate(${f.rot} 12 12)`}
          dangerouslySetInnerHTML={{ __html: f.html }}
        />
      ))}
      {rocks.map(r => (
        <RockGfx key={`${r.col},${r.row}`} col={r.col} row={r.row} w={r.w} h={r.h} />
      ))}
      {trees.map(t => (
        <g
          key={`tree-${t.col},${t.row}`}
          transform={`translate(${t.col * TILE},${t.row * TILE}) scale(${TILE / 24})`}
          dangerouslySetInnerHTML={{ __html: treeStage(t.species, t.stage) }}
        />
      ))}
      {world.pumps.map((p, i) => {
        const col = p.base.shape === 'rect' ? p.base.col : Math.floor(p.base.cx - p.base.r)
        const row = p.base.shape === 'rect' ? p.base.row : Math.floor(p.base.cy - p.base.r)
        return (
          <g key={`pump-${i}`}>
            <g
              transform={`translate(${col * TILE},${row * TILE}) scale(${TILE / 24})`}
              dangerouslySetInnerHTML={{ __html: PUMP }}
            />
            {showPipes && <SourceGfx world={world} base={p.base} />}
          </g>
        )
      })}
      {world.tanks.map((t, i) => (
        <g key={`tank-${i}`}>
          <g
            transform={`translate(${t.base.col * TILE},${t.base.row * TILE}) scale(${TILE / 24})`}
            dangerouslySetInnerHTML={{ __html: RAIN_TANK }}
          />
          {showPipes && <SourceGfx world={world} base={t.base} />}
        </g>
      ))}
      {world.taps.map((t, i) => (
        <g
          key={`tap-${i}`}
          transform={`translate(${t.base.col * TILE},${t.base.row * TILE}) scale(${TILE / 24})`}
          dangerouslySetInnerHTML={{ __html: TAP }}
        />
      ))}
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
      {composters.map(c => (
        <g key={`compost-${c.col},${c.row}`} data-compost={`${c.col},${c.row}`}>
          <g
            transform={`translate(${c.col * TILE},${c.row * TILE}) scale(${TILE / 24})`}
            dangerouslySetInnerHTML={{ __html: COMPOST_BOX }}
          />
          <rect x={c.col * TILE + 2} y={c.row * TILE + TILE - 6} width={TILE - 4} height={4} fill="#1c1710" />
          <rect
            data-compost-bar
            x={c.col * TILE + 3}
            y={c.row * TILE + TILE - 5}
            width={(TILE - 6) * (c.units < COMPOST_NEED ? c.units / COMPOST_NEED : c.progress)}
            height={2}
            fill={c.units < COMPOST_NEED ? WASH : LENS_GOOD}
          />
        </g>
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
        const under = world.cell({ col, row }).kind
        if (under === 'pump' || under === 'rain-tank' || under === 'tap') return undefined
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
      {wellEdges.map(e => (
        <WellGfx key={`well-${edgeKey(e)}`} at={e} />
      ))}
      {valves.map(v => (
        <ValveGfx key={`valve-${edgeKey(v.at)}`} at={v.at} open={v.open} />
      ))}
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
          <SprinklerGfx s={s} placed />
          {working(world, s) && <SprinklerVfx s={s} />}
          {s.tune.kind === 'crop' && (
            <g
              pointerEvents="none"
              transform={`translate(${s.at.col * TILE - TILE * 0.22},${s.at.row * TILE - TILE * 0.62}) scale(${TILE * 0.44 / 24})`}
              dangerouslySetInnerHTML={{ __html: cropInner(s.tune.crop, ripeGroup('common')) }}
            />
          )}
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
      {world.seats
        .filter(s => s.presence === 'in')
        .map(s => (
          <g
            key={s.id}
            data-actor={s.id}
            style={{ ['--hat']: HAT[s.id] } as CSSProperties}
            transform={`translate(${(s.actor.x - 0.5) * TILE},${(s.actor.y - 0.5) * TILE}) scale(${TILE / 24})`}
          >
            <g dangerouslySetInnerHTML={{ __html: ACTOR }} />
            {s.hand.kind === 'hold' && (
              <g transform={`translate(15,13) scale(${8 / 24})`} dangerouslySetInnerHTML={{ __html: faceGfx(s.hand.item) }} />
            )}
          </g>
        ))}
      {faces.map(face => {
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
                className={`flex h-full w-full items-center justify-center gap-0.5 text-lg leading-none ${
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

const VH_BAND = VERY_HARD_MAX / 3
const HARD_BAND = (HARD_MAX - VERY_HARD_MAX) / 3

function vhBand(g: number): number {
  return Math.min(2, Math.floor(g / VH_BAND))
}

function hBand(g: number): number {
  return Math.min(2, Math.floor((g - VERY_HARD_MAX) / HARD_BAND))
}

function groundArt(col: number, row: number, g: number): string {
  return g < VERY_HARD_MAX
    ? VERY_HARD[vhBand(g)]
    : g < HARD_MAX
      ? HARD[hBand(g)]
      : GRASS[tileVariant(col, row, 2) * 4 + tileVariant(col, row, 4, 1)]
}

function bakeGround(world: World): string {
  let s = ''
  world.forEachCell((at, cell) => {
    const g = goodness(world.rng, at.col, at.row)
    const art =
      cell.kind === 'untilled' && cell.cover.kind === 'tile'
        ? BUILDING_TILES[cell.cover.tile]
        : cell.kind === 'untilled' && cell.ground === 'hard'
        ? HARD[hBand(g)]
        : (cell.kind === 'untilled' && cell.ground === 'very-hard') || cell.kind === 'infertile'
          ? VERY_HARD[vhBand(g)]
          : GRASS[
              tileVariant(at.col, at.row, 2) * 4 + tileVariant(at.col, at.row, 4, 1)
            ]
    s += `<g transform="translate(${at.col * TILE},${at.row * TILE}) scale(${TILE / 24})">${art}</g>`
  })
  const b = world.bounds()
  const keys = new Set(world.owned.map(chunkKey))
  for (let row = b.row0 - FADE; row < b.row1 + FADE; row++) {
    for (let col = b.col0 - FADE; col < b.col1 + FADE; col++) {
      if (keys.has(chunkKey(chunkOf({ col, row })))) continue
      const g = goodness(world.rng, col, row)
      const art = groundArt(col, row, g)
      const d = Math.max(
        b.col0 - col,
        col - (b.col1 - 1),
        b.row0 - row,
        row - (b.row1 - 1),
        0,
      )
      const op = d <= 1 ? 0.65 : 0.35
      s += `<g transform="translate(${col * TILE},${row * TILE}) scale(${TILE / 24})" opacity="${op}">${art}</g>`
    }
  }
  return s
}

function lensFill(
  lens: Lens,
  cell: Cell,
  aoe: boolean,
  g: number,
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
    if (cell.kind === 'pump' || cell.kind === 'rain-tank' || cell.kind === 'tap') {
      return { fill: WATER, op: 0.72, hard: true }
    }
    if (aoe) return undefined
    return { fill: WASH, op: 0.35, hard: false }
  }
  const hit = lensHit(lens, cell, g)
  if (hit === undefined) return { fill: WASH, op: 0.35, hard: false }
  return { fill: hit, op: 0.72, hard: true }
}

const BAND_TINT: { readonly [K in Band]: string } = {
  green: LENS_GOOD,
  orange: LENS_MID,
  red: LENS_BAD,
}

function plantBands(crop: CropId, rarity: Rarity, soil: Soil): { water: Band; fert: Band } {
  return {
    water: waterBand(soil.water, tolerance(CROPS[crop].waterTolerance, rarity)),
    fert: fertBand(soil.fertilizer, tolerance(CROPS[crop].fertTolerance, rarity)),
  }
}

function lensHit(lens: Lens, cell: Cell, g: number): string | undefined {
  if (lens === 'water') {
    if (!isTilled(cell)) return undefined
    if (cell.kind === 'growing' || cell.kind === 'ripe') {
      return BAND_TINT[plantBands(cell.plant.crop, cell.plant.rarity, cell.soil).water]
    }
    if (cell.soil.water >= SOIL_WATER_MID) return LENS_DONE
    return scaleTint(cell.soil.water / SOIL_WATER_MID)
  }
  if (lens === 'land') {
    if (!isTilled(cell)) {
      if (cell.kind === 'infertile') return LENS_BAD
      if (cell.kind === 'untilled') return scaleTint(g)
      return undefined
    }
    if (cell.kind === 'growing' || cell.kind === 'ripe') {
      return BAND_TINT[plantBands(cell.plant.crop, cell.plant.rarity, cell.soil).fert]
    }
    if (cell.soil.fertilizer >= 1) return LENS_DONE
    return scaleTint(cell.soil.fertilizer)
  }
  if (lens === 'ripe') {
    if (cell.kind === 'growing') return scaleTint(cell.plant.maturity)
    if (cell.kind === 'ripe') return LENS_DONE
    if (cell.kind === 'dead') return LENS_BAD
    return undefined
  }
  if (
    cell.kind === 'growing' ||
    cell.kind === 'ripe' ||
    cell.kind === 'dead' ||
    cell.kind === 'weed' ||
    cell.kind === 'tree'
  ) {
    return LEAF
  }
  if (cell.kind === 'pump' || cell.kind === 'chest' || cell.kind === 'grinder' || cell.kind === 'compost-box') {
    return WATER
  }
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

type DirtEdges = {
  top: boolean
  right: boolean
  bottom: boolean
  left: boolean
  topLeftInset: boolean
  topRightInset: boolean
  bottomRightInset: boolean
  bottomLeftInset: boolean
}

function dirtEdges(world: World, col: number, row: number): DirtEdges {
  const tilled = (c: number, r: number) => world.inWorld({ col: c, row: r }) && isTilled(world.cell({ col: c, row: r }))
  const top = !tilled(col, row - 1)
  const right = !tilled(col + 1, row)
  const bottom = !tilled(col, row + 1)
  const left = !tilled(col - 1, row)
  return {
    top,
    right,
    bottom,
    left,
    topLeftInset: tilled(col - 1, row) && tilled(col, row - 1) && !tilled(col - 1, row - 1),
    topRightInset: tilled(col + 1, row) && tilled(col, row - 1) && !tilled(col + 1, row - 1),
    bottomRightInset: tilled(col + 1, row) && tilled(col, row + 1) && !tilled(col + 1, row + 1),
    bottomLeftInset: tilled(col - 1, row) && tilled(col, row + 1) && !tilled(col - 1, row + 1),
  }
}

function DirtInsetG({ x, y, angle }: { x: number; y: number; angle: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <g transform={`rotate(${angle}) scale(${TILE / 24})`} dangerouslySetInnerHTML={{ __html: DIRT_INSET }} />
    </g>
  )
}

function PlotGfx({ col, row, cell, edge }: { col: number; row: number; cell: Plot; edge: DirtEdges }) {
  const x = col * TILE
  const y = row * TILE
  const bands = cell.kind === 'growing' ? plantBands(cell.plant.crop, cell.plant.rarity, cell.soil) : undefined
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
    <g className={pip !== undefined ? 'plant-rarity' : undefined}>
      <g
        transform={`translate(${x},${y}) scale(${TILE / 24})`}
        dangerouslySetInnerHTML={{ __html: DIRT[tileVariant(col, row, 2)] }}
      />
      {edge.bottom && <g transform={`translate(${x},${y}) scale(${TILE / 24})`} dangerouslySetInnerHTML={{ __html: DIRT_EDGE }} />}
      {edge.top && <g transform={`translate(${x},${y}) scale(${TILE / 24}) rotate(180 12 12)`} dangerouslySetInnerHTML={{ __html: DIRT_EDGE }} />}
      {edge.right && <g transform={`translate(${x},${y}) scale(${TILE / 24}) rotate(-90 12 12)`} dangerouslySetInnerHTML={{ __html: DIRT_EDGE }} />}
      {edge.left && <g transform={`translate(${x},${y}) scale(${TILE / 24}) rotate(90 12 12)`} dangerouslySetInnerHTML={{ __html: DIRT_EDGE }} />}
      {edge.topLeftInset && <DirtInsetG x={x} y={y} angle={0} />}
      {edge.topRightInset && <DirtInsetG x={x + TILE} y={y} angle={90} />}
      {edge.bottomRightInset && <DirtInsetG x={x + TILE} y={y + TILE} angle={180} />}
      {edge.bottomLeftInset && <DirtInsetG x={x} y={y + TILE} angle={-90} />}
      {cell.kind === 'rotten' && (
        <g
          transform={`translate(${x},${y}) scale(${TILE / 24})`}
          dangerouslySetInnerHTML={{ __html: CROP_ROTTEN }}
        />
      )}
      {cell.kind === 'turf' && (
        <g
          data-turf={`${col},${row}`}
          transform={`translate(${x},${y}) scale(${TILE / 24})`}
          dangerouslySetInnerHTML={{ __html: turfInner(cell.turf.stage()) }}
        />
      )}
      {cell.kind === 'weed' && (
        <g
          data-weed={`${col},${row}`}
          transform={`translate(${x},${y}) scale(${TILE / 24})`}
          dangerouslySetInnerHTML={{ __html: weedInner(cell.weed.variant, cell.weed.stage()) }}
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
          className="plant-quality-pip"
          transform={`translate(${x},${y}) scale(${TILE / 24}) translate(16,16)`}
          dangerouslySetInnerHTML={{ __html: pip }}
        />
      )}
      {bands !== undefined && cell.kind === 'growing' && bands.water !== 'green' && (
        <g className={bands.water === 'red' ? 'animate-pulse' : undefined}>
          <rect x={x + 2} y={y + TILE - 6} width={TILE - 4} height={4} fill="#1c1710" />
          <rect
            data-thirst={`${col},${row}`}
            x={x + 3}
            y={y + TILE - 5}
            width={((TILE - 6) * cell.soil.water) / SOIL_WATER_MAX}
            height={2}
            fill={BAND_TINT[bands.water]}
          />
          <rect x={x + 2 + (TILE - 4) / 2} y={y + TILE - 7} width={1} height={6} fill="#1c1710" />
        </g>
      )}
      {bands !== undefined && cell.kind === 'growing' && bands.fert !== 'green' && (
        <g className={bands.fert === 'red' ? 'animate-pulse' : undefined}>
          <rect x={x + 2} y={y + TILE - 11} width={TILE - 4} height={4} fill="#1c1710" />
          <rect
            data-fert={`${col},${row}`}
            x={x + 3}
            y={y + TILE - 10}
            width={(TILE - 6) * cell.soil.fertilizer}
            height={2}
            fill={BAND_TINT[bands.fert]}
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

function SourceGfx({ world, base }: { world: World; base: Base }) {
  return (
    <g pointerEvents="none">
      {occupiedCells(base, world.owned).map(at => (
        <g
          key={`src-${at.col},${at.row}`}
          transform={`translate(${at.col * TILE},${at.row * TILE}) scale(${TILE / 24})`}
          dangerouslySetInnerHTML={{ __html: PIPE_SOURCE }}
        />
      ))}
    </g>
  )
}

function edgeTransform(e: Edge): string {
  const x = e.axis === 'h' ? (e.col + 0.5) * TILE : e.col * TILE
  const y = e.axis === 'h' ? e.row * TILE : (e.row + 0.5) * TILE
  const rot = e.axis === 'h' ? 0 : 90
  return `translate(${x},${y}) rotate(${rot}) translate(${-TILE / 2},${-TILE / 2}) scale(${TILE / 24})`
}

function ValveGfx({ at, open }: { at: Edge; open: boolean }) {
  return (
    <g
      data-valve={edgeKey(at)}
      data-open={open ? '1' : '0'}
      pointerEvents="none"
      transform={edgeTransform(at)}
      dangerouslySetInnerHTML={{ __html: valveArt(open) }}
    />
  )
}

function WellGfx({ at }: { at: Edge }) {
  return (
    <g
      data-well={edgeKey(at)}
      pointerEvents="none"
      transform={edgeTransform(at)}
      dangerouslySetInnerHTML={{ __html: WELL }}
    />
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

type DeleteTarget =
  | { kind: 'pipe'; edge: Edge }
  | { kind: 'well'; edge: Edge }
  | { kind: 'sprinkler'; at: Vertex }

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
  const tune = { kind: 'flat' } as const
  if (place.id === 'buy-sprinkler-large') return { variant: 'large', at, tune }
  if (place.id === 'buy-sprinkler-vert') return { variant: 'vert', at, facing: place.facing, tune }
  return { variant: 'basic', at, tune }
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
  world.eachNetVert(fn)
}

function pipeOk(world: World, id: SkuId, e: Edge): boolean {
  if (!world.edgeOwned(e)) return false
  if (id === 'buy-valve') return world.hasPipe(e) && !world.hasValve(e)
  return !world.hasPipe(e)
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

function working(world: World, s: Sprinkler): boolean {
  return world.rate(s.at) > 0
}

function valveHit(world: World, wx: number, wy: number): Edge | undefined {
  let best: { edge: Edge; d: number } | undefined = undefined
  world.segments.forEach(seg => {
    if (seg.gate.kind !== 'valve') return
    const mx = seg.at.axis === 'h' ? seg.at.col + 0.5 : seg.at.col
    const my = seg.at.axis === 'h' ? seg.at.row : seg.at.row + 0.5
    const d = Math.hypot(wx - mx, wy - my)
    if (d > VERTEX_HIT) return
    if (best === undefined || d < best.d) best = { edge: seg.at, d }
  })
  if (best === undefined) return undefined
  return (best as { edge: Edge; d: number }).edge
}

function wellHit(world: World, wx: number, wy: number): Edge | undefined {
  let best: { edge: Edge; d: number } | undefined = undefined
  world.wells.forEach(well => {
    const mx = well.at.axis === 'h' ? well.at.col + 0.5 : well.at.col
    const my = well.at.axis === 'h' ? well.at.row : well.at.row + 0.5
    const d = Math.hypot(wx - mx, wy - my)
    if (d > VERTEX_HIT) return
    if (best === undefined || d < best.d) best = { edge: well.at, d }
  })
  if (best === undefined) return undefined
  return (best as { edge: Edge; d: number }).edge
}

function deleteHit(world: World, edge: Edge | undefined, v: Vertex | undefined): DeleteTarget | undefined {
  if (edge !== undefined) {
    if (world.hasWell(edge)) return { kind: 'well', edge }
    if (world.hasPipe(edge) && world.edgeOwned(edge)) return { kind: 'pipe', edge }
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
  if (world.seats[world.local].place.kind === 'delete') {
    if (del !== undefined) return true
    if (edge === undefined && s === undefined) return false
    return del !== undefined
  }
  if (placeId === undefined) return false
  if (world.money < world.skuPrice(placeId)) return false
  if (placeId === 'buy-pipe' || placeId === 'buy-valve') {
    return edge !== undefined && pipeOk(world, placeId, edge)
  }
  if (placeId === 'buy-well') {
    return (
      edge !== undefined &&
      world.edgeOwned(edge) &&
      !world.hasPipe(edge) &&
      !world.hasWell(edge)
    )
  }
  if (s === undefined) return false
  return sprinklerOk(world, s)
}

function clickHit(world: World, wx: number, wy: number): MapClick | undefined {
  const place = world.seats[world.local].place
  if (place.kind === 'sku' && (place.id === 'buy-pipe' || place.id === 'buy-valve' || place.id === 'buy-well')) {
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
    if (del?.kind === 'well') return { kind: 'delete-well', edge: del.edge }
    if (del?.kind === 'sprinkler') return { kind: 'delete-sprinkler', at: del.at }
    return { kind: 'cell', at: { col: Math.floor(wx), row: Math.floor(wy) } }
  }
  if (place.kind === 'none') {
    const v = nearestVertex(wx, wy)
    if (
      world.done.has('unlock-smart-sprinkler') &&
      world.sprinklerAt(v) !== undefined &&
      Math.hypot(wx - v.col, wy - v.row) <= VERTEX_HIT
    ) {
      return { kind: 'sprinkler-hud', at: v }
    }
    const valve = valveHit(world, wx, wy)
    if (valve !== undefined) return { kind: 'valve', edge: valve }
    const well = wellHit(world, wx, wy)
    if (well !== undefined) return { kind: 'well', edge: well }
  }
  return { kind: 'cell', at: { col: Math.floor(wx), row: Math.floor(wy) } }
}
