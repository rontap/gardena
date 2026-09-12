import { expect, test, type Page } from '@playwright/test'
import { cropVariety } from '../src/game/defs/crops.ts'
import { MILL_H, MILL_W } from '../src/game/defs/items.ts'
import { STARTER_FRUIT, STARTER_FRUIT_N, VARIETY } from '../src/game/defs/varieties.ts'
import { BIG_TICK } from '../src/game/sim/soil.ts'
import { DT_MAX } from '../src/game/sim/world.ts'
import { armSku, closeDock, dismissRecap, gotoPlay, hoverWorld, openBuild, tapWorld } from './helpers.ts'

type At = { col: number; row: number }

const PLOT: At = { col: 13, row: 11 }
const DROP: At = { col: 12, row: 11 }
const STATION: At = { col: 12, row: 14 }
const LEVER: At = { col: 11, row: 11 }
const HOUSE: At = { col: 15, row: 8 }

function readWorld<R>(page: Page, arg: unknown, body: string): Promise<R> {
  return page.evaluate(
    ([a, src]) => {
      const w = (window as unknown as { __world?: never }).__world
      if (w === undefined) throw new Error('no __world')
      return new Function('w', 'at', `"use strict";return (${src})`)(w, a) as R
    },
    [arg, body],
  ) as Promise<R>
}

async function queueLen(page: Page): Promise<number> {
  await dismissRecap(page)
  return readWorld<number>(page, null, 'w.seats[0].queue.length')
}

async function tapUntil(page: Page, at: At, ok: () => Promise<boolean>, timeout = 45_000): Promise<void> {
  await expect
    .poll(
      async () => {
        if (await ok()) return true
        if ((await queueLen(page)) > 0) return false
        await tapWorld(page, at.col + 0.5, at.row + 0.5)
        return false
      },
      { timeout },
    )
    .toBe(true)
}

function lensBtn(page: Page, name: RegExp) {
  return page.getByRole('button', { name })
}

