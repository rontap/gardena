import { memo, useEffect, useMemo, useRef, useState, type CSSProperties, type WheelEvent } from 'react'
import { CROPS, tolerance } from '../defs/crops.ts'
import { fertBand, waterBand, SOIL_WATER_MID, type Band } from '../sim/soil.ts'
import { goodness, HARD_MAX, VERY_HARD_MAX } from '../sim/noise.ts'
import { HANGAR_H, HANGAR_W, SILO_H, SILO_W } from '../defs/items.ts'
import { DOOR, FADE, HOUSE_BASE, chunkKey, chunkOf, occupiedCells, type Base } from '../sim/building.ts'
import { hangarPad, siloPad } from '../sim/vehicle.ts'
import { onCell } from '../sim/drop.ts'
import { isPlot, isTilled, type Cell } from '../sim/plot.ts'
import { itemLine, skuLabel } from '../sim/item.ts'
import { Coin } from '../ui/frame.tsx'
import { SENSOR_CELL_SKUS, type CropId, type SkuId } from '../sim/ids.ts'
import type { Rarity } from '../defs/rarity.ts'
import type { Soil } from '../sim/soil.ts'
import { aoe, edgeKey, type Edge, type Sprinkler, type Vertex } from '../sim/pipe.ts'
import type { PromptHit } from '../sim/prompt.ts'
import {
  area3,
  endKey,
  isSensor,
  nearestWire,
  ownsPort,
  portXY,
  sameEnd,
  type PortId,
  type Sensor,
  type WireEnd,
  wireControls,
} from '../sim/sensor.ts'
import type { Place, SeatId, World } from '../sim/world.ts'
import { TILE, clampCam, tileVariant, type Camera } from './camera.ts'
import {
  ACTOR,
  treeStage,
  BUILDING_TILES,
  BARREL,
  CHEST,
  COMPOST_BOX,
  ADDITIVE_STORE,
  FREEZER,
  HANGAR,
  HANGAR_RETURN,
  QUAD,
  TRACTOR,
  TRAILER_HARVEST,
  TRAILER_RAKE,
  TRAILER_SEED,
  TRAILER_SPRAY,
  SILO_PRODUCE,
  SILO_SEED,
  SILO_SPRAY,
  SEED_SILO,
  JAM,
  MILL,
  STILL,
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
  symHref,
  valveArt,
  smartValveArt,
  leverArt,
  buttonArt,
  lampArt,
  PROP_OR,
  PROP_AND,
  PROP_NOT,
  waterSensorArt,
  fertSensorArt,
  harvestSensorArt,
  waterSystemArt,
  vehicleDetectorArt,
  weedInner,
} from './svgs.ts'
import { bindActor, bindBar, bindDummyQuad, bindDummyTrailer, bindHud, bindQuad, bindTrailer } from './motion.ts'

export type Lens = 'off' | 'water' | 'land' | 'ripe' | 'kind' | 'rarity' | 'pipes' | 'sensors'

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
  ...SENSOR_CELL_SKUS,
  'buy-smart-valve',
]

const SPRINKLER_SKU: readonly SkuId[] = ['buy-sprinkler', 'buy-sprinkler-vert', 'buy-sprinkler-large']

