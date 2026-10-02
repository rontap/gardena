import { describe, expect, test } from 'vitest'
import {
  AdvProduce,
  Alcohol,
  Apple,
  Apricot,
  Arbequina,
  Base,
  Bread,
  Cherry,
  Fruits,
  get,
  Infused,
  is,
  Jam,
  Klosterneuburger,
  matching,
  MidProduce,
  NamedProduce,
  OfftypeNamedProduce,
  Oil,
  Olive,
  PinkLady,
  Processed,
  Produce,
} from './contracts.ts'

const olive = { kind: 'fruit', crop: 'olive', variety: Base } as const
const pinkLady = { kind: 'fruit', crop: 'apple', variety: PinkLady } as const
const oil = { kind: 'oil' } as const
const brandy = { kind: 'spirit', spirit: 'brandy', variety: Base } as const
const kloster = { kind: 'spirit', spirit: 'brandy', variety: Klosterneuburger } as const
const jam = { kind: 'jam', crop: 'cherry', variety: Base, infused: false } as const
const jamInfused = { kind: 'jam', crop: 'cherry', variety: Base, infused: true } as const

describe('contracts.is', () => {
  test('crop root matches every variety; applied pins it', () => {
    expect(is(olive)(Olive)).toBe(true)
    expect(is(olive)(Olive(Base))).toBe(true)
    expect(is(olive)(Olive(Arbequina))).toBe(false)
    expect(is(olive)(Oil)).toBe(false)
    expect(is(pinkLady)(Apple)).toBe(true)
    expect(is(pinkLady)(Apple(Base))).toBe(false)
    expect(is(pinkLady)(Apple(PinkLady))).toBe(true)
    expect(is(pinkLady)(MidProduce)).toBe(true)
    expect(is(olive)(AdvProduce)).toBe(true)
    expect(is(olive)(MidProduce)).toBe(false)
  })

  test('Oil is kind-only', () => {
    expect(is(oil)(Oil)).toBe(true)
    expect(is(oil)(Processed)).toBe(true)
    expect(is({ kind: 'bread' })(Bread)).toBe(true)
    expect(is({ kind: 'bread' })(Processed)).toBe(true)
    expect(is(olive)(Oil)).toBe(false)
    expect(is(olive)(Olive(Arbequina))).toBe(false)
    expect(is(olive)(Fruits.olive)).toBe(true)
  })

  test('Alcohol root matches every alcohol; Alcohol(Apricot) is brandy any variety', () => {
    expect(is(brandy)(Alcohol)).toBe(true)
    expect(is(kloster)(Alcohol)).toBe(true)
    expect(is(brandy)(Alcohol(Apricot))).toBe(true)
    expect(is(kloster)(Alcohol(Apricot))).toBe(true)
    expect(is(kloster)(Alcohol(Apricot(Base)))).toBe(false)
    expect(is(kloster)(Alcohol(Apricot(Klosterneuburger)))).toBe(true)
    expect(is(olive)(Alcohol)).toBe(false)
    expect(is(brandy)(Jam)).toBe(false)
  })

  test('Infused pins infused; Jam still matches both', () => {
    expect(is(jam)(Jam)).toBe(true)
    expect(is(jamInfused)(Jam)).toBe(true)
    expect(is(jam)(Infused)).toBe(false)
    expect(is(jamInfused)(Infused)).toBe(true)
    expect(is(jamInfused)(Infused(Jam))).toBe(true)
    expect(is(jamInfused)(Infused(Jam(Cherry)))).toBe(true)
    expect(is(jam)(Infused(Jam))).toBe(false)
  })

  test('matching is is flipped for filter', () => {
    expect([olive, pinkLady].filter(matching(Olive))).toEqual([olive])
  })

  test('OfftypeNamedProduce is Produce; NamedProduce is produce-purpose', () => {
    const bintje = { kind: 'fruit', crop: 'potato', variety: 'bintje' } as const
    const arbequina = { kind: 'fruit', crop: 'olive', variety: Arbequina } as const
    expect(is(bintje)(OfftypeNamedProduce)).toBe(true)
    expect(is(bintje)(Produce)).toBe(true)
    expect(is(bintje)(NamedProduce)).toBe(false)
    expect(is(arbequina)(OfftypeNamedProduce)).toBe(true)
    expect(is(pinkLady)(NamedProduce)).toBe(true)
    expect(is(pinkLady)(OfftypeNamedProduce)).toBe(false)
  })
})

describe('contracts.get', () => {
  test('get pins omitted variety to Base; applied identity is unchanged', () => {
    expect(get(Alcohol(Apricot))).toEqual({ kind: 'spirit', spirit: 'brandy', variety: Base })
    expect(get(Apricot(Klosterneuburger))).toEqual({
      kind: 'fruit',
      crop: 'apricot',
      variety: Klosterneuburger,
    })
    expect(get(Apple)).toEqual({ kind: 'fruit', crop: 'apple', variety: Base })
    expect(get(MidProduce)).toEqual([
      { kind: 'fruit', crop: 'tomato', variety: Base },
      { kind: 'fruit', crop: 'apple', variety: Base },
      { kind: 'fruit', crop: 'apricot', variety: Base },
    ])
    expect(get(Oil)).toEqual({ kind: 'oil' })
    expect(get(Bread)).toEqual({ kind: 'bread' })
  })
})
