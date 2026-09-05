import { CHEST_SLOTS } from '../../defs/items.ts'
import { VARIETY_IDS } from '../../defs/varieties.ts'
import { Actor } from '../actor.ts'
import {
  AdditiveStore,
  CHUNK,
  Chest,
  CompostBox,
  DOOR,
  Freezer,
  Grinder,
  Hangar,
  House,
  SiloProduce,
  SiloSeed,
  SiloSpray,
  JamMachine,
  Mill,
  Furnace,
  PotStill,
  Pump,
  RainTank,
  ResearchStation,
  Rock,
  SeedSilo,
  Tap,
  Well,
  Tree,
  Truck,
  Barrel,
  chunkKey,
  chunkRect,
  type ChunkId,
} from '../building.ts'
import type { Cell } from '../plot.ts'
import type { SkillId } from '../ids.ts'
import type { Bins, Contracts } from '../feature-contracts/market.h.ts'
import { MemorySink, type LogSink } from '../log.ts'
import {
  AndGate,
  Button,
  Counter,
  DaySensor,
  FertSensor,
  HarvestSensor,
  Lamp,
  Lever,
  NotGate,
  OrGate,
  Pulser,
  TrafficLight,
  VehicleSensor,
  WaterSensor,
  WaterSystem,
} from '../sensor.ts'
import { Plant, Turf, Weed } from '../plant.ts'
import { Rng } from '../rng.ts'
import { Soil } from '../soil.ts'
import { STALL_IDS, StallGood, type StallMap } from '../stall.ts'
import {
  World,
  type Family,
  type Hydrate,
  type MemberState,
  type Seat,
  type SeatId,
} from '../world.ts'
import { makeQuad, makeTractor, type Trailer, type Vehicle } from '../feature-vehicles/vehicle.ts'
import {
  type LoadResult,
  type Save,
  type SaveCell,
  type SaveContracts,
  type SaveMember,
  type SavePlant,
  type SaveSoil,
  type SaveTrailer,
  type SaveVehicle,
} from './save.ts'

export function parse(text: string, sink: LogSink = new MemorySink()): LoadResult {
  let save: Save
  try {
    save = JSON.parse(text) as Save
  } catch {
    return { ok: false, reason: 'unknown-format' }
  }
  if (save?.game !== 'gardena') return { ok: false, reason: 'not-gardena' }
  return { ok: true, world: worldFromSave(save, sink) }
}

function worldFromSave(save: Save, sink: LogSink): World {
  const owned = save.chunks.map(ch => ch.id)
  const live = stampChunks(save.chunks)
  const h: Hydrate = {
    rng: new Rng(save.rng.seed, { fruit: save.rng.fruit }),
    sink,
    house: live.house,
    silo: live.silo,
    additives: live.additives,
    truck: live.truck,
    pumps: live.pumps,
    tanks: live.tanks,
    taps: live.taps,
    stills: live.stills,
    waterSystems: live.waterSystems,
    wires: save.wires,
    valveHold: save.valveHold,
    stall: makeStallMap(save.stall),
    family: makeFamily(save.family),
    seats: save.seats.map((s, i): Seat => ({
      id: i as SeatId,
      playerId: s.playerId,
      name: s.name,
      presence: s.presence,
      napping: false,
      cue: { kind: 'none' },
      actor: new Actor(s.actor.x, s.actor.y),
      hand: s.hand,
      inventory: s.inventory.slice(),
      queue: [],
      place: { kind: 'none' },
      workLeft: 0,
      workTotal: 0,
      filling: false,
      drive: { throttle: 0, steer: 0 },
      stride: { x: 0, y: 0 },
      legStart: { x: s.actor.x, y: s.actor.y },
    })),
    hangars: live.hangars,
    seedSilos: live.seedSilos,
    spraySilos: live.spraySilos,
    produceSilos: live.produceSilos,
    vehicles: save.vehicles.map(liveVehicle),
    nextVehicleId: save.nextVehicleId,
    trailers: save.trailers.map(liveTrailer),
    nextTrailerId: save.nextTrailerId,
    routes: save.routes.map(r => ({ id: r.id, name: r.name, stops: r.stops.map(s => (s.kind === 'goto' ? { ...s } : { kind: s.kind, at: { col: s.at.col, row: s.at.row } })) })),
    nextRouteId: save.nextRouteId,
    owned,
    chunks: live.chunks,
    clock: save.clock,
    money: save.money,
    rep: save.rep,
    repDay: save.repDay,
    contracts: liveContracts(save.contracts, save.rep, save.repDay),
    purchases: save.purchases,
    prizeSlots: save.prizeSlots,
    prizeFreezers: save.prizeFreezers,
    points: save.points,
    clearance: save.clearance,
    bigTicks: save.bigTicks,
    done: save.done,
    job: save.job,
    tally: { died: save.tally.died, harvests: save.tally.harvests, research: save.tally.research, contracts: [] },
    seam:
      save.seam.kind === 'play'
        ? { kind: 'play' }
        : {
            kind: 'recap',
            recap: { ...save.seam.recap, contracts: [] },
          },
    segments: save.segments,
    wells: live.wells,
    sprinklers: save.sprinklers,
    fences: save.fences,
    drops: save.drops,
  }
  return World.hydrate(h)
}

