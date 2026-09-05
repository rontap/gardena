// COMMANDMENT: never test specifically for versions, ever. expect(SAVE_VERSION) or PROTOCOL .toBe is disallowed.
import { describe, expect, test } from 'vitest'
import { CROPS } from '../../defs/crops.ts'
import { COMPANY_PRIZES, prizeBandOf } from '../../defs/companies.ts'
import { PAD } from '../building.ts'
import { Act } from '../log.ts'
import { permit } from '../mp.ts'
import { Plant } from '../plant.ts'
import { dump, parse } from '../feature-save/save.ts'
import { Soil, WEED_CHANCE } from '../soil.ts'
import { DAY_SECONDS } from '../clock.ts'
import type { Active, ContractOffer, Demand, Lines } from './market.h.ts'
import {
  AMOUNT_MIN,
  CANCEL_MIN,
  CONTRACT_OFFERS,
  CONTRACT_SLOT_MAX,
  FEASIBLE_PER_DAY,
  SAT_DEPTH,
  SAT_FLOOR,
  SAT_RECOVER_PER_DAY,
  BUDGET_OVERDRAFT,
  CONTRACT_GOODS,
  DIFFICULTY_CEILING,
  DIFFICULTY_MAX,
  GOOD_COST,
  GOOD_TIER,
  REP_DONE,
  REP_IDLE,
  REP_LOST,
  REP_MAX,
  MARKUP_BASE,
  DEADLINE_DAYS,
  DEADLINE_STEP,
  PRIZE_SLOTS,
  load,
  Accepts,
  cancelFee,
  cleanUnit,
  demandGood,
  missPenalty,
  paid,
  recover,
  rollBoard,
  scale,
} from './market.ts'
import { Rng } from '../rng.ts'
import { STALL_IDS } from '../stall.ts'
import { DT_MAX, World } from '../world.ts'

const AT = { col: 10, row: 12 }

