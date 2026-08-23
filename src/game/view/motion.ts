import { RESEARCH } from '../defs/research.ts'
import { COMPOST_NEED, QUAD_SHOW_MUL, TRAILER_CAP } from '../defs/items.ts'
import { SOIL_WATER_MAX } from '../sim/soil.ts'
import { DAY_SECONDS, PHASE_NAME } from '../sim/clock.ts'
import type { Coord } from '../sim/building.ts'
import type { VehicleId } from '../sim/ids.ts'
import { hitchP, kindVMax, trailerCenter, trailerUsed, wrapHeading } from '../sim/vehicle.ts'
import type { SeatId, World } from '../sim/world.ts'
import { TILE } from './camera.ts'
import { symHref, UI_PHASE } from './svgs.ts'

const WASH = '#cfc6b0'
const GOOD = '#2fd15a'

type BarKind = 'thirst' | 'fert' | 'fresh' | 'compost'

type BarEntry = {
  kind: BarKind
  el: SVGRectElement
  col: number
  row: number
  last: string
}

const bars = new Map<string, BarEntry>()

type ActorEntry = { el: SVGGElement; transform: string; visibility: string }

const actors = new Map<SeatId, ActorEntry>()

type QuadEntry = { el: SVGGElement; transform: string; x: number; y: number; heading: number; snap: boolean; kind: 'quad' | 'tractor' }

const quads = new Map<VehicleId, QuadEntry>

type TrailerEntry = { el: SVGGElement; transform: string }

const trailers = new Map<number, TrailerEntry>()

const QUAD_FOLLOW = 0.35

let dashHost: Element | undefined
let dashFuel: SVGGElement | undefined
let dashSpeed: SVGGElement | undefined
let dashSteer: SVGGElement | undefined
let dashFuelReadout: Element | undefined
let dashSpeedReadout: Element | undefined
let dashUsedReadout: Element | undefined
const lastNeedle = { fuel: '', speed: '', steer: '' }
const lastDash = { fuel: '', speed: '', used: '' }

type HudKind = 'clock' | 'day-bar' | 'phase' | 'research' | 'queue-bar' | 'banner' | 'speech'

const hud = new Map<HudKind, Element>()
let phaseUse: SVGUseElement | undefined
let speechText: Element | undefined

function barKey(kind: BarKind, at: Coord): string {
  return `${kind}:${at.col},${at.row}`
}

export function bindBar(kind: BarKind, at: Coord, el: SVGRectElement | null): void {
  const key = barKey(kind, at)
  if (el === null) {
    bars.delete(key)
    return
  }
  bars.set(key, { kind, el, col: at.col, row: at.row, last: '' })
}

export function bindActor(id: SeatId, el: SVGGElement | null): void {
  if (el === null) actors.delete(id)
  else actors.set(id, { el, transform: '', visibility: '' })
}

export function bindQuad(id: VehicleId, el: SVGGElement | null, kind: 'quad' | 'tractor' = 'quad'): void {
  if (el === null) quads.delete(id)
  else quads.set(id, { el, transform: '', x: 0, y: 0, heading: 0, snap: true, kind })
}

export function bindTrailer(id: number, el: SVGGElement | null): void {
  if (el === null) trailers.delete(id)
  else trailers.set(id, { el, transform: '' })
}

let dummyRot: SVGGElement | undefined
let dummyDeg = ''
let dummyTrailer: SVGGElement | undefined
let dummyTrailerT = ''

export function bindDummyQuad(el: SVGGElement | null): void {
  dummyRot = el === null ? undefined : el
  dummyDeg = ''
}

export function bindDummyTrailer(el: SVGGElement | null): void {
  dummyTrailer = el === null ? undefined : el
  dummyTrailerT = ''
}

