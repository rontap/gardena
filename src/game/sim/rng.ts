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

export function rollRarity(u: number): Rarity {
  let acc = 0
  const order = ['common', 'uncommon', 'rare', 'heirloom'] as const
  for (const r of order) {
    acc += RARITY_WEIGHT[r]
    if (acc > u) return r
  }
  return 'heirloom'
}
