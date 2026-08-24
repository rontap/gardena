# World

Types as they run. Illegal states are unrepresentable. Coders do not runtime-check these.

Owners: [[architecture/modules]].

## Ids

`sim/ids.ts`.

```
AnnualId =
  | 'carrot' | 'potato' | 'wheat' | 'tomato' | 'raspberry'
  | 'watermelon' | 'olive' | 'grape' | 'vanilla' | 'sugar-cane'

TreeId = 'apple' | 'apricot' | 'lemon' | 'cherry'

CropId = AnnualId | TreeId

SpiritKind = 'vodka' | 'beer' | 'brandy' | 'mixed'
JamCrop = 'apricot' | 'grape' | 'raspberry' | 'apple' | 'cherry' | 'tomato'
StillCrop = 'potato' | 'wheat' | 'apricot'
MillRecipe = 'sugar-cane' | 'olive' | 'wheat' | 'grass'
JamId = `jam-${JamCrop}`

StallGoodId =
  | CropId
  | 'sugar'
  | SpiritKind
  | 'wine'
  | JamId
  | 'oil'
  | 'flour'
  | 'extract'
```

Illegal: `Plant` with `TreeId`. Illegal: `Tree` with `AnnualId`. Illegal: `seeds.crop` not `AnnualId`. Illegal: `'berry'`. No `'berry'` on `StallGoodId`. Sugar-cane fruit is a stall good. Illegal: whisky. Illegal: `sugar.count`.

`ResearchId` += `unlock-grape` `unlock-olive` `unlock-fermentation` `unlock-preservatives` `unlock-vehicles` `unlock-sensors` `unlock-smart-irrigation`. No `unlock-vanilla`. No `unlock-mill` `unlock-jam` `unlock-still` `unlock-barrel` `unlock-freezer`. No Advanced signalling. No germ / weather research.

`SkuId` += `pack-grape` `pack-olive` `pack-vanilla` `pack-sugar-cane` `buy-mill` `buy-jam` `buy-still` `buy-barrel` `buy-freezer` `buy-sugar` `buy-hangar` `buy-silo-seed` `buy-silo-spray` `buy-silo-produce` `buy-lever` `buy-button` `buy-lamp` `buy-or` `buy-and` `buy-not` `buy-sensor-water` `buy-sensor-fert` `buy-sensor-harvest` `buy-water-system` `buy-smart-valve` `buy-vehicle-detector`. No Quad SKU. No tractor SKU. No trailer SKU. No germ SKU. No weather SKU. No wire SKU.

```
SensorKind =
  | 'lever' | 'button' | 'lamp' | 'or' | 'and' | 'not'
  | 'sensor-water' | 'sensor-fert' | 'sensor-harvest'
  | 'water-system' | 'vehicle-detector'

Signal = 0 | 1
```

[[mechanics/sensors]].

```
VehicleKind = 'quad' | 'tractor'
VehicleId = number
VehicleSlot = 0 | 1 | 2 | 3 | 4 | 5
TrailerKind = 'seed' | 'spray' | 'harvest'
TrailerId = number
HarvestSlot = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
Drive = { throttle: -1 | 0 | 1; steer: -1 | 0 | 1 }
```

[[mechanics/vehicles]].

[[architecture/tree]] `TreeId`. [[architecture/family]] `PlayerSkillId`.

## Seats

```
SeatId = 0 | 1 | 2 | 3
Presence = 'in' | 'away'
PlayerId = string

Seat = {
  id: SeatId
  playerId: PlayerId
  actor: Actor
  hand: Hand
  inventory: Slot[]
  queue: Intent[]
  presence: Presence
  place: Place
  drive: Drive
}
```

`World.seats: Seat[]`. Length 1..4. Index 0 is always the host / solo player. Each `inventory` length 16.

No `World.actor` / `hand` / `inventory` / `queue` / `place`.

`App.local: SeatId` is who this page is. Solo and tests: one in-seat, `local === 0`.

`apply(cmd)` mutates `seats[cmd.p]`. `tick` walks every `presence === 'in'` seat. Away: skip that actor walk/work and that seat hand/inventory freshness. Seat stays in `seats`. Freezer slots skip `tickFreshness`. [[mechanics/multiplayer]]

Assumption: walk/work transients (`workLeft`, `workTotal`, `filling`, `legStart`) live on the seat, not `World`.

## Cell

