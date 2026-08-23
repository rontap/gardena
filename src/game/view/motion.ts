import { RESEARCH } from '../defs/research.ts'
import { COMPOST_NEED } from '../defs/items.ts'
import { SOIL_WATER_MAX } from '../sim/soil.ts'
import { DAY_SECONDS, PHASE_NAME } from '../sim/clock.ts'
import type { Coord } from '../sim/building.ts'
import type { SeatId, World } from '../sim/world.ts'
import { TILE } from './camera.ts'
import { UI_PHASE } from './svgs.ts'

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
const actors = new Map<SeatId, SVGGElement>()

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
  else actors.set(id, el)
}

function paintBar(entry: BarEntry, width: number): void {
  const next = String(width)
  if (entry.last === next) return
  entry.last = next
  entry.el.setAttribute('width', next)
}

const last = { clockT: '', dayWidth: '', phase: '', secs: '', bar: '', queue: '' }

export function paintMotion(root: HTMLElement, world: World): void {
  world.seats.forEach(s => {
    const el = actors.get(s.id)
    if (el === undefined || s.napping) return
    if (s.presence !== 'in') {
      el.setAttribute('visibility', 'hidden')
      return
    }
    el.setAttribute('visibility', 'visible')
    el.setAttribute(
      'transform',
      `translate(${(s.actor.x - 0.5) * TILE},${(s.actor.y - 0.5) * TILE}) scale(${TILE / 24})`,
    )
  })
  const phase = world.clock.phase()
  const dayText = `Day ${world.clock.day} · ${PHASE_NAME[phase]}`
  const clock = root.querySelector('[data-clock]')
  if (clock !== null) {
    if (clock.textContent !== dayText) clock.textContent = dayText
    const t = String(Math.floor(world.clock.t))
    if (last.clockT !== t) {
      last.clockT = t
      clock.setAttribute('data-clock-t', t)
    }
  }
  const daybar = root.querySelector('[data-day-bar]')
  if (daybar instanceof HTMLElement) {
    const w = `${(world.clock.t / DAY_SECONDS) * 100}%`
    if (last.dayWidth !== w) {
      last.dayWidth = w
      daybar.style.width = w
    }
  }
  const phaseEl = root.querySelector('[data-phase]')
  const phaseHtml = UI_PHASE[phase]
  if (phaseEl !== null && last.phase !== phaseHtml) {
    last.phase = phaseHtml
    phaseEl.innerHTML = phaseHtml
  }
  const job = world.job
  const research = root.querySelector('[data-research]')
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
  const qbar = root.querySelector('[data-queue-bar]')
  if (qbar instanceof HTMLElement) {
    const w = `${world.taskProgress() * 100}%`
    if (last.queue !== w) {
      last.queue = w
      qbar.style.width = w
    }
  }
  const banner = root.querySelector('[data-banner]')
  if (banner instanceof HTMLElement) {
    const on = world.clock.banner > 0 && world.seam.kind === 'play'
    const text = on ? `Day ${world.clock.day}` : ''
    if (banner.hidden !== !on) banner.hidden = !on
    if (on && banner.textContent !== text) banner.textContent = text
  }
  const speech = root.querySelector('[data-speech]')
  if (speech instanceof SVGForeignObjectElement) {
    if (world.speech.kind === 'none') {
      speech.setAttribute('visibility', 'hidden')
    } else {
      speech.setAttribute('visibility', 'visible')
      const speaker = world.seats[world.local]
      speech.setAttribute('x', String(speaker.actor.x * TILE - 100))
      speech.setAttribute('y', String((speaker.actor.y - 0.5) * TILE - 24))
      const line = speech.querySelector('[data-speech-text]')
      if (line !== null) line.textContent = world.speech.text
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
