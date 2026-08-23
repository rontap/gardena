import {
  QUAD_PRICE,
  TRACTOR_PRICE,
  TRAILER_CAP,
  TRAILER_HARVEST_PRICE,
  TRAILER_SEED_PRICE,
  TRAILER_SPRAY_PRICE,
} from '../defs/items.ts'
import type { Coord } from '../sim/building.ts'
import type { TrailerId, VehicleId } from '../sim/ids.ts'
import { trailerUsed, type Trailer, type Vehicle } from '../sim/vehicle.ts'
import type { World } from '../sim/world.ts'
import { ITEM_TRAILER_HARVEST, ITEM_TRAILER_SEED, ITEM_TRAILER_SPRAY, ITEM_TRACTOR, QUAD } from '../view/svgs.ts'
import { Bar, Coin } from './frame.tsx'
import { Shell } from './store.tsx'

function status(v: Vehicle): string {
  if (v.pose.kind === 'stored') return 'Stored'
  if (v.pose.driver === 'none') return 'Deployed'
  return 'Driven'
}

function trailerStatus(t: Trailer): string {
  return t.pose.kind === 'stored' ? 'Stored' : 'Attached'
}

function trailerArt(t: Trailer): string {
  if (t.kind === 'seed') return ITEM_TRAILER_SEED
  if (t.kind === 'spray') return ITEM_TRAILER_SPRAY
  return ITEM_TRAILER_HARVEST
}

