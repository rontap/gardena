import { TEND_WORK } from '../defs/skills.ts'
import { AXES, GRAFT_WORK } from '../defs/items.ts'
import { m } from '../../paraglide/messages.js'
import { PAD, DOOR, occupiedCells, type Base, type Coord, type ChunkId, type Pump, type RainTank, type Tap, type Well } from './building.ts'
import { TAP_RATE } from './water.ts'
import { flipLever, pressButton } from './sensor.ts'
import { type Edge } from './pipe.ts'
import { countable, mergeInto, stackable, type Item } from './item.ts'
import { topIndex } from './drop.ts'
import { isPlot } from './plot.ts'
import { HAND_FULL } from './prompt.ts'
import * as field from './feature-field/field.ts'
import * as machines from './feature-machines/machines.tick.ts'
import * as vehicles from './feature-vehicles/vehicle.ts'
import * as store from './store.ts'
import { fillable } from './nets.ts'
import type { Intent, TaskName, World } from './world.ts'

function destOrigin(c: { base: Base }, owned: readonly ChunkId[]): Coord {
  if (c.base.shape === 'circle') return occupiedCells(c.base, owned)[0]
  return { col: c.base.col, row: c.base.row }
}

export function dest(i: Intent, world: World): Coord {
  if (i.act === 'fill' || i.act === 'hangar' || i.act === 'silo' || i.act === 'still' || i.act === 'furnace') {
    const c = world.cell(i.at)
    if ('base' in c) return destOrigin(c, world.owned)
    return { ...i.at }
  }
  if (i.act === 'consign') return { ...PAD }
  if (i.act === 'inventory') return { ...DOOR }
  if (i.act === 'toggle') return i.at
  if (i.act === 'vehicle' || i.act === 'embark') {
    const v = world.vehicles.find(x => x.id === i.id)
    if (v !== undefined && v.pose.kind === 'field') {
      return { col: Math.floor(v.pose.x), row: Math.floor(v.pose.y) }
    }
    return { col: Number.POSITIVE_INFINITY, row: Number.POSITIVE_INFINITY }
  }
  return i.at
}

export function taskName(world: World, i: Intent): TaskName {
  world.act = world.seats[world.local]
  if (!world.act.actor.inside(dest(i, world))) {
    if (i.act === 'shovel') return m.prompt_move_here_and_dig()
    if (i.act === 'consign') return m.prompt_drop_off()
    return m.prompt_move_here()
  }
  switch (i.act) {
    case 'walk':
      return m.prompt_move_here()
    case 'shovel':
      return m.prompt_dig()
    case 'mine':
      return m.prompt_mine()
    case 'plant':
      return m.prompt_plant_bare()
    case 'water':
      return m.names_face_water()
    case 'fertilize':
      return m.prompt_fertilize()
    case 'compost':
      return m.names_item_compost()
    case 'harvest':
      return m.prompt_harvest()
    case 'fill':
      return m.prompt_fill()
    case 'consign':
      return m.prompt_drop_off()
    case 'pickup':
      return m.prompt_pick_up()
    case 'drop':
      return m.prompt_drop()
    case 'inventory':
      return m.prompt_inventory()
    case 'chest':
      return m.names_building_chest()
    case 'silo':
      return m.names_building_seed_silo()
    case 'additives':
      return m.prompt_additives()
    case 'grind':
      return m.prompt_grind()
    case 'mill':
      return m.names_building_mill()
    case 'still':
      return m.names_building_still()
    case 'furnace':
      return m.names_building_furnace()
    case 'station':
      return m.names_building_station()
    case 'barrel':
      return m.names_building_barrel()
    case 'jam':
      return m.names_building_jam()
    case 'hangar':
      return m.names_building_hangar()
    case 'vehicle': {
      const v = world.vehicles.find(x => x.id === i.id)
      if (v === undefined) throw new Error('vehicle')
      return v.kind === 'tractor' ? m.names_vehicle_tractor() : m.names_vehicle_quad()
    }
    case 'embark':
      return m.vehicles_embark()
    case 'valve':
      return m.names_building_valve()
    case 'toggle': {
      const c = world.cell(i.at)
      return c.kind === 'button' ? m.prompt_press_bare() : m.prompt_flip_bare()
    }
    case 'tend':
      return m.prompt_tend()
    case 'weed-spray':
      return m.prompt_spray()
    case 'chop':
      return m.prompt_chop()
    case 'graft':
      return m.prompt_graft()
  }
}

