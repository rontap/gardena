import { useEffect, useRef, useState, type WheelEvent as ReactWheelEvent } from 'react'
import { m } from '../../paraglide/messages.js'
import { HANGAR_H, HANGAR_W, SILO_H, SILO_W } from '../defs/items.ts'
import { FADE, occupiedCells } from '../sim/building.ts'
import { onCell } from '../sim/drop.ts'
import { itemLine, skuLabel } from '../sim/item.ts'
import type { SkuId } from '../sim/ids.ts'
import { aoe, edgeKey, vertsOf, type Edge, type Vertex } from '../sim/pipe.ts'
import type { WireEnd } from '../sim/sensor.ts'
import type { PromptHit } from '../sim/prompt.ts'
import { furnaceCoveringCells } from '../sim/feature-machines/machine.ts'
import { dest, type Place, type World } from '../sim/world.ts'
import { Coin } from '../ui/frame.tsx'
import { TILE, clampCam, type Camera } from './camera.ts'
import {
  atlasHtml,
  atlasReady,
  pipeFit,
  type AtlasKey,
} from './atlas.ts'
import {
  SPRINKLER_SKU,
  clickHit,
  deleteHit,
  makeSprinkler,
  nearestEdge,
  nearestVertex,
  SPRINKLER_HIT,
  VERTEX_HIT,
  onEdgeBand,
  pipeOk,
  roundVertex,
  routeEdges,
  stayOk,
  arms,
  type Lens,
  type MapClick,
} from './hit.ts'
import { WorldView, type ViewHooks } from './world-view.ts'
import { footOutline } from './outline.ts'
import { STAT_COLOR } from '../ui/status.tsx'
import { FURNACE, HANGAR, PUMP, RAIN_TANK, SILO_PRODUCE, SILO_SEED, SILO_SPRAY, STILL, skuInner, symHref } from './svgs.ts'
import type { VfxMount } from './layers/vfx.ts'
import { VFX } from './vfx.ts'

export type { Lens, MapClick }

const QUEUE_MARK = 5

export const HAT: { readonly [K in 0 | 1 | 2 | 3]: string } = {
  0: '#d4a017',
  1: '#ff3d8e',
  2: '#2de8ff',
  3: '#b85cff',
}

type Props = {
  world: World
  cam: Camera
  lens: Lens
  editor: boolean
  hover: PromptHit | undefined
  onHover: (c: PromptHit | undefined) => void
  onCam: (c: Camera) => void
  onClick: (hit: MapClick, xy: { x: number; y: number }) => void
  onReady?: () => void
}

function Use({ art }: { art: string }) {
  return <use href={symHref(art)} />
}

function placeLine(id: SkuId): string {
  return m.prompt_place({ name: skuLabel(id) })
}

function worldAt(cam: Camera, box: { left: number; top: number; w: number; h: number }, clientX: number, clientY: number) {
  return {
    x: cam.x + (clientX - box.left - box.w / 2) / (TILE * cam.scale),
    y: cam.y + (clientY - box.top - box.h / 2) / (TILE * cam.scale),
  }
}

