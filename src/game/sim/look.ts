import { m } from '../../paraglide/messages.js'
import { inFade, inWorld, occupiedCells } from './building.ts'
import {
  NOT_OWNED,
  compostLine,
  cropLabel,
  furnaceLook,
  grindLook,
  stationLook,
  jamLook,
  millLook,
  sensorName,
  stillLook,
  treeLine,
  type PromptHit,
} from './prompt.ts'
import { onCell } from './drop.ts'
import { cropVariety } from '../defs/crops.ts'
import { caskName, heldText, skuLabel, type Hand } from './item.ts'
import { corners, incident } from './pipe.ts'
import type { Barrel } from './building.ts'
import { barrelNeed, caskAgeMul, caskAgeTop, feedUnits, feedVariety, meanQuality } from './feature-machines/machine.ts'
import { BARREL_AGE, BARREL_MATURE, FURNACE_HASTE } from '../defs/items.ts'
import { DAY_SECONDS } from './clock.ts'
import { isSensor } from './sensor.ts'
import { fertBand, waterBand, SOIL_WATER_MID, type Band, type Soil } from './soil.ts'
import { CASK_OF, type TileId } from './ids.ts'
import type { World } from './world.ts'

const FERT_WORD: { readonly [K in Band]: () => string } = {
  green: m.prompt_fert_fed,
  orange: m.prompt_fert_mediocre,
  red: m.prompt_fert_starving,
}

const TILE_LABEL: { readonly [K in TileId]: () => string } = {
  paved: m.names_tile_paved,
  brick: m.names_tile_brick,
  cobble: m.names_tile_cobble,
}