export function taskProgress(world: World): number {
  world.act = world.seats[world.local]
  const head = world.act.queue[0]
  if (head === undefined) return 0
  if (world.act.workLeft > 0 && world.act.workTotal > 0) return 1 - world.act.workLeft / world.act.workTotal
  if (world.act.filling && world.act.hand.kind === 'hold' && world.act.hand.item.kind === 'container') {
    return world.act.hand.item.liters / world.act.hand.item.capacityLiters
  }
  const at = dest(head, world)
  if (!world.act.actor.inside(at)) {
    const tx = at.col + 0.5
    const ty = at.row + 0.5
    const span = Math.hypot(world.act.legStart.x - tx, world.act.legStart.y - ty)
    if (span === 0) return 1
    return 1 - Math.hypot(world.act.actor.x - tx, world.act.actor.y - ty) / span
  }
  return 1
}

export function tickQueue(world: World, dt: number): void {
  if (world.act.workLeft > 0) {
    world.act.workLeft -= dt
    if (world.act.workLeft > 0) return
    finishWork(world)
    return
  }
  if (world.act.filling) {
    tickFill(world, dt)
    return
  }
  const next = world.act.queue[0]
  if (next === undefined) return
  if (next.act === 'vehicle' || next.act === 'embark') {
    const v = world.vehicles.find(x => x.id === next.id)
    if (v?.pose.kind !== 'field') {
      shiftHead(world)
      return
    }
  }
  const at = dest(next, world)
  if (!world.act.actor.inside(at)) {
    world.act.actor.walkToward(at, dt, world.walkSpeed())
    return
  }
  begin(world, next)
}

export function begin(world: World, i: Intent): void {
  switch (i.act) {
    case 'walk':
      shiftHead(world)
      return
    case 'shovel':
      if (!field.canShovel(world, i.at)) {
        shiftHead(world)
        return
      }
      arm(world, shovelTime(world, i.at))
      return
    case 'mine':
      if (!field.canMine(world, i.at)) {
        shiftHead(world)
        return
      }
      arm(world, mineTime(world, i.at))
      return
    case 'plant':
      if (!field.canPlant(world, i.at)) {
        shiftHead(world)
        return
      }
      arm(world, 0.5)
      return
    case 'water':
      if (!field.canWater(world, i.at)) {
        shiftHead(world)
        return
      }
      arm(world, 0.4)
      return
    case 'fertilize':
      if (!field.canFertilize(world, i.at)) {
        shiftHead(world)
        return
      }
      arm(world, 0.6)
      return
    case 'compost':
      if (!machines.canCompost(world, i.at)) {
        shiftHead(world)
        return
      }
      arm(world, 0.4)
      return
    case 'harvest':
      if (!field.canHarvest(world, i.at)) {
        shiftHead(world)
        return
      }
      arm(world, 0.5)
      return
    case 'pickup':
      doPickup(world, i.at)
      shiftHead(world)
      return
    case 'consign':
      store.doConsign(world)
      shiftHead(world)
      return
    case 'fill':
      if (!canFill(world, i.at)) {
        shiftHead(world)
        return
      }
      world.act.filling = true
      return
    case 'drop':
      doDrop(world, i.at)
      shiftHead(world)
      return
    case 'inventory':
      world.act.cue = { kind: 'inventory' }
      shiftHead(world)
      return
    case 'silo': {
      if (world.cell(i.at).kind !== 'seed-silo') {
        shiftHead(world)
        return
      }
      store.depositSilo(world)
      world.act.cue = { kind: 'silo', at: { ...i.at } }
      shiftHead(world)
      return
    }
    case 'additives': {
      if (world.cell(i.at).kind !== 'additive-store') {
        shiftHead(world)
        return
      }
      store.depositAdditives(world)
      world.act.cue = { kind: 'additives', at: { ...i.at } }
      shiftHead(world)
      return
    }
    case 'chest': {
      const c = world.cell(i.at)
      if (c.kind !== 'chest' && c.kind !== 'freezer') {
        shiftHead(world)
        return
      }
      // TODO 1.1 multiplayer guest chest swap
      if (world.act.id !== 0) {
        shiftHead(world)
        return
      }
      world.act.cue = { kind: 'chest', at: { ...i.at } }
      shiftHead(world)
      return
    }
    case 'grind':
      if (!machines.canGrind(world, i.at)) {
        shiftHead(world)
        return
      }
      arm(world, 0.4)
      return
    case 'mill':
      if (!machines.canMill(world, i.at)) {
        shiftHead(world)
        return
      }
      arm(world, 0.4)
      return
    case 'still':
      if (!machines.canStill(world, i.at)) {
        shiftHead(world)
        return
      }
      arm(world, 0.4)
      return
    case 'furnace':
      if (!machines.canFurnace(world, i.at)) {
        shiftHead(world)
        return
      }
      arm(world, 0.4)
      return
    case 'station': {
      if (world.cell(i.at).kind !== 'station') {
        shiftHead(world)
        return
      }
      if (machines.canStation(world, i.at)) {
        arm(world, 0.4)
        return
      }
      world.act.cue = { kind: 'station', at: { ...i.at } }
      shiftHead(world)
      return
    }
    case 'barrel':
      if (!machines.canBarrel(world, i.at)) {
        shiftHead(world)
        return
      }
      arm(world, 0.4)
      return
    case 'jam':
      if (!machines.canJam(world, i.at)) {
        shiftHead(world)
        return
      }
      arm(world, 0.4)
      return
    case 'hangar': {
      if (world.cell(i.at).kind !== 'hangar') {
        shiftHead(world)
        return
      }
      world.act.cue = { kind: 'hangar', at: { ...i.at } }
      shiftHead(world)
      return
    }
    case 'vehicle': {
      const v = world.vehicles.find(x => x.id === i.id)
      if (v?.pose.kind !== 'field' || v.pose.driver !== 'none') {
        shiftHead(world)
        return
      }
      world.act.cue = { kind: 'vehicle', id: i.id }
      shiftHead(world)
      return
    }
    case 'embark': {
      const v = world.vehicles.find(x => x.id === i.id)
      if (
        v?.pose.kind !== 'field' ||
        v.pose.driver !== 'none' ||
        world.driverVehicle(world.act.id) !== undefined
      ) {
        shiftHead(world)
        return
      }
      const floor = { col: Math.floor(v.pose.x), row: Math.floor(v.pose.y) }
      if (!world.act.actor.inside(floor)) {
        shiftHead(world)
        return
      }
      vehicles.board(world, v)
      shiftHead(world)
      return
    }
    case 'valve':
      arm(world, 0.3 / world.machineMul())
      return
    case 'toggle':
      arm(world, 0)
      return
    case 'tend':
      if (!field.canTend(world, i.at)) {
        shiftHead(world)
        return
      }
      arm(world, TEND_WORK)
      return
    case 'weed-spray':
      field.doWeedSpray(world, i.at)
      shiftHead(world)
      return
    case 'chop':
      if (!field.canChop(world, i.at)) {
        shiftHead(world)
        return
      }
      arm(world, AXES.axe.workSeconds)
      return
    case 'graft':
      if (!field.canGraft(world, i.at)) {
        shiftHead(world)
        return
      }
      arm(world, GRAFT_WORK)
      return
  }
}

