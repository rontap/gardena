import {
  TUTORIAL_DELIVERED,
  TUTORIAL_IRRIGATION_DAY,
  TUTORIAL_PLANTS,
  TUTORIAL_PLOTS,
  TUTORIAL_RESEARCH_DAY,
  TUTORIAL_RESEARCH_MONEY,
} from '../defs/tutorial.ts'
import type { World } from './world.ts'

export type TutorialStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export type TutorialEvent = 'research' | 'irrigation' | 'contracts'

export type TutorialMark = 'poured' | 'filled' | 'placed' | 'fertilized'

export type Tutorial =
  | { kind: 'off' }
  | { kind: 'chain'; step: TutorialStep; marks: TutorialMark[] }
  | { kind: 'events'; fired: TutorialEvent[] }

export const TUTORIAL_EVENTS: readonly TutorialEvent[] = ['research', 'irrigation', 'contracts']

const STEPS: readonly TutorialStep[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export function startTutorial(path: 'new' | 'load' | 'upload' | 'start_now', slotExists: boolean): Tutorial {
  if (path !== 'new') return { kind: 'off' }
  if (slotExists) return { kind: 'off' }
  return { kind: 'chain', step: 1, marks: [] }
}

export function markTutorial(world: World, id: TutorialMark): void {
  const t = world.tutorial
  if (t.kind !== 'chain') return
  if (t.marks.includes(id)) return
  t.marks.push(id)
  world.ping()
}

type Standing = { alive: number; ripe: boolean }

function standing(world: World): Standing {
  let alive = 0
  let ripe = false
  for (const at of world.grow.values()) {
    const c = world.cell(at)
    if (c.kind === 'ripe') ripe = true
    if (c.kind === 'growing' || c.kind === 'ripe') alive += 1
  }
  return { alive, ripe }
}

function holdingSeeds(world: World): boolean {
  const hand = world.seats[0].hand
  return hand.kind === 'hold' && hand.item.kind === 'seeds'
}

function done(world: World, t: Extract<Tutorial, { kind: 'chain' }>, n: TutorialStep, s: Standing): boolean {
  switch (n) {
    case 1:
      return world.tilled.size >= TUTORIAL_PLOTS
    case 2:
      return holdingSeeds(world) || s.alive > 0
    case 3:
      return s.alive >= TUTORIAL_PLOTS
    case 4:
      return t.marks.includes('poured')
    case 5:
      return t.marks.includes('filled') && t.marks.includes('placed')
    case 6:
      return world.delivered > 0
    case 7:
      return s.alive >= TUTORIAL_PLANTS
    case 8:
      return t.marks.includes('fertilized')
    case 9:
      return false
  }
}

export function tutorialStep(world: World): TutorialStep | undefined {
  const t = world.tutorial
  if (t.kind !== 'chain') return undefined
  if (t.step !== 6) return t.step
  return standing(world).ripe ? 6 : undefined
}

export function eventHolds(world: World, id: TutorialEvent): boolean {
  if (id === 'research') {
    if (world.clock.day < TUTORIAL_RESEARCH_DAY) return false
    if (world.money <= TUTORIAL_RESEARCH_MONEY) return false
    return world.job.kind !== 'run' && world.done.size === 0
  }
  if (id === 'irrigation') {
    return world.clock.day >= TUTORIAL_IRRIGATION_DAY && !world.done.has('unlock-auto-irrigation')
  }
  return world.delivered >= TUTORIAL_DELIVERED && !world.done.has('unlock-contracts')
}

export function tutorialTick(world: World): void {
  const t = world.tutorial
  if (t.kind === 'off') return
  if (t.kind === 'chain') {
    const s = standing(world)
    let need: TutorialStep = 9
    for (const n of STEPS) {
      if (!done(world, t, n, s)) {
        need = n
        break
      }
    }
    if (need <= t.step) return
    world.tutorial = { kind: 'chain', step: need, marks: t.marks }
    world.ping()
    return
  }
  TUTORIAL_EVENTS.forEach(id => {
    if (t.fired.includes(id)) return
    if (!eventHolds(world, id)) return
    t.fired.push(id)
    world.ping()
  })
}
