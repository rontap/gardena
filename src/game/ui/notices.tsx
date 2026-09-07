import { m } from '../../paraglide/messages.js'
import { useEffect, useRef, useState } from 'react'
import type { Coord } from '../sim/building.ts'
import type { World } from '../sim/world.ts'
import { COMPANY, EXPAND_LAND, fruitInner, itemInner, researchInner, SKILL_POINT, UI_NOTICE_RAIL } from '../view/svgs.ts'
import { STAT_COLOR } from './status.tsx'
import { useCycle } from './cycle.ts'
import { demandItem } from './market.tsx'
import {
  doneRows,
  groupNotices,
  noticeBad,
  noticeRows,
  passOf,
  NOTICE_GROUP_MAX,
  NOTICE_SECONDS,
  type Notice,
  type NoticeBlock,
  type NoticeFace,
  type NoticeGo,
  type NoticeSubject,
  type Pass,
} from './notices.ts'

type Tracked = { row: Notice; armed: boolean; grace: boolean }

function faceInner(face: NoticeFace): string {
  if (face.kind === 'company') return COMPANY[face.id]
  if (face.kind === 'oil') return itemInner({ kind: 'oil', quality: 0, count: 1, unitSale: 0 })
  if (face.kind === 'water') return itemInner({ kind: 'water' })
  if (face.kind === 'fertilizer') return itemInner({ kind: 'fertilizer', liters: 0, capacityLiters: 1 })
  if (face.kind === 'harvest') return itemInner({ kind: 'sensor-harvest' })
  if (face.kind === 'water-system') return itemInner({ kind: 'water-system' })
  if (face.kind === 'dead') return itemInner({ kind: 'dead', cls: face.cls, count: 1 })
  if (face.kind === 'rotten') return itemInner({ kind: 'rotten', cls: face.cls, count: 1 })
  if (face.kind === 'research') return itemInner({ kind: 'station' })
  if (face.kind === 'points') return SKILL_POINT
  return EXPAND_LAND
}

function subjectInner(subject: NoticeSubject): string {
  if (subject.kind === 'crop') return fruitInner(subject.crop)
  if (subject.kind === 'research') return researchInner(subject.id)
  return itemInner(demandItem(subject.demand, 1))
}

function Glyph({ art }: { art: string }) {
  return <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" dangerouslySetInnerHTML={{ __html: art }} />
}

const RAIL = {
  backgroundImage: `url(${UI_NOTICE_RAIL})`,
  backgroundRepeat: 'repeat-x',
  backgroundSize: '16px 3px',
} as const

function Subject({ subjects }: { subjects: readonly NoticeSubject[] }) {
  const stage = useCycle(subjects.length)
  return <Glyph art={subjectInner(subjects[stage])} />
}

function NoticeBar({ value, bad }: { value: number; bad: boolean }) {
  const pct = value <= 0 ? 0 : value >= 1 ? 100 : value * 100
  return (
    <div className="mt-1 h-[2px] w-full overflow-hidden bg-ink/25">
      <div
        className="h-full transition-[width] ease-linear motion-reduce:transition-none"
        style={{
          width: `${pct}%`,
          backgroundColor: bad ? STAT_COLOR.red : STAT_COLOR.green,
          transitionDuration: `${NOTICE_SECONDS * 1000}ms`,
        }}
      />
    </div>
  )
}

function Row({ row }: { row: Notice }) {
  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex min-w-0 items-center gap-1.5">
        <Glyph art={faceInner(row.face)} />
        {row.subjects.length > 0 && <Subject subjects={row.subjects} />}
        <span className="min-w-0 flex-1 truncate text-base leading-tight">{row.text}</span>
      </div>
      {row.bar !== undefined && <NoticeBar value={row.bar} bad={noticeBad(row.kind)} />}
    </div>
  )
}

