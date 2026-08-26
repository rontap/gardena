import { KIND_EMOJI, RELEASES, type Change } from './changelog.ts'

function ChangeItems({ changes }: { changes: readonly Change[] }) {
  return (
    <>
      {changes.map((change, i) => (
        <div key={i}>
          <div className="flex text-base">
            <span className="w-6 shrink-0">{KIND_EMOJI[change.kind]}</span>
            <span>{change.text}</span>
          </div>
          {change.notes.map((note, j) => (
            <div key={j} className="pl-6 text-base text-ink/45">
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
  return (
    <div className="scroll-pane max-h-[min(32rem,calc(100vh-14rem))] overflow-y-auto flex flex-col gap-3">
      {RELEASES.map((release, i) => (
        <div key={release.id}>
          <div className="text-lg font-semibold">
            {release.id} {release.name}
          </div>
          <div className="text-base text-ink/45">{release.summary}</div>
          <div className="pl-3">
            <ChangeItems changes={release.changes} />
          </div>
          {i < RELEASES.length - 1 ? <div className="h-px bg-ink/20 my-1" /> : null}
        </div>
      ))}
    </div>
  )
}
