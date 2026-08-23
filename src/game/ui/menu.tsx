import { useRef, useState } from 'react'
import type { LoadFailReason } from '../sim/save.ts'
import { slotExists, slotStamp } from '../sim/save.ts'
import { UI_MENU } from '../view/svgs.ts'
import { Changelog } from './changelog.tsx'
import { Btn, Chrome } from './frame.tsx'
import { JoinFields, Notice, type MpFail } from './multiplayer.tsx'

const FAIL: { readonly [K in LoadFailReason]: string } = {
  'not-gardena': 'This file is not a Gardena save.',
  version: 'This save could not be loaded because of a version difference.',
  unusable: 'This file could not be used.',
}

type MenuPage = { kind: 'home' } | { kind: 'changelog' }

type MenuProps =
  | {
      mode: 'boot'
      fail: LoadFailReason | undefined
      mpFail: MpFail | undefined
      joining: boolean
      connecting: boolean
      name: string
      onName: (v: string) => void
      onNew: () => void
      onLoad: () => void
      onUpload: (text: string) => void
      onJoinOpen: () => void
      onJoin: (key: string) => void
      onJoinClose: () => void
    }
  | {
      mode: 'play'
      fail: LoadFailReason | undefined
      connected: boolean
      guest: boolean
      onNew: () => void
      onLoad: () => void
      onUpload: (text: string) => void
      onSave: () => void
      onDownload: () => void
      onLeave: () => void
      onClose: () => void
    }

export function Menu(props: MenuProps) {
  const { mode, fail, onNew, onLoad, onUpload } = props
  const [page, setPage] = useState<MenuPage>({ kind: 'home' })
  const input = useRef<HTMLInputElement>(null)
  const stamp = slotStamp()
  const loadLabel = stamp === undefined ? 'Load Save' : `Load Save (${stamp})`
  const shell =
    mode === 'boot'
      ? 'absolute inset-0 z-20 flex items-center justify-center'
      : 'absolute inset-0 z-20 flex items-center justify-center bg-ink/50'
  const joining = mode === 'boot' && props.joining
  if (joining && page.kind !== 'home') {
    setPage({ kind: 'home' })
  }
  const changelog = !joining && page.kind === 'changelog'
  const mpLocked = mode === 'play' && props.connected
  const guest = mode === 'play' && props.guest
  const showX = mode === 'play' || joining || changelog
  return (
    <div
      className={shell}
      onPointerDown={
        mode === 'play'
          ? e => {
              if (e.target === e.currentTarget) props.onClose()
            }
          : undefined
      }
    >
      <Chrome className={changelog ? 'relative w-[36rem]' : 'relative w-[26rem]'}>
        {showX && (
          <button
            type="button"
            aria-label="Close"
            className="absolute top-4 right-4 z-30 cursor-pointer px-2 py-0.5 text-lg leading-none text-ink/60 hover:bg-dirt hover:text-house"
            onClick={
              changelog
                ? () => setPage({ kind: 'home' })
                : mode === 'boot'
                  ? props.onJoinClose
                  : props.onClose
            }
          >
            ×
          </button>
        )}
        <div className="relative z-20 flex flex-col gap-2 px-4 pt-4 pb-3">
          <svg viewBox="0 0 240 64" className="w-full" dangerouslySetInnerHTML={{ __html: UI_MENU }} />
          <h1 className="text-center font-display text-base leading-none">Gardena</h1>
          <button
            type="button"
            aria-label="Version history"
            aria-pressed={changelog}
            className={
              changelog
                ? 'cursor-pointer bg-ink px-2 py-0.5 text-center text-sm text-house'
                : 'cursor-pointer px-2 py-0.5 text-center text-sm text-ink/45 hover:bg-dirt hover:text-house'
            }
            onClick={() => {
              if (joining) return
              setPage(page.kind === 'changelog' ? { kind: 'home' } : { kind: 'changelog' })
            }}
          >
            1.5.0
          </button>
          {joining ? (
            <JoinFields
              fail={props.mpFail}
              connecting={props.connecting}
              name={props.name}
              onName={props.onName}
              onJoin={props.onJoin}
              onClose={props.onJoinClose}
            />
          ) : changelog ? (
            <Changelog />
          ) : (
            <>
              <Btn className="w-full" disabled={mpLocked} onClick={onNew}>
                New Game
              </Btn>
              <Btn className="w-full" disabled={!slotExists() || mpLocked} onClick={onLoad}>
                {loadLabel}
              </Btn>
              <Btn
                className="w-full"
                disabled={mpLocked}
                onClick={() => {
                  const el = input.current
                  if (el === null) return
                  el.click()
                }}
              >
                Upload Save
              </Btn>
              {mode === 'boot' && (
                <Btn className="w-full" onClick={props.onJoinOpen}>
                  Join Multiplayer
                </Btn>
              )}
              {mode === 'play' && (
                <Btn className="w-full" disabled={guest} onClick={props.onSave}>
                  Save game
                </Btn>
              )}
              {mode === 'play' && (
                <Btn className="w-full" disabled={guest} onClick={props.onDownload}>
                  Download Save
                </Btn>
              )}
              {mode === 'play' && guest && (
                <Btn className="w-full" onClick={props.onLeave}>
                  Leave Multiplayer
                </Btn>
              )}
              {mpLocked && !guest && (
                <p className="text-xs text-ink/55">
                  Starting or loading another farm is off while you are hosting — it would drop everyone who
                  joined.
                </p>
              )}
              {guest && (
                <p className="text-xs text-ink/55">
                  This farm belongs to the host, so it is theirs to save, load, and download.
                </p>
              )}
              {fail !== undefined && <div className="text-sm text-roof">{FAIL[fail]}</div>}
              {mode === 'boot' && <Notice fail={props.mpFail} />}
            </>
          )}
          <input
            ref={input}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={e => {
              const list = e.target.files
              e.target.value = ''
              if (list === null || list.length === 0) return
              void list[0].text().then(onUpload)
            }}
          />
        </div>
      </Chrome>
    </div>
  )
}
