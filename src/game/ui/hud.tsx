import { m } from '../../paraglide/messages.js'
import { memo, useState } from 'react'
import { WEATHER_NAME } from '../defs/weather.ts'
import { PHASE_NAME } from '../sim/clock.ts'
import type { WeatherKind } from '../sim/weather.ts'
import type { World } from '../sim/world.ts'
import type { Lens } from '../view/map.tsx'
import { bindHud } from '../view/motion.ts'
import {
  btnFace,
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
  UI_WEATHER,
  type BtnState,
} from '../view/svgs.ts'
import { CalloutHover } from './callout-hover.tsx'
import { Chrome, Coin } from './frame.tsx'
import { LENS_ROWS } from './lens.tsx'
import type { PanelKind } from './panel.ts'

const ROTATABLE = ['buy-sprinkler-vert', 'buy-sorter'] as const

function lensNote(lens: Lens, lock: boolean): string | undefined {
  if (lens === 'off') return undefined
  const row = LENS_ROWS.find(r => r.id === lens)
  if (row === undefined) throw new Error('lens')
  const name = row.label()
  return lock ? m.hud_lens_locked_note({ lens: name }) : name
}

export function Hud({
  world,
  panel,
  lens,
  paused,
  onFamily,
  onBuild,
  onResearch,
  onMarket,
  onAlmanac,
  onLens,
  onLensClear,
  lensLock,
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
  onBuild: () => void
  onResearch: () => void
  onMarket: () => void
  onAlmanac: () => void
  onLens: () => void
  onLensClear: () => void
  lensLock: boolean
  onCheat: () => void
  onGear: () => void
  onPause: () => void
  onMultiplayer: () => void
  net: string | undefined
}) {
  const phase = world.clock.phase()
  const place = world.seats[world.local].place
  const armed = place.kind !== 'none'
  const building = panel === 'build' || armed
  const canRotate = place.kind === 'sku' && (ROTATABLE as readonly string[]).includes(place.id)
  const guest = world.local !== 0
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
                {m.hud_clock({ day: world.clock.day, phase: PHASE_NAME[phase]() })}
              </span>
              <div className="relative h-1 w-28 overflow-hidden bg-ink/20">
                <div ref={el => bindHud('day-bar', el)} data-day-bar className="h-full bg-ripe" style={{ width: '0%' }} />
              </div>
            </div>
          </div>
          <div className="h-7 w-px shrink-0 bg-ink/20" />
          <div className="flex shrink-0 items-center gap-2">
            <WeatherGlyph kind={world.weather(world.clock.day)} />
            {world.hasSkill('forecast') && (
              <WeatherGlyph
                kind={world.weather(world.clock.day + 1)}
                title={m.hud_tomorrow({ name: WEATHER_NAME[world.weather(world.clock.day + 1)]() })}
              />
            )}
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1.5 text-xs tabular-nums">
            <span
              ref={el => bindHud('fps', el)}
              data-fps
              title={m.hud_fps_title()}
              className="pointer-events-auto text-ink/40 transition-colors hover:text-ink/80"
            />
            <span
              ref={el => bindHud('render', el)}
              data-render
              title={m.hud_render_title()}
              className="pointer-events-auto text-ink/40 transition-colors hover:text-ink/80"
            />
            <span
              ref={el => bindHud('mem', el)}
              data-mem
              title={m.hud_mem_title()}
              className="pointer-events-auto text-ink/40 transition-colors hover:text-ink/80"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {net !== undefined && (
              <span className="flex items-center gap-1.5 border border-ink/20 bg-parch px-2 py-1 text-sm text-ink/70">
                <span aria-hidden className="size-2 shrink-0 animate-pulse bg-ripe" />
                {net}
              </span>
            )}
            <IconButton art={UI_BTN_MULTIPLAYER} label={m.hud_multiplayer()} selected={panel === 'multiplayer'} onClick={onMultiplayer} />
            <IconButton art={UI_BTN_ALMANAC} label={m.hud_almanac()} selected={panel === 'almanac'} onClick={onAlmanac} />
            {!guest && (
              <IconButton art={UI_BTN_CHEAT} label={m.hud_cheat()} selected={panel === 'cheat'} onClick={onCheat} />
            )}
            <PauseBtn selected={paused} onClick={onPause} />
            <GearBtn selected={panel === 'menu'} onClick={onGear} />
          </div>
        </div>
      </Chrome>
      <Chrome className="pointer-events-none absolute top-20 left-4 z-20 w-24">
        <div className="relative z-20 flex flex-col py-1.5">
          <FaceBtn art={UI_BTN_BUILD} label={m.hud_build()} selected={panel === 'build'} onClick={onBuild} />
          <FaceBtn art={UI_BTN_RESEARCH} label={m.names_role_research()} selected={panel === 'research'} onClick={onResearch} />
          <FaceBtn art={UI_BTN_MARKET} label={m.names_role_market()} selected={panel === 'market'} onClick={onMarket} />
          <div className="relative">
            <FaceBtn
              art={UI_BTN_LENS}
              label={m.hud_lens()}
              note={lensNote(lens, lensLock)}
              selected={panel === 'lens'}
              onClick={onLens}
            />
            {lensLock && (
              <button
                type="button"
                aria-label={m.hud_clear_lens()}
                className="pointer-events-auto absolute top-1 right-1 cursor-pointer bg-ink/10 px-1 text-xs leading-none text-ink/70 hover:bg-ink/25"
                onClick={onLensClear}
              >
                ×
              </button>
            )}
          </div>
          <FaceBtn art={UI_BTN_FAMILY} label={m.family_title()} selected={panel === 'family'} onClick={onFamily} />
          {building && (
            <>
              <div className="mx-3 my-1.5 border-t border-ink/20" />
              <FaceBtn
                art={UI_BTN_DELETE}
                label={m.hud_demolish()}
                selected={place.kind === 'delete'}
                onClick={() => world.armDelete()}
              />
              {canRotate && <FaceBtn art={UI_BTN_ROTATE} label={m.hud_rotate()} onClick={() => world.rotatePlace()} />}
              {armed && <FaceBtn art={UI_BTN_CANCEL} label={m.hud_cancel()} onClick={() => world.cancelPlace()} />}
            </>
          )}
        </div>
      </Chrome>
    </>
  )
}

