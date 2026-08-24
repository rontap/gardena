import { forwardRef, type MouseEvent, type ReactNode } from 'react'
import * as Progress from '@radix-ui/react-progress'
import {
  symHref,
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
  return (
    <svg viewBox="0 0 12 12" className="inline-block h-3.5 w-3.5 shrink-0">
      <use href={symHref(html)} />
    </svg>
  )
}

export function Coin({ n }: { n: number }) {
  const { gold, silver } = moneyParts(n)
  if (gold === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 tabular-nums">
        <Glyph html={UI_COIN_SILVER} />
        <span>{silver}</span>
      </span>
    )
  }
  if (silver === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 tabular-nums">
        <Glyph html={UI_COIN} />
        <span>{gold}</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 tabular-nums">
      <Glyph html={UI_COIN} />
      <span>{gold}</span>
      <Glyph html={UI_COIN_SILVER} />
      <span>{silver}</span>
    </span>
  )
}

/**
 * The one filled bar. Day clock, research, store capacity. `value` is 0..1; `color`
 * and `track` are palette classes so a caller picks meaning, not pixels.
 */
export function Bar({
  value,
  color,
  track = 'bg-ink/15',
  className = 'h-1.5',
}: {
  value: number
  color: string
  track?: string
  className?: string
}) {
  const pct = value <= 0 ? 0 : value >= 1 ? 100 : value * 100
  return (
    <Progress.Root className={`relative overflow-hidden ${track} ${className}`} value={pct}>
      <Progress.Indicator className={`h-full ${color}`} style={{ width: `${pct}%` }} />
    </Progress.Root>
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
    onClick?: (e: MouseEvent<HTMLButtonElement>) => void
    type?: 'button' | 'submit'
    disabled?: boolean
    selected?: boolean
    className?: string
    'data-plus'?: string
    'data-minus'?: string
    'data-sell-all'?: string
  }
>(function Btn(
  {
    children,
    onClick,
    type,
    disabled,
    selected,
    className,
    'data-plus': dataPlus,
    'data-minus': dataMinus,
    'data-sell-all': dataSellAll,
  },
  ref,
) {
  const off = disabled === true
  const on = selected === true
  const face = off
    ? 'cursor-default bg-house text-ink/35'
    : on
      ? 'cursor-pointer bg-ink text-house'
      : 'cursor-pointer bg-dirt text-house hover:bg-dirt-dark active:bg-dirt-dark'
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      disabled={off}
      className={`relative px-3 pt-3 pb-2 text-left text-base ${face} ${className ?? ''}`}
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
      <span className="relative block">{children}</span>
    </button>
  )
})

export const Field = forwardRef<HTMLInputElement, {
  name: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  'aria-label': string
}>(function Field({ name, value, onChange, placeholder, 'aria-label': label }, ref) {
  return (
    <input
      ref={ref}
      name={name}
      value={value}
      aria-label={label}
      placeholder={placeholder}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      className="w-full select-text border-2 border-ink/30 bg-parch px-2 py-2 font-mono text-sm tabular-nums text-ink shadow-[inset_2px_2px_0_0_rgba(28,23,16,0.12)] outline-none placeholder:text-ink/35 focus:border-ink"
      onChange={e => onChange(e.target.value)}
      onFocus={e => e.currentTarget.select()}
    />
  )
})

export const tabTriggerClass =
  'cursor-pointer whitespace-nowrap px-2 pt-1 pb-1.5 text-sm font-semibold tracking-wide text-ink/45 hover:text-ink/75 data-[state=active]:border-b-2 data-[state=active]:border-ink data-[state=active]:text-ink'

export const tabRailListClass = '-my-3 -ml-4 flex w-28 shrink-0 flex-col gap-0.5 border-r border-ink/20 py-3'

export const tabRailClass =
  'cursor-pointer whitespace-nowrap border-l-2 border-transparent py-1 pr-2 pl-4 text-left text-sm font-semibold tracking-wide text-ink/45 hover:text-ink/75 data-[state=active]:border-ink data-[state=active]:bg-ink/6 data-[state=active]:text-ink'

/**
 * Incremental search. Unlike Field it does not select on focus, and it swallows
 * Escape only while it has something to clear — an empty box lets Escape through
 * to cancel the armed ghost.
 */
export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <input
      name="search"
      value={value}
      aria-label="Search"
      placeholder={placeholder}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      autoFocus
      className="w-full select-text border-2 border-ink/30 bg-parch px-2 py-1.5 text-sm text-ink shadow-[inset_2px_2px_0_0_rgba(28,23,16,0.12)] outline-none placeholder:text-ink/35 focus:border-ink"
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => {
        if (e.key !== 'Escape') return
        if (value === '') return
        e.stopPropagation()
        onChange('')
      }}
    />
  )
}

export function Label({ children }: { children: ReactNode }) {
  return <div className="mt-1 mb-1 text-xs font-bold tracking-[0.14em] text-ink/45 uppercase">{children}</div>
}

export function Window({
  title,
  onClose,
  children,
  footer,
  aside,
  className,
}: {
  title: string
  onClose?: () => void
  children: ReactNode
  footer?: ReactNode
  aside?: ReactNode
  className: string
}) {
  return (
    <div className="relative">
      <Chrome className={`flex flex-col overflow-hidden ${className}`}>
        <div className="relative z-20 flex shrink-0 items-center justify-between gap-3 border-b border-ink/15 px-4 pt-4 pb-2">
          <div className="font-display text-sm leading-none">{title}</div>
          {onClose !== undefined && (
            <button
              type="button"
              aria-label="Close"
              className="-mr-1 cursor-pointer px-2 py-0.5 text-lg leading-none text-ink/60 hover:bg-dirt hover:text-house"
              onClick={onClose}
            >
              ×
            </button>
          )}
        </div>
        <div className="scroll-pane relative z-20 min-h-0 flex-1 overflow-y-auto px-4 py-3 flex flex-col">{children}</div>
        {footer !== undefined && (
          <div className="relative z-20 shrink-0 border-t border-ink/15 px-4 pt-2 pb-3">{footer}</div>
        )}
      </Chrome>
      {aside}
    </div>
  )
}

export function Overlay({
  title,
  onClose,
  children,
  aside,
  className,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  aside?: ReactNode
  className: string
}) {
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-ink/50"
      onPointerDown={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <Window title={title} onClose={onClose} aside={aside} className={className}>
        {children}
      </Window>
    </div>
  )
}

export function Dock({
  title,
  children,
  footer,
  onClose,
  width,
  aside,
}: {
  title: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  width: string
  aside?: ReactNode
}) {
  return (
    <div className="absolute top-20 left-32 z-20">
      <Window
        title={title}
        onClose={onClose}
        footer={footer}
        aside={aside}
        className={`max-h-[calc(100vh-6rem)] ${width}`}
      >
        {children}
      </Window>
    </div>
  )
}

export function Frame({
  title,
  children,
  onClose,
  wide,
  className,
  aside,
}: {
  title: string
  children: ReactNode
  onClose?: () => void
  wide?: boolean
  className?: string
  aside?: ReactNode
}) {
  return (
    <Window
      title={title}
      onClose={onClose}
      aside={aside}
      className={className ?? (wide === true ? 'w-[30rem]' : 'w-80')}
    >
      {children}
    </Window>
  )
}
