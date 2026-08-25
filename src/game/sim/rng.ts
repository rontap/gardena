import { RARITY_WEIGHT, type Rarity } from '../defs/rarity.ts'

export function hash(seed: number, salt: string, ...ints: number[]): number {
  let h = seed >>> 0
  for (let i = 0; i < salt.length; i++) h = mix(h, salt.charCodeAt(i))
  for (const n of ints) h = mix(h, n)
  return (h >>> 0) / 4294967296
}

function mix(h: number, x: number): number {
  h = Math.imul(h ^ (x >>> 0), 0x45d9f3b)
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
  return h ^ (h >>> 16)
}

function streamSeed(seed: number, id: StreamId): number {
  let h = seed >>> 0
  for (let i = 0; i < id.length; i++) h = mix(h, id.charCodeAt(i))
  return h
}

export function rollRarity(u: number): Rarity {
  let acc = 0
  const order = ['common', 'uncommon', 'rare', 'heirloom'] as const
  for (const r of order) {
    acc += RARITY_WEIGHT[r]
    if (acc > u) return r
  }
  return 'heirloom'
}

export type SpatialId = 'gen' | 'grow' | 'weed' | 'grass' | 'tree' | 'skill' | 'grind' | 'still' | 'barrel' | 'contract'
export type SeqId = 'shop' | 'fruit'
export type StreamId = SpatialId | SeqId
export type Stream = Spatial | Seq

export class Spatial {
  private readonly streamSeed: number
  constructor(streamSeed: number) {
    this.streamSeed = streamSeed
  }
  at(...ints: [number, ...number[]]): number {
    let h = this.streamSeed
    for (const n of ints) h = mix(h, n)
    return (h >>> 0) / 4294967296
  }
}

export class Seq {
  private readonly streamSeed: number
  private n: number
  constructor(streamSeed: number, n = 0) {
    this.streamSeed = streamSeed
    this.n = n
  }
  get consumed(): number {
    return this.n
  }
  next(): number {
    let h = this.streamSeed
    h = mix(h, this.n)
    this.n += 1
    return (h >>> 0) / 4294967296
  }
}

export class Rng {
  readonly seed: number
  private readonly spatials = new Map<SpatialId, Spatial>()
  private readonly seqs = new Map<SeqId, Seq>()
  constructor(seed?: number, seq?: { shop: number; fruit: number }) {
    this.seed = seed === undefined ? (Math.random() * 0x100000000) >>> 0 : seed
    if (seq !== undefined) {
      this.seqs.set('shop', new Seq(streamSeed(this.seed, 'shop'), seq.shop))
      this.seqs.set('fruit', new Seq(streamSeed(this.seed, 'fruit'), seq.fruit))
    }
  }
  consumed(id: SeqId): number {
    const s = this.seqs.get(id)
    if (s === undefined) return 0
    return s.consumed
  }
  stream(id: SpatialId): Spatial
  stream(id: SeqId): Seq
  stream(id: StreamId): Spatial | Seq {
    if (id === 'shop' || id === 'fruit') {
      const hit = this.seqs.get(id)
      if (hit !== undefined) return hit
      const made = new Seq(streamSeed(this.seed, id))
      this.seqs.set(id, made)
      return made
    }
    const hit = this.spatials.get(id)
    if (hit !== undefined) return hit
    const made = new Spatial(streamSeed(this.seed, id))
    this.spatials.set(id, made)
    return made
  }
}