export function bindDash(el: Element | null): void {
  dashHost = el === null ? undefined : el
  dashFuel = undefined
  dashSpeed = undefined
  dashSteer = undefined
  dashFuelReadout = undefined
  dashSpeedReadout = undefined
  dashUsedReadout = undefined
  lastNeedle.fuel = ''
  lastNeedle.speed = ''
  lastNeedle.steer = ''
  lastDash.fuel = ''
  lastDash.speed = ''
  lastDash.used = ''
  if (el === null) return
  const fuel = el.querySelector('#fuel-needle')
  const speed = el.querySelector('#speed-needle')
  const steer = el.querySelector('#steer')
  dashFuel = fuel instanceof SVGGElement ? fuel : undefined
  dashSpeed = speed instanceof SVGGElement ? speed : undefined
  dashSteer = steer instanceof SVGGElement ? steer : undefined
  const fuelReadout = el.querySelector('[data-dash-fuel]')
  const speedReadout = el.querySelector('[data-dash-speed]')
  const usedReadout = el.querySelector('[data-dash-used]')
  dashFuelReadout = fuelReadout === null ? undefined : fuelReadout
  dashSpeedReadout = speedReadout === null ? undefined : speedReadout
  dashUsedReadout = usedReadout === null ? undefined : usedReadout
}

export function bindHud(kind: HudKind, el: Element | null): void {
  if (el === null) {
    hud.delete(kind)
    if (kind === 'phase') phaseUse = undefined
    if (kind === 'speech') speechText = undefined
    return
  }
  hud.set(kind, el)
  if (kind === 'phase') {
    const u = el.querySelector('use')
    phaseUse = u instanceof SVGUseElement ? u : undefined
    last.phase = ''
  }
  if (kind === 'speech') {
    const line = el.querySelector('[data-speech-text]')
    speechText = line === null ? undefined : line
  }
}

function paintBar(entry: BarEntry, width: number): void {
  const next = String(width)
  if (entry.last === next) return
  entry.last = next
  entry.el.setAttribute('width', next)
}

const last = { clockT: '', dayWidth: '', phase: '', secs: '', bar: '', queue: '' }

