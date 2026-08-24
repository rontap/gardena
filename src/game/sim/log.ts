import type { AdditiveId, ChunkId } from './building.ts'
import type { Rarity } from '../defs/rarity.ts'
import type {
  AnnualId,
  HarvestSlot,
  MemberId,
  ResearchId,
  SkuId,
  StallGoodId,
  TrailerId,
  TrailerKind,
  VehicleId,
  VehicleKind,
  VehicleSlot,
} from './ids.ts'
import type { Edge, Sprinkler, Tune } from './pipe.ts'
import type { WireEnd } from './sensor.ts'
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
  takeStore: 'S',
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
  drive: 'V',
  stride: 'K',
  buyVehicle: 'Q',
  buyTrailer: 'T',
  deploy: 'D',
  embark: 'B',
  disembark: 'E',
  dock: 'P',
  swapVehicle: 'H',
  swapTrailer: 'A',
  refill: 'F',
  setBoom: 'W',
  armWire: 'R',
  placeWire: 'N',
  placeSmartValve: 'I',
  tuneWater: 'C',
  tuneHarvest: 'G',
  tuneCounter: 'M',
  resetCounter: 'X',
  tuneDay: 'O',
  load: 'L',
  unload: 'U',
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
  | { a: typeof Act.delete; t: number; p: SeatId; k: 'wire'; from: WireEnd; to: WireEnd }
  | { a: typeof Act.delete; t: number; p: SeatId; k: 'smart'; e: Edge }
  | { a: typeof Act.expand; t: number; p: SeatId; k: ChunkId }
  | { a: typeof Act.startResearch; t: number; p: SeatId; r: ResearchId }
  | { a: typeof Act.pickSkill; t: number; p: SeatId; m: MemberId; s: number }
  | { a: typeof Act.sellAll; t: number; p: SeatId }
  | { a: typeof Act.nudgeOffered; t: number; p: SeatId; g: StallGoodId; d: 1 | -1 }
  | { a: typeof Act.swap; t: number; p: SeatId; i: number }
  | { a: typeof Act.swapChest; t: number; p: SeatId; c: XY; i: number }
  | { a: typeof Act.takeStore; t: number; p: SeatId; k: 'silo'; c: AnnualId; r: Rarity }
  | { a: typeof Act.takeStore; t: number; p: SeatId; k: 'additive'; d: AdditiveId }
  | { a: typeof Act.tuneSprinkler; t: number; p: SeatId; c: XY; u: Tune }
  | { a: typeof Act.openHud; t: number; p: SeatId; k: 'sprinkler' | 'water' | 'harvest' | 'counter' | 'day'; c: XY }
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
  | { a: typeof Act.drive; t: number; p: SeatId; throttle: -1 | 0 | 1; steer: -1 | 0 | 1 }
  | { a: typeof Act.stride; t: number; p: SeatId; x: -1 | 0 | 1; y: -1 | 0 | 1 }
  | { a: typeof Act.buyVehicle; t: number; p: SeatId; c: XY; k: VehicleKind }
  | { a: typeof Act.buyTrailer; t: number; p: SeatId; c: XY; k: TrailerKind }
  | { a: typeof Act.deploy; t: number; p: SeatId; v: VehicleId; c: XY; hitch: TrailerId | 'none' }
  | { a: typeof Act.embark; t: number; p: SeatId; v: VehicleId }
  | { a: typeof Act.disembark; t: number; p: SeatId }
  | { a: typeof Act.dock; t: number; p: SeatId }
  | { a: typeof Act.swapVehicle; t: number; p: SeatId; v: VehicleId; i: VehicleSlot }
  | { a: typeof Act.swapTrailer; t: number; p: SeatId; u: TrailerId; i: HarvestSlot }
  | { a: typeof Act.refill; t: number; p: SeatId; c: XY }
  | { a: typeof Act.setBoom; t: number; p: SeatId; w: 3 | 5 }
  | { a: typeof Act.armWire; t: number; p: SeatId; from: WireEnd }
  | { a: typeof Act.placeWire; t: number; p: SeatId; from: WireEnd; to: WireEnd }
  | { a: typeof Act.placeSmartValve; t: number; p: SeatId; e: Edge }
  | { a: typeof Act.tuneWater; t: number; p: SeatId; c: XY; wilt: boolean; over: boolean }
  | { a: typeof Act.tuneHarvest; t: number; p: SeatId; c: XY; mode: 'any' | 'all' }
  | { a: typeof Act.tuneCounter; t: number; p: SeatId; c: XY; n: number }
  | { a: typeof Act.resetCounter; t: number; p: SeatId; c: XY }
  | { a: typeof Act.tuneDay; t: number; p: SeatId; c: XY; sunrise: boolean; day: boolean; sunset: boolean; twilight: boolean }
  | { a: typeof Act.load; t: number; p: SeatId }
  | { a: typeof Act.unload; t: number; p: SeatId }

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