export function lookText(world: World, hit: PromptHit | undefined, plantStats: boolean): string {
  const seat = world.seats[world.local]
  const place = seat.place
  const hand = seat.hand
  if (place.kind === 'delete') return world.promptHit(hit).text
  if (
    hit !== undefined &&
    (hit.kind === 'valve' ||
      hit.kind === 'sprinkler-hud' ||
      hit.kind === 'port' ||
      hit.kind === 'delete-wire' ||
      hit.kind === 'water-hud' ||
      hit.kind === 'harvest-hud' ||
      hit.kind === 'counter-hud' ||
      hit.kind === 'day-hud')
  ) {
    return world.promptHit(hit).text
  }
  if (place.kind === 'wire') return world.promptHit(hit).text
  if (
    place.kind === 'sku' &&
    (place.id === 'buy-pipe' ||
      place.id === 'buy-valve' ||
      place.id === 'buy-sprinkler' ||
      place.id === 'buy-sprinkler-vert' ||
      place.id === 'buy-sprinkler-large')
  ) {
    return world.promptHit(hit).text
  }
  const at = hit !== undefined && hit.kind === 'cell' ? hit.at : undefined
  if (at !== undefined) {
    const face = world.faces().find(f => f.at.col === at.col && f.at.row === at.row)
    if (face !== undefined) {
      if (world.money < face.price) return m.prompt_cannot_afford()
      return m.prompt_expand({ price: face.price })
    }
  }
  if (at === undefined) {
    if (place.kind === 'sku') return m.prompt_place({ name: skuLabel(place.id) })
    return m.prompt_emdash()
  }
  if (!inWorld(at, world.owned)) {
    if (inFade(at, world.owned)) return NOT_OWNED
    if (place.kind === 'sku') {
      return m.prompt_place({ name: skuLabel(place.id) })
    }
    return m.prompt_emdash()
  }
  const cell = world.cell(at)
  const lines: string[] = []
  if (place.kind === 'sku') {
    lines.push(m.prompt_place({ name: skuLabel(place.id) }))
  }
  const faceAt = lines.length
  const parked = world.parkedAt(at)
  if (cell.kind === 'hangar') lines.push(m.names_building_hangar())
  else if (parked !== undefined) lines.push(parked.kind === 'tractor' ? m.names_vehicle_tractor() : m.names_vehicle_quad())
  else if (cell.kind === 'silo-seed') lines.push(m.names_building_silo_seed())
  else if (cell.kind === 'silo-spray') lines.push(m.names_building_silo_spray())
  else if (cell.kind === 'silo-produce') lines.push(m.names_building_silo_produce())
  else if (cell.kind === 'house') lines.push(m.names_building_house())
  else if (cell.kind === 'truck') lines.push(m.names_building_truck())
  else if (cell.kind === 'pump') {
    lines.push(
      labeled(m.names_building_pump(), m.prompt_of({ stored: liters(cell.water.stored), capacity: liters(cell.water.capacity) })),
    )
  } else if (cell.kind === 'rain-tank') {
    lines.push(
      labeled(
        m.names_building_rain_tank(),
        m.prompt_of({ stored: liters(cell.water.stored), capacity: liters(cell.water.capacity) }),
      ),
    )
  } else if (cell.kind === 'tap') lines.push(m.names_building_tap())
  else if (cell.kind === 'well') {
    lines.push(
      labeled(m.names_building_well(), m.prompt_of({ stored: liters(cell.water.stored), capacity: liters(cell.water.capacity) })),
    )
  } else if (cell.kind === 'rock') lines.push(m.names_building_rock())
  else if (cell.kind === 'seed-silo') {
    lines.push(labeled(m.names_building_seed_silo(), m.prompt_of_seeds({ used: cell.used, cap: cell.cap })))
  } else if (cell.kind === 'additive-store') {
    lines.push(
      labeled(m.names_building_additive_store(), m.prompt_of({ stored: liters(cell.used), capacity: liters(cell.cap) })),
    )
  } else if (cell.kind === 'chest') lines.push(m.names_building_chest())
  else if (cell.kind === 'freezer') lines.push(m.names_building_freezer())
  else if (cell.kind === 'grinder') lines.push(grindLook(cell, hand))
  else if (cell.kind === 'compost-box') lines.push(compostLine(cell.units, cell.progress))
  else if (cell.kind === 'mill') lines.push(millLook(cell, hand))
  else if (cell.kind === 'still') lines.push(stillLook(cell, hand))
  else if (cell.kind === 'furnace') lines.push(furnaceLook(cell, hand))
  else if (cell.kind === 'station') lines.push(stationLook(cell, hand))
  else if (cell.kind === 'barrel') lines.push(barrelLine(cell))
  else if (cell.kind === 'jam') lines.push(jamLook(cell, hand))
  else if (cell.kind === 'tree') lines.push(treeLine(cell))
  else if (cell.kind === 'untilled') {
    if (cell.cover.kind === 'tile') lines.push(tileName(cell.cover.tile))
    else if (cell.ground === 'soft') lines.push(m.names_ground_grass())
    else if (cell.ground === 'hard') lines.push(m.names_ground_hard())
    else lines.push(m.names_ground_very_hard())
  } else if (cell.kind === 'infertile') lines.push(m.names_ground_infertile())
  else if (cell.kind === 'empty') lines.push(labeled(m.names_ground_tilled(), soilLine(cell.soil)))
  else if (cell.kind === 'weed') lines.push(labeled(m.names_ground_weed(), soilLine(cell.soil)))
  else if (cell.kind === 'turf') {
    lines.push(labeled(m.names_ground_grass(), m.prompt_rooting_pct({ n: Math.floor(cell.turf.maturity * 100) })))
  } else if (cell.kind === 'growing') {
    const st = cell.plant.stats(world.modifiers)
    lines.push(m.prompt_growing_variety({ name: cropVariety(cell.plant.crop, cell.plant.variety) }))
    if (plantStats) {
      lines.push(m.prompt_happiness({ n: Math.floor(cell.plant.happiness * 100) }))
      lines.push(
        m.prompt_water_stat({
          stored: liters(cell.soil.water),
          mid: liters(SOIL_WATER_MID),
          word: waterWord(cell.soil, st.waterTolerance),
        }),
      )
      lines.push(
        m.prompt_fert_stat({
          n: Math.floor(cell.soil.fertilizer * 100),
          word: FERT_WORD[fertBand(cell.soil.fertilizer, st.fertTolerance)](),
        }),
      )
    }
  } else if (cell.kind === 'ripe') {
    lines.push(m.prompt_ripe_variety({ name: cropVariety(cell.plant.crop, cell.plant.variety) }))
  } else if (cell.kind === 'rotten') {
    lines.push(m.prompt_rotten({ name: cropLabel(cell.crop), soil: soilLine(cell.soil) }))
  } else if (isSensor(cell)) {
    if (cell.kind === 'water-system') {
      const around = corners(occupiedCells(cell.base, world.owned)).some(v =>
        incident(v).some(e => world.hasPipe(e)),
      )
      if (!around) lines.push(labeled(m.names_sensor_water_system(), m.prompt_no_pipes()))
      else lines.push(labeled(m.names_sensor_water_system(), cell.out === 1 ? m.prompt_on() : m.prompt_off()))
    } else {
      const on =
        cell.kind === 'lever'
          ? cell.on
          : cell.kind === 'lamp' || cell.kind === 'traffic-light'
            ? cell.inn === 1
            : cell.out === 1
      lines.push(labeled(sensorName(cell.kind), on ? m.prompt_on() : m.prompt_off()))
    }
  } else {
    lines.push(labeled(cropLabel(cell.plant.crop), m.prompt_dead()))
  }
  const face = lines[faceAt]
  if ('hasted' in cell && cell.hasted) {
    const n = Math.round((world.furnaceMulFor(cell.base) - 1) / FURNACE_HASTE)
    if (n > 0) lines.push(m.prompt_furnace_haste({ n, pct: FURNACE_HASTE * n * 100 }))
  }
  const watch = world.neighbourWatch(at)
  if (watch !== undefined && !watch.ok) {
    const name = cropLabel(watch.crop)
    lines.push(watch.tree ? m.prompt_neighbour_wait_tree({ name }) : m.prompt_neighbour_wait({ name }))
  }
  if (world.hasFence(at)) lines.push(m.names_building_fence())
  const drop = onCell(world.drops, at).at(-1)
  if (drop !== undefined) {
    const held: Hand = { kind: 'hold', item: drop.item }
    lines.push(
      drop.item.kind === 'fruit'
        ? m.hud_line_count({ name: cropVariety(drop.item.crop, drop.item.variety), count: drop.item.count })
        : heldText(held, world.modifiers),
    )
  }
  if (cell.kind !== 'silo-seed' && cell.kind !== 'silo-spray' && cell.kind !== 'silo-produce') {
    const p = world.prompt(at).text
    if (p !== face) lines.push(p)
  }
  return lines.join('\n')
}

