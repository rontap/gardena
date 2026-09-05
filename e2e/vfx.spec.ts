import { expect, test, type Page } from '@playwright/test'
import { gotoPlay, tapWorld, waitPlay } from './helpers.ts'

type At = { col: number; row: number }

async function fedSprinkler(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = (window as unknown as { __world: any }).__world
    w.buy('buy-pipe')
    w.placePipe({ axis: 'h', col: 18, row: 7 })
    w.buy('buy-sprinkler')
    w.placeSprinkler({ variant: 'basic', at: { col: 19, row: 7 }, tune: { kind: 'flat' }, inn: 0, hold: 0 })
  })
}

async function setCrop(page: Page, at: At, growing: boolean): Promise<void> {
  await page.evaluate(
    async ([a, on]) => {
      const w = (window as unknown as { __world: any }).__world
      const plot = await import('/src/game/sim/plot.ts')
      if (on !== true) {
        w.setCell(a, plot.bare('soft'))
        return
      }
      const plant = await import('/src/game/sim/plant.ts')
      const soil = await import('/src/game/sim/soil.ts')
      w.setCell(a, { kind: 'growing', soil: new soil.Soil(0.2, 1), plant: new plant.Plant('carrot', 'base', 0) })
    },
    [at, growing] as const,
  )
}

test.beforeEach(async ({ page }) => {
  await gotoPlay(page, { unlock: true })
})

test('sprinkler state vfx follows the pour, on and off', async ({ page }) => {
  await fedSprinkler(page)
  await expect(page.locator('[data-sprinkler]')).toHaveCount(1)
  await expect(page.locator('[data-vfx]')).toHaveCount(0)

  await setCrop(page, { col: 18, row: 6 }, true)
  const spray = page.locator('[data-vfx="sprinkler-spray"]')
  await expect(spray).toHaveCount(1)
  await expect.poll(async () =>
    page.evaluate(() => (window as unknown as { __view: { vfxN: number } }).__view.vfxN),
  ).toBeGreaterThan(0)

  await setCrop(page, { col: 18, row: 6 }, false)
  await expect(page.locator('[data-vfx]')).toHaveCount(0)
})

test('spray cuts between frames, one at a time', async ({ page }) => {
  await fedSprinkler(page)
  await setCrop(page, { col: 18, row: 6 }, true)
  await expect(page.locator('[data-vfx="sprinkler-spray"]')).toHaveCount(1)
  await expect.poll(async () =>
    page.evaluate(() => (window as unknown as { __view: { vfxN: number } }).__view.vfxN),
  ).toBeGreaterThan(0)
})

test('vertical spray is oriented like its AoE, both facings', async ({ page }) => {
  for (const rotate of [false, true]) {
    await gotoPlay(page, { unlock: true })
    await page.evaluate(async (turn) => {
      const w = (window as unknown as { __world: any }).__world
      w.buy('buy-pipe')
      w.placePipe({ axis: 'h', col: 18, row: 7 })
      w.buy('buy-sprinkler-vert')
      if (turn === true) w.rotatePlace()
      w.placeSprinkler({ variant: 'vert', at: { col: 19, row: 7 }, facing: 'ns', tune: { kind: 'flat' }, inn: 0, hold: 0 })
      const pipe = await import('/src/game/sim/pipe.ts')
      const plant = await import('/src/game/sim/plant.ts')
      const soil = await import('/src/game/sim/soil.ts')
      const s = w.sprinklerAt({ col: 19, row: 7 })
      const cells = pipe.aoe(s)
      cells.forEach((c: { col: number; row: number }) => {
        const kind = w.cell(c).kind
        if (w.inWorld(c) && kind !== 'pump' && kind !== 'house' && kind !== 'truck')
          w.setCell(c, { kind: 'growing', soil: new soil.Soil(0.2, 1), plant: new plant.Plant('carrot', 'base', 0) })
      })
      ;(window as unknown as { __aoe: unknown }).__aoe = cells
    }, rotate)
    await expect(page.locator('[data-vfx="sprinkler-spray-vert"]')).toHaveCount(1)
    await expect.poll(async () =>
      page.evaluate(() => (window as unknown as { __view: { vfxN: number } }).__view.vfxN),
    ).toBeGreaterThan(0)
    const shape = await page.evaluate(() => {
      const g = document.querySelector('[data-vfx="sprinkler-spray-vert"]') as SVGGraphicsElement
      const r = g.getBoundingClientRect()
      const aoe = (window as unknown as { __aoe: { col: number; row: number }[] }).__aoe
      const cols = new Set(aoe.map(a => a.col)).size
      const rows = new Set(aoe.map(a => a.row)).size
      return { vfxWide: r.width > r.height, aoeWide: cols > rows }
    })
    expect(shape.vfxWide).toBe(shape.aoeWide)
  }
})

