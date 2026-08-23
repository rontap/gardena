import { describe, expect, test } from 'vitest'
import { Act, type Cmd } from './log.ts'

describe('0.9 log', () => {
  test('JSON.parse(JSON.stringify(cmd)) equals that Cmd arm', () => {
    const cmds: Cmd[] = [
      { a: Act.click, t: 0, p: 0, c: [1, 2] },
      { a: Act.clickValve, t: 1, p: 0, e: { axis: 'h', col: 0, row: 0 } },
      { a: Act.enqueue, t: 2, p: 0, i: { act: 'walk', at: { col: 1, row: 2 } } },
      { a: Act.enqueue, t: 2, p: 0, i: { act: 'valve', at: { col: 1, row: 2 }, edge: { axis: 'v', col: 1, row: 2 } } },
      { a: Act.buy, t: 3, p: 0, s: 'pack-carrot' },
      { a: Act.buyPacks, t: 4, p: 0, s: 'pack-carrot' },
      { a: Act.placePipe, t: 5, p: 0, e: { axis: 'v', col: 1, row: 1 } },
      { a: Act.placeSprinkler, t: 6, p: 0, s: { variant: 'basic', at: { col: 1, row: 1 }, tune: { kind: 'flat' } } },
      { a: Act.placeSprinkler, t: 6, p: 0, s: { variant: 'vert', at: { col: 2, row: 2 }, facing: 'ew', tune: { kind: 'crop', crop: 'wheat' } } },
      { a: Act.placeSprinkler, t: 6, p: 0, s: { variant: 'large', at: { col: 3, row: 3 }, tune: { kind: 'flat' } } },
      { a: Act.delete, t: 7, p: 0, k: 'pipe', e: { axis: 'h', col: 2, row: 2 } },
      { a: Act.delete, t: 8, p: 0, k: 'sprinkler', c: [3, 3] },
      { a: Act.delete, t: 9, p: 0, k: 'building', c: [4, 4] },
      { a: Act.expand, t: 10, p: 0, k: { cx: 1, cy: 0 } },
      { a: Act.startResearch, t: 11, p: 0, r: 'unlock-expand' },
      { a: Act.pickSkill, t: 12, p: 0, m: 'husband', s: 2 },
      { a: Act.sellAll, t: 13, p: 0 },
      { a: Act.nudgeOffered, t: 14, p: 0, g: 'sugar', d: -1 },
      { a: Act.swap, t: 15, p: 0, i: 0 },
      { a: Act.swapChest, t: 16, p: 0, c: [5, 5], i: 1 },
      { a: Act.tuneSprinkler, t: 17, p: 0, c: [6, 6], u: { kind: 'crop', crop: 'carrot' } },
      { a: Act.openHud, t: 18, p: 0, c: [7, 7] },
      { a: Act.closeHud, t: 19, p: 0 },
      { a: Act.armDelete, t: 20, p: 0 },
      { a: Act.cancelPlace, t: 21, p: 0 },
      { a: Act.rotatePlace, t: 22, p: 0 },
      { a: Act.dismissRecap, t: 23, p: 0 },
      { a: Act.ackCue, t: 24, p: 0 },
      { a: Act.rightClick, t: 25, p: 0, c: [8, 8] },
      { a: Act.cheat, t: 26, p: 0, k: 'all' },
      { a: Act.cheat, t: 27, p: 0, k: 'money' },
      { a: Act.cheat, t: 28, p: 0, k: 'points' },
      { a: Act.cheat, t: 29, p: 0, k: 'research' },
      { a: Act.drive, t: 30, p: 0, throttle: 1, steer: -1 },
      { a: Act.buyVehicle, t: 31, p: 0, c: [1, 2] },
      { a: Act.deploy, t: 32, p: 0, v: 1, c: [3, 4] },
      { a: Act.embark, t: 33, p: 0, v: 1 },
      { a: Act.disembark, t: 34, p: 0 },
      { a: Act.dock, t: 35, p: 0 },
      { a: Act.swapVehicle, t: 36, p: 0, v: 1, i: 2 },
      { a: Act.refill, t: 37, p: 0, c: [5, 6] },
    ]
    cmds.forEach(cmd => {
      expect(JSON.parse(JSON.stringify(cmd))).toEqual(cmd)
    })
  })
})
