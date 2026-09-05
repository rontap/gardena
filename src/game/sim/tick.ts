import { FREEZER_ROT_MUL } from '../defs/items.ts'
import { jamRotMul } from '../defs/skills.ts'
import { CROPS } from '../defs/crops.ts'
import { statsOf } from './modifiers.ts'
import { tickButton } from './sensor.ts'
import { BIG_TICK } from './soil.ts'
import { isTilled } from './plot.ts'
import { soakDelta } from './weather.ts'
import { pullMachineStores } from './feature-machines/machines.tick.ts'
import { sproutWeeds, sproutGrass } from './feature-field/field.ts'
import type { FruitStack, Item, Slot } from './item.ts'
import type { World } from './world.ts'

export function tickSpeech(world: World, dt: number): void {
  if (world.speech.kind !== 'say') return
  world.speech.left -= dt
  if (world.speech.left > 0) return
  world.speech = { kind: 'none' }
  world.pingFor('speech')
}

export function tickJob(world: World, dt: number): void {
  if (world.job.kind === 'idle') return
  const cheat = world.cheatFastResearch ? 3 : 1
  world.job.left -= dt * (1 + 0.05 * world.skillTier('research-speed')) * cheat
  if (world.job.left > 0) return
  const id = world.job.id
  world.done.add(id)
  world.tally.research.push(id)
  world.job = { kind: 'idle' }
  if (id === 'unlock-smart-irrigation') world.rebuildWired()
  world.ping()
}

export function tickButtons(world: World): void {
  for (const at of world.buttons.values()) {
    const c = world.cell(at)
    if (c.kind === 'button') tickButton(c)
  }
}

export function tickFreshness(world: World, dt: number): void {
  const rot = (f: FruitStack, mul: number) => {
    const next =
      f.freshness -
      (dt * mul) / (statsOf(f.crop, f.variety, 0, world.modifiers).rotSeconds * jamRotMul(world.skillTier('jam'), f.freshness))
    f.freshness = next < 0 ? 0 : next
  }
  const spoil = (item: Item, mul: number): Item => {
    if (item.kind !== 'fruit') return item
    rot(item, mul)
    if (item.freshness > 0) return item
    return { kind: 'rotten', cls: CROPS[item.crop].cls, count: item.count }
  }
  const slots = (mul: number) => (s: Slot) => {
    if (s.kind !== 'hold') return
    s.item = spoil(s.item, mul)
  }
  const open = slots(1)
  const chilled = slots(FREEZER_ROT_MUL)
  world.seats.forEach(s => {
    if (s.presence === 'away') return
    open(s.hand)
    s.inventory.forEach(open)
  })
  world.drops.forEach(d => {
    d.item = spoil(d.item, 1)
  })
  for (const at of world.stores.values()) {
    const c = world.cell(at)
    if (c.kind === 'chest') c.slots.forEach(open)
    if (c.kind === 'freezer') c.slots.forEach(chilled)
  }
  world.vehicles.forEach(v => {
    if (v.kind === 'quad') v.slots.forEach(open)
  })
  world.trailers.forEach(t => {
    if (t.kind === 'harvest') t.slots.forEach(open)
  })
}

export function tickBig(world: World, dt: number): void {
  world.bigAcc += dt
  if (world.bigAcc < BIG_TICK) return
  world.bigAcc -= BIG_TICK
  world.bigTicks += 1
  pullMachineStores(world)
  const d = soakDelta(world.weather(world.clock.day))
  if (d !== 0) {
    for (const at of world.tilled.values()) {
      const c = world.cell(at)
      if (!isTilled(c)) continue
      if (d > 0) c.soil.soak(d)
      else c.soil.drink(-d)
    }
  }
  const weeds = sproutWeeds(world)
  const grass = sproutGrass(world)
  if (weeds || grass || d !== 0) world.pingFor('big')
}

export function tickVfx(world: World, pouring: ReadonlySet<string>): boolean {
  let changed = false
  world.vfx.forEach((_on, k) => {
    if (!world.sprinklers.has(k)) {
      world.vfx.delete(k)
      changed = true
    }
  })
  world.sprinklers.forEach((_s, k) => {
    const now = pouring.has(k)
    if (world.vfx.get(k) !== now) {
      world.vfx.set(k, now)
      changed = true
    }
  })
  return changed
}
