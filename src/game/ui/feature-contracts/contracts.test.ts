import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { describe, expect, test } from 'vitest'
import { m } from '../../../paraglide/messages.js'
import { HARDNESS } from '../../defs/rules.ts'
import { ANY_NEED, DIFFICULTY_CEILING } from '../../sim/feature-contracts/market.ts'
import type { ContractOffer } from '../../sim/feature-contracts/market.h.ts'
import { capFull, offerHover } from './contracts.tsx'

const offer: ContractOffer = {
  id: 1,
  slot: 0,
  company: 'whole-cart',
  difficulty: 12,
  stars: 2,
  band: 'normal',
  days: 2,
  conditions: [],
  lines: [{ kind: 'plain', good: 'carrot', amount: 4, need: ANY_NEED }],
  prize: { kind: 'cash' },
  clean: 80,
  markup: 0.2,
  reward: 96,
  penalty: 16,
}

function child(node: ReactNode, i: number): ReactNode {
  if (!isValidElement(node)) throw new Error('node')
  const kids = (node as ReactElement<{ children: ReactNode[] }>).props.children
  return kids[i]
}

describe('contracts hover', () => {
  test('The offer hover shows the difficulty ceiling, the fee for cancelling right after accepting, and the running limit.', () => {
    const tip = offerHover(offer, true, 5, HARDNESS.normal.cancelMin)
    if (tip === undefined) throw new Error('tip')
    expect(String(child(tip.description, 0))).toContain(`${offer.difficulty}/${DIFFICULTY_CEILING}`)
    expect(String(child(tip.description, 0))).not.toContain('/40')
    const cancel = child(tip.description, 4)
    if (!isValidElement(cancel)) throw new Error('coin')
    expect((cancel as ReactElement<{ n: number }>).props.n).toBe(Math.round(HARDNESS.normal.cancelMin * offer.clean))
    expect((cancel as ReactElement<{ n: number }>).props.n).not.toBe(offer.penalty)
    const full = child(tip.description, 7)
    if (!isValidElement(full)) throw new Error('full')
    expect((full as ReactElement<{ children: string }>).props.children).toBe(m.market_cap_five())
    expect(capFull(6)).toBe(m.market_cap_six())
    expect(capFull(4)).toBe(m.market_cap_four())
    expect(capFull(3)).toBe(m.market_cap_three())
  })
})
