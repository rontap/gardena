import { m } from '../../paraglide/messages.js'
import { CROP_NAME, CROPS, FRESH_FULL, HAPPY_MAX, type CropClass } from '../defs/crops.ts'
import { RESEARCH } from '../defs/research.ts'
import type { VarietyId } from '../defs/varieties.ts'
import { occupiedCells, type Coord } from '../sim/building.ts'
import { filledOf, needOf } from '../sim/feature-contracts/market.ts'
import type { CompanyId, ContractId, Demand } from '../sim/feature-contracts/market.h.ts'
import { JAM_CROPS, type Grandma, type GrownCrop, type ResearchId } from '../sim/ids.ts'
import { statsOf, type Stats } from '../sim/modifiers.ts'
import type { RosterSeat } from '../sim/mp.ts'
import { grid } from '../sim/nets.ts'
import { bookOf, ritualReady } from '../sim/feature-necronomicon/necronomicon.ts'
import { fertBand, waterBand } from '../sim/soil.ts'
import type { SeatId, World } from '../sim/world.ts'

export const NOTICE_SECONDS = 1
export const NOTICE_GROUP_MAX = 3
export const NOTICE_WATER_LOW = 0.2

export type NoticeKind =
  | 'recap'
  | 'grandma'
  | 'necronomicon'
  | 'joined'
  | 'quit'
  | 'desynced'
  | 'contract'
  | 'contract-done'
  | 'fuel'
  | 'wilting'
  | 'drowning'
  | 'starving'
  | 'freshness'
  | 'dead'
  | 'rotten'
  | 'research'
  | 'research-done'
  | 'points'
  | 'expansion'
  | 'water-low'
  | 'weed'

export const NOTICE_ORDER: readonly NoticeKind[] = [
  'recap',
  'joined',
  'quit',
  'desynced',
  'contract-done',
  'research-done',
  'grandma',
  'fuel',
  'drowning',
  'wilting',
  'starving',
  'freshness',
  'rotten',
  'dead',
  'weed',
  'contract',
  'research',
  'water-low',
  'necronomicon',
  'points',
  'expansion',
]

const BAD: readonly NoticeKind[] = [
  'fuel',
  'drowning',
  'wilting',
  'starving',
  'freshness',
  'rotten',
  'dead',
  'water-low',
  'weed',
]

export function noticeBad(kind: NoticeKind): boolean {
  return BAD.includes(kind)
}

export type NoticeFace =
  | { kind: 'recap' }
  | { kind: 'grandma' }
  | { kind: 'necronomicon' }
  | { kind: 'hat'; seat: SeatId }
  | { kind: 'company'; id: CompanyId }
  | { kind: 'oil' }
  | { kind: 'water' }
  | { kind: 'fertilizer' }
  | { kind: 'harvest' }
  | { kind: 'water-system' }
  | { kind: 'dead'; cls: CropClass }
  | { kind: 'rotten'; cls: CropClass }
  | { kind: 'research' }
  | { kind: 'points' }
  | { kind: 'expansion' }
  | { kind: 'weed' }

export type NoticeSubject =
  | { kind: 'crop'; crop: GrownCrop }
  | { kind: 'research'; id: ResearchId }
  | { kind: 'demand'; demand: Demand }

export type NoticePopup = { kind: 'recap'; day: number } | { kind: 'grandma'; beat: Grandma }

export type NoticeGo =
  | { kind: 'none' }
  | { kind: 'panel'; panel: 'market' | 'research' | 'family' }
  | { kind: 'popup'; popup: NoticePopup }

export type Notice = {
  id: string
  kind: NoticeKind
  text: string
  face: NoticeFace
  subjects: readonly NoticeSubject[]
  cells: readonly Coord[]
  bar: number | undefined
  go: NoticeGo
}

export type Pass = {
  activeIds: readonly ContractId[]
  running: ResearchId | undefined
}

function key(at: Coord): string {
  return `${at.col},${at.row}`
}

function statsFor(world: World, cache: Map<string, Stats>, crop: GrownCrop, variety: VarietyId): Stats {
  const k = `${crop}|${variety}`
  const hit = cache.get(k)
  if (hit !== undefined) return hit
  const made = statsOf(crop, variety, 0, world.modifiers)
  cache.set(k, made)
  return made
}