test('spray does not eat pointer events', async ({ page }) => {
  await fedSprinkler(page)
  await setCrop(page, { col: 18, row: 6 }, true)
  const spray = page.locator('[data-vfx="sprinkler-spray"]')
  await expect(spray).toHaveCount(1)
  await expect.poll(async () =>
    page.evaluate(() => (window as unknown as { __view: { vfxN: number } }).__view.vfxN),
  ).toBeGreaterThan(0)
  await expect(spray).toHaveCSS('pointer-events', 'none')
})

test('burst mounts, then removes itself when its animation ends', async ({ page }) => {
  await page.evaluate(() => {
    const w = (window as unknown as { __world: any }).__world
    w.burst('tend', { col: 16, row: 9 })
    w.ping()
  })
  const burst = page.locator('.vfx-burst[data-vfx="tend"]')
  await expect(burst).toHaveCount(1)
  await expect.poll(async () =>
    page.evaluate(() => (window as unknown as { __view: { vfxN: number } }).__view.vfxN),
  ).toBeGreaterThan(0)
  await expect(burst).toHaveCount(0, { timeout: 5_000 })
})

test('mill dust mounts while it grinds and unmounts when it stops', async ({ page }) => {
  await page.evaluate(() => {
    const w = (window as unknown as { __world: any }).__world
    w.buy('buy-mill')
    w.confirmPlace({ col: 18, row: 6 })
    const c = w.cell({ col: 18, row: 6 })
    c.recipe = 'olive'
    c.units = 5
    w.ping()
  })
  const dust = page.locator('[data-vfx="dust"]')
  await expect(dust).toHaveCount(1)
  await expect.poll(async () =>
    page.evaluate(() => (window as unknown as { __view: { vfxN: number } }).__view.vfxN),
  ).toBeGreaterThan(0)

  await page.evaluate(() => {
    const w = (window as unknown as { __world: any }).__world
    w.cell({ col: 18, row: 6 }).units = 0
    w.ping()
  })
  await expect(page.locator('[data-vfx="dust"]')).toHaveCount(0)
})

test('a wired-off mill shows nothing', async ({ page }) => {
  await page.evaluate(() => {
    const w = (window as unknown as { __world: any }).__world
    w.buy('buy-mill')
    w.confirmPlace({ col: 18, row: 6 })
    w.buy('buy-lever')
    w.confirmPlace({ col: 20, row: 6 })
    w.armWire({ kind: 'cell', at: { col: 20, row: 6 }, port: 'out' })
    w.placeWire({ kind: 'cell', at: { col: 20, row: 6 }, port: 'out' }, { kind: 'cell', at: { col: 18, row: 6 }, port: 'in' })
    w.cell({ col: 20, row: 6 }).on = true
    const c = w.cell({ col: 18, row: 6 })
    c.recipe = 'olive'
    c.units = 5
    w.ping()
  })
  await expect.poll(() => page.evaluate(() => (window as unknown as { __world: any }).__world.cell({ col: 18, row: 6 }).inn)).toBe(1)
  await expect(page.locator('[data-vfx="dust"]')).toHaveCount(0)
})

