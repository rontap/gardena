import { useEffect, useRef, useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import * as Menu from '@radix-ui/react-dropdown-menu'
import { m } from '../../../paraglide/messages.js'
import type { CropId, JamCrop, RouteId, TrailerKind } from '../../sim/ids.ts'
import type { Coord } from '../../sim/building.ts'
import type { Route, RouteDeploy, RouteStop, Vehicle } from '../../sim/feature-vehicles/vehicle.ts'
import {
  ANY,
  narrowGood,
  narrowType,
  narrowVariety,
  padGoodsOf,
  padTypesOf,
  sampleItem,
  typeIcon,
  varietiesOf,
  type Pick,
  type PickGood,
  type PickType,
} from '../../sim/feature-vehicles/pick.ts'
import type { PadCell } from '../../sim/feature-vehicles/vehicle.ts'
import { CASK_NAME, SPIRIT_NAME, type Item } from '../../sim/item.ts'
import { CROP_NAME, varietyName } from '../../defs/crops.ts'
import { tierOf, type VarietyId } from '../../defs/varieties.ts'
import { faceGfx } from '../../view/svgs.ts'
import type { World } from '../../sim/world.ts'
import { ITEM_TRAILER_HARVEST, ITEM_TRAILER_SEED, ITEM_TRAILER_SPRAY, ITEM_TRACTOR, QUAD } from '../../view/svgs.ts'
import { Bar, Btn, Dock, Label, tabRailClass } from '../frame.tsx'
import { useRefresh } from '../cycle.ts'

const ROUTE_RAIL = '-my-3 -ml-4 flex w-36 shrink-0 flex-col gap-0.5 border-r border-ink/20 py-3'

const TYPE_NAME: { readonly [K in PickType]: () => string } = {
  seed: () => m.vehicles_type_seed(),
  fruit: () => m.vehicles_type_fruit(),
  produce: () => m.vehicles_type_produce(),
  alcohol: () => m.vehicles_type_alcohol(),
  compostable: () => m.vehicles_type_compostable(),
  tool: () => m.vehicles_type_tool(),
  other: () => m.vehicles_type_other(),
}

const ANY_TYPE_NAME: { readonly [K in PickType]: () => string } = {
  seed: () => m.vehicles_any_seed(),
  fruit: () => m.vehicles_any_fruit(),
  produce: () => m.vehicles_any_produce(),
  alcohol: () => m.vehicles_any_alcohol(),
  compostable: () => m.vehicles_any_compostable(),
  tool: () => m.vehicles_any_tool(),
  other: () => m.vehicles_any_other(),
}

const GOOD_NAME: { readonly [K in 'sugar' | 'oil' | 'flour' | 'extract' | 'bread' | 'wood' | 'ash' | 'weed' | 'grass' | 'dead' | 'rotten' | 'fly-agaric' | 'shovel' | 'pickaxe' | 'axe' | 'chainsaw' | 'container' | 'vanilla-extract' | 'flakes' | 'treasure' | 'fertilizer' | 'compost' | 'weed-spray']: () => string } = {
  sugar: () => m.names_item_sugar(),
  oil: () => m.names_item_oil(),
  flour: () => m.names_item_flour(),
  extract: () => m.names_item_extract(),
  bread: () => m.names_item_bread(),
  wood: () => m.names_item_wood(),
  ash: () => m.names_item_ash(),
  weed: () => m.names_item_weed(),
  grass: () => m.names_item_cut_grass(),
  dead: () => m.vehicles_good_dead(),
  rotten: () => m.vehicles_good_rotten(),
  'fly-agaric': () => m.names_item_fly_agaric(),
  shovel: () => m.vehicles_good_shovel(),
  pickaxe: () => m.vehicles_good_pickaxe(),
  axe: () => m.names_item_axe(),
  chainsaw: () => m.names_item_chainsaw(),
  container: () => m.vehicles_good_container(),
  'vanilla-extract': () => m.names_item_vanilla_extract(),
  flakes: () => m.names_item_flakes(),
  treasure: () => m.vehicles_good_treasure(),
  fertilizer: () => m.vehicles_good_fertilizer(),
  compost: () => m.vehicles_good_compost(),
  'weed-spray': () => m.names_item_weed_spray(),
}

const JAM_CROPS: readonly JamCrop[] = ['apricot', 'grape', 'raspberry', 'cherry', 'tomato']

function goodLabel(type: PickType, good: PickGood): string {
  if (type === 'seed' || type === 'fruit') return CROP_NAME[good as CropId]()
  const jam = JAM_CROPS.find(c => good === `jam-${c}`)
  if (jam !== undefined) return m.vehicles_good_jam({ crop: CROP_NAME[jam]() })
  if (good === 'wine' || good === 'cider') return CASK_NAME[good]()
  if (good === 'vodka' || good === 'beer' || good === 'brandy' || good === 'mixed') return SPIRIT_NAME[good]()
  return GOOD_NAME[good as keyof typeof GOOD_NAME]()
}


type Cell = { art: string; label: string; on: boolean; off: boolean; wide: boolean; pick: RouteDeploy }

const PAD_NAME: { readonly [K in PadCell['kind']]: () => string } = {
  chest: () => m.names_building_chest(),
  freezer: () => m.names_building_freezer(),
  'compost-box': () => m.names_building_compost_box(),
  'seed-silo': () => m.names_building_seed_silo(),
  'additive-store': () => m.names_building_additive_store(),
  warehouse: () => m.names_building_warehouse(),
  sorter: () => m.names_building_sorter(),
  mill: () => m.names_building_mill(),
  jam: () => m.names_building_jam(),
  still: () => m.names_building_still(),
  furnace: () => m.names_building_furnace(),
  infuser: () => m.names_building_infuser(),
  station: () => m.names_building_station(),
  grinder: () => m.names_building_grinder(),
  necronomicon: () => m.names_building_necronomicon(),
  'weather-station': () => m.names_sensor_weather(),
  barrel: () => m.names_building_barrel(),
  postbox: () => m.names_building_postbox(),
}

function padName(world: World, at: Coord): string {
  const cell = world.padCellAt(at)
  return cell === undefined ? m.vehicles_pad_gone() : PAD_NAME[cell.kind]()
}

function stopLabel(world: World, s: RouteStop): string {
  if (s.kind === 'goto') return m.vehicles_stop_go()
  if (s.kind === 'wait') return m.vehicles_stop_wait()
  const at = padName(world, s.at)
  if (s.kind === 'load') return m.vehicles_stop_load({ at })
  return m.vehicles_stop_unload({ at })
}

function trailerName(k: TrailerKind): string {
  if (k === 'seed') return m.vehicles_seeder()
  if (k === 'spray') return m.vehicles_sprayer()
  return m.vehicles_harvester()
}

function trailerArt(k: TrailerKind): string {
  if (k === 'seed') return ITEM_TRAILER_SEED
  if (k === 'spray') return ITEM_TRAILER_SPRAY
  return ITEM_TRAILER_HARVEST
}

function grid(d: RouteDeploy): Cell[] {
  const boom = d.kind === 'tractor' ? d.boom : 5
  const quad = d.kind === 'quad'
  const trailer = (k: TrailerKind | 'none'): RouteDeploy => ({ kind: 'tractor', trailer: k, boom })
  return [
    { art: QUAD, label: m.names_vehicle_quad(), on: quad, off: false, wide: true, pick: { kind: 'quad' } },
    {
      art: ITEM_TRACTOR,
      label: m.names_vehicle_tractor(),
      on: !quad,
      off: false,
      wide: true,
      pick: trailer(d.kind === 'tractor' ? d.trailer : 'none'),
    },
    {
      art: ITEM_TRACTOR,
      label: m.vehicles_no_trailer(),
      on: d.kind === 'tractor' && d.trailer === 'none',
      off: quad,
      wide: false,
      pick: trailer('none'),
    },
    ...(['seed', 'spray', 'harvest'] as const).map(k => ({
      art: trailerArt(k),
      label: trailerName(k),
      on: d.kind === 'tractor' && d.trailer === k,
      off: quad,
      wide: false,
      pick: trailer(k),
    })),
  ]
}

function why(world: World, route: Route): string | undefined {
  if (route.stops.length === 0) return m.vehicles_why_no_stops()
  if (world.routeDeployable(route)) return undefined
  if (route.deploy.kind === 'quad') return m.vehicles_why_no_quad()
  if (route.deploy.trailer === 'none') return m.vehicles_why_no_tractor()
  return m.vehicles_why_no_trailer({ trailer: trailerName(route.deploy.trailer) })
}

function status(v: Vehicle): string {
  if (v.fuel === 0) return m.vehicles_no_fuel()
  if (v.pose.kind !== 'field' || !v.running || v.pose.speed === 0) return m.vehicles_halted()
  return m.vehicles_heading_to({ n: v.cursor + 1 })
}

export function Automation({
  world,
  picked,
  onPick,
  onClose,
}: {
  world: World
  picked: RouteId | 'none'
  onPick: (r: RouteId | 'none') => void
  onClose: () => void
}) {
  useRefresh()
  const route = picked === 'none' ? undefined : world.routeById(picked)
  const out = route === undefined ? [] : world.vehicles.filter(v => v.route === route.id && v.pose.kind === 'field')
  const block = route === undefined ? undefined : why(world, route)
  return (
    <Dock
      title={m.vehicles_automation()}
      onClose={onClose}
      width="w-[32rem]"
      footer={
        route === undefined ? undefined : (
          <div className="flex items-center justify-between gap-2">
            <Btn
              disabled={out.length > 0}
              onClick={() => {
                world.deleteRoute(route.id)
                onPick('none')
              }}
            >
              <span title={out.length > 0 ? m.vehicles_delete_assigned() : undefined}>{m.vehicles_route_delete()}</span>
            </Btn>
            <Btn disabled={block !== undefined} onClick={() => world.deployRoute(route.id)}>
              <span title={block}>{m.vehicles_deploy()}</span>
            </Btn>
          </div>
        )
      }
    >
      <Tabs.Root
        value={picked === 'none' ? '' : String(picked)}
        orientation="vertical"
        className="flex gap-3"
        onValueChange={v => onPick(v === '' ? 'none' : (Number(v) as RouteId))}
      >
        <div className={ROUTE_RAIL}>
          <Tabs.List className="flex flex-col gap-0.5">
            {world.routes.map(r => (
              <RouteTab key={r.id} world={world} route={r} picked={picked === r.id} />
            ))}
          </Tabs.List>
          <button
            type="button"
            className="mt-1 cursor-pointer border-l-2 border-transparent py-1 pr-2 pl-4 text-left text-sm font-semibold tracking-wide text-ink/45 hover:text-ink/75"
            onClick={() => {
              world.createRoute()
              onPick((world.nextRouteId - 1) as RouteId)
            }}
          >
            {m.vehicles_route_new()}
          </button>
        </div>
        <div className="min-w-0 flex-1">
          {route === undefined && <p className="text-sm text-ink/60">{m.vehicles_routes_none()}</p>}
          {route !== undefined && (
            <Tabs.Content value={String(route.id)} className="flex flex-col">
              <Label>{m.vehicles_vehicle_title()}</Label>
              <div className="grid grid-cols-4 gap-1">
                {grid(route.deploy).map(c => (
                  <button
                    key={c.label}
                    type="button"
                    disabled={c.off}
                    className={`flex flex-col items-center gap-1 px-1 py-2 ${c.wide ? 'col-span-2' : ''} ${
                      c.off
                        ? 'cursor-default bg-ink/6 text-ink/35'
                        : c.on
                          ? 'bg-ink text-house'
                          : 'cursor-pointer bg-dirt text-house hover:bg-dirt-dark'
                    }`}
                    onClick={() => world.setRouteDeploy(route.id, c.pick)}
                  >
                    <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" dangerouslySetInnerHTML={{ __html: c.art }} />
                    <span className="text-center text-xs leading-none font-semibold">{c.label}</span>
                  </button>
                ))}
              </div>
              <Boom world={world} route={route} />
              <Label>{m.vehicles_stops_title()}</Label>
              {route.stops.length === 0 && <p className="text-sm text-ink/60">{m.vehicles_stops_none()}</p>}
              <Stops world={world} route={route} />
              <Label>{m.vehicles_on_route()}</Label>
              {out.length === 0 && <p className="text-sm text-ink/60">{m.vehicles_on_route_none()}</p>}
              <div className="flex flex-col gap-1.5">
                {out.map(v => (
                  <div key={v.id} className="flex items-center gap-3 bg-dirt px-3 py-2 text-house">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-7 w-7 shrink-0"
                      dangerouslySetInnerHTML={{ __html: v.kind === 'tractor' ? ITEM_TRACTOR : QUAD }}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{status(v)}</span>
                    <Bar value={v.fuel} color="bg-ripe" className="h-1.5 w-16" />
                    <button
                      type="button"
                      aria-label={m.vehicles_recall()}
                      title={m.vehicles_recall()}
                      className="cursor-pointer px-1 text-lg leading-none hover:bg-ink"
                      onClick={() => world.recallVehicle(v.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </Tabs.Content>
          )}
        </div>
      </Tabs.Root>
    </Dock>
  )
}

function RouteTab({ world, route, picked }: { world: World; route: Route; picked: boolean }) {
  const [editing, setEditing] = useState(false)
  const box = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (editing) box.current?.select()
  }, [editing])
  if (editing) {
    return (
      <input
        ref={box}
        defaultValue={route.name}
        aria-label={m.vehicles_route_name()}
        autoComplete="off"
        spellCheck={false}
        className="w-full min-w-0 border-l-2 border-ink bg-parch py-1 pr-2 pl-4 text-sm font-semibold tracking-wide text-ink outline-none"
        onBlur={e => {
          if (e.target.value !== '') world.renameRoute(route.id, e.target.value)
          setEditing(false)
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            e.stopPropagation()
            e.currentTarget.value = route.name
            e.currentTarget.blur()
          }
        }}
      />
    )
  }
  return (
    <Tabs.Trigger
      value={String(route.id)}
      className={`${tabRailClass} truncate`}
      title={m.vehicles_route_rename_hint()}
      onDoubleClick={() => {
        if (picked) setEditing(true)
      }}
    >
      {route.name}
    </Tabs.Trigger>
  )
}

function Stops({ world, route }: { world: World; route: Route }) {
  const [held, setHeld] = useState<number | 'none'>('none')
  const [over, setOver] = useState<number | 'none'>('none')
  return (
    <div className="flex flex-col gap-1">
      {route.stops.map((s, i) => (
        <div
          key={`${route.id}-${i}`}
          draggable
          onDragStart={e => {
            e.dataTransfer.effectAllowed = 'move'
            setHeld(i)
          }}
          onDragEnter={() => setOver(i)}
          onDragOver={e => e.preventDefault()}
          onDragEnd={() => {
            setHeld('none')
            setOver('none')
          }}
          onDrop={e => {
            e.preventDefault()
            if (held !== 'none' && held !== i) world.reorderStop(route.id, held, i)
            setHeld('none')
            setOver('none')
          }}
          className={`cursor-grab border border-ink/20 bg-parch/60 px-2 py-1 ${held === i ? 'opacity-40' : ''} ${
            over === i && held !== 'none' && held !== i ? 'border-ink bg-ink/10' : ''
          }`}
        >
          <div className="flex items-center gap-2">
            <span aria-hidden className="shrink-0 text-sm leading-none text-ink/35">
              ⠿
            </span>
            <span className="min-w-0 flex-1 truncate text-sm">
              <span className="mr-2 tabular-nums">{i + 1}</span>
              {stopLabel(world, s)}
            </span>
            <button
              type="button"
              aria-label={m.vehicles_stop_remove()}
              className="shrink-0 cursor-pointer px-1 text-lg leading-none text-ink/60 hover:bg-dirt hover:text-house"
              onClick={() => world.removeStop(route.id, i)}
            >
              ×
            </button>
          </div>
          {(s.kind === 'load' || s.kind === 'unload') && (
            <PickRow world={world} route={route} at={s.at} pick={s.pick} i={i} />
          )}
        </div>
      ))}
    </div>
  )
}

function PickRow({
  world,
  route,
  at,
  pick,
  i,
}: {
  world: World
  route: Route
  at: Coord
  pick: Pick
  i: number
}) {
  const pad = world.padGoodsAt(at)
  const types = padTypesOf(pad)
  const oneType = types.length === 1
  const type = pick.step === 'any' ? (oneType ? types[0] : 'any') : pick.type
  const goods = type === 'any' ? [] : padGoodsOf(pad, type)
  const oneGood = goods.length === 1
  const good = pick.step === 'any' || pick.step === 'type' ? (oneGood ? goods[0] : 'any') : pick.good
  const varieties = type === 'any' || good === 'any' ? [] : varietiesOf(type, good)
  const set = (q: Pick) => world.setStopPick(route.id, i, q)
  return (
    <div className="mt-1 ml-6 flex flex-wrap items-center gap-1">
      <PickMenu
        label={m.vehicles_pick_type()}
        disabled={oneType}
        chosen={type === 'any' ? anyRow(m.vehicles_pick_any()) : typeRow(type)}
        rows={[anyRow(m.vehicles_pick_any()), ...types.map(typeRow)]}
        onPick={id => set(id === 'any' ? ANY : narrowType(id as PickType))}
      />
      {type !== 'any' && (
        <PickMenu
          label={m.vehicles_pick_good()}
          disabled={oneGood}
          chosen={good === 'any' ? anyRow(ANY_TYPE_NAME[type]()) : goodRow(type, good)}
          rows={[anyRow(ANY_TYPE_NAME[type]()), ...goods.map(g => goodRow(type, g))]}
          onPick={id => set(id === 'any' ? narrowType(type) : narrowGood(type, id as PickGood))}
        />
      )}
      {good !== 'any' && type !== 'any' && varieties.length > 1 && (
        <PickMenu
          label={m.vehicles_pick_variety()}
          disabled={false}
          chosen={
            pick.step === 'variety' ? varietyRow(type, good, pick.variety) : anyRow(m.vehicles_pick_any_variety())
          }
          rows={[
            anyRow(m.vehicles_pick_any_variety()),
            ...varieties.map(v => varietyRow(type, good, v)),
          ]}
          onPick={id => set(id === 'any' ? narrowGood(type, good) : narrowVariety(type, good, id as VarietyId))}
        />
      )}
    </div>
  )
}

type Row = { id: string; label: string; item: Item | 'any'; tint: string }

function anyRow(label: string): Row {
  return { id: 'any', label, item: 'any', tint: '' }
}

function typeRow(type: PickType): Row {
  return { id: type, label: TYPE_NAME[type](), item: typeIcon(type), tint: '' }
}

function goodRow(type: PickType, good: PickGood): Row {
  return { id: good, label: goodLabel(type, good), item: sampleItem(type, good, 'base'), tint: '' }
}

function varietyRow(type: PickType, good: PickGood, v: VarietyId): Row {
  const tier = tierOf(v)
  return {
    id: v,
    label: v === 'base' ? m.vehicles_tier_base() : varietyName(v),
    item: sampleItem(type, good, v),
    tint: tier === 'variant' ? 'bg-water/25' : tier === 'heirloom' ? 'bg-ripe/30' : '',
  }
}

function RowFace({ item }: { item: Item | 'any' }) {
  if (item === 'any') {
    return (
      <span aria-hidden className="flex h-5 w-5 shrink-0 items-center justify-center text-base leading-none text-ink/60">
        *
      </span>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" dangerouslySetInnerHTML={{ __html: faceGfx(item) }} />
  )
}

function PickMenu({
  label,
  disabled,
  chosen,
  rows,
  onPick,
}: {
  label: string
  disabled: boolean
  chosen: Row
  rows: Row[]
  onPick: (id: string) => void
}) {
  const face = (
    <span
      className={`flex items-center gap-1 border border-ink/30 px-1.5 py-1 text-xs ${chosen.tint === '' ? 'bg-parch' : chosen.tint} ${
        disabled ? 'cursor-default text-ink/50' : 'cursor-pointer hover:border-ink'
      }`}
    >
      <RowFace item={chosen.item} />
      <span className="max-w-24 truncate">{chosen.label}</span>
      {!disabled && <span aria-hidden className="text-ink/45">▾</span>}
    </span>
  )
  if (disabled) {
    return (
      <span aria-label={label} title={label}>
        {face}
      </span>
    )
  }
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <button
          type="button"
          aria-label={`${label}: ${chosen.label}`}
          title={label}
          draggable={false}
          onDragStart={e => e.preventDefault()}
        >
          {face}
        </button>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          align="start"
          sideOffset={2}
          className="scroll-pane z-50 max-h-72 min-w-40 overflow-y-auto border-2 border-ink bg-parch py-1 shadow-[3px_3px_0_0_rgba(28,23,16,0.35)]"
        >
          {rows.map(r => (
            <Menu.Item
              key={r.id}
              className={`flex cursor-pointer items-center gap-2 px-2 py-1 text-sm outline-none select-none data-[highlighted]:bg-ink data-[highlighted]:text-house ${r.tint}`}
              onSelect={() => onPick(r.id)}
            >
              <RowFace item={r.item} />
              <span className="truncate">{r.label}</span>
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  )
}

function Boom({ world, route }: { world: World; route: Route }) {
  const deploy = route.deploy
  if (deploy.kind !== 'tractor' || deploy.trailer === 'none') return null
  return (
    <>
      <Label>{m.vehicles_boom_title()}</Label>
      <div className="flex gap-1">
        {([3, 5] as const).map(b => (
          <Btn
            key={b}
            selected={deploy.boom === b}
            onClick={() => world.setRouteDeploy(route.id, { kind: 'tractor', trailer: deploy.trailer, boom: b })}
          >
            {b === 3 ? m.vehicles_boom_3() : m.vehicles_boom_5()}
          </Btn>
        ))}
      </div>
    </>
  )
}
