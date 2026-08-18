import { useEffect, useRef, useState } from 'react'
import * as Progress from '@radix-ui/react-progress'
import { RESEARCH } from '../defs/research.ts'
import type { World } from '../sim/world.ts'
import type { Lens } from '../view/map.tsx'
import { Btn, Chrome } from './frame.tsx'

const LENS_ROWS: { id: Lens; label: string; swatches: { face: string; name: string }[] }[] = [
  { id: 'off', label: 'None', swatches: [] },
  {
    id: 'water',
    label: 'Water need',
    swatches: [
      { face: 'bg-lens-bad', name: 'dry' },
      { face: 'bg-lens-good', name: 'wet' },
      { face: 'bg-lens-done', name: 'full' },
    ],
  },
  {
    id: 'ripe',
    label: 'Ripeness',
    swatches: [
      { face: 'bg-lens-bad', name: 'early' },
      { face: 'bg-lens-good', name: 'ready' },
      { face: 'bg-lens-done', name: 'ripe' },
    ],
  },
  {
    id: 'kind',
    label: 'Object type',
    swatches: [
      { face: 'bg-leaf', name: 'plant' },
      { face: 'bg-water', name: 'machine' },
      { face: 'bg-ink', name: 'obstruction' },
      { face: 'bg-roof', name: 'building' },
    ],
  },
]

export function Hud({
  world,
  panel,
  lens,
  onShop,
  onResearch,
  onMarket,
  onAlmanac,
  onLens,
}: {
  world: World
  panel: 'none' | 'shop' | 'research' | 'market' | 'inventory' | 'almanac' | 'chest'
  lens: Lens
  onShop: () => void
  onResearch: () => void
  onMarket: () => void
  onAlmanac: () => void
  onLens: (lens: Lens) => void
}) {
  const job = world.job
  const def = job.kind === 'run' ? RESEARCH[job.id] : undefined
  const pct = def !== undefined && job.kind === 'run' ? ((def.seconds - job.left) / def.seconds) * 100 : 0
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onPtr = (e: PointerEvent) => {
      if (box.current !== null && !box.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', onPtr)
    return () => window.removeEventListener('pointerdown', onPtr)
  }, [open])
  const labels: { [K in Lens]: string } = {
    off: 'Lens',
    water: 'Lens · Water need',
    ripe: 'Lens · Ripeness',
    kind: 'Lens · Object type',
  }
  return (
    <Chrome className="relative flex items-stretch gap-4 px-3 py-2">
      <div className="flex flex-col justify-center gap-0.5">
        <span className="text-lg leading-none">${Math.floor(world.money)}</span>
        <span data-clock className="text-xs">
          day {world.clock.day} · {Math.floor(world.clock.remaining)}s
        </span>
      </div>
      <div data-research className="flex min-w-0 flex-1 flex-col justify-center gap-1" hidden={job.kind !== 'run'}>
        {def !== undefined && (
          <>
            <span data-research-left className="truncate text-xs">
              {def.name} {Math.floor(job.left)}s
            </span>
            <Progress.Root className="relative h-2 overflow-hidden bg-dirt-dark" value={pct}>
              <Progress.Indicator data-research-bar className="h-full bg-leaf" style={{ width: `${pct}%` }} />
            </Progress.Root>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Btn selected={panel === 'shop'} onClick={onShop}>
          Shop
        </Btn>
        <Btn selected={panel === 'research'} onClick={onResearch}>
          Research
        </Btn>
        <Btn selected={panel === 'market'} onClick={onMarket}>
          Market
        </Btn>
        <Btn selected={panel === 'almanac'} onClick={onAlmanac}>
          Almanac
        </Btn>
        <div ref={box} className="relative">
          <Btn selected={open} onClick={() => setOpen(v => !v)}>
            {labels[lens]}
          </Btn>
          {open && (
            <div className="absolute right-0 top-full z-30 mt-1 flex w-56 flex-col gap-1 bg-house p-1">
              {LENS_ROWS.map(row => (
                <Btn
                  key={row.id}
                  className="w-full"
                  selected={lens === row.id}
                  onClick={() => {
                    onLens(row.id)
                    setOpen(false)
                  }}
                >
                  <span className="flex flex-col gap-1">
                    <span>{row.label}</span>
                    {row.swatches.length > 0 && (
                      <span className="flex flex-wrap gap-2 text-[10px] leading-none">
                        {row.swatches.map(s => (
                          <span key={s.name} className="flex items-center gap-1">
                            <span className={`inline-block size-3 ${s.face}`} />
                            {s.name}
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                </Btn>
              ))}
            </div>
          )}
        </div>
      </div>
    </Chrome>
  )
}