function makeFamily(f: Save['family']): Family {
  return {
    player: makeMember(f.player),
    husband: makeMember(f.husband),
    daughter: makeMember(f.daughter),
  }
}

function makeMember<Id extends SkillId>(m: SaveMember<Id>): MemberState<Id> {
  return {
    pickCount: m.pickCount,
    owned: new Map(m.owned.map(s => [s.id, s.tier])),
    offers: m.offers.map(o => ({ id: o.id, tier: o.tier })),
  }
}

function makeStallMap(s: Save['stall']): StallMap {
  const stall = {} as StallMap
  for (const id of STALL_IDS) {
    const src = s[id]
    const g = new StallGood(id)
    VARIETY_IDS.forEach(r => {
      g.stock[r] = { organic: src.stock[r].organic, synth: src.stock[r].synth }
      g.worth[r] = { organic: src.worth[r].organic, synth: src.worth[r].synth }
    })
    stall[id] = g
  }
  return stall
}

function stampChunks(chunkSaves: { id: ChunkId; cells: SaveCell[][] }[]): {
  chunks: Map<string, Cell[][]>
  house: House
  truck: Truck
  silo: SeedSilo
  additives: AdditiveStore
  pumps: Pump[]
  tanks: RainTank[]
  taps: Tap[]
  wells: Well[]
  stills: PotStill[]
  waterSystems: WaterSystem[]
  hangars: Hangar[]
  seedSilos: SiloSeed[]
  spraySilos: SiloSpray[]
  produceSilos: SiloProduce[]
} {
  const origins = new Map<string, Cell>()
  const pumps: Pump[] = []
  const tanks: RainTank[] = []
  const taps: Tap[] = []
  const wells: Well[] = []
  const stills: PotStill[] = []
  const waterSystems: WaterSystem[] = []
  const hangars: Hangar[] = []
  const seedSilos: SiloSeed[] = []
  const spraySilos: SiloSpray[] = []
  const produceSilos: SiloProduce[] = []
  let house!: House
  let truck!: Truck
  let silo!: SeedSilo
  let additives!: AdditiveStore
  for (const ch of chunkSaves) {
    const { col0, row0 } = chunkRect(ch.id)
    for (let row = 0; row < CHUNK; row++) {
      for (let col = 0; col < CHUNK; col++) {
        const sc = ch.cells[row][col]
        if (sc.kind === 'occ') continue
        const at = { col: col0 + col, row: row0 + row }
        const made = makeLive(sc)
        origins.set(`${at.col},${at.row}`, made)
        if (made.kind === 'house') house = made
        if (made.kind === 'truck') truck = made
        if (made.kind === 'seed-silo' && made.useDefault) silo = made
        if (made.kind === 'additive-store' && made.useDefault) additives = made
        if (made.kind === 'pump') {
          if (made.form === 'starter') pumps.unshift(made)
          else pumps.push(made)
        }
        if (made.kind === 'rain-tank') tanks.push(made)
        if (made.kind === 'tap') taps.push(made)
        if (made.kind === 'well') wells.push(made)
        if (made.kind === 'still') stills.push(made)
        if (made.kind === 'water-system') waterSystems.push(made)
        if (made.kind === 'hangar') hangars.push(made)
        if (made.kind === 'silo-seed') seedSilos.push(made)
        if (made.kind === 'silo-spray') spraySilos.push(made)
        if (made.kind === 'silo-produce') produceSilos.push(made)
      }
    }
  }
  const chunks = new Map<string, Cell[][]>()
  for (const ch of chunkSaves) {
    const { col0, row0 } = chunkRect(ch.id)
    const grid: Cell[][] = []
    for (let row = 0; row < CHUNK; row++) {
      const line: Cell[] = []
      for (let col = 0; col < CHUNK; col++) {
        const sc = ch.cells[row][col]
        const at = { col: col0 + col, row: row0 + row }
        if (sc.kind === 'occ') {
          line.push(origins.get(`${sc.of.col},${sc.of.row}`) as Cell)
        } else {
          line.push(origins.get(`${at.col},${at.row}`) as Cell)
        }
      }
      grid.push(line)
    }
    chunks.set(chunkKey(ch.id), grid)
  }
  return { chunks, house, truck, silo, additives, pumps, tanks, taps, wells, stills, waterSystems, hangars, seedSilos, spraySilos, produceSilos }
}

