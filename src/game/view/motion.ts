import { RESEARCH } from '../defs/research.ts'
import { COMPOST_NEED } from '../defs/items.ts'
import { SOIL_WATER_MAX } from '../sim/soil.ts'
import { DAY_SECONDS, PHASE_NAME } from '../sim/clock.ts'
import type { Coord } from '../sim/building.ts'
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
    if (s.presence !== 'in') {
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
