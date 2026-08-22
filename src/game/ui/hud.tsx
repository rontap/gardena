import { useState } from 'react'
import * as Progress from '@radix-ui/react-progress'
import { RESEARCH } from '../defs/research.ts'
import { DAY_SECONDS, PHASE_NAME } from '../sim/clock.ts'
import type { World } from '../sim/world.ts'
import type { Lens } from '../view/map.tsx'
import {
  btnFace,
  UI_BTN_ALMANAC,
  UI_BTN_CANCEL,
  UI_BTN_CHEAT,
  UI_BTN_DELETE,
  UI_BTN_LENS,
  UI_BTN_FAMILY,
  UI_BTN_MARKET,
  UI_BTN_RESEARCH,
  UI_BTN_ROTATE,
  UI_BTN_SHOP,
  UI_PHASE,
  type BtnState,
} from '../view/svgs.ts'
import { Chrome, Coin } from './frame.tsx'

const ROTATABLE = ['buy-sprinkler-vert'] as const

const PLACE_TOOLS = [
  'buy-pumpjack',
  'buy-well',
  'buy-rain-tank',
  'buy-tap',
  'buy-pipe',
  'buy-valve',
  'buy-sprinkler',
  'buy-sprinkler-vert',
  'buy-sprinkler-large',
  'buy-chest',
  'buy-grinder',
  'buy-compost-box',
  'buy-tile-cobble',
  'buy-tile-brick',
  'buy-tile-paved',
  'buy-fence',
] as const

export function Hud({
  world,
  panel,
  lens,
  onFamily,
  onShop,
  onResearch,
  onMarket,
  onAlmanac,
  onLens,
  onCheat,
}: {
  world: World
  panel: 'none' | 'family' | 'shop' | 'research' | 'market' | 'inventory' | 'almanac' | 'chest' | 'lens' | 'cheat'
  lens: Lens
  onFamily: () => void
  onShop: () => void
  onResearch: () => void
  onMarket: () => void
  onAlmanac: () => void
  onLens: () => void
  onCheat: () => void
}) {
  const job = world.job
  const def = job.kind === 'run' ? RESEARCH[job.id] : undefined
  const pct = def !== undefined && job.kind === 'run' ? ((def.seconds - job.left) / def.seconds) * 100 : 0
  const phase = world.clock.phase()
  const dayPct = (world.clock.t / DAY_SECONDS) * 100
  const trio =
    world.place.kind === 'delete' ||
    (world.place.kind === 'sku' && (PLACE_TOOLS as readonly string[]).includes(world.place.id))
  const canRotate = world.place.kind === 'sku' && (ROTATABLE as readonly string[]).includes(world.place.id)
  return (
    <>
      <Chrome className="pointer-events-none absolute top-4 left-4 right-4 z-20 h-14">
        <div className="relative z-20 flex h-full items-center gap-5 px-4">
          <div className="font-display shrink-0 text-base leading-none text-ink">Gardena</div>
          <div className="h-7 w-px shrink-0 bg-ink/20" />
          <span data-hud-money className="inline-flex shrink-0 items-center text-lg leading-none font-semibold">
            <Coin n={world.money} />
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <svg
              data-phase
              viewBox="0 0 16 16"
              className="h-5 w-5 shrink-0"
              dangerouslySetInnerHTML={{ __html: UI_PHASE[phase] }}
            />
            <div className="flex flex-col gap-1">
              <span data-clock data-clock-t={Math.floor(world.clock.t)} className="text-sm leading-none font-semibold">
                Day {world.clock.day} · {PHASE_NAME[phase]}
              </span>
              <Progress.Root className="relative h-1 w-28 overflow-hidden bg-ink/20" value={dayPct}>
                <Progress.Indicator data-day-bar className="h-full bg-ripe" style={{ width: `${dayPct}%` }} />
              </Progress.Root>
            </div>
          </div>
          <div className="h-7 w-px shrink-0 bg-ink/20" />
          <div data-research className="flex min-w-0 flex-1 flex-col justify-center gap-1" hidden={job.kind !== 'run'}>
            {def !== undefined && job.kind === 'run' && (
              <>
                <span className="truncate text-sm leading-none">
                  <span className="text-ink/50">Researching </span>
                  <span data-research-left>{def.name}</span>
                  <span className="text-ink/50"> · </span>
                  <span data-research-secs className="text-ink/50 tabular-nums">
                    {Math.ceil(job.left)}s
                  </span>
                </span>
                <Progress.Root className="relative h-1.5 max-w-96 overflow-hidden bg-ink/20" value={pct}>
                  <Progress.Indicator data-research-bar className="h-full bg-leaf" style={{ width: `${pct}%` }} />
                </Progress.Root>
              </>
            )}
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2 text-sm text-ink/45">
            <span>digs {world.digs}</span>
            <span>·</span>
            <span>mines {world.mines}</span>
          </div>
        </div>
      </Chrome>
      <Chrome className="pointer-events-none absolute top-20 left-4 z-20 w-24">
        <div className="relative z-20 flex flex-col py-1.5">
          <FaceBtn art={UI_BTN_SHOP} label="Shop" selected={panel === 'shop'} onClick={onShop} />
          <FaceBtn art={UI_BTN_RESEARCH} label="Research" selected={panel === 'research'} onClick={onResearch} />
          <FaceBtn art={UI_BTN_MARKET} label="Market" selected={panel === 'market'} onClick={onMarket} />
          <FaceBtn
            art={UI_BTN_LENS}
            label="Lens"
            note={lens === 'off' ? undefined : lens}
            selected={panel === 'lens'}
            onClick={onLens}
          />
          <FaceBtn art={UI_BTN_FAMILY} label="Family" selected={panel === 'family'} onClick={onFamily} />
          <FaceBtn art={UI_BTN_ALMANAC} label="Almanac" selected={panel === 'almanac'} onClick={onAlmanac} />
          <FaceBtn art={UI_BTN_CHEAT} label="Cheat" selected={panel === 'cheat'} onClick={onCheat} />
          {trio && (
            <>
              <div className="mx-3 my-1.5 border-t border-ink/20" />
              <FaceBtn
                art={UI_BTN_DELETE}
                label="Delete"
                selected={world.place.kind === 'delete'}
                onClick={() => world.armDelete()}
              />
              {canRotate && <FaceBtn art={UI_BTN_ROTATE} label="Rotate" onClick={() => world.rotatePlace()} />}
              <FaceBtn art={UI_BTN_CANCEL} label="Cancel" onClick={() => world.cancelPlace()} />
            </>
          )}
        </div>
      </Chrome>
    </>
  )
}

function FaceBtn({
  art,
  label,
  note,
  selected,
  disabled,
  onClick,
}: {
  art: string
  label: string
  note?: string
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
      className={`pointer-events-auto flex w-full flex-col items-center gap-0.5 px-1 py-1 ${off ? 'cursor-default' : 'cursor-pointer'} ${hot && !off ? 'bg-ink/5' : ''}`}
      onClick={onClick}
      onPointerEnter={() => setHot(true)}
      onPointerLeave={() => setHot(false)}
    >
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none h-11 w-11 shrink-0"
        dangerouslySetInnerHTML={{ __html: btnFace(art, state) }}
      />
      <span className="text-center text-sm leading-none font-semibold">{label}</span>
      {note !== undefined && <span className="text-center text-xs leading-none text-ink/50 capitalize">{note}</span>}
    </button>
  )
}