```
Cell =
  | Plot
  | House
  | Pump
  | RainTank
  | Tap
  | Rock
  | Tree
  | Chest
  | Grinder
  | CompostBox
  | Truck
  | Mill
  | JamMachine
  | PotStill
  | WineBarrel
  | Freezer
  | Hangar
  | SiloSeed
  | SiloSpray
  | SiloProduce
  | Sensor
```

`isPlot` / `isSolid` split that union. A pipe, sprinkler, wire, or smart valve is not a `Cell`. `isSolid` += mill jam still barrel freezer hangar `silo-seed` `silo-spray` `silo-produce` every `SensorKind`. Sensor cells sunk; vehicles `SURFACE_SLOW`.

Multi-cell buildings store **the same instance** in every occupied cell: `House`, starter `Pump`, pumpjack, `RainTank`, `Truck`, `Tree`, `Hangar`, `SiloSeed`, `SiloSpray`, `SiloProduce`. Interact on any occupied cell; it is one object. [[architecture/tree]] for the 1×2 tree. Hangar 3×2. Vehicle silos 2×3.

Illegal: `Shrub`. Illegal: `AppleTree`.

`House`, starter pump (`form: 'starter'`), `Truck` are not delete targets.

`Pump.water` and `RainTank.water` are required `Reservoir`. `Tap` has no reservoir; it draws from `Net`.

`World.pumps` / `World.tanks` / `World.taps` / `World.stills` / `World.waterSystems` hold those same instances for the water grid. Still and water-system join like tap. `World.hangars` / `World.seedSilos` / `World.spraySilos` / `World.produceSilos` / `World.vehicles` / `World.trailers` — [[mechanics/vehicles]]. `World.wires` — [[mechanics/sensors]].

```
Net = { sources: Reservoir[]; sprinklers: Sprinkler[]; taps: Tap[]; stills: PotStill[]; waterSystems: WaterSystem[] }
```

```
Mill = { kind: 'mill'; base: RectBase; recipe: MillRecipe | 'none'; units: number; progress: number }
JamMachine = { kind: 'jam'; base: RectBase; crop: JamCrop | 'none'; fruit: number; sugar: number; progress: number }
PotStill = { kind: 'still'; base: RectBase; feed: { crop: StillCrop; rarity: Rarity; count: number }[]; progress: number; n: number }
WineBarrel = { kind: 'barrel'; base: RectBase; feed: { rarity: Rarity; count: number }[]; age: number; n: number }
Freezer = { kind: 'freezer'; base: RectBase; slots: Slot[] }
```

`Freezer.slots` length `FREEZER_SLOTS` 6. Rules: [[mechanics/machines]].

```
WireEnd =
  | { kind: 'cell'; at: Coord; port: 'out' | 'in' | 'in-l' | 'in-r' }
  | { kind: 'sprinkler'; at: Vertex; port: 'in' }
  | { kind: 'valve'; e: Edge; port: 'in' }

Wire = { from: WireEnd; to: WireEnd }
```

`World.wires: Wire[]`. `{ kind: 'valve' }` is smart valve only. Port legality per device. Sensor classes live in `sim/sensor.ts` — [[mechanics/sensors]].

Sprinkler += required `inn: Signal` `hold: number` (unwired still 0; pourEligible uses wire presence). Smart-valve hold is `World.smartHold` keyed by edge, dumped as `Save.smartHold`.

```
Hangar = { kind: 'hangar'; base: RectBase }
SiloSeed = { kind: 'silo-seed'; base: RectBase }
SiloSpray = { kind: 'silo-spray'; base: RectBase }
SiloProduce = { kind: 'silo-produce'; base: RectBase }
```

Hangar `RectBase` `w = HANGAR_W` `h = HANGAR_H`. Silo `RectBase` `w = SILO_W` `h = SILO_H`. Door south. No rotate. Same instance all 6 cells. `World.hangars` / `World.seedSilos` / `World.spraySilos` / `World.produceSilos` hold those same instances. Pad is geometric, not a cell. Hangar `hangarPad`. Silos `siloPad`. [[mechanics/vehicles]].

