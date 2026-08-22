import { World } from './src/game/sim/world.ts'
import { Plant } from './src/game/sim/plant.ts'
import { Soil, SOIL_WATER_MAX, SOIL_WATER_MID } from './src/game/sim/soil.ts'
import { CompostBox } from './src/game/sim/building.ts'
import { makeCompost } from './src/game/sim/item.ts'

function run(w: World, seconds: number): void {
  const n = Math.ceil(seconds * 15)
  for (let i = 0; i < n; i++) w.tick(seconds / n)
}

const at = { col: 20, row: 20 }
const box = { col: 22, row: 20 }

function drownTest(crop: 'carrot' | 'tomato' | 'watermelon'): string {
  const w = new World(7)
  const soil = new Soil(SOIL_WATER_MAX, 1)
  w.setCell(at, { kind: 'growing', soil, plant: new Plant(crop, 'common') })
  let t = 0
  for (let i = 0; i < 15 * 400; i++) {
    soil.water = SOIL_WATER_MAX
    w.tick(1 / 15)
    t += 1 / 15
    const c = w.cell(at)
    if (c.kind !== 'growing') return `${crop}: ${c.kind} at ${t.toFixed(0)}s`
  }
  return `${crop}: survived 400s`
}

function wiltTest(): string {
  const w = new World(7)
  const soil = new Soil(0, 1)
  w.setCell(at, { kind: 'growing', soil, plant: new Plant('carrot', 'common') })
  let t = 0
  for (let i = 0; i < 15 * 600; i++) {
    soil.water = 0
    w.tick(1 / 15)
    t += 1 / 15
    const c = w.cell(at)
    if (c.kind !== 'growing') return `dry carrot: ${c.kind} at ${t.toFixed(0)}s`
  }
  return 'dry carrot: survived 600s'
}

function happyTest(): string {
  const w = new World(7)
  const soil = new Soil(SOIL_WATER_MID, 1)
  const p = new Plant('carrot', 'common')
  w.setCell(at, { kind: 'growing', soil, plant: p })
  let t = 0
  for (let i = 0; i < 15 * 400; i++) {
    soil.water = SOIL_WATER_MID
    soil.fertilizer = 1
    w.tick(1 / 15)
    t += 1 / 15
    if (w.cell(at).kind === 'ripe') break
  }
  return `tended carrot: ${w.cell(at).kind} at ${t.toFixed(0)}s, happiness ${p.happiness.toFixed(2)}`
}

function starveTest(): string {
  const w = new World(7)
  const soil = new Soil(SOIL_WATER_MID, 0)
  const p = new Plant('raspberry', 'heirloom')
  w.setCell(at, { kind: 'growing', soil, plant: p })
  let t = 0
  for (let i = 0; i < 15 * 900; i++) {
    soil.water = SOIL_WATER_MID
    soil.fertilizer = 0
    w.tick(1 / 15)
    t += 1 / 15
    const c = w.cell(at)
    if (c.kind !== 'growing') return `starved heirloom raspberry: ${c.kind} at ${t.toFixed(0)}s`
  }
  return `starved heirloom raspberry: alive, happiness ${p.happiness.toFixed(2)}`
}

function compostTest(): string {
  const w = new World(7)
  w.setCell(box, new CompostBox({ shape: 'rect', col: box.col, row: box.row, w: 1, h: 1 }))
  const b = w.cell(box) as CompostBox
  b.units = 12
  const before = w.drops.length
  run(w, 130)
  const made = w.drops.length - before
  return `compost box: units ${b.units}, drops made ${made}`
}

function freshTest(): string {
  const w = new World(7)
  w.hand = { kind: 'hold', item: { kind: 'fruit', crop: 'raspberry', rarity: 'common', count: 1, unitSale: 26, freshness: 1, bio: true } }
  run(w, 80)
  const it = w.hand.kind === 'hold' && w.hand.item.kind === 'fruit' ? w.hand.item.freshness : -1
  return `held raspberry freshness after 80s: ${it.toFixed(3)}`
}

function synthTest(): string {
  const w = new World(7)
  const soil = new Soil(SOIL_WATER_MID, 0.4)
  const p = new Plant('carrot', 'common')
  w.setCell(at, { kind: 'growing', soil, plant: p })
  soil.spike(0.6)
  run(w, 2)
  const afterSpike = `soil.bio ${soil.bio}, plant.bio ${p.bio}`
  soil.fertilizer = 0.9
  soil.feed(0.1)
  const smallFeed = `after 0.1L feed soil.bio ${soil.bio}`
  soil.fertilizer = 0.5
  soil.feed(0.5)
  return `${afterSpike}; ${smallFeed}; after 0.5L feed soil.bio ${soil.bio}, plant.bio ${p.bio}`
}

function waterCapTest(): string {
  const w = new World(7)
  const soil = new Soil(0.2, 0.5)
  w.setCell(at, { kind: 'empty', soil })
  w.hand = { kind: 'hold', item: { kind: 'container', id: 'bucket', liters: 3, capacityLiters: 3 } }
  w.actor.x = at.col + 0.5
  w.actor.y = at.row + 0.5
  w.enqueue({ act: 'water', at })
  run(w, 2)
  const bucket = w.hand.kind === 'hold' && w.hand.item.kind === 'container' ? w.hand.item.liters : -1
  return `bucket water: soil ${soil.water.toFixed(2)}L, bucket ${bucket.toFixed(2)}L`
}

function compostDropTest(): string {
  const w = new World(7)
  w.setCell(box, new CompostBox({ shape: 'rect', col: box.col, row: box.row, w: 1, h: 1 }))
  w.hand = { kind: 'hold', item: { kind: 'rotten', cls: 'fruit', count: 3 } }
  w.actor.x = box.col + 0.5
  w.actor.y = box.row + 0.5
  w.enqueue({ act: 'compost', at: box })
  run(w, 2)
  const b = w.cell(box) as CompostBox
  return `composted 3 rotten fruit: units ${b.units}, hand ${w.hand.kind}`
}

void makeCompost
console.log(drownTest('carrot'))
console.log(drownTest('tomato'))
console.log(drownTest('watermelon'))
console.log(wiltTest())
console.log(happyTest())
console.log(starveTest())
console.log(compostTest())
console.log(freshTest())
console.log(synthTest())
console.log(waterCapTest())
console.log(compostDropTest())