export function arm(world: World, seconds: number): void {
  if (seconds <= 0) {
    finishWork(world)
    return
  }
  world.act.workLeft = seconds
  world.act.workTotal = seconds
}

export function markWalk(world: World, i: Intent): void {
  if (world.act.actor.inside(dest(i, world))) return
  world.act.legStart = { x: world.act.actor.x, y: world.act.actor.y }
}

export function shiftHead(world: World): void {
  world.act.queue.shift()
  world.act.workLeft = 0
  world.act.workTotal = 0
  const next = world.act.queue[0]
  if (next !== undefined) markWalk(world, next)
  world.ping()
}

export function finishWork(world: World): void {
  const i = world.act.queue[0]
  if (i === undefined) return
  if (i.act === 'shovel') field.doShovel(world, i.at)
  if (i.act === 'mine') field.doMine(world, i.at)
  if (i.act === 'plant') field.doPlant(world, i.at)
  if (i.act === 'water' && field.doWater(world, i.at)) {
    world.emit('poured')
    world.burst('pour', i.at)
  }
  if (i.act === 'fertilize') field.doFertilize(world, i.at)
  if (i.act === 'compost') machines.doCompost(world, i.at)
  if (i.act === 'harvest') field.doHarvest(world, i.at)
  if (i.act === 'grind') machines.doGrind(world, i.at)
  if (i.act === 'mill') machines.doMill(world, i.at)
  if (i.act === 'still') machines.doStill(world, i.at)
  if (i.act === 'furnace') machines.doFurnace(world, i.at)
  if (i.act === 'station') machines.doStation(world, i.at)
  if (i.act === 'barrel') machines.doBarrel(world, i.at)
  if (i.act === 'jam') machines.doJam(world, i.at)
  if (i.act === 'valve') doValve(world, i.edge)
  if (i.act === 'toggle') doToggle(world, i.at)
  if (i.act === 'tend') {
    field.doTend(world, i.at)
    world.burst('tend', i.at)
  }
  if (i.act === 'weed-spray') field.doWeedSpray(world, i.at)
  if (i.act === 'chop') field.doChop(world, i.at)
  if (i.act === 'graft') field.doGraft(world, i.at)
  shiftHead(world)
}

