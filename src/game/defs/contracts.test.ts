import { describe, expect, test } from 'vitest'
import {
  AdvProduce,
  Alcohol,
  Apple,
  Apricot,
  Arbequina,
  Base,
  get,
  is,
  Jam,
  Klosterneuburger,
  MidProduce,
  Oil,
  Olive,
  PinkLady,
  Processed,
} from './contracts.ts'

const olive = { kind: 'fruit', crop: 'olive', variety: Base } as const
const pinkLady = { kind: 'fruit', crop: 'apple', variety: PinkLady } as const
const oil = { kind: 'oil', variety: Base } as const
const arbequinaOil = { kind: 'oil', variety: Arbequina } as const
const brandy = { kind: 'spirit', spirit: 'brandy', variety: Base } as const
const kloster = { kind: 'spirit', spirit: 'brandy', variety: Klosterneuburger } as const

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

  test('Oil root matches every oil; Oil(Arbequina) pins', () => {
    expect(is(oil)(Oil)).toBe(true)
    expect(is(arbequinaOil)(Oil)).toBe(true)
    expect(is(oil)(Oil(Base))).toBe(true)
    expect(is(oil)(Oil(Arbequina))).toBe(false)
    expect(is(arbequinaOil)(Oil(Arbequina))).toBe(true)
    expect(is(arbequinaOil)(Processed)).toBe(false)
    expect(is(oil)(Processed)).toBe(true)
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
    expect(get(Oil)).toEqual({ kind: 'oil', variety: Base })
    expect(get(Oil(Arbequina))).toEqual({ kind: 'oil', variety: Arbequina })
  })
})
