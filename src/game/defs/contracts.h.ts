import { CASK_OF, SPIRIT_OF, type GrownCrop, type JamCrop } from '../sim/ids.ts'
import { VARIETIES } from './varieties.ts'

export declare const Base: 'base'
export type Base = typeof Base

export declare const Mixed: 'mixed'
export type Mixed = typeof Mixed

export declare const GreenZebra: 'green-zebra'
export type GreenZebra = typeof GreenZebra
export declare const PinkLady: 'pink-lady'
export type PinkLady = typeof PinkLady
export declare const Blenheim: 'blenheim'
export type Blenheim = typeof Blenheim
export declare const Bing: 'bing'
export type Bing = typeof Bing
export declare const KingstonBlack: 'kingston-black'
export type KingstonBlack = typeof KingstonBlack
export declare const Klosterneuburger: 'klosterneuburger'
export type Klosterneuburger = typeof Klosterneuburger
export declare const Keknyelu: 'keknyelu'
export type Keknyelu = typeof Keknyelu
export declare const BlackRaspberry: 'black-raspberry'
export type BlackRaspberry = typeof BlackRaspberry
export declare const SanMarzano: 'san-marzano'
export type SanMarzano = typeof SanMarzano
export declare const Concord: 'concord'
export type Concord = typeof Concord
export declare const Arbequina: 'arbequina'
export type Arbequina = typeof Arbequina

export type VOf<C extends GrownCrop> = (typeof VARIETIES)[C][number]

export type Fruit<C extends GrownCrop, V extends VOf<C> = Base> = {
  readonly kind: 'fruit'
  readonly crop: C
  readonly variety: V
}

export type FruitCtor<C extends GrownCrop> = {
  <V extends VOf<C>>(variety: V): Fruit<C, V>
  readonly pattern: 'fruit'
  readonly kind: 'fruit'
  readonly crop: C
  materialize(): Fruit<C, Base>
}

export declare const Carrot: FruitCtor<'carrot'>
export declare const Potato: FruitCtor<'potato'>
export declare const Wheat: FruitCtor<'wheat'>
export declare const Tomato: FruitCtor<'tomato'>
export declare const Apple: FruitCtor<'apple'>
export declare const Apricot: FruitCtor<'apricot'>
export declare const Cherry: FruitCtor<'cherry'>
export declare const Olive: FruitCtor<'olive'>
export declare const Grape: FruitCtor<'grape'>
export declare const Raspberry: FruitCtor<'raspberry'>
export declare const Vanilla: FruitCtor<'vanilla'>
export declare const SugarCane: FruitCtor<'sugar-cane'>
export declare const Chilli: FruitCtor<'chilli'>

export type Carrot<V extends VOf<'carrot'> = Base> = Fruit<'carrot', V>
export type Potato<V extends VOf<'potato'> = Base> = Fruit<'potato', V>
export type Wheat<V extends VOf<'wheat'> = Base> = Fruit<'wheat', V>
export type Tomato<V extends VOf<'tomato'> = Base> = Fruit<'tomato', V>
export type Apple<V extends VOf<'apple'> = Base> = Fruit<'apple', V>
export type Apricot<V extends VOf<'apricot'> = Base> = Fruit<'apricot', V>
export type Cherry<V extends VOf<'cherry'> = Base> = Fruit<'cherry', V>
export type Olive<V extends VOf<'olive'> = Base> = Fruit<'olive', V>
export type Grape<V extends VOf<'grape'> = Base> = Fruit<'grape', V>
export type Raspberry<V extends VOf<'raspberry'> = Base> = Fruit<'raspberry', V>
export type Vanilla<V extends VOf<'vanilla'> = Base> = Fruit<'vanilla', V>
export type SugarCane<V extends VOf<'sugar-cane'> = Base> = Fruit<'sugar-cane', V>
export type Chilli<V extends VOf<'chilli'> = Base> = Fruit<'chilli', V>

export type Distill = {
  readonly potato: { readonly kind: 'spirit'; readonly spirit: (typeof SPIRIT_OF)['potato'] }
  readonly apricot: { readonly kind: 'spirit'; readonly spirit: (typeof SPIRIT_OF)['apricot'] }
  readonly grape: { readonly kind: 'cask'; readonly cask: (typeof CASK_OF)['grape'] }
  readonly apple: { readonly kind: 'cask'; readonly cask: (typeof CASK_OF)['apple'] }
}

export type DistillCrop = keyof Distill

export type Alcohol<C> = C extends Mixed
  ? { readonly kind: 'spirit'; readonly spirit: 'mixed'; readonly variety: Base }
  : C extends Fruit<infer Crop extends DistillCrop, infer V>
    ? Distill[Crop] & { readonly variety: V }
    : never

