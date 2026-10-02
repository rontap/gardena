import { CASK_OF, SPIRIT_OF, type BarrelCrop, type GrownCrop, type JamCrop } from '../sim/ids.ts'
import { VARIETIES } from './varieties.ts'

export const Base = 'base' as const
export type Base = typeof Base

export const Mixed = 'mixed' as const
export type Mixed = typeof Mixed

export const GreenZebra = 'green-zebra' as const
export type GreenZebra = typeof GreenZebra
export const PinkLady = 'pink-lady' as const
export type PinkLady = typeof PinkLady
export const Blenheim = 'blenheim' as const
export type Blenheim = typeof Blenheim
export const Bing = 'bing' as const
export type Bing = typeof Bing
export const KingstonBlack = 'kingston-black' as const
export type KingstonBlack = typeof KingstonBlack
export const Klosterneuburger = 'klosterneuburger' as const
export type Klosterneuburger = typeof Klosterneuburger
export const Keknyelu = 'keknyelu' as const
export type Keknyelu = typeof Keknyelu
export const BlackRaspberry = 'black-raspberry' as const
export type BlackRaspberry = typeof BlackRaspberry
export const SanMarzano = 'san-marzano' as const
export type SanMarzano = typeof SanMarzano
export const Concord = 'concord' as const
export type Concord = typeof Concord
export const Arbequina = 'arbequina' as const
export type Arbequina = typeof Arbequina

export type Fruit<
  C extends GrownCrop,
  V extends (typeof VARIETIES)[C][number] = Base,
> = {
  readonly kind: 'fruit'
  readonly crop: C
  readonly variety: V
}

export type Carrot<V extends (typeof VARIETIES)['carrot'][number] = Base> = Fruit<'carrot', V>
export type Potato<V extends (typeof VARIETIES)['potato'][number] = Base> = Fruit<'potato', V>
export type Wheat<V extends (typeof VARIETIES)['wheat'][number] = Base> = Fruit<'wheat', V>
export type Tomato<V extends (typeof VARIETIES)['tomato'][number] = Base> = Fruit<'tomato', V>
export type Apple<V extends (typeof VARIETIES)['apple'][number] = Base> = Fruit<'apple', V>
export type Apricot<V extends (typeof VARIETIES)['apricot'][number] = Base> = Fruit<'apricot', V>
export type Cherry<V extends (typeof VARIETIES)['cherry'][number] = Base> = Fruit<'cherry', V>
export type Olive<V extends (typeof VARIETIES)['olive'][number] = Base> = Fruit<'olive', V>
export type Grape<V extends (typeof VARIETIES)['grape'][number] = Base> = Fruit<'grape', V>
export type Raspberry<V extends (typeof VARIETIES)['raspberry'][number] = Base> = Fruit<'raspberry', V>
export type Vanilla<V extends (typeof VARIETIES)['vanilla'][number] = Base> = Fruit<'vanilla', V>
export type SugarCane<V extends (typeof VARIETIES)['sugar-cane'][number] = Base> = Fruit<'sugar-cane', V>
export type Chilli<V extends (typeof VARIETIES)['chilli'][number] = Base> = Fruit<'chilli', V>

export type Alcohol<C> = C extends Fruit<infer Crop, infer V>
  ? Crop extends 'potato' | 'apricot'
    ? { readonly kind: 'spirit'; readonly spirit: (typeof SPIRIT_OF)[Crop]; readonly variety: V }
    : Crop extends BarrelCrop
      ? { readonly kind: 'cask'; readonly cask: (typeof CASK_OF)[Crop]; readonly variety: V }
      : never
  : C extends Mixed
    ? { readonly kind: 'spirit'; readonly spirit: 'mixed'; readonly variety: Base }
    : never

export type Jam<C> = C extends Fruit<infer Crop, infer V>
  ? Crop extends JamCrop
    ? { readonly kind: 'jam'; readonly crop: Crop; readonly variety: V }
    : never
  : never

export type Oil<V extends (typeof VARIETIES)['olive'][number] = Base> = {
  readonly kind: 'oil'
  readonly variety: V
}

export type Flour = { readonly kind: 'flour' }

export type BaseProduce = Carrot | Potato | Wheat
export type MidProduce = Tomato | Apple | Apricot
export type AdvProduce = Cherry | Olive | Grape | Raspberry
export type NamedProduce = Tomato<GreenZebra> | Apple<PinkLady> | Apricot<Blenheim> | Cherry<Bing>
export type Produce = BaseProduce | MidProduce | AdvProduce

