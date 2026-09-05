import { m } from '../../paraglide/messages.js'
import { RESEARCH } from '../defs/research.ts'
import { QUAD_SHOW_MUL, TRAILER_CAP } from '../defs/items.ts'
import { DAY_SECONDS, PHASE_NAME } from '../sim/clock.ts'
import { kindVMax, trailerUsed } from '../sim/feature-vehicles/vehicle.ts'
import type { CraftCell } from '../sim/feature-machines/recipe.ts'
import { clockText, craftState } from '../sim/feature-machines/recipe.ts'
import type { World } from '../sim/world.ts'
import { symHref, UI_PHASE } from './svgs.ts'

type HudKind =
  | 'clock'
  | 'day-bar'
  | 'phase'
  | 'research'
  | 'queue-bar'
  | 'banner'
  | 'fps'
  | 'render'
  | 'mem'
  | 'counter'
  | 'craft-fill'
  | 'craft-time'

const FPS_LOW = 60
const FPS_BAD = 25
const FPS_ORANGE = '#d69a3a'
const FPS_RED = '#c9574b'

const hud = new Map<HudKind, Element>()
let phaseUse: SVGUseElement | undefined

let dashHost: Element | undefined
let dashFuel: SVGGElement | undefined
let dashSpeed: SVGGElement | undefined
let dashSteer: SVGGElement | undefined
let dashFuelReadout: Element | undefined
let dashSpeedReadout: Element | undefined
let dashUsedReadout: Element | undefined
const lastNeedle = { fuel: '', speed: '', steer: '' }
const lastDash = { fuel: '', speed: '', used: '' }
const last = { clockT: '', dayWidth: '', phase: '', secs: '', bar: '', queue: '', fps: '', render: '', mem: '', counter: '', craftFill: '', craftTime: '' }

let craftCell: CraftCell | undefined

export function bindCraft(cell: CraftCell | undefined): void {
  craftCell = cell
  last.craftFill = ''
  last.craftTime = ''
}

export function bindDash(el: Element | null): (() => void) | undefined {
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
  return () => {
    if (dashHost === el) bindDash(null)
  }
}

export function bindHud(kind: HudKind, el: Element | null): (() => void) | undefined {
  if (el === null) {
    hud.delete(kind)
    if (kind === 'phase') phaseUse = undefined
    return
  }
  hud.set(kind, el)
  if (kind === 'phase') {
    const u = el.querySelector('use')
    phaseUse = u instanceof SVGUseElement ? u : undefined
    last.phase = ''
  }
  return () => {
    if (hud.get(kind) === el) bindHud(kind, null)
  }
}

export function paintMotion(root: HTMLElement, world: World, fps: number, tickMs: number): void {
  void root
  const driven = world.driverVehicle(world.local)
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
    const fuelText = m.vehicles_dash_fuel({ pct: Math.floor(driven.fuel * 100) })
    const speedText = m.vehicles_dash_speed({ n: Math.floor(Math.abs(driven.pose.speed) * QUAD_SHOW_MUL) })
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
  const dayText = m.hud_clock({ day: world.clock.day, phase: PHASE_NAME[phase]() })
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
      const secsText = m.hud_secs({ secs: Math.ceil(job.left) })
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
  const craft =
    craftCell === undefined ? undefined : craftState(craftCell, world.machineMul(), world.furnaceMulFor(craftCell.base))
  if (craft !== undefined && craft.kind !== 'idle') {
    const fill = craft.kind === 'working' ? craft.progress : craft.kind === 'ready' ? 1 : 0
    const w = `${(fill <= 0 ? 0 : fill >= 1 ? 1 : fill) * 100}%`
    const fillEl = hud.get('craft-fill')
    if (fillEl instanceof HTMLElement && last.craftFill !== w) {
      last.craftFill = w
      fillEl.style.width = w
    }
    const t = craft.kind === 'working' ? clockText(craft.left) : clockText(craft.recipe.duration.seconds)
    const timeEl = hud.get('craft-time')
    if (timeEl !== undefined && last.craftTime !== t) {
      last.craftTime = t
      timeEl.textContent = t
    }
  }
  const counterEl = hud.get('counter')
  if (counterEl !== undefined) {
    const target = world.hud
    if (target !== undefined && target.kind === 'counter') {
      const cell = world.cell(target.at)
      if (cell.kind === 'counter') {
        const text = String(cell.count)
        if (last.counter !== text) {
          last.counter = text
          counterEl.textContent = text
        }
      }
    }
  }
  const fpsEl = hud.get('fps')
  if (fpsEl instanceof HTMLElement) {
    const text = `${Math.round(fps)} FPS`
    if (last.fps !== text) {
      last.fps = text
      fpsEl.textContent = text
      fpsEl.style.color = fps < FPS_BAD ? FPS_RED : fps < FPS_LOW ? FPS_ORANGE : ''
    }
  }
  const renderEl = hud.get('render')
  if (renderEl !== undefined) {
    const text = `${tickMs.toFixed(1)}ms`
    if (last.render !== text) {
      last.render = text
      renderEl.textContent = text
    }
  }
  const memEl = hud.get('mem')
  if (memEl !== undefined) {
    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory
    const text = memory === undefined ? '' : `${Math.round(memory.usedJSHeapSize / 1e6)}MB`
    if (last.mem !== text) {
      last.mem = text
      memEl.textContent = text
    }
  }
  const banner = hud.get('banner')
  if (banner instanceof HTMLElement) {
    const on = world.clock.banner > 0 && world.seam.kind === 'play'
    const text = on ? m.hud_day({ day: world.clock.day }) : ''
    if (banner.hidden !== !on) banner.hidden = !on
    if (on && banner.textContent !== text) banner.textContent = text
  }
}