function barrelLine(c: Barrel): string {
  const name = m.names_building_barrel()
  if (c.crop === 'none') return labeled(name, m.prompt_empty())
  const need = barrelNeed(c.crop)
  const n = feedUnits(c.feed)
  if (n < need) {
    return labeled(name, m.prompt_n_cap_crop({ n, cap: need, crop: cropVariety(c.crop, c.feed[0]?.variety ?? 'base') }))
  }
  if (c.age < BARREL_MATURE) return labeled(name, m.prompt_maturing_pct({ n: Math.floor((c.age / BARREL_MATURE) * 100) }))
  const quality = meanQuality(c.feed)
  const mul = caskAgeMul(c.age, quality)
  const line = labeled(name, m.prompt_aging_sells({ n: Math.floor(c.age / DAY_SECONDS), mul: Number(mul.toFixed(2)) }))
  const top = m.prompt_aging_max({
    cask: caskName(CASK_OF[c.crop], feedVariety(c.feed)),
    name: cropVariety(c.crop, feedVariety(c.feed)),
    days: Math.round(BARREL_AGE / DAY_SECONDS),
    mul: Number(caskAgeTop(quality).toFixed(2)),
  })
  return `${line}\n${top}`
}

function tileName(id: TileId): string {
  return TILE_LABEL[id]()
}

function soilLine(soil: Soil): string {
  const water = liters(soil.water)
  const n = Math.floor(soil.fertilizer * 100)
  return soil.bio ? m.prompt_soil({ water, n }) : m.prompt_soil_not_organic({ water, n })
}

function liters(n: number): string {
  return m.prompt_liters({ n: Number(n.toFixed(2)) })
}

function waterWord(soil: Soil, tol: number): string {
  const band = waterBand(soil.water, tol)
  if (band === 'green') return m.prompt_water_happy()
  if (band === 'orange') return soil.drowning ? m.prompt_water_too_wet() : m.prompt_water_thirsty()
  return soil.drowning ? m.prompt_water_drowning() : m.prompt_water_wilting()
}

function labeled(name: string, detail: string): string {
  return m.prompt_labeled({ name, detail })
}
