import type { Prompt, PromptHit } from '../sim/prompt.ts'
import raw from '../../assets/ui/ui-cursor.svg?raw'
import { groupInner } from './svgs.ts'

export type CursorKind = 'walk' | 'dig' | 'water' | 'gather' | 'tune' | 'wire'

const SIZE = 40
const HOT = 3

const TUNE_HITS: ReadonlySet<PromptHit['kind']> = new Set([
  'sprinkler-hud',
  'water-hud',
  'harvest-hud',
  'counter-hud',
  'day-hud',
  'logic-hud',
  'variety-hud',
  'weather-hud',
  'pressure-hud',
])

const made = new Map<CursorKind, string>()

export function cursorCss(kind: CursorKind): string {
  const hit = made.get(kind)
  if (hit !== undefined) return hit
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 24 24" shape-rendering="crispEdges">${groupInner(raw, kind)}</svg>`
  const css = `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${HOT} ${HOT}, auto`
  made.set(kind, css)
  return css
}

export function cursorFor(
  hover: PromptHit | undefined,
  prompt: Prompt | undefined,
  fruit: boolean,
  wiring: boolean,
): CursorKind {
  if (wiring) return 'wire'
  if (hover !== undefined && TUNE_HITS.has(hover.kind)) return 'tune'
  if (prompt === undefined || prompt.kind !== 'intent') return 'walk'
  const act = prompt.intent.act
  if (act === 'shovel' || act === 'mine' || act === 'chop') return 'dig'
  if (act === 'water' || act === 'fill') return 'water'
  if (act === 'harvest') return 'gather'
  if (act === 'pickup' && fruit) return 'gather'
  return 'walk'
}