export function MapView({ world, cam, lens, editor, hover, onHover, onCam, onClick, onReady }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<WorldView | undefined>(undefined)
  const drag = useRef<{ x: number; y: number; cx: number; cy: number; pipe: boolean; wireFrom?: WireEnd } | undefined>(undefined)
  const boxRef = useRef({ left: 0, top: 0, w: 800, h: 600 })
  const pendingMove = useRef<{ x: number; y: number; buttons: number; shift: boolean } | undefined>(undefined)
  const camRef = useRef(cam)
  const lastHoverKey = useRef('')
  const [view, setView] = useState({ w: 800, h: 600 })
  const [ptr, setPtr] = useState({ x: 0, y: 0 })
  const [worldPtr, setWorldPtr] = useState<{ x: number; y: number } | undefined>(undefined)
  const [pendingPipe, setPendingPipe] = useState<Edge[]>([])
  const anchorRef = useRef<Vertex | undefined>(undefined)
  const pendingRef = useRef<Edge[]>([])
  const onReadyRef = useRef(onReady)
  camRef.current = cam
  pendingRef.current = pendingPipe
  onReadyRef.current = onReady
  const place = world.seats[world.local].place
  const placing = place.kind === 'sku' || place.kind === 'delete'
  const placeId = place.kind === 'sku' ? place.id : undefined
  const pumpjack =
    placeId === 'buy-pumpjack' ||
    placeId === 'buy-rain-tank' ||
    placeId === 'buy-still' ||
    placeId === 'buy-research-station'
  const furnacePlace = placeId === 'buy-furnace'
  const hangarPlace = placeId === 'buy-hangar'
  const siloPlace = placeId === 'buy-silo-seed' || placeId === 'buy-silo-spray' || placeId === 'buy-silo-produce'
  const edgeTool = placeId === 'buy-pipe' || placeId === 'buy-valve'
  const deleteTool = place.kind === 'delete'
  const sprinklerTool = placeId !== undefined && SPRINKLER_SKU.includes(placeId)
  const skuStroke = placing && !edgeTool && !deleteTool && !sprinklerTool
  const followSku =
    placeId !== undefined && !pumpjack && !furnacePlace && !hangarPlace && !siloPlace && !edgeTool && !sprinklerTool
  const edgeHit = worldPtr !== undefined ? nearestEdge(worldPtr.x, worldPtr.y) : undefined
  const vertexHit = worldPtr !== undefined ? nearestVertex(worldPtr.x, worldPtr.y, VERTEX_HIT) : undefined
  const snapVertex =
    worldPtr !== undefined ? nearestVertex(worldPtr.x, worldPtr.y, SPRINKLER_HIT) : undefined
  const strokeCell =
    worldPtr !== undefined ? { col: Math.floor(worldPtr.x), row: Math.floor(worldPtr.y) } : undefined
  const ghostEdges =
    placeId === 'buy-pipe' && pendingPipe.length > 0
      ? pendingPipe
      : edgeTool && edgeHit !== undefined
        ? [edgeHit]
        : []
  const ghostWet = ghostEdges.length > 0 && ghostEdges.some(e => world.pendingWet(e))
  const ghostSprinkler =
    sprinklerTool && place.kind === 'sku' && snapVertex !== undefined ? makeSprinkler(place, snapVertex) : undefined
  const deleteTarget =
    deleteTool && worldPtr !== undefined ? deleteHit(world, edgeHit, vertexHit, worldPtr.x, worldPtr.y) : undefined
  const hoverCell = hover !== undefined && hover.kind === 'cell' ? hover.at : undefined
  const prompt = hoverCell !== undefined ? world.prompt(hoverCell) : world.promptHit(hover)
  const hitOk =
    edgeTool || sprinklerTool
      ? stayOk(world, placeId, edgeHit, ghostSprinkler, deleteTarget)
      : prompt?.kind === 'place'
  const canPlace = placing && hitOk
  const tipDrop = hoverCell !== undefined ? onCell(world.drops, hoverCell).at(-1) : undefined
  const tip =
    tipDrop !== undefined &&
    (tipDrop.item.kind === 'shovel' || tipDrop.item.kind === 'pickaxe' || tipDrop.item.kind === 'container')
      ? itemLine(tipDrop.item, world.modifiers)
      : undefined
  const hoverFoot = strokeFoot(world, strokeCell, place, pumpjack, furnacePlace, hangarPlace, siloPlace)
  const hoverOutline = footOutline(hoverFoot)
  const coverOutline = footOutline(coverFoot(world, strokeCell, place))
  const neighbourWatch =
    strokeCell !== undefined && place.kind === 'none' && world.inWorld(strokeCell)
      ? world.neighbourWatch(strokeCell)
      : undefined
  const neighbourOutline =
    neighbourWatch === undefined ? undefined : footOutline(neighbourWatch.reach.filter(c => world.inWorld(c)))

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
    const el = hostRef.current
    if (el === null) return
    let dead = false
    let mounted: WorldView | undefined
    void WorldView.mount(el, world, camRef.current, lens, editor, onCam).then(v => {
      if (dead) {
        v.destroy()
        return
      }
      mounted = v
      viewRef.current = v
      const loc = document.createElement('div')
      loc.className = 'pointer-events-none absolute inset-0 origin-top-left'
      el.appendChild(loc)
      const pipeHost = document.createElement('div')
      const vfxHost = document.createElement('div')
      const speechHost = document.createElement('div')
      loc.append(pipeHost, vfxHost, speechHost)
      v.htmlLayer = loc
      v.onVfx = m => paintVfxLocators(vfxHost, m)
      v.onSpeech = () => paintSpeech(speechHost, world)
      v.onPipeLoc = () => paintPipeLocators(pipeHost, world)
      v.onPipeLoc()
      v.layout()
      const ready = onReadyRef.current
      if (ready !== undefined) ready()
      const hook: ViewHooks = {
        get cam() {
          return v.cam
        },
        get pendingPipe() {
          return pendingRef.current
        },
        hit: (wx, wy) => v.hit(wx, wy),
        get vfxN() {
          return v.vfxN
        },
      }
      ;(window as unknown as { __view?: ViewHooks }).__view = hook
    })
    return () => {
      dead = true
      viewRef.current = undefined
      mounted?.htmlLayer?.remove()
      mounted?.destroy()
      delete (window as unknown as { __view?: ViewHooks }).__view
    }
  }, [world])

  useEffect(() => {
    viewRef.current?.setCam(cam)
    viewRef.current?.layout()
  }, [cam])

  useEffect(() => {
    viewRef.current?.setLens(lens, editor)
  }, [lens, editor, world])

  useEffect(() => {
    if (place.kind !== 'sku' || place.id !== 'buy-pipe') {
      anchorRef.current = undefined
      if (pendingPipe.length > 0) {
        pendingRef.current = []
        setPendingPipe([])
        viewRef.current?.setPending([])
      }
    }
  }, [place.kind, place.kind === 'sku' ? place.id : '', pendingPipe.length])

  useEffect(() => {
    const el = hostRef.current
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
      const anchor = anchorRef.current
      const pipeDrag = d !== undefined && d.pipe && (p.buttons & 1) === 1
      if (anchor !== undefined && (pipeDrag || d === undefined)) {
        const next: Edge[] = routeEdges(anchor, roundVertex(w.x, w.y), p.shift).filter(e => pipeOk(world, 'buy-pipe', e))
        if (next.length !== pendingRef.current.length || next.some((e, i) => edgeKey(e) !== edgeKey(pendingRef.current[i]))) {
          pendingRef.current = next
          setPendingPipe(next)
          viewRef.current?.setPending(next)
        }
        return
      }
      if (pipeDrag) return
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
        viewRef.current?.setHover(w.x, w.y, place)
      }
    }
    id = requestAnimationFrame(flush)
    return () => cancelAnimationFrame(id)
  }, [world, onHover, lens, place])

  function onWheel(e: ReactWheelEvent<HTMLDivElement>): void {
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
        : deleteTarget?.kind === 'sprinkler'
          ? { kind: 'delete-sprinkler', at: deleteTarget.at }
          : deleteTarget?.kind === 'wire'
            ? { kind: 'delete-wire', from: deleteTarget.from, to: deleteTarget.to }
            : undefined
  const runCost = pendingPipe.length * world.skuPrice('buy-pipe')
  const followText =
    pendingPipe.length > 0
      ? world.money < runCost
        ? m.prompt_cannot_afford()
        : m.prompt_pipe_run({ n: pendingPipe.length, cost: runCost })
      : edgeTool || sprinklerTool || deleteTool
        ? world.promptHit(stayHit).text
        : placeId !== undefined
          ? placeLine(placeId)
          : undefined
  const worldT = `translate(${view.w / 2}px, ${view.h / 2}px) scale(${cam.scale}) translate(${-cam.x * TILE}px, ${-cam.y * TILE}px)`
  const faces = world.faces()
  const sprinklers = [...world.sprinklers.values()]
  const queued = [
    ...new Map(
      world.seats[world.local].queue
        .map(i => dest(i, world))
        .map(at => [`${at.col},${at.row}`, at] as const),
    ).entries(),
  ]

  return (
    <div
      ref={hostRef}
      className={`absolute inset-0 overflow-hidden bg-grass ${canPlace ? 'cursor-pointer' : 'cursor-crosshair'}`}
      onWheel={onWheel}
      onContextMenu={e => {
        e.preventDefault()
        const wpt = worldAt(cam, boxRef.current, e.clientX, e.clientY)
        anchorRef.current = undefined
        pendingRef.current = []
        setPendingPipe([])
        viewRef.current?.setPending([])
        world.rightClick({ col: Math.floor(wpt.x), row: Math.floor(wpt.y) })
      }}
      onPointerDown={e => {
        if (e.button === 2) return
        const wpt = worldAt(cam, boxRef.current, e.clientX, e.clientY)
        const pipe = place.kind === 'sku' && place.id === 'buy-pipe' && onEdgeBand(wpt.x, wpt.y)
        const down = pipe ? undefined : clickHit(world, wpt.x, wpt.y, lens)
        const wireFrom = down !== undefined && down.kind === 'port' && place.kind === 'none' ? down.end : undefined
        drag.current = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, pipe, wireFrom }
        e.currentTarget.setPointerCapture(e.pointerId)
        if (pipe && anchorRef.current === undefined) anchorRef.current = roundVertex(wpt.x, wpt.y)
      }}
      onPointerMove={e => {
        pendingMove.current = { x: e.clientX, y: e.clientY, buttons: e.buttons, shift: e.shiftKey }
      }}
      onPointerUp={e => {
        const d = drag.current
        drag.current = undefined
        if (d === undefined) return
        if (e.button === 2) return
        const wpt = worldAt(cam, boxRef.current, e.clientX, e.clientY)
        if (d.pipe) {
          const run = pendingRef.current
          if (run.length > 0) {
            if (world.money >= run.length * world.skuPrice('buy-pipe')) run.forEach(ed => world.placePipe(ed))
            anchorRef.current = undefined
            pendingRef.current = []
            setPendingPipe([])
            viewRef.current?.setPending([])
            return
          }
          const one = nearestEdge(wpt.x, wpt.y)
          if (one === undefined || !pipeOk(world, 'buy-pipe', one)) return
          world.placePipe(one)
          const [va, vb] = vertsOf(one)
          const far = Math.hypot(va.col - wpt.x, va.row - wpt.y) > Math.hypot(vb.col - wpt.x, vb.row - wpt.y) ? va : vb
          anchorRef.current = far
          return
        }
        if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 3) {
          if (d.wireFrom === undefined) return
          const drop = clickHit(world, wpt.x, wpt.y, lens)
          if (drop?.kind !== 'port') return
          onClick({ kind: 'port', end: d.wireFrom }, { x: wpt.x, y: wpt.y })
          onClick(drop, { x: wpt.x, y: wpt.y })
          return
        }
        const hit = clickHit(world, wpt.x, wpt.y, lens)
        if (hit !== undefined) onClick(hit, { x: wpt.x, y: wpt.y })
      }}
      onPointerLeave={() => {
        pendingMove.current = undefined
        lastHoverKey.current = ''
        onHover(undefined)
        setWorldPtr(undefined)
      }}
    >
      <GhostDefs />
      <div className="pointer-events-none absolute inset-0 origin-top-left" style={{ transform: worldT }}>
        {strokeCell !== undefined && hoverOutline !== undefined && (
          <svg
            className="absolute overflow-visible"
            width={hoverOutline.w}
            height={hoverOutline.h}
            style={{ left: hoverOutline.x, top: hoverOutline.y }}
          >
            <path
              data-cell-stroke=""
              d={hoverOutline.d}
              fill="none"
              className={skuStroke && world.prompt(strokeCell).kind !== 'place' ? 'stroke-roof' : 'stroke-ink'}
              strokeWidth={2}
              strokeLinejoin="miter"
              shapeRendering="crispEdges"
            />
          </svg>
        )}
        {coverOutline !== undefined && (
          <svg
            className="pointer-events-none absolute overflow-visible"
            width={coverOutline.w}
            height={coverOutline.h}
            style={{ left: coverOutline.x, top: coverOutline.y }}
          >
            <path
              data-furnace-cover=""
              d={coverOutline.d}
              fill="none"
              className="pointer-events-none fill-none stroke-ink"
              strokeWidth={2}
              strokeLinejoin="miter"
              shapeRendering="crispEdges"
            />
          </svg>
        )}
        {neighbourOutline !== undefined && neighbourWatch !== undefined && (
          <svg
            className="pointer-events-none absolute overflow-visible"
            width={neighbourOutline.w}
            height={neighbourOutline.h}
            style={{ left: neighbourOutline.x, top: neighbourOutline.y }}
          >
            <path
              data-neighbour-reach=""
              d={neighbourOutline.d}
              fill="none"
              stroke={neighbourWatch.ok ? STAT_COLOR.green : STAT_COLOR.red}
              strokeWidth={2}
              strokeLinejoin="miter"
              shapeRendering="crispEdges"
            />
          </svg>
        )}
        {ghostEdges.flatMap(e =>
          vertsOf(e).map(v => {
            const a = arms(world, v, ghostEdges)
            const fit = pipeFit(a.n, a.e, a.s, a.w)
            if (fit === undefined) return undefined
            return (
              <svg
                key={`ghost-${v.col},${v.row}-${edgeKey(e)}`}
                data-pipe-ghost
                className="absolute overflow-visible"
                width={TILE}
                height={TILE}
                viewBox="0 0 24 24"
                style={{
                  left: v.col * TILE,
                  top: v.row * TILE,
                  transform: `rotate(${fit.rot}deg) translate(-50%, -50%)`,
                  transformOrigin: '0 0',
                }}
              >
                <use href={`#${ghostWet ? fit.key : `${fit.key}-dry`}`} />
              </svg>
            )
          }),
        )}
        {ghostSprinkler !== undefined &&
          aoe(ghostSprinkler).map(at => (
            <div
              key={`aoe-${at.col},${at.row}`}
              className="absolute bg-water"
              style={{ left: at.col * TILE, top: at.row * TILE, width: TILE, height: TILE, opacity: 0.35 }}
            />
          ))}
        {ghostSprinkler !== undefined && (
          <svg
            data-sprinkler={undefined}
            className="absolute overflow-visible"
            width={TILE}
            height={TILE}
            viewBox="0 0 24 24"
            style={{
              left: ghostSprinkler.at.col * TILE,
              top: ghostSprinkler.at.row * TILE,
              opacity: 0.7,
              transform: `rotate(${ghostSprinkler.variant === 'vert' && ghostSprinkler.facing === 'ns' ? 90 : 0}deg) translate(-50%, -50%)`,
              transformOrigin: '0 0',
            }}
          >
            <use
              href={`#${ghostSprinkler.variant === 'basic' ? 'sprinkler' : ghostSprinkler.variant === 'large' ? 'sprinkler-large' : 'sprinkler-vert'}`}
            />
          </svg>
        )}
        {placeId === 'buy-valve' && edgeHit !== undefined && (
          <svg
            data-valve-ghost
            className="absolute overflow-visible"
            width={TILE}
            height={TILE}
            viewBox="0 0 24 24"
            style={{ ...edgeStyle(edgeHit), opacity: 0.7 }}
          >
            <use href="#valve-open" />
          </svg>
        )}
        {sprinklers.map(s => (
          <div
            key={`sp-${s.at.col},${s.at.row}`}
            data-sprinkler=""
            className="absolute"
            style={{ left: s.at.col * TILE - 2, top: s.at.row * TILE - 2, width: 4, height: 4 }}
          />
        ))}
        {(hangarPlace || siloPlace) && placeId !== undefined && strokeCell !== undefined && (
          <svg
            className="absolute overflow-visible"
            width={(hangarPlace ? HANGAR_W : SILO_W) * TILE}
            height={(hangarPlace ? HANGAR_H : SILO_H) * TILE}
            viewBox={hangarPlace ? '0 0 72 48' : '0 0 48 72'}
            style={{ left: strokeCell.col * TILE, top: strokeCell.row * TILE }}
          >
            <Use
              art={
                placeId === 'buy-hangar'
                  ? HANGAR
                  : placeId === 'buy-silo-seed'
                    ? SILO_SEED
                    : placeId === 'buy-silo-spray'
                      ? SILO_SPRAY
                      : SILO_PRODUCE
              }
            />
          </svg>
        )}
        {pumpjack && placeId !== undefined && strokeCell !== undefined && (
          <svg
            className="absolute overflow-visible"
            width={2 * TILE}
            height={TILE}
            viewBox="0 0 48 24"
            style={{ left: strokeCell.col * TILE, top: strokeCell.row * TILE }}
          >
            <Use art={placeId === 'buy-pumpjack' ? PUMP : placeId === 'buy-rain-tank' ? RAIN_TANK : STILL} />
          </svg>
        )}
        {furnacePlace && strokeCell !== undefined && (
          <svg
            className="absolute overflow-visible"
            width={TILE}
            height={2 * TILE}
            viewBox="0 0 24 48"
            style={{ left: strokeCell.col * TILE, top: strokeCell.row * TILE }}
          >
            <Use art={FURNACE} />
          </svg>
        )}
        {queued.map(([k, at]) => (
          <div
            key={`queued-${k}`}
            data-queued={k}
            className="absolute bg-house/85"
            style={{
              left: at.col * TILE + TILE / 2 - QUEUE_MARK,
              top: at.row * TILE + 3,
              width: QUEUE_MARK * 2,
              height: QUEUE_MARK * 1.6,
              clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
            }}
          />
        ))}
        {faces.map(face => {
          const s = TILE * 0.85
          const o = (TILE - s) / 2
          const noPermit = world.expandLeft() <= 0
          const poor = world.money < face.price
          return (
            <button
              key={`${face.id.cx},${face.id.cy}`}
              type="button"
              className={`absolute flex items-center justify-center gap-0.5 leading-none ${
                noPermit ? 'bg-ink/40 text-house/50' : poor ? 'cursor-pointer bg-ink/55 text-house/50 hover:bg-ink/75' : 'group cursor-pointer bg-ink/55 text-house hover:bg-ink/75'
              }`}
              style={{ left: face.at.col * TILE + o, top: face.at.row * TILE + o, width: s, height: s, pointerEvents: noPermit ? 'none' : 'auto' }}
              onPointerDown={e => e.stopPropagation()}
              onPointerUp={e => {
                e.stopPropagation()
                if (noPermit || poor) return
                world.expand(face.id)
              }}
            >
              {noPermit ? (
                <span className="text-base">No permit left</span>
              ) : (
                <>
                  <span className="text-lg">Expand</span>
                  <Coin n={face.price} />
                </>
              )}
            </button>
          )
        })}
      </div>
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
              <Use art={placeId === 'buy-silo-seed' ? SILO_SEED : placeId === 'buy-silo-spray' ? SILO_SPRAY : SILO_PRODUCE} />
            </svg>
          )}
          <div className="mt-1 bg-house px-2 py-0.5 text-base text-ink">{placeLine(placeId)}</div>
        </div>
      )}
      {pumpjack && placeId !== undefined && hoverCell === undefined && (
        <div className="pointer-events-none fixed z-30" style={{ left: ptr.x + 16, top: ptr.y + 16 }}>
          <svg className="h-8 w-16" viewBox="0 0 48 24">
            <Use art={placeId === 'buy-pumpjack' ? PUMP : placeId === 'buy-rain-tank' ? RAIN_TANK : STILL} />
          </svg>
          <div className="mt-1 bg-house px-2 py-0.5 text-base text-ink">{placeLine(placeId)}</div>
        </div>
      )}
      {furnacePlace && placeId !== undefined && hoverCell === undefined && (
        <div className="pointer-events-none fixed z-30" style={{ left: ptr.x + 16, top: ptr.y + 16 }}>
          <svg className="h-16 w-8" viewBox="0 0 24 48">
            <Use art={FURNACE} />
          </svg>
          <div className="mt-1 bg-house px-2 py-0.5 text-base text-ink">{placeLine(placeId)}</div>
        </div>
      )}
    </div>
  )
}