```
VehiclePose =
  | { kind: 'stored'; hangar: Coord }
  | { kind: 'field'; x: number; y: number; heading: number; speed: number; driver: SeatId | 'none' }

TrailerPose =
  | { kind: 'stored'; hangar: Coord }
  | { kind: 'attached'; vehicle: VehicleId; heading: number }

Vehicle =
  | {
      kind: 'quad'
      id: VehicleId
      fuel: number
      slots: Slot[]
      pose: VehiclePose
    }
  | {
      kind: 'tractor'
      id: VehicleId
      fuel: number
      hitch: TrailerId | 'none'
      pose: VehiclePose
    }

SeedHopper =
  | { kind: 'empty' }
  | { kind: 'hold'; item: Extract<Item, { kind: 'seeds' }> }

SprayHopper =
  | { kind: 'empty' }
  | { kind: 'hold'; item: Extract<Item, { kind: 'fertilizer' | 'synth' | 'compost' }> }

Trailer =
  | { kind: 'seed'; id: TrailerId; pose: TrailerPose; hopper: SeedHopper }
  | { kind: 'spray'; id: TrailerId; pose: TrailerPose; hopper: SprayHopper }
  | { kind: 'harvest'; id: TrailerId; pose: TrailerPose; slots: Slot[] }
```

`World.vehicles: Vehicle[]`. `World.trailers: Trailer[]`. `World.nextVehicleId`. `World.nextTrailerId`. Quad `slots.length` `VEHICLE_SLOTS`. Harvest `slots.length` `HARVEST_SLOTS`. Fuel `0..1`. Illegal: stored + driver. Illegal: two field poses with the same `SeatId` driver. Illegal: quad hitch. Illegal: tractor slots. Illegal: two trailers on one tractor. Illegal: attached + stored. Illegal: trailer attached to missing tractor. Illegal: harvest `slots.length ≠ 8`. Illegal: seed/spray hopper holding the wrong item. Stored tractor `hitch === 'none'`.

`Seat.drive` ignored unless this seat is a driver. Seated ⇒ `queue` empty. No `Seat.dismount`. No `Dismount`.

```
Cue +=
  | { kind: 'hangar'; at: Coord }
  | { kind: 'vehicle'; id: VehicleId }
```

Hangar HUD is `Seat.cue` hangar: buy Quad / Tractor / trailers / list all owned / Deploy (stored vehicle; tractor hitch optional) / Refill. No 6-slot. No cargo. Parked HUD is `Seat.cue` vehicle: Quad 6 slots + Embark; tractor trailer cargo if hitched + Embark.

```
HudTarget =
  | { kind: 'sprinkler'; at: Vertex }
  | { kind: 'water'; at: Coord }
  | { kind: 'harvest'; at: Coord }
```

Illegal: hangar or vehicle on `HudTarget`. Hangar select is App-local. Silo walk-up is look name only — no cue. Water / harvest HUD remote, no walk.

## Plot

```
Ground = 'soft' | 'hard' | 'very-hard'

Cover =
  | { kind: 'bare' }
  | { kind: 'grass'; variant: 0 | 1 | 2 }
  | { kind: 'tile'; tile: TileId }

Plot =
  | { kind: 'untilled'; ground: Ground; cover: Cover }
  | { kind: 'empty'; soil: Soil }
  | { kind: 'infertile' }
  | { kind: 'weed'; soil: Soil; weed: Weed }
  | { kind: 'growing'; soil: Soil; plant: Plant }
  | { kind: 'ripe'; soil: Soil; plant: Plant }
  | { kind: 'dead'; soil: Soil; plant: Plant }
  | { kind: 'rotten'; soil: Soil; crop: CropId }

Tilled = Extract<Plot, { soil: Soil }>
```

`soil` is required on every tilled arm. A tilled plot without dirt cannot be written. `untilled` and `infertile` have no `soil` field.

Illegal: optional `plant` on `growing` / `ripe` / `dead`. Illegal: `Plant` on `rotten` — `crop: CropId` only. Illegal: grass as a nullable index; it is a `Cover` arm. Illegal: `untilled` without `ground` and `cover`. Illegal: `Plant.crop` not `AnnualId`.

`Plant.crop: AnnualId`. `Plant.tended: boolean` required, starts `false`. Same instance through ripe / dead. [[architecture/family]].

## Place

```
Place =
  | { kind: 'none' }
  | { kind: 'sku'; id: Exclude<SkuId, 'buy-sprinkler-vert'> }
  | { kind: 'sku'; id: 'buy-sprinkler-vert'; facing: 'ns' | 'ew' }
  | { kind: 'delete' }
  | { kind: 'wire'; from: WireEnd }

StayArmed =
  | 'buy-pipe'
  | 'buy-sprinkler'
  | 'buy-sprinkler-vert'
  | 'buy-sprinkler-large'
  | 'buy-lever' | 'buy-button' | 'buy-lamp' | 'buy-or' | 'buy-and' | 'buy-not'
  | 'buy-sensor-water' | 'buy-sensor-fert' | 'buy-sensor-harvest' | 'buy-water-system'
  | 'buy-smart-valve' | 'buy-vehicle-detector'
  | 'delete'
```

