import { expect, test, type Page } from '@playwright/test'

const TILE = 48
const CAM_X = 15.5
const CAM_Y = 9.5

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

async function dismissRecap(page: Page): Promise<void> {
  const recap = page.getByRole('button', { name: /^Day \d+$/ })
  if (await recap.isVisible().catch(() => false)) await recap.click()
}

async function worldTrue(page: Page, arg: unknown, body: string, timeout = 60_000): Promise<void> {
  await expect
    .poll(async () => {
      await dismissRecap(page)
      return readWorld<boolean>(page, arg, body)
    }, { timeout })
    .toBe(true)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/#start_now')
  await expect(page.locator('svg.bg-grass')).toBeVisible()
})

test.fixme('valve feeds while open and starves the line when closed', async ({ page }) => {
  await unlockAll(page)
  await placeEdge(page, 'h', 18, 7)
  await placeEdge(page, 'h', 19, 7)
  await placeEdge(page, 'h', 20, 7)
  await convertToValve(page, 19, 7)
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-pipe]')).toHaveCount(4)
  await expect.poll(() => wetCount(page)).toBe(4)

  await tapValveMid(page, 19.5, 7)
  await expect.poll(() => valveOpen(page), { timeout: 45_000 }).toBe(false)
  await expect.poll(() => wetCount(page)).toBe(2)
  expect(
    await readWorld<boolean>(
      page,
      [
        { col: 20, row: 7 },
        { col: 21, row: 7 },
      ],
      'at.every(v => !w.vertexWet(v))',
    ),
  ).toBe(true)
})

test.fixme('closed valve still waters through a bypass', async ({ page }) => {
  await unlockAll(page)
  await placeEdge(page, 'h', 18, 7)
  await convertToValve(page, 18, 7)
  await placeEdge(page, 'v', 18, 7)
  await placeEdge(page, 'h', 18, 8)
  await placeEdge(page, 'v', 19, 7)
  await placeEdge(page, 'h', 19, 7)
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-pipe]')).toHaveCount(5)
  await expect.poll(() => wetCount(page)).toBe(5)

  await tapValveMid(page, 18.5, 7)
  await expect.poll(() => valveOpen(page), { timeout: 45_000 }).toBe(false)
  await expect.poll(() => wetCount(page)).toBe(5)
  expect(await readWorld<boolean>(page, { col: 20, row: 7 }, 'w.vertexWet(at)')).toBe(true)
})

test('two sources join one network', async ({ page }) => {
  await unlockAll(page)
  await placeEdge(page, 'h', 18, 7)
  await placeEdge(page, 'h', 19, 7)
  await armSku(page, 'Well 75')
  await confirmWellEdge(page, 20, 7)
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
  await page.goto('/?speed=10#start_now')
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
  await worldTrue(page, spots, 'at.every(p => w.cell(p).kind === "empty") && w.queue.length === 0')
  await expect
    .poll(async () => {
      await dismissRecap(page)
      return page.locator('[data-weed]').count()
    }, { timeout: 120_000 })
    .toBeGreaterThanOrEqual(1)
})

test.fixme('ripe fruit rots', async ({ page }) => {
  test.setTimeout(240_000)
  await page.goto('/?speed=10#start_now')
  await tapWorld(page, 13.5, 11.5)
  await worldTrue(page, { col: 13, row: 11 }, 'w.cell(at).kind === "empty" && w.queue.length === 0')

  const inv = page.locator('div.font-medium').filter({ hasText: /^Inventory$/ })
  await expect
    .poll(
      async () => {
        await dismissRecap(page)
        if (!(await inv.isVisible().catch(() => false))) await tapWorld(page, 15.5, 8.5)
        return inv.count()
      },
      { timeout: 45_000 },
    )
    .toBe(1)
  await page.getByText('Carrot seed - 5, plant it').locator('..').getByRole('button').click()
  await inv.locator('..').getByRole('button', { name: '×' }).click()
  await worldTrue(page, null, 'w.queue.length === 0', 45_000)
  if (await inv.isVisible().catch(() => false)) {
    await inv.locator('..').getByRole('button', { name: '×' }).click()
  }

  await tapWorld(page, 13.5, 11.5)
  await expect
    .poll(() => cellKind(page, { col: 13, row: 11 }), { timeout: 90_000 })
    .toBe('ripe')
  await expect
    .poll(() => cellKind(page, { col: 13, row: 11 }), { timeout: 150_000, intervals: [500] })
    .toBe('rotten')
})