function edgeStyle(e: Edge): { left: number; top: number; transform: string; transformOrigin: string } {
  const x = e.axis === 'h' ? (e.col + 0.5) * TILE : e.col * TILE
  const y = e.axis === 'h' ? e.row * TILE : (e.row + 0.5) * TILE
  const rot = e.axis === 'h' ? 0 : 90
  return { left: x, top: y, transform: `rotate(${rot}deg) translate(-50%, -50%)`, transformOrigin: '0 0' }
}

function paintPipeLocators(host: HTMLElement, world: World): void {
  host.replaceChildren()
  world.eachNetVert(v => {
    const a = arms(world, v, [])
    if (!a.n && !a.e && !a.s && !a.w) return
    const el = document.createElement('div')
    el.setAttribute('data-pipe', '')
    el.setAttribute('data-wet', world.vertexWet(v) ? '1' : '0')
    el.className = 'absolute'
    el.style.left = `${v.col * TILE - 2}px`
    el.style.top = `${v.row * TILE - 2}px`
    el.style.width = '4px'
    el.style.height = '4px'
    host.appendChild(el)
  })
}

function paintVfxLocators(host: HTMLElement, mounts: VfxMount[]): void {
  host.replaceChildren()
  for (const m of mounts) {
    const def = VFX[m.id]
    const w = (def.span * TILE) / 24
    const h = (def.tall * TILE) / 24
    const el = document.createElement('div')
    el.setAttribute('data-vfx', m.id)
    if (m.burst) el.className = 'vfx-burst'
    el.style.position = 'absolute'
    el.style.left = `${m.col * TILE + (def.anchor === 'vertex' ? -w / 2 : 0)}px`
    el.style.top = `${m.row * TILE + (def.anchor === 'vertex' ? -h / 2 : 0)}px`
    el.style.width = `${w}px`
    el.style.height = `${h}px`
    el.style.transform = `rotate(${m.rot}deg)`
    el.style.pointerEvents = 'none'
    host.appendChild(el)
  }
}

