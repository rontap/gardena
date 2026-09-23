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
  Refuel,
  Infuser,
  Necronomicon,
  WeatherStation,
  PotStill,
  Pump,
  ResearchStation,
  Sorter,
  Rock,
  SeedSilo,
  Tap,
  Well,
  Tree,
  Warehouse,
  Postbox,
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
  Button,
  Counter,
  DaySensor,
  DispatchSensor,
  FertSensor,
  HarvestSensor,
  Lamp,
  Lever,
  LogicGate,
  NotGate,
  Pulser,
  TrafficLight,
  VarietySensor,
  VehicleSensor,
  WaterSensor,
  WaterSystem,
  WeatherSensor,
} from '../sensor.ts'
import { Plant, Turf, Weed } from '../plant.ts'
import { Rng } from '../rng.ts'
import { makeTreeSoil, Soil } from '../soil.ts'
import { STALL_IDS, StallGood, type StallMap } from '../stall.ts'
import { World, type Family, type Hydrate, type Seat, type SeatId } from '../world.ts'
import { makeQuad, makeTractor, type RouteStop, type Trailer, type Vehicle } from '../feature-vehicles/vehicle.ts'
import {
  type LoadResult,
  type Save,
  type SaveCell,
  type SaveContracts,
  type SaveSkill,
  type SavePlant,
  type SaveSoil,
  type SaveTrailer,
  type SaveVehicle,
} from './save.ts'
import { GAME_VERSION } from '../version.ts'

export function parse(text: string, sink: LogSink = new MemorySink()): LoadResult {
  let save: Save
  try {
    save = JSON.parse(text) as Save
  } catch {
    return { ok: false, reason: 'unknown-format' }
  }
  if (save?.game !== 'gardena') return { ok: false, reason: 'not-gardena' }
  try {
    return { ok: true, world: worldFromSave(save, sink) }
  } catch {
    return { ok: false, reason: save.version !== GAME_VERSION ? 'version' : 'unusable' }
  }
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
    warehouse: live.warehouse,
    postbox: live.postbox,
    pumps: live.pumps,
    taps: live.taps,
    stills: live.stills,
    necronomicon: live.necronomicon,
    familiarity: save.familiarity,
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
      inventory: s.inventory,
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
    routes: save.routes.map(r => ({
      id: r.id,
      name: r.name,
      stops: r.stops.map(liveStop),
      deploy: { ...r.deploy },
      end: r.end,
    })),
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
    tally: save.tally,
    seam: { kind: 'play' },
    recaps: save.recaps,
    recapUnseen: save.recapUnseen,
    grandma: save.grandma,
    grandmaUnseen: save.grandmaUnseen,
    tutorial: save.tutorial,
    delivered: save.delivered,
    segments: save.segments,
    wells: live.wells,
    sprinklers: save.sprinklers,
    fences: save.fences,
    paving: save.paving,
    drops: save.drops,
  }
  return World.hydrate(h)
}

function makeFamily(f: Save['family']): Family {
  return { owned: new Map<SkillId, number>(f.owned.map((s: SaveSkill) => [s.id, s.tier])) }
}

function makeStallMap(s: Save['stall']): StallMap {
  const stall = {} as StallMap
  for (const id of STALL_IDS) {
    const src = s[id]
    const g = new StallGood(id)
    g.sat = src.sat
    VARIETY_IDS.forEach(r => {
      g.stock[r] = { plain: src.stock[r].plain, infused: src.stock[r].infused }
      g.worth[r] = { plain: src.worth[r].plain, infused: src.worth[r].infused }
    })
    stall[id] = g
  }
  return stall
}

