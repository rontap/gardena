import { useEffect, useRef, useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { World } from './game/sim/world.ts'
import { Almanac } from './game/ui/almanac.tsx'
import { ChestUi } from './game/ui/chest.tsx'
import { Hud } from './game/ui/hud.tsx'
import { Status } from './game/ui/status.tsx'
import { Inventory } from './game/ui/inventory.tsx'
import { ObjectHud } from './game/ui/objecthud.tsx'
import { Market } from './game/ui/market.tsx'
import { Queue } from './game/ui/queue.tsx'
import { Recap } from './game/ui/recap.tsx'
import { Research } from './game/ui/research.tsx'
import { Shop } from './game/ui/shop.tsx'
import type { Coord } from './game/sim/building.ts'
import type { PromptHit } from './game/sim/prompt.ts'
import type { Camera } from './game/view/camera.ts'
import { MapView, type Lens, type MapClick } from './game/view/map.tsx'
import { paintMotion } from './game/view/motion.ts'
import { DT_MAX } from './game/sim/world.ts'

type Panel =
  | { kind: 'none' }
  | { kind: 'shop' }
  | { kind: 'research' }
  | { kind: 'market' }
  | { kind: 'inventory' }
  | { kind: 'almanac' }
  | { kind: 'chest'; at: Coord }

const SPEED = (() => {
  const raw = new URLSearchParams(window.location.search).get('speed')
  const n = raw === null ? NaN : Number(raw)
  return Number.isFinite(n) && n >= 1 ? Math.min(20, n) : 1
})()

export default function App() {
  const world = useRef(new World()).current
  const root = useRef<HTMLDivElement>(null)
  const revRef = useRef(0)
  const consignRevision = useRef(0)
  const [n, setN] = useState(0)
  revRef.current = n
  const [panel, setPanel] = useState<Panel>({ kind: 'none' })
  const [cam, setCam] = useState<Camera>({ x: 15.5, y: 9.5, scale: 1 })
  const [hover, setHover] = useState<PromptHit | undefined>(undefined)
  const [lens, setLens] = useState<Lens>('off')

  useEffect(() => {
    ;(window as unknown as { __world?: World }).__world = world
    return () => {
      delete (window as unknown as { __world?: World }).__world
    }
  }, [world])

  useEffect(() => world.on(() => setN(x => x + 1)), [world])

  useEffect(() => {
    if (world.cue.kind !== 'inventory') return
    setPanel({ kind: 'inventory' })
    world.ackCue()
  }, [n, world])

  useEffect(() => {
    if (world.consignRevision === consignRevision.current) return
    consignRevision.current = world.consignRevision
    if (world.seam.kind !== 'recap') setPanel({ kind: 'market' })
  }, [n, world])

  useEffect(() => {
    const cue = world.cue
    if (cue.kind !== 'chest') return
    setPanel(p =>
      p.kind === 'chest' && p.at.col === cue.at.col && p.at.row === cue.at.row ? p : { kind: 'chest', at: cue.at },
    )
  }, [n, world])

  useEffect(() => {
    let last = performance.now()
    let id = 0
    const loop = (now: number) => {
      let left = ((now - last) / 1000) * SPEED
      last = now
      while (left > 1e-6) {
        const step = Math.min(left, DT_MAX)
        world.tick(step)
        left -= step
      }
      if (root.current !== null) paintMotion(root.current, world, revRef.current)
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [world])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      world.cancelPlace()
      world.closeHud()
      setLens(l => (l === 'pipes' ? 'off' : l))
      if (world.seam.kind === 'recap') world.dismissRecap()
      setPanel(p => {
        if (p.kind === 'chest') world.ackCue()
        return { kind: 'none' }
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [world])

  function open(next: Panel): void {
    if (world.seam.kind === 'recap') return
    if (panel.kind === 'shop' && next.kind === 'shop') {
      world.cancelPlace()
      setLens(l => (l === 'pipes' ? 'off' : l))
    }
    setPanel(p => {
      if (p.kind === 'shop') world.cancelPlace()
      if (p.kind === 'chest') world.ackCue()
      return p.kind === next.kind ? { kind: 'none' } : next
    })
  }

  return (
    <Tooltip.Provider delayDuration={200}>
      <div ref={root} className="relative h-full min-h-0 overflow-hidden">
        <MapView
            world={world}
            cam={cam}
            rev={n}
            lens={lens}
            hover={hover}
            onHover={setHover}
            onCam={setCam}
            onClick={hit => {
              if (world.seam.kind === 'recap') return
              if (hit.kind !== 'sprinkler-hud') world.closeHud()
              if (panel.kind === 'inventory' || panel.kind === 'chest') {
                if (panel.kind === 'chest') world.ackCue()
                setPanel({ kind: 'none' })
                return
              }
              dispatchClick(world, hit)
            }}
          />
          <Hud
            world={world}
            panel={panel.kind}
            lens={lens}
            onShop={() => open({ kind: 'shop' })}
            onResearch={() => open({ kind: 'research' })}
            onMarket={() => open({ kind: 'market' })}
            onAlmanac={() => open({ kind: 'almanac' })}
            onLens={setLens}
          />
          <div className="pointer-events-none absolute right-4 bottom-4 z-20 flex w-80 flex-col gap-3">
            <Queue world={world} />
            <Status world={world} hover={hover} />
          </div>
          {panel.kind === 'shop' && (
            <Shop
              world={world}
              onClose={() => {
                world.cancelPlace()
                setLens(l => (l === 'pipes' ? 'off' : l))
                setPanel({ kind: 'none' })
              }}
            />
          )}
          {panel.kind === 'research' && <Research world={world} onClose={() => setPanel({ kind: 'none' })} />}
          {panel.kind === 'market' && <Market world={world} onClose={() => setPanel({ kind: 'none' })} />}
          {panel.kind === 'inventory' && <Inventory world={world} onClose={() => setPanel({ kind: 'none' })} />}
          {panel.kind === 'almanac' && <Almanac onClose={() => setPanel({ kind: 'none' })} />}
          {panel.kind === 'chest' && (
            <ChestUi
              world={world}
              at={panel.at}
              onClose={() => {
                world.ackCue()
                setPanel({ kind: 'none' })
              }}
            />
          )}
          <ObjectHud world={world} cam={cam} onClose={() => world.closeHud()} />
          {world.seam.kind === 'recap' && (
            <Recap recap={world.seam.recap} nextDay={world.clock.day} onDismiss={() => world.dismissRecap()} />
          )}
          <div
            data-banner
            hidden
            className="pointer-events-none absolute inset-0 flex items-start justify-center pt-8 text-3xl text-ink"
          />
      </div>
    </Tooltip.Provider>
  )
}

function dispatchClick(world: World, hit: MapClick): void {
  if (hit.kind === 'edge') {
    world.placePipe(hit.edge)
    return
  }
  if (hit.kind === 'sprinkler') {
    world.placeSprinkler(hit.sprinkler)
    return
  }
  if (hit.kind === 'delete-pipe') {
    world.deletePipe(hit.edge)
    return
  }
  if (hit.kind === 'delete-sprinkler') {
    world.deleteSprinkler(hit.at)
    return
  }
  if (hit.kind === 'valve') {
    world.clickValve(hit.edge)
    return
  }
  if (hit.kind === 'sprinkler-hud') {
    world.openHud({ kind: 'sprinkler', at: hit.at })
    return
  }
  world.click(hit.at)
}
