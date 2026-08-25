import type { CompanyId } from '../sim/market.h.ts'

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
  'whole-cart': { id: 'whole-cart', name: 'Whole Cart', riff: 'Walmart', region: 'US' },
  'trade-jo': { id: 'trade-jo', name: 'Trade Jo', riff: "Trader Joe's", region: 'US' },
  'halbert-eijn': { id: 'halbert-eijn', name: 'Halbert Eijn', riff: 'Albert Heijn', region: 'NL' },
  'little-lid': { id: 'little-lid', name: 'Little Lid', riff: 'Lidl', region: 'DE' },
  mercanova: { id: 'mercanova', name: 'Mercanova', riff: 'Mercadona', region: 'ES' },
  intercrop: { id: 'intercrop', name: 'Intercrop', riff: 'Interspar HU', region: 'HU' },
}
