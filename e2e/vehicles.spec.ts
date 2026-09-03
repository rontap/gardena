import { expect, test, type Page } from '@playwright/test'
import { armSku, gotoPlay, tapWorld } from './helpers.ts'

type Pose =
  | { kind: 'stored'; hangar: { col: number; row: number } }
  | { kind: 'field'; x: number; y: number; heading: number; speed: number; driver: number | 'none' }

test('vehicles smoke', async ({ page }) => {
  await gotoPlay(page, { unlock: true })
  await armSku(page, 'Vehicle hangar', 'Vehicles')
  await tapWorld(page, 20.5, 14.5)
  const placed = await page.evaluate(() => {
    const w = (
      window as unknown as {
        __world: {
          seats: { place: { kind: string; id?: string } }[]
          buy: (id: string) => void
          confirmPlace: (at: { col: number; row: number }) => void
          cell: (at: { col: number; row: number }) => { kind: string }
        }
      }
    ).__world
    if (w.seats[0].place.kind !== 'sku' || w.seats[0].place.id !== 'buy-hangar') w.buy('buy-hangar')
    w.confirmPlace({ col: 10, row: 12 })
    return w.cell({ col: 10, row: 12 }).kind
  })
  expect(placed).toBe('hangar')
  await page.keyboard.press('Escape')
  await page.evaluate(() => {
    const w = (window as unknown as { __world: { seats: { actor: { x: number; y: number } }[]; enqueue: (i: { act: string; at: { col: number; row: number } }) => void } }).__world
    w.seats[0].actor.x = 10.5
    w.seats[0].actor.y = 12.5
    w.enqueue({ act: 'hangar', at: { col: 10, row: 12 } })
  })
  await expect(page.getByRole('button', { name: 'Buy Quad' })).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: 'Buy Quad' }).click()
  await expect(page.getByText('Stored')).toBeVisible()
  await page.getByText('Stored').click()
  await page.getByRole('button', { name: 'Deploy' }).click()
  await expect.poll(async () => poseOf(page).then(p => p.kind)).toBe('field')
  const before = await poseOf(page)
  if (before.kind !== 'field') throw new Error('field')
  await page.keyboard.down('w')
  await expect.poll(async () => {
    const p = await poseOf(page)
    return p.kind === 'field' && p.y !== before.y
  }).toBe(true)
  await page.keyboard.up('w')
  await page.getByRole('button', { name: 'Disembark' }).click()
  await expect.poll(async () => {
    const p = await poseOf(page)
    return p.kind === 'field' && p.driver === 'none'
  }).toBe(true)
  const parked = await poseOf(page)
  if (parked.kind !== 'field') throw new Error('parked')
  await page.evaluate((id: number) => {
    const w = (window as unknown as { __world: { enqueue: (i: { act: string; id: number }) => void; seats: { actor: { x: number; y: number } }[]; vehicles: { pose: Pose }[] } }).__world
    const v = w.vehicles[0].pose
    if (v.kind !== 'field') return
    w.seats[0].actor.x = v.x
    w.seats[0].actor.y = v.y
    w.enqueue({ act: 'vehicle', id })
  }, 1)
  await expect(page.getByRole('button', { name: 'Embark' })).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: 'Embark' }).click()
  await expect.poll(async () => {
    const p = await poseOf(page)
    return p.kind === 'field' && p.driver === 0
  }).toBe(true)
  await page.evaluate(() => {
    const w = (window as unknown as { __world: { vehicles: { pose: Pose }[] } }).__world
    const v = w.vehicles[0].pose
    if (v.kind !== 'field') return
    v.x = 11.5
    v.y = 14.5
  })
  await expect(page.getByRole('button', { name: 'Dock' })).toHaveAttribute('aria-disabled', 'false')
  await page.getByRole('button', { name: 'Dock' }).click()
  await expect
    .poll(async () => {
      const p = await poseOf(page)
      return p.kind === 'stored'
    }, { timeout: 10_000 })
    .toBe(true)
})

