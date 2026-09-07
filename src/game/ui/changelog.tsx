import { useRef, useState } from 'react'
import { KIND_EMOJI, RELEASES, type Change } from './changelog.ts'

function ChangeItems({ changes }: { changes: readonly Change[] }) {
  return (
    <>
      {changes.map((change, i) => (
        <div key={i}>
          <div className="flex text-sm">
            <span className="w-6 shrink-0">{KIND_EMOJI[change.kind]}</span>
            <span>{change.text}</span>
          </div>
          {change.notes.map((note, j) => (
            <div key={j} className="pl-6 text-sm text-ink/45">
              {note}
            </div>
          ))}
          {change.kind === 'major-feature' && change.changes.length > 0 ? (
            <div className="pl-4">
              <ChangeItems changes={change.changes} />
            </div>
          ) : null}
        </div>
      ))}
    </>
  )
}

export function Changelog() {
  const rows = useRef(new Map<string, HTMLDivElement>())
  const navBtns = useRef(new Map<string, HTMLButtonElement>())
  const pane = useRef<HTMLDivElement>(null)
  const [sel, setSel] = useState(RELEASES[0].id)
  const pick = (id: string) => {
    setSel(prev => {
      if (prev === id) return prev
      navBtns.current.get(id)?.scrollIntoView({ block: 'nearest', behavior: 'auto' })
      return id
    })
  }
  return (
    <div className="mx-[-1rem] flex h-[min(32rem,calc(100vh-14rem))] min-h-0">
      <div className="scroll-pane w-44 shrink-0 min-h-0 overflow-y-auto border-r border-ink/20">
        {RELEASES.map(release => (
          <button
            key={release.id}
            type="button"
            ref={el => {
              if (el === null) navBtns.current.delete(release.id)
              else navBtns.current.set(release.id, el)
            }}
            className={`flex w-full px-2 py-1 text-left text-sm ${
              sel === release.id ? 'bg-dirt text-house' : 'text-ink hover:bg-dirt/30'
            }`}
            onClick={() => {
              pick(release.id)
              rows.current.get(release.id)?.scrollIntoView({ behavior: 'auto', block: 'start' })
            }}
          >
            <span className="truncate">
              {release.id} {release.name}
            </span>
          </button>
        ))}
      </div>
      <div
        ref={pane}
        className="scroll-pane flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto px-3"
        onScroll={() => {
          const root = pane.current
          if (root === null) return
          const last = RELEASES[RELEASES.length - 1]
          if (root.scrollTop + root.clientHeight >= root.scrollHeight - 2) {
            pick(last.id)
            return
          }
          const y = root.getBoundingClientRect().top + 8
          let id = RELEASES[0].id
          for (const release of RELEASES) {
            const el = rows.current.get(release.id)
            if (el === undefined) continue
            if (el.getBoundingClientRect().top <= y) id = release.id
            else break
          }
          pick(id)
        }}
      >
        {RELEASES.map((release, i) => (
          <div
            key={release.id}
            ref={el => {
              if (el === null) rows.current.delete(release.id)
              else rows.current.set(release.id, el)
            }}
          >
            <div className="text-base font-semibold">
              {release.id} {release.name}
            </div>
            <div className="text-sm text-ink/45">{release.summary}</div>
            <div className="pl-3">
              <ChangeItems changes={release.changes} />
            </div>
            {i < RELEASES.length - 1 ? <div className="h-px bg-ink/20 my-1" /> : null}
          </div>
        ))}
      </div>
    </div>
  )
}