function stampChunks(chunkSaves: { id: ChunkId; cells: SaveCell[][] }[]): {
  chunks: Map<string, Cell[][]>
  house: House
  warehouse: Warehouse
  postbox: Postbox
  silo: SeedSilo
  additives: AdditiveStore
  pumps: Pump[]
  taps: Tap[]
  wells: Well[]
  stills: PotStill[]
  necronomicon: Necronomicon | 'none'
  waterSystems: WaterSystem[]
  hangars: Hangar[]
  seedSilos: SiloSeed[]
  spraySilos: SiloSpray[]
  produceSilos: SiloProduce[]
} {
  const origins = new Map<string, Cell>()
  const pumps: Pump[] = []
  const taps: Tap[] = []
  const wells: Well[] = []
  const stills: PotStill[] = []
  let necronomicon: Necronomicon | 'none' = 'none'
  const waterSystems: WaterSystem[] = []
  const hangars: Hangar[] = []
  const seedSilos: SiloSeed[] = []
  const spraySilos: SiloSpray[] = []
  const produceSilos: SiloProduce[] = []
  let house!: House
  let warehouse!: Warehouse
  let postbox!: Postbox
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
        if (made.kind === 'warehouse') warehouse = made
        if (made.kind === 'postbox') postbox = made
        if (made.kind === 'seed-silo' && made.useDefault) silo = made
        if (made.kind === 'additive-store' && made.useDefault) additives = made
        if (made.kind === 'pump') pumps.push(made)
        if (made.kind === 'tap') taps.push(made)
        if (made.kind === 'well') wells.push(made)
        if (made.kind === 'still') stills.push(made)
        if (made.kind === 'necronomicon') necronomicon = made
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
  return { chunks, house, warehouse, postbox, silo, additives, pumps, taps, wells, stills, necronomicon, waterSystems, hangars, seedSilos, spraySilos, produceSilos }
}

