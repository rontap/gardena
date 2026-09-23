import type { Cell } from '../plot.ts'
import { furnaceMulFor } from '../feature-machines/machines.tick.ts'
import type { CraftCell, MachineId } from '../feature-machines/recipe.h.ts'
import { craftState } from '../feature-machines/recipe.ts'
import type { Intent } from '../world.h.ts'
import type { World } from '../world.ts'
import { noticeRows } from '../../ui/notices.ts'
import { machineLoop, machineOnce } from './machines/index.ts'
import { farmMusic } from './music/index.ts'
import { soundKey, type SoundCue } from './sound.h.ts'
import { armAudio, holdAudio } from './sound.utils.ts'
import { actLoop, actOnce, noticeOnce, openOnce } from './vfx/index.ts'

type Count = { n: number }
type Stop = () => void
type Running = { stop: Stop; count: Count }

const running = new Map<string, Running>()
const shot = new Map<string, Stop>()
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
  stops.forEach(stop => stop())
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
  if (c.kind === 'open') return openOnce(c.building)
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

function sync(world: World): void {
  keep('music', 1, farmMusic())
  const acts = new Map<Intent['act'], number>()
  world.seats.forEach(s => {
    const head = s.queue[0]
    if (head === undefined || s.workLeft <= 0) return
    const n = acts.get(head.act)
    acts.set(head.act, n === undefined ? 1 : n + 1)
  })
  const dropAct: string[] = []
  running.forEach((_r, key) => {
    if (!key.startsWith('act:')) return
    const act = key.slice(4) as Intent['act']
    if (acts.has(act)) return
    dropAct.push(key)
  })
  dropAct.forEach(key => keep(key, 0, undefined))
  acts.forEach((n, act) => keep(`act:${act}`, n, actLoop(act)))
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
}

export function holdSound(paused: boolean): void {
  held = paused
  if (!armed) return
  holdAudio(paused)
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
  if (live !== world || held) return
  sync(world)
  const seen = new Set<string>()
  world.drainCues().forEach(c => {
    const key = soundKey(c)
    if (seen.has(key) || shot.has(key)) return
    seen.add(key)
    const play = onceOf(c)
    if (play === undefined) return
    let ended = false
    const stop = play(() => {
      ended = true
      shot.delete(key)
    })
    if (!ended) shot.set(key, stop)
  })
}