function makeLive(cell: Exclude<SaveCell, { kind: 'occ' }>): Cell {
  switch (cell.kind) {
    case 'untilled':
      return { kind: 'untilled', ground: cell.ground, cover: cell.cover }
    case 'empty':
      return { kind: 'empty', soil: makeSoil(cell.soil) }
    case 'infertile':
      return { kind: 'infertile' }
    case 'weed': {
      const weed = new Weed(cell.weed.variant)
      weed.maturity = cell.weed.maturity
      weed.spread = cell.weed.spread
      return { kind: 'weed', soil: makeSoil(cell.soil), weed }
    }
    case 'turf': {
      const turf = new Turf(cell.turf.variant)
      turf.maturity = cell.turf.maturity
      return { kind: 'turf', soil: makeSoil(cell.soil), turf }
    }
    case 'growing':
    case 'ripe':
    case 'dead':
      return { kind: cell.kind, soil: makeSoil(cell.soil), plant: makePlant(cell.plant) }
    case 'rotten':
      return { kind: 'rotten', soil: makeSoil(cell.soil), crop: cell.crop }
    case 'house':
      return new House(cell.base, DOOR)
    case 'pump': {
      const pump = new Pump(cell.base, cell.form)
      pump.water.stored = cell.stored
      return pump
    }
    case 'rain-tank': {
      const tank = new RainTank(cell.base)
      tank.water.stored = cell.stored
      return tank
    }
    case 'tap':
      return new Tap(cell.base)
    case 'well': {
      const well = new Well(cell.base)
      well.water.stored = cell.stored
      return well
    }
    case 'rock':
      return new Rock(cell.base)
    case 'tree': {
      const tree = new Tree(cell.species, cell.base, cell.juvenile, cell.fruit, cell.yield)
      tree.tended = cell.tended
      tree.trunk = cell.trunk
      tree.variety = cell.variety
      return tree
    }
    case 'chest': {
      const chest = new Chest(cell.base)
      for (let i = 0; i < CHEST_SLOTS; i++) chest.slots[i] = cell.slots[i]
      chest.out = cell.out
      chest.hold = cell.hold
      return chest
    }
    case 'seed-silo': {
      const silo = new SeedSilo(cell.base, cell.useDefault)
      cell.seeds.forEach(st => silo.seeds.push({ ...st }))
      silo.out = cell.out
      silo.hold = cell.hold
      return silo
    }
    case 'additive-store': {
      const store = new AdditiveStore(cell.base, cell.useDefault)
      cell.held.forEach(h => store.held.push({ ...h }))
      store.sugar = { ...cell.sugar }
      store.out = cell.out
      store.hold = cell.hold
      return store
    }
    case 'grinder': {
      const g = new Grinder(cell.base)
      g.crop = cell.crop
      g.variety = cell.variety
      g.quality = cell.quality
      g.units = cell.units
      g.progress = cell.progress
      g.n = cell.n
      return g
    }
    case 'compost-box': {
      const box = new CompostBox(cell.base)
      box.units = cell.units
      box.progress = cell.progress
      return box
    }
    case 'mill': {
      const mill = new Mill(cell.base)
      mill.recipe = cell.recipe
      mill.variety = cell.variety
      mill.quality = cell.quality
      mill.units = cell.units
      mill.progress = cell.progress
      mill.inn = cell.inn
      return mill
    }
    case 'jam': {
      const jam = new JamMachine(cell.base)
      jam.crop = cell.crop
      jam.variety = cell.variety
      jam.quality = cell.quality
      jam.fruit = cell.fruit
      jam.sugar = cell.sugar
      jam.progress = cell.progress
      jam.inn = cell.inn
      return jam
    }
    case 'still': {
      const still = new PotStill(cell.base)
      still.feed = cell.feed.map(f => ({ ...f }))
      still.progress = cell.progress
      still.n = cell.n
      still.inn = cell.inn
      return still
    }
    case 'furnace': {
      const furnace = new Furnace(cell.base)
      furnace.units = cell.units
      furnace.progress = cell.progress
      furnace.inn = cell.inn
      furnace.out = cell.out
      furnace.hold = cell.hold
      return furnace
    }
    case 'station': {
      const station = new ResearchStation(cell.base)
      station.crop = cell.crop
      station.variety = cell.variety
      station.quality = cell.quality
      station.units = cell.units
      station.progress = cell.progress
      station.inn = cell.inn
      return station
    }
    case 'barrel': {
      const barrel = new Barrel(cell.base)
      barrel.crop = cell.crop
      barrel.feed = cell.feed.map(f => ({ ...f }))
      barrel.age = cell.age
      barrel.n = cell.n
      return barrel
    }
    case 'freezer': {
      const freezer = new Freezer(cell.base, cell.slots.length)
      for (let i = 0; i < cell.slots.length; i++) freezer.slots[i] = cell.slots[i]
      freezer.out = cell.out
      freezer.hold = cell.hold
      return freezer
    }
    case 'hangar':
      return new Hangar(cell.base)
    case 'silo-seed':
      return new SiloSeed(cell.base)
    case 'silo-spray':
      return new SiloSpray(cell.base)
    case 'silo-produce':
      return new SiloProduce(cell.base)
    case 'truck':
      return new Truck(cell.base)
    case 'lever': {
      const made = new Lever(cell.base)
      made.on = cell.on
      made.inn = cell.inn
      made.prev = cell.prev
      made.out = cell.out
      return made
    }
    case 'button': {
      const made = new Button(cell.base)
      made.left = cell.left
      made.out = cell.out
      return made
    }
    case 'lamp': {
      const made = new Lamp(cell.base)
      made.inn = cell.inn
      return made
    }
    case 'or': {
      const made = new OrGate(cell.base)
      made.out = cell.out
      return made
    }
    case 'and': {
      const made = new AndGate(cell.base)
      made.out = cell.out
      return made
    }
    case 'not': {
      const made = new NotGate(cell.base)
      made.out = cell.out
      return made
    }
    case 'pulser': {
      const made = new Pulser(cell.base)
      made.inn = cell.inn
      made.prev = cell.prev
      made.out = cell.out
      return made
    }
    case 'counter': {
      const made = new Counter(cell.base)
      made.inn = cell.inn
      made.n = cell.n
      made.count = cell.count
      made.out = cell.out
      return made
    }
    case 'sensor-water': {
      const made = new WaterSensor(cell.base)
      made.wilt = cell.wilt
      made.over = cell.over
      made.out = cell.out
      made.hold = cell.hold
      return made
    }
    case 'sensor-fert': {
      const made = new FertSensor(cell.base)
      made.out = cell.out
      made.hold = cell.hold
      return made
    }
    case 'sensor-harvest': {
      const made = new HarvestSensor(cell.base)
      made.mode = cell.mode
      made.out = cell.out
      made.hold = cell.hold
      return made
    }
    case 'sensor-day': {
      const made = new DaySensor(cell.base)
      made.sunrise = cell.sunrise
      made.day = cell.day
      made.sunset = cell.sunset
      made.twilight = cell.twilight
      made.out = cell.out
      made.hold = cell.hold
      return made
    }
    case 'water-system': {
      const made = new WaterSystem(cell.base)
      made.out = cell.out
      made.hold = cell.hold
      return made
    }
    case 'vehicle-detector': {
      const made = new VehicleSensor(cell.base)
      made.out = cell.out
      made.hold = cell.hold
      return made
    }
    case 'traffic-light': {
      const made = new TrafficLight(cell.base)
      made.inn = cell.inn
      made.out = cell.out
      made.hold = cell.hold
      return made
    }
  }
}

