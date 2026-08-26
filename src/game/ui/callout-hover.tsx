import type { ReactNode } from 'react'
import { Chrome } from './frame.tsx'

export function CalloutHover({
  title,
  description,
  placement = 'right',
}: {
  title: string
  description: ReactNode
  placement?: 'right' | 'below'
}) {
  return (
    <div
      className={
        placement === 'below'
          ? 'pointer-events-none absolute top-full right-0 z-30 mt-2'
          : 'pointer-events-none absolute top-0 left-full z-30 ml-2'
      }
    >
      <Chrome className="relative w-64 px-4 pt-4 pb-3">
        <div className="relative z-20 flex flex-col gap-2 text-ink">
          <div className="font-display text-xs leading-none">{title}</div>
          <div className="text-sm leading-snug whitespace-pre-line text-ink/75">{description}</div>
        </div>
      </Chrome>
    </div>
  )
}
