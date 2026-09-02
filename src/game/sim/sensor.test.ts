import { describe, expect, test } from 'vitest'
import { BUTTON_PULSE, COUNTER_MAX, SENSOR_HOLD, SPRINKLER_TILE_RATE } from '../defs/items.ts'
import { Tree } from './building.ts'
import { Act } from './log.ts'
import { digestHex, permit, PROTOCOL } from './mp.ts'
import { statsOf } from './modifiers.ts'
import { Plant } from './plant.ts'
import { dump, parse, SAVE_VERSION } from './save.ts'
import { lookText } from './look.ts'
import { counterDial, evalDag, HarvestSensor, isSeqIn, Lamp, Lever, portXY, pourEligible, rawMap, readerRaw, WaterSensor, wouldCycle, type WireEnd } from './sensor.ts'
import { Soil, WEED_CHANCE } from './soil.ts'
import { DT_MAX, World } from './world.ts'

const A = { col: 10, row: 12 }
const B = { col: 10, row: 13 }
const C = { col: 11, row: 12 }

function ready(w: World): void {
  w.done.add('unlock-irrigation')
  w.done.add('unlock-auto-irrigation')
  w.done.add('unlock-adv-irrigation')
  w.done.add('unlock-sensors')
  w.done.add('unlock-advanced-sensors')
  w.done.add('unlock-smart-irrigation')
  w.done.add('unlock-fertilizer')
  w.money = 999
}

function put(
  w: World,
  id:
    | 'buy-lever'
    | 'buy-button'
    | 'buy-lamp'
    | 'buy-not'
    | 'buy-and'
    | 'buy-or'
    | 'buy-pulser'
    | 'buy-counter'
    | 'buy-sensor-water'
    | 'buy-sensor-fert'
    | 'buy-sensor-harvest'
    | 'buy-sensor-day'
    | 'buy-water-system'
    | 'buy-vehicle-detector'
    | 'buy-traffic-light',
  at: { col: number; row: number },
): void {
  w.buy(id)
  w.confirmPlace(at)
}

function grow(
  w: World,
  at: { col: number; row: number },
  kind: 'growing' | 'ripe',
  water: number,
  fert = 1,
): void {
  w.setCell(at, { kind, soil: new Soil(water, fert, WEED_CHANCE), plant: new Plant('carrot', 'common') })
}