test('tractor seeder boom', async ({ page }) => {
  await gotoPlay(page, { unlock: true })
  await page.evaluate(() => {
    const w = (
      window as unknown as {
        __world: {
          buy: (id: string) => void
          confirmPlace: (at: { col: number; row: number }) => void
          buyVehicle: (at: { col: number; row: number }, k: string) => void
          buyTrailer: (at: { col: number; row: number }, k: string) => void
          deploy: (id: number, at: { col: number; row: number }, hitch: number | 'none') => void
          disembark: () => void
          swapTrailer: (u: number, i: number) => void
          embark: (id: number) => void
          seats: { actor: { x: number; y: number }; hand: unknown }[]
          setCell: (at: { col: number; row: number }, c: unknown) => void
          cell: (at: { col: number; row: number }) => { kind: string }
          vehicles: { pose: Pose }[]
        }
      }
    ).__world
    w.buy('buy-hangar')
    w.confirmPlace({ col: 10, row: 12 })
    const at = { col: 10, row: 12 }
    w.buyVehicle(at, 'tractor')
    w.buyTrailer(at, 'seed')
    w.seats[0].actor.x = 11.5
    w.seats[0].actor.y = 16.5
    const ww = w as unknown as { enqueue: (i: { act: string; at: { col: number; row: number } }) => void; tick: (dt: number) => void }
    ww.enqueue({ act: 'shovel', at: { col: 11, row: 16 } })
    while (w.seats[0].queue.length > 0) ww.tick(1 / 15)
    const tilled = w.cell({ col: 11, row: 16 }) as { kind: string; soil?: unknown }
    const soil = tilled.soil
    if (soil !== undefined) {
      for (let col = 9; col <= 13; col++) {
        for (let row = 16; row <= 18; row++) {
          w.setCell({ col, row }, { kind: 'empty', soil })
        }
      }
    }
    w.deploy(1, at, 1)
    w.disembark()
    const v = w.vehicles[0].pose
    if (v.kind !== 'field') return
    w.seats[0].actor.x = v.x
    w.seats[0].actor.y = v.y
    w.seats[0].hand = { kind: 'hold', item: { kind: 'seeds', crop: 'carrot', rarity: 'common', count: 20 } }
    w.swapTrailer(1, 0)
  })
  await page.evaluate(() => {
    const w = (window as unknown as { __world: { seats: { actor: { x: number; y: number } }[]; vehicles: { pose: Pose }[]; embark: (id: number) => void } }).__world
    const v = w.vehicles[0].pose
    if (v.kind !== 'field') return
    w.seats[0].actor.x = v.x
    w.seats[0].actor.y = v.y
    w.embark(1)
  })
  await expect.poll(async () => {
    const p = await poseOf(page)
    return p.kind === 'field' && p.driver === 0
  }).toBe(true)
  await page.evaluate(() => {
    const w = (window as unknown as { __world: { vehicles: { pose: Pose }[] } }).__world
    const v = w.vehicles[0].pose
    if (v.kind !== 'field') return
    v.heading = Math.PI / 2
    v.x = 11.5
    v.y = 15.5
    v.speed = 6
  })
  await page.keyboard.down('w')
  await expect.poll(async () => {
    return page.evaluate(() => {
      const w = (
        window as unknown as {
          __world: { cell: (at: { col: number; row: number }) => { kind: string } }
        }
      ).__world
      for (let col = 9; col <= 13; col++) {
        for (let row = 15; row <= 18; row++) {
          if (w.cell({ col, row }).kind === 'growing') return true
        }
      }
      return false
    })
  }).toBe(true)
  await page.keyboard.up('w')
})

