import type { ChunkId } from './building.ts'
import type { MemberId, ResearchId, SkuId, StallGoodId } from './ids.ts'
import type { Edge, Sprinkler, Tune } from './pipe.ts'
import type { Intent } from './world.ts'

export type XY = [col: number, row: number]

export const Act = {
  click: 'c',
  clickValve: 'v',
  clickWell: 'e',
  enqueue: 'q',
  buy: 'b',
  buyPacks: 'p',
  placePipe: 'y',
  placeSprinkler: 'n',
  delete: 'd',
  expand: 'x',
  startResearch: 'r',
  pickSkill: 'k',
  sellAll: 's',
  nudgeOffered: 'o',
  swap: 'w',
  swapChest: 'h',
  tuneSprinkler: 't',
  openHud: 'j',
  closeHud: 'l',
  armDelete: 'm',
  cancelPlace: 'f',
  rotatePlace: 'g',
  dismissRecap: 'i',
  ackCue: 'a',
  rightClick: 'z',
  cheat: 'u',
} as const

export type Act = (typeof Act)[keyof typeof Act]

export type WorkerIn =
  | { kind: 'cmd'; cmd: Cmd }
  | { kind: 'reset'; seed: number }
  | { kind: 'dump' }

export type Cmd =
  | { a: typeof Act.click; t: number; c: XY }
  | { a: typeof Act.clickValve; t: number; e: Edge }
  | { a: typeof Act.clickWell; t: number; e: Edge }
  | { a: typeof Act.enqueue; t: number; i: Intent }
  | { a: typeof Act.buy; t: number; s: SkuId }
  | { a: typeof Act.buyPacks; t: number; s: SkuId }
  | { a: typeof Act.placePipe; t: number; e: Edge }
  | { a: typeof Act.placeSprinkler; t: number; s: Sprinkler }
  | { a: typeof Act.delete; t: number; k: 'pipe'; e: Edge }
  | { a: typeof Act.delete; t: number; k: 'well'; e: Edge }
  | { a: typeof Act.delete; t: number; k: 'sprinkler'; c: XY }
  | { a: typeof Act.delete; t: number; k: 'building'; c: XY }
  | { a: typeof Act.expand; t: number; k: ChunkId }
  | { a: typeof Act.startResearch; t: number; r: ResearchId }
  | { a: typeof Act.pickSkill; t: number; m: MemberId; s: number }
  | { a: typeof Act.sellAll; t: number }
  | { a: typeof Act.nudgeOffered; t: number; g: StallGoodId; d: 1 | -1 }
  | { a: typeof Act.swap; t: number; i: number }
  | { a: typeof Act.swapChest; t: number; c: XY; i: number }
  | { a: typeof Act.tuneSprinkler; t: number; c: XY; u: Tune }
  | { a: typeof Act.openHud; t: number; c: XY }
  | { a: typeof Act.closeHud; t: number }
  | { a: typeof Act.armDelete; t: number }
  | { a: typeof Act.cancelPlace; t: number }
  | { a: typeof Act.rotatePlace; t: number }
  | { a: typeof Act.dismissRecap; t: number }
  | { a: typeof Act.ackCue; t: number }
  | { a: typeof Act.rightClick; t: number; c: XY }
  | { a: typeof Act.cheat; t: number; k: 'all' }
  | { a: typeof Act.cheat; t: number; k: 'money' }
  | { a: typeof Act.cheat; t: number; k: 'points' }
  | { a: typeof Act.cheat; t: number; k: 'research' }

export type LogSink = { push(cmd: Cmd): void; reset(seed: number): void }

export class MemorySink implements LogSink {
  cmds: Cmd[] = []
  push(cmd: Cmd): void {
    this.cmds.push(cmd)
  }
  reset(_seed: number): void {
    this.cmds.length = 0
  }
}

export class WorkerSink implements LogSink {
  private readonly worker: Worker
  constructor(worker: Worker) {
    this.worker = worker
  }
  push(cmd: Cmd): void {
    const msg: WorkerIn = { kind: 'cmd', cmd }
    this.worker.postMessage(msg)
  }
  reset(seed: number): void {
    const msg: WorkerIn = { kind: 'reset', seed }
    this.worker.postMessage(msg)
  }
  terminate(): void {
    this.worker.terminate()
  }
}
