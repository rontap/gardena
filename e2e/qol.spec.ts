import { expect, test, type Page } from '@playwright/test'
import { cropVariety } from '../src/game/defs/crops.ts'
import { STARTER_FRUIT, STARTER_FRUIT_N, VARIETY } from '../src/game/defs/varieties.ts'
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

test('Build Water / Vehicles / Sensors peek the matching lens, unlocked; close restores', async ({ page }) => {
  await gotoPlay(page, { unlock: true })
  await expect(lensBtn(page, /^Lens$/)).toBeVisible()
  await expect(lensBtn(page, /^Lens pipes$/i)).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Clear lens' })).toHaveCount(0)

  await openBuild(page)
  await expect(lensBtn(page, /^Lens pipes$/i)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Clear lens' })).toHaveCount(0)

  await page.getByRole('tab', { name: 'Vehicles' }).click()
  await expect(lensBtn(page, /^Lens vehicle interactions$/i)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Clear lens' })).toHaveCount(0)

  await page.getByRole('tab', { name: 'Sensors' }).click()
  await expect(lensBtn(page, /^Lens sensors$/i)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Clear lens' })).toHaveCount(0)

  await page.getByRole('tab', { name: 'Processing' }).click()
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
  await page.getByRole('tab', { name: 'Vehicles' }).click()
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
  await page.evaluate(async ([plot, drop]) => {
    const w = (
      window as unknown as {
        __world?: {
          setCell: (at: { col: number; row: number }, cell: unknown) => void
          drops: { at: { col: number; row: number }; item: unknown }[]
        }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    const { Plant } = await import('/src/game/sim/plant.ts')
    const { Soil } = await import('/src/game/sim/soil.ts')
    const plant = new Plant('carrot', 'base', 0.4)
    plant.freshness = 0.9
    w.setCell(plot, { kind: 'ripe', soil: new Soil(1, 1, 0.03), plant })
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
        bio: true,
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
  await armSku(page, 'Seed Variety Station 60', 'Processing')
  await hoverWorld(page, STATION.col + 0.5, STATION.row + 0.5)
  await expect(page.getByText('Place Seed Variety Station', { exact: true })).toBeVisible()
  const art = await page.evaluate(async () => {
    const { STATION, STILL, symHref } = await import('/src/game/view/svgs.ts')
    const hrefs = [...document.querySelectorAll('svg[viewBox="0 0 48 24"] use')].map(u => u.getAttribute('href'))
    return { hrefs, station: symHref(STATION), still: symHref(STILL) }
  })
  expect(art.hrefs).toContain(art.station)
  expect(art.hrefs).not.toContain(art.still)
})