function plantRows(world: World): Notice[] {
  const cache = new Map<string, Stats>()
  const rows: Notice[] = []
  const weeds: Coord[] = []
  for (const at of world.grow.values()) {
    const c = world.cell(at)
    const cells = [at]
    if (c.kind === 'weed') {
      weeds.push(at)
      continue
    }
    if (c.kind === 'dead') {
      rows.push({
        id: `dead:${key(at)}`,
        kind: 'dead',
        text: m.notices_dead(),
        face: { kind: 'dead', cls: CROPS[c.plant.crop].cls },
        subjects: [{ kind: 'crop', crop: c.plant.crop }],
        cells,
        bar: undefined,
        go: { kind: 'none' },
      })
      continue
    }
    if (c.kind === 'rotten') {
      rows.push({
        id: `rotten:${key(at)}`,
        kind: 'rotten',
        text: m.notices_rotten(),
        face: { kind: 'rotten', cls: CROPS[c.crop].cls },
        subjects: [{ kind: 'crop', crop: c.crop }],
        cells,
        bar: undefined,
        go: { kind: 'none' },
      })
      continue
    }
    if (c.kind === 'ripe') {
      if (c.plant.freshness >= FRESH_FULL) continue
      rows.push({
        id: `freshness:${key(at)}`,
        kind: 'freshness',
        text: m.notices_freshness({ crop: CROP_NAME[c.plant.crop]() }),
        face: { kind: 'harvest' },
        subjects: [{ kind: 'crop', crop: c.plant.crop }],
        cells,
        bar: c.plant.freshness,
        go: { kind: 'none' },
      })
      continue
    }
    if (c.kind !== 'growing') continue
    const st = statsFor(world, cache, c.plant.crop, c.plant.variety)
    const name = CROP_NAME[c.plant.crop]()
    const subjects: NoticeSubject[] = [{ kind: 'crop', crop: c.plant.crop }]
    const bar = c.plant.happiness / HAPPY_MAX
    if (waterBand(c.soil.water, st.waterTolerance) === 'red') {
      const drowning = c.soil.drowning
      rows.push({
        id: `${drowning ? 'drowning' : 'wilting'}:${key(at)}`,
        kind: drowning ? 'drowning' : 'wilting',
        text: drowning ? m.notices_drowning({ crop: name }) : m.notices_wilting({ crop: name }),
        face: { kind: 'water' },
        subjects,
        cells,
        bar,
        go: { kind: 'none' },
      })
    }
    if (fertBand(c.soil.fertilizer, st.fertTolerance) === 'red') {
      rows.push({
        id: `starving:${key(at)}`,
        kind: 'starving',
        text: m.notices_starving({ crop: name }),
        face: { kind: 'fertilizer' },
        subjects,
        cells,
        bar,
        go: { kind: 'none' },
      })
    }
  }
  if (weeds.length > 0) {
    rows.push({
      id: 'weed',
      kind: 'weed',
      text: m.notices_weed(),
      face: { kind: 'weed' },
      subjects: [],
      cells: weeds,
      bar: undefined,
      go: { kind: 'none' },
    })
  }
  return rows
}

function fuelRows(world: World): Notice[] {
  return world.vehicles
    .filter(v => v.fuel === 0)
    .map(v => ({
      id: `fuel:${v.id}`,
      kind: 'fuel' as const,
      text: m.notices_fuel({ vehicle: v.kind === 'tractor' ? m.names_vehicle_tractor() : m.names_vehicle_quad() }),
      face: { kind: 'oil' as const },
      subjects: [],
      cells: v.pose.kind === 'field' ? [{ col: Math.floor(v.pose.x), row: Math.floor(v.pose.y) }] : [v.pose.hangar],
      bar: undefined,
      go: { kind: 'none' as const },
    }))
}

function demandSubjects(d: Demand): NoticeSubject[] {
  if (d.kind === 'group' && d.group === 'jam') {
    return JAM_CROPS.map(c => ({
      kind: 'demand' as const,
      demand: { kind: 'plain' as const, good: `jam-${c}` as const, amount: d.amount },
    }))
  }
  return [{ kind: 'demand', demand: d }]
}

function daysText(left: number): string {
  if (left <= 0) return m.notices_contract_today()
  return m.notices_contract({ days: left })
}