export type Alcohols =
  | Alcohol<Potato>
  | Alcohol<Apricot>
  | Alcohol<Grape>
  | Alcohol<Apple>
  | Alcohol<Mixed>

export type SpecialtyAlcohol =
  | Alcohol<Apple<KingstonBlack>>
  | Alcohol<Apricot<Klosterneuburger>>
  | Alcohol<Grape<Keknyelu>>

export type Processed =
  | Jam<Cherry>
  | Jam<Raspberry>
  | Jam<Tomato>
  | Jam<Apricot>
  | Jam<Grape>
  | Flour
  | Oil

export type SpecialtyProcessed =
  | Jam<Raspberry<BlackRaspberry>>
  | Jam<Tomato<SanMarzano>>
  | Jam<Grape<Concord>>
  | Oil<Arbequina>

export type Utility = Vanilla | SugarCane | Chilli

export type GoodGroup =
  | Produce
  | NamedProduce
  | Alcohols
  | SpecialtyAlcohol
  | Processed
  | SpecialtyProcessed
  | Utility

export const BaseProduce = [
  { kind: 'fruit', crop: 'carrot', variety: Base },
  { kind: 'fruit', crop: 'potato', variety: Base },
  { kind: 'fruit', crop: 'wheat', variety: Base },
] as const satisfies readonly BaseProduce[]

export const MidProduce = [
  { kind: 'fruit', crop: 'tomato', variety: Base },
  { kind: 'fruit', crop: 'apple', variety: Base },
  { kind: 'fruit', crop: 'apricot', variety: Base },
] as const satisfies readonly MidProduce[]

export const AdvProduce = [
  { kind: 'fruit', crop: 'cherry', variety: Base },
  { kind: 'fruit', crop: 'olive', variety: Base },
  { kind: 'fruit', crop: 'grape', variety: Base },
  { kind: 'fruit', crop: 'raspberry', variety: Base },
] as const satisfies readonly AdvProduce[]

export const NamedProduce = [
  { kind: 'fruit', crop: 'tomato', variety: GreenZebra },
  { kind: 'fruit', crop: 'apple', variety: PinkLady },
  { kind: 'fruit', crop: 'apricot', variety: Blenheim },
  { kind: 'fruit', crop: 'cherry', variety: Bing },
] as const satisfies readonly NamedProduce[]

export const Produce = [...BaseProduce, ...MidProduce, ...AdvProduce] as const satisfies readonly Produce[]

export const Alcohol = [
  { kind: 'spirit', spirit: 'vodka', variety: Base },
  { kind: 'spirit', spirit: 'brandy', variety: Base },
  { kind: 'cask', cask: 'wine', variety: Base },
  { kind: 'cask', cask: 'cider', variety: Base },
  { kind: 'spirit', spirit: 'mixed', variety: Base },
] as const satisfies readonly Alcohols[]

export const SpecialtyAlcohol = [
  { kind: 'cask', cask: 'cider', variety: KingstonBlack },
  { kind: 'spirit', spirit: 'brandy', variety: Klosterneuburger },
  { kind: 'cask', cask: 'wine', variety: Keknyelu },
] as const satisfies readonly SpecialtyAlcohol[]

export const Flour: Flour = { kind: 'flour' }

export const Processed = [
  { kind: 'jam', crop: 'cherry', variety: Base },
  { kind: 'jam', crop: 'raspberry', variety: Base },
  { kind: 'jam', crop: 'tomato', variety: Base },
  { kind: 'jam', crop: 'apricot', variety: Base },
  { kind: 'jam', crop: 'grape', variety: Base },
  Flour,
  { kind: 'oil', variety: Base },
] as const satisfies readonly Processed[]

export const SpecialtyProcessed = [
  { kind: 'jam', crop: 'raspberry', variety: BlackRaspberry },
  { kind: 'jam', crop: 'tomato', variety: SanMarzano },
  { kind: 'jam', crop: 'grape', variety: Concord },
  { kind: 'oil', variety: Arbequina },
] as const satisfies readonly SpecialtyProcessed[]

export const Utility = [
  { kind: 'fruit', crop: 'vanilla', variety: Base },
  { kind: 'fruit', crop: 'sugar-cane', variety: Base },
  { kind: 'fruit', crop: 'chilli', variety: Base },
] as const satisfies readonly Utility[]

export type Line<G extends GoodGroup = GoodGroup> = G & { readonly amount: number }

export function get<T extends readonly GoodGroup[]>(xs: T): T {
  return xs
}
