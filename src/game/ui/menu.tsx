import { useRef } from 'react'
import type { LoadFailReason } from '../sim/save.ts'
import { slotExists, slotStamp } from '../sim/save.ts'
import { UI_MENU } from '../view/svgs.ts'
import { Btn, Chrome } from './frame.tsx'

const FAIL: { readonly [K in LoadFailReason]: string } = {
  'not-gardena': 'This file is not a Gardena save.',
  version: 'This save is a different version and could not be reconstructed.',
  unusable: 'This file could not be used.',
}

type MenuProps =
  | {
      mode: 'boot'
      fail: LoadFailReason | undefined
      onNew: () => void
      onLoad: () => void
      onUpload: (text: string) => void
    }
  | {
      mode: 'play'
      fail: LoadFailReason | undefined
      onNew: () => void
      onLoad: () => void
      onUpload: (text: string) => void
      onSave: () => void
      onDownload: () => void
      onClose: () => void
    }

export function Menu(props: MenuProps) {
  const { mode, fail, onNew, onLoad, onUpload } = props
  const input = useRef<HTMLInputElement>(null)
  const stamp = slotStamp()
  const loadLabel = stamp === undefined ? 'Load Save' : `Load Save (${stamp})`
  const shell =
    mode === 'boot'
      ? 'absolute inset-0 z-20 flex items-center justify-center'
      : 'absolute inset-0 z-20 flex items-center justify-center bg-ink/50'
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
      <Chrome className="relative w-[26rem]">
        {mode === 'play' && (
          <button
            type="button"
            aria-label="Close"
            className="absolute top-4 right-4 z-30 cursor-pointer px-2 py-0.5 text-lg leading-none text-ink/60 hover:bg-dirt hover:text-house"
            onClick={props.onClose}
          >
            ×
          </button>
        )}
        <div className="relative z-20 flex flex-col gap-2 px-4 pt-4 pb-3">
          <svg viewBox="0 0 240 64" className="w-full" dangerouslySetInnerHTML={{ __html: UI_MENU }} />
          <h1 className="text-center font-display text-base leading-none">Gardena</h1>
          <p className="text-center text-sm text-ink/45">1.0.0</p>
          <Btn className="w-full" onClick={onNew}>
            New Game
          </Btn>
          <Btn className="w-full" disabled={!slotExists()} onClick={onLoad}>
            {loadLabel}
          </Btn>
          <Btn
            className="w-full"
            onClick={() => {
              const el = input.current
              if (el === null) return
              el.click()
            }}
          >
            Upload Save
          </Btn>
          {mode === 'play' && (
            <Btn className="w-full" onClick={props.onSave}>
              Save game
            </Btn>
          )}
          {mode === 'play' && (
            <Btn className="w-full" onClick={props.onDownload}>
              Download Save
            </Btn>
          )}
          {fail !== undefined && <div className="text-sm text-roof">{FAIL[fail]}</div>}
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