function contractRows(world: World): Notice[] {
  const now = world.nowDay()
  return world.contracts.active.map(a => ({
    id: `contract:${a.offer.id}`,
    kind: 'contract' as const,
    text: daysText(Math.ceil(a.dueDay - now)),
    face: { kind: 'company' as const, id: a.offer.company },
    subjects: a.bins.filter(b => b.filled < b.demand.amount).flatMap(b => demandSubjects(b.demand)),
    cells: [],
    bar: filledOf(a) / needOf(a),
    go: { kind: 'panel' as const, panel: 'market' as const },
  }))
}

function waterRows(world: World): Notice[] {
  return grid(world)
    .map((net, ix) => ({
      ix,
      stored: net.sources.reduce((a, s) => a + s.stored, 0),
      capacity: net.sources.reduce((a, s) => a + s.capacity, 0),
    }))
    .filter(n => n.capacity > 0 && n.stored / n.capacity < NOTICE_WATER_LOW)
    .map(n => ({
      id: `water-low:${n.ix}`,
      kind: 'water-low' as const,
      text: m.notices_water_low(),
      face: { kind: 'water-system' as const },
      subjects: [],
      cells: [],
      bar: n.stored / n.capacity,
      go: { kind: 'none' as const },
    }))
}

function standingRows(world: World): Notice[] {
  const rows: Notice[] = []
  const job = world.job
  if (job.kind === 'run') {
    const def = RESEARCH[job.id]
    rows.push({
      id: `research:${job.id}`,
      kind: 'research',
      text: m.notices_research({ name: def.name }),
      face: { kind: 'research' },
      subjects: [{ kind: 'research', id: job.id }],
      cells: [],
      bar: (def.seconds - job.left) / def.seconds,
      go: { kind: 'panel', panel: 'research' },
    })
  }
  if (world.points > 0) {
    rows.push({
      id: 'points',
      kind: 'points',
      text: m.notices_points({ n: world.points }),
      face: { kind: 'points' },
      subjects: [],
      cells: [],
      bar: undefined,
      go: { kind: 'panel', panel: 'family' },
    })
  }
  const left = world.expandLeft()
  if (left > 0) {
    rows.push({
      id: 'expansion',
      kind: 'expansion',
      text: m.notices_expansion({ n: left }),
      face: { kind: 'expansion' },
      subjects: [],
      cells: [],
      bar: undefined,
      go: { kind: 'none' },
    })
  }
  return rows
}

export function recapRows(world: World): Notice[] {
  return world.recapUnseen.map(day => ({
    id: `recap:${day}`,
    kind: 'recap' as const,
    text: m.notices_recap({ n: day }),
    face: { kind: 'recap' as const },
    subjects: [],
    cells: [],
    bar: undefined,
    go: { kind: 'popup' as const, popup: { kind: 'recap' as const, day } },
  }))
}

export function grandmaRows(world: World): Notice[] {
  return world.grandmaUnseen.map(beat => ({
    id: `grandma:${beat}`,
    kind: 'grandma' as const,
    text: m.notices_grandma(),
    face: { kind: 'grandma' as const },
    subjects: [],
    cells: [],
    bar: undefined,
    go: { kind: 'popup' as const, popup: { kind: 'grandma' as const, beat } },
  }))
}

export function necronomiconRows(world: World): Notice[] {
  const book = bookOf(world)
  if (book === undefined || !ritualReady(world, book)) return []
  return [
    {
      id: 'necronomicon',
      kind: 'necronomicon' as const,
      text: m.notices_necronomicon(),
      face: { kind: 'necronomicon' as const },
      subjects: [],
      cells: occupiedCells(book.base, world.owned),
      bar: undefined,
      go: { kind: 'none' as const },
    },
  ]
}

export function noticeRows(world: World): Notice[] {
  return [
    ...grandmaRows(world),
    ...necronomiconRows(world),
    ...recapRows(world),
    ...contractRows(world),
    ...fuelRows(world),
    ...plantRows(world),
    ...standingRows(world),
    ...waterRows(world),
  ]
}

export function passOf(world: World): Pass {
  return {
    activeIds: world.contracts.active.map(a => a.offer.id),
    running: world.job.kind === 'run' ? world.job.id : undefined,
  }
}

