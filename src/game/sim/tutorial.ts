import type { Item } from './item.ts'
import { isTilled } from './plot.ts'
import { STALL_IDS, binCount } from './stall.ts'
import { waterBand } from './soil.ts'
import type { World } from './world.ts'

export type TutorialStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export type Tutorial =
  | { kind: 'off' }
  | { kind: 'on'; step: TutorialStep; poured: boolean; sold: boolean }

export function startTutorial(path: 'new' | 'load' | 'upload' | 'start_now', slotExists: boolean): Tutorial {
  if (path !== 'new') return { kind: 'off' }
  if (slotExists) return { kind: 'off' }
  return { kind: 'on', step: 1, poured: false, sold: false }
}

export function check(world: World, tutorial: Tutorial): Tutorial {
  if (tutorial.kind === 'off') return tutorial
  const d = dones(world, tutorial)
  let need: TutorialStep = 9
  for (const n of STEPS) {
    if (!d[n]) {
      need = n
      break
    }
  }
  const step = need > tutorial.step ? need : tutorial.step
  return { kind: 'on', step, poured: tutorial.poured, sold: tutorial.sold }
}

export function ready(step: TutorialStep, world: World, tutorial: Extract<Tutorial, { kind: 'on' }>): boolean {
  const h = helpers(world, tutorial)
  switch (step) {
    case 1:
      return true
    case 2:
      return h.tilledCount >= 1
    case 3:
      return h.tilledCount >= 5
    case 4:
      return h.holdingSeeds
    case 5:
      return h.planted
    case 6:
      return h.wilted
    case 7:
      return h.ripe
    case 8:
      return h.hasFruit || h.stallStocked
    case 9:
      return h.sold
  }
}

const STEPS: TutorialStep[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]

function dones(world: World, tutorial: Extract<Tutorial, { kind: 'on' }>): { [K in TutorialStep]: boolean } {
  const h = helpers(world, tutorial)
  return {
    1: h.tilledCount >= 1,
    2: h.tilledCount >= 5,
    3: h.holdingSeeds || h.planted,
    4: h.planted,
    5: h.researchStarted,
    6: h.poured || h.ripe || h.hasFruit || h.sold,
    7: h.hasFruit,
    8: h.sold,
    9: false,
  }
}

function helpers(world: World, tutorial: Extract<Tutorial, { kind: 'on' }>) {
  let tilledCount = 0
  let planted = false
  let wilted = false
  let ripe = false
  const found: Item[] = []
  const seat = world.seats[world.local]
  if (seat.hand.kind === 'hold') found.push(seat.hand.item)
  seat.inventory.forEach(s => {
    if (s.kind === 'hold') found.push(s.item)
  })
  world.drops.forEach(d => found.push(d.item))
  world.forEachCell((_at, c) => {
    if (isTilled(c)) tilledCount += 1
    if (c.kind === 'growing' || c.kind === 'ripe' || c.kind === 'dead' || c.kind === 'rotten') planted = true
    if (c.kind === 'ripe') ripe = true
    if (c.kind === 'growing') {
      if (waterBand(c.soil.water, c.plant.stats(world.modifiers).waterTolerance) === 'red') wilted = true
    }
    if (c.kind === 'chest') {
      c.slots.forEach(s => {
        if (s.kind === 'hold') found.push(s.item)
      })
    }
  })
  const holdingSeeds = seat.hand.kind === 'hold' && seat.hand.item.kind === 'seeds'
  const hasFruit = found.some(it => it.kind === 'fruit')
  const researchStarted = world.job.kind === 'run' || world.done.size > 0
  const stallStocked = STALL_IDS.some(id => binCount(world.stall[id]) > 0)
  return {
    tilledCount,
    holdingSeeds,
    planted,
    wilted,
    ripe,
    hasFruit,
    researchStarted,
    stallStocked,
    poured: tutorial.poured,
    sold: tutorial.sold,
  }
}
