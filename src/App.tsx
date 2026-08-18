import { useEffect, useRef, useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { World } from './game/sim/world.ts'
import { Hud } from './game/ui/hud.tsx'
import { Inventory } from './game/ui/inventory.tsx'
import { Market } from './game/ui/market.tsx'
import { Queue } from './game/ui/queue.tsx'
import { Recap } from './game/ui/recap.tsx'
import { Research } from './game/ui/research.tsx'
import { Shop } from './game/ui/shop.tsx'
import type { Camera } from './game/view/camera.ts'
import { MapView } from './game/view/map.tsx'

type Panel =
  | { kind: 'none' }
  | { kind: 'shop' }
  | { kind: 'research' }
  | { kind: 'market' }
  | { kind: 'inventory' }

export default function App() {
  const world = useRef(new World()).current
  const [n, setN] = useState(0)
  const [panel, setPanel] = useState<Panel>({ kind: 'none' })
  const [cam, setCam] = useState<Camera>({ x: 15.5, y: 3.5, scale: 1 })

  useEffect(() => world.on(() => setN(x => x + 1)), [world])

  useEffect(() => {
    let last = performance.now()
    let id = 0
    const loop = (now: number) => {
      world.tick((now - last) / 1000)
      last = now
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
      <div className="flex h-full flex-col">
        <Hud
          world={world}
          onShop={() => open({ kind: 'shop' })}
          onResearch={() => open({ kind: 'research' })}
          onMarket={() => open({ kind: 'market' })}
          onHeld={() => open({ kind: 'inventory' })}
        />
        <div className="relative min-h-0 flex-1">
          <MapView
            world={world}
            cam={cam}
            rev={n}
            onCam={setCam}
            onClickCell={at => {
              if (world.seam.kind === 'recap') return
              if (world.place.kind === 'sku') {
                world.click(at)
                return
              }
              if (panel.kind !== 'none') {
                if (panel.kind === 'shop') world.cancelPlace()
                setPanel({ kind: 'none' })
                return
              }
              const r = world.click(at)
              if (r === 'inventory') setPanel({ kind: 'inventory' })
            }}
          />
          <Queue world={world} />
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
          {world.clock.banner > 0 && world.seam.kind === 'play' && (
            <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-8 text-3xl text-ink">
              Day {world.clock.day}
            </div>
          )}
        </div>
      </div>
    </Tooltip.Provider>
  )
}
