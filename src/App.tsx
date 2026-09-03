import { useEffect, useRef, useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import type { Peer } from 'peerjs'
import { installPlay } from './game/sim/play.ts'
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
import { PIPE_PLACE } from './game/view/hit.ts'
import { bindDash, bindHud, paintMotion } from './game/view/motion.ts'
import { QUAD_SHOW_MUL, TRAILER_CAP } from './game/defs/items.ts'
import { UI_DASH_QUAD, UI_DASH_TRACTOR } from './game/view/svgs.ts'
import { SENSOR_LENS_SKUS, type RouteId, type TrailerId, type VehicleId } from './game/sim/ids.ts'
import type { Item } from './game/sim/item.ts'
import { trailerUsed } from './game/sim/vehicle.ts'
import { Btn, Field, Window } from './game/ui/frame.tsx'
import { DashFace } from './game/ui/held.tsx'
import { type WorkerSink } from './game/sim/log.ts'
import { MpGuest, MpHost, RETRY_MAX } from './game/sim/mp.ts'
import { dial, listen, openPeer } from './game/net/peer.ts'
import { DOWNLOAD_NAME, dump, parse, readSlot, slotExists, writeSlot, type LoadFailReason } from './game/sim/save.ts'
import { check, startTutorial, type Tutorial } from './game/sim/tutorial.ts'
import { saveSettings, settings, type Settings } from './game/sim/settings.ts'

const HASH = window.location.hash
const START_NOW = HASH === '#start_now' || HASH === '#unlockall'
const UNLOCK_ALL = HASH === '#unlockall'

function bootCheat(w: World): void {
  if (new URLSearchParams(window.location.search).get('speed') === '3') w.setCheatSpeed(3)
}

const BOOT_CAM: Camera = { x: 15.5, y: 9.5, scale: 1 }
const DIAL_TIMEOUT_MS = 20000
const RECONNECT_DELAY_MS = 1500

function ignoreHover(_h: PromptHit | undefined): void {}
function ignoreCam(_c: Camera): void {}
function ignoreClick(_h: MapClick, _xy: { x: number; y: number }): void {}

export default function App({ sink }: { sink: WorkerSink }) {
  const root = useRef<HTMLDivElement>(null)
  const consignRevision = useRef(0)
  const prevSeam = useRef<'play' | 'recap'>('play')
  const [hudN, setHudN] = useState(0)
  const [backdrop] = useState(() => (START_NOW ? undefined : new World()))
  const [menuCanvasIn, setMenuCanvasIn] = useState(false)
  const [world, setWorld] = useState<World | undefined>(() => {
    if (!START_NOW) return undefined
    const w = new World(undefined, sink)
    if (UNLOCK_ALL) w.unlockAll()
    bootCheat(w)
    return w
  })
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
  const [panel, setPanelState] = useState<Panel>({ kind: 'none' })
  const panelRef = useRef(panel)
  panelRef.current = panel
  const [query, setQuery] = useState('')
  const [cam, setCam] = useState<Camera>(BOOT_CAM)
  const [hangarPick, setHangarPick] = useState<VehicleId | undefined>(undefined)
  const [hangarTrailer, setHangarTrailer] = useState<TrailerId | undefined>(undefined)
  const [hover, setHover] = useState<PromptHit | undefined>(undefined)
  const [lens, setLens] = useState<Lens>('off')
  const [lensLock, setLensLock] = useState(false)
  const toolLens = world === undefined ? undefined : toolLensOf(world)
  const [editor, setEditor] = useState(false)
  const editorLens = useRef<Lens>('off')
  const [paused, setPaused] = useState(false)
  const [prefs, setPrefs] = useState<Settings>(() => settings())
  const pausedRef = useRef(false)
  const hiddenHeld = useRef(false)
  const aiHoldRef = useRef(false)
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
    if (editor && world.driverVehicle(world.local) === undefined) {
      setEditor(false)
      setLens(editorLens.current)
    }
  }, [hudN, world, editor])

  useEffect(() => {
    if (world === undefined) return
    if (lens === 'water' && !world.hasSkill('water-study')) setLens('off')
    if (lens === 'land' && !world.hasSkill('land-study')) setLens('off')
  }, [hudN, lens, world])

  useEffect(() => {
    document.documentElement.toggleAttribute('data-reduced-motion', prefs.reducedMotion)
  }, [prefs])

  useEffect(() => {
    ;(window as unknown as { __world?: World }).__world = world
    return () => {
      delete (window as unknown as { __world?: World }).__world
    }
  }, [world])

  useEffect(() => {
    if (world === undefined) return
    return installPlay(world, aiHoldRef)
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
      if (kind === 'sold') {
        setHudN(x => x + 1)
        return
      }
      if (kind !== 'dirty') return
      if (reasons.has('act')) setHudN(x => x + 1)
    })
  }, [world])

  useEffect(() => {
    if (world === undefined) return
    // The cue belongs to one seat: without this every client popped open the host's inventory.
    if (world.seats[world.local].cue.kind !== 'inventory') return
    setPanel({ kind: 'inventory' })
    world.ackCue()
  }, [hudN, world])

  useEffect(() => {
    if (world === undefined) return
    if (world.consignRevision === consignRevision.current) return
    consignRevision.current = world.consignRevision
    if (world.seam.kind !== 'recap') setPanel({ kind: 'market' })
  }, [hudN, world])

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
  }, [hudN, world])

  useEffect(() => {
    if (world === undefined) return
    const kind = world.seam.kind
    if (kind === 'recap' && prevSeam.current === 'play') {
      if (world.local === 0) writeSlot(dump(world))
      setPanel({ kind: 'none' })
      soloPause(true)
    }
    prevSeam.current = kind
  }, [hudN, world])

  useEffect(() => {
    if (world === undefined || !prefs.pauseWhenHidden) return
    const away = () => {
      if (pausedRef.current) return
      hiddenHeld.current = true
      soloPause(true)
    }
    const back = () => {
      if (!hiddenHeld.current) return
      hiddenHeld.current = false
      soloPause(false)
    }
    const onVisibility = () => {
      if (document.hidden) away()
      else back()
    }
    window.addEventListener('blur', away)
    window.addEventListener('focus', back)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('blur', away)
      window.removeEventListener('focus', back)
      document.removeEventListener('visibilitychange', onVisibility)
      back()
    }
  }, [world, prefs.pauseWhenHidden])

  useEffect(() => {
    if (world === undefined) return
    let last = performance.now()
    let fpsEma = 0
    let tickMs = 0
    accRef.current = 0
    let id = 0
    const loop = (now: number) => {
      const frameDt = (now - last) / 1000
      const dt = Math.min(frameDt * world.cheatSpeed, DT_MAX * 2)
      last = now
      const inst = 1 / frameDt
      fpsEma = fpsEma === 0 ? inst : fpsEma * 0.9 + inst * 0.1
      const host = hostRef.current
      const g = guestRef.current
      let spent = 0
      let ran = 0
      if (g !== undefined) {
        g.pumpGap(now)
      } else if (host !== undefined) {
        accRef.current += dt
        let n = 0
        while (accRef.current >= DT_MAX && n < 2) {
          const t0 = performance.now()
          host.pump()
          spent += performance.now() - t0
          accRef.current -= DT_MAX
          n += 1
        }
        ran = n
      } else {
        accRef.current += dt
        let n = 0
        while (accRef.current >= DT_MAX && n < 2) {
          if (!pausedRef.current && !aiHoldRef.current) {
            const t0 = performance.now()
            world.tick(DT_MAX)
            spent += performance.now() - t0
            ran += 1
          }
          accRef.current -= DT_MAX
          n += 1
        }
      }
      if (ran > 0) tickMs = spent
      if (root.current !== null) paintMotion(root.current, world, fpsEma, tickMs)
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
      if (editor) {
        setEditor(false)
        setLens(editorLens.current)
      }
      world.cancelPlace()
      world.closeHud()
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
  }, [world, editor])

  useEffect(() => {
    const held = { w: false, a: false, s: false, d: false }
    let wasDriver = world !== undefined && world.driverVehicle(world.local) !== undefined
    const field = (t: EventTarget | null) =>
      t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement
    const send = () => {
      const w = worldRef.current
      if (w === undefined) return
      const throttle: -1 | 0 | 1 = held.w === held.s ? 0 : held.w ? 1 : -1
      const steer: -1 | 0 | 1 = held.a === held.d ? 0 : held.a ? -1 : 1
      if (w.driverVehicle(w.local) !== undefined) {
        w.drive(throttle, steer)
        return
      }
      const x: -1 | 0 | 1 = held.a === held.d ? 0 : held.a ? -1 : 1
      const y: -1 | 0 | 1 = held.w === held.s ? 0 : held.w ? -1 : 1
      w.stride(x, y)
    }
    const onPing = () => {
      const w = worldRef.current
      if (w === undefined) return
      const now = w.driverVehicle(w.local) !== undefined
      if (wasDriver !== now) send()
      wasDriver = now
    }
    const off = world === undefined ? undefined : world.on(onPing)
    const onDown = (e: KeyboardEvent) => {
      if (field(e.target)) return
      const k = e.key.toLowerCase()
      if (e.key === 'Enter') {
        const w = worldRef.current
        if (w === undefined) return
        w.enter()
        return
      }
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
      if (w.driverVehicle(w.local) !== undefined) w.drive(0, 0)
      else w.stride(0, 0)
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
    if (next.local === 0) bootCheat(next)
    setWorld(next)
    setTutorial(tut)
    setFail(undefined)
    setPanel({ kind: 'none' })
    setCam(BOOT_CAM)
    setHover(undefined)
    setLens('off')
    setLensLock(false)
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
    setHudN(x => x + 1)
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

  function leaveShop(): void {
    if (world === undefined) return
    world.cancelPlace()
    setQuery('')
  }

  function closeLens(): void {
    if (!lensLock) setLens('off')
    setPanel({ kind: 'none' })
  }

  function pickLens(next: Lens): void {
    setLens(next)
    if (next === 'off') setLensLock(false)
  }

  function clearLens(): void {
    setLensLock(false)
    setLens('off')
  }

  function open(next: Panel): void {
    if (world === undefined) return
    if (world.seam.kind === 'recap') return
    setPanel(p => {
      const to = p.kind === next.kind ? { kind: 'none' as const } : next
      if (p.kind === 'lens' && to.kind !== 'lens' && !lensLock) setLens('off')
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
        host.onRoster = () => setHudN(x => x + 1)
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

  function overlayHold(kind: Panel['kind']): boolean {
    return kind === 'family' || kind === 'market' || kind === 'almanac' || kind === 'menu'
  }

  function overlayPause(from: Panel['kind'], to: Panel['kind']): void {
    if (role !== 'off') return
    const a = overlayHold(from)
    const b = overlayHold(to)
    if (!a && b) {
      resumeRef.current = !pausedRef.current
      pausedRef.current = true
      setPaused(true)
      return
    }
    if (a && !b) {
      if (!resumeRef.current) return
      resumeRef.current = false
      pausedRef.current = false
      setPaused(false)
    }
  }

  function setPanel(next: Panel | ((p: Panel) => Panel)): void {
    const from = panelRef.current.kind
    const n = typeof next === 'function' ? next(panelRef.current) : next
    panelRef.current = n
    setPanelState(n)
    overlayPause(from, n.kind)
  }

  function setMpPanel(open: boolean): void {
    mpOpenRef.current = open
    const host = hostRef.current
    if (open) {
      resumeRef.current = !pausedRef.current
      pausedRef.current = true
      if (host !== undefined) host.setPaused(true)
      else setPaused(true)
      return
    }
    if (!resumeRef.current) return
    resumeRef.current = false
    pausedRef.current = false
    if (host !== undefined) host.setPaused(false)
    else setPaused(false)
  }

  function toggleMp(): void {
    if (world === undefined) return
    if (world.seam.kind === 'recap') return
    if (role === 'off') startHost()
    let open = false
    setPanel(p => {
      if (arming(p.kind)) leaveShop()
      if (cued(p.kind)) world.ackCue()
      open = p.kind !== 'multiplayer'
      return open ? { kind: 'multiplayer' } : { kind: 'none' }
    })
    setMpPanel(open)
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

  function soloPause(on: boolean): void {
    if (hostRef.current !== undefined || guestRef.current !== undefined) return
    pausedRef.current = on
    setPaused(on)
  }

  function applySettings(next: Settings): void {
    saveSettings(next)
    setPrefs(next)
  }

  function toMainMenu(): void {
    const w = worldRef.current
    if (w !== undefined && guestRef.current === undefined) writeSlot(dump(w))
    toStartup(undefined, false)
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
            <div className="pointer-events-none absolute inset-0 bg-grass">
              <div className={`${menuCanvasIn ? 'menu-canvas-in' : 'menu-canvas-wait'} absolute inset-0`}>
                <MapView
                  world={backdrop}
                  cam={BOOT_CAM}
                  lens="off"
                  editor={false}
                  hover={undefined}
                  onHover={ignoreHover}
                  onCam={ignoreCam}
                  onClick={ignoreClick}
                  onReady={() => setMenuCanvasIn(true)}
                />
              </div>
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
            lens={toolLens ?? lens}
            editor={editor}
            hover={hover}
            onHover={setHover}
            onCam={setCam}
            onClick={(hit, xy) => {
              if (world.seam.kind === 'recap') return
              if (hit.kind === 'cell' && sensorArmed(world)) {
                setLens('sensors')
                setLensLock(true)
              }
              if (
                hit.kind !== 'sprinkler-hud' &&
                hit.kind !== 'water-hud' &&
                hit.kind !== 'harvest-hud' &&
                hit.kind !== 'counter-hud' &&
                hit.kind !== 'day-hud'
              ) {
                world.closeHud()
              }
              if (panel.kind === 'inventory' || cued(panel.kind)) {
                if (cued(panel.kind)) world.ackCue()
                setPanel({ kind: 'none' })
                return
              }
              if (editor && world.seats[world.local].place.kind === 'none') {
                const driven = world.driverVehicle(world.local)
                if (driven !== undefined && driven.route !== 'none' && hit.kind === 'cell') {
                  const s = world.stopAt(hit.at, xy)
                  if (s !== undefined) world.addStop(driven.route, s)
                  return
                }
                if (driven !== undefined && driven.route === 'none' && hit.kind === 'cell') return
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
            onLensClear={clearLens}
            lensLock={lensLock}
            onCheat={() => open({ kind: 'cheat' })}
            onGear={toggleMenu}
            onMultiplayer={toggleMp}
            paused={paused}
            onPause={onPause}
            net={netLine}
          />
          {editor && <StopsWindow world={world} onClose={() => {
            setEditor(false)
            setLens(editorLens.current)
          }} />}
          <div className="pointer-events-none absolute right-4 bottom-4 z-20 flex w-80 flex-col gap-3">
            <Queue world={world} />
            <Status world={world} hover={hover} addHint={editor ? addStopHint(world, hover) : undefined} />
          </div>
          {panel.kind === 'family' && <Family world={world} onClose={() => setPanel({ kind: 'none' })} />}
          {panel.kind === 'lens' && (
            <LensPanel world={world} lens={lens} lock={lensLock} onPick={pickLens} onLock={setLensLock} onClose={closeLens} />
          )}
          {panel.kind === 'shop' && (
            <Shop
              world={world}
              query={query}
              setQuery={setQuery}
              onGo={p => setPanel({ kind: p })}
              onShelf={id => {
                if (id === 'logic') {
                  setLens('sensors')
                  setLensLock(true)
                }
              }}
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
              onShelf={id => {
                if (id === 'logic') {
                  setLens('sensors')
                  setLensLock(true)
                }
              }}
              onClose={() => {
                leaveShop()
                setPanel({ kind: 'none' })
              }}
            />
          )}
          {panel.kind === 'research' && <Research world={world} onClose={() => setPanel({ kind: 'none' })} />}
          {panel.kind === 'cheat' && <Cheat world={world} onClose={() => setPanel({ kind: 'none' })} />}
          {panel.kind === 'market' && <Market world={world} guest={guest} onClose={() => setPanel({ kind: 'none' })} />}
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
          {world.driverVehicle(world.local) !== undefined && (
            <Dash
              world={world}
              editor={editor}
              onOpenEditor={() => {
                if (editor) return
                const driven = world.driverVehicle(world.local)
                if (driven !== undefined && driven.route === 'none') {
                  if (world.routes.length === 0) world.createRoute()
                  world.assignRoute(driven.id, world.routes[0].id)
                }
                editorLens.current = lens
                setEditor(true)
                setLens('vehicles')
              }}
            />
          )}
          {panel.kind === 'menu' && world.seam.kind !== 'recap' && (
            <Menu
              mode="play"
              fail={fail}
              connected={connected}
              guest={guest}
              onLoad={playLoad}
              onUpload={playUpload}
              onSave={saveGame}
              onDownload={downloadSave}
              onMainMenu={toMainMenu}
              settings={prefs}
              onSettings={applySettings}
              onClose={() => setPanel({ kind: 'none' })}
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
              showContracts={world.done.has('unlock-contracts')}
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

function trailerOf(world: World, id: number) {
  const t = world.trailers.find(x => x.id === id)
  if (t === undefined) throw new Error('hitch')
  return t
}

function dashCargo(world: World, driven: NonNullable<ReturnType<World['driverVehicle']>>): Item[] {
  if (driven.kind === 'quad') {
    return driven.slots.flatMap(s => (s.kind === 'hold' ? [s.item] : []))
  }
  if (driven.hitch === 'none') return []
  const hitch = trailerOf(world, driven.hitch)
  if (hitch.kind === 'harvest') return hitch.slots.flatMap(s => (s.kind === 'hold' ? [s.item] : []))
  if (hitch.hopper.kind === 'empty') return []
  return [hitch.hopper.item]
}

function Dash({
  world,
  editor,
  onOpenEditor,
}: {
  world: World
  editor: boolean
  onOpenEditor: () => void
}) {
  const driven = world.driverVehicle(world.local)
  if (driven === undefined || driven.pose.kind !== 'field') return null
  const onPad = world.hangarAtPad({ col: Math.floor(driven.pose.x), row: Math.floor(driven.pose.y) }) !== undefined
  const hitch =
    driven.kind === 'tractor' && driven.hitch !== 'none' ? trailerOf(world, driven.hitch) : undefined
  const cargo = dashCargo(world, driven)
  return (
    <div
      ref={el => bindDash(el)}
      className="absolute bottom-4 left-1/2 z-20 w-[30rem] -translate-x-1/2"
    >
      {cargo.length > 0 && (
        <div
          className={`pointer-events-none mb-1 flex flex-wrap items-center gap-0.5 ${
            driven.kind === 'tractor' ? 'justify-end' : 'justify-center'
          }`}
        >
          {cargo.map((item, i) => (
            <DashFace key={i} item={item} />
          ))}
        </div>
      )}
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
              left: `${(13 / 240) * 100}%`,
              top: `${(38 / 64) * 100}%`,
              width: `${(70 / 240) * 100}%`,
              height: `${(14 / 64) * 100}%`,
            }}
          >
            {`F: ${Math.floor(driven.fuel * 100)}%`}
          </div>
          <div
            data-dash-speed
            className="absolute flex items-center justify-center font-display text-xs tabular-nums text-ink"
            style={{
              left: `${(85 / 240) * 100}%`,
              top: `${(38 / 64) * 100}%`,
              width: `${(70 / 240) * 100}%`,
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
        {world.vehicleCargo() && world.onDropoffPad() && (
          <button
            type="button"
            aria-disabled={!world.canUnload()}
            className={`pointer-events-auto px-3 py-2 text-base ${
              world.canUnload()
                ? 'cursor-pointer bg-dirt text-house hover:bg-dirt-dark'
                : 'cursor-default bg-ink/6 text-ink/35'
            }`}
            onClick={() => {
              if (!world.canUnload()) return
              world.unload()
            }}
          >
            Unload
          </button>
        )}
        {world.vehicleCargo() && world.onTakeupPad() && (
          <button
            type="button"
            aria-disabled={!world.canLoad()}
            className={`pointer-events-auto px-3 py-2 text-base ${
              world.canLoad()
                ? 'cursor-pointer bg-dirt text-house hover:bg-dirt-dark'
                : 'cursor-default bg-ink/6 text-ink/35'
            }`}
            onClick={() => {
              if (!world.canLoad()) return
              world.load()
            }}
          >
            Load
          </button>
        )}
        {driven.kind === 'tractor' && (
          <button
            type="button"
            className="pointer-events-auto cursor-pointer bg-dirt px-3 py-2 text-base text-house hover:bg-dirt-dark"
            onClick={() => world.setBoom(driven.boom === 5 ? 3 : 5)}
          >
            {driven.boom === 3 ? 'Boom 3' : 'Boom 5'}
          </button>
        )}
        {world.done.has('unlock-dispatch') && (
          <button
            type="button"
            className={`pointer-events-auto px-3 py-2 text-base ${
              editor
                ? 'cursor-pointer bg-ink text-house'
                : 'cursor-pointer bg-dirt text-house hover:bg-dirt-dark'
            }`}
            onClick={onOpenEditor}
          >
            Automate
          </button>
        )}
      </div>
    </div>
  )
}

function sensorArmed(world: World): boolean {
  const p = world.seats[world.local].place
  return p.kind === 'sku' && (SENSOR_LENS_SKUS as readonly string[]).includes(p.id)
}

function toolLensOf(world: World): Lens | undefined {
  const p = world.seats[world.local].place
  if (sensorArmed(world)) return 'sensors'
  if (p.kind === 'delete') return 'pipes'
  if (p.kind === 'sku' && (PIPE_PLACE as readonly string[]).includes(p.id)) return 'pipes'
  return undefined
}

function dispatchClick(world: World, hit: MapClick): void {
  if (hit.kind === 'edge') {
    world.placePipe(hit.edge)
    return
  }
  if (hit.kind === 'port') {
    const place = world.seats[world.local].place
    if (place.kind === 'wire') {
      world.placeWire(place.from, hit.end)
      return
    }
    world.armWire(hit.end)
    return
  }
  if (hit.kind === 'delete-wire') {
    world.deleteWire(hit.from, hit.to)
    return
  }
  if (hit.kind === 'water-hud') {
    world.openHud({ kind: 'water', at: hit.at })
    return
  }
  if (hit.kind === 'harvest-hud') {
    world.openHud({ kind: 'harvest', at: hit.at })
    return
  }
  if (hit.kind === 'counter-hud') {
    world.openHud({ kind: 'counter', at: hit.at })
    return
  }
  if (hit.kind === 'day-hud') {
    world.openHud({ kind: 'day', at: hit.at })
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

function addStopHint(world: World, hover: PromptHit | undefined): string | undefined {
  if (hover === undefined || hover.kind !== 'cell') return undefined
  if (!world.inWorld(hover.at)) return undefined
  const s = world.stopAt(hover.at, { x: hover.at.col + 0.5, y: hover.at.row + 0.5 })
  if (s === undefined) return undefined
  if (s.kind === 'goto') return 'Add stop here'
  if (s.kind === 'load') return 'Add load here'
  if (s.kind === 'unload') return 'Add unload here'
  return 'Add wait here'
}

function stopLabel(kind: 'goto' | 'load' | 'unload' | 'wait'): string {
  if (kind === 'goto') return 'Go'
  if (kind === 'load') return 'Load'
  if (kind === 'unload') return 'Unload'
  return 'Wait'
}

function StopsWindow({ world, onClose }: { world: World; onClose: () => void }) {
  const driven = world.driverVehicle(world.local)
  if (driven === undefined) return null
  const assigned = driven.route === 'none' ? undefined : world.routeById(driven.route)
  const n = assigned === undefined ? 0 : assigned.stops.length
  const canStart = n >= 1
  return (
    <div className="absolute top-20 right-4 z-20">
      <Window
        title={assigned === undefined ? '' : assigned.name}
        onClose={onClose}
        className="w-80 max-h-[calc(100vh-16rem)]"
        footer={
          <button
            type="button"
            aria-disabled={!canStart}
            title={canStart ? undefined : 'Add a stop.'}
            className={`px-3 py-2 text-base ${
              canStart ? 'cursor-pointer bg-dirt text-house hover:bg-dirt-dark' : 'cursor-default bg-ink/6 text-ink/35'
            }`}
            onClick={() => {
              if (!canStart) return
              world.startRoute()
            }}
          >
            Start
          </button>
        }
      >
        <div className="flex items-center gap-2">
          <select
            className="min-w-0 flex-1 border-2 border-ink/30 bg-parch px-2 py-1.5 text-sm text-ink outline-none focus:border-ink"
            value={driven.route === 'none' ? '' : String(driven.route)}
            onChange={e => {
              const id = Number(e.target.value) as RouteId
              if (!Number.isInteger(id)) return
              world.assignRoute(driven.id, id)
            }}
          >
            {driven.route === 'none' && <option value=""> </option>}
            {world.routes.map(r => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <Btn
            onClick={() => {
              world.createRoute()
              const minted = world.nextRouteId - 1
              world.assignRoute(driven.id, minted)
            }}
          >
            New
          </Btn>
        </div>
        {assigned !== undefined && (
          <div className="mt-2">
            <Field
              name="route"
              aria-label="Route name"
              value={assigned.name}
              onChange={v => {
                if (v === '') return
                world.renameRoute(assigned.id, v)
              }}
            />
          </div>
        )}
        {assigned !== undefined && (
          <div className="mt-2 flex flex-col gap-1">
            {assigned.stops.map((s, i) => {
              return (
                <div key={`${assigned.id}-${i}`} className="flex items-start gap-2">
                  <span className="min-w-0 flex-1 truncate pt-0.5 text-sm">
                    <span className="mr-2 tabular-nums">{i + 1}</span>
                    {stopLabel(s.kind)}
                  </span>
                  <div className="flex shrink-0 flex-col">
                    <button
                      type="button"
                      className="cursor-pointer px-1 text-sm leading-none"
                      onClick={() => world.reorderStop(assigned.id, i, -1)}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      className="cursor-pointer px-1 text-sm leading-none"
                      onClick={() => world.reorderStop(assigned.id, i, 1)}
                    >
                      ▼
                    </button>
                  </div>
                  <button
                    type="button"
                    aria-label="Remove"
                    className="cursor-pointer px-1 text-lg leading-none text-ink/60 hover:bg-dirt hover:text-house"
                    onClick={() => world.removeStop(assigned.id, i)}
                  >
                    x
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </Window>
    </div>
  )
}
