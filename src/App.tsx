import { useEffect, useRef, useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { DT_MAX, World } from './game/sim/world.ts'
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
import { Cheat } from './game/ui/cheat.tsx'
import { Shop } from './game/ui/shop.tsx'
import { Family } from './game/ui/family.tsx'
import { LensPanel } from './game/ui/lens.tsx'
import { Menu } from './game/ui/menu.tsx'
import { TutorialCard } from './game/ui/tutorial.tsx'
import type { Coord } from './game/sim/building.ts'
import type { PromptHit } from './game/sim/prompt.ts'
import type { Camera } from './game/view/camera.ts'
import { MapView, type Lens, type MapClick } from './game/view/map.tsx'
import { paintMotion } from './game/view/motion.ts'
import { type WorkerSink } from './game/sim/log.ts'
import { DOWNLOAD_NAME, dump, parse, readSlot, slotExists, writeSlot, type LoadFailReason } from './game/sim/save.ts'
import { check, startTutorial, type Tutorial } from './game/sim/tutorial.ts'

type Panel =
  | { kind: 'none' }
  | { kind: 'family' }
  | { kind: 'shop' }
  | { kind: 'research' }
  | { kind: 'market' }
  | { kind: 'inventory' }
  | { kind: 'almanac' }
  | { kind: 'cheat' }
  | { kind: 'lens' }
  | { kind: 'chest'; at: Coord }
  | { kind: 'menu' }

const SPEED = (() => {
  const raw = new URLSearchParams(window.location.search).get('speed')
  const n = raw === null ? NaN : Number(raw)
  return Number.isFinite(n) && n >= 1 ? Math.min(20, n) : 1
})()

const START_NOW = window.location.hash === '#start_now'
const BOOT_CAM: Camera = { x: 15.5, y: 9.5, scale: 1 }

function ignoreHover(_h: PromptHit | undefined): void {}
function ignoreCam(_c: Camera): void {}
function ignoreClick(_h: MapClick): void {}

export default function App({ sink }: { sink: WorkerSink }) {
  const root = useRef<HTMLDivElement>(null)
  const revRef = useRef(0)
  const consignRevision = useRef(0)
  const prevSeam = useRef<'play' | 'recap'>('play')
  const [n, setN] = useState(0)
  revRef.current = n
  const [backdrop] = useState(() => (START_NOW ? undefined : new World()))
  const [world, setWorld] = useState<World | undefined>(() =>
    START_NOW ? new World(undefined, sink) : undefined,
  )
  const [tutorial, setTutorial] = useState<Tutorial>(() =>
    START_NOW ? startTutorial('start_now', slotExists()) : { kind: 'off' },
  )
  const [fail, setFail] = useState<LoadFailReason | undefined>(undefined)
  const [panel, setPanel] = useState<Panel>({ kind: 'none' })
  const [cam, setCam] = useState<Camera>(BOOT_CAM)
  const [hover, setHover] = useState<PromptHit | undefined>(undefined)
  const [lens, setLens] = useState<Lens>('off')
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)
  pausedRef.current = paused

  useEffect(() => {
    if (world === undefined) return
    if (lens === 'water' && !world.hasSkill('water-study')) setLens('off')
    if (lens === 'land' && !world.hasSkill('land-study')) setLens('off')
  }, [n, lens, world])

  useEffect(() => {
    ;(window as unknown as { __world?: World }).__world = world
    return () => {
      delete (window as unknown as { __world?: World }).__world
    }
  }, [world])

  useEffect(() => {
    if (world === undefined) return
    return world.on(kind => {
      setTutorial(t => {
        if (t.kind !== 'on') return t
        return check(world, {
          kind: 'on',
          step: t.step,
          poured: t.poured || kind === 'poured',
          sold: t.sold || kind === 'sold',
        })
      })
      setN(x => x + 1)
    })
  }, [world])

  useEffect(() => {
    if (world === undefined) return
    if (world.cue.kind !== 'inventory') return
    setPanel({ kind: 'inventory' })
    world.ackCue()
  }, [n, world])

  useEffect(() => {
    if (world === undefined) return
    if (world.consignRevision === consignRevision.current) return
    consignRevision.current = world.consignRevision
    if (world.seam.kind !== 'recap') setPanel({ kind: 'market' })
  }, [n, world])

  useEffect(() => {
    if (world === undefined) return
    const cue = world.cue
    if (cue.kind !== 'chest') return
    setPanel(p =>
      p.kind === 'chest' && p.at.col === cue.at.col && p.at.row === cue.at.row ? p : { kind: 'chest', at: cue.at },
    )
  }, [n, world])

  useEffect(() => {
    if (world === undefined) return
    const kind = world.seam.kind
    if (kind === 'recap' && prevSeam.current === 'play') {
      writeSlot(dump(world))
      setPanel({ kind: 'none' })
    }
    prevSeam.current = kind
  }, [n, world])

  useEffect(() => {
    if (world === undefined) return
    let last = performance.now()
    let id = 0
    const loop = (now: number) => {
      let left = ((now - last) / 1000) * SPEED
      last = now
      if (!pausedRef.current) {
        while (left > 1e-6) {
          const step = Math.min(left, DT_MAX)
          world.tick(step)
          left -= step
        }
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
      if (world === undefined) return
      world.cancelPlace()
      world.closeHud()
      setLens(l => (l === 'pipes' ? 'off' : l))
      if (world.seam.kind === 'recap') {
        world.dismissRecap()
        return
      }
      setPanel(p => {
        if (p.kind === 'chest') world.ackCue()
        return { kind: 'none' }
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [world])

  function session(next: World, tut: Tutorial): void {
    prevSeam.current = next.seam.kind
    consignRevision.current = next.consignRevision
    setWorld(next)
    setTutorial(tut)
    setFail(undefined)
    setPanel({ kind: 'none' })
    setCam(BOOT_CAM)
    setHover(undefined)
    setLens('off')
  }

  function playNew(): void {
    session(new World(undefined, sink), startTutorial('new', slotExists()))
  }

  function playLoad(): void {
    const text = readSlot()
    if (text === undefined) return
    const r = parse(text, sink)
    if (!r.ok) {
      setFail(r.reason)
      return
    }
    session(r.world, startTutorial('load', true))
  }

  function playUpload(text: string): void {
    const r = parse(text, sink)
    if (!r.ok) {
      setFail(r.reason)
      return
    }
    writeSlot(dump(r.world))
    session(r.world, startTutorial('upload', true))
  }

  function saveGame(): void {
    if (world === undefined) return
    writeSlot(dump(world))
    setPanel({ kind: 'none' })
  }

  function downloadSave(): void {
    if (world === undefined) return
    const save = dump(world)
    writeSlot(save)
    const blob = new Blob([JSON.stringify(save)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = DOWNLOAD_NAME
    a.click()
    URL.revokeObjectURL(url)
  }

  function open(next: Panel): void {
    if (world === undefined) return
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

  function toggleMenu(): void {
    if (world === undefined) return
    if (world.seam.kind === 'recap') return
    setPanel(p => {
      if (p.kind === 'shop') world.cancelPlace()
      if (p.kind === 'chest') world.ackCue()
      return p.kind === 'menu' ? { kind: 'none' } : { kind: 'menu' }
    })
  }

  if (world === undefined) {
    return (
      <Tooltip.Provider delayDuration={200}>
        <div className="relative h-full min-h-0 overflow-hidden">
          {backdrop !== undefined && (
            <div className="pointer-events-none absolute inset-0">
              <MapView
                world={backdrop}
                cam={BOOT_CAM}
                rev={0}
                lens="off"
                hover={undefined}
                onHover={ignoreHover}
                onCam={ignoreCam}
                onClick={ignoreClick}
              />
            </div>
          )}
          <Menu mode="boot" fail={fail} onNew={playNew} onLoad={playLoad} onUpload={playUpload} />
        </div>
      </Tooltip.Provider>
    )
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
            onFamily={() => open({ kind: 'family' })}
            onShop={() => open({ kind: 'shop' })}
            onResearch={() => open({ kind: 'research' })}
            onMarket={() => open({ kind: 'market' })}
            onAlmanac={() => open({ kind: 'almanac' })}
            onLens={() => open({ kind: 'lens' })}
            onCheat={() => open({ kind: 'cheat' })}
            onGear={toggleMenu}
            paused={paused}
            onPause={() => setPaused(p => !p)}
          />
          <div className="pointer-events-none absolute right-4 bottom-4 z-20 flex w-80 flex-col gap-3">
            <Queue world={world} />
            <Status world={world} hover={hover} />
          </div>
          {panel.kind === 'family' && <Family world={world} onClose={() => setPanel({ kind: 'none' })} />}
          {panel.kind === 'lens' && (
            <LensPanel world={world} lens={lens} onPick={setLens} onClose={() => setPanel({ kind: 'none' })} />
          )}
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
          {panel.kind === 'cheat' && <Cheat world={world} onClose={() => setPanel({ kind: 'none' })} />}
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
          {panel.kind === 'menu' && world.seam.kind !== 'recap' && (
            <Menu
              mode="play"
              fail={fail}
              onNew={playNew}
              onLoad={playLoad}
              onUpload={playUpload}
              onSave={saveGame}
              onDownload={downloadSave}
              onClose={() => setPanel({ kind: 'none' })}
            />
          )}
          <ObjectHud world={world} cam={cam} onClose={() => world.closeHud()} />
          {world.seam.kind === 'recap' && (
            <Recap recap={world.seam.recap} nextDay={world.clock.day} onDismiss={() => world.dismissRecap()} />
          )}
          <TutorialCard world={world} tutorial={tutorial} onOff={() => setTutorial({ kind: 'off' })} />
          <div
            data-banner
            hidden
            className="pointer-events-none absolute inset-0 flex items-start justify-center pt-8 text-lg text-ink"
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
  if (hit.kind === 'delete-well') {
    world.deleteWell(hit.edge)
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
  if (hit.kind === 'well') {
    world.clickWell(hit.edge)
    return
  }
  if (hit.kind === 'sprinkler-hud') {
    world.openHud({ kind: 'sprinkler', at: hit.at })
    return
  }
  world.click(hit.at)
}