`Seat.place` is always a `Place`. No `World.place`. Place is per-seat. `Place` += `{ kind: 'wire'; from: WireEnd }`. `armWire` sets it. `buy` never arms wire.

Illegal: `facing` on any id other than `buy-sprinkler-vert`. Illegal: delete as a `SkuId`. Packs never arm — `buy` merges seeds into inventory.

`buy` sets `{ kind: 'sku'; id }` except vert, which is `{ kind: 'sku'; id: 'buy-sprinkler-vert'; facing: 'ns' }`. `armDelete()` sets `{ kind: 'delete' }`. `buy` never arms delete.

Confirm: cell buildings and item drops set `none` except StayArmed sensor cells. Pipe, valve, smart valve, sprinkler, tile, sensor cells, and delete do not.

## Intent

```
Intent =
  | { act: 'walk'; at: Coord }
  | { act: 'shovel'; at: Coord }
  | { act: 'mine'; at: Coord }
  | { act: 'plant'; at: Coord }
  | { act: 'water'; at: Coord }
  | { act: 'fertilize'; at: Coord }
  | { act: 'compost'; at: Coord }
  | { act: 'harvest'; at: Coord }
  | { act: 'fill'; at: Coord }
  | { act: 'consign' }
  | { act: 'pickup'; at: Coord }
  | { act: 'drop'; at: Coord }
  | { act: 'inventory' }
  | { act: 'chest'; at: Coord }
  | { act: 'grind'; at: Coord }
  | { act: 'still'; at: Coord }
  | { act: 'barrel'; at: Coord }
  | { act: 'jam'; at: Coord }
  | { act: 'mill'; at: Coord }
  | { act: 'hangar'; at: Coord }
  | { act: 'vehicle'; id: VehicleId }
  | { act: 'embark'; id: VehicleId }
  | { act: 'valve'; at: Coord; edge: Edge }
  | { act: 'toggle'; at: Coord }
  | { act: 'tend'; at: Coord }
```

Illegal: `at` on `consign` or `inventory`. Illegal: `edge` on any act but `valve`. Illegal: `id` on any act but `vehicle` or `embark`. `toggle` is lever / button only.

`plant` is seeds (`AnnualId`) or sapling (`TreeId`). Same act. No sapling act. [[architecture/tree]].

```
dest(consign) = PAD
dest(inventory) = DOOR
dest(vehicle) = floor of that vehicle at enqueue
dest(embark) = floor of that vehicle at enqueue
dest(toggle) = at
dest(else) = at
```

Truck cells enqueue `{ act: 'consign' }`. Yard cells are plots.

## Stall

```
StallMap = { [K in StallGoodId]: StallGood }
```

`World.stall` is a complete map. Illegal: seeds on the stall. Illegal: a missing good. Illegal: `'berry'`. Sugar-cane fruit is a stall good. Illegal: whisky.

Saleswoman `(1 + 0.02 × tier)` on every `StallGoodId`. Őstermelő `(1 + 0.05 × tier)` on `rarity === 'heirloom'` of crop fruit, spirit, wine. Not sugar / jam / oil / flour / extract. Not a `CropClass` test. [[architecture/family]].

Crop goods: stock and worth per rarity × `bio`. Illegal: fruit consign that drops `fruit.bio`.

## Hand / Item

```
Hand = { kind: 'empty' } | { kind: 'hold'; item: Item }
Slot = Hand
```

No `Item | null`. Chest slots and inventory slots are `Slot[]`.

```
{ kind: 'seeds'; crop: AnnualId; rarity: Rarity; count: number }
{ kind: 'fruit'; crop: CropId; rarity: Rarity; count: number; unitSale: number; freshness: number; bio: boolean }
{ kind: 'sapling'; tree: TreeId }
{ kind: 'sugar'; liters: number; capacityLiters: number; unitSale: number }
{ kind: 'spirit'; spirit: SpiritKind; rarity: Rarity; count: number; unitSale: number }
{ kind: 'wine'; rarity: Rarity; count: number; unitSale: number }
{ kind: 'jam'; crop: JamCrop; count: number; unitSale: number }
{ kind: 'oil'; count: number; unitSale: number }
{ kind: 'flour'; count: number; unitSale: number }
{ kind: 'extract'; count: number; unitSale: number }
```