test('Enter embark/disembark; boom toggle paints rake width', async ({ page }) => {
  await gotoPlay(page, { unlock: true })
  await page.evaluate(() => {
    const w = (
      window as unknown as {
        __world: {
          buy: (id: string) => void
          confirmPlace: (at: { col: number; row: number }) => void
          buyVehicle: (at: { col: number; row: number }, k: string) => void
          buyTrailer: (at: { col: number; row: number }, k: string) => void
          deploy: (id: number, at: { col: number; row: number }, hitch: number | 'none') => void
          seats: { actor: { x: number; y: number } }[]
          vehicles: { pose: Pose; boom?: 3 | 5 }[]
        }
      }
    ).__world
    w.buy('buy-hangar')
    w.confirmPlace({ col: 10, row: 12 })
    const at = { col: 10, row: 12 }
    w.buyVehicle(at, 'tractor')
    w.buyTrailer(at, 'seed')
    w.deploy(1, at, 1)
  })
  await expect.poll(async () => {
    const p = await poseOf(page)
    return p.kind === 'field' && p.driver === 0
  }).toBe(true)
  await expect(page.getByRole('button', { name: 'Boom 5' })).toBeVisible()
  await page.getByRole('button', { name: 'Boom 5' }).click()
  await expect(page.getByRole('button', { name: 'Boom 3' })).toBeVisible()
  await page.keyboard.press('Enter')
  await expect.poll(async () => {
    const p = await poseOf(page)
    return p.kind === 'field' && p.driver === 'none'
  }).toBe(true)
  await page.evaluate(async () => {
    const w = (
      window as unknown as {
        __world: {
          seats: { actor: { x: number; y: number }; hand: unknown }[]
          vehicles: { pose: Pose }[]
          setCell: (at: { col: number; row: number }, c: unknown) => void
          swapTrailer: (u: number, i: number) => void
        }
      }
    ).__world
    const v = w.vehicles[0].pose
    if (v.kind !== 'field') return
    const soil = await import('/src/game/sim/soil.ts')
    const bed = new soil.Soil(1, 1, 0.03)
    for (let col = 8; col <= 14; col++) {
      for (let row = 15; row <= 18; row++) {
        w.setCell({ col, row }, { kind: 'empty', soil: bed })
      }
    }
    w.seats[0].actor.x = v.x
    w.seats[0].actor.y = v.y
    w.seats[0].hand = { kind: 'hold', item: { kind: 'seeds', crop: 'carrot', rarity: 'common', count: 20 } }
    w.swapTrailer(1, 0)
  })
  await page.keyboard.press('Enter')
  await expect.poll(async () => {
    const p = await poseOf(page)
    return p.kind === 'field' && p.driver === 0
  }).toBe(true)
  await page.evaluate(() => {
    const w = (
      window as unknown as {
        __world: {
          vehicles: { pose: Pose }[]
          trailers: { pose: { kind: string; heading?: number } }[]
        }
      }
    ).__world
    const v = w.vehicles[0].pose
    if (v.kind !== 'field') return
    v.heading = Math.PI / 2
    v.x = 11.5
    v.y = 15.5
    v.speed = 6
    const t = w.trailers[0].pose
    if (t.kind === 'attached') t.heading = Math.PI / 2
  })
  await page.keyboard.down('w')
  await expect.poll(async () => {
    return page.evaluate(() => {
      const w = (
        window as unknown as {
          __world: { cell: (at: { col: number; row: number }) => { kind: string } }
        }
      ).__world
      const cols: number[] = []
      for (let col = 8; col <= 14; col++) {
        for (let row = 15; row <= 18; row++) {
          if (w.cell({ col, row }).kind === 'growing' && !cols.includes(col)) cols.push(col)
        }
      }
      return cols.includes(11) && !cols.includes(8) && !cols.includes(14)
    })
  }).toBe(true)
  await page.keyboard.up('w')
})

async function poseOf(page: Page): Promise<Pose> {
  return page.evaluate(() => {
    const w = (window as unknown as { __world: { vehicles: { pose: Pose }[] } }).__world
    return w.vehicles[0].pose
  })
}
