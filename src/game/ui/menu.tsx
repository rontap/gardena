import { m } from '../../paraglide/messages.js'
import { useRef, useState } from 'react'
import type { LoadFailReason } from '../sim/feature-save/save.ts'
import { slotExists, slotStamp } from '../sim/feature-save/save.ts'
import { UI_MENU } from '../view/svgs.ts'
import { Changelog } from './changelog.tsx'
import { Btn, Chrome } from './frame.tsx'
import { JoinFields, Notice, type MpFail } from './multiplayer.tsx'
import { SettingsPage } from './settings.tsx'
import type { Settings } from '../sim/settings.ts'

const FAIL: { readonly [K in LoadFailReason]: () => string } = {
  'unknown-format': () => m.menu_fail_unknown_format(),
  'not-gardena': () => m.menu_fail_not_gardena(),
  version: () => m.menu_fail_version(),
  unusable: () => m.menu_fail_unusable(),
}

type MenuPage = { kind: 'home' } | { kind: 'changelog' } | { kind: 'settings' }

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
      onLoad: () => void
      onUpload: (text: string) => void
      onSave: () => void
      onDownload: () => void
      onMainMenu: () => void
      settings: Settings
      onSettings: (next: Settings) => void
      onClose: () => void
    }

export function Menu(props: MenuProps) {
  const { mode, fail, onLoad, onUpload } = props
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
  const config = !joining && page.kind === 'settings'
  const mpLocked = mode === 'play' && props.connected
  const guest = mode === 'play' && props.guest
  const showX = mode === 'play' || joining || changelog
  const pick = () => {
    const el = input.current
    if (el === null) return
    el.click()
  }
  const version = (
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
      2.4.1
    </button>
  )
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
      <Chrome className={changelog ? 'relative w-[36rem]' : mode === 'play' ? 'relative w-[30rem]' : 'relative w-[26rem]'}>
        {showX && (
          <button
            type="button"
            aria-label={m.hud_close()}
            className="absolute top-4 right-4 z-30 cursor-pointer px-2 py-0.5 text-lg leading-none text-ink/60 hover:bg-dirt hover:text-house"
            onClick={
              changelog || config
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
          {mode === 'boot' && version}
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
          ) : config && mode === 'play' ? (
            <SettingsPage
              value={props.settings}
              onSave={next => {
                props.onSettings(next)
                setPage({ kind: 'home' })
              }}
              onBack={() => setPage({ kind: 'home' })}
            />
          ) : (
            <>
              {mode === 'play' ? (
                <>
                  <Btn className="w-full" onClick={props.onClose}>
                    {m.menu_back_to_game()}
                  </Btn>
                  <div className="grid grid-cols-2 gap-2">
                    <Btn disabled={guest} onClick={props.onSave}>
                      {m.menu_quick_save()}
                    </Btn>
                    <Btn disabled={guest} onClick={props.onDownload}>
                      {m.menu_download_save()}
                    </Btn>
                  </div>
                  <hr className="my-1 border-ink/15" />
                  <div className="grid grid-cols-2 gap-2">
                    <Btn disabled={!slotExists() || mpLocked} onClick={onLoad}>
                      {loadLabel}
                    </Btn>
                    <Btn disabled={mpLocked} onClick={pick}>
                      {m.menu_upload_save()}
                    </Btn>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Btn onClick={() => setPage({ kind: 'settings' })}>{m.menu_settings()}</Btn>
                    <Btn onClick={props.onMainMenu}>{m.menu_main_menu()}</Btn>
                  </div>
                </>
              ) : (
                <>
                  <Btn className="w-full" onClick={props.onNew}>
                    {m.menu_new_game()}
                  </Btn>
                  <Btn className="w-full" disabled={!slotExists()} onClick={onLoad}>
                    {loadLabel}
                  </Btn>
                  <Btn className="w-full" onClick={pick}>
                    {m.menu_upload_save()}
                  </Btn>
                  <Btn className="w-full" onClick={props.onJoinOpen}>
                    {m.menu_join_multiplayer()}
                  </Btn>
                </>
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
          {mode === 'play' && version}
          <input
            ref={input}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={e => {
              const list = e.target.files
              e.target.value = ''
              if (list?.length === 0) return
              void list[0].text().then(onUpload)
            }}
          />
        </div>
      </Chrome>
    </div>
  )
}