function Block({
  block,
  pulse,
  onHover,
  onGo,
}: {
  block: NoticeBlock
  pulse: boolean
  onHover: (cells: readonly Coord[]) => void
  onGo: (go: NoticeGo, kind: string) => void
}) {
  const shown = block.rows.slice(0, NOTICE_GROUP_MAX)
  const rest = block.rows.length - shown.length
  const cells = block.rows.flatMap(r => r.cells)
  const go = block.rows[0].go
  return (
    <div
      className={`pointer-events-auto relative w-full cursor-pointer border-x border-ink bg-house transition-colors hover:bg-parch ${
        pulse ? 'animate-pulse' : ''
      }`}
      onPointerEnter={() => onHover(cells)}
      onPointerLeave={() => onHover([])}
      onClick={() => onGo(go, block.kind)}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px]" style={RAIL} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px]" style={RAIL} />
      <div className="flex min-w-0 flex-col gap-1 px-2 py-2">
        {shown.map(r => (
          <Row key={r.id} row={r} />
        ))}
        {rest > 0 && <span className="truncate text-sm leading-tight text-ink/60">{m.notices_more({ n: rest })}</span>}
      </div>
    </div>
  )
}

export function Notices({
  world,
  off,
  onHighlight,
  onGo,
}: {
  world: World
  off: boolean
  onHighlight: (cells: readonly Coord[]) => void
  onGo: (go: NoticeGo) => void
}) {
  const tracked = useRef(new Map<string, Tracked>())
  const once = useRef<Notice[]>([])
  const before = useRef<Pass>(passOf(world))
  const seam = useRef(world.seam.kind)
  const signature = useRef(new Map<string, string>())
  const changed = useRef(new Map<string, number>())
  const counter = useRef(0)
  const [passN, setPassN] = useState(0)
  const [rows, setRows] = useState<readonly Notice[]>([])
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const run = (): void => {
      if (seam.current === 'recap' && world.seam.kind === 'play') once.current = []
      seam.current = world.seam.kind
      once.current = [...once.current, ...doneRows(world, before.current)]
      before.current = passOf(world)
      const now = noticeRows(world)
      const live = new Set(now.map(r => r.id))
      const next = new Map<string, Tracked>()
      now.forEach(r => next.set(r.id, { row: r, armed: tracked.current.has(r.id), grace: false }))
      tracked.current.forEach((t, id) => {
        if (live.has(id) || !t.armed || t.grace) return
        next.set(id, { row: t.row, armed: true, grace: true })
      })
      tracked.current = next
      const visible = [...once.current, ...[...next.values()].filter(t => t.armed).map(t => t.row)]
      const n = counter.current + 1
      counter.current = n
      groupNotices(visible).forEach(g => {
        const sig = g.rows.map(r => r.id).join(',')
        if (signature.current.get(g.kind) === sig) return
        signature.current.set(g.kind, sig)
        changed.current.set(g.kind, n)
      })
      setRows(visible)
      setPassN(n)
    }
    run()
    const t = window.setInterval(run, NOTICE_SECONDS * 1000)
    return () => window.clearInterval(t)
  }, [world])

  const blocks = groupNotices(rows)

  if (off) return undefined

  return (
    <>
      <div
        className={`pointer-events-none absolute top-20 right-4 z-20 flex w-72 flex-col gap-1 transition-transform duration-300 motion-reduce:transition-none ${
          hidden ? 'translate-x-[120%]' : 'translate-x-0'
        }`}
      >
        <button
          type="button"
          aria-label={m.notices_hide()}
          className="pointer-events-auto cursor-pointer self-end border border-ink bg-house px-2 py-0.5 text-sm leading-none text-ink/60 hover:bg-parch hover:text-ink"
          onClick={() => {
            onHighlight([])
            setHidden(true)
          }}
        >
          {'›'}
        </button>
        {blocks.map(block => (
          <Block
            key={block.kind}
            block={block}
            pulse={changed.current.get(block.kind) === passN}
            onHover={onHighlight}
            onGo={(go, kind) => {
              once.current = once.current.filter(r => r.kind !== kind)
              onGo(go)
            }}
          />
        ))}
      </div>
      {hidden && (
        <button
          type="button"
          aria-label={m.notices_show()}
          className="pointer-events-auto absolute top-20 right-0 z-20 cursor-pointer border border-r-0 border-ink bg-house px-2 py-4 text-sm leading-none text-ink/70 hover:bg-parch"
          onClick={() => setHidden(false)}
        >
          {'‹'}
        </button>
      )}
    </>
  )
}
