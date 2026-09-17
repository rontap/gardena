// COMMANDMENT: never test specifically for versions, ever. expect(GAME_VERSION).toBe is disallowed.
import { describe, expect, test } from 'vitest'
import { Plant } from './plant.ts'
import { dump, parse } from './feature-save/save.ts'
import { Soil, SOIL_WATER_MID } from './soil.ts'
import { markTutorial, startTutorial, tutorialStep, tutorialTick, type TutorialMark, type TutorialStep } from './tutorial.ts'
import { World } from './world.ts'

function bed(): Soil {
  return new Soil(SOIL_WATER_MID, 1, 0.03)
}

function chain(w: World, step: TutorialStep, marks: TutorialMark[]): void {
  w.tutorial = { kind: 'chain', step, marks }
}

function stepOf(w: World): TutorialStep | undefined {
  const t = w.tutorial
  return t.kind === 'chain' ? t.step : undefined
}

function dig(w: World, n: number): void {
  for (let i = 0; i < n; i++) w.setCell({ col: 10 + i, row: 12 }, { kind: 'empty', soil: bed() })
}

function grow(w: World, n: number, crop: 'carrot' | 'tomato'): void {
  for (let i = 0; i < n; i++) {
    w.setCell({ col: 10 + i, row: 12 }, { kind: 'growing', soil: bed(), plant: new Plant(crop, 'base', 0) })
  }
}

describe('tutorial.on', () => {
  test('The chain starts only at New Game with `!slotExists()`. A stored farm, `start_now`, Load and Upload are all off, and a fresh `World` is off until App says otherwise.', () => {
    expect(startTutorial('new', false)).toEqual({ kind: 'chain', step: 1, marks: [] })
    expect(startTutorial('new', true).kind).toBe('off')
    expect(startTutorial('start_now', false).kind).toBe('off')
    expect(startTutorial('start_now', true).kind).toBe('off')
    expect(startTutorial('load', false).kind).toBe('off')
    expect(startTutorial('load', true).kind).toBe('off')
    expect(startTutorial('upload', false).kind).toBe('off')
    expect(startTutorial('upload', true).kind).toBe('off')
    expect(new World(1).tutorial.kind).toBe('off')
  })
})

describe('tutorial.save', () => {
  test('Step, marks, fired lines and `delivered` ride on `Save`. A load resumes the step the farm was on.', () => {
    const w = new World(1)
    chain(w, 5, ['poured', 'filled'])
    w.delivered = 12
    const mid = parse(JSON.stringify(dump(w)))
    expect(mid.ok).toBe(true)
    if (!mid.ok) return
    expect(mid.world.tutorial).toEqual({ kind: 'chain', step: 5, marks: ['poured', 'filled'] })
    expect(mid.world.delivered).toBe(12)
    const w2 = new World(1)
    w2.tutorial = { kind: 'events', fired: ['research'] }
    const after = parse(JSON.stringify(dump(w2)))
    expect(after.ok).toBe(true)
    if (!after.ok) return
    expect(after.world.tutorial).toEqual({ kind: 'events', fired: ['research'] })
  })
})

describe('tutorial.steps', () => {
  test('The nine steps finish on tilled plots, seeds in hand, plants standing, the poured / filled / placed / fertilized marks, and one fruit delivered. Any crop counts.', () => {
    const w = new World(1)
    chain(w, 1, [])
    tutorialTick(w)
    expect(stepOf(w)).toBe(1)
    dig(w, 4)
    tutorialTick(w)
    expect(stepOf(w)).toBe(2)
    w.seats[0].hand = { kind: 'hold', item: { kind: 'seeds', crop: 'tomato', variety: 'base', quality: 0, count: 4 } }
    tutorialTick(w)
    expect(stepOf(w)).toBe(3)
    grow(w, 4, 'tomato')
    tutorialTick(w)
    expect(stepOf(w)).toBe(4)
    markTutorial(w, 'poured')
    tutorialTick(w)
    expect(stepOf(w)).toBe(5)
    markTutorial(w, 'filled')
    tutorialTick(w)
    expect(stepOf(w)).toBe(5)
    markTutorial(w, 'placed')
    tutorialTick(w)
    expect(stepOf(w)).toBe(6)
    w.delivered = 1
    tutorialTick(w)
    expect(stepOf(w)).toBe(7)
    grow(w, 6, 'carrot')
    tutorialTick(w)
    expect(stepOf(w)).toBe(8)
    markTutorial(w, 'fertilized')
    tutorialTick(w)
    expect(stepOf(w)).toBe(9)
  })

  test('The step never decreases. Losing the plants that finished a step does not walk the chain back.', () => {
    const w = new World(1)
    chain(w, 1, [])
    dig(w, 4)
    grow(w, 4, 'carrot')
    tutorialTick(w)
    expect(stepOf(w)).toBe(4)
    for (let i = 0; i < 4; i++) w.setCell({ col: 10 + i, row: 12 }, { kind: 'empty', soil: bed() })
    tutorialTick(w)
    expect(stepOf(w)).toBe(4)
  })
})