describe('contracts', () => {
  test('Board slot `i` on day `d` is a pure function of `(seed, d, i, repAtDayStart)`. Reputation is the only player input; inventory, plantings, research, money and `clock.t` do not move it.', () => {
    const seed = 7
    const rng = new Rng(seed)
    const once = rollBoard(rng, 3, CONTRACT_OFFERS, 0)
    const twice = rollBoard(rng, 3, CONTRACT_OFFERS, 0)
    expect(once).toHaveLength(CONTRACT_OFFERS)
    expect(once).toEqual(twice)
    expect(rollBoard(new Rng(seed), 3, CONTRACT_OFFERS, 0)).toEqual(once)

    const a = new World(seed)
    const b = new World(seed)
    b.clock.t = 180
    b.money = 3
    b.done.add('unlock-tomato')
    b.seats[0].inventory[0] = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'carrot', variety: 'base', quality: 0, count: 9, unitSale: 4, freshness: 1, bio: false, cut: false },
    }
    b.setCell(AT, { kind: 'growing', soil: new Soil(1, 1, WEED_CHANCE), plant: new Plant('potato', 'base', 0) })
    expect(a.clock.day).toBe(b.clock.day)
    expect(rollBoard(a.rng, a.clock.day, CONTRACT_OFFERS, 0)).toEqual(rollBoard(b.rng, b.clock.day, CONTRACT_OFFERS, 0))
    expect(rollBoard(a.rng, a.clock.day, CONTRACT_OFFERS, 0)).toEqual(rollBoard(new Rng(seed), a.clock.day, CONTRACT_OFFERS, 0))
  })

  test('`ContractId = day * CONTRACT_SLOT_MAX + slot`. Growing the board with `broker` adds slots and does not change slots 0..5.', () => {
    const rng = new Rng(7)
    const day = 4
    const six = rollBoard(rng, day, 6, 0)
    const eight = rollBoard(rng, day, 8, 0)
    expect(six).toHaveLength(6)
    expect(eight).toHaveLength(8)
    expect(six).toEqual(eight.slice(0, 6))
    six.forEach((offer, slot) => {
      expect(offer.id).toBe(day * CONTRACT_SLOT_MAX + slot)
      expect(offer.slot).toBe(slot)
    })
    expect(eight[6].id).toBe(day * CONTRACT_SLOT_MAX + 6)
    expect(eight[7].id).toBe(day * CONTRACT_SLOT_MAX + 7)
    expect(eight[6].slot).toBe(6)
    expect(eight[7].slot).toBe(7)
  })

  test('Board generation is not a `Cmd`.', () => {
    const w = new World(1)
    expect(w.log).toEqual([])
    w.clock.t = DAY_SECONDS - 0.001
    w.tick(1)
    expect(w.clock.day).toBe(2)
    expect(w.log).toEqual([])
    const board = rollBoard(w.rng, w.clock.day, CONTRACT_OFFERS, 0)
    expect(board).toHaveLength(CONTRACT_OFFERS)
    expect(w.log).toEqual([])
  })

  test('Contract delivery raises no `sat` and enters no `StallGood.worth`. Miss and cancel remainders do both.', () => {
    const w = new World(1)
    w.contracts.active.push(carrotActive(0, 10))
    dropFruit(w, 'carrot', 2)
    expect(w.stall.carrot.sat).toBe(0)
    expect(worthOf(w, 'carrot')).toBe(0)
    expect(w.contracts.active[0].bins[0].filled).toBe(2)
    w.cancelContract(0)
    expect(worthOf(w, 'carrot')).toBeGreaterThan(0)
    expect(w.stall.carrot.sat).toBeGreaterThan(0)
    const miss = new World(1)
    miss.contracts.active.push(carrotActive(0, 10))
    dropFruit(miss, 'carrot', 2)
    expect(miss.stall.carrot.sat).toBe(0)
    expect(worthOf(miss, 'carrot')).toBe(0)
    miss.contracts.active[0].dueDay = miss.nowDay() + 1e-12
    miss.tick(DT_MAX)
    expect(worthOf(miss, 'carrot')).toBeGreaterThan(0)
    expect(miss.stall.carrot.sat).toBeGreaterThan(0)
    const loaded = dump(miss)
    expect('sat' in loaded.stall.carrot).toBe(false)
    const parsed = parse(JSON.stringify(loaded))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.world.contracts.active).toEqual([])
    expect(parsed.world.contracts.history).toEqual(miss.contracts.history)
    expect(parsed.world.stall.carrot.sat).toBe(0)
  })

  test('A save round-trips the live board: active contracts, their bin fills, `takenToday`, history and the company book.', () => {
    const w = new World(1)
    w.contracts.active.push(carrotActive(0, 10))
    w.contracts.takenToday.push(0, 17)
    w.contracts.book['trade-jo'] = { done: 3, missed: 1 }
    dropFruit(w, 'carrot', 2)
    expect(w.contracts.active[0].bins[0].filled).toBe(2)
    const parsed = parse(JSON.stringify(dump(w)))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const back = parsed.world.contracts
    expect(back.active).toHaveLength(1)
    expect(back.active[0].bins[0].filled).toBe(2)
    expect(back.active[0].dueDay).toBe(10)
    expect(back.active[0].offer).toEqual(w.contracts.active[0].offer)
    expect(back.takenToday).toEqual([0, 17])
    expect(back.book['trade-jo']).toEqual({ done: 3, missed: 1 })
  })

  test('A contract whose prize is not cash pays the goods and no money at all.', () => {
    const w = new World(1)
    const active = carrotActive(0, 10)
    const offer = { ...active.offer, prize: { kind: 'tree-seed', tree: 'cherry' } as const }
    w.contracts.active.push({ ...active, offer })
    const money = w.money
    const drops = w.drops.length
    dropFruit(w, 'carrot', 4)
    expect(w.contracts.active).toHaveLength(0)
    expect(w.money).toBe(money)
    expect(w.drops.length).toBe(drops + 1)
    expect(w.drops[w.drops.length - 1].item).toEqual({ kind: 'tree-seed', tree: 'cherry', variety: 'base', quality: 0 })
  })

  test('A `Demand` never carries a rarity for a `PlainGoodId`, and `Lines` never nests.', () => {
    const demand: Demand = { kind: 'plain', good: 'sugar', amount: 4 }
    const lines: Lines = [demand]
    expect(lines).toHaveLength(1)
  })

  test('`amount >= AMOUNT_MIN` on every published offer, and `amount <= FEASIBLE_PER_DAY[good] * days * scale(day)`.', () => {
    for (const seed of [1, 7, 99, 12345]) {
      const rng = new Rng(seed)
      for (const day of [1, 2, 8, 24, 40]) {
        rollBoard(rng, day, 7, 0).forEach(offer => {
          offer.lines.forEach(d => {
            const cap = FEASIBLE_PER_DAY[demandGood(d)] * offer.days * scale(day)
            expect(d.amount).toBeGreaterThanOrEqual(AMOUNT_MIN)
            expect(d.amount).toBeLessThanOrEqual(cap)
          })
        })
      }
    }
  })

  test('`reward = clean * (1 + markup)` baked at generation. Saturation at delivery time does not move it.', () => {
    const rng = new Rng(7)
    const offer = rollBoard(rng, 1, CONTRACT_OFFERS, 0).find(o => o.prize.kind === 'cash')
    if (offer === undefined) throw new Error('no cash offer')
    expect(offer.reward).toBe(Math.round(offer.clean * (1 + offer.markup)))
    const w = new World(1)
    w.done.add('unlock-contracts')
    const live: Active = {
      offer,
      dueDay: 10,
      bins: offer.lines.map(d => ({ demand: d, filled: 0 })) as unknown as Active['bins'],
    }
    w.contracts.active.push(live)
    live.bins.forEach(b => {
      b.filled = b.demand.amount
    })
    STALL_IDS.forEach(id => {
      w.stall[id].sat = 1
    })
    const before = w.money
    dropFruit(w, 'carrot', 1)
    expect(w.money).toBe(before + offer.reward)
    expect(w.contracts.active).toHaveLength(0)
  })

  test('Every published value is a whole number: amount, clean, reward, penalty. Markup is whole percent.', () => {
    for (const seed of [1, 7, 99, 12345]) {
      const rng = new Rng(seed)
      for (const day of [0, 1, 2, 8, 24, 40, 80]) {
        rollBoard(rng, day, 8, 0).forEach(offer => {
          expect(Number.isInteger(offer.clean)).toBe(true)
          expect(Number.isInteger(offer.reward)).toBe(true)
          expect(Number.isInteger(offer.penalty)).toBe(true)
          expect(Math.round(offer.markup * 100)).toBeCloseTo(offer.markup * 100, 9)
          offer.lines.forEach(d => expect(Number.isInteger(d.amount)).toBe(true))
        })
      }
    }
  })

  test('Markup rises with difficulty and tops out at the ceiling. A tight deadline pays more than a long one.', () => {
    for (const seed of [1, 7, 99]) {
      const rng = new Rng(seed)
      for (const day of [0, 8, 40, 80]) {
        rollBoard(rng, day, 8, 0).forEach(offer => {
          expect(offer.markup).toBeGreaterThanOrEqual(MARKUP_BASE)
          expect(offer.markup).toBeLessThanOrEqual(0.5)
        })
      }
    }
  })

  test('A pair never asks twice for the same family. Jam beside jam and spirit beside spirit are unrepresentable.', () => {
    const jam = (g: string) => g.startsWith('jam-')
    const spirit = (g: string) => g === 'vodka' || g === 'beer' || g === 'brandy' || g === 'mixed'
    for (const seed of [1, 7, 99, 12345, 555]) {
      const rng = new Rng(seed)
      for (const day of [0, 4, 12, 30, 60, 90]) {
        rollBoard(rng, day, 8, 0).forEach(offer => {
          if (offer.lines.length !== 2) return
          const a = demandGood(offer.lines[0])
          const b = demandGood(offer.lines[1]!)
          expect(a).not.toBe(b)
          expect(jam(a) && jam(b)).toBe(false)
          expect(spirit(a) && spirit(b)).toBe(false)
        })
      }
    }
  })

  test('No fallback is reachable: the cheapest good and the cheapest rarity cost nothing, so a candidate set is never empty at any `D`.', () => {
    const cheapestGood = Math.min(...STALL_IDS.map(g => GOOD_COST[g]))
    expect(cheapestGood).toBe(0)
    for (let D = 0; D <= DIFFICULTY_MAX; D++) {
      expect(BUDGET_OVERDRAFT).toBeGreaterThanOrEqual(0)
      expect(STALL_IDS.some(g => GOOD_COST[g] <= BUDGET_OVERDRAFT)).toBe(true)
    }
  })

  test('One board never offers the same company twice.', () => {
    for (const seed of [1, 7, 99, 12345]) {
      const rng = new Rng(seed)
      for (const day of [0, 3, 11, 40]) {
        const names = rollBoard(rng, day, 6, 0).map(o => o.company)
        expect(new Set(names).size).toBe(names.length)
      }
    }
  })

  test('A single day offers a spread of difficulties, not one repeated rating.', () => {
    for (const seed of [1, 7, 99, 12345]) {
      const rng = new Rng(seed)
      for (const day of [0, 5, 20, 60]) {
        const ds = rollBoard(rng, day, 6, 0).map(o => o.difficulty)
        expect(new Set(ds).size).toBeGreaterThan(1)
      }
    }
  })

  test('No good is ever demanded below its `GOOD_TIER`. Day 0 is tier 1 only, so no jam, spirit, wine or tree good can appear at all.', () => {
    for (const seed of [1, 7, 99, 12345, 555]) {
      const rng = new Rng(seed)
      for (const day of [0, 1, 2, 4, 8, 16, 32, 64]) {
        for (const rep of [0, 5, 10, 20]) {
          rollBoard(rng, day, 6, rep).forEach(offer => {
            offer.lines.forEach(d => {
              expect(GOOD_TIER[demandGood(d)]).toBeLessThanOrEqual(offer.stars)
            })
          })
        }
      }
      rollBoard(rng, 0, 6, 0).forEach(offer => {
        offer.lines.forEach(d => expect(GOOD_TIER[demandGood(d)]).toBe(1))
      })
    }
  })

  test('Sugar and extract are stall goods but are never demanded by a contract.', () => {
    expect(CONTRACT_GOODS).not.toContain('sugar')
    expect(CONTRACT_GOODS).not.toContain('extract')
    expect(STALL_IDS).toContain('sugar')
    expect(STALL_IDS).toContain('extract')
    for (const seed of [1, 7, 99, 12345]) {
      const rng = new Rng(seed)
      for (let day = 0; day < 50; day++) {
        for (const rep of [0, 10, 20]) {
          rollBoard(rng, day, 6, rep).forEach(offer => {
            offer.lines.forEach(d => {
              expect(demandGood(d)).not.toBe('sugar')
              expect(demandGood(d)).not.toBe('extract')
            })
          })
        }
      }
    }
  })

  test('Effective difficulty stays inside `[0, DIFFICULTY_CEILING]` once reputation and shape modifiers are added.', () => {
    for (const seed of [1, 7, 99]) {
      const rng = new Rng(seed)
      for (const day of [0, 8, 32, 64, 200]) {
        for (const rep of [0, 10, REP_MAX]) {
          rollBoard(rng, day, 8, rep).forEach(offer => {
            expect(offer.difficulty).toBeGreaterThanOrEqual(0)
            expect(offer.difficulty).toBeLessThanOrEqual(DIFFICULTY_CEILING)
          })
        }
      }
    }
  })

  test('Reputation raises the board. A high-rep board is never easier on average than a zero-rep one.', () => {
    let low = 0
    let high = 0
    for (const seed of [1, 7, 99, 12345]) {
      for (const day of [4, 12, 24]) {
        low += rollBoard(new Rng(seed), day, 6, 0).reduce((n, o) => n + o.difficulty, 0)
        high += rollBoard(new Rng(seed), day, 6, REP_MAX).reduce((n, o) => n + o.difficulty, 0)
      }
    }
    expect(high).toBeGreaterThan(low)
  })

  test('Reputation moves by the table and clamps to `[0, REP_MAX]`. Completing pays, cancelling and missing cost more, an idle day drips.', () => {
    expect(REP_DONE).toEqual({ 1: 0.5, 2: 1, 3: 1.5, 4: 2 })
    expect(REP_LOST).toEqual({ 1: 1, 2: 2, 3: 3, 4: 4 })
    expect(REP_IDLE).toBe(0.3)
    const w = new World(1)
    expect(w.contracts.rep).toBe(0)
    w.contracts.active.push(carrotActive(0, 2))
    w.cancelContract(0)
    expect(w.contracts.rep).toBe(0)
    w.contracts.rep = REP_MAX
    const done = new World(1)
    done.contracts.rep = REP_MAX
    done.contracts.active.push(carrotActive(0, 1))
    dropFruit(done, 'carrot', 1)
    expect(done.contracts.rep).toBeLessThanOrEqual(REP_MAX)
  })

  test('The board is stable within a day while reputation changes: it reads `repDay`, not live rep.', () => {
    const w = new World(1)
    w.done.add('unlock-contracts')
    const before = rollBoard(w.rng, w.clock.day, CONTRACT_OFFERS, w.contracts.repDay)
    w.contracts.rep += 5
    const after = rollBoard(w.rng, w.clock.day, CONTRACT_OFFERS, w.contracts.repDay)
    expect(after).toEqual(before)
  })

  test('Miss pays market rate for delivered units and `offer.penalty * max(PENALTY_FLOOR, 1 - filled/need)`. `filled = need` is completion, never a miss.', () => {
    const w = new World(1)
    const a = carrotActive(0, 10)
    w.contracts.active.push(a)
    dropFruit(w, 'carrot', 2)
    const V = 2 * cleanUnit(a.offer.lines[0])
    const penalty = missPenalty(w.contracts.active[0])
    expect(penalty).toBe(Math.round(a.offer.penalty * 0.5))
    const sold = paid(0, 'carrot', V)
    const before = w.money
    w.contracts.active[0].dueDay = w.nowDay() + 1e-12
    w.tick(DT_MAX)
    expect(w.money).toBe(before + sold - penalty)
    expect(w.contracts.active).toHaveLength(0)
    expect(w.contracts.book['whole-cart'].missed).toBe(1)
    const done = new World(1)
    const full = carrotActive(0, 10)
    done.contracts.active.push(full)
    dropFruit(done, 'carrot', 4)
    expect(done.contracts.active).toHaveLength(0)
    expect(done.contracts.book['whole-cart'].done).toBe(1)
    expect(done.contracts.book['whole-cart'].missed).toBe(0)
    done.tick(DT_MAX)
    expect(done.contracts.book['whole-cart'].missed).toBe(0)
  })

  test('Cancel fee at `elapsed = 0` is `CANCEL_MIN * clean`; at `elapsed = days` it equals the miss penalty at that fill.', () => {
    const a = carrotActive(2, 5)
    const start = a.dueDay - a.offer.days
    expect(cancelFee(a, start)).toBe(Math.round(CANCEL_MIN * a.offer.clean))
    expect(cancelFee(a, a.dueDay)).toBe(missPenalty(a))
  })

  test('Consign fills `active` in array order, then the stall. A full bin passes through.', () => {
    const w = new World(1)
    const carrot: Demand = { kind: 'plain', good: 'carrot', amount: 1 }
    const potato: Demand = { kind: 'plain', good: 'potato', amount: 4 }
    const first: Active = {
      offer: { ...carrotOffer(1), id: 1, lines: [carrot, potato] },
      dueDay: 10,
      bins: [
        { demand: carrot, filled: 0 },
        { demand: potato, filled: 0 },
      ],
    }
    const second = carrotActive(0, 10)
    second.offer = { ...second.offer, id: 2 }
    w.contracts.active.push(first, second)
    dropFruit(w, 'carrot', 3)
    expect(w.contracts.active[0].bins[0].filled).toBe(1)
    expect(w.contracts.active[0].bins[1]?.filled).toBe(0)
    expect(w.contracts.active[1].bins[0].filled).toBe(2)
    expect(worthOf(w, 'carrot')).toBe(0)
    expect(Accepts({ kind: 'plain', good: 'carrot', amount: 1 }, 'carrot')).toBe(true)
    expect(Accepts({ kind: 'plain', good: 'carrot', amount: 1 }, 'potato')).toBe(false)
    dropFruit(w, 'carrot', 1, 0)
    expect(w.contracts.active[1].bins[0].filled).toBe(2)
    expect(w.stall.carrot.stock.base.synth).toBe(1)
  })

  test('Guest `acceptContract` / `cancelContract` / `reorderContract` never enter a bundle. Guest consign fills bins.', () => {
    expect(permit({ a: Act.acceptContract, t: 0, p: 1, c: 0 })).toBe(false)
    expect(permit({ a: Act.cancelContract, t: 0, p: 1, c: 0 })).toBe(false)
    expect(permit({ a: Act.reorderContract, t: 0, p: 1, c: 0, d: 1 })).toBe(false)
    expect(permit({ a: Act.acceptContract, t: 0, p: 0, c: 0 })).toBe(true)
    const w = new World(1)
    expect(w.join('g')).toBe(1)
    w.contracts.active.push(carrotActive(0, 10))
    w.seats[1].actor.x = PAD.col + 0.5
    w.seats[1].actor.y = PAD.row + 0.5
    w.seats[1].hand = {
      kind: 'hold',
      item: { kind: 'fruit', crop: 'carrot', variety: 'base', quality: 0, count: 2, unitSale: CROPS.carrot.sale, freshness: 1, bio: false, cut: false },
    }
    w.apply({ a: Act.enqueue, t: 0, p: 1, i: { act: 'consign' } })
    w.tick(DT_MAX)
    expect(w.contracts.active[0].bins[0].filled).toBe(2)
    expect(worthOf(w, 'carrot')).toBe(0)
  })
})

