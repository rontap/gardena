import { Component, type ErrorInfo, type ReactNode } from 'react'
import { m } from '../../paraglide/messages.js'
import { DOWNLOAD_NAME, readSlot } from '../sim/feature-save/save.ts'

function downloadSlot(save: string): void {
  const blob = new Blob([save], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = DOWNLOAD_NAME
  a.click()
  URL.revokeObjectURL(url)
}

function Btn({ onClick, children }: { onClick: (() => void) | undefined; children: ReactNode }) {
  const face = onClick === undefined ? 'bg-dirt-dark/50 text-white/45' : 'cursor-pointer bg-dirt text-white hover:bg-dirt-dark'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={onClick === undefined}
      className={`px-5 py-3 text-base font-semibold ${face}`}
    >
      {children}
    </button>
  )
}

function Oops() {
  const save = readSlot()
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-grass px-6 text-center text-white">
      <h1 className="font-display text-4xl">{m.menu_error_title()}</h1>
      <p className="max-w-2xl text-xl">{m.menu_error_body()}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Btn onClick={save === undefined ? undefined : () => downloadSlot(save)}>{m.menu_error_download()}</Btn>
        <Btn onClick={() => window.location.reload()}>{m.menu_error_exit()}</Btn>
      </div>
      {save === undefined && <p className="text-base text-white/75">{m.menu_error_no_save()}</p>}
    </div>
  )
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack)
  }

  render(): ReactNode {
    return this.state.failed ? <Oops /> : this.props.children
  }
}
