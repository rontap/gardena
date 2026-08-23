import { useEffect, useRef, useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import type { Peer } from 'peerjs'
import { DT_MAX, localPlayerId, localPlayerName, setLocalPlayerName, World } from './game/sim/world.ts'
import { Almanac } from './game/ui/almanac.tsx'
import { ChestUi } from './game/ui/chest.tsx'
import { HangarUi } from './game/ui/hangar.tsx'
import { VehicleUi } from './game/ui/vehicle.tsx'
import { AdditivesUi, SiloUi } from './game/ui/store.tsx'
import { Hud } from './game/ui/hud.tsx'
import { Status } from './game/ui/status.tsx'
import { Inventory } from './game/ui/inventory.tsx'
import { ObjectHud } from './game/ui/objecthud.tsx'
import { Market } from './game/ui/market.tsx'
import { Queue } from './game/ui/queue.tsx'
import { Recap } from './game/ui/recap.tsx'
import { Research } from './game/ui/research.tsx'
import { Cheat } from './game/ui/cheat.tsx'
import { Build, Shop } from './game/ui/shop.tsx'
import { Family } from './game/ui/family.tsx'
import { LensPanel } from './game/ui/lens.tsx'
import { Menu } from './game/ui/menu.tsx'
import { GuestDialog, HostDialog, type MpFail } from './game/ui/multiplayer.tsx'
import { TutorialCard } from './game/ui/tutorial.tsx'
import { arming, cued, type Panel } from './game/ui/panel.ts'
import type { PromptHit } from './game/sim/prompt.ts'
import type { Camera } from './game/view/camera.ts'
import { MapView, type Lens, type MapClick } from './game/view/map.tsx'
import { bindDash, bindHud, paintMotion } from './game/view/motion.ts'
import { QUAD_SHOW_MUL, TRAILER_CAP } from './game/defs/items.ts'
import { UI_DASH_QUAD, UI_DASH_TRACTOR } from './game/view/svgs.ts'
import type { TrailerId, VehicleId } from './game/sim/ids.ts'
import { trailerUsed } from './game/sim/vehicle.ts'
import { type WorkerSink } from './game/sim/log.ts'
import { MpGuest, MpHost, RETRY_MAX } from './game/sim/mp.ts'
import { dial, listen, openPeer } from './game/net/peer.ts'
import { DOWNLOAD_NAME, dump, parse, readSlot, slotExists, writeSlot, type LoadFailReason } from './game/sim/save.ts'
import { check, startTutorial, type Tutorial } from './game/sim/tutorial.ts'

const SPEED = (() => {
  const raw = new URLSearchParams(window.location.search).get('speed')
  const n = raw === null ? NaN : Number(raw)
  return Number.isFinite(n) && n >= 1 ? Math.min(20, n) : 1
})()

const START_NOW = window.location.hash === '#start_now'
const BOOT_CAM: Camera = { x: 15.5, y: 9.5, scale: 1 }
const DIAL_TIMEOUT_MS = 20000
const RECONNECT_DELAY_MS = 1500

function ignoreHover(_h: PromptHit | undefined): void {}
function ignoreCam(_c: Camera): void {}
function ignoreClick(_h: MapClick): void {}

export default function App({ sink }: { sink: WorkerSink }) {
  const root = useRef<HTMLDivElement>(null)
  const consignRevision = useRef(0)
  const prevSeam = useRef<'play' | 'recap'>('play')
  const [n, setN] = useState(0)
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
  const [connecting, setConnecting] = useState(false)
  const [name, setName] = useState(() => localPlayerName())
  const [retry, setRetry] = useState(0)
  const [catching, setCatching] = useState(false)
  const [roomKey, setRoomKey] = useState('')
  const [panel, setPanel] = useState<Panel>({ kind: 'none' })
  const [query, setQuery] = useState('')
  const [cam, setCam] = useState<Camera>(BOOT_CAM)
  const [hangarPick, setHangarPick] = useState<VehicleId | undefined>(undefined)
  const [hangarTrailer, setHangarTrailer] = useState<TrailerId | undefined>(undefined)
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
  const resumeRef = useRef(false)
  const mpOpenRef = useRef(false)
  const roomRef = useRef('')
  const closeMpRef = useRef(() => {})
  const retryRef = useRef(0)
  const reconnectRef = useRef(0)
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
    return world.on((kind, reasons) => {
      setTutorial(t => {
        if (t.kind !== 'on') return t
        return check(world, {
          kind: 'on',
          step: t.step,
          poured: t.poured || kind === 'poured',
          sold: t.sold || kind === 'sold',
        })
      })
      if (kind !== 'dirty' || reasons.size > 1 || !reasons.has('speech')) setN(x => x + 1)
    })
  }, [world])

  useEffect(() => {
    if (world === undefined) return
    // The cue belongs to one seat: without this every client popped open the host's inventory.
    if (world.seats[world.local].cue.kind !== 'inventory') return
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
    const cue = world.seats[world.local].cue
    if (cue.kind === 'none') {
      setPanel(p => (p.kind === 'hangar' || p.kind === 'vehicle' ? { kind: 'none' } : p))
      return
    }
    if (cue.kind === 'hangar') {
      setHangarPick(undefined)
      setPanel(p => (p.kind === 'hangar' && p.at.col === cue.at.col && p.at.row === cue.at.row ? p : { kind: 'hangar', at: cue.at }))
      return
    }
    if (cue.kind === 'vehicle') {
      setPanel(p => (p.kind === 'vehicle' && p.id === cue.id ? p : { kind: 'vehicle', id: cue.id }))
      return
    }
    if (cue.kind !== 'chest' && cue.kind !== 'silo' && cue.kind !== 'additives') return
    const at = cue.at
    setPanel(p => (p.kind === cue.kind && p.at.col === at.col && p.at.row === at.row ? p : { kind: cue.kind, at }))
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
        let n = 0
        while (accRef.current >= DT_MAX && n < 2) {
          host.pump()
          accRef.current -= DT_MAX
          n += 1
        }
      } else {
        accRef.current += dt
        let n = 0
        while (accRef.current >= DT_MAX && n < 2) {
          if (!pausedRef.current) world.tick(DT_MAX)
          accRef.current -= DT_MAX
          n += 1
        }
      }
      const driven = world.driverVehicle(world.local)
      if (driven !== undefined && driven.pose.kind === 'field') {
        const x = driven.pose.x
        const y = driven.pose.y
        setCam(c => (c.x === x && c.y === y ? c : { x, y, scale: c.scale }))
      }
      if (root.current !== null) paintMotion(root.current, world)
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
      setQuery('')
      if (world.seam.kind === 'recap') {
        if (world.local === 0) world.dismissRecap()
        return
      }
      setPanel(p => {
        if (cued(p.kind)) world.ackCue()
        if (p.kind === 'multiplayer') closeMpRef.current()
        return { kind: 'none' }
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [world])

  useEffect(() => {
    const held = { w: false, a: false, s: false, d: false }
    let wasDriver = world !== undefined && world.driverVehicle(world.local) !== undefined
    const field = (t: EventTarget | null) => t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement
    const send = () => {
      const w = worldRef.current
      if (w === undefined) return
      const throttle: -1 | 0 | 1 = held.w === held.s ? 0 : held.w ? 1 : -1
      const steer: -1 | 0 | 1 = held.a === held.d ? 0 : held.a ? -1 : 1
      if (w.driverVehicle(w.local) === undefined) return
      w.drive(throttle, steer)
    }
    const onPing = () => {
      const w = worldRef.current
      if (w === undefined) return
      const now = w.driverVehicle(w.local) !== undefined
      if (!wasDriver && now) send()
      wasDriver = now
    }
    const off = world === undefined ? undefined : world.on(onPing)
    const onDown = (e: KeyboardEvent) => {
      if (field(e.target)) return
      const k = e.key.toLowerCase()
      if (k !== 'w' && k !== 'a' && k !== 's' && k !== 'd') return
      if (held[k]) return
      held[k] = true
      send()
    }
    const onUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k !== 'w' && k !== 'a' && k !== 's' && k !== 'd') return
      held[k] = false
      send()
    }
    const onBlur = () => {
      held.w = false
      held.a = false
      held.s = false
      held.d = false
      const w = worldRef.current
      if (w === undefined) return
      if (w.driverVehicle(w.local) === undefined) return
      w.drive(0, 0)
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', onBlur)
    return () => {
      if (off !== undefined) off()
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [world])

  useEffect(() => {
    const onPageHide = () => {
      // Close the guest link deliberately so the host frees the seat now, not on a WebRTC timeout.
      const g = guestRef.current
      if (g !== undefined) g.leave()
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
    setConnecting(false)
    setRetry(0)
    retryRef.current = 0
    roomRef.current = ''
    window.clearTimeout(reconnectRef.current)
    setPaused(false)
    setPanel({ kind: 'none' })
    setWorld(undefined)
    setTutorial({ kind: 'off' })
    setFail(undefined)
    setMpFail(line)
  }

  function renameLocal(v: string): void {
    setName(v)
    setLocalPlayerName(v)
    const w = worldRef.current
    if (w === undefined) return
    w.seats[w.local].name = localPlayerName()
    const host = hostRef.current
    if (host !== undefined) host.pushRoster()
    setN(x => x + 1)
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

  /** Leaving the shop system: drop the ghost, the pipe layer, and the search. */
  function leaveShop(): void {
    if (world === undefined) return
    world.cancelPlace()
    setLens(l => (l === 'pipes' ? 'off' : l))
    setQuery('')
  }

  function open(next: Panel): void {
    if (world === undefined) return
    if (world.seam.kind === 'recap') return
    setPanel(p => {
      const to = p.kind === next.kind ? { kind: 'none' as const } : next
      if (arming(p.kind) && !arming(to.kind)) leaveShop()
      if (cued(p.kind)) world.ackCue()
      if (p.kind === 'multiplayer') setMpPanel(false)
      return to
    })
  }

  function closeMp(): void {
    setMpPanel(false)
    setPanel({ kind: 'none' })
  }

  closeMpRef.current = closeMp

  function toggleMenu(): void {
    if (world === undefined) return
    if (world.seam.kind === 'recap') return
    setPanel(p => {
      if (arming(p.kind)) leaveShop()
      if (cued(p.kind)) world.ackCue()
      if (p.kind === 'multiplayer') setMpPanel(false)
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
        host.onRoster = () => setN(x => x + 1)
        // startHost resolves after the lobby opened, so re-apply the hold the panel asked for.
        if (mpOpenRef.current) host.setPaused(true)
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

  /** The multiplayer panel is a lobby: hold the world still while it is open, then hand time back. */
  function setMpPanel(open: boolean): void {
    mpOpenRef.current = open
    const host = hostRef.current
    if (open) {
      resumeRef.current = !paused
      if (host !== undefined) host.setPaused(true)
      else setPaused(true)
      return
    }
    if (!resumeRef.current) return
    resumeRef.current = false
    if (host !== undefined) host.setPaused(false)
    else setPaused(false)
  }

  function toggleMp(): void {
    if (world === undefined) return
    if (world.seam.kind === 'recap') return
    if (role === 'off') startHost()
    setPanel(p => {
      if (arming(p.kind)) leaveShop()
      if (cued(p.kind)) world.ackCue()
      const open = p.kind !== 'multiplayer'
      setMpPanel(open)
      return open ? { kind: 'multiplayer' } : { kind: 'none' }
    })
  }

  /** Wires one MpGuest. Used for the first join and for every reconnect after a dropped link. */
  function bindGuest(g: MpGuest, stop: () => void, resume: boolean): void {
    guestRef.current = g
    g.onWorld = (next, seat) => {
      stop()
      next.local = seat
      setRole('guest')
      setJoining(false)
      setConnecting(false)
      setRetry(0)
      retryRef.current = 0
      if (resume) return
      setCatching(true)
      session(next, { kind: 'off' })
    }
    g.onCatching = on => setCatching(on)
    g.onRetry = n => {
      retryRef.current = n
      setRetry(n)
    }
    g.onPause = on => setPaused(on)
    g.onReject = reason => {
      stop()
      setConnecting(false)
      setMpFail(reason)
      g.leave()
      guestRef.current = undefined
      killPeer()
    }
    g.onBye = why => {
      stop()
      if (why === 'lost' && roomRef.current !== '') {
        reconnect()
        return
      }
      toStartup(why === 'kicked' ? 'desync' : 'host-left', false)
    }
  }

  /** A dropped transport is retried in place; only a spent budget ends the session. */
  function reconnect(): void {
    const n = retryRef.current + 1
    retryRef.current = n
    setRetry(n)
    const old = guestRef.current
    guestRef.current = undefined
    if (old !== undefined) old.leave()
    killPeer()
    if (n > RETRY_MAX) {
      toStartup('lost', false)
      return
    }
    setCatching(true)
    const key = roomRef.current
    reconnectRef.current = window.setTimeout(() => {
      void openPeer()
        .then(peer => {
          peerRef.current = peer
          return dial(peer, key).then(wire => {
            const g = new MpGuest(wire, localPlayerId(), localPlayerName())
            bindGuest(g, () => {}, true)
            g.hello()
          })
        })
        .catch(() => {
          reconnect()
        })
    }, RECONNECT_DELAY_MS)
  }

  function onJoin(key: string): void {
    setMpFail(undefined)
    setConnecting(true)
    roomRef.current = key
    retryRef.current = 0
    setRetry(0)
    // PeerJS can sit on a dead room key forever; give up rather than spin with no word.
    let settled = false
    const bail = window.setTimeout(() => {
      if (settled) return
      settled = true
      const g = guestRef.current
      if (g !== undefined) g.leave()
      guestRef.current = undefined
      killPeer()
      setConnecting(false)
      roomRef.current = ''
      setMpFail('ice')
    }, DIAL_TIMEOUT_MS)
    const stop = () => {
      settled = true
      window.clearTimeout(bail)
    }
    void openPeer()
      .then(peer => {
        peerRef.current = peer
        return dial(peer, key).then(wire => {
          const g = new MpGuest(wire, localPlayerId(), localPlayerName())
          bindGuest(g, stop, false)
          g.hello()
        })
      })
      .catch(() => {
        stop()
        killPeer()
        guestRef.current = undefined
        setConnecting(false)
        roomRef.current = ''
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

  const netLine =
    retry > 0
      ? `Reconnecting ${Math.min(retry, RETRY_MAX)} of ${RETRY_MAX}`
      : catching
        ? 'Catching up'
        : undefined

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
            connecting={connecting}
            name={name}
            onName={renameLocal}
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
              if (panel.kind === 'inventory' || cued(panel.kind)) {
                if (cued(panel.kind)) world.ackCue()
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
            onBuild={() => open({ kind: 'build' })}
            onResearch={() => open({ kind: 'research' })}
            onMarket={() => open({ kind: 'market' })}
            onAlmanac={() => open({ kind: 'almanac' })}
            onLens={() => open({ kind: 'lens' })}
            onCheat={() => open({ kind: 'cheat' })}
            onGear={toggleMenu}
            onMultiplayer={toggleMp}
            paused={paused}
            onPause={onPause}
            net={netLine}
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
              query={query}
              setQuery={setQuery}
              onGo={p => setPanel({ kind: p })}
              onClose={() => {
                leaveShop()
                setPanel({ kind: 'none' })
              }}
            />
          )}
          {panel.kind === 'build' && (
            <Build
              world={world}
              query={query}
              setQuery={setQuery}
              onGo={p => setPanel({ kind: p })}
              onClose={() => {
                leaveShop()
                setPanel({ kind: 'none' })
              }}
            />
          )}
          {panel.kind === 'research' && <Research world={world} onClose={() => setPanel({ kind: 'none' })} />}
          {panel.kind === 'cheat' && <Cheat world={world} onClose={() => setPanel({ kind: 'none' })} />}
          {panel.kind === 'market' && <Market world={world} onClose={() => setPanel({ kind: 'none' })} />}
          {panel.kind === 'inventory' && <Inventory world={world} onClose={() => setPanel({ kind: 'none' })} />}
          {panel.kind === 'almanac' && <Almanac world={world} onClose={() => setPanel({ kind: 'none' })} />}
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
          {panel.kind === 'silo' && (
            <SiloUi
              world={world}
              at={panel.at}
              onClose={() => {
                world.ackCue()
                setPanel({ kind: 'none' })
              }}
            />
          )}
          {panel.kind === 'additives' && (
            <AdditivesUi
              world={world}
              at={panel.at}
              onClose={() => {
                world.ackCue()
                setPanel({ kind: 'none' })
              }}
            />
          )}
          {panel.kind === 'hangar' && (
            <HangarUi
              world={world}
              at={panel.at}
              selected={hangarPick}
              selectedTrailer={hangarTrailer}
              onSelect={id => {
                setHangarPick(id)
                setHangarTrailer(undefined)
              }}
              onSelectTrailer={setHangarTrailer}
              onClose={() => {
                world.ackCue()
                setHangarPick(undefined)
                setHangarTrailer(undefined)
                setPanel({ kind: 'none' })
              }}
            />
          )}
          {panel.kind === 'vehicle' && (
            <VehicleUi
              world={world}
              id={panel.id}
              onClose={() => {
                world.ackCue()
                setPanel({ kind: 'none' })
              }}
            />
          )}
          {world.driverVehicle(world.local) !== undefined && <Dash world={world} />}
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
              onClose={closeMp}
            />
          )}
          {panel.kind === 'multiplayer' && world.seam.kind !== 'recap' && !guest && (
            <HostDialog
              roomKey={roomKey}
              world={world}
              local={world.local}
              name={name}
              onName={renameLocal}
              onCopy={() => navigator.clipboard.writeText(roomKey).then(() => true, () => false)}
              onClose={closeMp}
            />
          )}
          {panel.kind === 'multiplayer' && world.seam.kind !== 'recap' && guest && (
            <GuestDialog
              world={world}
              local={world.local}
              name={name}
              onName={renameLocal}
              onLeave={() => toStartup(undefined, false)}
              onClose={() => setPanel({ kind: 'none' })}
            />
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
          <TutorialCard world={world} tutorial={tutorial} onOff={() => setTutorial({ kind: 'off' })} />
          <div
            ref={el => bindHud('banner', el)}
            data-banner
            hidden
            className="pointer-events-none absolute inset-0 flex items-start justify-center pt-8 text-lg text-ink"
          />
      </div>
    </Tooltip.Provider>
  )
}

function Dash({ world }: { world: World }) {
  const driven = world.driverVehicle(world.local)
  if (driven === undefined || driven.pose.kind !== 'field') return null
  const onPad = world.hangarAtPad({ col: Math.floor(driven.pose.x), row: Math.floor(driven.pose.y) }) !== undefined
  const hitch =
    driven.kind === 'tractor' && driven.hitch !== 'none' ? world.trailers.find(t => t.id === driven.hitch) : undefined
  return (
    <div
      ref={el => bindDash(el)}
      className="absolute bottom-4 left-1/2 z-20 w-[30rem] -translate-x-1/2"
    >
      <div className="relative">
        <div
          className="pointer-events-none w-full [&_svg]:block [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: driven.kind === 'tractor' ? UI_DASH_TRACTOR : UI_DASH_QUAD }}
        />
        <div className="pointer-events-none absolute inset-0">
          <div
            data-dash-fuel
            className="absolute flex items-center justify-center font-display text-xs tabular-nums text-ink"
            style={{
              left: `${(8 / 240) * 100}%`,
              top: `${(38 / 64) * 100}%`,
              width: `${(80 / 240) * 100}%`,
              height: `${(14 / 64) * 100}%`,
            }}
          >
            {`F: ${Math.floor(driven.fuel * 100)}%`}
          </div>
          <div
            data-dash-speed
            className="absolute flex items-center justify-center font-display text-xs tabular-nums text-ink"
            style={{
              left: `${(88 / 240) * 100}%`,
              top: `${(38 / 64) * 100}%`,
              width: `${(100 / 240) * 100}%`,
              height: `${(14 / 64) * 100}%`,
            }}
          >
            {`V: ${Math.floor(Math.abs(driven.pose.speed) * QUAD_SHOW_MUL)} km/h`}
          </div>
          {hitch !== undefined && (
            <div
              data-dash-used
              className="absolute flex items-center justify-center font-display text-xs tabular-nums text-ink"
              style={{
                left: `${(208 / 240) * 100}%`,
                top: `${(38 / 64) * 100}%`,
                width: `${(30 / 240) * 100}%`,
                height: `${(14 / 64) * 100}%`,
              }}
            >
              {`${trailerUsed(hitch)}/${TRAILER_CAP}`}
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 flex justify-center gap-2">
        <button
          type="button"
          className="pointer-events-auto cursor-pointer bg-dirt px-3 py-2 text-base text-house hover:bg-dirt-dark"
          onClick={() => world.disembark()}
        >
          Disembark
        </button>
        <button
          type="button"
          aria-disabled={!onPad}
          title={onPad ? undefined : 'Dock at the hangar arrows.'}
          className={`pointer-events-auto px-3 py-2 text-base ${
            onPad
              ? 'cursor-pointer bg-dirt text-house hover:bg-dirt-dark'
              : 'cursor-default bg-ink/6 text-ink/35'
          }`}
          onClick={() => {
            if (!onPad) return
            world.dock()
          }}
        >
          Dock
        </button>
      </div>
    </div>
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