describe('1.6 sensors', () => {
  test('SAVE_VERSION 2.03. PROTOCOL 2.03. Wordmark 2.0.3. No migrate. 1.62 file → version.', () => {
    expect(SAVE_VERSION).toBe(2.03)
    expect(PROTOCOL).toBe(2.03)
    const w = new World(1)
    const s = dump(w)
    expect(s.version).toBe(2.03)
    expect(s.wires).toEqual([])
    expect(s.valveHold).toEqual([])
    const old = parse(JSON.stringify({ ...s, version: 1.62 }))
    expect(old.ok).toBe(false)
    if (old.ok) return
    expect(old.reason).toBe('version')
  })

  test('New wire that would cycle: no-op.', () => {
    const from = { kind: 'cell' as const, at: A, port: 'out' as const }
    const to = { kind: 'cell' as const, at: B, port: 'in' as const }
    const combo = () => false
    expect(wouldCycle([], from, to, combo)).toBe(false)
    expect(wouldCycle([{ from, to }], to, from, combo)).toBe(true)
    expect(wouldCycle([], from, from, combo)).toBe(true)
    const w = new World(1)
    ready(w)
    put(w, 'buy-not', A)
    put(w, 'buy-not', B)
    w.armWire({ kind: 'cell', at: A, port: 'out' })
    w.placeWire({ kind: 'cell', at: A, port: 'out' }, { kind: 'cell', at: B, port: 'in' })
    expect(w.wires).toHaveLength(1)
    w.armWire({ kind: 'cell', at: B, port: 'out' })
    const place = w.seats[0].place
    w.placeWire({ kind: 'cell', at: B, port: 'out' }, { kind: 'cell', at: A, port: 'in' })
    expect(w.wires).toHaveLength(1)
    expect(w.seats[0].place).toEqual(place)
    expect(w.promptHit({ kind: 'port', end: { kind: 'cell', at: A, port: 'in' } })).toEqual({
      kind: 'blocked',
      text: 'Cannot loop',
    })
  })

  test('Sequential cut through lever / pulser / counter in is legal. Combo cycle Cannot loop. Q0→NOT→Q1 next tick.', () => {
    const seqSelf = (end: WireEnd) =>
      isSeqIn(end, new Lever({ shape: 'rect', col: A.col, row: A.row, w: 1, h: 1 }))
    expect(
      wouldCycle(
        [],
        { kind: 'cell', at: A, port: 'out' },
        { kind: 'cell', at: A, port: 'in' },
        seqSelf,
      ),
    ).toBe(false)
    expect(
      wouldCycle(
        [],
        { kind: 'cell', at: A, port: 'out' },
        { kind: 'cell', at: A, port: 'in' },
        () => false,
      ),
    ).toBe(true)
    const w = new World(1)
    ready(w)
    put(w, 'buy-lever', A)
    put(w, 'buy-and', B)
    w.armWire({ kind: 'cell', at: A, port: 'out' })
    w.placeWire({ kind: 'cell', at: A, port: 'out' }, { kind: 'cell', at: B, port: 'in-l' })
    w.armWire({ kind: 'cell', at: B, port: 'out' })
    expect(w.promptHit({ kind: 'port', end: { kind: 'cell', at: A, port: 'in' } })).toEqual({ kind: 'place', text: 'Place' })
    w.placeWire({ kind: 'cell', at: B, port: 'out' }, { kind: 'cell', at: A, port: 'in' })
    expect(w.wires).toHaveLength(2)
    const p = new World(1)
    ready(p)
    put(p, 'buy-pulser', A)
    put(p, 'buy-not', B)
    p.armWire({ kind: 'cell', at: A, port: 'out' })
    p.placeWire({ kind: 'cell', at: A, port: 'out' }, { kind: 'cell', at: B, port: 'in' })
    p.armWire({ kind: 'cell', at: B, port: 'out' })
    p.placeWire({ kind: 'cell', at: B, port: 'out' }, { kind: 'cell', at: A, port: 'in' })
    expect(p.wires).toHaveLength(2)
    const self = new World(1)
    ready(self)
    put(self, 'buy-lever', A)
    self.armWire({ kind: 'cell', at: A, port: 'out' })
    self.placeWire({ kind: 'cell', at: A, port: 'out' }, { kind: 'cell', at: A, port: 'in' })
    expect(self.wires).toHaveLength(1)
    const gate = new World(1)
    ready(gate)
    put(gate, 'buy-not', A)
    gate.armWire({ kind: 'cell', at: A, port: 'out' })
    const gPlace = gate.seats[0].place
    gate.placeWire({ kind: 'cell', at: A, port: 'out' }, { kind: 'cell', at: A, port: 'in' })
    expect(gate.wires).toHaveLength(0)
    expect(gate.seats[0].place).toEqual(gPlace)
    expect(gate.promptHit({ kind: 'port', end: { kind: 'cell', at: A, port: 'in' } })).toEqual({
      kind: 'blocked',
      text: 'Cannot loop',
    })
    const andOr = new World(1)
    ready(andOr)
    put(andOr, 'buy-and', A)
    put(andOr, 'buy-or', B)
    andOr.armWire({ kind: 'cell', at: A, port: 'out' })
    andOr.placeWire({ kind: 'cell', at: A, port: 'out' }, { kind: 'cell', at: B, port: 'in-l' })
    andOr.armWire({ kind: 'cell', at: B, port: 'out' })
    const aoPlace = andOr.seats[0].place
    andOr.placeWire({ kind: 'cell', at: B, port: 'out' }, { kind: 'cell', at: A, port: 'in-l' })
    expect(andOr.wires).toHaveLength(1)
    expect(andOr.seats[0].place).toEqual(aoPlace)
    const q0 = { col: 10, row: 10 }
    const nAt = { col: 11, row: 10 }
    const q1 = { col: 12, row: 10 }
    const clk = { col: 10, row: 11 }
    const chain = new World(1)
    ready(chain)
    put(chain, 'buy-lever', q0)
    put(chain, 'buy-not', nAt)
    put(chain, 'buy-lever', q1)
    put(chain, 'buy-lever', clk)
    chain.armWire({ kind: 'cell', at: clk, port: 'out' })
    chain.placeWire({ kind: 'cell', at: clk, port: 'out' }, { kind: 'cell', at: q0, port: 'in' })
    chain.armWire({ kind: 'cell', at: q0, port: 'out' })
    chain.placeWire({ kind: 'cell', at: q0, port: 'out' }, { kind: 'cell', at: nAt, port: 'in' })
    chain.armWire({ kind: 'cell', at: nAt, port: 'out' })
    chain.placeWire({ kind: 'cell', at: nAt, port: 'out' }, { kind: 'cell', at: q1, port: 'in' })
    const Q0 = chain.cell(q0)
    const Q1 = chain.cell(q1)
    const nt = chain.cell(nAt)
    if (Q0.kind !== 'lever' || Q1.kind !== 'lever' || nt.kind !== 'not') throw new Error('chain')
    Q0.on = true
    Q0.out = 1
    chain.tick(DT_MAX)
    expect(nt.out).toBe(0)
    expect(Q1.on).toBe(false)
    chain.enqueue({ act: 'toggle', at: clk })
    chain.seats[0].actor.x = clk.col + 0.5
    chain.seats[0].actor.y = clk.row + 0.5
    chain.tick(DT_MAX)
    expect(Q0.on).toBe(false)
    expect(Q1.on).toBe(false)
    chain.tick(DT_MAX)
    expect(Q1.on).toBe(true)
  })

  test('One clock from 9 (1001) goes to 0 (0000) through sequential feedback.', () => {
    const w = new World(1)
    ready(w)
    const q0 = { col: 10, row: 10 }
    const q1 = { col: 11, row: 10 }
    const q2 = { col: 12, row: 10 }
    const q3 = { col: 13, row: 10 }
    const n1 = { col: 11, row: 11 }
    const n2 = { col: 12, row: 11 }
    const a01 = { col: 10, row: 12 }
    const a23 = { col: 11, row: 12 }
    const is9 = { col: 12, row: 12 }
    const wrap = { col: 13, row: 12 }
    const clk = { col: 10, row: 13 }
    put(w, 'buy-lever', q0)
    put(w, 'buy-lever', q1)
    put(w, 'buy-lever', q2)
    put(w, 'buy-lever', q3)
    put(w, 'buy-lever', clk)
    put(w, 'buy-not', n1)
    put(w, 'buy-not', n2)
    put(w, 'buy-and', a01)
    put(w, 'buy-and', a23)
    put(w, 'buy-and', is9)
    put(w, 'buy-and', wrap)
    const wire = (from: { col: number; row: number }, fp: 'out', to: { col: number; row: number }, tp: 'in' | 'in-l' | 'in-r') => {
      w.armWire({ kind: 'cell', at: from, port: fp })
      w.placeWire({ kind: 'cell', at: from, port: fp }, { kind: 'cell', at: to, port: tp })
    }
    wire(q0, 'out', a01, 'in-l')
    wire(n1, 'out', a01, 'in-r')
    wire(n2, 'out', a23, 'in-l')
    wire(q3, 'out', a23, 'in-r')
    wire(a01, 'out', is9, 'in-l')
    wire(a23, 'out', is9, 'in-r')
    wire(is9, 'out', wrap, 'in-l')
    wire(clk, 'out', wrap, 'in-r')
    wire(q1, 'out', n1, 'in')
    wire(q2, 'out', n2, 'in')
    wire(clk, 'out', q0, 'in')
    wire(wrap, 'out', q3, 'in')
    expect(w.wires).toHaveLength(12)
    const bits = [q0, q1, q2, q3].map(at => {
      const c = w.cell(at)
      if (c.kind !== 'lever') throw new Error('lever')
      return c
    })
    bits[0].on = true
    bits[0].out = 1
    bits[0].prev = 0
    bits[3].on = true
    bits[3].out = 1
    bits[3].prev = 0
    w.tick(DT_MAX)
    expect(bits.map(b => b.on)).toEqual([true, false, false, true])
    w.enqueue({ act: 'toggle', at: clk })
    w.seats[0].actor.x = clk.col + 0.5
    w.seats[0].actor.y = clk.row + 0.5
    w.tick(DT_MAX)
    expect(bits.map(b => b.on)).toEqual([false, false, false, false])
  })

  test('Button: high exactly BUTTON_PULSE ticks.', () => {
    const w = new World(1)
    ready(w)
    put(w, 'buy-button', A)
    w.enqueue({ act: 'toggle', at: A })
    w.seats[0].actor.x = A.col + 0.5
    w.seats[0].actor.y = A.row + 0.5
    w.tick(DT_MAX)
    const b = w.cell(A)
    if (b.kind !== 'button') throw new Error('button')
    expect(b.out).toBe(1)
    for (let i = 0; i < BUTTON_PULSE - 1; i++) {
      w.tick(DT_MAX)
      const c = w.cell(A)
      if (c.kind !== 'button') throw new Error('button')
      expect(c.out).toBe(1)
    }
    w.tick(DT_MAX)
    const d = w.cell(A)
    if (d.kind !== 'button') throw new Error('button')
    expect(d.out).toBe(0)
  })

  test('evalDag lever to lamp.', () => {
    const lever = new Lever({ shape: 'rect', col: 0, row: 0, w: 1, h: 1 })
    lever.on = true
    lever.out = 1
    const lamp = new Lamp({ shape: 'rect', col: 0, row: 1, w: 1, h: 1 })
    const sensors = new Map<string, typeof lever | typeof lamp>([
      ['0,0', lever],
      ['0,1', lamp],
    ])
    evalDag({
      sensors,
      wires: [
        {
          from: { kind: 'cell', at: { col: 0, row: 0 }, port: 'out' },
          to: { kind: 'cell', at: { col: 0, row: 1 }, port: 'in' },
        },
      ],
      valves: new Map(),
      sprinklers: new Map(),
      raw: rawMap(new Map()),
      machines: new Map(),
      stores: new Map(),
    })
    expect(lever.out).toBe(1)
    expect(lamp.inn).toBe(1)
  })

  test('Fan-out: one lever drives two lamps.', () => {
    const w = new World(1)
    ready(w)
    put(w, 'buy-lever', A)
    put(w, 'buy-lamp', B)
    put(w, 'buy-lamp', C)
    w.armWire({ kind: 'cell', at: A, port: 'out' })
    w.placeWire({ kind: 'cell', at: A, port: 'out' }, { kind: 'cell', at: B, port: 'in' })
    w.armWire({ kind: 'cell', at: A, port: 'out' })
    w.placeWire({ kind: 'cell', at: A, port: 'out' }, { kind: 'cell', at: C, port: 'in' })
    expect(w.wires).toHaveLength(2)
    w.enqueue({ act: 'toggle', at: A })
    w.seats[0].actor.x = A.col + 0.5
    w.seats[0].actor.y = A.row + 0.5
    w.tick(DT_MAX)
    const l1 = w.cell(B)
    const l2 = w.cell(C)
    if (l1.kind !== 'lamp' || l2.kind !== 'lamp') throw new Error('lamp')
    expect(l1.inn).toBe(1)
    expect(l2.inn).toBe(1)
  })

  test('Guest placeWire permitted; guest placePipe still not.', () => {
    const from = { kind: 'cell' as const, at: A, port: 'out' as const }
    const to = { kind: 'cell' as const, at: B, port: 'in' as const }
    expect(permit({ a: Act.placeWire, t: 0, p: 1, from, to })).toBe(true)
    expect(permit({ a: Act.armWire, t: 0, p: 1, from })).toBe(true)
    expect(permit({ a: Act.placePipe, t: 0, p: 1, e: { axis: 'h', col: 0, row: 0 } })).toBe(false)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-lever' })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-pipe' })).toBe(false)
  })

  test('Fan-in OR: two levers, one lamp, both wires stay; lamp high if either is.', () => {
    const w = new World(1)
    ready(w)
    put(w, 'buy-lever', A)
    put(w, 'buy-lever', C)
    put(w, 'buy-lamp', B)
    w.armWire({ kind: 'cell', at: A, port: 'out' })
    w.placeWire({ kind: 'cell', at: A, port: 'out' }, { kind: 'cell', at: B, port: 'in' })
    w.armWire({ kind: 'cell', at: C, port: 'out' })
    w.placeWire({ kind: 'cell', at: C, port: 'out' }, { kind: 'cell', at: B, port: 'in' })
    expect(w.wires).toHaveLength(2)
    w.tick(DT_MAX)
    const off = w.cell(B)
    if (off.kind !== 'lamp') throw new Error('lamp')
    expect(off.inn).toBe(0)
    w.enqueue({ act: 'toggle', at: A })
    w.seats[0].actor.x = A.col + 0.5
    w.seats[0].actor.y = A.row + 0.5
    w.tick(DT_MAX)
    const aOn = w.cell(B)
    if (aOn.kind !== 'lamp') throw new Error('lamp')
    expect(aOn.inn).toBe(1)
    w.enqueue({ act: 'toggle', at: A })
    w.seats[0].actor.x = A.col + 0.5
    w.seats[0].actor.y = A.row + 0.5
    w.tick(DT_MAX)
    w.enqueue({ act: 'toggle', at: C })
    w.seats[0].actor.x = C.col + 0.5
    w.seats[0].actor.y = C.row + 0.5
    w.tick(DT_MAX)
    const cOn = w.cell(B)
    if (cOn.kind !== 'lamp') throw new Error('lamp')
    expect(cOn.inn).toBe(1)
  })

  test('Toggle A→B: wires length 0.', () => {
    const w = new World(1)
    ready(w)
    put(w, 'buy-lever', A)
    put(w, 'buy-lamp', B)
    w.armWire({ kind: 'cell', at: A, port: 'out' })
    w.placeWire({ kind: 'cell', at: A, port: 'out' }, { kind: 'cell', at: B, port: 'in' })
    expect(w.wires).toHaveLength(1)
    w.armWire({ kind: 'cell', at: A, port: 'out' })
    w.placeWire({ kind: 'cell', at: A, port: 'out' }, { kind: 'cell', at: B, port: 'in' })
    expect(w.wires).toHaveLength(0)
  })

  test('Direct path unique on node pair (A→AND in-l then A→AND in-r removes, does not stack).', () => {
    const w = new World(1)
    ready(w)
    put(w, 'buy-lever', A)
    put(w, 'buy-and', B)
    w.armWire({ kind: 'cell', at: A, port: 'out' })
    w.placeWire({ kind: 'cell', at: A, port: 'out' }, { kind: 'cell', at: B, port: 'in-l' })
    expect(w.wires).toHaveLength(1)
    w.armWire({ kind: 'cell', at: A, port: 'out' })
    w.placeWire({ kind: 'cell', at: A, port: 'out' }, { kind: 'cell', at: B, port: 'in-r' })
    expect(w.wires).toHaveLength(0)
  })

  test('Lamp portXY in is top.', () => {
    expect(portXY({ kind: 'cell', at: { col: 4, row: 7 }, port: 'in' }, 'lamp')).toEqual({ x: 4.5, y: 7 })
    expect(portXY({ kind: 'cell', at: { col: 4, row: 7 }, port: 'in' }, 'not')).toEqual({ x: 4.5, y: 7 })
  })

  test('isolated water-system out stays 0.', () => {
    const w = new World(1)
    ready(w)
    put(w, 'buy-water-system', A)
    w.cancelPlace()
    w.tick(DT_MAX)
    const c = w.cell(A)
    if (c.kind !== 'water-system') throw new Error('water-system')
    expect(c.out).toBe(0)
    expect(lookText(w, { kind: 'cell', at: A }, false).split('\n')[0]).toBe(
      'Water-system sensor - no pipes around sensor!',
    )
  })

  test('Dump wires + sensor cells. Sku.need required.', () => {
    const w = new World(1)
    ready(w)
    put(w, 'buy-lever', A)
    put(w, 'buy-lamp', B)
    w.armWire({ kind: 'cell', at: A, port: 'out' })
    w.placeWire({ kind: 'cell', at: A, port: 'out' }, { kind: 'cell', at: B, port: 'in' })
    const s = dump(w)
    expect(s.wires).toHaveLength(1)
    const loaded = parse(JSON.stringify(s))
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(loaded.world.wires).toHaveLength(1)
    expect(loaded.world.cell(A).kind).toBe('lever')
  })

  test('3×3 does not read plants outside the square; center building is not a plant.', () => {
    const origin = { col: 5, row: 5 }
    const s = new WaterSensor({ shape: 'rect', col: origin.col, row: origin.row, w: 1, h: 1 })
    const cells = new Map([
      [
        '5,5',
        { kind: 'growing' as const, soil: new Soil(0, 1, WEED_CHANCE), plant: new Plant('carrot', 'common') },
      ],
    ])
    const at = (c: { col: number; row: number }) => cells.get(`${c.col},${c.row}`)
    expect(readerRaw(s, at, [])).toBe(0)
    cells.set('7,5', { kind: 'growing', soil: new Soil(0, 1, WEED_CHANCE), plant: new Plant('carrot', 'common') })
    expect(readerRaw(s, at, [])).toBe(0)
    const w = new World(1)
    ready(w)
    put(w, 'buy-sensor-water', A)
    grow(w, { col: A.col + 2, row: A.row }, 'growing', 0)
    w.tick(DT_MAX)
    const far = w.cell(A)
    if (far.kind !== 'sensor-water') throw new Error('water')
    expect(far.out).toBe(0)
    grow(w, { col: A.col + 1, row: A.row }, 'growing', 0)
    w.tick(DT_MAX)
    const near = w.cell(A)
    if (near.kind !== 'sensor-water') throw new Error('water')
    expect(near.out).toBe(1)
  })

  test('Water sensor wilt/over boxes.', () => {
    const wilt = new World(1)
    ready(wilt)
    put(wilt, 'buy-sensor-water', A)
    wilt.tuneWater(A, true, false)
    grow(wilt, B, 'growing', 0)
    wilt.tick(DT_MAX)
    const w1 = wilt.cell(A)
    if (w1.kind !== 'sensor-water') throw new Error('water')
    expect(w1.out).toBe(1)
    const over = new World(1)
    ready(over)
    put(over, 'buy-sensor-water', A)
    over.tuneWater(A, true, false)
    grow(over, B, 'growing', 2)
    over.tick(DT_MAX)
    const w2 = over.cell(A)
    if (w2.kind !== 'sensor-water') throw new Error('water')
    expect(w2.out).toBe(0)
    const drown = new World(1)
    ready(drown)
    put(drown, 'buy-sensor-water', A)
    drown.tuneWater(A, false, true)
    grow(drown, B, 'growing', 2)
    drown.tick(DT_MAX)
    const w3 = drown.cell(A)
    if (w3.kind !== 'sensor-water') throw new Error('water')
    expect(w3.out).toBe(1)
    const off = new World(1)
    ready(off)
    put(off, 'buy-sensor-water', A)
    off.tuneWater(A, false, false)
    grow(off, B, 'growing', 0)
    off.tick(DT_MAX)
    const w4 = off.cell(A)
    if (w4.kind !== 'sensor-water') throw new Error('water')
    expect(w4.out).toBe(0)
    const both = new World(1)
    ready(both)
    put(both, 'buy-sensor-water', A)
    grow(both, B, 'growing', 2)
    both.tick(DT_MAX)
    const w5 = both.cell(A)
    if (w5.kind !== 'sensor-water') throw new Error('water')
    expect(w5.out).toBe(1)
    const ripe = new World(1)
    ready(ripe)
    put(ripe, 'buy-sensor-water', A)
    grow(ripe, B, 'ripe', 0)
    ripe.tick(DT_MAX)
    const w6 = ripe.cell(A)
    if (w6.kind !== 'sensor-water') throw new Error('water')
    expect(w6.out).toBe(0)
  })

  test('Harvest any/all.', () => {
    const anyRipe = new World(1)
    ready(anyRipe)
    put(anyRipe, 'buy-sensor-harvest', A)
    grow(anyRipe, B, 'ripe', 1)
    anyRipe.tick(DT_MAX)
    const a1 = anyRipe.cell(A)
    if (a1.kind !== 'sensor-harvest') throw new Error('harvest')
    expect(a1.mode).toBe('any')
    expect(a1.out).toBe(1)
    const anyGrow = new World(1)
    ready(anyGrow)
    put(anyGrow, 'buy-sensor-harvest', A)
    grow(anyGrow, B, 'growing', 1)
    anyGrow.tick(DT_MAX)
    const a2 = anyGrow.cell(A)
    if (a2.kind !== 'sensor-harvest') throw new Error('harvest')
    expect(a2.out).toBe(0)
    const allRipe = new World(1)
    ready(allRipe)
    put(allRipe, 'buy-sensor-harvest', A)
    allRipe.tuneHarvest(A, 'all')
    grow(allRipe, B, 'ripe', 1)
    allRipe.tick(DT_MAX)
    const a3 = allRipe.cell(A)
    if (a3.kind !== 'sensor-harvest') throw new Error('harvest')
    expect(a3.out).toBe(1)
    const allMix = new World(1)
    ready(allMix)
    put(allMix, 'buy-sensor-harvest', A)
    allMix.tuneHarvest(A, 'all')
    grow(allMix, B, 'ripe', 1)
    grow(allMix, C, 'growing', 1)
    allMix.tick(DT_MAX)
    const a4 = allMix.cell(A)
    if (a4.kind !== 'sensor-harvest') throw new Error('harvest')
    expect(a4.out).toBe(0)
    const empty = new World(1)
    ready(empty)
    put(empty, 'buy-sensor-harvest', A)
    empty.tuneHarvest(A, 'all')
    empty.tick(DT_MAX)
    const a5 = empty.cell(A)
    if (a5.kind !== 'sensor-harvest') throw new Error('harvest')
    expect(a5.out).toBe(0)
    const trees = new World(1)
    ready(trees)
    put(trees, 'buy-sensor-harvest', A)
    trees.setCell(B, new Tree('apple', { shape: 'rect', col: B.col, row: B.row, w: 1, h: 2 }, 1, 1, { kind: 'on', daysLeft: 1 }))
    trees.tick(DT_MAX)
    const a6 = trees.cell(A)
    if (a6.kind !== 'sensor-harvest') throw new Error('harvest')
    expect(a6.out).toBe(0)
    const s = new HarvestSensor({ shape: 'rect', col: 0, row: 0, w: 1, h: 1 })
    s.mode = 'any'
    expect(readerRaw(s, () => undefined, [])).toBe(0)
  })

  test('Water sensor hold: output edge then hold SENSOR_HOLD ticks.', () => {
    const w = new World(1)
    ready(w)
    put(w, 'buy-sensor-water', A)
    grow(w, B, 'growing', 0)
    w.tick(DT_MAX)
    const on = w.cell(A)
    if (on.kind !== 'sensor-water') throw new Error('water')
    expect(on.out).toBe(1)
    w.setCell(B, { kind: 'empty', soil: new Soil(1, 1, WEED_CHANCE) })
    for (let i = 0; i < SENSOR_HOLD - 1; i++) {
      w.tick(DT_MAX)
      const c = w.cell(A)
      if (c.kind !== 'sensor-water') throw new Error('water')
      expect(c.out).toBe(1)
    }
    w.tick(DT_MAX)
    const off = w.cell(A)
    if (off.kind !== 'sensor-water') throw new Error('water')
    expect(off.out).toBe(0)
  })

  test('pourEligible: unwired on; wired follows inn. Unwired ≠ low.', () => {
    expect(pourEligible(false, 0)).toBe(true)
    expect(pourEligible(false, 1)).toBe(true)
    expect(pourEligible(true, 0)).toBe(false)
    expect(pourEligible(true, 1)).toBe(true)
  })

  test('Water-system joins net like tap. High iff sprinkler want > stored. Taps/stills not in demand. SENSOR_HOLD. Pre-eval pourEligible.', () => {
    const wsAt = { col: 10, row: 18 }
    const v = { col: 10, row: 18 }
    const pipe = { axis: 'h' as const, col: 10, row: 18 }
    const cropAt = { col: 9, row: 17 }
    const tapAt = { col: 11, row: 18 }
    const stillAt = { col: 8, row: 18 }
    const isolated = new World(1)
    ready(isolated)
    isolated.done.add('unlock-auto-irrigation')
    isolated.done.add('unlock-fermentation')
    put(isolated, 'buy-water-system', wsAt)
    isolated.buy('buy-pipe')
    isolated.placePipe(pipe)
    isolated.buy('buy-sprinkler')
    isolated.placeSprinkler({ variant: 'basic', at: v, tune: { kind: 'flat' }, inn: 0, hold: 0 })
    const ws0 = isolated.cell(wsAt)
    if (ws0.kind !== 'water-system') throw new Error('water-system')
    const net0 = isolated.netOfCell(ws0.base)
    expect(net0).toBeDefined()
    expect(net0?.waterSystems).toContain(ws0)
    isolated.tick(DT_MAX)
    const dry = isolated.cell(wsAt)
    if (dry.kind !== 'water-system') throw new Error('water-system')
    expect(dry.out).toBe(0)
    grow(isolated, cropAt, 'growing', 1)
    isolated.tick(DT_MAX)
    const high = isolated.cell(wsAt)
    if (high.kind !== 'water-system') throw new Error('water-system')
    expect(high.out).toBe(1)
    isolated.buy('buy-tap')
    isolated.confirmPlace(tapAt)
    isolated.buy('buy-still')
    isolated.confirmPlace(stillAt)
    const netTap = isolated.netOfCell(ws0.base)
    expect(netTap?.taps).toHaveLength(1)
    expect(netTap?.stills).toHaveLength(1)
    const tapOnly = new World(1)
    ready(tapOnly)
    tapOnly.done.add('unlock-irrigation')
    tapOnly.done.add('unlock-auto-irrigation')
    put(tapOnly, 'buy-water-system', wsAt)
    tapOnly.buy('buy-pipe')
    tapOnly.placePipe(pipe)
    tapOnly.buy('buy-tap')
    tapOnly.confirmPlace(tapAt)
    tapOnly.tick(DT_MAX)
    const t1 = tapOnly.cell(wsAt)
    if (t1.kind !== 'water-system') throw new Error('water-system')
    expect(t1.out).toBe(0)
    isolated.setCell(cropAt, { kind: 'empty', soil: new Soil(1, 1, WEED_CHANCE) })
    for (let i = 0; i < SENSOR_HOLD - 1; i++) {
      isolated.tick(DT_MAX)
      const c = isolated.cell(wsAt)
      if (c.kind !== 'water-system') throw new Error('water-system')
      expect(c.out).toBe(1)
    }
    isolated.tick(DT_MAX)
    const heldOff = isolated.cell(wsAt)
    if (heldOff.kind !== 'water-system') throw new Error('water-system')
    expect(heldOff.out).toBe(0)
    const pre = new World(1)
    ready(pre)
    pre.done.add('unlock-irrigation')
    pre.done.add('unlock-auto-irrigation')
    put(pre, 'buy-water-system', wsAt)
    put(pre, 'buy-lever', A)
    pre.buy('buy-pipe')
    pre.placePipe(pipe)
    pre.buy('buy-sprinkler')
    pre.placeSprinkler({ variant: 'basic', at: v, tune: { kind: 'flat' }, inn: 0, hold: 0 })
    grow(pre, cropAt, 'growing', 1)
    pre.armWire({ kind: 'cell', at: A, port: 'out' })
    pre.placeWire({ kind: 'cell', at: A, port: 'out' }, { kind: 'sprinkler', at: v, port: 'in' })
    pre.tick(DT_MAX)
    const p0 = pre.cell(wsAt)
    if (p0.kind !== 'water-system') throw new Error('water-system')
    expect(p0.out).toBe(0)
    pre.enqueue({ act: 'toggle', at: A })
    pre.seats[0].actor.x = A.col + 0.5
    pre.seats[0].actor.y = A.row + 0.5
    pre.tick(DT_MAX)
    const p1 = pre.cell(wsAt)
    if (p1.kind !== 'water-system') throw new Error('water-system')
    expect(p1.out).toBe(0)
    const spr = pre.sprinklerAt(v)
    if (spr === undefined) throw new Error('sprinkler')
    expect(spr.inn).toBe(1)
    pre.tick(DT_MAX)
    const p2 = pre.cell(wsAt)
    if (p2.kind !== 'water-system') throw new Error('water-system')
    expect(p2.out).toBe(1)
  })

  test('Valve: unwired manual; wired follows the held input; hold; wire drops on delete; guest wires but does not place or click.', () => {
    const e = { axis: 'h' as const, col: 18, row: 7 }
    const v = { col: 19, row: 7 }
    const w = new World(1)
    ready(w)
    put(w, 'buy-lever', A)
    w.buy('buy-valve')
    w.placePipe(e)
    expect(w.hasValve(e)).toBe(true)
    expect(w.valveWired(e)).toBe(false)
    expect(w.conducts(e)).toBe(true)
    w.buy('buy-sprinkler')
    w.placeSprinkler({ variant: 'basic', at: v, tune: { kind: 'flat' }, inn: 0, hold: 0 })
    grow(w, { col: 18, row: 6 }, 'growing', 0.5)
    w.armWire({ kind: 'cell', at: A, port: 'out' })
    w.placeWire({ kind: 'cell', at: A, port: 'out' }, { kind: 'valve', e, port: 'in' })
    expect(w.valveWired(e)).toBe(true)
    expect(w.conducts(e)).toBe(false)
    w.clickValve(e)
    expect(w.seats[0].queue).toEqual([])
    w.enqueue({ act: 'toggle', at: A })
    w.seats[0].actor.x = A.col + 0.5
    w.seats[0].actor.y = A.row + 0.5
    w.tick(DT_MAX)
    expect(w.conducts(e)).toBe(true)
    expect(w.rate(v)).toBeGreaterThan(0)
    w.armDelete()
    w.deleteWire({ kind: 'cell', at: A, port: 'out' }, { kind: 'valve', e, port: 'in' })
    expect(w.valveWired(e)).toBe(false)
    expect(w.conducts(e)).toBe(true)
    expect(permit({ a: Act.placePipe, t: 0, p: 1, e })).toBe(false)
    expect(permit({ a: Act.clickValve, t: 0, p: 1, e })).toBe(false)
    const s = dump(w)
    expect(s.valveHold).toHaveLength(0)
    expect(s.segments.some(seg => seg.gate.kind === 'valve')).toBe(true)
  })

  test('Wired valve holds after its wire goes high then low.', () => {
    const e = { axis: 'h' as const, col: 18, row: 7 }
    const w = new World(1)
    ready(w)
    put(w, 'buy-lever', A)
    w.buy('buy-valve')
    w.placePipe(e)
    w.armWire({ kind: 'cell', at: A, port: 'out' })
    w.placeWire({ kind: 'cell', at: A, port: 'out' }, { kind: 'valve', e, port: 'in' })
    w.enqueue({ act: 'toggle', at: A })
    w.seats[0].actor.x = A.col + 0.5
    w.seats[0].actor.y = A.row + 0.5
    w.tick(DT_MAX)
    expect(w.conducts(e)).toBe(true)
    w.enqueue({ act: 'toggle', at: A })
    w.tick(DT_MAX)
    for (let i = 0; i < SENSOR_HOLD - 1; i++) {
      expect(w.conducts(e)).toBe(true)
      w.tick(DT_MAX)
    }
    expect(w.conducts(e)).toBe(false)
  })

  test('Smart irrigation: unwired on; wired held in; digest distinguishes; wire before unlock is a no-op; dial unchanged; pour this tick.', () => {
    const v = { col: 19, row: 7 }
    const cropAt = { col: 18, row: 6 }
    const unwired = new World(1)
    ready(unwired)
    unwired.done.add('unlock-irrigation')
    unwired.done.add('unlock-auto-irrigation')
    unwired.buy('buy-pipe')
    unwired.placePipe({ axis: 'h', col: 18, row: 7 })
    unwired.buy('buy-sprinkler')
    unwired.placeSprinkler({ variant: 'basic', at: v, tune: { kind: 'flat' }, inn: 0, hold: 0 })
    const soilU = new Soil(0.5, 1, WEED_CHANCE)
    unwired.setCell(cropAt, { kind: 'growing', soil: soilU, plant: new Plant('carrot', 'common') })
    unwired.tick(DT_MAX)
    expect(soilU.water).toBeGreaterThan(0.5)
    expect(unwired.rate(v)).toBeCloseTo(SPRINKLER_TILE_RATE, 9)
    const locked = new World(1)
    locked.done.add('unlock-sensors')
    locked.done.add('unlock-irrigation')
    locked.done.add('unlock-auto-irrigation')
    locked.money = 999
    put(locked, 'buy-lever', A)
    locked.buy('buy-sprinkler')
    locked.placeSprinkler({ variant: 'basic', at: v, tune: { kind: 'flat' }, inn: 0, hold: 0 })
    locked.armWire({ kind: 'cell', at: A, port: 'out' })
    locked.placeWire({ kind: 'cell', at: A, port: 'out' }, { kind: 'sprinkler', at: v, port: 'in' })
    expect(locked.wires).toHaveLength(0)
    const wired = new World(1)
    ready(wired)
    wired.done.add('unlock-auto-irrigation')
    wired.done.add('unlock-smart-irrigation')
    put(wired, 'buy-lever', A)
    wired.buy('buy-pipe')
    wired.placePipe({ axis: 'h', col: 18, row: 7 })
    wired.buy('buy-sprinkler')
    wired.placeSprinkler({ variant: 'basic', at: v, tune: { kind: 'flat' }, inn: 0, hold: 0 })
    wired.armWire({ kind: 'cell', at: A, port: 'out' })
    wired.placeWire({ kind: 'cell', at: A, port: 'out' }, { kind: 'sprinkler', at: v, port: 'in' })
    expect(wired.wires).toHaveLength(1)
    const soilOff = new Soil(0.5, 1, WEED_CHANCE)
    wired.setCell(cropAt, { kind: 'growing', soil: soilOff, plant: new Plant('carrot', 'common') })
    wired.tick(DT_MAX)
    expect(soilOff.water).toBeLessThan(0.5)
    expect(wired.rate(v)).toBe(0)
    const sprLow = wired.sprinklerAt(v)
    if (sprLow === undefined) throw new Error('sprinkler')
    expect(sprLow.inn).toBe(0)
    const twin = new World(1)
    ready(twin)
    twin.done.add('unlock-irrigation')
    twin.done.add('unlock-auto-irrigation')
    put(twin, 'buy-lever', A)
    twin.buy('buy-pipe')
    twin.placePipe({ axis: 'h', col: 18, row: 7 })
    twin.buy('buy-sprinkler')
    twin.placeSprinkler({ variant: 'basic', at: v, tune: { kind: 'flat' }, inn: 0, hold: 0 })
    twin.setCell(cropAt, { kind: 'growing', soil: new Soil(0.5, 1, WEED_CHANCE), plant: new Plant('carrot', 'common') })
    twin.tick(DT_MAX)
    const clone = new World(1)
    ready(clone)
    clone.done.add('unlock-irrigation')
    clone.done.add('unlock-auto-irrigation')
    put(clone, 'buy-lever', A)
    clone.buy('buy-pipe')
    clone.placePipe({ axis: 'h', col: 18, row: 7 })
    clone.buy('buy-sprinkler')
    clone.placeSprinkler({ variant: 'basic', at: v, tune: { kind: 'flat' }, inn: 0, hold: 0 })
    clone.armWire({ kind: 'cell', at: A, port: 'out' })
    clone.placeWire({ kind: 'cell', at: A, port: 'out' }, { kind: 'sprinkler', at: v, port: 'in' })
    clone.setCell(cropAt, { kind: 'growing', soil: new Soil(0.5, 1, WEED_CHANCE), plant: new Plant('carrot', 'common') })
    clone.tick(DT_MAX)
    expect(clone.sprinklerAt(v)?.inn).toBe(0)
    expect(twin.sprinklerAt(v)?.inn).toBe(0)
    expect(digestHex(clone)).not.toBe(digestHex(twin))
    wired.enqueue({ act: 'toggle', at: A })
    wired.seats[0].actor.x = A.col + 0.5
    wired.seats[0].actor.y = A.row + 0.5
    const before = soilOff.water
    wired.tick(DT_MAX)
    expect(soilOff.water).toBeGreaterThan(before)
    const sprOn = wired.sprinklerAt(v)
    if (sprOn === undefined) throw new Error('sprinkler')
    expect(sprOn.inn).toBe(1)
    wired.tuneSprinkler(v, { kind: 'crop', crop: 'carrot' })
    expect(sprOn.tune).toEqual({ kind: 'crop', crop: 'carrot' })
    expect(wired.demand(sprOn)).toBe(statsOf('carrot', 'common', wired.modifiers).waterUsePerSec)
    const s = dump(wired)
    expect(s.sprinklers[0].inn).toBe(1)
    expect(s.sprinklers[0].hold).toBe(SENSOR_HOLD)
    const loaded = parse(JSON.stringify(s))
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(loaded.world.sprinklerAt(v)?.inn).toBe(1)
  })

  test('Vehicle: field Quad or tractor floor(x,y) equals the cell. Stored no. Trailer no. SENSOR_HOLD.', () => {
    const hangar = { col: 10, row: 12 }
    const on = { col: 16, row: 16 }
    const off = { col: 20, row: 20 }
    const field = new World(1)
    ready(field)
    field.done.add('unlock-vehicles')
    field.buy('buy-hangar')
    field.confirmPlace(hangar)
    put(field, 'buy-vehicle-detector', on)
    field.buyVehicle(hangar, 'quad')
    field.deploy(1, hangar, 'none')
    const q = field.vehicles[0]
    if (q.pose.kind !== 'field') throw new Error('field')
    q.pose.x = on.col + 0.5
    q.pose.y = on.row + 0.5
    field.tick(DT_MAX)
    const onCell = field.cell(on)
    if (onCell.kind !== 'vehicle-detector') throw new Error('vehicle-detector')
    expect(onCell.out).toBe(1)
    const stored = new World(1)
    ready(stored)
    stored.done.add('unlock-vehicles')
    stored.buy('buy-hangar')
    stored.confirmPlace(hangar)
    put(stored, 'buy-vehicle-detector', on)
    stored.buyVehicle(hangar, 'quad')
    stored.tick(DT_MAX)
    const st = stored.cell(on)
    if (st.kind !== 'vehicle-detector') throw new Error('vehicle-detector')
    expect(st.out).toBe(0)
    const trailer = new World(1)
    ready(trailer)
    trailer.done.add('unlock-vehicles')
    trailer.buy('buy-hangar')
    trailer.confirmPlace(hangar)
    put(trailer, 'buy-vehicle-detector', on)
    trailer.buyTrailer(hangar, 'seed')
    trailer.tick(DT_MAX)
    const tr = trailer.cell(on)
    if (tr.kind !== 'vehicle-detector') throw new Error('vehicle-detector')
    expect(tr.out).toBe(0)
    const far = new World(1)
    ready(far)
    far.done.add('unlock-vehicles')
    far.buy('buy-hangar')
    far.confirmPlace(hangar)
    put(far, 'buy-vehicle-detector', on)
    far.buyVehicle(hangar, 'quad')
    far.deploy(1, hangar, 'none')
    const f = far.vehicles[0]
    if (f.pose.kind !== 'field') throw new Error('field')
    f.pose.x = off.col + 0.5
    f.pose.y = off.row + 0.5
    far.tick(DT_MAX)
    const away = far.cell(on)
    if (away.kind !== 'vehicle-detector') throw new Error('vehicle-detector')
    expect(away.out).toBe(0)
    const tractor = new World(1)
    ready(tractor)
    tractor.done.add('unlock-vehicles')
    tractor.buy('buy-hangar')
    tractor.confirmPlace(hangar)
    put(tractor, 'buy-vehicle-detector', on)
    tractor.buyVehicle(hangar, 'tractor')
    tractor.deploy(1, hangar, 'none')
    const t = tractor.vehicles[0]
    if (t.pose.kind !== 'field') throw new Error('field')
    t.pose.x = on.col + 0.5
    t.pose.y = on.row + 0.5
    tractor.tick(DT_MAX)
    const tOn = tractor.cell(on)
    if (tOn.kind !== 'vehicle-detector') throw new Error('vehicle-detector')
    expect(tOn.out).toBe(1)
    q.pose.x = off.col + 0.5
    q.pose.y = off.row + 0.5
    for (let i = 0; i < SENSOR_HOLD - 1; i++) {
      field.tick(DT_MAX)
      const c = field.cell(on)
      if (c.kind !== 'vehicle-detector') throw new Error('vehicle-detector')
      expect(c.out).toBe(1)
    }
    field.tick(DT_MAX)
    const heldOff = field.cell(on)
    if (heldOff.kind !== 'vehicle-detector') throw new Error('vehicle-detector')
    expect(heldOff.out).toBe(0)
  })

  test('buy-valve on a bare edge lays the pipe too and charges both.', () => {
    const e = { axis: 'h' as const, col: 18, row: 7 }
    const w = new World(1)
    ready(w)
    w.buy('buy-valve')
    expect(w.promptHit({ kind: 'edge', edge: e })).toEqual({ kind: 'place', text: 'Place Valve' })
    const money = w.money
    w.placePipe(e)
    expect(w.hasPipe(e)).toBe(true)
    expect(w.hasValve(e)).toBe(true)
    expect(w.money).toBe(money - w.skuPrice('buy-valve') - w.skuPrice('buy-pipe'))
  })

  test('buy-valve on a valved edge is Pipe already has a valve.', () => {
    const e = { axis: 'h' as const, col: 18, row: 7 }
    const w = new World(1)
    ready(w)
    w.buy('buy-valve')
    w.placePipe(e)
    const money = w.money
    expect(w.promptHit({ kind: 'edge', edge: e })).toEqual({ kind: 'blocked', text: 'Pipe already has a valve' })
    w.placePipe(e)
    expect(w.money).toBe(money)
  })

  test('Unarmed wired-valve hover is Valve - wired.', () => {
    const e = { axis: 'h' as const, col: 18, row: 7 }
    const w = new World(1)
    ready(w)
    w.buy('buy-valve')
    w.placePipe(e)
    w.cancelPlace()
    expect(lookText(w, { kind: 'valve', edge: e }, false)).toBe('Close valve')
    put(w, 'buy-lever', A)
    w.armWire({ kind: 'cell', at: A, port: 'out' })
    w.placeWire({ kind: 'cell', at: A, port: 'out' }, { kind: 'valve', e, port: 'in' })
    w.cancelPlace()
    expect(lookText(w, { kind: 'valve', edge: e }, false)).toBe('Valve - wired')
  })

  test('Unwired mill/jam/still `inn` 0 ticks (enabled).', () => {
    const w = new World(1)
    ready(w)
    w.done.add('unlock-grinder')
    w.buy('buy-mill')
    w.confirmPlace(A)
    const mill = w.cell(A)
    expect(mill.kind).toBe('mill')
    if (mill.kind !== 'mill') return
    expect(mill.inn).toBe(0)
    mill.recipe = 'wheat'
    mill.units = 5
    mill.progress = 0
    w.tick(DT_MAX)
    expect(mill.progress).toBeGreaterThan(0)
  })

  test('Chest no empty slot (`CHEST_SLOTS` 9/9) → `out` 1 after `SENSOR_HOLD`.', () => {
    const w = new World(1)
    ready(w)
    w.done.add('unlock-chest')
    w.buy('buy-chest')
    w.confirmPlace(A)
    const chest = w.cell(A)
    expect(chest.kind).toBe('chest')
    if (chest.kind !== 'chest') return
    expect(chest.out).toBe(0)
    for (let i = 0; i < 9; i++) {
      chest.slots[i] = { kind: 'hold', item: { kind: 'tree-seed', tree: 'apple' } }
    }
    w.tick(DT_MAX)
    expect(chest.out).toBe(1)
    expect(chest.hold).toBe(SENSOR_HOLD)
    for (let i = 0; i < SENSOR_HOLD - 1; i++) {
      w.tick(DT_MAX)
      expect(chest.out).toBe(1)
    }
    w.tick(DT_MAX)
    expect(chest.hold).toBe(0)
    expect(chest.out).toBe(1)
  })

  test('Seed silo `used >= SILO_SEED_CAP` → `out` 1 after hold. Additive `used >= ADDITIVE_CAP_LITERS` → `out` 1 after hold.', () => {
    const w = new World(1)
    const silo = w.silo
    const add = w.additives
    expect(silo.out).toBe(0)
    expect(add.out).toBe(0)
    silo.seeds.push({ crop: 'carrot', rarity: 'common', count: silo.cap - silo.used })
    add.held.push({ id: 'fertilizer', liters: add.cap - add.used })
    w.tick(DT_MAX)
    expect(silo.out).toBe(1)
    expect(add.out).toBe(1)
    expect(silo.hold).toBe(SENSOR_HOLD)
    expect(add.hold).toBe(SENSOR_HOLD)
  })

  test('Button: high exactly `BUTTON_PULSE` ticks. Pulser: `out` 1 exactly 1 tick on `inn` 0→1, else 0; then `prev = inn`.', () => {
    const w = new World(1)
    ready(w)
    put(w, 'buy-lever', A)
    put(w, 'buy-pulser', B)
    w.armWire({ kind: 'cell', at: A, port: 'out' })
    w.placeWire({ kind: 'cell', at: A, port: 'out' }, { kind: 'cell', at: B, port: 'in' })
    w.enqueue({ act: 'toggle', at: A })
    w.seats[0].actor.x = A.col + 0.5
    w.seats[0].actor.y = A.row + 0.5
    w.tick(DT_MAX)
    const p1 = w.cell(B)
    if (p1.kind !== 'pulser') throw new Error('pulser')
    expect(p1.out).toBe(1)
    expect(p1.prev).toBe(1)
    w.tick(DT_MAX)
    const p2 = w.cell(B)
    if (p2.kind !== 'pulser') throw new Error('pulser')
    expect(p2.out).toBe(0)
    expect(p2.prev).toBe(1)
  })

  test('Counter: each tick `inn === 1`, `count += 1`; `count >= n` → `out = 1` `count = 0` else `out = 0`. `n` default 1, min 1, max `COUNTER_MAX` 9999. Tune out of range no-op. Changing `n` keeps `count`. Dial from `pct = count / n` vs 0 / 25% / 50% / 75% / 100% (`s0`…`s4`); this tick `out === 1` → `s4`. Not `floor(4 * count / n)`.', () => {
    const w = new World(1)
    ready(w)
    put(w, 'buy-counter', A)
    const c0 = w.cell(A)
    if (c0.kind !== 'counter') throw new Error('counter')
    expect(c0.n).toBe(1)
    expect(c0.count).toBe(0)
    expect(counterDial(c0)).toBe('s0')
    w.tuneCounter(A, 0)
    expect(c0.n).toBe(1)
    w.tuneCounter(A, COUNTER_MAX + 1)
    expect(c0.n).toBe(1)
    w.tuneCounter(A, 5)
    expect(c0.n).toBe(5)
    put(w, 'buy-lever', B)
    w.armWire({ kind: 'cell', at: B, port: 'out' })
    w.placeWire({ kind: 'cell', at: B, port: 'out' }, { kind: 'cell', at: A, port: 'in' })
    w.enqueue({ act: 'toggle', at: B })
    w.seats[0].actor.x = B.col + 0.5
    w.seats[0].actor.y = B.row + 0.5
    w.tick(DT_MAX)
    expect(c0.count).toBe(1)
    expect(c0.out).toBe(0)
    expect(counterDial(c0)).toBe('s1')
    w.tick(DT_MAX)
    expect(c0.count).toBe(2)
    expect(counterDial(c0)).toBe('s2')
    w.tick(DT_MAX)
    expect(c0.count).toBe(3)
    expect(counterDial(c0)).toBe('s3')
    w.tick(DT_MAX)
    expect(c0.count).toBe(4)
    expect(counterDial(c0)).toBe('s4')
    w.tick(DT_MAX)
    expect(c0.out).toBe(1)
    expect(c0.count).toBe(0)
    expect(counterDial(c0)).toBe('s4')
    c0.count = 3
    c0.out = 0
    w.tuneCounter(A, 10)
    expect(c0.n).toBe(10)
    expect(c0.count).toBe(3)
    w.resetCounter(A)
    expect(c0.count).toBe(0)
    expect(c0.n).toBe(10)
    w.resetCounter(B)
    expect(c0.count).toBe(0)
    expect(c0.n).toBe(10)
  })

  test('Day sensor: four flags, default `day` on others off. Raw 1 iff `clock.phase()` is a true flag. All off → raw 0. `SENSOR_HOLD`. No 3×3.', () => {
    const w = new World(1)
    ready(w)
    put(w, 'buy-sensor-day', A)
    const d = w.cell(A)
    if (d.kind !== 'sensor-day') throw new Error('day')
    expect(d.day).toBe(true)
    expect(d.sunrise).toBe(false)
    expect(d.sunset).toBe(false)
    expect(d.twilight).toBe(false)
    w.clock.t = 0
    w.tick(DT_MAX)
    expect(d.out).toBe(0)
    w.clock.t = 60
    w.tick(DT_MAX)
    expect(d.out).toBe(1)
    expect(d.hold).toBe(SENSOR_HOLD)
    w.tuneDay(A, false, false, false, false)
    d.hold = 0
    w.tick(DT_MAX)
    expect(d.out).toBe(0)
  })

  test('Lever Flip always toggles. Wired `in` 0→1 also toggles. Same-tick Flip + rising edge: both apply (net zero). Unwired `inn` 0: no edge.', () => {
    const w = new World(1)
    ready(w)
    put(w, 'buy-lever', A)
    put(w, 'buy-lever', B)
    w.armWire({ kind: 'cell', at: B, port: 'out' })
    w.placeWire({ kind: 'cell', at: B, port: 'out' }, { kind: 'cell', at: A, port: 'in' })
    const a = w.cell(A)
    const src = w.cell(B)
    if (a.kind !== 'lever' || src.kind !== 'lever') throw new Error('lever')
    src.on = true
    src.out = 1
    expect(a.on).toBe(false)
    w.enqueue({ act: 'toggle', at: A })
    w.seats[0].actor.x = A.col + 0.5
    w.seats[0].actor.y = A.row + 0.5
    w.tick(DT_MAX)
    expect(a.on).toBe(false)
    expect(a.inn).toBe(1)
    w.enqueue({ act: 'toggle', at: A })
    w.seats[0].actor.x = A.col + 0.5
    w.seats[0].actor.y = A.row + 0.5
    w.tick(DT_MAX)
    expect(a.on).toBe(true)
    const u = new World(1)
    ready(u)
    put(u, 'buy-lever', A)
    const l = u.cell(A)
    if (l.kind !== 'lever') throw new Error('lever')
    u.tick(DT_MAX)
    expect(l.on).toBe(false)
    expect(l.inn).toBe(0)
  })

  test('AND / OR / NOT require `unlock-advanced-sensors`.', () => {
    const w = new World(1)
    w.done.add('unlock-sensors')
    w.money = 999
    expect(w.skuShown('buy-and')).toBe(true)
    expect(w.skuShown('buy-or')).toBe(true)
    expect(w.skuShown('buy-not')).toBe(true)
    expect(w.skuOpen('buy-and')).toBe(false)
    expect(w.skuOpen('buy-or')).toBe(false)
    expect(w.skuOpen('buy-not')).toBe(false)
    w.done.add('unlock-advanced-sensors')
    expect(w.skuOpen('buy-and')).toBe(true)
    expect(w.skuOpen('buy-or')).toBe(true)
    expect(w.skuOpen('buy-not')).toBe(true)
  })

  test('`SensorKind` += `pulser` `counter` `sensor-day`. Lever has `in`. Guest `placeWire` permitted; guest `placePipe` still not.', () => {
    const w = new World(1)
    ready(w)
    put(w, 'buy-pulser', A)
    put(w, 'buy-counter', B)
    put(w, 'buy-sensor-day', C)
    expect(w.cell(A).kind).toBe('pulser')
    expect(w.cell(B).kind).toBe('counter')
    expect(w.cell(C).kind).toBe('sensor-day')
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-pulser' })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-counter' })).toBe(true)
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-sensor-day' })).toBe(true)
    expect(permit({ a: Act.tuneCounter, t: 0, p: 1, c: [B.col, B.row], n: 2 })).toBe(true)
    expect(permit({ a: Act.resetCounter, t: 0, p: 1, c: [B.col, B.row] })).toBe(true)
    expect(permit({ a: Act.tuneDay, t: 0, p: 1, c: [C.col, C.row], sunrise: false, day: true, sunset: false, twilight: false })).toBe(true)
    expect(permit({ a: Act.openHud, t: 0, p: 1, k: 'counter', c: [B.col, B.row] })).toBe(true)
    expect(permit({ a: Act.openHud, t: 0, p: 1, k: 'day', c: [C.col, C.row] })).toBe(true)
    expect(permit({ a: Act.openHud, t: 0, p: 1, k: 'sprinkler', c: [0, 0] })).toBe(false)
  })

  test('Traffic light: 1×1 sunk. Ports `in` top `out` bottom. Unwired `inn` 0 = red = hold. `out` 1 iff a vehicle’s current stop is this cell and it is waiting on it (`running`, wait stop, floor is that cell, `inn === 0`). Path-cross is not a wait. `SENSOR_HOLD` on `out`. Several waiters: all hold on 0, all leave on 1. No collision. Groups off/on from `inn`. Look **Traffic light**. `buy-traffic-light` `show` `unlock-sensors` `need` `unlock-dispatch`. StayArmed. Guest `GUEST_BUILD`. Wait resolve after `evalDag` using this tick’s `inn`.', () => {
    const w = new World(1)
    ready(w)
    w.done.add('unlock-vehicles')
    expect(w.skuShown('buy-traffic-light')).toBe(true)
    expect(w.skuOpen('buy-traffic-light')).toBe(false)
    w.done.add('unlock-dispatch')
    expect(w.skuOpen('buy-traffic-light')).toBe(true)
    put(w, 'buy-traffic-light', A)
    const light = w.cell(A)
    expect(light.kind).toBe('traffic-light')
    if (light.kind !== 'traffic-light') return
    expect(light.inn).toBe(0)
    expect(light.out).toBe(0)
    expect(lookText(w, { kind: 'cell', at: A }, false)).toContain('Traffic light')
    expect(permit({ a: Act.buy, t: 0, p: 1, s: 'buy-traffic-light' })).toBe(true)
    expect(isSeqIn({ kind: 'cell', at: A, port: 'in' }, light)).toBe(true)
    expect(portXY({ kind: 'cell', at: A, port: 'in' }, 'traffic-light')).toEqual({ x: A.col + 0.5, y: A.row })
    expect(portXY({ kind: 'cell', at: A, port: 'out' }, 'traffic-light')).toEqual({ x: A.col + 0.5, y: A.row + 1 })
    const hangar = { col: 16, row: 16 }
    w.buy('buy-hangar')
    w.confirmPlace(hangar)
    w.createRoute()
    w.addStop(1, { kind: 'wait', at: A })
    w.addStop(1, { kind: 'goto', x: 20.5, y: 20.5 })
    w.buyVehicle(hangar, 'quad')
    w.assignRoute(1, 1)
    const v = w.vehicles[0]
    v.pose = { kind: 'field', x: A.col + 0.5, y: A.row + 0.5, heading: 0, speed: 0, driver: 'none' }
    v.running = true
    w.tick(DT_MAX)
    expect(v.cursor).toBe(0)
    const waiting = w.cell(A)
    expect(waiting.kind).toBe('traffic-light')
    if (waiting.kind !== 'traffic-light') return
    expect(waiting.out).toBe(1)
    put(w, 'buy-lever', B)
    w.armWire({ kind: 'cell', at: B, port: 'out' })
    w.placeWire({ kind: 'cell', at: B, port: 'out' }, { kind: 'cell', at: A, port: 'in' })
    const lev = w.cell(B)
    if (lev.kind !== 'lever') return
    lev.on = true
    lev.out = 1
    w.tick(DT_MAX)
    expect(v.cursor).toBe(1)
  })
})