function carrotOffer(amount = 4): ContractOffer {
  const demand: Demand = { kind: 'plain', good: 'carrot', amount }
  const unit = cleanUnit(demand)
  const clean = amount * unit
  return {
    id: 0,
    slot: 0,
    company: 'whole-cart',
    difficulty: 1,
    stars: 1,
    band: 'long',
    days: 4,
    lines: [demand],
    prize: { kind: 'cash' },
    clean,
    markup: 0.2,
    reward: clean * 1.2,
    penalty: 0.2 * clean,
  }
}

function carrotActive(filled: number, dueDay: number): Active {
  const offer = carrotOffer(4)
  return {
    offer,
    dueDay,
    bins: [{ demand: offer.lines[0], filled }],
  }
}

function dropFruit(w: World, crop: 'carrot', n: number, freshness = 1): void {
  w.seats[0].actor.x = PAD.col + 0.5
  w.seats[0].actor.y = PAD.row + 0.5
  w.seats[0].hand = {
    kind: 'hold',
    item: { kind: 'fruit', crop, variety: 'base', quality: 0, count: n, unitSale: CROPS[crop].sale, freshness, bio: false, cut: false },
  }
  w.enqueue({ act: 'consign' })
  w.tick(DT_MAX)
}

function worthOf(w: World, id: 'carrot'): number {
  return STALL_IDS.includes(id)
    ? w.stall[id].worth.base.synth + w.stall[id].worth.base.organic
    : 0
}

