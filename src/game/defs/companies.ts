import { m } from '../../paraglide/messages.js'
import type { CompanyId, PrizeBand, PrizeTemplate } from '../sim/feature-contracts/market.h.ts'

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

export const PRIZE_BAND_MIN: readonly [number, number, number, number] = [0, 8, 20, 30]

export function prizeBandOf(difficulty: number): PrizeBand {
  if (difficulty >= PRIZE_BAND_MIN[3]) return 3
  if (difficulty >= PRIZE_BAND_MIN[2]) return 2
  if (difficulty >= PRIZE_BAND_MIN[1]) return 1
  return 0
}

export const COMPANY_PRIZES: { readonly [K in CompanyId]: readonly [PrizeTemplate, PrizeTemplate, PrizeTemplate, PrizeTemplate] } = {
  'whole-cart': [
    { kind: 'tree-seed', tree: 'cherry', variety: 'base' },
    { kind: 'tree-seed', tree: 'apricot', variety: 'base' },
    { kind: 'pool', pool: 'named-trees', count: 1 },
    { kind: 'pool-or-vanilla', pool: 'heirloom-trees', count: 1, vanilla: 1 },
  ],
  'little-lid': [
    { kind: 'tree-seed', tree: 'apple', variety: 'base' },
    { kind: 'tree-seed', tree: 'olive', variety: 'base' },
    { kind: 'pool', pool: 'plain-trees', count: 1 },
    { kind: 'pool', pool: 'named-trees', count: 1 },
  ],
  'trade-jo': [
    { kind: 'tree-seed', tree: 'apple', variety: 'base' },
    { kind: 'tree-seed', tree: 'cherry', variety: 'base' },
    { kind: 'skill-points', n: 1 },
    { kind: 'tool' },
  ],
  mercanova: [
    { kind: 'fertilizer' },
    { kind: 'freezer' },
    { kind: 'skill-points', n: 1 },
    { kind: 'expansion-slot' },
  ],
  'halbert-eijn': [
    { kind: 'from-cash', pool: 'fruit-annuals' },
    { kind: 'pool', pool: 'named-annuals', count: 2 },
    { kind: 'pool', pool: 'heirloom-annuals', count: 1 },
    { kind: 'tool' },
  ],
  intercrop: [
    { kind: 'from-cash', pool: 'starter-crops' },
    { kind: 'from-cash', pool: 'fruit-annuals' },
    { kind: 'pool', pool: 'named-annuals', count: 4 },
    { kind: 'pool-or-vanilla', pool: 'heirloom-annuals', count: 2, vanilla: 2 },
  ],
}
