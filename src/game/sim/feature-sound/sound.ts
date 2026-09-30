import type { Cell } from '../plot.ts'
import { furnaceMulFor } from '../feature-machines/machines.tick.ts'
import type { CraftCell, MachineId } from '../feature-machines/recipe.h.ts'
import { craftState } from '../feature-machines/recipe.ts'
import type { Intent, SeatId } from '../world.h.ts'
import type { World } from '../world.ts'
import { noticeRows } from '../../ui/notices.ts'
import { machineLoop, machineOnce } from './machines/index.ts'
import { farmMusic } from './music/index.ts'
import { soundKey, type OnceFn, type SoundCue } from './sound.h.ts'
import { VOLUME_DEFAULT } from '../settings.ts'
import { armAudio, holdAudio, musicGain } from './sound.utils.ts'
import { actHit, actOnce, burrowOnce, clickOnce, closeOnce, noticeOnce, openOnce } from './vfx/index.ts'
import { armEffects, effectsGain, holdEffects } from './vfx/sfx.ts'

type Count = { n: number }
type Stop = () => void
type Running = { stop: Stop; count: Count }

// A hit after the first is skipped when less work than this is left, so it does not sound over the finish.
const TAIL = 0.2

const running = new Map<string, Running>()
const shot = new Map<string, Stop>()
// Per gardener: the job being hit and the number of its last hit.
const struck = new Map<SeatId, { head: Intent; n: number }>
const heard = new Set<string>()
let heardWorld: World | undefined
let armed = false
let live: World | undefined
let held = false

function stopAll(): void {
  running.forEach(r => r.stop())
  running.clear()
  const stops = [...shot.values()]
  shot.clear()
  struck.clear()
  stops.forEach(stop => stop())
}

// Plays a one-shot unless one under `key` is still sounding.
function shoot(key: string, play: OnceFn): void {
  if (shot.has(key)) return
  let ended = false
  const stop = play(() => {
    ended = true
    shot.delete(key)
  })
  if (!ended) shot.set(key, stop)
}

function keep(key: string, n: number, play: ReturnType<typeof farmMusic> | undefined): void {
  const have = running.get(key)
  if (n === 0) {
    if (have === undefined) return
    have.stop()
    running.delete(key)
    return
  }
  if (have !== undefined) {
    have.count.n = n
    return
  }
  if (play === undefined) return
  const count = { n }
  running.set(key, { stop: play(count), count })
}

function onceOf(c: SoundCue) {
  if (c.kind === 'act') return actOnce(c.act)
  if (c.kind === 'burrow') return burrowOnce()
  if (c.kind === 'open') return openOnce(c.building)
  if (c.kind === 'close') return closeOnce(c.building)
  if (c.kind === 'machine') return machineOnce(c.machine)
  return noticeOnce(c)
}

function asCraft(c: Cell): CraftCell | undefined {
  if (
    c.kind === 'mill' ||
    c.kind === 'jam' ||
    c.kind === 'still' ||
    c.kind === 'barrel' ||
    c.kind === 'grinder' ||
    c.kind === 'compost-box' ||
    c.kind === 'furnace' ||
    c.kind === 'infuser' ||
    c.kind === 'refuel'
  ) {
    return c
  }
  return undefined
}

// Each gardener's job plays hit `n` when its work done passes `n` times the hit's `every`.
function strike(world: World): void {
  world.seats.forEach(s => {
    const head = s.queue[0]
    const hit = head === undefined ? undefined : actHit(head.act)
    if (head === undefined || hit === undefined || s.workLeft <= 0 || !('at' in head)) {
      struck.delete(s.id)
      return
    }
    const n = Math.floor((s.workTotal - s.workLeft) / hit.every)
    const had = struck.get(s.id)
    if (had !== undefined && had.head === head && had.n >= n) return
    struck.set(s.id, { head, n })
    if (n > 0 && s.workLeft < TAIL) return
    shoot(`hit:${head.act}:${s.id}`, hit.play(world.cell(head.at)))
  })
}

function sync(world: World): void {
  keep('music', 1, farmMusic())
  strike(world)
  const machines = new Map<MachineId, number>()
  world.machines.forEach(at => {
    const craft = asCraft(world.cell(at))
    if (craft === undefined) return
    if (craftState(craft, world.machineMul(), furnaceMulFor(world, craft.base)).kind !== 'working') return
    const n = machines.get(craft.kind)
    machines.set(craft.kind, n === undefined ? 1 : n + 1)
  })
  const dropMachine: string[] = []
  running.forEach((_r, key) => {
    if (!key.startsWith('machine:')) return
    const machine = key.slice(8) as MachineId
    if (machines.has(machine)) return
    dropMachine.push(key)
  })
  dropMachine.forEach(key => keep(key, 0, undefined))
  machines.forEach((n, machine) => keep(`machine:${machine}`, n, machineLoop(machine)))
}

export function armSound(): void {
  armed = true
  armAudio()
  armEffects()
}

// The two settings sliders, 0 to 100. `VOLUME_DEFAULT` plays at the levels the songs and sounds set.
export function volumeSound(music: number, effects: number): void {
  musicGain(music / VOLUME_DEFAULT)
  effectsGain(effects / VOLUME_DEFAULT)
}

export function clickSound(): void {
  shoot('click', clickOnce())
}

export function holdSound(away: boolean): void {
  held = away
  if (!armed) return
  holdAudio(away)
  holdEffects(away)
}

export function bindSound(world: World): void {
  if (live === world) return
  stopAll()
  if (live !== undefined) live.drainCues()
  live = world
}

export function unbindSound(world: World): void {
  if (live !== world) return
  live = undefined
  stopAll()
  if (heardWorld === world) {
    heard.clear()
    heardWorld = undefined
  }
  world.drainCues()
}

export function hearNotices(world: World): void {
  if (heardWorld !== world) {
    heard.clear()
    heardWorld = world
  }
  noticeRows(world).forEach(r => {
    if (heard.has(r.id)) return
    heard.add(r.id)
    world.cue({ kind: 'notice', notice: r.kind, id: r.id })
  })
}

export function tickSound(world: World): void {
  if (live !== world) return
  if (held) {
    world.drainCues()
    return
  }
  sync(world)
  const seen = new Set<string>()
  world.drainCues().forEach(c => {
    const key = soundKey(c)
    if (seen.has(key)) return
    seen.add(key)
    const play = onceOf(c)
    if (play === undefined) return
    shoot(key, play)
  })
}
