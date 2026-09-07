import { m } from '../../paraglide/messages.js'
import { CROP_NAME, CROPS, FRESH_FULL, HAPPY_MAX, type CropClass } from '../defs/crops.ts'
import { RESEARCH } from '../defs/research.ts'
import type { VarietyId } from '../defs/varieties.ts'
import type { Coord } from '../sim/building.ts'
import { filledOf, needOf } from '../sim/feature-contracts/market.ts'
import type { CompanyId, ContractId, Demand } from '../sim/feature-contracts/market.h.ts'
import { JAM_CROPS, type CropId, type ResearchId } from '../sim/ids.ts'
import { statsOf, type Stats } from '../sim/modifiers.ts'
import { grid } from '../sim/nets.ts'
import { fertBand, waterBand } from '../sim/soil.ts'
import type { World } from '../sim/world.ts'

export const NOTICE_SECONDS = 1
export const NOTICE_GROUP_MAX = 3
export const NOTICE_WATER_LOW = 0.2

export type NoticeKind =
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

export const NOTICE_ORDER: readonly NoticeKind[] = [
  'contract-done',
  'research-done',
  'fuel',
  'drowning',
  'wilting',
  'starving',
  'freshness',
  'rotten',
  'dead',
  'contract',
  'research',
  'water-low',
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
]

export function noticeBad(kind: NoticeKind): boolean {
  return BAD.includes(kind)
}

export type NoticeFace =
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

export type NoticeSubject =
  | { kind: 'crop'; crop: CropId }
  | { kind: 'research'; id: ResearchId }
  | { kind: 'demand'; demand: Demand }

export type NoticeGo = 'none' | 'market' | 'research' | 'family'

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

function statsFor(world: World, cache: Map<string, Stats>, crop: CropId, variety: VarietyId): Stats {
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
  for (const at of world.grow.values()) {
    const c = world.cell(at)
    const cells = [at]
    if (c.kind === 'dead') {
      rows.push({
        id: `dead:${key(at)}`,
        kind: 'dead',
        text: m.notices_dead(),
        face: { kind: 'dead', cls: CROPS[c.plant.crop].cls },
        subjects: [{ kind: 'crop', crop: c.plant.crop }],
        cells,
        bar: undefined,
        go: 'none',
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
        go: 'none',
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
        go: 'none',
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
        go: 'none',
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
        go: 'none',
      })
    }
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
      go: 'none' as const,
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
    go: 'market' as const,
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
      go: 'none' as const,
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
      go: 'research',
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
      go: 'family',
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
      go: 'none',
    })
  }
  return rows
}

export function noticeRows(world: World): Notice[] {
  return [...contractRows(world), ...fuelRows(world), ...plantRows(world), ...standingRows(world), ...waterRows(world)]
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
          go: 'market' as const,
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
            go: 'research' as const,
          },
        ]
      : []
  return [...closed, ...research]
}

export type NoticeBlock = { kind: NoticeKind; rows: readonly Notice[] }

export function groupNotices(rows: readonly Notice[]): NoticeBlock[] {
  return NOTICE_ORDER.map(kind => ({ kind, rows: rows.filter(r => r.kind === kind) })).filter(g => g.rows.length > 0)
}
