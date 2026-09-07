import { mkdir } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { SKUS } from '../src/game/defs/research.ts'
import { GHOST_SKUS } from '../src/game/defs/shelf.ts'
import { gotoPlay } from './helpers.ts'

const SKIP = new Set([
  'buy-pipe',
  'buy-valve',
  'buy-sprinkler',
  'buy-sprinkler-vert',
  'buy-sprinkler-large',
])

const LARGE = [
  'buy-hangar',
  'buy-silo-seed',
  'buy-silo-spray',
  'buy-silo-produce',
  'buy-pumpjack',
  'buy-rain-tank',
  'buy-still',
  'buy-research-station',
  'buy-furnace',
] as const

const REST = GHOST_SKUS.filter(
  id => !SKIP.has(id) && SKUS[id].need !== 'prize' && !(LARGE as readonly string[]).includes(id),
)

const SKUS_TO_PLACE = [...LARGE.filter(id => GHOST_SKUS.includes(id)), ...REST]

test('unlockall places every building', async ({ page }) => {
  test.setTimeout(120_000)
  await mkdir('e2e/shots', { recursive: true })
  await gotoPlay(page, { unlock: true })

  const result = await page.evaluate(skus => {
    const w = (
      window as unknown as {
        __world?: {
          bounds: () => { col0: number; row0: number; col1: number; row1: number }
          cell: (at: { col: number; row: number }) => { kind: string }
          buy: (id: string) => string | undefined
          confirmPlace: (at: { col: number; row: number }) => void
          cancelPlace: () => void
          cheatMoney: () => void
          money: number
        }
        __view?: { cam: { x: number; y: number; scale: number } }
      }
    ).__world
    const view = (window as unknown as { __view?: { cam: { x: number; y: number; scale: number } } }).__view
    if (w === undefined || view === undefined) throw new Error('no world')
    for (let i = 0; i < 20; i++) w.cheatMoney()
    const b = w.bounds()
    const sites: { col: number; row: number }[] = []
    for (let row = b.row0; row < b.row1; row++) {
      for (let col = b.col0; col < b.col1; col++) sites.push({ col, row })
    }
    const placed: string[] = []
    const miss: string[] = []
    let col0 = Infinity
    let row0 = Infinity
    let col1 = -Infinity
    let row1 = -Infinity
    for (const id of skus) {
      w.buy(id)
      let ok = false
      for (const at of sites) {
        const before = w.cell(at).kind
        w.confirmPlace(at)
        if (w.cell(at).kind === before) continue
        placed.push(id)
        if (at.col < col0) col0 = at.col
        if (at.row < row0) row0 = at.row
        if (at.col > col1) col1 = at.col
        if (at.row > row1) row1 = at.row
        ok = true
        break
      }
      w.cancelPlace()
      if (!ok) miss.push(id)
    }
    const wide = col1 - col0 + 6
    const tall = row1 - row0 + 6
    const scaleW = 1600 / (48 * wide)
    const scaleH = 1400 / (48 * tall)
    const fit = scaleW < scaleH ? scaleW : scaleH
    view.cam.x = (col0 + col1) / 2
    view.cam.y = (row0 + row1) / 2
    view.cam.scale = fit < 0.5 ? 0.5 : fit > 2 ? 2 : fit
    return { n: placed.length, miss, money: w.money }
  }, SKUS_TO_PLACE)

  expect(result.miss, result.miss.join(', ')).toEqual([])
  expect(result.n).toBe(SKUS_TO_PLACE.length)
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'e2e/shots/buildings.png' })
})
