import { m } from '../../paraglide/messages.js'
import { useRef, useState } from 'react'
import type { LoadFailReason } from '../sim/save.ts'
import { slotExists, slotStamp } from '../sim/save.ts'
import { UI_MENU } from '../view/svgs.ts'
import { Changelog } from './changelog.tsx'
import { Btn, Chrome } from './frame.tsx'
import { JoinFields, Notice, type MpFail } from './multiplayer.tsx'

const FAIL: { readonly [K in LoadFailReason]: () => string } = {
  'unknown-format': () => m.menu_fail_unknown_format(),
  'not-gardena': () => m.menu_fail_not_gardena(),
  version: () => m.menu_fail_version(),
  unusable: () => m.menu_fail_unusable(),
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
  const loadLabel = stamp === undefined ? m.menu_load_save() : m.menu_load_save_stamp({ stamp })
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
            aria-label={m.hud_close()}
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
            aria-label={m.menu_version_history()}
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
            2.1.3
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
                {m.menu_new_game()}
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
                {m.menu_upload_save()}
              </Btn>
              {mode === 'boot' && (
                <Btn className="w-full" onClick={props.onJoinOpen}>
                  {m.menu_join_multiplayer()}
                </Btn>
              )}
              {mode === 'play' && (
                <Btn className="w-full" disabled={guest} onClick={props.onSave}>
                  {m.menu_save_game()}
                </Btn>
              )}
              {mode === 'play' && (
                <Btn className="w-full" disabled={guest} onClick={props.onDownload}>
                  {m.menu_download_save()}
                </Btn>
              )}
              {mode === 'play' && guest && (
                <Btn className="w-full" onClick={props.onLeave}>
                  {m.menu_leave_multiplayer()}
                </Btn>
              )}
              {mpLocked && !guest && (
                <p className="text-xs text-ink/55">
                  {m.menu_host_lock()}
                </p>
              )}
              {guest && (
                <p className="text-xs text-ink/55">
                  {m.menu_guest_lock()}
                </p>
              )}
              {fail !== undefined && <div className="text-sm text-roof">{FAIL[fail]()}</div>}
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
