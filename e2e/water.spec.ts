import { expect, test, type Page } from '@playwright/test'
import { armSku, dismissRecap, gotoPlay, screenOf, tapWorld, unlockWorld } from './helpers.ts'

type At = { col: number; row: number }

function readWorld<R>(page: Page, arg: unknown, body: string): Promise<R> {
  return page.evaluate(
    ([a, src]) => {
      const w = (window as unknown as { __world?: never }).__world
      if (w === undefined) throw new Error('no __world')
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      return new Function('w', 'at', `"use strict";return (${src})`)(w, a) as R
    },
    [arg, body],
  ) as Promise<R>
}

async function worldTrue(page: Page, arg: unknown, body: string, timeout = 60_000): Promise<void> {
  await expect
    .poll(async () => {
      await dismissRecap(page)
      return readWorld<boolean>(page, arg, body)
    }, { timeout })
    .toBe(true)
}

test.beforeEach(async ({ page }, info) => {
  if (info.title === 'ripe fruit rots' || info.title === 'weeds sprout on fallow tilled soil') {
    await gotoPlay(page, { speed: 10 })
    return
  }
  await gotoPlay(page)
})

test('valve feeds while open and the far side is dry when closed', async ({ page }) => {
  await unlockWorld(page)
  await placeEdge(page, 'h', 20, 7)
  await placeEdge(page, 'h', 21, 7)
  await placeEdge(page, 'h', 22, 7)
  await convertToValve(page, 21, 7)
  await disarm(page)
  await expect(page.locator('[data-pipe]')).toHaveCount(4)
  await expect.poll(() => wetCount(page)).toBe(4)

  await closeValve(page, 21, 7)
  await expect.poll(() => wetCount(page)).toBe(2)
  expect(
    await readWorld<boolean>(
      page,
      [
        { col: 22, row: 7 },
        { col: 23, row: 7 },
      ],
      'at.every(v => !w.vertexWet(v))',
    ),
  ).toBe(true)
})

test('closed valve still waters through a bypass', async ({ page }) => {
  await unlockWorld(page)
  await placeEdge(page, 'h', 18, 7)
  await convertToValve(page, 18, 7)
  await placeEdge(page, 'v', 18, 7)
  await placeEdge(page, 'h', 18, 8)
  await placeEdge(page, 'v', 19, 7)
  await placeEdge(page, 'h', 19, 7)
  await disarm(page)
  await expect(page.locator('[data-pipe]')).toHaveCount(5)
  await expect.poll(() => wetCount(page)).toBe(5)

  await closeValve(page, 18, 7)
  await expect.poll(() => wetCount(page)).toBe(5)
  expect(await readWorld<boolean>(page, { col: 20, row: 7 }, 'w.vertexWet(at)')).toBe(true)
})

test('two sources join one network', async ({ page }) => {
  await unlockWorld(page)
  await placeEdge(page, 'h', 18, 7)
  await placeEdge(page, 'h', 19, 7)
  await armSku(page, 'Well 75')
  await confirmWellCell(page, 20, 7)
  await page.keyboard.press('Escape')
  await worldTrue(
    page,
    [
      { col: 19, row: 7 },
      { col: 21, row: 7 },
    ],
    'at.map(v => w.netOfVertex(v)).every(n => n !== undefined)',
  )
  expect(
    await readWorld<number>(
      page,
      [
        { col: 19, row: 7 },
        { col: 21, row: 7 },
      ],
      'w.netOfVertex(at[0]).sources.length',
    ),
  ).toBe(2)
  expect(
    await readWorld<boolean>(
      page,
      [
        { col: 19, row: 7 },
        { col: 21, row: 7 },
      ],
      'w.netOfVertex(at[0]) === w.netOfVertex(at[1])',
    ),
  ).toBe(true)
})

test('weeds sprout on fallow tilled soil', async ({ page }) => {
  test.setTimeout(180_000)
  const spots: At[] = [
    { col: 13, row: 11 },
    { col: 14, row: 11 },
    { col: 13, row: 12 },
    { col: 14, row: 12 },
    { col: 12, row: 11 },
  ]
  for (const at of spots) {
    await tapWorld(page, at.col + 0.5, at.row + 0.5)
  }
  await worldTrue(page, spots, 'at.every(p => w.cell(p).kind === "empty") && w.seats[0].queue.length === 0')
  await expect
    .poll(async () => {
      return page.evaluate(plots => {
        const w = (
          window as unknown as {
            __world?: {
              seam: { kind: string }
              dismissRecap: () => void
              tick: (dt: number) => void
              clock: { day: number }
              weather: (day: number) => string
              pinTomorrow: (kind: string) => void
              cell: (c: { col: number; row: number }) => { kind: string }
            }
          }
        ).__world
        if (w === undefined) return 0
        if (w.seam.kind === 'recap') w.dismissRecap()
        const nxt = w.weather(w.clock.day + 1)
        if (nxt === 'dry' || nxt === 'drought') w.pinTomorrow('clear')
        for (let i = 0; i < 90; i++) {
          if (w.seam.kind === 'recap') w.dismissRecap()
          const n = w.weather(w.clock.day + 1)
          if (n === 'dry' || n === 'drought') w.pinTomorrow('clear')
          const now = w.weather(w.clock.day)
          if (now === 'dry' || now === 'drought') {
            w.tick(1 / 15)
            continue
          }
          w.tick(1 / 15)
        }
        return plots.filter(p => w.cell(p).kind === 'weed').length
      }, spots)
    }, { timeout: 120_000 })
    .toBeGreaterThanOrEqual(1)
})