test('Build Water / Sensors peek the matching lens; Automation and Storage peek none; close restores', async ({ page }) => {
  await gotoPlay(page, { unlock: true })
  await expect(lensBtn(page, /^Lens$/)).toBeVisible()
  await expect(lensBtn(page, /^Lens pipes$/i)).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Clear lens' })).toHaveCount(0)

  await openBuild(page)
  await expect(lensBtn(page, /^Lens pipes$/i)).toHaveCount(0)

  await page.getByRole('tab', { name: 'Water' }).click()
  await expect(lensBtn(page, /^Lens pipes$/i)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Clear lens' })).toHaveCount(0)

  await page.getByRole('tab', { name: 'Automation' }).click()
  await expect(lensBtn(page, /^Lens vehicle interactions$/i)).toHaveCount(0)
  await expect(lensBtn(page, /^Lens pipes$/i)).toHaveCount(0)
  await expect(lensBtn(page, /^Lens sensors$/i)).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Clear lens' })).toHaveCount(0)

  await page.getByRole('tab', { name: 'Storage' }).click()
  await expect(lensBtn(page, /^Lens vehicle interactions$/i)).toHaveCount(0)
  await expect(lensBtn(page, /^Lens pipes$/i)).toHaveCount(0)
  await expect(lensBtn(page, /^Lens sensors$/i)).toHaveCount(0)

  await page.getByRole('tab', { name: 'Sensors' }).click()
  await expect(lensBtn(page, /^Lens sensors$/i)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Clear lens' })).toHaveCount(0)

  await page.getByRole('tab', { name: 'Land' }).click()
  await expect(lensBtn(page, /^Lens pipes$/i)).toHaveCount(0)
  await expect(lensBtn(page, /^Lens sensors$/i)).toHaveCount(0)
  await expect(lensBtn(page, /^Lens vehicle interactions$/i)).toHaveCount(0)

  await page.getByRole('tab', { name: 'Water' }).click()
  await expect(lensBtn(page, /^Lens pipes$/i)).toBeVisible()
  await closeDock(page)
  await expect(lensBtn(page, /^Lens pipes$/i)).toHaveCount(0)
  await expect(lensBtn(page, /^Lens$/)).toBeVisible()
})

test('Lock view keeps the picked lens through a Build peek', async ({ page }) => {
  await gotoPlay(page, { unlock: true })
  await page.getByRole('button', { name: /^Lens$/ }).click()
  await page.getByRole('button', { name: /^Pipes / }).click()
  await page.getByRole('button', { name: /Lock view/ }).click()
  await expect(lensBtn(page, /^Lens pipes locked$/i)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Clear lens' })).toBeVisible()
  await page.getByRole('button', { name: 'Close', exact: true }).click()

  await openBuild(page)
  await page.getByRole('tab', { name: 'Automation' }).click()
  await expect(lensBtn(page, /^Lens pipes locked$/i)).toBeVisible()
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(lensBtn(page, /^Lens pipes locked$/i)).toBeVisible()
})

test('placing a sensor cell locks the Sensors lens', async ({ page }) => {
  await gotoPlay(page, { unlock: true })
  await page.evaluate(at => {
    const w = (
      window as unknown as {
        __world?: {
          cheatMoney: () => void
          setCell: (at: { col: number; row: number }, cell: unknown) => void
        }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    w.cheatMoney()
    w.setCell(at, { kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'bare' } })
  }, LEVER)
  await armSku(page, 'Lever 3', 'Sensors')
  await expect
    .poll(async () => {
      const kind = await readWorld<string>(page, LEVER, 'w.cell(at).kind')
      if (kind !== 'lever') await tapWorld(page, LEVER.col + 0.5, LEVER.row + 0.5)
      return kind
    }, { timeout: 20_000 })
    .toBe('lever')
  await expect(lensBtn(page, /^Lens sensors locked$/i)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(lensBtn(page, /^Lens sensors locked$/i)).toBeVisible()
})

test('ripe plot and ground fruit show Quality and Freshness bars', async ({ page }) => {
  await gotoPlay(page)
  await page.evaluate(([plot, drop]) => {
    const w = (
      window as unknown as {
        __world?: {
          setCell: (at: { col: number; row: number }, cell: unknown) => void
          drops: { at: { col: number; row: number }; item: unknown }[]
        }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    const e = (
      window as unknown as {
        __e2e?: {
          Plant: new (crop: string, variety: string, quality: number) => { freshness: number }
          Soil: new (water: number, fertilizer: number, weed: number) => unknown
        }
      }
    ).__e2e
    if (e === undefined) throw new Error('no __e2e')
    const plant = new e.Plant('carrot', 'base', 0.4)
    plant.freshness = 0.9
    w.setCell(plot, { kind: 'ripe', soil: new e.Soil(1, 1, 0.03), plant })
    w.setCell(drop, { kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'bare' } })
    w.drops.push({
      at: drop,
      item: {
        kind: 'fruit',
        crop: 'tomato',
        variety: 'san-marzano',
        quality: 0.25,
        count: 2,
        unitSale: 1,
        freshness: 0.7,
        cut: false,
      },
    })
  }, [PLOT, DROP] as const)

  await hoverWorld(page, PLOT.col + 0.5, PLOT.row + 0.5)
  await expect(page.getByText('Quality', { exact: true })).toBeVisible()
  await expect(page.getByText('Freshness', { exact: true })).toBeVisible()

  await hoverWorld(page, DROP.col + 0.5, DROP.row + 0.5)
  await expect(page.getByText('Quality', { exact: true })).toBeVisible()
  await expect(page.getByText('Freshness', { exact: true })).toBeVisible()
})

test('house inventory holds the starter Heirloom fruit', async ({ page }) => {
  test.setTimeout(60_000)
  await gotoPlay(page)
  await tapUntil(page, HOUSE, async () => page.getByRole('dialog', { name: 'Inventory' }).isVisible(), 30_000)
  const inv = page.getByRole('dialog', { name: 'Inventory' })
  await expect(inv).toBeVisible()
  for (const v of STARTER_FRUIT) {
    await expect(inv.getByText(`${cropVariety(VARIETY[v].crop, v)} - ${STARTER_FRUIT_N}`)).toBeVisible()
  }
})

test('Seed Variety Station ghost is the station, not the Pot still', async ({ page }) => {
  await gotoPlay(page, { unlock: true })
  await page.evaluate(at => {
    const w = (
      window as unknown as {
        __world?: {
          cheatMoney: () => void
          setCell: (at: { col: number; row: number }, cell: unknown) => void
        }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    w.cheatMoney()
    w.setCell(at, { kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'bare' } })
    w.setCell({ col: at.col + 1, row: at.row }, { kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'bare' } })
  }, STATION)
  await armSku(page, 'Seed Variety Station 60', 'Automation')
  await hoverWorld(page, STATION.col + 0.5, STATION.row + 0.5)
  await expect(page.getByText('Place Seed Variety Station', { exact: true })).toBeVisible()
  const art = await page.evaluate(() => {
    const e = (
      window as unknown as {
        __e2e?: { STATION: string; STILL: string; symHref: (html: string) => string }
      }
    ).__e2e
    if (e === undefined) throw new Error('no __e2e')
    const hrefs = [...document.querySelectorAll('svg[viewBox="0 0 48 24"] use')].map(u => u.getAttribute('href'))
    return { hrefs, station: e.symHref(e.STATION), still: e.symHref(e.STILL) }
  })
  expect(art.hrefs).toContain(art.station)
  expect(art.hrefs).not.toContain(art.still)
})

const SILO: At = { col: 17, row: 9 }
const ADDITIVE: At = { col: 18, row: 9 }
const MILL_AT: At = { col: 8, row: 14 }
const INF_AT: At = { col: 8, row: 11 }
const FURNACE_AT: At = { col: 12, row: 16 }

test('Water need lens only after Automated irrigation is done', async ({ page }) => {
  await gotoPlay(page)
  await page.getByRole('button', { name: /^Lens$/ }).click()
  await expect(page.getByRole('button', { name: /^Water need/ })).toHaveCount(0)
  await page.evaluate(() => {
    const w = (window as unknown as { __world?: { done: Set<string>; ping: () => void } }).__world
    if (w === undefined) throw new Error('no __world')
    w.done.add('unlock-auto-irrigation')
    w.ping()
  })
  await expect(page.getByRole('button', { name: /^Water need/ })).toBeVisible()
})

test('Land quality lens only after Expansion is done', async ({ page }) => {
  await gotoPlay(page)
  await page.getByRole('button', { name: /^Lens$/ }).click()
  await expect(page.getByRole('button', { name: /^Land quality/ })).toHaveCount(0)
  await page.evaluate(() => {
    const w = (window as unknown as { __world?: { done: Set<string>; ping: () => void } }).__world
    if (w === undefined) throw new Error('no __world')
    w.done.add('unlock-expand')
    w.ping()
  })
  await expect(page.getByRole('button', { name: /^Land quality/ })).toBeVisible()
})

test('Additive store has no synthetic fertilizer', async ({ page }) => {
  await gotoPlay(page)
  await tapUntil(page, ADDITIVE, async () => page.getByRole('dialog', { name: 'Additive store' }).isVisible(), 30_000)
  const store = page.getByRole('dialog', { name: 'Additive store' })
  await expect(store).toBeVisible()
  await expect(store.getByRole('button', { name: /Synthetic fertilizer/ })).toHaveCount(0)
  await expect(store.getByRole('button', { name: /Fertilizer bag/ })).toBeVisible()
})

test('Grass seeds sold at the Seed silo, not Build', async ({ page }) => {
  await gotoPlay(page, { unlock: true })
  await openBuild(page)
  await page.getByRole('tab', { name: 'Land' }).click()
  await expect(page.getByRole('button', { name: /Grass seeds/ })).toHaveCount(0)
  await closeDock(page)

  await tapUntil(page, SILO, async () => page.getByRole('dialog', { name: 'Seed silo' }).isVisible(), 30_000)
  const silo = page.getByRole('dialog', { name: 'Seed silo' })
  await expect(silo).toBeVisible()
  await silo.getByRole('button', { name: 'Buy Grass seeds' }).click()
  const take = silo.getByRole('button', { name: /Grass seeds - / })
  await expect(take).toBeVisible()
  await take.evaluate((el: HTMLElement) => el.click())
  await expect
    .poll(async () =>
      readWorld<boolean>(
        page,
        null,
        'w.seats[0].hand.kind === "hold" && w.seats[0].hand.item.kind === "seeds" && w.seats[0].hand.item.crop === "grass"',
      ),
    )
    .toBe(true)
})

test('mill / Infuser / Furnace chest I/O is the south row', async ({ page }) => {
  await gotoPlay(page, { unlock: true })
  const snap = await page.evaluate(
    ([millAt, infAt, furnaceAt, millW, millH, bigTick, dt]) => {
      const w = (
        window as unknown as {
          __world?: {
            cheatMoney: () => void
            setCell: (at: At, cell: unknown) => void
            buy: (id: string) => void
            confirmPlace: (at: At) => void
            tick: (dt: number) => void
            bigAcc: number
            cell: (at: At) => {
              kind: string
              units?: number
              slots?: { kind: string }[]
              base?: { col: number; row: number; w: number; h: number }
            }
            machineLinks: () => { x: number; y: number; side: string }[]
          }
        }
      ).__world
      if (w === undefined) throw new Error('no __world')
      w.cheatMoney()
      const millFoot = Array.from({ length: millH }, (_, r) =>
        Array.from({ length: millW }, (_, c) => ({ col: millAt.col + c, row: millAt.row + r })),
      ).flat()
      const infFoot = Array.from({ length: millH }, (_, r) =>
        Array.from({ length: millW }, (_, c) => ({ col: infAt.col + c, row: infAt.row + r })),
      ).flat()
      const furnaceFoot = [
        furnaceAt,
        { col: furnaceAt.col, row: furnaceAt.row + 1 },
      ]
      const extras: At[] = [
        { col: millAt.col - 1, row: millAt.row },
        { col: millAt.col - 1, row: millAt.row + millH - 1 },
        { col: millAt.col + millW, row: millAt.row + millH - 1 },
        { col: infAt.col - 1, row: infAt.row },
        { col: infAt.col - 1, row: infAt.row + millH - 1 },
        { col: furnaceAt.col - 1, row: furnaceAt.row },
        { col: furnaceAt.col - 1, row: furnaceAt.row + 1 },
      ]
      ;[...millFoot, ...infFoot, ...furnaceFoot, ...extras].forEach(at =>
        w.setCell(at, { kind: 'untilled', ground: 'soft', hardness: 0, cover: { kind: 'bare' } }),
      )
      w.buy('buy-mill')
      w.confirmPlace(millAt)
      w.buy('buy-infuser')
      w.confirmPlace(infAt)
      w.buy('buy-furnace')
      w.confirmPlace(furnaceAt)
      const millOriginWest: At = { col: millAt.col - 1, row: millAt.row }
      const millSouthWest: At = { col: millAt.col - 1, row: millAt.row + millH - 1 }
      const millSouthEast: At = { col: millAt.col + millW, row: millAt.row + millH - 1 }
      const infOriginWest: At = { col: infAt.col - 1, row: infAt.row }
      const infSouthWest: At = { col: infAt.col - 1, row: infAt.row + millH - 1 }
      const furnaceOriginWest: At = { col: furnaceAt.col - 1, row: furnaceAt.row }
      const furnaceSouthWest: At = { col: furnaceAt.col - 1, row: furnaceAt.row + 1 }
      w.buy('buy-chest')
      w.confirmPlace(millOriginWest)
      w.buy('buy-chest')
      w.confirmPlace(millSouthWest)
      w.buy('buy-chest')
      w.confirmPlace(millSouthEast)
      w.buy('buy-chest')
      w.confirmPlace(infOriginWest)
      w.buy('buy-chest')
      w.confirmPlace(infSouthWest)
      w.buy('buy-chest')
      w.confirmPlace(furnaceOriginWest)
      w.buy('buy-chest')
      w.confirmPlace(furnaceSouthWest)
      const wheat = {
        kind: 'fruit' as const,
        crop: 'wheat',
        variety: 'base',
        quality: 0,
        count: 5,
        unitSale: 1,
        freshness: 1,
        cut: false,
      }
      const jam = {
        kind: 'jam' as const,
        crop: 'apricot',
        variety: 'base',
        quality: 0,
        count: 1,
        unitSale: 1,
        infused: false,
      }
      const originMill = w.cell(millOriginWest)
      const southMill = w.cell(millSouthWest)
      const originInf = w.cell(infOriginWest)
      const southInf = w.cell(infSouthWest)
      const originFurnace = w.cell(furnaceOriginWest)
      const southFurnace = w.cell(furnaceSouthWest)
      if (originMill.kind !== 'chest' || southMill.kind !== 'chest') throw new Error('mill chest')
      if (originInf.kind !== 'chest' || southInf.kind !== 'chest') throw new Error('infuser chest')
      if (originFurnace.kind !== 'chest' || southFurnace.kind !== 'chest') throw new Error('furnace chest')
      originMill.slots[0] = { kind: 'hold', item: wheat }
      originInf.slots[0] = { kind: 'hold', item: jam }
      originFurnace.slots[0] = { kind: 'hold', item: { kind: 'weed', count: 8 } }
      const pull = () => {
        w.bigAcc = bigTick - dt
        w.tick(dt)
      }
      pull()
      const afterOrigin = {
        mill: w.cell(millAt).units,
        inf: w.cell(infAt).units,
        furnace: w.cell(furnaceAt).units,
      }
      southMill.slots[0] = { kind: 'hold', item: { ...wheat } }
      southInf.slots[0] = { kind: 'hold', item: { ...jam } }
      southFurnace.slots[0] = { kind: 'hold', item: { kind: 'weed', count: 8 } }
      pull()
      const mill = w.cell(millAt)
      return {
        millKind: mill.kind,
        millBase: mill.base,
        southWestKind: w.cell(millSouthWest).kind,
        afterOrigin,
        afterSouth: {
          mill: mill.units,
          inf: w.cell(infAt).units,
          furnace: w.cell(furnaceAt).units,
        },
        links: w.machineLinks(),
        millSouth: millAt.row + millH - 1,
        infSouth: infAt.row + millH - 1,
        furnaceSouth: furnaceAt.row + 1,
        millXIn: millAt.col - 0.5,
        millXOut: millAt.col + millW - 0.5,
        infXIn: infAt.col - 0.5,
        furnaceXIn: furnaceAt.col - 0.5,
      }
    },
    [MILL_AT, INF_AT, FURNACE_AT, MILL_W, MILL_H, BIG_TICK, DT_MAX] as const,
  )
  expect(snap.millKind).toBe('mill')
  expect(snap.southWestKind).toBe('chest')
  expect(snap.millBase).toMatchObject({ col: MILL_AT.col, row: MILL_AT.row, w: MILL_W, h: MILL_H })
  expect(snap.afterOrigin).toEqual({ mill: 0, inf: 0, furnace: 0 })
  expect(snap.afterSouth.mill).toBeGreaterThan(0)
  expect(snap.afterSouth.inf).toBeGreaterThan(0)
  expect(snap.afterSouth.furnace).toBeGreaterThan(0)
  expect(snap.links.some(l => l.side === 'in' && l.x === snap.millXIn && l.y === snap.millSouth)).toBe(true)
  expect(snap.links.some(l => l.side === 'out' && l.x === snap.millXOut && l.y === snap.millSouth)).toBe(true)
  expect(snap.links.some(l => l.side === 'in' && l.x === snap.millXIn && l.y === MILL_AT.row)).toBe(false)
  expect(snap.links.some(l => l.side === 'in' && l.x === snap.infXIn && l.y === snap.infSouth)).toBe(true)
  expect(snap.links.some(l => l.side === 'in' && l.x === snap.infXIn && l.y === INF_AT.row)).toBe(false)
  expect(snap.links.some(l => l.side === 'in' && l.x === snap.furnaceXIn && l.y === snap.furnaceSouth)).toBe(true)
  expect(snap.links.some(l => l.x === snap.furnaceXIn && l.y === FURNACE_AT.row)).toBe(false)
})
