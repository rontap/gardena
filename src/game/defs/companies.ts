import { m } from '../../paraglide/messages.js'
import type { CompanyId, Prize, PrizeBand } from '../sim/feature-contracts/market.h.ts'

/** One pack's worth. Vanilla has no shop pack; this is the only source. */
export const VANILLA_PRIZE_SEEDS = 5

export type Company = {
  id: CompanyId
  name: string
  riff: string
  region: 'US' | 'NL' | 'DE' | 'ES' | 'HU'
}

export const COMPANY_IDS: readonly CompanyId[] = [
  'whole-cart',
  'trade-jo',
  'halbert-eijn',
  'little-lid',
  'mercanova',
  'intercrop',
]

export const COMPANIES: { readonly [K in CompanyId]: Company } = {
  'whole-cart': { id: 'whole-cart', name: m.names_company_whole_cart(), riff: 'Walmart', region: 'US' },
  'trade-jo': { id: 'trade-jo', name: m.names_company_trade_jo(), riff: "Trader Joe's", region: 'US' },
  'halbert-eijn': { id: 'halbert-eijn', name: m.names_company_halbert_eijn(), riff: 'Albert Heijn', region: 'NL' },
  'little-lid': { id: 'little-lid', name: m.names_company_little_lid(), riff: 'Lidl', region: 'DE' },
  mercanova: { id: 'mercanova', name: m.names_company_mercanova(), riff: 'Mercadona', region: 'ES' },
  intercrop: { id: 'intercrop', name: m.names_company_intercrop(), riff: 'Interspar HU', region: 'HU' },
}

/**
 * Lower bound of each prize band, read against an offer's *final* difficulty.
 * Bands are `[0,8) [8,20) [20,30) [30,∞)`.
 */
export const PRIZE_BAND_MIN: readonly [number, number, number, number] = [0, 8, 20, 30]

export function prizeBandOf(difficulty: number): PrizeBand {
  if (difficulty >= PRIZE_BAND_MIN[3]) return 3
  if (difficulty >= PRIZE_BAND_MIN[2]) return 2
  if (difficulty >= PRIZE_BAND_MIN[1]) return 1
  return 0
}

/**
 * What each firm hands over, by band. Fixed per company, never rolled — only
 * *which* two slots pay a prize is rolled. Six firms share three columns:
 * tree-seeds-and-rarities, buildings-and-land, and the household column.
 *
 * The `tool` arm here is a template; `market.ts` rolls the actual tool per offer.
 */
export const COMPANY_PRIZES: { readonly [K in CompanyId]: readonly [Prize, Prize, Prize, Prize] } = {
  'whole-cart': [
    { kind: 'tree-seed', tree: 'cherry' },
    { kind: 'tree-seed', tree: 'apricot' },
    { kind: 'seeds', crop: 'vanilla', count: VANILLA_PRIZE_SEEDS },
    { kind: 'tool', tool: 'rotary-shovel' },
  ],
  'little-lid': [
    { kind: 'tree-seed', tree: 'cherry' },
    { kind: 'tree-seed', tree: 'apricot' },
    { kind: 'seeds', crop: 'vanilla', count: VANILLA_PRIZE_SEEDS },
    { kind: 'tool', tool: 'rotary-shovel' },
  ],
  'trade-jo': [
    { kind: 'tree-seed', tree: 'apple' },
    { kind: 'tree-seed', tree: 'olive' },
    { kind: 'freezer' },
    { kind: 'expansion-slot' },
  ],
  mercanova: [
    { kind: 'tree-seed', tree: 'apple' },
    { kind: 'tree-seed', tree: 'olive' },
    { kind: 'freezer' },
    { kind: 'expansion-slot' },
  ],
  'halbert-eijn': [
    { kind: 'fertilizer' },
    { kind: 'skill-points', n: 1 },
    { kind: 'skill-points', n: 2 },
    { kind: 'skill-points', n: 3 },
  ],
  intercrop: [
    { kind: 'fertilizer' },
    { kind: 'skill-points', n: 1 },
    { kind: 'skill-points', n: 2 },
    { kind: 'skill-points', n: 3 },
  ],
}