export function paintMotion(root: HTMLElement, world: World): void {
  void root
  world.seats.forEach(s => {
    const entry = actors.get(s.id)
    if (entry === undefined || s.napping) return
    const seated = world.driverVehicle(s.id) !== undefined
    if (s.presence !== 'in' || seated) {
      if (entry.visibility !== 'hidden') {
        entry.visibility = 'hidden'
        entry.el.setAttribute('visibility', 'hidden')
      }
      return
    }
    if (entry.visibility !== 'visible') {
      entry.visibility = 'visible'
      entry.el.setAttribute('visibility', 'visible')
    }
    const transform = `translate(${(s.actor.x - 0.5) * TILE},${(s.actor.y - 0.5) * TILE}) scale(${TILE / 24})`
    if (entry.transform === transform) return
    entry.transform = transform
    entry.el.setAttribute('transform', transform)
  })
  world.vehicles.forEach(v => {
    if (v.pose.kind !== 'field') return
    const entry = quads.get(v.id)
    if (entry === undefined) return
    if (entry.snap) {
      entry.x = v.pose.x
      entry.y = v.pose.y
      entry.heading = v.pose.heading
      entry.snap = false
    } else {
      entry.x += (v.pose.x - entry.x) * QUAD_FOLLOW
      entry.y += (v.pose.y - entry.y) * QUAD_FOLLOW
      const turn = wrapHeading(v.pose.heading - entry.heading + Math.PI) - Math.PI
      entry.heading = wrapHeading(entry.heading + turn * QUAD_FOLLOW)
    }
    const deg = (entry.heading * 180) / Math.PI
    const transform = `translate(${(entry.x - 0.5) * TILE},${(entry.y - 0.5) * TILE}) scale(${TILE / 24}) rotate(${deg} 12 12)`
    if (entry.transform !== transform) {
      entry.transform = transform
      entry.el.setAttribute('transform', transform)
    }
    if (v.kind === 'tractor' && v.hitch !== 'none') {
      const t = world.trailers.find(x => x.id === v.hitch)
      const te = trailers.get(v.hitch)
      if (t !== undefined && t.pose.kind === 'attached' && te !== undefined) {
        const p = hitchP(entry.x, entry.y, entry.heading)
        const c = trailerCenter(p, t.pose.heading)
        const td = (t.pose.heading * 180) / Math.PI
        const tt = `translate(${(c.x - 0.5) * TILE},${(c.y - 0.5) * TILE}) scale(${TILE / 24}) rotate(${td} 12 12)`
        if (te.transform !== tt) {
          te.transform = tt
          te.el.setAttribute('transform', tt)
        }
      }
    }
  })
  const driven = world.driverVehicle(world.local)
  if (driven !== undefined && driven.pose.kind === 'field' && dummyRot !== undefined) {
    const deg = (driven.pose.heading * 180) / Math.PI
    const rot = `rotate(${deg} 12 12)`
    if (dummyDeg !== rot) {
      dummyDeg = rot
      dummyRot.setAttribute('transform', rot)
    }
  }
  if (driven !== undefined && driven.pose.kind === 'field' && driven.kind === 'tractor' && driven.hitch !== 'none' && dummyTrailer !== undefined) {
    const t = world.trailers.find(x => x.id === driven.hitch)
    if (t !== undefined && t.pose.kind === 'attached') {
      const p = hitchP(driven.pose.x, driven.pose.y, driven.pose.heading)
      const c = trailerCenter(p, t.pose.heading)
      const td = (t.pose.heading * 180) / Math.PI
      const tt = `translate(${(c.x - driven.pose.x - 0.5) * TILE},${(c.y - driven.pose.y - 0.5) * TILE}) scale(${TILE / 24}) rotate(${td} 12 12)`
      if (dummyTrailerT !== tt) {
        dummyTrailerT = tt
        dummyTrailer.setAttribute('transform', tt)
      }
    }
  }
  if (driven !== undefined && driven.pose.kind === 'field' && dashHost !== undefined) {
    const fuelDeg = -45 + driven.fuel * 90
    const vMax = kindVMax(driven.kind)
    const speedDeg = (driven.pose.speed / vMax) * 36
    const steerDeg = world.seats[world.local].drive.steer * 90
    const fuelT = `rotate(${fuelDeg} 48 34)`
    const speedT = `rotate(${speedDeg} 120 34)`
    const steerT = `rotate(${steerDeg} 192 34)`
    if (dashFuel !== undefined && lastNeedle.fuel !== fuelT) {
      lastNeedle.fuel = fuelT
      dashFuel.setAttribute('transform', fuelT)
    }
    if (dashSpeed !== undefined && lastNeedle.speed !== speedT) {
      lastNeedle.speed = speedT
      dashSpeed.setAttribute('transform', speedT)
    }
    if (dashSteer !== undefined && lastNeedle.steer !== steerT) {
      lastNeedle.steer = steerT
      dashSteer.setAttribute('transform', steerT)
    }
    const fuelText = `F: ${Math.floor(driven.fuel * 100)}%`
    const speedText = `V: ${Math.floor(Math.abs(driven.pose.speed) * QUAD_SHOW_MUL)} km/h`
    if (dashFuelReadout !== undefined && lastDash.fuel !== fuelText) {
      lastDash.fuel = fuelText
      dashFuelReadout.textContent = fuelText
    }
    if (dashSpeedReadout !== undefined && lastDash.speed !== speedText) {
      lastDash.speed = speedText
      dashSpeedReadout.textContent = speedText
    }
    const hitch = driven.kind === 'tractor' && driven.hitch !== 'none' ? world.trailers.find(t => t.id === driven.hitch) : undefined
    const usedText = hitch === undefined ? '' : `${trailerUsed(hitch)}/${TRAILER_CAP}`
    if (dashUsedReadout !== undefined && lastDash.used !== usedText) {
      lastDash.used = usedText
      dashUsedReadout.textContent = usedText
    }
  }
  const phase = world.clock.phase()
  const dayText = `Day ${world.clock.day} · ${PHASE_NAME[phase]}`
  const clock = hud.get('clock')
  if (clock !== undefined) {
    if (clock.textContent !== dayText) clock.textContent = dayText
    const t = String(Math.floor(world.clock.t))
    if (last.clockT !== t) {
      last.clockT = t
      clock.setAttribute('data-clock-t', t)
    }
  }
  const daybar = hud.get('day-bar')
  if (daybar instanceof HTMLElement) {
    const w = `${(world.clock.t / DAY_SECONDS) * 100}%`
    if (last.dayWidth !== w) {
      last.dayWidth = w
      daybar.style.width = w
    }
  }
  const phaseHtml = UI_PHASE[phase]
  if (phaseUse !== undefined && last.phase !== phaseHtml) {
    last.phase = phaseHtml
    phaseUse.setAttribute('href', symHref(phaseHtml))
  }
  const job = world.job
  const research = hud.get('research')
  if (research instanceof HTMLElement) {
    if (job.kind === 'run') {
      research.hidden = false
      const def = RESEARCH[job.id]
      const left = research.querySelector('[data-research-left]')
      if (left !== null) left.textContent = def.name
      const secs = research.querySelector('[data-research-secs]')
      const secsText = `${Math.ceil(job.left)}s`
      if (secs !== null && last.secs !== secsText) {
        last.secs = secsText
        secs.textContent = secsText
      }
      const bar = research.querySelector('[data-research-bar]')
      if (bar instanceof HTMLElement) {
        const w = `${((def.seconds - job.left) / def.seconds) * 100}%`
        if (last.bar !== w) {
          last.bar = w
          bar.style.width = w
        }
      }
    } else {
      research.hidden = true
    }
  }
  const qbar = hud.get('queue-bar')
  if (qbar instanceof HTMLElement) {
    const w = `${world.taskProgress() * 100}%`
    if (last.queue !== w) {
      last.queue = w
      qbar.style.width = w
    }
  }
  const banner = hud.get('banner')
  if (banner instanceof HTMLElement) {
    const on = world.clock.banner > 0 && world.seam.kind === 'play'
    const text = on ? `Day ${world.clock.day}` : ''
    if (banner.hidden !== !on) banner.hidden = !on
    if (on && banner.textContent !== text) banner.textContent = text
  }
  const speech = hud.get('speech')
  if (speech instanceof SVGForeignObjectElement) {
    if (world.speech.kind === 'none') {
      speech.setAttribute('visibility', 'hidden')
    } else {
      speech.setAttribute('visibility', 'visible')
      const speaker = world.seats[world.local]
      speech.setAttribute('x', String(speaker.actor.x * TILE - 100))
      speech.setAttribute('y', String((speaker.actor.y - 0.5) * TILE - 24))
      if (speechText !== undefined) speechText.textContent = world.speech.text
    }
  }
  bars.forEach(entry => {
    const cell = world.cell({ col: entry.col, row: entry.row })
    if (entry.kind === 'thirst') {
      if (cell.kind !== 'growing') return
      paintBar(entry, ((TILE - 6) * cell.soil.water) / SOIL_WATER_MAX)
      return
    }
    if (entry.kind === 'fert') {
      if (cell.kind !== 'growing') return
      paintBar(entry, (TILE - 6) * cell.soil.fertilizer)
      return
    }
    if (entry.kind === 'fresh') {
      if (cell.kind !== 'ripe') return
      paintBar(entry, (TILE - 6) * cell.plant.freshness)
      return
    }
    if (cell.kind !== 'compost-box') return
    const t = cell.units < COMPOST_NEED ? cell.units / COMPOST_NEED : cell.progress
    paintBar(entry, (TILE - 6) * t)
    const fill = cell.units < COMPOST_NEED ? WASH : GOOD
    if (entry.el.getAttribute('fill') !== fill) entry.el.setAttribute('fill', fill)
  })
}