export function doneRows(world: World, before: Pass): Notice[] {
  const live = new Set(world.contracts.active.map(a => a.offer.id))
  const closed = before.activeIds
    .filter(id => !live.has(id))
    .flatMap(id => {
      const h = world.contracts.history.find(e => e.id === id)
      if (h?.outcome.kind !== 'done') return []
      return [
        {
          id: `contract-done:${h.id}`,
          kind: 'contract-done' as const,
          text: m.notices_contract_done(),
          face: { kind: 'company' as const, id: h.company },
          subjects: [],
          cells: [],
          bar: undefined,
          go: { kind: 'panel' as const, panel: 'market' as const },
        },
      ]
    })
  const was = before.running
  const research =
    was !== undefined && passOf(world).running !== was && world.done.has(was)
      ? [
          {
            id: `research-done:${was}`,
            kind: 'research-done' as const,
            text: m.notices_research_done({ name: RESEARCH[was].name }),
            face: { kind: 'research' as const },
            subjects: [{ kind: 'research' as const, id: was }],
            cells: [],
            bar: undefined,
            go: { kind: 'panel' as const, panel: 'research' as const },
          },
        ]
      : []
  return [...closed, ...research]
}

function skipDelay(kind: NoticeKind): boolean {
  return kind === 'recap' || kind === 'grandma' || kind === 'joined' || kind === 'quit' || kind === 'desynced'
}

function rosterText(kind: 'joined' | 'quit' | 'desynced', name: string): string {
  if (kind === 'joined') return m.notices_joined({ name })
  if (kind === 'quit') return m.notices_quit({ name })
  return m.notices_desynced({ name })
}

function mintRoster(kind: 'joined' | 'quit' | 'desynced', seat: SeatId, name: string, n: number): Notice {
  return {
    id: `${kind}:${seat}:${n}`,
    kind,
    text: rosterText(kind, name),
    face: { kind: 'hat', seat },
    subjects: [],
    cells: [],
    bar: undefined,
    go: { kind: 'none' },
  }
}

export function rosterNotices(
  prev: readonly RosterSeat[],
  next: readonly RosterSeat[],
  local: SeatId,
  session: boolean,
  n0: number,
): { rows: Notice[]; n: number } {
  if (!session) return { rows: [], n: n0 }
  const before = new Map(prev.map(s => [s.id, s]))
  let n = n0
  const rows: Notice[] = []
  next.forEach(s => {
    if (s.id === local) return
    if ('leave' in s && s.leave === 'kicked') {
      n += 1
      rows.push(mintRoster('desynced', s.id, s.name, n))
      return
    }
    if ('leave' in s && s.leave === 'drop') {
      n += 1
      rows.push(mintRoster('quit', s.id, s.name, n))
      return
    }
    if (s.presence === 'in' && before.get(s.id)?.presence !== 'in') {
      n += 1
      rows.push(mintRoster('joined', s.id, s.name, n))
    }
  })
  return { rows, n }
}

export type Tracked = { row: Notice; armed: boolean; grace: boolean }

export function trackPass(prev: ReadonlyMap<string, Tracked>, now: readonly Notice[]): Map<string, Tracked> {
  const live = new Set(now.map(r => r.id))
  const next = new Map<string, Tracked>()
  now.forEach(r =>
    next.set(r.id, {
      row: r,
      armed: skipDelay(r.kind) || prev.has(r.id),
      grace: false,
    }),
  )
  prev.forEach((t, id) => {
    if (live.has(id) || !t.armed || t.grace) return
    if (skipDelay(t.row.kind)) return
    next.set(id, { row: t.row, armed: true, grace: true })
  })
  return next
}

export function visibleRows(tracked: ReadonlyMap<string, Tracked>, once: readonly Notice[]): Notice[] {
  return [...once, ...[...tracked.values()].filter(t => t.armed).map(t => t.row)]
}

export function dropNotice(tracked: Map<string, Tracked>, once: readonly Notice[], id: string): { tracked: Map<string, Tracked>; once: Notice[] } {
  const next = new Map(tracked)
  next.delete(id)
  return { tracked: next, once: once.filter(r => r.id !== id) }
}

export type NoticeBlock = { kind: NoticeKind; rows: readonly Notice[] }

export function groupNotices(rows: readonly Notice[]): NoticeBlock[] {
  return NOTICE_ORDER.map(kind => ({ kind, rows: rows.filter(r => r.kind === kind) })).filter(g => g.rows.length > 0)
}
