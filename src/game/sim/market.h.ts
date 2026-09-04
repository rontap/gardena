import type { CaskId, CropId, JamId, PickaxeId, ShovelId, StallGoodId, TreeId } from './ids.ts'

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

export type FruitAnnualId = 'tomato' | 'raspberry' | 'olive' | 'grape' | 'vanilla'

export type GoodClass = CropId | JamId | 'sugar' | 'flour' | 'oil' | CaskId

export type CompanyRecord = { done: number; missed: number }

export type CompanyBook = { [K in CompanyId]: CompanyRecord }

export type GroupId = 'jam' | 'spirit'

export type ContractGoodId = Exclude<StallGoodId, 'sugar' | 'extract'>

export type PlainGoodId = StallGoodId

export type Demand =
  | { kind: 'plain'; good: StallGoodId; amount: number }
  | { kind: 'group'; group: 'jam'; amount: number }
  | { kind: 'group'; group: 'spirit'; amount: number }

export type Lines = readonly [Demand] | readonly [Demand, Demand]

export type Stars = 1 | 2 | 3 | 4

export type PrizeTool = Extract<ShovelId, 'rotary-shovel'> | Extract<PickaxeId, 'diamond-pickaxe'>

/**
 * What a finished contract hands over. `cash` pays `offer.reward`; every other
 * arm pays the goods instead and no money at all.
 */
export type Prize =
  | { kind: 'cash' }
  | { kind: 'tree-seed'; tree: TreeId }
  | { kind: 'seeds'; crop: 'vanilla'; count: number }
  | { kind: 'fertilizer' }
  | { kind: 'freezer' }
  | { kind: 'expansion-slot' }
  | { kind: 'skill-points'; n: number }
  | { kind: 'tool'; tool: PrizeTool }

/** Difficulty band a prize is drawn from. Index into a company's prize column. */
export type PrizeBand = 0 | 1 | 2 | 3

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
  prize: Prize
  clean: number
  markup: number
  reward: number
  penalty: number
}

export type Bin = { demand: Demand; filled: number }

export type Bins = readonly [Bin] | readonly [Bin, Bin]

export type Active = { offer: ContractOffer; dueDay: number; bins: Bins }

export type Outcome =
  | { kind: 'done'; paid: number; prize: Prize }
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
  rep: number
  repDay: number
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

export declare const DEADLINE_STEP: number

export declare const PRIZE_SLOTS: number

export declare const DEADLINE_COST: { readonly [K in DeadlineBand]: number }

export declare const GOOD_COST: { readonly [K in StallGoodId]: number }

export declare const PAIR_COST: number

export declare const GROUP_COST: number

export declare const AMOUNT_MIN: number

export declare const NICE_AMOUNTS: readonly number[]

export declare const FEASIBLE_PER_DAY: { readonly [K in StallGoodId]: number }

export declare const SCALE_START: number

export declare const SCALE_DAYS: number

export declare const MARKUP_BASE: number

export declare const MARKUP_PER_DIFFICULTY: number

export declare const PENALTY_RATE: number

export declare const PENALTY_FLOOR: number

export declare const CANCEL_MIN: number

export type CleanUnit = (d: Demand) => number

export type Feasible = (good: StallGoodId, days: number, worldDay: number) => number

export type RollBoard = (day: number, slots: number) => readonly ContractOffer[]

export type CancelFee = (a: Active, nowDay: number) => number

export type MissPenalty = (a: Active) => number

export type Accepts = (d: Demand, good: StallGoodId) => boolean
