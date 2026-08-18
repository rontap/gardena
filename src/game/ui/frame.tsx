import { forwardRef, type ReactNode } from 'react'
import {
  UI_CORNER_BL,
  UI_CORNER_BR,
  UI_CORNER_TL,
  UI_CORNER_TR,
  UI_HEADER,
  UI_RAIL,
} from '../view/svgs.ts'

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
  }
>(function Btn({ children, onClick, disabled, selected, className }, ref) {
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
  side,
  title,
  children,
  onClose,
}: {
  side: 'left' | 'right'
  title: string
  children: ReactNode
  onClose: () => void
}) {
  const pos = side === 'left' ? 'left-3' : 'right-3'
  return (
    <Chrome className={`absolute top-3 ${pos} z-20 flex max-h-[calc(100%-13rem)] w-72 flex-col overflow-hidden`}>
      <div className="relative z-20 flex items-center justify-between px-3 py-2">
        <div className="text-sm">{title}</div>
        <button type="button" className="cursor-pointer px-2 py-0.5 text-sm text-ink hover:bg-dirt" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="relative z-20 min-h-0 overflow-y-auto px-3 pb-3">{children}</div>
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
          <div className="font-medium text-ink">{title}</div>
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
