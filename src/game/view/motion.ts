import { RESEARCH } from '../defs/research.ts'
import type { World } from '../sim/world.ts'
import { TILE } from './camera.ts'

export function paintMotion(root: HTMLElement, world: World): void {
  const actor = root.querySelector('[data-actor]')
  if (actor instanceof SVGGElement) {
    actor.setAttribute(
      'transform',
      `translate(${(world.actor.x - 0.5) * TILE},${(world.actor.y - 0.5) * TILE}) scale(${TILE / 24})`,
    )
  }
  const clock = root.querySelector('[data-clock]')
  if (clock !== null) clock.textContent = `day ${world.clock.day} · ${Math.floor(world.clock.remaining)}s`
  const job = world.job
  const research = root.querySelector('[data-research]')
  if (research instanceof HTMLElement) {
    if (job.kind === 'run') {
      research.hidden = false
      const def = RESEARCH[job.id]
      const left = research.querySelector('[data-research-left]')
      if (left !== null) left.textContent = `${def.name} ${Math.floor(job.left)}s`
      const bar = research.querySelector('[data-research-bar]')
      if (bar instanceof HTMLElement) bar.style.width = `${((def.seconds - job.left) / def.seconds) * 100}%`
    } else {
      research.hidden = true
    }
  }
  const qbar = root.querySelector('[data-queue-bar]')
  if (qbar instanceof HTMLElement) qbar.style.width = `${world.taskProgress() * 100}%`
  const banner = root.querySelector('[data-banner]')
  if (banner instanceof HTMLElement) {
    const on = world.clock.banner > 0 && world.seam.kind === 'play'
    banner.hidden = !on
    if (on) banner.textContent = `Day ${world.clock.day}`
  }
  const speech = root.querySelector('[data-speech]')
  if (speech instanceof SVGForeignObjectElement) {
    if (world.speech.kind === 'none') {
      speech.setAttribute('visibility', 'hidden')
    } else {
      speech.setAttribute('visibility', 'visible')
      speech.setAttribute('x', String(world.actor.x * TILE - 100))
      speech.setAttribute('y', String((world.actor.y - 0.5) * TILE - 24))
      const line = speech.querySelector('[data-speech-text]')
      if (line !== null) line.textContent = world.speech.text
    }
  }
  root.querySelectorAll('[data-thirst]').forEach(el => {
    const at = el.getAttribute('data-thirst')
    if (at === null) return
    const [cs, rs] = at.split(',')
    const cell = world.cell({ col: Number(cs), row: Number(rs) })
    if (cell.kind !== 'growing' && cell.kind !== 'ripe') return
    if (el instanceof SVGRectElement) el.setAttribute('width', String((TILE - 6) * cell.plant.thirst))
  })
}
