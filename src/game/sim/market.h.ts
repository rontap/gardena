import type { Rarity } from '../defs/rarity.ts'
import type { CropId, JamId, SpiritKind, StallGoodId } from './ids.ts'

export declare const SAT_DEPTH: number

export declare const SAT_RECOVER_PER_DAY: number

export declare const SAT_FLOOR: { readonly [K in StallGoodId]: number }

export type PriceMul = (sat: number, good: StallGoodId) => number

export type SatSale = { good: StallGoodId; clean: number; paid: number; before: number; after: number }

export type MarketQuote = {
  good: StallGoodId
  sat: number
  mul: number
  clean: number
  paid: number
  recoverDays: number
}

export type SellAllQuote = { rows: readonly MarketQuote[]; clean: number; paid: number }

export type CompanyId =
  | 'whole-cart'
  | 'trade-jo'
  | 'halbert-eijn'
  | 'little-lid'
  | 'mercanova'
  | 'intercrop'

export type FruitAnnualId = 'tomato' | 'raspberry' | 'watermelon' | 'olive' | 'grape' | 'vanilla'

export type GoodClass = CropId | JamId | 'sugar' | 'flour' | 'oil' | 'wine'

export type CompanyRecord = { done: number; missed: number }

export type CompanyBook = { [K in CompanyId]: CompanyRecord }

export type GroupId = 'jam' | 'spirit'

export type RarityGoodId = CropId | SpiritKind | 'wine'

export type PlainGoodId = 'sugar' | JamId | 'oil' | 'flour' | 'extract'

export type Demand =
  | { kind: 'rated'; good: RarityGoodId; minRarity: Rarity; amount: number }
  | { kind: 'plain'; good: PlainGoodId; amount: number }
  | { kind: 'group'; group: 'jam'; amount: number }
  | { kind: 'group'; group: 'spirit'; minRarity: Rarity; amount: number }

export type Lines = readonly [Demand] | readonly [Demand, Demand]

export type Stars = 1 | 2 | 3 | 4

export type DeadlineBand = 'tight' | 'normal' | 'long'

export type ContractId = number

export type ContractOffer = {
  id: ContractId
  slot: number
  company: CompanyId
  difficulty: number
  stars: Stars
  band: DeadlineBand
  days: number
  lines: Lines
  clean: number
  markup: number
  reward: number
  penalty: number
}

export type Bin = { demand: Demand; filled: number }

export type Bins = readonly [Bin] | readonly [Bin, Bin]

export type Active = { offer: ContractOffer; dueDay: number; bins: Bins }

export type Outcome =
  | { kind: 'done'; paid: number }
  | { kind: 'missed'; sold: number; penalty: number }
  | { kind: 'cancelled'; sold: number; fee: number }

export type HistoryEntry = {
  id: ContractId
  company: CompanyId
  stars: Stars
  day: number
  outcome: Outcome
}

export type Contracts = {
  active: Active[]
  takenToday: ContractId[]
  history: HistoryEntry[]
  book: CompanyBook
}

export declare const DIFFICULTY_MAX: number

export declare const DIFFICULTY_START: number

export declare const DIFFICULTY_PER_DAY: number

export declare const CONTRACT_OFFERS: number

export declare const CONTRACT_ACTIVE: number

export declare const CONTRACT_SLOT_MAX: number

export declare const BROKER_MAX_TIER: number

export declare const CONTRACT_HISTORY_MAX: number

export declare const SLOT_BANDS: readonly (readonly [number, number])[]

export declare const STAR_MIN: { readonly [K in Stars]: number }

export declare const DEADLINE_DAYS: { readonly [K in DeadlineBand]: readonly [number, number] }

export declare const DEADLINE_COST: { readonly [K in DeadlineBand]: number }

export declare const RARITY_COST: { readonly [K in Rarity]: number }

export declare const GOOD_COST: { readonly [K in StallGoodId]: number }

export declare const PAIR_COST: number

export declare const GROUP_COST: number

export declare const VALUE_BASE: number

export declare const VALUE_SCALE: number

export declare const AMOUNT_MIN: number

export declare const NICE_AMOUNTS: readonly number[]

export declare const FEASIBLE_PER_DAY: { readonly [K in StallGoodId]: number }

export declare const SCALE_START: number

export declare const SCALE_DAYS: number

export declare const MARKUP_BASE: number

export declare const MARKUP_PER_DIFFICULTY: number

export declare const MARKUP_PER_DAY: number

export declare const PENALTY_RATE: number

export declare const PENALTY_FLOOR: number

export declare const CANCEL_MIN: number

export type CleanUnit = (d: Demand) => number

export type Feasible = (good: StallGoodId, days: number, worldDay: number) => number

export type RollBoard = (day: number, slots: number) => readonly ContractOffer[]

export type CancelFee = (a: Active, nowDay: number) => number

export type MissPenalty = (a: Active) => number

export type Accepts = (d: Demand, good: StallGoodId, rarity: Rarity) => boolean