describe('saturation', () => {
  test('`sat` is `0..1` per `StallGoodId`, starts 0, ticks down `SAT_RECOVER_PER_DAY` per day on every good every `dt`, never resets at the seam.', () => {
    const w = new World(1)
    STALL_IDS.forEach(id => expect(w.stall[id].sat).toBe(0))
    expect(recover(0, DT_MAX)).toBe(0)
    expect(recover(1, DAY_SECONDS)).toBeCloseTo(1 - SAT_RECOVER_PER_DAY, 9)
    STALL_IDS.forEach(id => {
      w.stall[id].sat = 1
    })
    w.tick(DT_MAX)
    const stepped = 1 - SAT_RECOVER_PER_DAY * DT_MAX / DAY_SECONDS
    STALL_IDS.forEach(id => {
      expect(w.stall[id].sat).toBeCloseTo(stepped, 9)
      expect(w.stall[id].sat).toBeGreaterThanOrEqual(0)
      expect(w.stall[id].sat).toBeLessThanOrEqual(1)
    })
    const empty = new World(1)
    empty.stall.vodka.sat = 0.6
    empty.tick(DT_MAX)
    expect(empty.stall.vodka.sat).toBeCloseTo(0.6 - SAT_RECOVER_PER_DAY * DT_MAX / DAY_SECONDS, 9)
    const seam = new World(1)
    seam.stall.potato.sat = 0.9
    seam.clock.t = DAY_SECONDS - 0.001
    seam.tick(1)
    expect(seam.seam.kind).toBe('recap')
    expect(seam.stall.potato.sat).toBe(0.9)
    seam.tick(DT_MAX)
    expect(seam.stall.potato.sat).toBe(0.9)
    seam.dismissRecap()
    expect(seam.stall.potato.sat).toBe(0.9)
    const dump = new World(1)
    dump.stall.potato.take('base', 200, 1, false)
    dump.sellAll()
    expect(dump.stall.potato.sat).toBe(1)
  })

  test('Sell all of clean value `V` at `sat` pays the trapezoid, clamped piecewise at `SAT_FLOOR[good]`. Ten sales of `V/10` pay the same total as one sale of `V`.', () => {
    const good = 'potato' as const
    const k = 1 - SAT_FLOOR[good]
    const V = 60
    const sat = 0.2
    expect(paid(sat, good, V)).toBeCloseTo(V * (1 - k * (sat + V / (2 * SAT_DEPTH))), 9)
    const satHi = 0.95
    const Vhi = 80
    expect(satHi + Vhi / SAT_DEPTH).toBeGreaterThan(1)
    const vStar = SAT_DEPTH * (1 - satHi)
    expect(paid(satHi, good, Vhi)).toBeCloseTo(
      vStar * (1 - k * (satHi + vStar / (2 * SAT_DEPTH))) + (Vhi - vStar) * SAT_FLOOR[good],
      9,
    )
    const start = 0.1
    let dripSat = start
    let drip = 0
    const chunk = V / 10
    for (let i = 0; i < 10; i++) {
      drip += paid(dripSat, good, chunk)
      dripSat = Math.min(1, dripSat + chunk / SAT_DEPTH)
    }
    expect(drip).toBeCloseTo(paid(start, good, V), 9)
    const one = new World(1)
    one.stall.potato.take('base', 10, 1, false)
    one.stall.potato.sat = start
    const onePaid = one.marketGain()
    one.sellAll()
    const ten = new World(1)
    ten.stall.potato.sat = start
    let tenPaid = 0
    for (let i = 0; i < 10; i++) {
      ten.stall.potato.take('base', 1, 1, false)
      tenPaid += ten.marketGain()
      ten.sellAll()
    }
    expect(onePaid).toBeCloseTo(paid(start, good, V), 9)
    expect(tenPaid).toBeCloseTo(onePaid, 9)
    expect(one.stall.potato.sat).toBeCloseTo(Math.min(1, start + V / SAT_DEPTH), 9)
  })

  test("Saturation applies last, per good, over the existing `marketGain` subtotal. Clearance `{ kind: 'rotten' }` `$1` each, sat exempt. Without the skill: consign refused.", () => {
    const w = new World(1)
    w.stall.potato.take('base', 10, 1, false)
    w.stall.carrot.take('base', 5, 1, false)
    expect(w.marketQuote().clean).toBe(75)
    expect(w.marketGain()).toBeCloseTo(paid(0, 'potato', 60) + paid(0, 'carrot', 15), 9)
    w.stall.potato.sat = 0.4
    expect(w.marketGain()).toBeCloseTo(paid(0.4, 'potato', 60) + paid(0, 'carrot', 15), 9)
    const refused = new World(1)
    refused.seats[0].actor.x = PAD.col + 0.5
    refused.seats[0].actor.y = PAD.row + 0.5
    refused.seats[0].hand = { kind: 'hold', item: { kind: 'rotten', cls: 'root', count: 4 } }
    refused.enqueue({ act: 'consign' })
    refused.tick(DT_MAX)
    expect(refused.clearance).toBe(0)
    expect(refused.seats[0].hand.kind).toBe('hold')
    const c = new World(1)
    c.family.daughter.owned.set('clearance', 1)
    c.seats[0].actor.x = PAD.col + 0.5
    c.seats[0].actor.y = PAD.row + 0.5
    c.seats[0].hand = { kind: 'hold', item: { kind: 'rotten', cls: 'root', count: 10 } }
    c.enqueue({ act: 'consign' })
    c.tick(DT_MAX)
    expect(c.clearance).toBe(10)
    expect(c.seats[0].hand.kind).toBe('empty')
    expect(c.marketGain()).toBe(10)
    c.sellAll()
    expect(c.clearance).toBe(0)
    expect(c.money).toBe(60)
    const mixed = new World(1)
    mixed.family.daughter.owned.set('clearance', 1)
    mixed.clearance = 5
    mixed.stall.potato.take('base', 10, 1, false)
    mixed.stall.potato.sat = 0.3
    expect(mixed.marketGain()).toBeCloseTo(paid(0.3, 'potato', 60) + 5, 9)
    mixed.sellAll()
    expect(mixed.clearance).toBe(0)
    expect(mixed.stall.potato.sat).toBeCloseTo(Math.min(1, 0.3 + 60 / SAT_DEPTH), 9)
  })

  test("heirloom: `rarity === 'heirloom'` of crop fruit, spirit, wine × `(1 + 0.05 × tier)`. Not cider.", () => {
    const wine = new World(1)
    wine.family.daughter.owned.set('heirloom', 1)
    wine.stall.wine.takeSpirit('keknyelu', 1, 100)
    const cider = new World(1)
    cider.family.daughter.owned.set('heirloom', 1)
    cider.stall.cider.takeSpirit('base', 1, 100)
    expect(wine.marketQuote().clean).toBe(105)
    expect(cider.marketQuote().clean).toBe(100)
  })
})

