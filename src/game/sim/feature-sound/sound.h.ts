import type { NoticeKind } from '../../ui/notices.ts'
import type { MachineId } from '../feature-machines/recipe.h.ts'
import type { Intent } from '../world.h.ts'

export type OpenBuilding = 'chest' | 'freezer' | 'silo-produce' | 'postbox'

export type SoundCue =
  | { kind: 'act'; act: Intent['act'] }
  | { kind: 'open'; building: OpenBuilding }
  | { kind: 'close'; building: OpenBuilding }
  | { kind: 'machine'; machine: MachineId }
  | { kind: 'notice'; notice: NoticeKind; id: string }

export type Count = { n: number }
export type Stop = () => void
export type LoopFn = (count: Count) => Stop
export type OnceFn = (done: () => void) => Stop

export function soundKey(c: SoundCue): string {
  if (c.kind === 'act') return `act:${c.act}`
  if (c.kind === 'open') return `open:${c.building}`
  if (c.kind === 'close') return `close:${c.building}`
  if (c.kind === 'machine') return `machine:${c.machine}`
  return `notice:${c.notice}:${c.id}`
}
