import { expect, test, type Page } from '@playwright/test'
import { gotoPlay } from './helpers.ts'

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
      w.setCell(a, { kind: 'growing', soil: new soil.Soil(0.2, 1), plant: new plant.Plant('carrot', 'common') })
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
  await expect(spray.locator('.vfx-frame')).toHaveCount(4)

  await setCrop(page, { col: 18, row: 6 }, false)
  await expect(page.locator('[data-vfx]')).toHaveCount(0)
})

test('spray cuts between frames, one at a time', async ({ page }) => {
  await fedSprinkler(page)
  await setCrop(page, { col: 18, row: 6 }, true)
  await expect(page.locator('[data-vfx="sprinkler-spray"]')).toHaveCount(1)

  const seen = await page.evaluate(() => {
    const frames = [...document.querySelectorAll('[data-vfx="sprinkler-spray"] .vfx-frame')]
    const anims = frames.map(f => f.getAnimations()[0])
    const out: string[] = []
    for (let t = 0; t < 1200; t += 300) {
      anims.forEach(a => {
        a.currentTime = t
      })
      out.push(frames.map(f => getComputedStyle(f).opacity).join(''))
    }
    return out
  })
  expect(seen).toEqual(['1000', '0100', '0010', '0001'])
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
          w.setCell(c, { kind: 'growing', soil: new soil.Soil(0.2, 1), plant: new plant.Plant('carrot', 'common') })
      })
      ;(window as unknown as { __aoe: unknown }).__aoe = cells
    }, rotate)
    await expect(page.locator('[data-vfx="sprinkler-spray-vert"]')).toHaveCount(1)
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
  await expect(burst.locator('.vfx-frame')).toHaveCount(2)
  await expect(burst).toHaveCount(0, { timeout: 5_000 })
})

test.describe('reduced motion', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()
    await expect(page.locator('svg.bg-grass')).toBeVisible()
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true)
  })

  test('state vfx keeps frame 0 and stops animating', async ({ page }) => {
    await fedSprinkler(page)
    await setCrop(page, { col: 18, row: 6 }, true)
    const frames = page.locator('[data-vfx="sprinkler-spray"] .vfx-frame')
    await expect(frames).toHaveCount(4)
    await expect(frames.nth(0)).toHaveCSS('animation-name', 'none')
    await expect(frames.nth(0)).toHaveCSS('opacity', '1')
    await expect(frames.nth(1)).toHaveCSS('opacity', '0')
  })

  test('bursts do not mount', async ({ page }) => {
    await page.evaluate(() => {
      const w = (window as unknown as { __world: any }).__world
      w.burst('tend', { col: 16, row: 9 })
      w.ping()
    })
    await expect(page.locator('.vfx-burst')).toHaveCount(0)
    await expect
      .poll(async () => page.evaluate(() => (window as unknown as { __world: any }).__world.bursts.length))
      .toBe(0)
  })
})