describe('tutorial.ripe', () => {
  test('Step 6 shows nothing until a crop is ripe. Every other step shows as soon as it is reached.', () => {
    const w = new World(1)
    chain(w, 6, [])
    expect(tutorialStep(w)).toBeUndefined()
    w.setCell({ col: 10, row: 12 }, { kind: 'ripe', soil: bed(), plant: new Plant('carrot', 'base', 0) })
    expect(tutorialStep(w)).toBe(6)
    chain(w, 3, [])
    expect(tutorialStep(w)).toBe(3)
  })
})

describe('tutorial.dismiss', () => {
  test('`seeTutorial` closes the chain at step 9 and does nothing on steps 1 to 8. A closed chain hands over to the event-bound lines.', () => {
    const w = new World(1)
    chain(w, 8, [])
    w.seeTutorial()
    expect(w.tutorial).toEqual({ kind: 'chain', step: 8, marks: [] })
    chain(w, 9, [])
    w.seeTutorial()
    expect(w.tutorial).toEqual({ kind: 'events', fired: [] })
    w.seeTutorial()
    expect(w.tutorial).toEqual({ kind: 'events', fired: [] })
  })
})

describe('tutorial.events', () => {
  test('The research line waits for day 2 and money over 20, and skips when a job runs or anything is already researched.', () => {
    const w = new World(1)
    w.tutorial = { kind: 'events', fired: [] }
    w.money = 100
    tutorialTick(w)
    expect(w.tutorial).toEqual({ kind: 'events', fired: [] })
    w.clock.day = 2
    tutorialTick(w)
    expect(w.tutorial.kind === 'events' && w.tutorial.fired).toContain('research')
    const running = new World(1)
    running.tutorial = { kind: 'events', fired: [] }
    running.money = 100
    running.clock.day = 2
    running.job = { kind: 'run', id: 'unlock-multi-crop', left: 5 }
    tutorialTick(running)
    expect(running.tutorial.kind === 'events' && running.tutorial.fired).not.toContain('research')
    const doneAlready = new World(1)
    doneAlready.tutorial = { kind: 'events', fired: [] }
    doneAlready.money = 100
    doneAlready.clock.day = 2
    doneAlready.done.add('unlock-multi-crop')
    tutorialTick(doneAlready)
    expect(doneAlready.tutorial.kind === 'events' && doneAlready.tutorial.fired).not.toContain('research')
  })

  test('The sprinkler line waits for day 5 and skips once automated irrigation is researched. The contracts line waits for 30 delivered fruit and skips once contracts are researched.', () => {
    const w = new World(1)
    w.tutorial = { kind: 'events', fired: [] }
    w.clock.day = 5
    w.delivered = 30
    tutorialTick(w)
    expect(w.tutorial.kind === 'events' && w.tutorial.fired).toContain('irrigation')
    expect(w.tutorial.kind === 'events' && w.tutorial.fired).toContain('contracts')
    const researched = new World(1)
    researched.tutorial = { kind: 'events', fired: [] }
    researched.clock.day = 5
    researched.delivered = 30
    researched.done.add('unlock-auto-irrigation')
    researched.done.add('unlock-contracts')
    tutorialTick(researched)
    expect(researched.tutorial.kind === 'events' && researched.tutorial.fired).not.toContain('irrigation')
    expect(researched.tutorial.kind === 'events' && researched.tutorial.fired).not.toContain('contracts')
  })

  test('Each event-bound line fires once. A second pass with the condition still holding adds nothing.', () => {
    const w = new World(1)
    w.tutorial = { kind: 'events', fired: [] }
    w.clock.day = 5
    w.money = 0
    tutorialTick(w)
    tutorialTick(w)
    tutorialTick(w)
    expect(w.tutorial.kind === 'events' && w.tutorial.fired).toEqual(['irrigation'])
  })

  test('A farm whose tutorial is off never fires a line.', () => {
    const w = new World(1)
    w.clock.day = 9
    w.money = 500
    w.delivered = 90
    tutorialTick(w)
    expect(w.tutorial).toEqual({ kind: 'off' })
  })
})