function GearBtn({ selected, onClick }: { selected: boolean; onClick: () => void }) {
  return (
    <IconButton art={UI_BTN_GEAR} label={m.hud_gear()} selected={selected} onClick={onClick} />
  )
}

function PauseBtn({ selected, onClick }: { selected: boolean; onClick: () => void }) {
  return (
    <IconButton
      art={selected ? UI_BTN_PLAY : UI_BTN_PAUSE}
      label={selected ? m.hud_resume() : m.hud_pause()}
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

const WEATHER_CALLOUT: { readonly [K in WeatherKind]: () => { title: string; body: string } } = {
  clear: () => ({ title: WEATHER_NAME.clear(), body: m.hud_weather_clear_body() }),
  rain: () => ({ title: WEATHER_NAME.rain(), body: m.hud_weather_rain_body() }),
  dry: () => ({ title: WEATHER_NAME.dry(), body: m.hud_weather_dry_body() }),
  flood: () => ({ title: WEATHER_NAME.flood(), body: m.hud_weather_flood_body() }),
  drought: () => ({ title: WEATHER_NAME.drought(), body: m.hud_weather_drought_body() }),
}

function WeatherGlyph({ kind, title }: { kind: WeatherKind; title?: string }) {
  const [hot, setHot] = useState(false)
  const callout = WEATHER_CALLOUT[kind]()
  return (
    <div
      className="relative pointer-events-auto"
      onPointerEnter={() => setHot(true)}
      onPointerLeave={() => setHot(false)}
    >
      <svg viewBox="0 0 16 16" className="h-5 w-5 shrink-0" dangerouslySetInnerHTML={{ __html: UI_WEATHER[kind] }} />
      {hot && (
        <CalloutHover placement="below" title={title !== undefined ? title : callout.title} description={callout.body} />
      )}
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
