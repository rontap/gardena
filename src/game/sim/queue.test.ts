import { describe, expect, test } from 'vitest'
import { m } from '../../paraglide/messages.js'
import { SHOVELS, SPEECH_S } from '../defs/items.ts'
import { BURROW_MUL } from '../defs/burrow.ts'
import { makeShovel } from './item.ts'
import { QUEUE_CAP, World } from './world.ts'

const AT = { col: 10, row: 12 }

describe('world.queue', () => {
  test('world.queue — Seat.queue length ≤ QUEUE_CAP. Further enqueueOn is a no-op and say(prompt_queue_full). Not Save.', () => {
    const w = new World(1)
    Array.from({ length: QUEUE_CAP }, () => w.enqueue({ act: 'walk', at: AT }))
    expect(w.seats[0].queue).toHaveLength(QUEUE_CAP)
    w.enqueue({ act: 'walk', at: AT })
    expect(w.seats[0].queue).toHaveLength(QUEUE_CAP)
    expect(w.speech).toEqual({ kind: 'say', text: m.prompt_queue_full(), left: SPEECH_S })
  })
})

describe('burrow.dig speed', () => {
  test('Better shovel extract is workSeconds × BURROW_MUL', () => {
    const w = new World(1)
    w.setCell(AT, {
      kind: 'untilled',
      ground: 'soft',
      hardness: 0,
      cover: { kind: 'burrow', loot: { kind: 'treasure', coins: 4 } },
    })
    w.seats[0].hand = { kind: 'hold', item: makeShovel('better-shovel') }
    w.seats[0].actor.x = AT.col + 0.5
    w.seats[0].actor.y = AT.row + 0.5
    w.click(AT)
    w.tick(1 / 60)
    expect(w.seats[0].workTotal).toBe(SHOVELS['better-shovel'].workSeconds * BURROW_MUL)
  })
})