export function HangarUi({
  world,
  at,
  selected,
  selectedTrailer,
  onSelect,
  onSelectTrailer,
  onClose,
}: {
  world: World
  at: Coord
  selected: VehicleId | undefined
  selectedTrailer: TrailerId | undefined
  onSelect: (id: VehicleId) => void
  onSelectTrailer: (id: TrailerId) => void
  onClose: () => void
}) {
  const cell = world.cell(at)
  if (cell.kind !== 'hangar') return null
  const picked = selected === undefined ? undefined : world.vehicles.find(v => v.id === selected)
  const pickedTrailer = selectedTrailer === undefined ? undefined : world.trailers.find(t => t.id === selectedTrailer)
  const tractorStored = picked !== undefined && picked.kind === 'tractor' && picked.pose.kind === 'stored'
  const hitchOk =
    pickedTrailer === undefined || (pickedTrailer.pose.kind === 'stored' && tractorStored)
  const canDeploy = picked !== undefined && picked.pose.kind === 'stored' && hitchOk
  const cost = world.refillCost()
  return (
    <Shell title="Vehicle hangar" onClose={onClose} className="w-[30rem]">
      <div className="flex flex-col gap-1.5">
        {world.vehicles.map(v => (
          <button
            key={`v-${v.id}`}
            type="button"
            onClick={() => onSelect(v.id)}
            className={`flex w-full items-center gap-3 px-3 py-2 text-left ${
              selected === v.id ? 'bg-ink text-house' : 'cursor-pointer bg-dirt text-house hover:bg-dirt-dark'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7 shrink-0"
              dangerouslySetInnerHTML={{ __html: v.kind === 'tractor' ? ITEM_TRACTOR : QUAD }}
            />
            <span className="min-w-0 flex-1 truncate text-base font-semibold">{v.kind === 'tractor' ? 'Tractor' : 'Quad'}</span>
            <Bar value={v.fuel} color="bg-ripe" className="h-1.5 w-20" />
            <span className="shrink-0 text-sm">{status(v)}</span>
          </button>
        ))}
        {world.trailers.map(t => {
          const selectable = tractorStored
          return (
            <button
              key={`t-${t.id}`}
              type="button"
              onClick={() => {
                if (!selectable) return
                onSelectTrailer(t.id)
              }}
              className={`flex w-full items-center gap-3 px-3 py-2 text-left ${
                selectedTrailer === t.id && selectable
                  ? 'bg-ink text-house'
                  : selectable
                    ? 'cursor-pointer bg-dirt text-house hover:bg-dirt-dark'
                    : 'cursor-default bg-ink/6 text-ink/35'
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" dangerouslySetInnerHTML={{ __html: trailerArt(t) }} />
              <span className="min-w-0 flex-1 truncate text-base font-semibold">
                {t.kind === 'seed' ? 'Seeder' : t.kind === 'spray' ? 'Sprayer' : 'Harvester'}
              </span>
              <span className="shrink-0 text-sm tabular-nums">
                {trailerUsed(t)}/{TRAILER_CAP}
              </span>
              <span className="shrink-0 text-sm">{trailerStatus(t)}</span>
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => world.buyVehicle(at, 'quad')}
          className="flex w-full items-center gap-3 px-3 py-2 text-left cursor-pointer bg-dirt text-house hover:bg-dirt-dark"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" dangerouslySetInnerHTML={{ __html: QUAD }} />
          <span className="min-w-0 flex-1 truncate text-base font-semibold">Buy Quad</span>
          <Coin n={QUAD_PRICE} />
        </button>
        <button
          type="button"
          onClick={() => world.buyVehicle(at, 'tractor')}
          className="flex w-full items-center gap-3 px-3 py-2 text-left cursor-pointer bg-dirt text-house hover:bg-dirt-dark"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" dangerouslySetInnerHTML={{ __html: ITEM_TRACTOR }} />
          <span className="min-w-0 flex-1 truncate text-base font-semibold">Buy Tractor</span>
          <Coin n={TRACTOR_PRICE} />
        </button>
        <button
          type="button"
          onClick={() => world.buyTrailer(at, 'seed')}
          className="flex w-full items-center gap-3 px-3 py-2 text-left cursor-pointer bg-dirt text-house hover:bg-dirt-dark"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" dangerouslySetInnerHTML={{ __html: ITEM_TRAILER_SEED }} />
          <span className="min-w-0 flex-1 truncate text-base font-semibold">Buy seeder</span>
          <Coin n={TRAILER_SEED_PRICE} />
        </button>
        <button
          type="button"
          onClick={() => world.buyTrailer(at, 'spray')}
          className="flex w-full items-center gap-3 px-3 py-2 text-left cursor-pointer bg-dirt text-house hover:bg-dirt-dark"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" dangerouslySetInnerHTML={{ __html: ITEM_TRAILER_SPRAY }} />
          <span className="min-w-0 flex-1 truncate text-base font-semibold">Buy sprayer</span>
          <Coin n={TRAILER_SPRAY_PRICE} />
        </button>
        <button
          type="button"
          onClick={() => world.buyTrailer(at, 'harvest')}
          className="flex w-full items-center gap-3 px-3 py-2 text-left cursor-pointer bg-dirt text-house hover:bg-dirt-dark"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" dangerouslySetInnerHTML={{ __html: ITEM_TRAILER_HARVEST }} />
          <span className="min-w-0 flex-1 truncate text-base font-semibold">Buy harvester</span>
          <Coin n={TRAILER_HARVEST_PRICE} />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={!canDeploy}
          onClick={() => {
            if (picked === undefined) return
            const hitch = tractorStored && pickedTrailer !== undefined && pickedTrailer.pose.kind === 'stored' ? pickedTrailer.id : 'none'
            world.deploy(picked.id, at, hitch)
          }}
          className={`px-3 py-2 text-base font-semibold ${
            canDeploy ? 'cursor-pointer bg-dirt text-house hover:bg-dirt-dark' : 'cursor-default bg-ink/6 text-ink/35'
          }`}
        >
          Deploy
        </button>
        <button
          type="button"
          onClick={() => world.refill(at)}
          className="flex items-center gap-2 px-3 py-2 text-base font-semibold cursor-pointer bg-dirt text-house hover:bg-dirt-dark"
        >
          Refill all
          <Coin n={cost} />
        </button>
      </div>
    </Shell>
  )
}
