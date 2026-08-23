import { useEffect, useRef, useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import type { Peer } from 'peerjs'
import { DT_MAX, localPlayerId, World } from './game/sim/world.ts'
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
import { CatchingUp, GuestDialog, HostDialog, type MpFail } from './game/ui/multiplayer.tsx'
import { TutorialCard } from './game/ui/tutorial.tsx'
import type { Coord } from './game/sim/building.ts'
import type { PromptHit } from './game/sim/prompt.ts'
import type { Camera } from './game/view/camera.ts'
import { MapView, type Lens, type MapClick } from './game/view/map.tsx'
import { paintMotion } from './game/view/motion.ts'
import { type WorkerSink } from './game/sim/log.ts'
import { MpGuest, MpHost } from './game/sim/mp.ts'
import { dial, listen, openPeer } from './game/net/peer.ts'
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
  | { kind: 'multiplayer' }

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
  const [mpFail, setMpFail] = useState<MpFail | undefined>(undefined)
  const [joining, setJoining] = useState(false)
  const [catching, setCatching] = useState(false)
  const [roomKey, setRoomKey] = useState('')
  const [panel, setPanel] = useState<Panel>({ kind: 'none' })
  const [cam, setCam] = useState<Camera>(BOOT_CAM)
  const [hover, setHover] = useState<PromptHit | undefined>(undefined)
  const [lens, setLens] = useState<Lens>('off')
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)
  pausedRef.current = paused
  const catchingRef = useRef(false)
  catchingRef.current = catching
  const accRef = useRef(0)
  const hostRef = useRef<MpHost | undefined>(undefined)
  const guestRef = useRef<MpGuest | undefined>(undefined)
  const peerRef = useRef<Peer | undefined>(undefined)
  const worldRef = useRef(world)
  worldRef.current = world
  const [role, setRole] = useState<'off' | 'host' | 'guest'>('off')
  const connected = role !== 'off'
  const guest = role === 'guest'

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
    if (world.local !== 0) return
    setPanel(p =>
      p.kind === 'chest' && p.at.col === cue.at.col && p.at.row === cue.at.row ? p : { kind: 'chest', at: cue.at },
    )
  }, [n, world])

  useEffect(() => {
    if (world === undefined) return
    const kind = world.seam.kind
    if (kind === 'recap' && prevSeam.current === 'play') {
      if (world.local === 0) writeSlot(dump(world))
      setPanel({ kind: 'none' })
    }
    prevSeam.current = kind
  }, [n, world])

  useEffect(() => {
    if (world === undefined) return
    let last = performance.now()
    accRef.current = 0
    let id = 0
    const loop = (now: number) => {
      const dt = ((now - last) / 1000) * SPEED
      last = now
      const host = hostRef.current
      const g = guestRef.current
      if (g !== undefined) {
        g.pumpGap(now)
      } else if (host !== undefined) {
        accRef.current += dt
        while (accRef.current >= DT_MAX) {
          host.pump()
          accRef.current -= DT_MAX
        }
      } else {
        accRef.current += dt
        while (accRef.current >= DT_MAX) {
          if (!pausedRef.current) world.tick(DT_MAX)
          accRef.current -= DT_MAX
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
      if (catchingRef.current) return
      if (world === undefined) {
        setJoining(false)
        return
      }
      world.cancelPlace()
      world.closeHud()
      setLens(l => (l === 'pipes' ? 'off' : l))
      if (world.seam.kind === 'recap') {
        if (world.local === 0) world.dismissRecap()
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

  useEffect(() => {
    const onPageHide = () => {
      if (hostRef.current === undefined) return
      toStartup(undefined, true)
    }
    window.addEventListener('pagehide', onPageHide)
    return () => window.removeEventListener('pagehide', onPageHide)
  }, [])

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
    setPaused(false)
  }

  function killPeer(): void {
    const peer = peerRef.current
    peerRef.current = undefined
    if (peer !== undefined) peer.destroy()
  }

  function toStartup(line: MpFail | undefined, saveHost: boolean): void {
    const host = hostRef.current
    const g = guestRef.current
    const w = worldRef.current
    if (host !== undefined) {
      if (saveHost && w !== undefined) writeSlot(dump(w))
      host.leave()
      hostRef.current = undefined
    }
    if (g !== undefined) {
      g.leave()
      guestRef.current = undefined
    }
    killPeer()
    setRole('off')
    setRoomKey('')
    setCatching(false)
    setJoining(false)
    setPaused(false)
    setPanel({ kind: 'none' })
    setWorld(undefined)
    setTutorial({ kind: 'off' })
    setFail(undefined)
    setMpFail(line)
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

  function startHost(): void {
    const w = worldRef.current
    if (w === undefined) return
    if (hostRef.current !== undefined || peerRef.current !== undefined) return
    void openPeer()
      .then(peer => {
        if (worldRef.current !== w) {
          peer.destroy()
          return
        }
        peerRef.current = peer
        setRoomKey(peer.id)
        setRole('host')
        const host = new MpHost(w)
        hostRef.current = host
        host.onPause = on => setPaused(on)
        host.onCatching = on => setCatching(on)
        const endHost = () => {
          if (hostRef.current === undefined) return
          toStartup(undefined, true)
        }
        peer.on('close', endHost)
        listen(peer, (wire, conn) => {
          host.attach(wire)
          conn.on('close', () => host.drop(wire))
          conn.on('error', () => host.drop(wire))
        })
      })
      .catch(() => {
        setMpFail('ice')
      })
  }

  function toggleMp(): void {
    if (world === undefined) return
    if (world.seam.kind === 'recap') return
    if (role === 'off') startHost()
    setPanel(p => {
      if (p.kind === 'shop') world.cancelPlace()
      if (p.kind === 'chest') world.ackCue()
      return p.kind === 'multiplayer' ? { kind: 'none' } : { kind: 'multiplayer' }
    })
  }

  function onJoin(key: string): void {
    setMpFail(undefined)
    void openPeer()
      .then(peer => {
        peerRef.current = peer
        return dial(peer, key).then(wire => {
          const g = new MpGuest(wire, localPlayerId())
          guestRef.current = g
          g.onWorld = (next, seat) => {
            next.local = seat
            setRole('guest')
            setJoining(false)
            setCatching(true)
            session(next, { kind: 'off' })
          }
          g.onCatching = on => setCatching(on)
          g.onPause = on => setPaused(on)
          g.onReject = reason => {
            setMpFail(reason)
            g.leave()
            guestRef.current = undefined
            killPeer()
          }
          g.onBye = why => {
            toStartup(why === 'kicked' ? 'desync' : 'host-left', false)
          }
          g.hello()
        })
      })
      .catch(() => {
        killPeer()
        guestRef.current = undefined
        setMpFail('ice')
      })
  }

  function onPause(): void {
    const host = hostRef.current
    const g = guestRef.current
    if (g !== undefined) {
      g.togglePause()
      setPaused(g.paused)
      return
    }
    if (host !== undefined) {
      host.setPaused(!host.paused)
      return
    }
    setPaused(p => !p)
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
          <Menu
            mode="boot"
            fail={fail}
            mpFail={mpFail}
            joining={joining}
            onNew={playNew}
            onLoad={playLoad}
            onUpload={playUpload}
            onJoinOpen={() => {
              setJoining(true)
              setMpFail(undefined)
            }}
            onJoin={onJoin}
            onJoinClose={() => setJoining(false)}
          />
        </div>
      </Tooltip.Provider>
    )
  }

  return (
    <Tooltip.Provider delayDuration={200}>
      <div ref={root} className="relative h-full min-h-0 overflow-hidden">
        <div className={catching ? 'pointer-events-none' : undefined}>
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
        </div>
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
            onMultiplayer={toggleMp}
            paused={paused}
            onPause={onPause}
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
              connected={connected}
              guest={guest}
              onNew={playNew}
              onLoad={playLoad}
              onUpload={playUpload}
              onSave={saveGame}
              onDownload={downloadSave}
              onLeave={() => toStartup(undefined, false)}
              onClose={() => setPanel({ kind: 'none' })}
            />
          )}
          {panel.kind === 'multiplayer' && world.seam.kind !== 'recap' && !guest && (
            <HostDialog
              roomKey={roomKey}
              world={world}
              local={world.local}
              onCopy={() => {
                void navigator.clipboard.writeText(roomKey)
              }}
              onClose={() => setPanel({ kind: 'none' })}
            />
          )}
          {panel.kind === 'multiplayer' && world.seam.kind !== 'recap' && guest && (
            <GuestDialog onLeave={() => toStartup(undefined, false)} onClose={() => setPanel({ kind: 'none' })} />
          )}
          <ObjectHud world={world} cam={cam} onClose={() => world.closeHud()} />
          {world.seam.kind === 'recap' && (
            <Recap
              recap={world.seam.recap}
              nextDay={world.clock.day}
              guest={guest}
              onDismiss={() => world.dismissRecap()}
            />
          )}
          {catching && <CatchingUp fail={mpFail} />}
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
