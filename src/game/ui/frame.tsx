import { forwardRef, type ReactNode } from 'react'
import {
  UI_COIN,
  UI_COIN_SILVER,
  UI_CORNER_BL,
  UI_CORNER_BR,
  UI_CORNER_TL,
  UI_CORNER_TR,
  UI_HEADER,
  UI_RAIL,
} from '../view/svgs.ts'

export function moneyParts(n: number): { gold: number; silver: number } {
  const tenths = Math.floor(n * 10)
  return { gold: Math.floor(tenths / 10), silver: tenths % 10 }
}

function Glyph({ html }: { html: string }) {
  return <svg viewBox="0 0 12 12" className="inline-block h-3 w-3 shrink-0" dangerouslySetInnerHTML={{ __html: html }} />
}

export function Coin({ n }: { n: number }) {
  const { gold, silver } = moneyParts(n)
  if (gold === 0) {
    return (
      <span className="inline-flex items-center gap-0.5">
        <Glyph html={UI_COIN_SILVER} />
        <span>{silver}</span>
      </span>
    )
  }
  if (silver === 0) {
    return (
      <span className="inline-flex items-center gap-0.5">
        <Glyph html={UI_COIN} />
        <span>{gold}</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5">
      <Glyph html={UI_COIN} />
      <span>{gold}</span>
      <Glyph html={UI_COIN_SILVER} />
      <span>{silver}</span>
    </span>
  )
}

export function Chrome({ children, className }: { children: ReactNode; className: string }) {
  return (
    <div className={`bg-house text-ink ${className}`}>
      <Decor />
      {children}
    </div>
  )
}

function Decor() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-3"
        style={{
          backgroundImage: `url(${UI_HEADER})`,
          backgroundRepeat: 'repeat-x',
          backgroundSize: '16px 12px',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-1.5"
        style={{
          backgroundImage: `url(${UI_RAIL})`,
          backgroundRepeat: 'repeat-x',
          backgroundSize: '16px 6px',
        }}
      />
      <div className="absolute bottom-0 left-0 top-0 w-1.5 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-1.5 w-[2000px] origin-top-left rotate-90"
          style={{
            backgroundImage: `url(${UI_RAIL})`,
            backgroundRepeat: 'repeat-x',
            backgroundSize: '16px 6px',
          }}
        />
      </div>
      <div className="absolute bottom-0 right-0 top-0 w-1.5 overflow-hidden">
        <div
          className="absolute right-0 top-0 h-1.5 w-[2000px] origin-top-right -rotate-90"
          style={{
            backgroundImage: `url(${UI_RAIL})`,
            backgroundRepeat: 'repeat-x',
            backgroundSize: '16px 6px',
          }}
        />
      </div>
      <img src={UI_CORNER_TL} alt="" className="absolute left-0 top-0 size-2" />
      <img src={UI_CORNER_TR} alt="" className="absolute right-0 top-0 size-2" />
      <img src={UI_CORNER_BR} alt="" className="absolute bottom-0 right-0 size-2" />
      <img src={UI_CORNER_BL} alt="" className="absolute bottom-0 left-0 size-2" />
    </div>
  )
}

export const Btn = forwardRef<
  HTMLButtonElement,
  {
    children: ReactNode
    onClick?: () => void
    disabled?: boolean
    selected?: boolean
    className?: string
    'data-plus'?: string
    'data-minus'?: string
    'data-sell-all'?: string
  }
>(function Btn({ children, onClick, disabled, selected, className, 'data-plus': dataPlus, 'data-minus': dataMinus, 'data-sell-all': dataSellAll }, ref) {
  const off = disabled === true
  const on = selected === true
  const face = off
    ? 'cursor-default bg-house text-ink/40'
    : on
      ? 'cursor-pointer bg-ink text-house'
      : 'cursor-pointer bg-dirt text-house hover:bg-dirt-dark active:bg-dirt-dark'
  return (
    <button
      ref={ref}
      type="button"
      disabled={off}
      className={`relative px-3 py-2 pt-3 text-left ${face} ${className ?? ''}`}
      data-plus={dataPlus}
      data-minus={dataMinus}
      data-sell-all={dataSellAll}
      onClick={onClick}
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-1.5"
        style={{
          backgroundImage: `url(${UI_HEADER})`,
          backgroundRepeat: 'repeat-x',
          backgroundSize: '16px 12px',
        }}
      />
      <span className="relative">{children}</span>
    </button>
  )
})

export const tabTriggerClass =
  'cursor-pointer px-2 py-1 text-sm text-ink/50 data-[state=active]:border-b-2 data-[state=active]:border-ink data-[state=active]:text-ink'

export function Dock({
  title,
  children,
  footer,
  onClose,
  wide,
}: {
  title: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  wide?: boolean
}) {
  return (
    <Chrome
      className={`absolute top-16 left-32 z-20 flex max-h-[calc(100%-4rem)] flex-col overflow-hidden ${wide === true ? 'w-[28rem]' : 'w-72'}`}
    >
      <div className="relative z-20 flex items-center justify-between px-3 py-2">
        <div className="font-display text-[14px] leading-relaxed">{title}</div>
        <button type="button" className="cursor-pointer px-2 py-0.5 text-sm text-ink hover:bg-dirt" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="relative z-20 min-h-0 flex-1 overflow-y-auto px-3 pb-3">{children}</div>
      {footer !== undefined && <div className="relative z-20 px-3 pb-3">{footer}</div>}
    </Chrome>
  )
}

export function Frame({
  title,
  children,
  onClose,
  wide,
  className,
}: {
  title: string
  children: ReactNode
  onClose?: () => void
  wide?: boolean
  className?: string
}) {
  return (
    <Chrome className={`relative ${className ?? (wide === true ? 'w-[28rem]' : 'w-80')}`}>
      <div className="relative px-4 pb-4 pt-2">
        <div className="mb-3 flex h-7 items-center justify-between">
          <div className="font-display text-[11px] leading-relaxed text-ink">{title}</div>
          {onClose !== undefined && (
            <button type="button" className="px-1.5 text-xs text-ink hover:bg-dirt" onClick={onClose}>
              ×
            </button>
          )}
        </div>
        {children}
      </div>
    </Chrome>
  )
}
