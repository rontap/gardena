import { RESEARCH } from '../defs/research.ts'
import { COMPOST_NEED } from '../defs/items.ts'
import { SOIL_WATER_MAX } from '../sim/soil.ts'
import { DAY_SECONDS, PHASE_NAME } from '../sim/clock.ts'
import type { World } from '../sim/world.ts'
import { TILE } from './camera.ts'
import { UI_PHASE } from './svgs.ts'

type MotionNodes = {
  actors: Element[]
  clock: Element | null
  phase: Element | null
  research: Element | null
  daybar: Element | null
  qbar: Element | null
  banner: Element | null
  speech: Element | null
  thirst: Element[]
  fert: Element[]
  compost: Element[]
  fresh: Element[]
}

let cacheRev = -1
let nodes: MotionNodes | undefined

function scan(root: HTMLElement): MotionNodes {
  return {
    actors: [...root.querySelectorAll('[data-actor]')],
    clock: root.querySelector('[data-clock]'),
    phase: root.querySelector('[data-phase]'),
    research: root.querySelector('[data-research]'),
    daybar: root.querySelector('[data-day-bar]'),
    qbar: root.querySelector('[data-queue-bar]'),
    banner: root.querySelector('[data-banner]'),
    speech: root.querySelector('[data-speech]'),
    thirst: [...root.querySelectorAll('[data-thirst]')],
    fert: [...root.querySelectorAll('[data-fert]')],
    compost: [...root.querySelectorAll('[data-compost]')],
    fresh: [...root.querySelectorAll('[data-fresh]')],
  }
}

export function paintMotion(root: HTMLElement, world: World, rev: number): void {
  if (nodes === undefined || cacheRev !== rev) {
    cacheRev = rev
    nodes = scan(root)
  }
  const n = nodes
  n.actors.forEach(el => {
    if (!(el instanceof SVGGElement)) return
    const id = Number(el.getAttribute('data-actor'))
    const s = world.seats.find(seat => seat.id === id)
    if (s === undefined || s.presence !== 'in') {
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
  if (n.clock !== null) {
    if (n.clock.textContent !== dayText) n.clock.textContent = dayText
    n.clock.setAttribute('data-clock-t', String(Math.floor(world.clock.t)))
  }
  if (n.daybar instanceof HTMLElement) {
    n.daybar.style.width = `${(world.clock.t / DAY_SECONDS) * 100}%`
  }
  const phaseHtml = UI_PHASE[phase]
  if (n.phase !== null && n.phase.innerHTML !== phaseHtml) n.phase.innerHTML = phaseHtml
  const job = world.job
  const research = n.research
  if (research instanceof HTMLElement) {
    if (job.kind === 'run') {
      research.hidden = false
      const def = RESEARCH[job.id]
      const left = research.querySelector('[data-research-left]')
      if (left !== null) left.textContent = def.name
      const secs = research.querySelector('[data-research-secs]')
      if (secs !== null) secs.textContent = `${Math.ceil(job.left)}s`
      const bar = research.querySelector('[data-research-bar]')
      if (bar instanceof HTMLElement) bar.style.width = `${((def.seconds - job.left) / def.seconds) * 100}%`
    } else {
      research.hidden = true
    }
  }
  if (n.qbar instanceof HTMLElement) n.qbar.style.width = `${world.taskProgress() * 100}%`
  if (n.banner instanceof HTMLElement) {
    const on = world.clock.banner > 0 && world.seam.kind === 'play'
    const text = on ? `Day ${world.clock.day}` : ''
    if (n.banner.hidden !== !on) n.banner.hidden = !on
    if (on && n.banner.textContent !== text) n.banner.textContent = text
  }
  const speech = n.speech
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
  n.thirst.forEach(el => {
    const at = el.getAttribute('data-thirst')
    if (at === null) return
    const [cs, rs] = at.split(',')
    const cell = world.cell({ col: Number(cs), row: Number(rs) })
    if (cell.kind !== 'growing') return
    if (el instanceof SVGRectElement) {
      el.setAttribute('width', String(((TILE - 6) * cell.soil.water) / SOIL_WATER_MAX))
    }
  })
  n.fert.forEach(el => {
    const at = el.getAttribute('data-fert')
    if (at === null) return
    const [cs, rs] = at.split(',')
    const cell = world.cell({ col: Number(cs), row: Number(rs) })
    if (cell.kind !== 'growing') return
    if (el instanceof SVGRectElement) el.setAttribute('width', String((TILE - 6) * cell.soil.fertilizer))
  })
  n.compost.forEach(el => {
    const at = el.getAttribute('data-compost')
    if (at === null) return
    const [cs, rs] = at.split(',')
    const cell = world.cell({ col: Number(cs), row: Number(rs) })
    if (cell.kind !== 'compost-box') return
    const bar = el.querySelector('[data-compost-bar]')
    if (bar instanceof SVGRectElement) {
      const t = cell.units < COMPOST_NEED ? cell.units / COMPOST_NEED : cell.progress
      bar.setAttribute('width', String((TILE - 6) * t))
    }
  })
  n.fresh.forEach(el => {
    const at = el.getAttribute('data-fresh')
    if (at === null) return
    const [cs, rs] = at.split(',')
    const cell = world.cell({ col: Number(cs), row: Number(rs) })
    if (cell.kind !== 'ripe') return
    if (el instanceof SVGRectElement) el.setAttribute('width', String((TILE - 6) * cell.plant.freshness))
  })
}