function makeLive(cell: Exclude<SaveCell, { kind: 'occ' }>): Cell {
  switch (cell.kind) {
    case 'untilled':
      return { kind: 'untilled', ground: cell.ground, hardness: cell.hardness, cover: cell.cover }
    case 'empty':
      return { kind: 'empty', soil: makeSoil(cell.soil) }
    case 'infertile':
      return { kind: 'infertile' }
    case 'weed': {
      const weed = new Weed(cell.weed.variant)
      weed.maturity = cell.weed.maturity
      weed.spread = cell.weed.spread
      weed.readyAt = cell.weed.readyAt
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
      const tree = new Tree(
        cell.species,
        cell.base,
        makeTreeSoil(cell.soil.water, cell.soil.fertilizer, cell.soil.weedChance),
        cell.happiness,
        cell.juvenile,
        cell.fruit,
        cell.yield,
      )
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
    case 'refuel': {
      const station = new Refuel(cell.base)
      station.buy = cell.buy
      station.store = cell.store
      station.units = cell.units
      station.progress = cell.progress
      return station
    }
    case 'furnace': {
      const furnace = new Furnace(cell.base)
      furnace.recipe = cell.recipe
      furnace.quality = cell.quality
      furnace.units = cell.units
      furnace.progress = cell.progress
      furnace.inn = cell.inn
      furnace.out = cell.out
      furnace.hold = cell.hold
      return furnace
    }
    case 'weather-station':
      return new WeatherStation(cell.base)
    case 'necronomicon': {
      const book = new Necronomicon(cell.base)
      book.crop = cell.crop
      book.cropCount = cell.cropCount
      cell.fruit.forEach(c => book.fruit.push(c))
      book.ash = cell.ash
      book.gold = cell.gold
      book.agaric = cell.agaric
      book.tool = cell.tool
      cell.supper.forEach(g => book.supper.push(g))
      cell.pages.forEach(id => book.done.push(id))
      return book
    }
    case 'infuser': {
      const inf = new Infuser(cell.base)
      inf.lock = cell.lock
      inf.quality = cell.quality
      inf.unitSale = cell.unitSale
      inf.units = cell.units
      inf.flakes = cell.flakes
      inf.extract = cell.extract
      inf.progress = cell.progress
      inf.inn = cell.inn
      return inf
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
    case 'sorter': {
      const sorter = new Sorter(cell.base, cell.facing)
      sorter.held = cell.held.kind === 'hold' ? cell.held.item : 'none'
      sorter.progress = cell.progress
      return sorter
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
    case 'silo-seed': {
      const made = new SiloSeed(cell.base)
      made.restock = cell.restock
      cell.seeds.forEach(st => made.seeds.push({ ...st }))
      return made
    }
    case 'silo-spray': {
      const made = new SiloSpray(cell.base)
      made.restock = cell.restock
      cell.held.forEach(h => made.held.push({ ...h }))
      made.sugar = { ...cell.sugar }
      return made
    }
    case 'silo-produce': {
      const made = new SiloProduce(cell.base)
      cell.slots.forEach((s, i) => (made.slots[i] = s))
      return made
    }
    case 'warehouse':
      return new Warehouse(cell.base)
    case 'postbox': {
      const made = new Postbox(cell.base)
      cell.slots.forEach((s, i) => (made.slots[i] = s))
      return made
    }
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
    case 'logic': {
      const made = new LogicGate(cell.base)
      made.mode = cell.mode
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
    case 'sensor-variety': {
      const made = new VarietySensor(cell.base)
      made.baseOn = cell.baseOn
      made.variant = cell.variant
      made.heirloom = cell.heirloom
      made.out = cell.out
      made.hold = cell.hold
      return made
    }
    case 'sensor-weather': {
      const made = new WeatherSensor(cell.base)
      made.clear = cell.clear
      made.rain = cell.rain
      made.dry = cell.dry
      made.flood = cell.flood
      made.drought = cell.drought
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
      made.vehicle = cell.vehicle
      made.player = cell.player
      made.item = cell.item
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
    case 'dispatch': {
      const made = new DispatchSensor(cell.base)
      made.inn = cell.inn
      made.prev = cell.prev
      made.out = cell.out
      made.route = cell.route
      made.n = cell.n
      return made
    }
  }
}

function makeSoil(s: SaveSoil): Soil {
  return new Soil(s.water, s.fertilizer, s.weedChance)
}

function makePlant(p: SavePlant): Plant {
  const plant = new Plant(p.crop, p.variety, p.quality)
  plant.maturity = p.maturity
  plant.freshness = p.freshness
  plant.happiness = p.happiness
  plant.tended = p.tended
  return plant
}

function liveVehicle(v: SaveVehicle): Vehicle {
  const pose = v.pose.kind === 'stored' ? { kind: 'stored' as const, hangar: { ...v.pose.hangar } } : { ...v.pose }
  const carry = { route: v.route, cursor: v.cursor, running: v.running, dwell: v.dwell }
  if (v.kind === 'quad') return { ...makeQuad(v.id, v.fuel, v.slots, pose), ...carry }
  return { ...makeTractor(v.id, v.fuel, v.hitch, v.boom, pose), working: v.working, ...carry }
}

function liveStop(s: RouteStop): RouteStop {
  const at = { col: s.at.col, row: s.at.row }
  if (s.kind === 'load' || s.kind === 'unload') return { kind: s.kind, at, pick: { ...s.pick } }
  if (s.kind === 'refuel') return { kind: 'refuel', at, wait: s.wait }
  return { kind: s.kind, at }
}

function liveTrailer(t: SaveTrailer): Trailer {
  const pose = t.pose.kind === 'stored' ? { kind: 'stored' as const, hangar: { ...t.pose.hangar } } : { ...t.pose }
  if (t.kind === 'seed') return { kind: 'seed', id: t.id, pose, hopper: t.hopper }
  if (t.kind === 'spray') return { kind: 'spray', id: t.id, pose, hopper: t.hopper }
  return { kind: 'harvest', id: t.id, pose, slots: t.slots }
}

function liveContracts(s: SaveContracts, rep: number, repDay: number): Contracts {
  return {
    active: s.active.map(a => ({
      offer: a.offer,
      dueDay: a.dueDay,
      bins: a.bins.map(b => ({
        demand: b.demand,
        filled: b.filled,
        infusedFilled: b.infusedFilled,
      })) as unknown as Bins,
    })),
    takenToday: s.takenToday.slice(),
    history: s.history.slice(),
    book: { ...s.book },
    rep,
    repDay,
  }
}
