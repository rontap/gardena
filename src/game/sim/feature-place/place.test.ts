// COMMANDMENT: never test specifically for versions, ever. expect(SAVE_VERSION) or PROTOCOL .toBe is disallowed.
import { describe, expect, test } from 'vitest'
import { occupiedCells, skuBase, SKU_FOOT } from '../building.ts'
import { isIoCell, IO_SKUS } from '../feature-machines/machine.ts'
import { PAD_SKUS } from '../feature-vehicles/vehicle.ts'
import { bare } from '../plot.ts'
import type { SkuId } from '../ids.ts'
import { World } from '../world.ts'

const AT = { col: 10, row: 20 }

function clear(w: World, at: { col: number; row: number }, w2: number, h2: number): void {
  for (let row = -1; row <= h2; row++) {
    for (let col = -1; col <= w2; col++) w.setCell({ col: at.col + col, row: at.row + row }, bare('soft', 0))
  }
}

function ready(): World {
  const w = new World(1)
  w.unlockAll()
  w.money = 9999
  w.prizeFreezers = 1
  return w
}

describe('place.demolish-land', () => {
  test('place.demolish-land - Demolishing a building leaves soft untilled bare ground on every cell it stood on. No Soil, so no water and no fertilizer.', () => {
    const w = ready()
    clear(w, AT, 2, 2)
    w.buy('buy-still')
    w.confirmPlace(AT)
    const still = w.cell(AT)
    if (!('base' in still)) throw new Error('still')
    const cells = occupiedCells(still.base, w.owned)
    expect(cells).toHaveLength(2)
    w.armDelete()
    w.click(AT)
    cells.forEach(p => {
      const c = w.cell(p)
      expect(c.kind).toBe('untilled')
      expect(c.kind === 'untilled' && c.ground).toBe('soft')
      expect(c.kind === 'untilled' && c.hardness).toBe(0)
      expect(c.kind === 'untilled' && c.cover.kind).toBe('bare')
      expect('soil' in c).toBe(false)
    })
  })
})

describe('place.demolish-filter', () => {
  test('place.demolish-filter - Demolish reads place on every cell the sim takes down, including the Seed Variety Station and paving, and blocked on the ones it refuses.', () => {
    const w = ready()
    clear(w, AT, 2, 2)
    w.buy('buy-research-station')
    w.confirmPlace(AT)
    expect(w.cell(AT).kind).toBe('station')
    w.armDelete()
    expect(w.prompt(AT).kind).toBe('place')
    w.click(AT)
    expect(w.cell(AT).kind).toBe('untilled')

    w.buy('buy-tile-paved')
    w.confirmPlace(AT)
    expect(w.pavingAt(AT)).toBe('paved')
    w.armDelete()
    expect(w.prompt(AT).kind).toBe('place')
    w.click(AT)
    expect(w.pavingAt(AT)).toBe('none')

    const house = { col: 14, row: 6 }
    expect(w.cell(house).kind).toBe('house')
    expect(w.prompt(house).kind).toBe('blocked')
    expect(w.prompt(AT).kind).toBe('blocked')
  })
})

describe('place.ghost-io', () => {
  test('place.ghost-io - skuBase and the IO_SKUS / PAD_SKUS sets the ghost preview reads match the building confirmPlace actually builds.', () => {
    const ids = Object.keys(SKU_FOOT) as SkuId[]
    expect(ids.length).toBeGreaterThan(20)
    ids.forEach(id => {
      const w = ready()
      const base = skuBase(id, AT)
      if (base === undefined) throw new Error(id)
      clear(w, AT, base.w, base.h)
      w.buy(id)
      w.confirmPlace(AT)
      const c = w.cell(AT)
      if (!('base' in c)) throw new Error(id)
      expect([id, c.base.shape === 'rect' && c.base.w, c.base.shape === 'rect' && c.base.h]).toEqual([id, base.w, base.h])
      expect([id, isIoCell(c)]).toEqual([id, IO_SKUS.includes(id)])
      expect([id, 'pads' in c && c.pads === 'both']).toEqual([id, PAD_SKUS.includes(id)])
    })
  })
})
