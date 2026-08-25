import { ANNUAL_IDS, JAM_IDS, TREE_IDS } from '../sim/ids.ts'
import type { CompanyId, FruitAnnualId, GoodClass } from '../sim/market.h.ts'

export type Company = {
  id: CompanyId
  name: string
  riff: string
  region: 'US' | 'NL' | 'DE' | 'ES' | 'HU'
  mix: number
  pool: readonly GoodClass[]
  eligible: number
}

const ALL_CROPS: readonly GoodClass[] = [...ANNUAL_IDS, ...TREE_IDS]

const FRUIT_ANNUALS: readonly FruitAnnualId[] = ['tomato', 'raspberry', 'watermelon', 'olive', 'grape', 'vanilla']

export const COMPANY_IDS: readonly CompanyId[] = [
  'whole-cart',
  'trade-jo',
  'halbert-eijn',
  'little-lid',
  'mercanova',
  'intercrop',
]

export const COMPANIES: { readonly [K in CompanyId]: Company } = {
  'whole-cart': {
    id: 'whole-cart',
    name: 'Whole Cart',
    riff: 'Walmart',
    region: 'US',
    mix: 0.15,
    pool: ALL_CROPS,
    eligible: 0,
  },
  'trade-jo': {
    id: 'trade-jo',
    name: 'Trade Jo',
    riff: "Trader Joe's",
    region: 'US',
    mix: 0.7,
    pool: [...FRUIT_ANNUALS, ...TREE_IDS, ...JAM_IDS],
    eligible: 8,
  },
  'halbert-eijn': {
    id: 'halbert-eijn',
    name: 'Halbert Eijn',
    riff: 'Albert Heijn',
    region: 'NL',
    mix: 0.2,
    pool: ['carrot', 'potato', 'wheat', 'tomato', 'sugar'],
    eligible: 0,
  },
  'little-lid': {
    id: 'little-lid',
    name: 'Little Lid',
    riff: 'Lidl',
    region: 'DE',
    mix: 0.25,
    pool: [...ALL_CROPS, 'flour', 'oil'],
    eligible: 4,
  },
  mercanova: {
    id: 'mercanova',
    name: 'Mercanova',
    riff: 'Mercadona',
    region: 'ES',
    mix: 0.45,
    pool: [...FRUIT_ANNUALS, ...TREE_IDS, ...JAM_IDS],
    eligible: 6,
  },
  intercrop: {
    id: 'intercrop',
    name: 'Intercrop',
    riff: 'Interspar HU',
    region: 'HU',
    mix: 0.3,
    pool: ALL_CROPS,
    eligible: 0,
  },
}