async function cellKind(page: Page, at: At): Promise<string> {
  await dismissRecap(page)
  return readWorld<string>(page, at, 'w.cell(at).kind')
}

async function placeEdge(page: Page, axis: 'h' | 'v', col: number, row: number): Promise<void> {
  const key = `${axis}:${col},${row}`
  await armSku(page, 'Pipe 4')
  const wx = axis === 'h' ? col + 0.5 : col
  const wy = axis === 'h' ? row : row + 0.5
  await expect
    .poll(async () => {
      const has = await readWorld<boolean>(page, key, 'w.segments.has(at)')
      if (!has) await tapWorld(page, wx, wy)
      return has
    }, { timeout: 20_000 })
    .toBe(true)
}

async function convertToValve(page: Page, col: number, row: number): Promise<void> {
  const key = `h:${col},${row}`
  await armSku(page, 'Manual valve 6')
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

async function confirmWellEdge(page: Page, col: number, row: number): Promise<void> {
  const key = `h:${col},${row}`
  await expect
    .poll(async () => {
      const has = await readWorld<boolean>(page, key, 'w.wells.has(at)')
      if (!has) await tapWorld(page, col + 0.5, row)
      return has
    }, { timeout: 20_000 })
    .toBe(true)
}

async function wetCount(page: Page): Promise<number> {
  return page.locator('[data-pipe][data-wet="1"]').count()
}

async function valveOpen(page: Page): Promise<boolean | null> {
  return page.evaluate(() => {
    const w = (
      window as unknown as {
        __world?: { segments: Map<string, { gate?: { kind: string; open?: boolean } }> }
      }
    ).__world
    if (w === undefined) return null
    for (const seg of w.segments.values()) {
      if (seg.gate !== undefined && seg.gate.kind === 'valve') return seg.gate.open ?? null
    }
    return null
  })
}

async function svgBox(page: Page) {
  const box = await page.locator('svg.bg-grass').boundingBox()
  if (box === null) throw new Error('map svg')
  return box
}

async function screenOf(page: Page, wx: number, wy: number) {
  const b = await svgBox(page)
  return {
    x: b.x + b.width / 2 + (wx - CAM_X) * TILE,
    y: b.y + b.height / 2 + (wy - CAM_Y) * TILE,
  }
}

async function tapWorld(page: Page, wx: number, wy: number) {
  const p = await screenOf(page, wx, wy)
  await page.mouse.move(p.x, p.y)
  await page.mouse.down()
  await page.mouse.up()
}

async function tapValveMid(page: Page, wx: number, wy: number) {
  const p = await screenOf(page, wx, wy)
  await page.mouse.move(p.x + 1, p.y + 1)
  await page.mouse.move(p.x, p.y)
  await page.mouse.down()
  await page.mouse.up()
}

async function unlockAll(page: Page) {
  await page.getByRole('button', { name: 'Cheat', exact: true }).click()
  const unlock = page.getByRole('button', { name: 'Unlock all instantly' })
  await expect(unlock).toBeVisible()
  await unlock.click()
  await expect(page.locator('[data-hud-money] span').last()).toHaveText('1049')
  await page.getByRole('button', { name: '×' }).click()
  await expect(unlock).toHaveCount(0)
}

async function openShop(page: Page) {
  const dock = page.getByText('General store')
  if (await dock.isVisible()) return
  await page.getByRole('button', { name: 'Shop', exact: true }).click()
  await expect(dock).toBeVisible({ timeout: 10_000 })
}

async function armSku(page: Page, sku: string) {
  await openShop(page)
  await page.getByRole('tab', { name: 'Automation' }).click()
  await page.getByRole('button', { name: sku }).click()
}
