import { expect, test, type Page } from '@playwright/test'
import { DISPATCH_DWELL, FUEL_LITERS, QUAD_REFILL } from '../src/game/defs/items.ts'
import { DT_MAX } from '../src/game/sim/world.ts'
import { gotoPlay, openBuild, tapWorld } from './helpers.ts'

const AT = { col: 20, row: 12 }
const SOUTH = { col: 20, row: 13 }
const HANGAR = { col: 10, row: 14 }
const STORE = 10
const PURSE = 40

function read<R>(page: Page, body: string, arg: unknown): Promise<R> {
  return page.evaluate(
    ([src, a]) => {
      const w = (window as unknown as { __world?: object }).__world
      if (w === undefined) throw new Error('no __world')
      return new Function('w', 'a', `"use strict";return (${src})`)(w, a) as R
    },
    [body, arg] as const,
  )
}

test('place a Refueling station, open its panel, toggle Buy from market, south stop takes store then pays', async ({ page }) => {
  test.setTimeout(120_000)
  await gotoPlay(page, { unlock: true })
  await page.evaluate(({ at, south, hangar }) => {
    const w = (
      window as unknown as {
        __world?: { setCell: (at: { col: number; row: number }, cell: object) => void }
        __e2e?: { bare: (ground: string, hardness: number) => object }
      }
    ).__world
    const e2e = (window as unknown as { __e2e?: { bare: (ground: string, hardness: number) => object } }).__e2e
    if (w === undefined || e2e === undefined) throw new Error('no world')
    const plot = () => e2e.bare('soft', 0)
    w.setCell(at, plot())
    w.setCell(south, plot())
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) w.setCell({ col: hangar.col + col, row: hangar.row + row }, plot())
    }
  }, { at: AT, south: SOUTH, hangar: HANGAR })

  await openBuild(page)
  await page.getByRole('tab', { name: 'Vehicles' }).click()
  await page.getByRole('button', { name: /Refueling station/ }).click()
  await expect
    .poll(async () => {
      const kind = await read<string>(page, 'w.cell(a).kind', AT)
      if (kind !== 'refuel') await tapWorld(page, AT.col + 0.5, AT.row + 0.5)
      return kind
    })
    .toBe('refuel')
  await page.keyboard.press('Escape')

  await tapWorld(page, AT.col + 0.5, AT.row + 0.5)
  const buy = page.getByRole('checkbox', { name: /Buy from market/ })
  await expect(buy).toBeVisible()
  await expect(buy).toBeChecked()
  await buy.click()
  await expect.poll(() => read<boolean>(page, 'w.cell(a).buy', AT)).toBe(false)
  await buy.click()
  await expect.poll(() => read<boolean>(page, 'w.cell(a).buy', AT)).toBe(true)

  await page.getByRole('button', { name: 'Vehicle automation' }).click()
  await expect(page.getByRole('tab', { name: 'Route 1' })).toBeVisible()
  await tapWorld(page, SOUTH.col + 0.5, SOUTH.row + 0.5)
  await expect
    .poll(() => read<{ kind: string; at: { col: number; row: number }; wait: boolean }[]>(page, 'w.routes[0].stops', null))
    .toEqual([{ kind: 'refuel', at: SOUTH, wait: false }])

  const paid = ((FUEL_LITERS - STORE) / FUEL_LITERS) * QUAD_REFILL
  const after = await read<{ store: number; fuel: number; money: number }>(
    page,
    `(() => {
      w.buy('buy-hangar')
      w.confirmPlace(a.hangar)
      w.buyVehicle(a.hangar, 'quad')
      const v = w.vehicles[w.vehicles.length - 1]
      v.fuel = 0
      v.dwell = 0
      v.cursor = 0
      v.running = true
      v.route = w.routes[0].id
      v.pose = { kind: 'field', x: a.south.col + 0.5, y: a.south.row + 0.5, heading: 0, speed: 0, driver: 'none' }
      const station = w.cell(a.at)
      station.store = a.store
      w.money = a.purse
      for (let i = 0; i < a.ticks; i++) {
        if (w.seam.kind === 'recap') w.dismissRecap()
        w.tick(a.dt)
      }
      return { store: station.store, fuel: v.fuel, money: w.money }
    })()`,
    {
      at: AT,
      south: SOUTH,
      hangar: HANGAR,
      store: STORE,
      purse: PURSE,
      ticks: 1 + DISPATCH_DWELL / DT_MAX,
      dt: DT_MAX,
    },
  )
  expect(after.store).toBe(0)
  expect(after.fuel).toBe(1)
  expect(after.money).toBe(PURSE - paid)
})