test('ripe fruit rots', async ({ page }) => {
  test.setTimeout(180_000)
  const at: At = { col: 13, row: 11 }
  await expect
    .poll(async () => {
      await dismissRecap(page)
      const kind = await readWorld<string>(page, at, 'w.cell(at).kind')
      if (kind === 'untilled') await tapWorld(page, at.col + 0.5, at.row + 0.5)
      return kind
    }, { timeout: 45_000 })
    .toBe('empty')
  await worldTrue(page, at, 'w.cell(at).kind === "empty" && w.seats[0].queue.length === 0')

  await page.evaluate(() => {
    const w = (
      window as unknown as {
        __world?: { seats: { hand: { kind: string } }[]; takeSilo: (crop: string, variety: string) => void }
      }
    ).__world
    if (w === undefined) throw new Error('no __world')
    w.seats[0].hand = { kind: 'empty' }
    w.takeSilo('carrot', 'base')
  })
  await worldTrue(
    page,
    null,
    'w.seats[0].hand.kind === "hold" && w.seats[0].hand.item.kind === "seeds" && w.seats[0].queue.length === 0',
    10_000,
  )

  await expect
    .poll(async () => {
      const kind = await cellKind(page, at)
      if (kind === 'empty') await tapWorld(page, at.col + 0.5, at.row + 0.5)
      return kind
    }, { timeout: 45_000 })
    .toBe('growing')
  await expect.poll(async () => stepKind(page, at), { timeout: 60_000, intervals: [50] }).toBe('ripe')
  await expect.poll(async () => stepKind(page, at), { timeout: 90_000, intervals: [50] }).toBe('rotten')
})

async function cellKind(page: Page, at: At): Promise<string> {
  return page.evaluate(([col, row]) => {
    const w = (
      window as unknown as {
        __world?: {
          seam: { kind: string }
          dismissRecap: () => void
          cell: (c: { col: number; row: number }) => { kind: string }
        }
      }
    ).__world
    if (w === undefined) return ''
    if (w.seam.kind === 'recap') w.dismissRecap()
    return w.cell({ col, row }).kind
  }, [at.col, at.row])
}

async function stepKind(page: Page, at: At): Promise<string> {
  return page.evaluate(([col, row]) => {
    const w = (
      window as unknown as {
        __world?: {
          seam: { kind: string }
          dismissRecap: () => void
          tick: (dt: number) => void
          cell: (c: { col: number; row: number }) => { kind: string }
        }
      }
    ).__world
    if (w === undefined) return ''
    for (let i = 0; i < 120; i++) {
      if (w.seam.kind === 'recap') w.dismissRecap()
      w.tick(1 / 15)
    }
    return w.cell({ col, row }).kind
  }, [at.col, at.row])
}

async function placeEdge(page: Page, axis: 'h' | 'v', col: number, row: number): Promise<void> {
  const key = `${axis}:${col},${row}`
  await armSku(page, 'Pipe 3')
  const wx = axis === 'h' ? col + 0.5 : col
  const wy = axis === 'h' ? row : row + 0.5
  await expect
    .poll(async () => {
      const has = await readWorld<boolean>(page, key, 'w.segments.has(at)')
      if (!has) await tapWorld(page, wx, wy)
      return has
    }, { timeout: 20_000 })
    .toBe(true)
  const p = await screenOf(page, wx, wy)
  await page.mouse.click(p.x, p.y, { button: 'right' })
}

async function convertToValve(page: Page, col: number, row: number): Promise<void> {
  const key = `h:${col},${row}`
  await armSku(page, 'Valve 5')
  await expect
    .poll(
      async () => {
        const kind = await readWorld<string | null>(
          page,
          key,
          'w.segments.has(at) ? w.segments.get(at).gate.kind : null',
        )
        if (kind !== 'valve') await tapWorld(page, col + 0.5, row)
        return kind
      },
      { timeout: 20_000 },
    )
    .toBe('valve')
}

async function confirmWellCell(page: Page, col: number, row: number): Promise<void> {
  await expect
    .poll(async () => {
      const has = await readWorld<boolean>(page, { col, row }, "w.cell(at).kind === 'well'")
      if (!has) await tapWorld(page, col + 0.5, row + 0.5)
      return has
    }, { timeout: 20_000 })
    .toBe(true)
}

async function wetCount(page: Page): Promise<number> {
  return page.locator('[data-pipe][data-wet="1"]').count()
}

async function disarm(page: Page): Promise<void> {
  await expect
    .poll(async () => {
      const kind = await readWorld<string>(page, null, 'w.seats[0].place.kind')
      if (kind !== 'none') {
        const cancel = page.getByRole('button', { name: 'Cancel' })
        if (await cancel.isVisible()) await cancel.click()
        else await page.keyboard.press('Escape')
      }
      return kind
    }, { timeout: 10_000 })
    .toBe('none')
}

async function closeValve(page: Page, col: number, row: number): Promise<void> {
  const key = `h:${col},${row}`
  const wx = col + 0.5
  const wy = row
  await expect
    .poll(async () => {
      await dismissRecap(page)
      const st = await readWorld<{ open: boolean; busy: boolean }>(
        page,
        key,
        '{ open: w.segments.get(at).gate.open, busy: w.seats[0].queue.length > 0 }',
      )
      if (!st.open) return true
      if (!st.busy) await tapWorld(page, wx, wy)
      return false
    }, { timeout: 45_000 })
    .toBe(true)
}