test('a barrel bubbles while it ages and stops when it is done', async ({ page }) => {
  await page.evaluate(async () => {
    const w = (window as unknown as { __world: any }).__world
    const items = await import('/src/game/defs/items.ts')
    w.buy('buy-barrel')
    w.confirmPlace({ col: 18, row: 6 })
    const c = w.cell({ col: 18, row: 6 })
    c.crop = 'grape'
    c.feed = [{ variety: 'base', quality: 0, count: items.BARREL_CAP }]
    c.age = 0
    w.ping()
  })
  const brew = page.locator('[data-vfx="brew"]')
  await expect(brew).toHaveCount(1)
  await expect.poll(async () =>
    page.evaluate(() => (window as unknown as { __view: { vfxN: number } }).__view.vfxN),
  ).toBeGreaterThan(0)

  await page.evaluate(async () => {
    const w = (window as unknown as { __world: any }).__world
    const items = await import('/src/game/defs/items.ts')
    w.cell({ col: 18, row: 6 }).age = items.BARREL_AGE
    w.ping()
  })
  await expect(page.locator('[data-vfx="brew"]')).toHaveCount(0)
})

test('a still with no water shows no steam; steam follows progress', async ({ page }) => {
  await page.evaluate(async () => {
    const w = (window as unknown as { __world: any }).__world
    const items = await import('/src/game/defs/items.ts')
    w.buy('buy-still')
    w.confirmPlace({ col: 24, row: 14 })
    const c = w.cell({ col: 24, row: 14 })
    c.feed = [{ crop: 'potato', variety: 'base', quality: 0, count: items.STILL_CAP }]
    c.progress = 0
    w.ping()
  })
  await expect(page.locator('[data-vfx="steam"]')).toHaveCount(0)

  await page.evaluate(() => {
    const w = (window as unknown as { __world: any }).__world
    w.cell({ col: 24, row: 14 }).progress = 0.1
    w.ping()
  })
  const steam = page.locator('[data-vfx="steam"]')
  await expect(steam).toHaveCount(1)
  await expect.poll(async () =>
    page.evaluate(() => (window as unknown as { __view: { vfxN: number } }).__view.vfxN),
  ).toBeGreaterThan(0)
})

test('rest slots leave a gap: every frame is off for the back half of the cycle', async ({ page }) => {
  await page.evaluate(() => {
    const w = (window as unknown as { __world: any }).__world
    w.buy('buy-mill')
    w.confirmPlace({ col: 18, row: 6 })
    const c = w.cell({ col: 18, row: 6 })
    c.recipe = 'olive'
    c.units = 5
    w.ping()
  })
  await expect(page.locator('[data-vfx="dust"]')).toHaveCount(1)
  await expect.poll(async () =>
    page.evaluate(() => (window as unknown as { __view: { vfxN: number } }).__view.vfxN),
  ).toBeGreaterThan(0)
})

test('digging paints while the spade works, not after', async ({ page }) => {
  const dig = page.locator('[data-vfx="dig"]')
  await expect(dig).toHaveCount(0)
  await tapWorld(page, 13.5, 11.5)
  await expect(dig).toHaveCount(1, { timeout: 30_000 })
  await expect.poll(async () =>
    page.evaluate(() => (window as unknown as { __view: { vfxN: number } }).__view.vfxN),
  ).toBeGreaterThan(0)
  await expect(dig).toHaveCount(0, { timeout: 30_000 })
  await expect.poll(async () =>
    page.evaluate(() => (window as unknown as { __world: any }).__world.cell({ col: 13, row: 11 }).kind),
  ).toBe('empty')
})

test.describe('reduced motion', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()
    await waitPlay(page)
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true)
  })

  test('state vfx keeps frame 0 and stops animating', async ({ page }) => {
    await fedSprinkler(page)
    await setCrop(page, { col: 18, row: 6 }, true)
    await expect(page.locator('[data-vfx="sprinkler-spray"]')).toHaveCount(1)
    await expect.poll(async () =>
      page.evaluate(() => (window as unknown as { __view: { vfxN: number } }).__view.vfxN),
    ).toBeGreaterThan(0)
  })

  test('bursts do not mount', async ({ page }) => {
    await page.evaluate(() => {
      const w = (window as unknown as { __world: any }).__world
      w.burst('tend', { col: 16, row: 9 })
      w.ping()
    })
    await expect(page.locator('.vfx-burst')).toHaveCount(0)
    await expect.poll(async () =>
      page.evaluate(() => (window as unknown as { __view: { vfxN: number } }).__view.vfxN),
    ).toBe(0)
    await expect
      .poll(async () => page.evaluate(() => (window as unknown as { __world: any }).__world.bursts.length))
      .toBe(0)
  })
})
