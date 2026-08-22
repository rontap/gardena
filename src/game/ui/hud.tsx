import { useEffect, useRef, useState } from 'react'
import * as Progress from '@radix-ui/react-progress'
import { RESEARCH } from '../defs/research.ts'
import type { World } from '../sim/world.ts'
import type { Lens } from '../view/map.tsx'
import {
  btnFace,
  UI_BTN_ALMANAC,
  UI_BTN_CANCEL,
  UI_BTN_DELETE,
  UI_BTN_LENS,
  UI_BTN_MARKET,
  UI_BTN_RESEARCH,
  UI_BTN_ROTATE,
  UI_BTN_SHOP,
  UI_PHASE,
  type BtnState,
} from '../view/svgs.ts'
import { Btn, Chrome, Coin } from './frame.tsx'

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
  {
    id: 'rarity',
    label: 'Rarity',
    swatches: [
      { face: 'bg-house', name: 'common' },
      { face: 'bg-leaf', name: 'uncommon' },
      { face: 'bg-water', name: 'rare' },
      { face: 'bg-ripe', name: 'specialty' },
    ],
  },
  { id: 'pipes', label: 'Pipes', swatches: [] },
]

const BUILD_IDS = [
  'buy-pumpjack',
  'buy-well',
  'buy-pipe',
  'buy-sprinkler',
  'buy-sprinkler-vert',
  'buy-sprinkler-large',
  'buy-chest',
  'buy-grinder',
] as const

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
  const menu = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onPtr = (e: PointerEvent) => {
      const t = e.target as Node
      if (box.current !== null && box.current.contains(t)) return
      if (menu.current !== null && menu.current.contains(t)) return
      setOpen(false)
    }
    window.addEventListener('pointerdown', onPtr)
    return () => window.removeEventListener('pointerdown', onPtr)
  }, [open])
  const labels: { [K in Lens]: string } = {
    off: 'Lens',
    water: 'Lens · Water need',
    ripe: 'Lens · Ripeness',
    kind: 'Lens · Object type',
    rarity: 'Lens · Rarity',
    pipes: 'Lens · Pipes',
  }
  const trio =
    world.place.kind === 'delete' ||
    (world.place.kind === 'sku' && (BUILD_IDS as readonly string[]).includes(world.place.id))
  const phase = world.clock.phase()
  return (
    <>
      <Chrome className="pointer-events-none absolute top-4 left-4 right-4 z-20 h-10">
        <div className="relative z-20 flex h-full items-center gap-4 px-3">
          <span data-hud-money className="inline-flex items-center text-lg leading-none">
            <Coin n={world.money} />
          </span>
          <span data-clock data-clock-t={Math.floor(world.clock.t)} className="text-xs">
            day {world.clock.day}
          </span>
          <svg
            data-phase
            viewBox="0 0 16 16"
            className="h-4 w-4 shrink-0"
            dangerouslySetInnerHTML={{ __html: UI_PHASE[phase] }}
          />
          <div data-research className="flex min-w-0 flex-1 flex-col justify-center gap-1" hidden={job.kind !== 'run'}>
            {def !== undefined && job.kind === 'run' && (
              <>
                <span data-research-left className="truncate text-xs">
                  {def.name}
                </span>
                <Progress.Root className="relative h-2 overflow-hidden bg-dirt-dark" value={pct}>
                  <Progress.Indicator data-research-bar className="h-full bg-leaf" style={{ width: `${pct}%` }} />
                </Progress.Root>
              </>
            )}
          </div>
        </div>
      </Chrome>
      <Chrome className="pointer-events-none absolute top-16 left-4 z-20 w-24">
        <div className="relative z-20 flex flex-col py-1">
          <FaceBtn art={UI_BTN_SHOP} label="Shop" selected={panel === 'shop'} onClick={onShop} />
          <FaceBtn art={UI_BTN_RESEARCH} label="Research" selected={panel === 'research'} onClick={onResearch} />
          <FaceBtn art={UI_BTN_MARKET} label="Market" selected={panel === 'market'} onClick={onMarket} />
          <div ref={box} className="relative">
            <FaceBtn art={UI_BTN_LENS} label={labels[lens]} selected={open} onClick={() => setOpen(v => !v)} />
          </div>
          <FaceBtn art={UI_BTN_ALMANAC} label="Almanac" selected={panel === 'almanac'} onClick={onAlmanac} />
          {trio && (
            <>
              <div className="mx-2 my-1 border-t border-ink/20" />
              <FaceBtn
                art={UI_BTN_DELETE}
                label="Delete"
                selected={world.place.kind === 'delete'}
                onClick={() => world.armDelete()}
              />
              <FaceBtn art={UI_BTN_ROTATE} label="Rotate" onClick={() => world.rotatePlace()} />
              <FaceBtn art={UI_BTN_CANCEL} label="Cancel" onClick={() => world.cancelPlace()} />
            </>
          )}
        </div>
      </Chrome>
      {open && box.current !== null && (
        <div
          ref={menu}
          className="pointer-events-auto fixed z-30 flex w-56 flex-col gap-1 bg-house p-1"
          style={{
            left: box.current.getBoundingClientRect().right,
            top: box.current.getBoundingClientRect().top,
          }}
        >
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
                  <span className="flex flex-wrap gap-2 text-[14px] leading-none">
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
    </>
  )
}

function FaceBtn({
  art,
  label,
  selected,
  disabled,
  onClick,
}: {
  art: string
  label: string
  selected?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  const [hot, setHot] = useState(false)
  const off = disabled === true
  const state: BtnState = off ? 'disabled' : selected === true ? 'selected' : hot ? 'hover' : 'idle'
  return (
    <button
      type="button"
      disabled={off}
      className={`pointer-events-auto flex w-full flex-col items-center gap-0.5 px-1 py-1 ${off ? 'cursor-default' : 'cursor-pointer'}`}
      onClick={onClick}
      onPointerEnter={() => setHot(true)}
      onPointerLeave={() => setHot(false)}
    >
      <svg viewBox="0 0 24 24" className="h-12 w-12 shrink-0" dangerouslySetInnerHTML={{ __html: btnFace(art, state) }} />
      <span className="text-center text-xs leading-none">{label}</span>
    </button>
  )
}
