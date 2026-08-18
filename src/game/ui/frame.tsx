import type { ReactNode } from 'react'
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
    <div className={`relative bg-house text-ink ${className}`}>
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

export function Frame({
  title,
  children,
  onClose,
  wide,
}: {
  title: string
  children: ReactNode
  onClose?: () => void
  wide?: boolean
}) {
  return (
    <Chrome className={wide === true ? 'w-[28rem]' : 'w-80'}>
      <div className="relative px-4 pb-4 pt-2">
        <div className="mb-3 flex h-7 items-center justify-between">
          <div className="font-medium text-ink">{title}</div>
          {onClose !== undefined && (
            <button type="button" className="border border-ink px-1.5 text-xs text-ink" onClick={onClose}>
              ×
            </button>
          )}
        </div>
        {children}
      </div>
    </Chrome>
  )
}