function paintSpeech(host: HTMLElement, world: World): void {
  if (world.speech.kind === 'none') {
    if (host.childElementCount === 0) return
    host.replaceChildren()
    return
  }
  const speaker = world.seats[world.local]
  const x = speaker.actor.x * TILE
  const y = (speaker.actor.y - 0.5) * TILE - 24
  let root = host.firstElementChild as HTMLElement | null
  if (root === null) {
    root = document.createElement('div')
    root.setAttribute('data-speech', '')
    root.className = 'absolute flex justify-center'
    root.style.width = '200px'
    const text = document.createElement('div')
    text.setAttribute('data-speech-text', '')
    text.className = 'bg-house px-2 py-0.5 text-base text-ink'
    root.appendChild(text)
    host.appendChild(root)
  }
  const left = `${x - 100}px`
  const top = `${y}px`
  if (root.style.left !== left) root.style.left = left
  if (root.style.top !== top) root.style.top = top
  const text = root.querySelector('[data-speech-text]')
  if (text !== null && text.textContent !== world.speech.text) text.textContent = world.speech.text
}

function coverFoot(
  world: World,
  stroke: { col: number; row: number } | undefined,
  place: Place,
): { col: number; row: number }[] {
  if (stroke === undefined) return []
  if (place.kind === 'sku' && place.id === 'buy-furnace') {
    return furnaceCoveringCells({ shape: 'rect', col: stroke.col, row: stroke.row, w: 1, h: 2 }).filter(c =>
      world.inWorld(c),
    )
  }
  if (place.kind !== 'none') return []
  if (!world.inWorld(stroke)) return []
  const cell = world.cell(stroke)
  if (cell.kind !== 'furnace') return []
  return furnaceCoveringCells(cell.base).filter(c => world.inWorld(c))
}

