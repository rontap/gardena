import { memo, useState } from 'react'
import * as Progress from '@radix-ui/react-progress'
import { RESEARCH } from '../defs/research.ts'
import { PHASE_NAME } from '../sim/clock.ts'
import type { World } from '../sim/world.ts'
import type { Lens } from '../view/map.tsx'
import { bindHud } from '../view/motion.ts'
import {
  btnFace,
  EXPAND_LAND,
  SKILL_POINT,
  symHref,
  UI_BTN_ALMANAC,
  UI_BTN_BUILD,
  UI_BTN_CANCEL,
  UI_BTN_CHEAT,
  UI_BTN_DELETE,
  UI_BTN_LENS,
  UI_BTN_FAMILY,
  UI_BTN_GEAR,
  UI_BTN_MARKET,
  UI_BTN_MULTIPLAYER,
  UI_BTN_PAUSE,
  UI_BTN_PLAY,
  UI_BTN_RESEARCH,
  UI_BTN_ROTATE,
  UI_BTN_SHOP,
  type BtnState,
} from '../view/svgs.ts'
import { GHOST_SKUS } from '../defs/shelf.ts'
import { CalloutHover } from './callout-hover.tsx'
import { Chrome, Coin } from './frame.tsx'
import type { PanelKind } from './panel.ts'

const ROTATABLE = ['buy-sprinkler-vert'] as const

