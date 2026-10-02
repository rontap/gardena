import type { AxeId, CaskId, CropId, JamId, PickaxeId, PlantCrop, ShovelId, StallGoodId, TreeId } from '../ids.ts'
import type { VarietyId } from '../../defs/varieties.ts'
import type { Item } from '../item.ts'

export declare const SAT_MAX_CUT: number

export declare const SAT_RECOVER: { readonly [K in StallGoodId]: number }

export declare const SAT_STEP_FRUIT: number

export declare const SAT_STEP_CRAFT: number

export type PriceMul = (sat: number, cap: number, weatherAdd?: number) => number

export type SatSale = { good: StallGoodId; clean: number; paid: number; before: number; after: number }

export type MarketQuote = {
  good: StallGoodId
  variety: VarietyId
  infused: boolean
  count: number
  sat: number
  mul: number
  cap: number
  clean: number
  paid: number
  recoverDays: number
}

export type SellAllQuote = {
  rows: readonly MarketQuote[]
  clean: number
  paid: number
  after: { readonly [K in StallGoodId]?: number }
}

export type DemandChip = {
  good: StallGoodId
  variety: VarietyId
  shown: number
  cap: number
  sat: number
  recoverDays: number
  msrp: number
  price: number
}

export type Sale = { name: string; n: number }

export type InfusedKey = 'plain' | 'infused'

export type CompanyId =
  | 'whole-cart'
  | 'trade-jo'
  | 'halbert-eijn'
  | 'little-lid'
  | 'mercanova'
  | 'intercrop'

export type GoodClass = CropId | JamId | 'sugar' | 'flour' | 'oil' | CaskId

export type CompanyRecord = { done: number; missed: number }

export type CompanyBook = { [K in CompanyId]: CompanyRecord }

export type GroupId = 'jam' | 'spirit'

export type PlainGoodId = StallGoodId

export type VarietyNeed = { kind: 'any' } | { kind: 'exact'; variety: VarietyId }

export type Need = { variety: VarietyNeed; quality: number; freshness: number }

export type Condition = 'pair' | 'freshness' | 'quality' | 'variety' | 'short' | 'large'

export type Demand =
  | { kind: 'plain'; good: StallGoodId; amount: number; need: Need }
  | { kind: 'group'; group: 'jam'; amount: number; need: Need }
  | { kind: 'group'; group: 'spirit'; amount: number; need: Need }

export type Delivered = Extract<Item, { kind: 'fruit' | 'sugar' | 'spirit' | 'cask' | 'jam' | 'oil' | 'flour' | 'bread' }>

export type Lines = readonly [Demand] | readonly [Demand, Demand]

export type Stars = 1 | 2 | 3 | 4

export type PrizeTool =
  | Extract<ShovelId, 'rotary-shovel'>
  | Extract<PickaxeId, 'diamond-pickaxe'>
  | Extract<AxeId, 'electric-chainsaw'>

export type Prize =
  | { kind: 'cash' }
  | { kind: 'tree-seed'; tree: TreeId; variety: VarietyId }
  | { kind: 'seeds'; crop: PlantCrop; variety: VarietyId; count: number }
  | { kind: 'fertilizer' }
  | { kind: 'freezer' }
  | { kind: 'expansion-slot' }
  | { kind: 'skill-points'; n: number }
  | { kind: 'tool'; tool: PrizeTool }

export type PrizePool =
  | 'plain-trees'
  | 'named-trees'
  | 'heirloom-trees'
  | 'named-annuals'
  | 'heirloom-annuals'
  | 'fruit-annuals'
  | 'starter-crops'

export type PrizeTemplate =
  | { kind: 'tree-seed'; tree: TreeId; variety: VarietyId }
  | { kind: 'fertilizer' }
  | { kind: 'freezer' }
  | { kind: 'expansion-slot' }
  | { kind: 'skill-points'; n: number }
  | { kind: 'tool' }
  | { kind: 'pool'; pool: PrizePool; count: number }
  | { kind: 'from-cash'; pool: PrizePool }
  | { kind: 'pool-or-vanilla'; pool: PrizePool; count: number; vanilla: number }
  | { kind: 'trees'; trees: readonly [TreeId, TreeId] }

export type PrizeBand = 0 | 1 | 2 | 3

export type PrizeBandMin = readonly [number, number, number, number]

export type DeadlineBand = 'short' | 'normal'

export type Range = readonly [number, number]

export type GoodTuning = {
  on: boolean
  tier: Stars
  cost: number
  feasible: number
  price: number
  starter: boolean
  shares: Range
}

export type DeadlineTuning = {
  lo: number
  hi: number
  cost: number
  markup: number
}

export type ContractTuning = {
  difficultyStart: number
  difficultyPerDay: number
  difficultyMax: number
  difficultyCeiling: number
  slotBands: readonly (readonly [number, number])[]
  starMin: { readonly [K in Stars]: number }
  dStarter: number
  deadlineStep: number
  deadlines: { readonly [K in DeadlineBand]: DeadlineTuning }
  mixFloor: number
  mixShare: number
  budgetOverdraft: number
  pairCost: number
  groupCost: number
  groupChance: number
  groupTier: { readonly [K in GroupId]: Stars }
  groupShares: { readonly [K in GroupId]: Range }
  loadMin: number
  loadMax: number
  loadCurve: number
  loadDOffset: number
  amountMin: number
  niceAmounts: readonly number[]
  markupBase: number
  markupPerDifficulty: number
  prizeSlots: number
  prizeBandMin: PrizeBandMin
  conditionsPerLevel: number
  conditionsJitter: number
  conditionsMax: number
  conditionWeight: { readonly [K in Condition]: number }
  freshnessRange: Range
  qualityRange: Range
  heirloomRange: Range
  largeMul: number
  goods: { readonly [K in StallGoodId]: GoodTuning }
}

export type ContractId = number

export type ContractOffer = {
  id: ContractId
  slot: number
  company: CompanyId
  difficulty: number
  stars: Stars
  band: DeadlineBand
  days: number
  conditions: readonly Condition[]
  lines: Lines
  prize: Prize
  clean: number
  markup: number
  reward: number
  penalty: number
}

export type Bin = { demand: Demand; filled: number; infusedFilled: number }

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
  rep: number
  lines: Lines
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

export declare const MARKUP_BASE: number

export declare const MARKUP_PER_DIFFICULTY: number

export declare const PENALTY_FLOOR: number

export type CleanUnit = (d: Demand) => number

export type RollBoard = (day: number, slots: number) => readonly ContractOffer[]

export type CancelFee = (a: Active, nowDay: number, cancelMin: number) => number

export type MissPenalty = (a: Active) => number

export type Accepts = (d: Demand, good: StallGoodId, item: Delivered) => boolean