function strokeFoot(
  world: World,
  stroke: { col: number; row: number } | undefined,
  place: Place,
  pumpjack: boolean,
  furnacePlace: boolean,
  hangarPlace: boolean,
  siloPlace: boolean,
): { col: number; row: number }[] {
  if (stroke === undefined) return []
  if (place.kind === 'none') {
    if (!world.inWorld(stroke)) return [stroke]
    const cell = world.cell(stroke)
    if ('base' in cell) return occupiedCells(cell.base, world.owned)
    return [stroke]
  }
  if (pumpjack) return [stroke, { col: stroke.col + 1, row: stroke.row }]
  if (furnacePlace) return [stroke, { col: stroke.col, row: stroke.row + 1 }]
  if (hangarPlace) {
    const cells: { col: number; row: number }[] = []
    for (let row = 0; row < HANGAR_H; row++) {
      for (let col = 0; col < HANGAR_W; col++) cells.push({ col: stroke.col + col, row: stroke.row + row })
    }
    return cells
  }
  if (siloPlace) {
    const cells: { col: number; row: number }[] = []
    for (let row = 0; row < SILO_H; row++) {
      for (let col = 0; col < SILO_W; col++) cells.push({ col: stroke.col + col, row: stroke.row + row })
    }
    return cells
  }
  return [stroke]
}

function GhostDefs() {
  const [on, setOn] = useState(false)
  useEffect(() => {
    void atlasReady().then(() => setOn(true))
  }, [])
  if (!on) return null
  const keys: AtlasKey[] = [
    'pipe-stub',
    'pipe-stub-dry',
    'pipe-i',
    'pipe-i-dry',
    'pipe-l',
    'pipe-l-dry',
    'pipe-t',
    'pipe-t-dry',
    'pipe-x',
    'pipe-x-dry',
    'valve-open',
    'valve-jack',
    'sprinkler',
    'sprinkler-vert',
    'sprinkler-large',
  ]
  return (
    <svg aria-hidden className="absolute h-0 w-0 overflow-hidden">
      <defs>
        {keys.map(k => (
          <g key={k} id={k} dangerouslySetInnerHTML={{ __html: atlasHtml(k) }} />
        ))}
      </defs>
    </svg>
  )
}