export function tickFill(world: World, dt: number): void {
  const head = world.act.queue[0]
  if (head?.act !== 'fill') {
    world.act.filling = false
    shiftHead(world)
    return
  }
  if (world.act.hand.kind !== 'hold' || world.act.hand.item.kind !== 'container') {
    world.act.filling = false
    shiftHead(world)
    return
  }
  const c0 = world.cell(head.at)
  const source: Pump | RainTank | Tap | Well | undefined =
    c0.kind === 'pump' || c0.kind === 'rain-tank' || c0.kind === 'tap' || c0.kind === 'well' ? c0 : undefined
  if (source === undefined) {
    world.act.filling = false
    shiftHead(world)
    return
  }
  const c = world.act.hand.item
  const miss = c.capacityLiters - c.liters
  if (miss <= 0) {
    world.act.filling = false
      shiftHead(world)
    return
  }
  const add = fillDraw(world, source, dt)
  c.liters = add >= miss ? c.capacityLiters : c.liters + add
  if (c.liters === c.capacityLiters) {
    world.act.filling = false
      shiftHead(world)
  }
}

export function fillDraw(world: World, source: Pump | RainTank | Tap | Well, dt: number): number {
  if (source.kind === 'tap') {
    const net = world.netOfCell(source.base)
    if (net === undefined) return 0
    const got = world.pullWater(net.sources, TAP_RATE * dt)
    source.drawn += got
    return got
  }
  const got = source.water.take(source.water.rate * dt)
  if (source.kind === 'pump') world.pumpLiters += got
  return got
}

export function doToggle(world: World, at: Coord): void {
  const c = world.cell(at)
  if (c.kind === 'lever') {
    flipLever(c)

    world.ping()
    return
  }
  if (c.kind === 'button') {
    pressButton(c)

    world.ping()
  }
}

export function doPickup(world: World, at: Coord): void {
  const i = topIndex(world.drops, at)
  if (i < 0) {
    const c = world.cell(at)
    const cover = c.kind === 'untilled' && c.cover.kind === 'grass'
    if (c.kind !== 'weed' && !cover) return
    const kind = c.kind === 'weed' ? 'weed' : 'grass'
    const held = world.act.hand
    if (held.kind === 'hold') {
      if (held.item.kind !== kind) return
      if (held.item.count >= world.stackMax(held.item)) {
        world.say(HAND_FULL)
        return
      }
      held.item.count += 1
    }
    if (c.kind === 'weed') {
      c.soil.weedChance = 0
      world.setCell(at, { kind: 'empty', soil: c.soil })
    } else if (c.kind === 'untilled') {
      world.setCell(at, { kind: 'untilled', ground: c.ground, cover: { kind: 'bare' } })
    }
    if (held.kind === 'empty') world.act.hand = { kind: 'hold', item: { kind, count: 1 } }
      return
  }
  const taken = world.drops[i].item
  const held = world.act.hand
  if (held.kind === 'hold' && countable(held.item) && countable(taken) && stackable(held.item, taken)) {
    const room = world.stackMax(held.item) - held.item.count
    if (room <= 0) {
      world.say(HAND_FULL)
      return
    }
    const n = taken.count < room ? taken.count : room
    mergeInto(held.item, taken, n)
    if (n === taken.count) world.drops.splice(i, 1)
    else taken.count -= n
      return
  }
  world.drops.splice(i, 1)
  if (held.kind === 'empty') {
    world.act.hand = { kind: 'hold', item: taken }
      return
  }
  world.drops.push({ at: { ...at }, item: held.item })
  world.act.hand = { kind: 'hold', item: taken }
}

export function doDrop(world: World, at: Coord): void {
  if (world.act.hand.kind !== 'hold') return
  if (!isPlot(world.cell(at))) return
  world.drops.push({ at: { ...at }, item: world.act.hand.item })
  world.act.hand = { kind: 'empty' }
}

export function canFill(world: World, at: Coord): boolean {
  if (world.act.hand.kind !== 'hold' || world.act.hand.item.kind !== 'container') return false
  return fillable(world, at)
}

export function doValve(world: World, edge: Edge): void {
  world.toggleValve(edge)
}

function shovelTime(world: World, at: Coord): number {
  const s = (world.act.hand as { item: Extract<Item, { kind: 'shovel' }> }).item
  const c = world.cell(at)
  if (c.kind === 'untilled' && c.ground === 'hard') return s.workSeconds * 2
  return s.workSeconds
}

function mineTime(world: World, at: Coord): number {
  const p = (world.act.hand as { item: Extract<Item, { kind: 'pickaxe' }> }).item
  const c = world.cell(at)
  if (c.kind !== 'rock') return p.workSeconds
  const n = occupiedCells(c.base, world.owned).length
  return n === 1 ? p.workSeconds : p.workSeconds * 2
}
