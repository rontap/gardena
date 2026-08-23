import { describe, expect, test } from 'vitest'
import { Act, type Cmd } from './log.ts'

describe('0.9 log', () => {
  test('JSON.parse(JSON.stringify(cmd)) equals that Cmd arm', () => {
    const cmds: Cmd[] = [
      { a: Act.click, t: 0, c: [1, 2] },
      { a: Act.clickValve, t: 1, e: { axis: 'h', col: 0, row: 0 } },
      { a: Act.enqueue, t: 2, i: { act: 'walk', at: { col: 1, row: 2 } } },
      { a: Act.enqueue, t: 2, i: { act: 'valve', at: { col: 1, row: 2 }, edge: { axis: 'v', col: 1, row: 2 } } },
      { a: Act.buy, t: 3, s: 'pack-carrot' },
      { a: Act.buyPacks, t: 4, s: 'pack-carrot' },
      { a: Act.placePipe, t: 5, e: { axis: 'v', col: 1, row: 1 } },
      { a: Act.placeSprinkler, t: 6, s: { variant: 'basic', at: { col: 1, row: 1 }, tune: { kind: 'flat' } } },
      { a: Act.placeSprinkler, t: 6, s: { variant: 'vert', at: { col: 2, row: 2 }, facing: 'ew', tune: { kind: 'crop', crop: 'wheat' } } },
      { a: Act.placeSprinkler, t: 6, s: { variant: 'large', at: { col: 3, row: 3 }, tune: { kind: 'flat' } } },
      { a: Act.delete, t: 7, k: 'pipe', e: { axis: 'h', col: 2, row: 2 } },
      { a: Act.delete, t: 8, k: 'sprinkler', c: [3, 3] },
      { a: Act.delete, t: 9, k: 'building', c: [4, 4] },
      { a: Act.expand, t: 10, k: { cx: 1, cy: 0 } },
      { a: Act.startResearch, t: 11, r: 'unlock-expand' },
      { a: Act.pickSkill, t: 12, m: 'husband', s: 2 },
      { a: Act.sellAll, t: 13 },
      { a: Act.nudgeOffered, t: 14, g: 'sugar', d: -1 },
      { a: Act.swap, t: 15, i: 0 },
      { a: Act.swapChest, t: 16, c: [5, 5], i: 1 },
      { a: Act.tuneSprinkler, t: 17, c: [6, 6], u: { kind: 'crop', crop: 'carrot' } },
      { a: Act.openHud, t: 18, c: [7, 7] },
      { a: Act.closeHud, t: 19 },
      { a: Act.armDelete, t: 20 },
      { a: Act.cancelPlace, t: 21 },
      { a: Act.rotatePlace, t: 22 },
      { a: Act.dismissRecap, t: 23 },
      { a: Act.ackCue, t: 24 },
      { a: Act.rightClick, t: 25, c: [8, 8] },
      { a: Act.cheat, t: 26, k: 'all' },
      { a: Act.cheat, t: 27, k: 'money' },
      { a: Act.cheat, t: 28, k: 'points' },
      { a: Act.cheat, t: 29, k: 'research' },
    ]
    cmds.forEach(cmd => {
      expect(JSON.parse(JSON.stringify(cmd))).toEqual(cmd)
    })
  })
})