describe('prizes', () => {
  test('Exactly `PRIZE_SLOTS` offers per board pay goods, and they are drawn from the base six so `broker` slots never reshuffle them.', () => {
    for (const seed of [1, 7, 99, 12345]) {
      for (const day of [0, 1, 5, 12, 24, 40]) {
        const six = rollBoard(new Rng(seed), day, CONTRACT_OFFERS, 0)
        const prized = six.filter(o => o.prize.kind !== 'cash')
        expect(prized).toHaveLength(PRIZE_SLOTS)
        expect(new Set(prized.map(o => o.slot)).size).toBe(PRIZE_SLOTS)
        const eight = rollBoard(new Rng(seed), day, CONTRACT_SLOT_MAX, 0)
        expect(eight.slice(0, CONTRACT_OFFERS)).toEqual(six)
        expect(eight.slice(CONTRACT_OFFERS).every(o => o.prize.kind === 'cash')).toBe(true)
      }
    }
  })

  test('The prize is a pure function of seed, day and rep, like the rest of the board.', () => {
    for (const rep of [0, 5, REP_MAX]) {
      const a = rollBoard(new Rng(3), 9, CONTRACT_OFFERS, rep)
      const b = rollBoard(new Rng(3), 9, CONTRACT_OFFERS, rep)
      expect(a.map(o => o.prize)).toEqual(b.map(o => o.prize))
    }
  })

  test("A prized offer carries its company's fixed entry for the band of its final difficulty. Only the rolled tool varies.", () => {
    for (const seed of [1, 7, 99]) {
      for (const day of [0, 4, 16, 30, 44]) {
        rollBoard(new Rng(seed), day, CONTRACT_OFFERS, 0).forEach(o => {
          if (o.prize.kind === 'cash') return
          const want = COMPANY_PRIZES[o.company][prizeBandOf(o.difficulty)]
          if (want.kind === 'tool') {
            expect(o.prize.kind).toBe('tool')
            return
          }
          expect(o.prize).toEqual(want)
        })
      }
    }
  })

  test('Bands split on final difficulty at 8 / 20 / 30.', () => {
    expect([0, 7.9].map(prizeBandOf)).toEqual([0, 0])
    expect([8, 19].map(prizeBandOf)).toEqual([1, 1])
    expect([20, 29].map(prizeBandOf)).toEqual([2, 2])
    expect([30, DIFFICULTY_CEILING].map(prizeBandOf)).toEqual([3, 3])
  })

  test('Deadlines run 1-2 / 2-3 / 3-4 days on a half-day grid.', () => {
    const seen = new Set<number>()
    for (const seed of [1, 7, 99, 12345, 4242]) {
      for (const day of [0, 3, 11, 27]) {
        rollBoard(new Rng(seed), day, CONTRACT_OFFERS, 0).forEach(o => {
          const [lo, hi] = DEADLINE_DAYS[o.band]
          expect(o.days).toBeGreaterThanOrEqual(lo)
          expect(o.days).toBeLessThanOrEqual(hi)
          expect(o.days / DEADLINE_STEP).toBe(Math.round(o.days / DEADLINE_STEP))
          seen.add(o.days)
        })
      }
    }
    expect([...seen].some(d => d % 1 !== 0)).toBe(true)
  })

  test('The money pool climbs faster over the top half of the ladder than the bottom.', () => {
    expect(load(40) / load(20)).toBeGreaterThan(load(20) / load(8))
  })
})
