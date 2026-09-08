import { STARTER_FRUIT, STARTER_FRUIT_N, STARTER_TREE_GRAFTS, STARTER_VARIETY_PACKS, VARIETY, type VarietyId } from '../defs/varieties.ts'
import { TREE_IDS, type AnnualId } from './ids.ts'
import { Actor } from './actor.ts'
import { DOOR } from './building.ts'
import { makeShovel, type Hand, type Item, type Slot } from './item.ts'
import { statsOf } from './modifiers.ts'
import type { PlayerId, Presence, Seat, SeatId } from './world.h.ts'

const INV = 16

export const STARTER_SEEDS: readonly { crop: AnnualId; variety: VarietyId; quality: number; count: number }[] = [
  { crop: 'carrot', variety: 'base', quality: 0, count: 7 },
  { crop: 'tomato', variety: 'base', quality: 0, count: 2 },
  { crop: 'potato', variety: 'base', quality: 0, count: 2 },
  ...STARTER_VARIETY_PACKS.map(v => ({ crop: VARIETY[v].crop as AnnualId, variety: v, quality: 0, count: 5 })),
]

function emptyInv(): Slot[] {
  return Array.from({ length: INV }, (): Slot => ({ kind: 'empty' }))
}

export function defaultSeatName(id: SeatId): string {
  return `P${id + 1}`
}

function liveSeat(
  id: SeatId,
  playerId: PlayerId,
  name: string,
  actor: Actor,
  hand: Hand,
  inventory: Slot[],
  presence: Presence,
): Seat {
  return {
    id,
    playerId,
    name: name === '' ? defaultSeatName(id) : name,
    actor,
    hand,
    inventory,
    queue: [],
    presence,
    napping: false,
    cue: { kind: 'none' },
    place: { kind: 'none' },
    drive: { throttle: 0, steer: 0 },
    stride: { x: 0, y: 0 },
    workLeft: 0,
    workTotal: 0,
    filling: false,
    legStart: { x: actor.x, y: actor.y },
  }
}

export function joinKit(id: SeatId, playerId: PlayerId, name: string): Seat {
  const x = DOOR.col + 0.5 + id * 0.6
  const y = DOOR.row + 0.5
  return liveSeat(id, playerId, name, new Actor(x, y), { kind: 'hold', item: makeShovel('shovel') }, emptyInv(), 'in')
}

export function soloSeat(playerId: PlayerId, name: string): Seat {
  const inventory = emptyInv()
  const stock: Item[] = [
    ...TREE_IDS.map(tree => ({ kind: 'tree-seed' as const, tree, variety: 'base' as const, quality: 0 })),
    ...STARTER_TREE_GRAFTS.map(v => ({
      kind: 'graft' as const,
      crop: VARIETY[v].crop,
      variety: v,
      quality: 0,
      count: 1,
    })),
    ...STARTER_FRUIT.map(v => ({
      kind: 'fruit' as const,
      crop: VARIETY[v].crop,
      variety: v as VarietyId,
      quality: 0,
      count: STARTER_FRUIT_N,
      unitSale: statsOf(VARIETY[v].crop, v, 0, []).sale,
      freshness: 1,
      bio: true,
      cut: false,
    })),
  ]
  stock.forEach((item, i) => {
    inventory[i] = { kind: 'hold', item }
  })
  const x = DOOR.col + 0.5
  const y = DOOR.row + 0.5
  return liveSeat(0, playerId, name, new Actor(x, y), { kind: 'hold', item: makeShovel('shovel') }, inventory, 'in')
}