Fruit / box fruit / grind input stay `CropId`. Sugar-cane harvests as fruit. Illegal: `sugar.count`. Illegal: whisky. Jam has no rarity. Wine age baked into `unitSale`.

Illegal: `{ kind: 'apple-tree' }` `{ kind: 'berry' }` `{ kind: 'shrub' }`. Box cargo: no berry arm. Not sugar liters. Not spirit / wine / jam / oil / flour / extract.

## Recap / Seam

```
Recap = { day; money; stipend; died; harvests; research: ResearchId[]; tax }

Seam = { kind: 'play' } | { kind: 'recap'; recap: Recap }
```

Illegal: `recipient?: MemberId` on `Recap`. Play frozen while `kind === 'recap'`. Only exit: `dismissRecap()` — grants +1 point to each member, then play. [[architecture/family]].

## Family

`World.family: Family` always. Offers, points, owned, pickCount per member. [[architecture/family]].

```
offers(member): SkillRef[]
pickSkill(member, slot): void
grantPoint(member): void
dismissRecap(): void
marketOpen(phase: DayPhase): boolean
skuPrice(id: SkuId): number
buyPacks(id): void
unlockAll(): void
cheatMoney(): void
cheatPoints(): void
toggleCheatResearch(): void
```

`offers` length 0..3. `buyPacks` is five seed packs at bulk discount. `unlockAll` still every research done, `money += 999`, job idle, and each member `points = 99`. `cheatFastResearch` multiplies job drain by 3. `cheatMoney` `+200`. `cheatPoints` `+10` each member.

## Time

`World.now: number` — integer count of `tick()` entries. Starts 0. Increments by 1 at every `tick()` entry, including recap return.

`Cmd.t` is `now` after last completed tick, before apply. `Cmd.p` is `SeatId`. Solo and tests: `p = 0`. [[architecture/log]]

Live: App accumulator fires `tick(DT_MAX)` only (`DT_MAX = 1/15`). Never a leftover. View paints every rAF. No sim interpolation. Solo and MP. Tests replay with `dt = DT_MAX`. MP: one `tick(DT_MAX)` per host bundle. [[architecture/net]]

## Log

`World.log: Cmd[]` is source of truth. In-process. Worker is an async JSON sink. It does not apply cmds. It does not own `World`. Vitest never uses a Worker.

```
dispatch(cmd): log then apply
apply(cmd): mutate seats[cmd.p] and shared farm. No log.
```

No silent flag. Replay calls `apply` only.

`ping()` coalesces: marks dirty reasons (`'act' | 'field' | 'big' | 'speech'`) and flushes subscribers once per microtask with the reason set. `'field'` means Marks/plots need React. Juvenile growth does not ping `'field'`. [[mechanics/trees]] `poured` / `sold` emit synchronously. `flushDirty()` forces a flush.

Public UI methods wrap `dispatch`. `enqueue` is a mutator (tests); UI field acts go through `click` / `clickValve`. `confirmPlace` is inside `click` — not a cmd. Map `rightClick` is a cmd.

`Seat.place` / `World.hud` / `Seat.cue` are game and are logged via the mutators that set them. Panel / camera / hover / lens / hangar select / camera follow are not. Camera follow is view-local, not `World`, not sim.

Cheats are cmds. `DYNAMIC_MARKET` stays false. `nudgeOffered` is still a cmd.

Cmd table: [[architecture/log]]. Do not restate it here.

Illegal: React owning the log. Worker applying cmds. `Cmd` missing `t`. `Cmd` missing `p`. Two meanings for one `a`. Parallel `World.actor` / `hand` / `inventory` / `queue` / `place`. Two drivers on one vehicle. Seated + walk/work queue. Stored + driver. Quad hitch. Two trailers on one tractor. Trailer attached + stored. Cycle wire. Two wires on one input. Wire into an output. Analogue signal.

## Rng

`World.rng: Rng`. `World.seed` is `rng.seed`. `Math.random` only when seed is omitted.

`World.ripenN: Map<string, number>` keyed `col,row` — per-cell ripen count `n` for grow rarity. Not a `Soil` field. Absent = 0. [[architecture/rng]]

Illegal: spatial roll without identity ints. Grow identity `(col, row, day)` without `n`. `clock.t` or `money` as entropy.

## Modifier

```
Modifier.source = 'research' | 'fertilizer' | 'skill'
```

Skill crop sale (`better-*`) is `source: 'skill'`. No bump-research modifiers.
