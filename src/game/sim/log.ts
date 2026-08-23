import type { ChunkId } from './building.ts'
import type { MemberId, ResearchId, SkuId, StallGoodId } from './ids.ts'
import type { Edge, Sprinkler, Tune } from './pipe.ts'
import type { Intent, SeatId } from './world.ts'

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
  | { a: typeof Act.click; t: number; p: SeatId; c: XY }
  | { a: typeof Act.clickValve; t: number; p: SeatId; e: Edge }
  | { a: typeof Act.clickWell; t: number; p: SeatId; e: Edge }
  | { a: typeof Act.enqueue; t: number; p: SeatId; i: Intent }
  | { a: typeof Act.buy; t: number; p: SeatId; s: SkuId }
  | { a: typeof Act.buyPacks; t: number; p: SeatId; s: SkuId }
  | { a: typeof Act.placePipe; t: number; p: SeatId; e: Edge }
  | { a: typeof Act.placeSprinkler; t: number; p: SeatId; s: Sprinkler }
  | { a: typeof Act.delete; t: number; p: SeatId; k: 'pipe'; e: Edge }
  | { a: typeof Act.delete; t: number; p: SeatId; k: 'well'; e: Edge }
  | { a: typeof Act.delete; t: number; p: SeatId; k: 'sprinkler'; c: XY }
  | { a: typeof Act.delete; t: number; p: SeatId; k: 'building'; c: XY }
  | { a: typeof Act.expand; t: number; p: SeatId; k: ChunkId }
  | { a: typeof Act.startResearch; t: number; p: SeatId; r: ResearchId }
  | { a: typeof Act.pickSkill; t: number; p: SeatId; m: MemberId; s: number }
  | { a: typeof Act.sellAll; t: number; p: SeatId }
  | { a: typeof Act.nudgeOffered; t: number; p: SeatId; g: StallGoodId; d: 1 | -1 }
  | { a: typeof Act.swap; t: number; p: SeatId; i: number }
  | { a: typeof Act.swapChest; t: number; p: SeatId; c: XY; i: number }
  | { a: typeof Act.tuneSprinkler; t: number; p: SeatId; c: XY; u: Tune }
  | { a: typeof Act.openHud; t: number; p: SeatId; c: XY }
  | { a: typeof Act.closeHud; t: number; p: SeatId }
  | { a: typeof Act.armDelete; t: number; p: SeatId }
  | { a: typeof Act.cancelPlace; t: number; p: SeatId }
  | { a: typeof Act.rotatePlace; t: number; p: SeatId }
  | { a: typeof Act.dismissRecap; t: number; p: SeatId }
  | { a: typeof Act.ackCue; t: number; p: SeatId }
  | { a: typeof Act.rightClick; t: number; p: SeatId; c: XY }
  | { a: typeof Act.cheat; t: number; p: SeatId; k: 'all' }
  | { a: typeof Act.cheat; t: number; p: SeatId; k: 'money' }
  | { a: typeof Act.cheat; t: number; p: SeatId; k: 'points' }
  | { a: typeof Act.cheat; t: number; p: SeatId; k: 'research' }

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