export type Jam<C> = C extends Fruit<infer Crop extends JamCrop, infer V>
  ? { readonly kind: 'jam'; readonly crop: Crop; readonly variety: V }
  : never

export type Oil<V extends VOf<'olive'> = Base> = { readonly kind: 'oil'; readonly variety: V }
export type Flour = { readonly kind: 'flour' }

export declare const Alcohol: ((
  of: { crop: DistillCrop; variety?: VOf<DistillCrop> } | Mixed,
) => Distill[DistillCrop] | Distill[DistillCrop] & { variety: VOf<DistillCrop> } | { kind: 'spirit'; spirit: 'mixed' }) & {
  readonly pattern: 'alcohol'
}

export declare const Jam: ((
  of: { crop: JamCrop; variety?: VOf<JamCrop> },
) => { kind: 'jam'; crop: JamCrop } | { kind: 'jam'; crop: JamCrop; variety: VOf<JamCrop> }) & {
  readonly pattern: 'jam'
  readonly kind: 'jam'
}

export declare const Oil: (<V extends VOf<'olive'>>(variety: V) => Oil<V>) & {
  readonly pattern: 'oil'
  readonly kind: 'oil'
  materialize(): Oil<Base>
}

export declare const Flour: Flour

export declare const BaseProduce: readonly [typeof Carrot, typeof Potato, typeof Wheat]
export declare const MidProduce: readonly [typeof Tomato, typeof Apple, typeof Apricot]
export declare const AdvProduce: readonly [typeof Cherry, typeof Olive, typeof Grape, typeof Raspberry]
export declare const NamedProduce: readonly [
  Fruit<'tomato', GreenZebra>,
  Fruit<'apple', PinkLady>,
  Fruit<'apricot', Blenheim>,
  Fruit<'cherry', Bing>,
]
export declare const Produce: readonly [
  ...typeof BaseProduce,
  ...typeof MidProduce,
  ...typeof AdvProduce,
]
export declare const Alcohols: readonly [
  Distill['potato'],
  Distill['apricot'],
  Distill['grape'],
  Distill['apple'],
  { readonly kind: 'spirit'; readonly spirit: 'mixed' },
]
export declare const SpecialtyAlcohol: readonly [
  Distill['apple'] & { readonly variety: KingstonBlack },
  Distill['apricot'] & { readonly variety: Klosterneuburger },
  Distill['grape'] & { readonly variety: Keknyelu },
]
export declare const Processed: readonly [
  Jam<Cherry>,
  Jam<Raspberry>,
  Jam<Tomato>,
  Jam<Apricot>,
  Jam<Grape>,
  Flour,
  Oil<Base>,
]
export declare const SpecialtyProcessed: readonly [
  Jam<Raspberry<BlackRaspberry>>,
  Jam<Tomato<SanMarzano>>,
  Jam<Grape<Concord>>,
  Oil<Arbequina>,
]
export declare const Utility: readonly [typeof Vanilla, typeof SugarCane, typeof Chilli]

type Pin<P> = P extends { readonly variety: unknown } | { readonly kind: 'flour' } ? P : P & { readonly variety: Base }

export type Get<P> = P extends readonly unknown[]
  ? { readonly [I in keyof P]: Get<P[I]> }
  : P extends { materialize: () => infer R }
    ? R
    : P extends { readonly pattern: 'alcohol' }
      ? Get<typeof Alcohols>
      : Pin<P>

export type BaseProduce = Get<(typeof BaseProduce)[number]>
export type MidProduce = Get<(typeof MidProduce)[number]>
export type AdvProduce = Get<(typeof AdvProduce)[number]>
export type NamedProduce = (typeof NamedProduce)[number]
export type Produce = Get<(typeof Produce)[number]>
export type Alcohols = Pin<(typeof Alcohols)[number]>
export type SpecialtyAlcohol = (typeof SpecialtyAlcohol)[number]
export type Processed = (typeof Processed)[number]
export type SpecialtyProcessed = (typeof SpecialtyProcessed)[number]
export type Utility = Get<(typeof Utility)[number]>

export type GoodGroup =
  | Produce
  | NamedProduce
  | Alcohols
  | SpecialtyAlcohol
  | Processed
  | SpecialtyProcessed
  | Utility

export type Line<G extends GoodGroup = GoodGroup> = G & { readonly amount: number }

export declare function get<P>(pattern: P): Get<P>
export declare function is(value: GoodGroup): (pattern: object) => boolean
