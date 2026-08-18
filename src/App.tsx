import { useEffect, useRef, useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { World } from './game/sim/world.ts'
import { Hud } from './game/ui/hud.tsx'
import { Status } from './game/ui/status.tsx'
import { Inventory } from './game/ui/inventory.tsx'
import { Market } from './game/ui/market.tsx'
import { Queue } from './game/ui/queue.tsx'
import { Recap } from './game/ui/recap.tsx'
import { Research } from './game/ui/research.tsx'
import { Shop } from './game/ui/shop.tsx'
import type { Coord } from './game/sim/building.ts'
import type { Camera } from './game/view/camera.ts'
import { MapView } from './game/view/map.tsx'
import { paintMotion } from './game/view/motion.ts'

type Panel =
  | { kind: 'none' }
  | { kind: 'shop' }
  | { kind: 'research' }
  | { kind: 'market' }
  | { kind: 'inventory' }

export default function App() {
  const world = useRef(new World()).current
  const root = useRef<HTMLDivElement>(null)
  const [n, setN] = useState(0)
  const [panel, setPanel] = useState<Panel>({ kind: 'none' })
  const [cam, setCam] = useState<Camera>({ x: 15.5, y: 3.5, scale: 1 })
  const [hover, setHover] = useState<Coord | undefined>(undefined)

  useEffect(() => world.on(() => setN(x => x + 1)), [world])

  useEffect(() => {
    if (world.cue.kind !== 'inventory') return
    setPanel({ kind: 'inventory' })
    world.ackCue()
  }, [n, world])

  useEffect(() => {
    let last = performance.now()
    let id = 0
    const loop = (now: number) => {
      world.tick((now - last) / 1000)
      last = now
      if (root.current !== null) paintMotion(root.current, world)
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [world])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      world.cancelPlace()
      if (world.seam.kind === 'recap') world.dismissRecap()
      setPanel({ kind: 'none' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [world])

  function open(next: Panel): void {
    if (world.seam.kind === 'recap') return
    setPanel(p => {
      if (p.kind === 'shop') world.cancelPlace()
      return p.kind === next.kind ? { kind: 'none' } : next
    })
  }

  return (
    <Tooltip.Provider delayDuration={200}>
      <div ref={root} className="flex h-full min-h-0 flex-col overflow-hidden">
        <Hud
          world={world}
          onShop={() => open({ kind: 'shop' })}
          onResearch={() => open({ kind: 'research' })}
          onMarket={() => open({ kind: 'market' })}
        />
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <MapView
            world={world}
            cam={cam}
            rev={n}
            hover={hover}
            onHover={setHover}
            onCam={setCam}
            onClickCell={at => {
              if (world.seam.kind === 'recap') return
              if (panel.kind === 'inventory') {
                setPanel({ kind: 'none' })
                return
              }
              world.click(at)
            }}
          />
          <div className="pointer-events-none fixed bottom-4 left-4 z-20 flex w-80 flex-col gap-3">
            <Queue world={world} />
            <Status world={world} hover={hover} />
          </div>
          {panel.kind === 'shop' && (
            <Shop
              world={world}
              onClose={() => {
                world.cancelPlace()
                setPanel({ kind: 'none' })
              }}
            />
          )}
          {panel.kind === 'research' && <Research world={world} onClose={() => setPanel({ kind: 'none' })} />}
          {panel.kind === 'market' && <Market world={world} onClose={() => setPanel({ kind: 'none' })} />}
          {panel.kind === 'inventory' && <Inventory world={world} onClose={() => setPanel({ kind: 'none' })} />}
          {world.seam.kind === 'recap' && (
            <Recap recap={world.seam.recap} nextDay={world.clock.day} onDismiss={() => world.dismissRecap()} />
          )}
          <div
            data-banner
            hidden
            className="pointer-events-none absolute inset-0 flex items-start justify-center pt-8 text-3xl text-ink"
          />
        </div>
      </div>
    </Tooltip.Provider>
  )
}
