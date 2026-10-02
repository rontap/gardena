import { CASK_OF, SPIRIT_OF, type GrownCrop, type JamCrop } from '../sim/ids.ts'
import type { Item } from '../sim/item.ts'
import type { Bread as BreadT, Distill, DistillCrop, Flour as FlourT, Fruit, FruitCtor, Get, GoodGroup, Infer, Oil as OilT, VOf } from './contracts.h.ts'

export const Base = 'base' as const
export const Mixed = 'mixed' as const

export const GreenZebra = 'green-zebra' as const
export const PinkLady = 'pink-lady' as const
export const Blenheim = 'blenheim' as const
export const Bing = 'bing' as const
export const KingstonBlack = 'kingston-black' as const
export const Klosterneuburger = 'klosterneuburger' as const
export const Keknyelu = 'keknyelu' as const
export const BlackRaspberry = 'black-raspberry' as const
export const SanMarzano = 'san-marzano' as const
export const Concord = 'concord' as const
export const Arbequina = 'arbequina' as const
export const Bintje = 'bintje' as const
export const RedFife = 'red-fife' as const

function crop<C extends GrownCrop>(id: C): FruitCtor<C> {
  const fn = <V extends VOf<C>>(variety: V): Fruit<C, V> => ({ kind: 'fruit', crop: id, variety })
  return Object.assign(fn, { pattern: 'fruit' as const, kind: 'fruit' as const, crop: id, materialize: () => fn(Base) })
}

export const Carrot = crop('carrot')
export const Potato = crop('potato')
export const Wheat = crop('wheat')
export const Tomato = crop('tomato')
export const Apple = crop('apple')
export const Apricot = crop('apricot')
export const Cherry = crop('cherry')
export const Olive = crop('olive')
export const Grape = crop('grape')
export const Raspberry = crop('raspberry')
export const Vanilla = crop('vanilla')
export const SugarCane = crop('sugar-cane')
export const Chilli = crop('chilli')

const DISTILL = {
  potato: { kind: 'spirit', spirit: SPIRIT_OF.potato },
  apricot: { kind: 'spirit', spirit: SPIRIT_OF.apricot },
  grape: { kind: 'cask', cask: CASK_OF.grape },
  apple: { kind: 'cask', cask: CASK_OF.apple },
} as const satisfies Distill

function withVariety<H extends object, A extends { variety?: unknown }>(head: H, of: A) {
  return 'variety' in of ? { ...head, variety: of.variety } : head
}

function alcoholOf(of: { crop: DistillCrop; variety?: VOf<DistillCrop> } | typeof Mixed) {
  if (of === Mixed) return { kind: 'spirit' as const, spirit: 'mixed' as const }
  return withVariety(DISTILL[of.crop], of)
}

export const Alcohol = Object.assign(alcoholOf, { pattern: 'alcohol' as const })

function jamOf(of: { crop: JamCrop; variety?: VOf<JamCrop> }) {
  return withVariety({ kind: 'jam' as const, crop: of.crop }, of)
}

export const Jam = Object.assign(jamOf, { pattern: 'jam' as const, kind: 'jam' as const })

export const Oil: OilT = { kind: 'oil' }
export const Flour: FlourT = { kind: 'flour' }
export const Bread: BreadT = { kind: 'bread' }

export const Fruits = {
  carrot: Carrot,
  potato: Potato,
  wheat: Wheat,
  tomato: Tomato,
  apple: Apple,
  apricot: Apricot,
  cherry: Cherry,
  olive: Olive,
  grape: Grape,
  raspberry: Raspberry,
  vanilla: Vanilla,
  'sugar-cane': SugarCane,
  chilli: Chilli,
} as const

export const BaseProduce = [Carrot, Potato, Wheat] as const
export const MidProduce = [Tomato, Apple, Apricot] as const
export const AdvProduce = [Cherry, Olive, Grape, Raspberry] as const
export const NamedProduce = [Tomato(GreenZebra), Apple(PinkLady), Apricot(Blenheim), Cherry(Bing)] as const
export const OfftypeNamedProduce = [
  Potato(Bintje),
  Wheat(RedFife),
  Tomato(SanMarzano),
  Raspberry(BlackRaspberry),
  Grape(Concord),
  Grape(Keknyelu),
  Apple(KingstonBlack),
  Apricot(Klosterneuburger),
  Olive(Arbequina),
] as const
export const Produce = [...BaseProduce, ...MidProduce, ...AdvProduce, ...OfftypeNamedProduce] as const
export const Alcohols = [Alcohol(Potato), Alcohol(Apricot), Alcohol(Grape), Alcohol(Apple), Alcohol(Mixed)] as const
export const SpecialtyAlcohol = [
  Alcohol(Apple(KingstonBlack)),
  Alcohol(Apricot(Klosterneuburger)),
  Alcohol(Grape(Keknyelu)),
] as const
export const Processed = [
  Jam(Cherry(Base)),
  Jam(Raspberry(Base)),
  Jam(Tomato(Base)),
  Jam(Apricot(Base)),
  Jam(Grape(Base)),
  Flour,
  Oil,
  Bread,
] as const
export const SpecialtyProcessed = [
  Jam(Raspberry(BlackRaspberry)),
  Jam(Tomato(SanMarzano)),
  Jam(Grape(Concord)),
] as const
export const Utility = [Vanilla, SugarCane, Chilli] as const

function pin(pattern: object): object {
  if (
    'variety' in pattern ||
    ('kind' in pattern && (pattern.kind === 'flour' || pattern.kind === 'oil' || pattern.kind === 'bread'))
  ) {
    return pattern
  }
  return { ...pattern, variety: Base }
}

function getOne(pattern: object): object {
  if (0 in pattern) return (pattern as readonly object[]).map(getOne)
  if ('materialize' in pattern) return (pattern as { materialize: () => object }).materialize()
  if ('pattern' in pattern && pattern.pattern === 'alcohol') return (Alcohols as readonly object[]).map(getOne)
  return pin(pattern)
}

export function get<P>(pattern: P): Get<P> {
  return getOne(pattern as object) as Get<P>
}

const FIELD = { kind: 1, crop: 1, variety: 1, spirit: 1, cask: 1, infused: 1 }

function takeFields(p: object): object {
  return Object.keys(p)
    .filter(k => k in FIELD)
    .reduce((o, k) => ({ ...o, [k]: p[k as keyof typeof p] }), {})
}

function infusedOf(inner: object): object {
  return { ...takeFields(inner), infused: true as const }
}

export const Infused = Object.assign(infusedOf, { infused: true as const })

function match(value: object, pattern: object): boolean {
  return Object.keys(pattern)
    .filter(k => k in FIELD)
    .every(k => k in value && value[k as keyof typeof value] === pattern[k as keyof typeof pattern])
}

export function is(value: Item | GoodGroup) {
  return <P>(pattern: P): boolean => {
    const p = pattern as object
    if (0 in p) return (p as readonly object[]).some(x => is(value)(x))
    if ('pattern' in p && p.pattern === 'alcohol') return is(value)(Alcohols)
    return match(value, p)
  }
}

export function matching<P>(pattern: P) {
  return (value: Item | GoodGroup): value is Infer<P> => is(value)(pattern)
}