function makeSoil(s: SaveSoil): Soil {
  const soil = new Soil(s.water, s.fertilizer, s.weedChance)
  soil.bio = s.bio
  return soil
}

function makePlant(p: SavePlant): Plant {
  const plant = new Plant(p.crop, p.variety, p.quality)
  plant.maturity = p.maturity
  plant.freshness = p.freshness
  plant.happiness = p.happiness
  plant.bio = p.bio
  plant.tended = p.tended
  return plant
}

function liveVehicle(v: SaveVehicle): Vehicle {
  const pose = v.pose.kind === 'stored' ? { kind: 'stored' as const, hangar: { ...v.pose.hangar } } : { ...v.pose }
  const made = v.kind === 'quad' ? makeQuad(v.id, v.fuel, v.slots.slice(), pose) : makeTractor(v.id, v.fuel, v.hitch, v.boom, pose)
  made.route = v.route
  made.cursor = v.cursor
  made.running = v.running
  made.dwell = v.dwell
  return made
}

function liveTrailer(t: SaveTrailer): Trailer {
  const pose = t.pose.kind === 'stored' ? { kind: 'stored' as const, hangar: { ...t.pose.hangar } } : { ...t.pose }
  if (t.kind === 'seed') return { kind: 'seed', id: t.id, pose, hopper: t.hopper }
  if (t.kind === 'spray') return { kind: 'spray', id: t.id, pose, hopper: t.hopper }
  return { kind: 'harvest', id: t.id, pose, slots: t.slots.slice() }
}

function liveContracts(s: SaveContracts, rep: number, repDay: number): Contracts {
  return {
    active: s.active.map(a => ({
      offer: a.offer,
      dueDay: a.dueDay,
      bins: a.bins as unknown as Bins,
    })),
    takenToday: s.takenToday.slice(),
    history: s.history.slice(),
    book: { ...s.book },
    rep,
    repDay,
  }
}