export const HAT: { readonly [K in SeatId]: string } = {
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
  const boxRef = useRef({ left: 0, top: 0, w: 800, h: 600 })
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
  const hangarPlace = placeId === 'buy-hangar'
  const siloPlace = placeId === 'buy-silo-seed' || placeId === 'buy-silo-spray' || placeId === 'buy-silo-produce'
  const edgeTool = placeId === 'buy-pipe' || placeId === 'buy-valve' || placeId === 'buy-well' || placeId === 'buy-smart-valve'
  const deleteTool = place.kind === 'delete'
  const sprinklerTool = placeId !== undefined && SPRINKLER_SKU.includes(placeId)
  const stay = deleteTool || (placeId !== undefined && STAY_ARMED.includes(placeId))
  const skuStroke = placing && !edgeTool && !deleteTool && !sprinklerTool
  const followSku = placeId !== undefined && !pumpjack && !hangarPlace && !siloPlace && !edgeTool && !sprinklerTool
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
  const deleteTarget =
    deleteTool && worldPtr !== undefined ? deleteHit(world, edgeHit, vertexHit, worldPtr.x, worldPtr.y) : undefined
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
    const read = () => {
      const r = el.getBoundingClientRect()
      boxRef.current = { left: r.left, top: r.top, w: r.width, h: r.height }
      setView(prev => (prev.w === r.width && prev.h === r.height ? prev : { w: r.width, h: r.height }))
    }
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    window.addEventListener('scroll', read, true)
    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', read, true)
    }
  }, [])

  useEffect(() => {
    let id = 0
    const flush = () => {
      id = requestAnimationFrame(flush)
      const p = pendingMove.current
      if (p === undefined) return
      pendingMove.current = undefined
      const camNow = camRef.current
      const r = boxRef.current
      const w = {
        x: camNow.x + (p.x - r.left - r.w / 2) / (TILE * camNow.scale),
        y: camNow.y + (p.y - r.top - r.h / 2) / (TILE * camNow.scale),
      }
      setPtr(prev => (prev.x === p.x && prev.y === p.y ? prev : { x: p.x, y: p.y }))
      setWorldPtr(prev => (prev !== undefined && prev.x === w.x && prev.y === w.y ? prev : w))
      const d = drag.current
      if (d !== undefined && (p.buttons & 1) === 1 && world.driverVehicle(world.local) === undefined) {
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
        onHover(clickHit(world, w.x, w.y, lens))
      }
    }
    id = requestAnimationFrame(flush)
    return () => cancelAnimationFrame(id)
  }, [world, onHover, lens])

  function worldAt(clientX: number, clientY: number): { x: number; y: number } {
    const r = boxRef.current
    return {
      x: cam.x + (clientX - r.left - r.w / 2) / (TILE * cam.scale),
      y: cam.y + (clientY - r.top - r.h / 2) / (TILE * cam.scale),
    }
  }

  function onWheel(e: WheelEvent<SVGSVGElement>): void {
    e.preventDefault()
    const next = cam.scale * (e.deltaY < 0 ? 1.1 : 1 / 1.1)
    const scale = Math.min(3, Math.max(0.5, next))
    const r = boxRef.current
    const px = e.clientX - r.left - r.w / 2
    const py = e.clientY - r.top - r.h / 2
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
            : deleteTarget?.kind === 'smart'
              ? { kind: 'smart-valve', edge: deleteTarget.edge }
              : deleteTarget?.kind === 'wire'
                ? { kind: 'delete-wire', from: deleteTarget.from, to: deleteTarget.to }
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
          const w = worldAt(e.clientX, e.clientY)
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
          const w = worldAt(e.clientX, e.clientY)
          const hit = clickHit(world, w.x, w.y, lens)
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
              {hangarPlace &&
                Array.from({ length: HANGAR_H }, (_, row) =>
                  Array.from({ length: HANGAR_W }, (_, col) => {
                    if (row === 0 && col === 0) return undefined
                    return (
                      <rect
                        key={`${col},${row}`}
                        x={(strokeCell.col + col) * TILE}
                        y={(strokeCell.row + row) * TILE}
                        width={TILE}
                        height={TILE}
                        fill="none"
                        className={
                          skuStroke && world.prompt(strokeCell).kind !== 'place' ? 'stroke-roof' : 'stroke-ink'
                        }
                        strokeWidth={2}
                      />
                    )
                  }),
                )}
              {siloPlace &&
                Array.from({ length: SILO_H }, (_, row) =>
                  Array.from({ length: SILO_W }, (_, col) => {
                    if (row === 0 && col === 0) return undefined
                    return (
                      <rect
                        key={`silo-${col},${row}`}
                        x={(strokeCell.col + col) * TILE}
                        y={(strokeCell.row + row) * TILE}
                        width={TILE}
                        height={TILE}
                        fill="none"
                        className={
                          skuStroke && world.prompt(strokeCell).kind !== 'place' ? 'stroke-roof' : 'stroke-ink'
                        }
                        strokeWidth={2}
                      />
                    )
                  }),
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
                >
                  <Use art={ghostWet ? fit.html : dryOf(fit.html)} />
                </g>
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
            <g data-valve-ghost pointerEvents="none" opacity={0.7} transform={edgeTransform(edgeHit)}>
              <Use art={valveArt(true)} />
            </g>
          )}
          {placeId === 'buy-smart-valve' && edgeHit !== undefined && (
            <g data-smart-valve-ghost pointerEvents="none" opacity={0.7} transform={edgeTransform(edgeHit)}>
              <Use art={smartValveArt(false)} />
            </g>
          )}
          {lens === 'sensors' && <WiresGfx world={world} />}
          {place.kind === 'wire' && worldPtr !== undefined && (
            <PendingWire from={place.from} x={worldPtr.x} y={worldPtr.y} world={world} />
          )}
          {(lens === 'sensors' || place.kind === 'wire') && <PortChrome world={world} />}
          {placeId === 'buy-well' && edgeHit !== undefined && (
            <g data-well-ghost pointerEvents="none" opacity={0.7}>
              <WellGfx col={edgeHit.col} row={edgeHit.row} axis={edgeHit.axis} />
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
            >
              <Use art={placeId === 'buy-pumpjack' ? PUMP : RAIN_TANK} />
            </g>
          )}
          {(hangarPlace || siloPlace) && hoverCell !== undefined && (
            <g
              pointerEvents="none"
              opacity={0.7}
              transform={`translate(${hoverCell.col * TILE},${hoverCell.row * TILE}) scale(${TILE / 24})`}
            >
              <Use
                art={
                  placeId === 'buy-silo-seed'
                    ? SILO_SEED
                    : placeId === 'buy-silo-spray'
                      ? SILO_SPRAY
                      : placeId === 'buy-silo-produce'
                        ? SILO_PRODUCE
                        : HANGAR
                }
              />
            </g>
          )}
          <foreignObject
            ref={el => bindHud('speech', el)}
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
        {(() => {
          const driven = world.driverVehicle(world.local)
          if (driven === undefined || driven.pose.kind !== 'field') return undefined
          const hitch =
            driven.kind === 'tractor' && driven.hitch !== 'none' ? world.trailers.find(t => t.id === driven.hitch) : undefined
          return (
            <g
              pointerEvents="none"
              transform={`translate(${view.w / 2},${view.h / 2}) scale(${cam.scale})`}
              style={{ ['--hat']: HAT[world.local] } as CSSProperties}
            >
              {hitch !== undefined && hitch.pose.kind === 'attached' && driven.kind === 'tractor' && (
                <g ref={el => bindDummyTrailer(el)}>
                  <TrailerGfx kind={hitch.kind} boom={driven.boom} />
                </g>
              )}
              <g transform={`translate(${-TILE / 2},${-TILE / 2}) scale(${TILE / 24})`}>
                <g ref={el => bindDummyQuad(el)}>
                  <Use art={driven.kind === 'tractor' ? TRACTOR : QUAD} />
                </g>
              </g>
            </g>
          )
        })()}
      </svg>
      {followSku && placeId !== undefined && (
        <div className="pointer-events-none fixed z-30" style={{ left: ptr.x + 16, top: ptr.y + 16 }}>
          <svg className="h-16 w-16" viewBox="0 0 24 24">
            <Use art={skuInner(placeId)} />
          </svg>
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
      {(hangarPlace || siloPlace) && placeId !== undefined && hoverCell === undefined && (
        <div className="pointer-events-none fixed z-30" style={{ left: ptr.x + 16, top: ptr.y + 16 }}>
          {placeId === 'buy-hangar' ? (
            <svg className="h-16 w-24" viewBox="0 0 72 48">
              <Use art={HANGAR} />
            </svg>
          ) : (
            <svg className="h-24 w-16" viewBox="0 0 48 72">
              <Use
                art={placeId === 'buy-silo-seed' ? SILO_SEED : placeId === 'buy-silo-spray' ? SILO_SPRAY : SILO_PRODUCE}
              />
            </svg>
          )}
          <div className="mt-1 bg-house px-2 py-0.5 text-base text-ink">{placeLine(placeId)}</div>
        </div>
      )}
      {pumpjack && placeId !== undefined && hoverCell === undefined && (
        <div className="pointer-events-none fixed z-30" style={{ left: ptr.x + 16, top: ptr.y + 16 }}>
          <svg className="h-8 w-16" viewBox="0 0 48 24">
            <Use art={PUMP} />
          </svg>
          <div className="mt-1 bg-house px-2 py-0.5 text-base text-ink">{placeLine(placeId)}</div>
        </div>
      )}
    </div>
  )
}

function placeLine(id: SkuId): string {
  return `Place ${skuLabel(id)}`
}

function Use({ art }: { art: string }) {
  return <use href={symHref(art)} />
}

function TrailerGfx({ kind, boom }: { kind: 'seed' | 'spray' | 'harvest'; boom: 3 | 5 }) {
  const s = boom / 5
  return (
    <>
      <Use art={kind === 'seed' ? TRAILER_SEED : kind === 'spray' ? TRAILER_SPRAY : TRAILER_HARVEST} />
      <g data-rake transform={`translate(0 12) rotate(90) translate(${-60 * s} -4) scale(${s} 1)`}>
        <Use art={TRAILER_RAKE} />
      </g>
    </>
  )
}

const GROUND_CHUNK = 16

type BakedChunk = { sig: string; html: string }

const bakedChunks = new Map<string, BakedChunk>()
let bakedWorld: World | undefined

type Bounds = ReturnType<World['bounds']>

function groundToken(col: number, row: number, cell: Cell, g: number): string {
  if (cell.kind === 'untilled' && cell.cover.kind === 'tile') return `t:${cell.cover.tile}`
  if (cell.kind === 'untilled' && cell.ground === 'hard') return `h${hBand(g)}`
  if ((cell.kind === 'untilled' && cell.ground === 'very-hard') || cell.kind === 'infertile') {
    return `v${vhBand(g)}`
  }
  return `g${tileVariant(col, row, 2) * 4 + tileVariant(col, row, 4, 1)}`
}

function fadeToken(col: number, row: number, g: number): string {
  if (g < VERY_HARD_MAX) return `v${vhBand(g)}`
  if (g < HARD_MAX) return `h${hBand(g)}`
  return `g${tileVariant(col, row, 2) * 4 + tileVariant(col, row, 4, 1)}`
}

function groundTile(col: number, row: number, cell: Cell, g: number): string {
  if (cell.kind === 'untilled' && cell.cover.kind === 'tile') return BUILDING_TILES[cell.cover.tile]
  if (cell.kind === 'untilled' && cell.ground === 'hard') return HARD[hBand(g)]
  if ((cell.kind === 'untilled' && cell.ground === 'very-hard') || cell.kind === 'infertile') {
    return VERY_HARD[vhBand(g)]
  }
  return GRASS[tileVariant(col, row, 2) * 4 + tileVariant(col, row, 4, 1)]
}

function chunkSig(world: World, cx: number, cy: number, keys: Set<string>, b: Bounds): string {
  const c0 = cx * GROUND_CHUNK
  const r0 = cy * GROUND_CHUNK
  let sig = ''
  for (let row = r0; row < r0 + GROUND_CHUNK; row++) {
    for (let col = c0; col < c0 + GROUND_CHUNK; col++) {
      if (!keys.has(chunkKey(chunkOf({ col, row })))) {
        const d = Math.max(b.col0 - col, col - (b.col1 - 1), b.row0 - row, row - (b.row1 - 1), 0)
        if (d > FADE) continue
        sig += `${fadeToken(col, row, goodness(world.rng, col, row))}:${d <= 1 ? 0.65 : 0.35};`
        continue
      }
      sig += `${groundToken(col, row, world.cell({ col, row }), goodness(world.rng, col, row))};`
    }
  }
  return sig
}

function chunkHtml(world: World, cx: number, cy: number, keys: Set<string>, b: Bounds): string {
  const c0 = cx * GROUND_CHUNK
  const r0 = cy * GROUND_CHUNK
  let html = ''
  for (let row = r0; row < r0 + GROUND_CHUNK; row++) {
    for (let col = c0; col < c0 + GROUND_CHUNK; col++) {
      const at = { col, row }
      const g = goodness(world.rng, col, row)
      const ownedCell = keys.has(chunkKey(chunkOf(at)))
      if (!ownedCell) {
        const d = Math.max(b.col0 - col, col - (b.col1 - 1), b.row0 - row, row - (b.row1 - 1), 0)
        if (d > FADE) continue
        const op = ` opacity="${d <= 1 ? 0.65 : 0.35}"`
        html += `<g transform="translate(${col * TILE},${row * TILE}) scale(${TILE / 24})"${op}><use href="${symHref(groundArt(col, row, g))}"/></g>`
        continue
      }
      html += `<g transform="translate(${col * TILE},${row * TILE}) scale(${TILE / 24})"><use href="${symHref(groundTile(col, row, world.cell(at), g))}"/></g>`
    }
  }
  return html
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
  void owned
  void groundRev
  if (bakedWorld !== world) {
    bakedChunks.clear()
    bakedWorld = world
  }
  const b = world.bounds()
  const keys = new Set(world.owned.map(chunkKey))
  const chunks: { key: string; html: string }[] = []
  const cyEnd = Math.floor((b.row1 + FADE - 1) / GROUND_CHUNK)
  const cxBnd = Math.floor((b.col1 + FADE - 1) / GROUND_CHUNK)
  for (let cy = Math.floor((b.row0 - FADE) / GROUND_CHUNK); cy <= cyEnd; cy++) {
    for (let cx = Math.floor((b.col0 - FADE) / GROUND_CHUNK); cx <= cxBnd; cx++) {
      const key = `${cx},${cy}`
      const prev = bakedChunks.get(key)
      if (prev !== undefined) {
        const sig = chunkSig(world, cx, cy, keys, b)
        if (prev.sig === sig) {
          chunks.push({ key, html: prev.html })
          continue
        }
        const made = { sig, html: chunkHtml(world, cx, cy, keys, b) }
        bakedChunks.set(key, made)
        chunks.push({ key, html: made.html })
        continue
      }
      const made = { sig: chunkSig(world, cx, cy, keys, b), html: chunkHtml(world, cx, cy, keys, b) }
      bakedChunks.set(key, made)
      chunks.push({ key, html: made.html })
    }
  }
  return (
    <g>
      {chunks.map(c => (
        <g key={c.key} dangerouslySetInnerHTML={{ __html: c.html }} />
      ))}
    </g>
  )
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
  const plots: {
    col: number
    row: number
    kind: Cell['kind']
    dv: number
    e: string
    turfStage: string
    weedV: number
    weedStage: string
    crop: string
    stage: string
    pip: string
    water: Band | ''
    fert: Band | ''
    fresh: boolean
  }[] = []
  const rocks: { col: number; row: number; w: number; h: number }[] = []
  const tufts: { col: number; row: number; v: 0 | 1 | 2 }[] = []
  const trees: { col: number; row: number; species: 'apple' | 'apricot' | 'lemon' | 'cherry'; stage: 'grow' | 'unripe' | 'ripe' }[] = []
  const props: { col: number; row: number; art: string; kind: string }[] = []
  const truck = { col: world.truck.base.col, row: world.truck.base.row }
  const tints: { col: number; row: number; fill: string; op: number; hard: boolean }[] = []
  const pipes: { col: number; row: number; art: string; rot: number; wet: boolean }[] = []
  const sprinklers: Sprinkler[] = []
  const fences: { col: number; row: number; art: string; rot: number }[] = []
  const valves: { at: Edge; open: boolean }[] = []
  const wellEdges: Edge[] = []
  world.wells.forEach(w => wellEdges.push(w.at))
  const smartValves: { at: Edge; open: boolean }[] = []
  world.segments.forEach(seg => {
    if (seg.gate.kind === 'valve') valves.push({ at: seg.at, open: seg.gate.open })
    if (seg.gate.kind === 'smart') {
      const h = world.smartHold.get(edgeKey(seg.at))
      smartValves.push({ at: seg.at, open: h !== undefined && h.level === 1 })
    }
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
  const sensorWash = new Set<string>()
  const addReaderWash = (at: { col: number; row: number }) => {
    area3(at).forEach(c => {
      if (world.inWorld(c)) sensorWash.add(`${c.col},${c.row}`)
    })
  }
  const hud = world.hud
  if (hud !== undefined && (hud.kind === 'water' || hud.kind === 'harvest')) addReaderWash(hud.at)
  const hide = new Set<string>()
  if (hideVerts !== undefined) hideVerts.forEach(v => hide.add(`${v.col},${v.row}`))
  const expandUnlocked = world.done.has('unlock-expand')
  const purchases = world.purchases
  const faces = useMemo(() => world.faces(), [world, expandUnlocked, purchases])
  const PROP_ART: Record<string, string> = {
    chest: CHEST,
    grinder: GRINDER,
    mill: MILL,
    still: STILL,
    barrel: BARREL,
    jam: JAM,
    freezer: FREEZER,
    tap: TAP,
  }
  const boxes: { col: number; row: number }[] = []
  world.forEachCell((at, cell) => {
    const key = `${at.col},${at.row}`
    if (isPlot(cell) && cell.kind !== 'untilled' && cell.kind !== 'infertile') {
      const stage =
        cell.kind === 'ripe'
          ? ripeGroup(cell.plant.rarity)
          : cell.kind === 'growing' || cell.kind === 'dead'
            ? cell.plant.stage(cell.kind)
            : ''
      const bands = cell.kind === 'growing' ? plantBands(cell.plant.crop, cell.plant.rarity, cell.soil) : undefined
      const rarity =
        cell.kind === 'growing' || cell.kind === 'ripe' || cell.kind === 'dead' ? cell.plant.rarity : undefined
      const pip = rarity !== undefined ? qualityPip(rarity) : undefined
      plots.push({
        col: at.col,
        row: at.row,
        kind: cell.kind,
        dv: tileVariant(at.col, at.row, 2),
        e: edgeSig(dirtEdges(world, at.col, at.row)),
        turfStage: cell.kind === 'turf' ? cell.turf.stage() : '',
        weedV: cell.kind === 'weed' ? cell.weed.variant : -1,
        weedStage: cell.kind === 'weed' ? cell.weed.stage() : '',
        crop:
          cell.kind === 'rotten'
            ? cell.crop
            : cell.kind === 'growing' || cell.kind === 'ripe' || cell.kind === 'dead'
              ? cell.plant.crop
              : '',
        stage,
        pip: pip ?? '',
        water: bands !== undefined && bands.water !== 'green' ? bands.water : '',
        fert: bands !== undefined && bands.fert !== 'green' ? bands.fert : '',
        fresh: cell.kind === 'ripe' && cell.plant.freshness < 0.8,
      })
    }
    if (cell.kind === 'untilled' && cell.cover.kind === 'grass') {
      tufts.push({ col: at.col, row: at.row, v: cell.cover.variant })
    }
    if (cell.kind === 'rock' && cell.base.col === at.col && cell.base.row === at.row) {
      rocks.push({ col: at.col, row: at.row, w: cell.base.w, h: cell.base.h })
    }
    if (cell.kind === 'tree' && cell.base.col === at.col && cell.base.row === at.row) {
      const stage = cell.juvenile < 1 ? 'grow' : cell.yield.kind === 'on' || cell.fruit >= 1 ? 'ripe' : 'unripe'
      trees.push({ col: at.col, row: at.row, species: cell.species, stage })
    }
    const propArt = PROP_ART[cell.kind]
    if (propArt !== undefined) props.push({ col: at.col, row: at.row, art: propArt, kind: cell.kind })
    if (isSensor(cell)) {
      props.push({ col: at.col, row: at.row, art: sensorProp(cell), kind: cell.kind })
    }
    if (
      lens === 'sensors' &&
      (cell.kind === 'sensor-water' || cell.kind === 'sensor-fert' || cell.kind === 'sensor-harvest')
    ) {
      addReaderWash(at)
    }
    if (cell.kind === 'compost-box') boxes.push({ col: at.col, row: at.row })
    // 1x2 stores are not in PROP_ART: they must draw once, at their base origin.
    if (cell.kind === 'hangar' && cell.base.col === at.col && cell.base.row === at.row) {
      props.push({ col: at.col, row: at.row, art: HANGAR, kind: cell.kind })
    }
    if (cell.kind === 'silo-seed' && cell.base.col === at.col && cell.base.row === at.row) {
      props.push({ col: at.col, row: at.row, art: SILO_SEED, kind: cell.kind })
    }
    if (cell.kind === 'silo-spray' && cell.base.col === at.col && cell.base.row === at.row) {
      props.push({ col: at.col, row: at.row, art: SILO_SPRAY, kind: cell.kind })
    }
    if (cell.kind === 'silo-produce' && cell.base.col === at.col && cell.base.row === at.row) {
      props.push({ col: at.col, row: at.row, art: SILO_PRODUCE, kind: cell.kind })
    }
    if (cell.kind === 'seed-silo' && cell.base.col === at.col && cell.base.row === at.row) {
      props.push({ col: at.col, row: at.row, art: SEED_SILO, kind: cell.kind })
    }
    if (cell.kind === 'additive-store' && cell.base.col === at.col && cell.base.row === at.row) {
      props.push({ col: at.col, row: at.row, art: ADDITIVE_STORE, kind: cell.kind })
    }
    if (world.hasFence(at)) {
      const a = world.fenceArms(at)
      const fit = fenceFit(a.n, a.e, a.s, a.w)
      fences.push({ col: at.col, row: at.row, art: fit.html, rot: fit.rot })
    }
    const g = lens === 'land' ? goodness(world.rng, at.col, at.row) : 0
    const tint = lensFill(lens, cell, aoeWash.has(key), g)
    if (tint !== undefined) tints.push({ col: at.col, row: at.row, ...tint })
  })
  visitVerts(world, v => {
    if (showPipes && !hide.has(`${v.col},${v.row}`)) {
      const a = arms(world, v, undefined)
      const fit = pipeFit(a.n, a.e, a.s, a.w)
      if (fit !== undefined) {
        const wet = world.vertexWet(v)
        pipes.push({ col: v.col, row: v.row, art: wet ? fit.html : dryOf(fit.html), rot: fit.rot, wet })
      }
    }
    const s = world.sprinklerAt(v)
    if (s !== undefined) sprinklers.push(s)
  })
  return (
    <g>
      {tufts.map(t => (
        <TuftGfx key={`tuft-${t.col},${t.row}`} col={t.col} row={t.row} v={t.v} />
      ))}
      {plots.map(t => (
        <PlotGfx
          key={`${t.col},${t.row}`}
          col={t.col}
          row={t.row}
          kind={t.kind}
          dv={t.dv}
          e={t.e}
          turfStage={t.turfStage}
          weedV={t.weedV}
          weedStage={t.weedStage}
          crop={t.crop}
          stage={t.stage}
          pip={t.pip}
          water={t.water}
          fert={t.fert}
          fresh={t.fresh}
        />
      ))}
      {fences.map(f => (
        <FenceGfx key={`fence-${f.col},${f.row}`} col={f.col} row={f.row} art={f.art} rot={f.rot} />
      ))}
      {rocks.map(r => (
        <RockGfx key={`${r.col},${r.row}`} col={r.col} row={r.row} w={r.w} h={r.h} />
      ))}
      {trees.map(t => (
        <TreeGfx key={`tree-${t.col},${t.row}`} col={t.col} row={t.row} species={t.species} stage={t.stage} />
      ))}
      {world.pumps.map((p, i) => {
        const col = p.base.shape === 'rect' ? p.base.col : Math.floor(p.base.cx - p.base.r)
        const row = p.base.shape === 'rect' ? p.base.row : Math.floor(p.base.cy - p.base.r)
        return (
          <g key={`pump-${i}`}>
            <PropGfx art={PUMP} col={col} row={row} />
            {showPipes && <SourceGfx world={world} base={p.base} />}
          </g>
        )
      })}
      {world.tanks.map((t, i) => (
        <g key={`tank-${i}`}>
          <PropGfx art={RAIN_TANK} col={t.base.col} row={t.base.row} />
          {showPipes && <SourceGfx world={world} base={t.base} />}
        </g>
      ))}
      {props.map(p => (
        <PropGfx key={`${p.kind}-${p.col},${p.row}`} art={p.art} col={p.col} row={p.row} />
      ))}
      {world.drops.map((d, i) => {
        const n = i % 4
        const tool =
          d.item.kind === 'shovel' ||
          d.item.kind === 'pickaxe' ||
          d.item.kind === 'container' ||
          d.item.kind === 'box'
        return (
          <DropGfx
            key={i}
            x={d.at.col * TILE + 4 + (n % 2) * 6}
            y={d.at.row * TILE + 4 + Math.floor(n / 2) * 6}
            art={faceGfx(d.item)}
            title={tool ? itemLine(d.item, world.modifiers) : undefined}
          />
        )
      })}
      <g
        data-truck
        transform={`translate(${truck.col * TILE},${truck.row * TILE}) scale(${TILE / 24})`}
      >
        <Use art={TRUCK} />
      </g>
      <g transform={`translate(${HOUSE_BASE.col * TILE},${HOUSE_BASE.row * TILE}) scale(${TILE / 24})`}>
        <Use art={HOUSE} />
      </g>
      {world.driverVehicle(world.local) !== undefined &&
        [
          ...world.hangars.flatMap(h => hangarPad(h.base).map(p => ({ kind: h.kind, col: h.base.col, row: h.base.row, p }))),
          ...[...world.seedSilos, ...world.spraySilos, ...world.produceSilos].flatMap(h =>
            siloPad(h.base).map(p => ({ kind: h.kind, col: h.base.col, row: h.base.row, p })),
          ),
        ].map(h => (
          <g
            key={`return-${h.kind}-${h.col},${h.row}-${h.p.col},${h.p.row}`}
            pointerEvents="none"
            transform={`translate(${h.p.col * TILE},${h.p.row * TILE}) scale(${TILE / 24})`}
          >
            <Use art={HANGAR_RETURN} />
          </g>
        ))}
      {world.vehicles.flatMap(v => {
        if (v.pose.kind !== 'field') return []
        if (v.pose.driver === world.local) return []
        const hat = v.pose.driver === 'none' ? undefined : HAT[v.pose.driver]
        const hitch = v.kind === 'tractor' && v.hitch !== 'none' ? world.trailers.find(t => t.id === v.hitch) : undefined
        const nodes = []
        if (hitch !== undefined && hitch.pose.kind === 'attached' && v.kind === 'tractor') {
          nodes.push(
            <g key={`trailer-${hitch.id}`} ref={el => bindTrailer(hitch.id, el)} data-trailer={hitch.id}>
              <TrailerGfx kind={hitch.kind} boom={v.boom} />
            </g>,
          )
        }
        nodes.push(
          <g
            key={`veh-${v.id}`}
            ref={el => bindQuad(v.id, el, v.kind)}
            data-quad={v.id}
            style={hat === undefined ? undefined : ({ ['--hat']: hat } as CSSProperties)}
          >
            <Use art={v.kind === 'tractor' ? TRACTOR : QUAD} />
          </g>,
        )
        return nodes
      })}
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
      {[...sensorWash].map(k => {
        const comma = k.indexOf(',')
        const col = Number(k.slice(0, comma))
        const row = Number(k.slice(comma + 1))
        return (
          <rect
            key={`sensor-aoe-${k}`}
            x={col * TILE}
            y={row * TILE}
            width={TILE}
            height={TILE}
            className="fill-water"
            fillOpacity={0.35}
            pointerEvents="none"
          />
        )
      })}
      {wellEdges.map(e => (
        <WellGfx key={`well-${edgeKey(e)}`} col={e.col} row={e.row} axis={e.axis} />
      ))}
      {valves.map(v => (
        <ValveGfx key={`valve-${edgeKey(v.at)}`} col={v.at.col} row={v.at.row} axis={v.at.axis} open={v.open} />
      ))}
      {smartValves.map(v => (
        <g
          key={`smart-${edgeKey(v.at)}`}
          data-smart-valve={edgeKey(v.at)}
          pointerEvents="none"
          transform={edgeTransform(v.at)}
        >
          <Use art={smartValveArt(v.open)} />
        </g>
      ))}
      {pipes.map(p => (
        <PipeGfx
          key={`pipe-${p.col},${p.row}`}
          col={p.col}
          row={p.row}
          art={p.art}
          rot={p.rot}
          wet={p.wet}
        />
      ))}
      {sprinklers.map(s => (
        <SprinklerMark
          key={`sp-${s.at.col},${s.at.row}`}
          col={s.at.col}
          row={s.at.row}
          variant={s.variant}
          facing={'facing' in s ? s.facing : undefined}
          lensKind={lens === 'kind'}
          working={working(world, s)}
          tuneCrop={s.tune.kind === 'crop' ? s.tune.crop : undefined}
        />
      ))}
      {boxes.map(b => (
        <CompostGfx key={`compost-${b.col},${b.row}`} col={b.col} row={b.row} />
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
      {world.seats.map(s => {
        const gone = s.presence === 'away'
        const napping = gone && s.napping
        return (
          <g
            key={s.id}
            ref={el => bindActor(s.id, el)}
            data-actor={napping ? undefined : s.id}
            style={{ ['--hat']: HAT[s.id] } as CSSProperties}
            opacity={gone ? 0.65 : 1}
            transform={`translate(${(s.actor.x - 0.5) * TILE},${(s.actor.y - 0.5) * TILE}) scale(${TILE / 24})`}
          >
            <g transform={napping ? 'rotate(90 12 12)' : undefined}>
              <use href={symHref(ACTOR)} />
              {!napping && s.hand.kind === 'hold' && (
                <g transform={`translate(15,13) scale(${8 / 24})`}>
                  <Use art={faceGfx(s.hand.item)} />
                </g>
              )}
            </g>
            {napping && (
              <text x={20} y={6} fontSize={7} fill="#1c1710" fontFamily="monospace">
                zZZ
              </text>
            )}
          </g>
        )
      })}
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
  if (lens === 'sensors' && isSensor(cell)) return undefined
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
  if (
    cell.kind === 'pump' ||
    cell.kind === 'chest' ||
    cell.kind === 'grinder' ||
    cell.kind === 'compost-box' ||
    cell.kind === 'mill' ||
    cell.kind === 'jam' ||
    cell.kind === 'still' ||
    cell.kind === 'barrel' ||
    cell.kind === 'freezer' ||
    cell.kind === 'hangar' ||
    cell.kind === 'silo-seed' ||
    cell.kind === 'silo-spray' ||
    cell.kind === 'silo-produce' ||
    cell.kind === 'seed-silo' ||
    cell.kind === 'additive-store'
  ) {
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

function edgeSig(e: DirtEdges): string {
  return `${e.top ? 1 : 0}${e.right ? 1 : 0}${e.bottom ? 1 : 0}${e.left ? 1 : 0}${e.topLeftInset ? 1 : 0}${e.topRightInset ? 1 : 0}${e.bottomRightInset ? 1 : 0}${e.bottomLeftInset ? 1 : 0}`
}

const TuftGfx = memo(function TuftGfx({ col, row, v }: { col: number; row: number; v: 0 | 1 | 2 }) {
  return (
    <g
      data-tuft={`${col},${row}`}
      transform={`translate(${col * TILE},${row * TILE}) scale(${TILE / 24})`}
    >
      <Use art={GRASS_TUFT[v]} />
    </g>
  )
})

const FenceGfx = memo(function FenceGfx({
  col,
  row,
  art,
  rot,
}: {
  col: number
  row: number
  art: string
  rot: number
}) {
  return (
    <g
      data-fence={`${col},${row}`}
      transform={`translate(${col * TILE},${row * TILE}) scale(${TILE / 24}) rotate(${rot} 12 12)`}
    >
      <Use art={art} />
    </g>
  )
})

const TreeGfx = memo(function TreeGfx({
  col,
  row,
  species,
  stage,
}: {
  col: number
  row: number
  species: 'apple' | 'apricot' | 'lemon' | 'cherry'
  stage: 'grow' | 'unripe' | 'ripe'
}) {
  return (
    <g transform={`translate(${col * TILE},${row * TILE}) scale(${TILE / 24})`}>
      <Use art={treeStage(species, stage)} />
    </g>
  )
})

const PropGfx = memo(function PropGfx({ art, col, row }: { art: string; col: number; row: number }) {
  return (
    <g transform={`translate(${col * TILE},${row * TILE}) scale(${TILE / 24})`}>
      <Use art={art} />
    </g>
  )
})

const PipeGfx = memo(function PipeGfx({
  col,
  row,
  art,
  rot,
  wet,
}: {
  col: number
  row: number
  art: string
  rot: number
  wet: boolean
}) {
  return (
    <g
      data-pipe
      data-wet={wet ? '1' : '0'}
      transform={`translate(${col * TILE},${row * TILE}) rotate(${rot}) translate(${-TILE / 2},${-TILE / 2}) scale(${TILE / 24})`}
    >
      <Use art={art} />
    </g>
  )
})

const RockGfx = memo(function RockGfx({ col, row, w, h }: { col: number; row: number; w: number; h: number }) {
  if (w === 1 && h === 2) {
    return (
      <g transform={`translate(${col * TILE + TILE},${row * TILE}) rotate(90) scale(${TILE / 24})`}>
        <Use art={ROCK_LONG} />
      </g>
    )
  }
  if (w === 2 && h === 1) {
    return (
      <g transform={`translate(${col * TILE},${row * TILE}) scale(${TILE / 24})`}>
        <Use art={ROCK_LONG} />
      </g>
    )
  }
  return (
    <g transform={`translate(${col * TILE},${row * TILE}) scale(${TILE / 24})`}>
      <Use art={ROCK} />
    </g>
  )
})

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
      <g transform={`rotate(${angle}) scale(${TILE / 24})`}>
        <Use art={DIRT_INSET} />
      </g>
    </g>
  )
}

const PlotGfx = memo(function PlotGfx({
  col,
  row,
  kind,
  dv,
  e,
  turfStage,
  weedV,
  weedStage,
  crop,
  stage,
  pip,
  water,
  fert,
  fresh,
}: {
  col: number
  row: number
  kind: Cell['kind']
  dv: number
  e: string
  turfStage: string
  weedV: number
  weedStage: string
  crop: string
  stage: string
  pip: string
  water: Band | ''
  fert: Band | ''
  fresh: boolean
}) {
  const x = col * TILE
  const y = row * TILE
  const edge = {
    top: e[0] === '1',
    right: e[1] === '1',
    bottom: e[2] === '1',
    left: e[3] === '1',
    topLeftInset: e[4] === '1',
    topRightInset: e[5] === '1',
    bottomRightInset: e[6] === '1',
    bottomLeftInset: e[7] === '1',
  }
  const at = { col, row }
  return (
    <g className={pip !== '' ? 'plant-rarity' : undefined}>
      <g transform={`translate(${x},${y}) scale(${TILE / 24})`}>
        <Use art={DIRT[dv]} />
      </g>
      {edge.bottom && (
        <g transform={`translate(${x},${y}) scale(${TILE / 24})`}>
          <Use art={DIRT_EDGE} />
        </g>
      )}
      {edge.top && (
        <g transform={`translate(${x},${y}) scale(${TILE / 24}) rotate(180 12 12)`}>
          <Use art={DIRT_EDGE} />
        </g>
      )}
      {edge.right && (
        <g transform={`translate(${x},${y}) scale(${TILE / 24}) rotate(-90 12 12)`}>
          <Use art={DIRT_EDGE} />
        </g>
      )}
      {edge.left && (
        <g transform={`translate(${x},${y}) scale(${TILE / 24}) rotate(90 12 12)`}>
          <Use art={DIRT_EDGE} />
        </g>
      )}
      {edge.topLeftInset && <DirtInsetG x={x} y={y} angle={0} />}
      {edge.topRightInset && <DirtInsetG x={x + TILE} y={y} angle={90} />}
      {edge.bottomRightInset && <DirtInsetG x={x + TILE} y={y + TILE} angle={180} />}
      {edge.bottomLeftInset && <DirtInsetG x={x} y={y + TILE} angle={-90} />}
      {kind === 'rotten' && (
        <g transform={`translate(${x},${y}) scale(${TILE / 24})`}>
          <Use art={CROP_ROTTEN} />
        </g>
      )}
      {turfStage !== '' && (
        <g data-turf={`${col},${row}`} transform={`translate(${x},${y}) scale(${TILE / 24})`}>
          <Use art={turfInner(turfStage as 'sprout' | 'grow')} />
        </g>
      )}
      {weedV >= 0 && (
        <g data-weed={`${col},${row}`} transform={`translate(${x},${y}) scale(${TILE / 24})`}>
          <Use art={weedInner(weedV as 0 | 1, weedStage as 'sprout' | 'grow')} />
        </g>
      )}
      {stage !== '' && crop !== '' && (
        <g transform={`translate(${x},${y}) scale(${TILE / 24})`}>
          <Use art={cropInner(crop as CropId, stage)} />
        </g>
      )}
      {pip !== '' && (
        <g
          className="plant-quality-pip"
          transform={`translate(${x},${y}) scale(${TILE / 24}) translate(16,16)`}
        >
          <Use art={pip} />
        </g>
      )}
      {water !== '' && (
        <g className={water === 'red' ? 'animate-pulse' : undefined}>
          <rect x={x + 2} y={y + TILE - 6} width={TILE - 4} height={4} fill="#1c1710" />
          <rect
            ref={el => bindBar('thirst', at, el)}
            data-thirst={`${col},${row}`}
            x={x + 3}
            y={y + TILE - 5}
            height={2}
            fill={BAND_TINT[water]}
          />
          <rect x={x + 2 + (TILE - 4) / 2} y={y + TILE - 7} width={1} height={6} fill="#1c1710" />
        </g>
      )}
      {fert !== '' && (
        <g className={fert === 'red' ? 'animate-pulse' : undefined}>
          <rect x={x + 2} y={y + TILE - 11} width={TILE - 4} height={4} fill="#1c1710" />
          <rect
            ref={el => bindBar('fert', at, el)}
            data-fert={`${col},${row}`}
            x={x + 3}
            y={y + TILE - 10}
            height={2}
            fill={BAND_TINT[fert]}
          />
        </g>
      )}
      {fresh && kind === 'ripe' && (
        <g>
          <rect x={x + 2} y={y + TILE - 6} width={TILE - 4} height={4} fill="#1c1710" />
          <rect
            ref={el => bindBar('fresh', at, el)}
            data-fresh={`${col},${row}`}
            x={x + 3}
            y={y + TILE - 5}
            height={2}
            className="fill-lens-bad"
          />
        </g>
      )}
    </g>
  )
})

const CompostGfx = memo(function CompostGfx({ col, row }: { col: number; row: number }) {
  return (
    <g data-compost={`${col},${row}`}>
      <PropGfx art={COMPOST_BOX} col={col} row={row} />
      <rect x={col * TILE + 2} y={row * TILE + TILE - 6} width={TILE - 4} height={4} fill="#1c1710" />
      <rect
        ref={el => bindBar('compost', { col, row }, el)}
        data-compost-bar
        x={col * TILE + 3}
        y={row * TILE + TILE - 5}
        height={2}
        fill={WASH}
      />
    </g>
  )
})

const DropGfx = memo(function DropGfx({
  x,
  y,
  art,
  title,
}: {
  x: number
  y: number
  art: string
  title: string | undefined
}) {
  return (
    <g transform={`translate(${x},${y}) scale(${33 / 24})`}>
      <Use art={art} />
      {title !== undefined && <title>{title}</title>}
    </g>
  )
})

function SourceGfx({ world, base }: { world: World; base: Base }) {
  return (
    <g pointerEvents="none">
      {occupiedCells(base, world.owned).map(at => (
        <PropGfx key={`src-${at.col},${at.row}`} art={PIPE_SOURCE} col={at.col} row={at.row} />
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

const ValveGfx = memo(function ValveGfx({
  col,
  row,
  axis,
  open,
}: {
  col: number
  row: number
  axis: 'h' | 'v'
  open: boolean
}) {
  return (
    <g
      data-valve={edgeKey({ axis, col, row })}
      data-open={open ? '1' : '0'}
      pointerEvents="none"
      transform={edgeTransform({ axis, col, row })}
    >
      <Use art={valveArt(open)} />
    </g>
  )
})

const WellGfx = memo(function WellGfx({
  col,
  row,
  axis,
}: {
  col: number
  row: number
  axis: 'h' | 'v'
}) {
  return (
    <g data-well={edgeKey({ axis, col, row })} pointerEvents="none" transform={edgeTransform({ axis, col, row })}>
      <Use art={WELL} />
    </g>
  )
})

const SprinklerMark = memo(function SprinklerMark({
  col,
  row,
  variant,
  facing,
  lensKind,
  working,
  tuneCrop,
}: {
  col: number
  row: number
  variant: Sprinkler['variant']
  facing: 'ns' | 'ew' | undefined
  lensKind: boolean
  working: boolean
  tuneCrop: CropId | undefined
}) {
  const s: Sprinkler =
    variant === 'vert'
      ? { variant, at: { col, row }, facing: facing ?? 'ns', tune: { kind: 'flat' }, inn: 0, hold: 0 }
      : { variant, at: { col, row }, tune: { kind: 'flat' }, inn: 0, hold: 0 }
  return (
    <g>
      {lensKind && (
        <circle
          cx={col * TILE}
          cy={row * TILE}
          r={TILE * 0.22}
          fill={WATER}
          fillOpacity={0.72}
          style={{ mixBlendMode: 'multiply' }}
          pointerEvents="none"
        />
      )}
      <SprinklerGfx s={s} placed />
      {working && <SprinklerVfx s={s} />}
      {tuneCrop !== undefined && (
        <g
          pointerEvents="none"
          transform={`translate(${col * TILE - TILE * 0.22},${row * TILE - TILE * 0.62}) scale(${TILE * 0.44 / 24})`}
        >
          <Use art={cropInner(tuneCrop, ripeGroup('common'))} />
        </g>
      )}
    </g>
  )
})

function SprinklerGfx({ s, opacity, placed }: { s: Sprinkler; opacity?: number; placed: boolean }) {
  const rot = s.variant === 'vert' && s.facing === 'ns' ? 90 : 0
  const art = s.variant === 'basic' ? SPRINKLER : s.variant === 'large' ? SPRINKLER_LARGE : SPRINKLER_VERT
  return (
    <g
      data-sprinkler={placed ? '' : undefined}
      pointerEvents="none"
      opacity={opacity}
      transform={`translate(${s.at.col * TILE},${s.at.row * TILE}) rotate(${rot}) translate(${-TILE / 2},${-TILE / 2}) scale(${TILE / 24})`}
    >
      <Use art={art} />
    </g>
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
  | { kind: 'smart'; edge: Edge }
  | { kind: 'wire'; from: WireEnd; to: WireEnd }

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

function sensorProp(cell: Sensor): string {
  if (cell.kind === 'lever') return leverArt(cell.on)
  if (cell.kind === 'button') return buttonArt(cell.out === 1)
  if (cell.kind === 'lamp') return lampArt(cell.inn === 1)
  if (cell.kind === 'or') return PROP_OR
  if (cell.kind === 'and') return PROP_AND
  if (cell.kind === 'not') return PROP_NOT
  if (cell.kind === 'sensor-water') return waterSensorArt(cell.out === 1)
  if (cell.kind === 'sensor-fert') return fertSensorArt(cell.out === 0)
  if (cell.kind === 'sensor-harvest') return harvestSensorArt(cell.out === 1)
  if (cell.kind === 'water-system') return waterSystemArt(cell.out === 1)
  return vehicleDetectorArt(cell.out === 1)
}

function wireEndXY(world: World, end: WireEnd): { x: number; y: number } {
  if (end.kind === 'cell') {
    const c = world.inWorld(end.at) ? world.cell(end.at) : undefined
    const kind = c !== undefined && isSensor(c) ? c.kind : undefined
    return portXY(end, kind)
  }
  return portXY(end, undefined)
}

function portHit(world: World, wx: number, wy: number): WireEnd | undefined {
  const at = { col: Math.floor(wx), row: Math.floor(wy) }
  if (world.inWorld(at)) {
    const c = world.cell(at)
    if (isSensor(c)) {
      const fx = wx - at.col
      const fy = wy - at.row
      if (c.kind === 'and' || c.kind === 'or') {
        if (fy > 0.65) return { kind: 'cell', at, port: 'out' }
        return { kind: 'cell', at, port: fx < 0.5 ? 'in-l' : 'in-r' }
      }
      if (c.kind === 'not') return { kind: 'cell', at, port: fy < 0.5 ? 'in' : 'out' }
      if (c.kind === 'lamp') return { kind: 'cell', at, port: 'in' }
      return { kind: 'cell', at, port: 'out' }
    }
  }
  const v = nearestVertex(wx, wy)
  if (
    world.done.has('unlock-smart-irrigation') &&
    world.sprinklerAt(v) !== undefined &&
    Math.hypot(wx - v.col, wy - v.row) <= VERTEX_HIT
  ) {
    return { kind: 'sprinkler', at: v, port: 'in' }
  }
  const edge = nearestEdge(wx, wy)
  if (edge !== undefined && world.hasSmart(edge)) return { kind: 'valve', e: edge, port: 'in' }
  return undefined
}

function wireSignal(world: World, from: WireEnd): boolean {
  if (from.kind !== 'cell') return false
  const c = world.inWorld(from.at) ? world.cell(from.at) : undefined
  if (c === undefined || !isSensor(c) || c.kind === 'lamp') return false
  return c.out === 1
}

function wirePathD(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const { c1, c2 } = wireControls(from, to)
  return `M ${from.x * TILE} ${from.y * TILE} C ${c1.x * TILE} ${c1.y * TILE}, ${c2.x * TILE} ${c2.y * TILE}, ${to.x * TILE} ${to.y * TILE}`
}

function WireStroke({ d, color }: { d: string; color: string }) {
  return (
    <g pointerEvents="none">
      <path d={d} fill="none" stroke="#1c1710" strokeWidth={4.5} strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  )
}

function WiresGfx({ world }: { world: World }) {
  return (
    <g pointerEvents="none">
      {world.wires.map((w, i) => {
        const a = wireEndXY(world, w.from)
        const b = wireEndXY(world, w.to)
        const on = wireSignal(world, w.from)
        return <WireStroke key={`wire-${i}`} d={wirePathD(a, b)} color={on ? WATER : '#c43c3c'} />
      })}
    </g>
  )
}

function PendingWire({
  from,
  x,
  y,
  world,
}: {
  from: WireEnd
  x: number
  y: number
  world: World
}) {
  const a = wireEndXY(world, from)
  return <WireStroke d={wirePathD(a, { x, y })} color="#c43c3c" />
}

const PORTS: readonly PortId[] = ['out', 'in', 'in-l', 'in-r']

function portHigh(world: World, end: WireEnd, cell: Sensor | undefined): boolean {
  if (end.kind === 'sprinkler') {
    const s = world.sprinklerAt(end.at)
    return s !== undefined && s.inn === 1
  }
  if (end.kind === 'valve') {
    const h = world.smartHold.get(edgeKey(end.e))
    return h !== undefined && h.level === 1
  }
  if (end.port === 'out') {
    if (cell === undefined || cell.kind === 'lamp') return false
    return cell.out === 1
  }
  return world.wires.some(w => sameEnd(w.to, end) && wireSignal(world, w.from))
}

function PortChrome({ world }: { world: World }) {
  const marks: { key: string; x: number; y: number; out: boolean; high: boolean }[] = []
  world.forEachCell((at, c) => {
    if (!isSensor(c)) return
    PORTS.forEach(port => {
      if (!ownsPort(c, port)) return
      const end: WireEnd = { kind: 'cell', at, port }
      const p = portXY(end, c.kind)
      marks.push({ key: endKey(end), x: p.x, y: p.y, out: port === 'out', high: portHigh(world, end, c) })
    })
  })
  if (world.done.has('unlock-smart-irrigation')) {
    world.sprinklers.forEach(s => {
      const end: WireEnd = { kind: 'sprinkler', at: s.at, port: 'in' }
      const p = portXY(end, undefined)
      marks.push({ key: endKey(end), x: p.x, y: p.y, out: false, high: s.inn === 1 })
    })
  }
  world.smartHold.forEach(h => {
    const end: WireEnd = { kind: 'valve', e: h.e, port: 'in' }
    const p = portXY(end, undefined)
    marks.push({ key: endKey(end), x: p.x, y: p.y, out: false, high: h.level === 1 })
  })
  return (
    <g pointerEvents="none">
      {marks.map(m =>
        m.out ? (
          <circle
            key={m.key}
            cx={m.x * TILE}
            cy={m.y * TILE}
            r={2.5}
            fill={m.high ? WATER : '#c43c3c'}
            stroke={INK}
            strokeWidth={1}
          />
        ) : (
          <rect
            key={m.key}
            x={m.x * TILE - 2.5}
            y={m.y * TILE - 2.5}
            width={5}
            height={5}
            fill={m.high ? WATER : '#c43c3c'}
            stroke={INK}
            strokeWidth={1}
          />
        ),
      )}
    </g>
  )
}

function makeSprinkler(place: Extract<Place, { kind: 'sku' }>, at: Vertex): Sprinkler {
  const tune = { kind: 'flat' } as const
  if (place.id === 'buy-sprinkler-large') return { variant: 'large', at, tune, inn: 0, hold: 0 }
  if (place.id === 'buy-sprinkler-vert') return { variant: 'vert', at, facing: place.facing, tune, inn: 0, hold: 0 }
  return { variant: 'basic', at, tune, inn: 0, hold: 0 }
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

function smartHit(world: World, wx: number, wy: number): Edge | undefined {
  let best: { edge: Edge; d: number } | undefined = undefined
  world.segments.forEach(seg => {
    if (seg.gate.kind !== 'smart') return
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

function deleteHit(
  world: World,
  edge: Edge | undefined,
  v: Vertex | undefined,
  wx: number,
  wy: number,
): DeleteTarget | undefined {
  const wire = nearestWire(world.wires, wx, wy, end => wireEndXY(world, end), VERTEX_HIT)
  if (wire !== undefined) return { kind: 'wire', from: wire.from, to: wire.to }
  if (edge !== undefined) {
    if (world.hasWell(edge)) return { kind: 'well', edge }
    if (world.hasSmart(edge)) return { kind: 'smart', edge }
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
  if (placeId === 'buy-well' || placeId === 'buy-smart-valve') {
    return (
      edge !== undefined &&
      world.edgeOwned(edge) &&
      !world.hasPipe(edge) &&
      !world.hasWell(edge) &&
      !world.hasSmart(edge)
    )
  }
  if (s === undefined) return false
  return sprinklerOk(world, s)
}

function clickHit(world: World, wx: number, wy: number, lens: Lens): MapClick | undefined {
  const place = world.seats[world.local].place
  if (place.kind === 'sku' && (place.id === 'buy-pipe' || place.id === 'buy-valve' || place.id === 'buy-well' || place.id === 'buy-smart-valve')) {
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
    const del = deleteHit(world, edge, at, wx, wy)
    if (del?.kind === 'wire') return { kind: 'delete-wire', from: del.from, to: del.to }
    if (del?.kind === 'pipe') return { kind: 'delete-pipe', edge: del.edge }
    if (del?.kind === 'well') return { kind: 'delete-well', edge: del.edge }
    if (del?.kind === 'smart') return { kind: 'smart-valve', edge: del.edge }
    if (del?.kind === 'sprinkler') return { kind: 'delete-sprinkler', at: del.at }
    return { kind: 'cell', at: { col: Math.floor(wx), row: Math.floor(wy) } }
  }
  const skuArmed = place.kind === 'sku' && (SENSOR_CELL_SKUS as readonly string[]).includes(place.id)
  if ((lens === 'sensors' || place.kind === 'wire') && !skuArmed) {
    const port = portHit(world, wx, wy)
    if (port !== undefined) return { kind: 'port', end: port }
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
    const smart = smartHit(world, wx, wy)
    if (smart !== undefined) return { kind: 'smart-valve', edge: smart }
    const well = wellHit(world, wx, wy)
    if (well !== undefined) return { kind: 'well', edge: well }
    const cellAt = { col: Math.floor(wx), row: Math.floor(wy) }
    if (world.inWorld(cellAt)) {
      const c = world.cell(cellAt)
      if (c.kind === 'sensor-water' && lens !== 'sensors') return { kind: 'water-hud', at: cellAt }
      if (c.kind === 'sensor-harvest' && lens !== 'sensors') return { kind: 'harvest-hud', at: cellAt }
    }
  }
  return { kind: 'cell', at: { col: Math.floor(wx), row: Math.floor(wy) } }
}