export function Hud({
  world,
  panel,
  lens,
  paused,
  onFamily,
  onShop,
  onBuild,
  onResearch,
  onMarket,
  onAlmanac,
  onLens,
  onCheat,
  onGear,
  onPause,
  onMultiplayer,
  net,
}: {
  world: World
  panel: PanelKind
  lens: Lens
  paused: boolean
  onFamily: () => void
  onShop: () => void
  onBuild: () => void
  onResearch: () => void
  onMarket: () => void
  onAlmanac: () => void
  onLens: () => void
  onCheat: () => void
  onGear: () => void
  onPause: () => void
  onMultiplayer: () => void
  net: string | undefined
}) {
  const job = world.job
  const def = job.kind === 'run' ? RESEARCH[job.id] : undefined
  const pct = def !== undefined && job.kind === 'run' ? ((def.seconds - job.left) / def.seconds) * 100 : 0
  const phase = world.clock.phase()
  const place = world.seats[world.local].place
  const trio =
    place.kind === 'delete' || (place.kind === 'sku' && (GHOST_SKUS as readonly string[]).includes(place.id))
  const canRotate = place.kind === 'sku' && (ROTATABLE as readonly string[]).includes(place.id)
  const guest = world.local !== 0
  const expandLeft = world.expandLeft()
  const points = world.points
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
              ref={el => bindHud('phase', el)}
              data-phase
              viewBox="0 0 16 16"
              className="h-5 w-5 shrink-0"
            >
              <use />
            </svg>
            <div className="flex flex-col gap-1">
              <span
                ref={el => bindHud('clock', el)}
                data-clock
                data-clock-t={Math.floor(world.clock.t)}
                className="text-sm leading-none font-semibold"
              >
                Day {world.clock.day} · {PHASE_NAME[phase]}
              </span>
              <div className="relative h-1 w-28 overflow-hidden bg-ink/20">
                <div ref={el => bindHud('day-bar', el)} data-day-bar className="h-full bg-ripe" style={{ width: '0%' }} />
              </div>
            </div>
          </div>
          <div className="h-7 w-px shrink-0 bg-ink/20" />
          <div
            ref={el => bindHud('research', el)}
            data-research
            className="flex min-w-0 flex-1 flex-col justify-center gap-1"
            hidden={job.kind !== 'run'}
          >
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
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {net !== undefined && (
              <span className="flex items-center gap-1.5 border border-ink/20 bg-parch px-2 py-1 text-sm text-ink/70">
                <span aria-hidden className="size-2 shrink-0 animate-pulse bg-ripe" />
                {net}
              </span>
            )}
            {(expandLeft > 0 || points > 0) && (
              <>
                {expandLeft > 0 && (
                  <ConsumableChip
                    art={EXPAND_LAND}
                    n={expandLeft}
                    title="Expansion"
                    body={`You have ${expandLeft} farm expansion opportunities.`}
                  />
                )}
                {points > 0 && (
                  <ConsumableChip
                    art={SKILL_POINT}
                    n={points}
                    title="Skill points"
                    body={`You have ${points} unspent skill points. Assign them to a family member!`}
                  />
                )}
              </>
            )}
            <IconButton art={UI_BTN_MULTIPLAYER} label="Multiplayer" selected={panel === 'multiplayer'} onClick={onMultiplayer} />
            <PauseBtn selected={paused} onClick={onPause} />
            <GearBtn selected={panel === 'menu'} onClick={onGear} />
          </div>
        </div>
      </Chrome>
      <Chrome className="pointer-events-none absolute top-20 left-4 z-20 w-24">
        <div className="relative z-20 flex flex-col py-1.5">
          <FaceBtn art={UI_BTN_SHOP} label="Shop" selected={panel === 'shop'} onClick={onShop} />
          <FaceBtn art={UI_BTN_BUILD} label="Build" selected={panel === 'build'} onClick={onBuild} />
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
          {!guest && <FaceBtn art={UI_BTN_CHEAT} label="Cheat" selected={panel === 'cheat'} onClick={onCheat} />}
          {trio && (
            <>
              <div className="mx-3 my-1.5 border-t border-ink/20" />
              <FaceBtn
                art={UI_BTN_DELETE}
                label="Delete"
                selected={place.kind === 'delete'}
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

function GearBtn({ selected, onClick }: { selected: boolean; onClick: () => void }) {
  return (
    <IconButton art={UI_BTN_GEAR} label="Gear" selected={selected} onClick={onClick} />
  )
}

function PauseBtn({ selected, onClick }: { selected: boolean; onClick: () => void }) {
  return (
    <IconButton
      art={selected ? UI_BTN_PLAY : UI_BTN_PAUSE}
      label={selected ? 'Resume' : 'Pause'}
      selected={selected}
      onClick={onClick}
    />
  )
}

const BtnFace = memo(function BtnFace({ art, state }: { art: string; state: BtnState }) {
  return (
    <svg viewBox="0 0 24 24" className="pointer-events-none h-11 w-11 shrink-0">
      <use href={symHref(btnFace(art, state))} />
    </svg>
  )
})

const IconButton = memo(function IconButton({
  art,
  label,
  selected,
  onClick,
}: {
  art: string
  label: string
  selected: boolean
  onClick: () => void
}) {
  const [hot, setHot] = useState(false)
  const state: BtnState = selected ? 'selected' : hot ? 'hover' : 'idle'
  return (
    <button
      type="button"
      aria-label={label}
      className={`pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center ${hot ? 'bg-ink/5' : ''} cursor-pointer`}
      onClick={onClick}
      onPointerEnter={() => setHot(true)}
      onPointerLeave={() => setHot(false)}
    >
      <BtnFace art={art} state={state} />
    </button>
  )
})

function ConsumableChip({
  art,
  n,
  title,
  body,
}: {
  art: string
  n: number
  title: string
  body: string
}) {
  const [hot, setHot] = useState(false)
  return (
    <div
      className="relative pointer-events-auto flex items-center gap-1"
      onPointerEnter={() => setHot(true)}
      onPointerLeave={() => setHot(false)}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" dangerouslySetInnerHTML={{ __html: art }} />
      <span className="text-sm font-semibold tabular-nums">{n}</span>
      {hot && <CalloutHover placement="below" title={title} description={body} />}
    </div>
  )
}

const FaceBtn = memo(function FaceBtn({
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
      <BtnFace art={art} state={state} />
      <span className="text-center text-sm leading-none font-semibold">{label}</span>
      {note !== undefined && <span className="text-center text-xs leading-none text-ink/50 capitalize">{note}</span>}
    </button>
  )
})
