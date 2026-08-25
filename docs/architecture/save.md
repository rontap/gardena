# Save

Farm snapshot. Not `Cmd[]`. Not a replay. Join / resync uses this `Save`. [[architecture/world]] [[architecture/rng]] [[architecture/log]] [[architecture/net]] [[architecture/modules]] [[architecture/family]] [[architecture/tree]] [[plans/early-access-1]] [[plans/early-access-1.1]]

One file shape. Dump writes `game: "gardena"`, `version: 1.72`, `seats`, `vehicles`, `trailers`, `wires`, `smartHold`. Parse identity: `game === "gardena"`. `version` is the number `1.72` on dump. Wordmark **1.7.2**. `World.wires[]` already a list. Mill/jam/still `inn`; chest/freezer/seed-silo/additive-store `out` `hold`. Pulser `prev`/`out`; counter `n`/`count`/`out`; day flags + `out`/`hold`; lever `inn`/`prev`/`on`/`out`. No migrate.

## RFC — versions (active)

Active since first commit. Not 1.1-only. Not a plan.

A newer game version immediately deprecates every older save. There is no officially supported save migration, conversion, recovery, or compatibility reader. Do not add one. Do not keep `hydrate10` or any other per-version parse path.

Dump still writes `version`. Display still shows the wordmark. Storage of `version` does not change. 1.72. No migrate. 1.71 file → `'version'`.

Load **compares** file `version` to the dump number. Unequal (missing included) → `LoadFailReason 'version'`. It does not hydrate an old shape. Same number → one hydrate of the live fields. Fail → `unusable`.

## Files

| file | owns |
|---|---|
| `src/game/sim/save.ts` | `Save`, `LoadResult`, `LoadFailReason`, `SLOT_KEY`, `DOWNLOAD_NAME`, `dump`, `parse`, `readSlot`, `writeSlot`, `slotExists`, `slotStamp`. `SAVE_VERSION` 1.72 |
| `src/game/sim/world.ts` | live `World`. Does not own `Save`. Constructs live objects for parse. Not a second reader. |

Do not create `src/` here.

App holds the play `World` or none. App does not own `Save`. App calls `dump` / `parse` / slot I/O. Startup [[ui/menu]] backdrop is a separate unticked `World` (not play). `#start_now` is `new World`, not parse. `#unlockall` is `new World` then `unlockAll()`, not parse.

## Slot

```
SLOT_KEY = 'gardena-save-slot-1'
DOWNLOAD_NAME = 'gardena.json'
```

`readSlot(): string | undefined` — missing key is `undefined`, not a fail reason.

`writeSlot(save: Save): void` — `JSON.stringify(save)` at `SLOT_KEY`.

`slotExists(): boolean` — key present. Tutorial-off. Load Save enabled.

`slotStamp(): string | undefined` — `YYYY/MM/DD HH:MM` local from `savedAt` when the slot has a valid stamp. Missing key or unreadable stamp is `undefined`, not a fail reason.

## Writes

`writeSlot(dump(world))`:

- end-of-day recap (`seam` becomes recap)
- Save game
- successful upload (the reconstructed `Save`)
- host leave (MP)

Host leave and recap still `writeSlot`. Guest never `writeSlot` for a hosted farm.

Download Save writes `gardena.json`. It may also `writeSlot`.

`#start_now` and `#unlockall` do not read or write the slot.

## Load

Input is a string (slot or file). Not a `World`. Not `unknown`.

```
LoadFailReason = 'not-gardena' | 'version' | 'unusable'

LoadResult =
  | { ok: true; world: World }
  | { ok: false; reason: LoadFailReason }
```

`'version'` means file `version` ≠ dump `version`. Not a migrate. MP `reject: version` is PROTOCOL — [[architecture/net]]. Copy: [[ui/menu]].

```
parse(text: string, sink?: LogSink): LoadResult
```

1. `JSON.parse` throws, or the value is not an object → `unusable`.
2. `game` missing or not `"gardena"` → `not-gardena`. Stop.
3. File `version` ≠ dump `version` (absent or not a number included) → `version`. Stop. Do not hydrate.
4. One hydrate of the live fields (`seats`, …). No `hydrate10`. No per-version reader.
5. Hydrate fails → `unusable`. Reconstructs → `{ ok: true; world }`.

`ok: true` is a reconstructed `World`. Illegal to play a farm from a fail. Illegal to `new World(seed)` as a new farm and overlay. Hydrate is total.

After load: `World.log` empty, `sink.reset(seed)`, `World.now = 0`. Each seat: `queue` empty, actor `work = 0`, no fill, idle at saved `x,y` (at vehicle if `pose.driver` this seat), `place` `none`, `drive` `{0,0}`, `stride` `{0,0}`. `cue` `none`. `speech` `none`. `pulse` / `hud` absent. `cheatFastResearch` false. `clock.banner` 0. Every `StallGood.sat` 0. `World.contracts` empty (`active` `takenToday` `history` empty, `book` zeros).

Join / resync: `parse` then stamp `World.now` from the wire. Same `Save`. Not a second snapshot.

Camera, panels, hover, `Lens`: not in the file. New session.

## Now

`World.now` is not in the file. It is the log tick counter. [[architecture/log]]

`clock.t` is the day clock. `clock.day` is the day. Those are in the file.

## Rng

Spatial streams: seed + identity ints. No cursor in the file.

`grow` needs `ripenN`. `weed` / `grass` need `bigTicks`. `skill` needs `pickCount`. `tree` / `grind` / `still` / `barrel` / `market` / `gen` use cells, day, seed.

Seq streams: cursor in the file.

```
SaveRng = { seed: number; shop: number; fruit: number }
```

`shop` / `fruit` are `Seq` consumed counts (`n`). Hydrate sets those cursors. Next `next()` is the next roll. Do not reset to 0. Do not replay `next()` for its values.

`Math.random` only when a new farm omits seed. Parse never.

## Classes → JSON

No classes in the file. `dump` copies fields. `parse` constructs `Soil` `Plant` `Weed` `Turf` `Reservoir` `Pump` `RainTank` `Tap` `Rock` `Tree` `Chest` `Grinder` `CompostBox` `Mill` `JamMachine` `PotStill` `WineBarrel` `Freezer` `Hangar` `SiloSeed` `SiloSpray` `SiloProduce` `SeedSilo` `AdditiveStore` `Lever` `Button` `Lamp` `NotGate` `AndGate` `OrGate` `Pulser` `Counter` `WaterSensor` `FertSensor` `HarvestSensor` `DaySensor` `WaterSystem` `VehicleSensor` `Vehicle` `Trailer` `House` `Truck` `StallGood` `Clock` `Actor` `Rng` `World`.

| live | file |
|---|---|
| `Soil` | `SaveSoil` |
| `Plant` | `SavePlant` |
| `Weed` | `SaveWeed` |
| `Turf` | `SaveTurf` |
| `Reservoir.stored` | `stored` on that pump / tank / well. `kind` from `form` / `'rain-tank'` / `'well'`. Not `drawn`. |
| `Pump` | origin cell `kind: 'pump'` |
| `Well` | `wells[]` entry `{ at: Edge; stored }` — edge-based, not a cell |
| `RainTank` | origin cell `kind: 'rain-tank'` |
| `Tap` | origin cell `kind: 'tap'`. Not `drawn`. |
| `Tree` | origin cell `kind: 'tree'` |
| `Chest` | origin cell `kind: 'chest'` + `out` `hold` |
| `CompostBox` | origin cell `kind: 'compost-box'` |
| `Mill` | origin cell `kind: 'mill'` + `inn` |
| `JamMachine` | origin cell `kind: 'jam'` + `inn` |
| `PotStill` | origin cell `kind: 'still'` + `inn`. 2×1 |
| `WineBarrel` | origin cell `kind: 'barrel'` |
| `Freezer` | origin cell `kind: 'freezer'` + `out` `hold` |
| `SeedSilo` | origin cell `kind: 'seed-silo'` + `out` `hold` |
| `AdditiveStore` | origin cell `kind: 'additive-store'` + `out` `hold` |
| `Hangar` | origin cell `kind: 'hangar'` |
| `SiloSeed` | origin cell `kind: 'silo-seed'` |
| `SiloSpray` | origin cell `kind: 'silo-spray'` |
| `SiloProduce` | origin cell `kind: 'silo-produce'` |
| `Vehicle` | `Save.vehicles[]`. Not a cell |
| `Trailer` | `Save.trailers[]`. Not a cell |
| `Item` `Hand` `Slot` | as live. Already JSON. |
| `StallGood` | `SaveStallGood` per `StallGoodId` |
| `Family` maps | `owned` / `offers` arrays |
| `World.ripenN` | `{ col; row; n }[]` — only `n > 0` |
| `World.segments` | `Segment[]` |
| `World.wells` | `{ at: Edge; stored }[]` |
| `World.sprinklers` | `Sprinkler[]` |
| `World.wires` | `Wire[]` |
| `World.smartHold` | `{ e: Edge; level; hold }[]` |
| `World.fences` | `Coord[]` |
| `World.done` | `ResearchId[]` |
| `Lever` | origin cell `kind: 'lever'` + `inn` `prev` `on` `out` |
| `Button` | origin cell `kind: 'button'` |
| `Lamp` | origin cell `kind: 'lamp'` |
| `OrGate` | origin cell `kind: 'or'` |
| `AndGate` | origin cell `kind: 'and'` |
| `NotGate` | origin cell `kind: 'not'` |
| `Pulser` | origin cell `kind: 'pulser'` + `inn` `prev` `out` |
| `Counter` | origin cell `kind: 'counter'` + `inn` `n` `count` `out` |
| `WaterSensor` | origin cell `kind: 'sensor-water'` |
| `FertSensor` | origin cell `kind: 'sensor-fert'` |
| `HarvestSensor` | origin cell `kind: 'sensor-harvest'` |
| `DaySensor` | origin cell `kind: 'sensor-day'` + flags `out` `hold` |
| `WaterSystem` | origin cell `kind: 'water-system'` |
| `VehicleSensor` | origin cell `kind: 'vehicle-detector'` |

Multi-cell: one instance. Origin is rect `{ col: base.col, row: base.row }`. Circle starter pump: its occupied cell. Origin cell holds the object. Every other occupied cell `{ kind: 'occ'; of: Coord }` with world origin. Hydrate stamps that same instance. `World.house` / `truck` / `pumps` / `tanks` / `taps` / `stills` / `waterSystems` / `hangars` / `seedSilos` / `spraySilos` / `produceSilos` / `silo` / `additives` are those instances. `World.vehicles` from `Save.vehicles`. `World.nextVehicleId` from `Save.nextVehicleId`. `World.trailers` from `Save.trailers`. `World.nextTrailerId` from `Save.nextTrailerId`. `World.wires` from `Save.wires`.

`modifiers` not in the file. Rebuild from owned `better-*` (`source: 'skill'`). `netVerts`, nets, `live`: rebuild. `purchases` is in the file.

## Save

Closed. No `Partial`. No optional that means unsure. `game` and `version` required. Dump always writes this type. Dump writes `version: 1.72`, `seats`, `vehicles`, `trailers`, `wires`, `smartHold`.

```
SaveSeat = {
  playerId: PlayerId
  presence: Presence
  actor: { x: number; y: number }
  hand: Hand
  inventory: Slot[]
}

SaveVehicle =
  | {
      kind: 'quad'
      id: VehicleId
      fuel: number
      slots: Slot[]
      pose:
        | { kind: 'stored'; hangar: Coord }
        | { kind: 'field'; x: number; y: number; heading: number; speed: number; driver: SeatId | 'none' }
    }
  | {
      kind: 'tractor'
      id: VehicleId
      fuel: number
      hitch: TrailerId | 'none'
      boom: 3 | 5
      pose:
        | { kind: 'stored'; hangar: Coord }
        | { kind: 'field'; x: number; y: number; heading: number; speed: number; driver: SeatId | 'none' }
    }

SaveTrailer =
  | {
      kind: 'seed'
      id: TrailerId
      pose:
        | { kind: 'stored'; hangar: Coord }
        | { kind: 'attached'; vehicle: VehicleId; heading: number }
      hopper: SeedHopper
    }
  | {
      kind: 'spray'
      id: TrailerId
      pose:
        | { kind: 'stored'; hangar: Coord }
        | { kind: 'attached'; vehicle: VehicleId; heading: number }
      hopper: SprayHopper
    }
  | {
      kind: 'harvest'
      id: TrailerId
      pose:
        | { kind: 'stored'; hangar: Coord }
        | { kind: 'attached'; vehicle: VehicleId; heading: number }
      slots: Slot[]
    }

Save = {
  game: 'gardena'
  version: 1.72
  rng: SaveRng
  clock: { day: number; t: number }
  money: number
  purchases: number
  digs: number
  mines: number
  bigTicks: number
  seats: SaveSeat[]
  vehicles: SaveVehicle[]
  nextVehicleId: VehicleId
  trailers: SaveTrailer[]
  nextTrailerId: TrailerId
  done: ResearchId[]
  job: { kind: 'idle' } | { kind: 'run'; id: ResearchId; left: number }
  family: {
    player: SaveMember<PlayerSkillId>
    husband: SaveMember<HusbandSkillId>
    daughter: SaveMember<DaughterSkillId>
  }
  stall: { [K in StallGoodId]: SaveStallGood }
  tally: DayTally
  seam: Seam
  ripenN: { col: number; row: number; n: number }[]
  chunks: { id: ChunkId; cells: SaveCell[][] }[]
  segments: Segment[]
  wells: { at: Edge; stored: number }[]
  sprinklers: Sprinkler[]
  wires: Wire[]
  smartHold: { e: Edge; level: 0 | 1; hold: number }[]
  fences: Coord[]
  drops: { at: Coord; item: Item }[]
}

SaveMember<Id> = {
  points: number
  pickCount: number
  owned: { id: Id; tier: number }[]
  offers: { id: Id; tier: number }[]
}

SaveStallGood = {
  offered: number
  market: number
  target: number
  acc: number
  stock: { [K in Rarity]: { organic: number; synth: number } }
  worth: { [K in Rarity]: { organic: number; synth: number } }
}

SaveSoil = { water: number; fertilizer: number; bio: boolean; weedChance: number }

SavePlant = {
  crop: AnnualId
  rarity: Rarity
  maturity: number
  freshness: number
  happiness: number
  bio: boolean
  tended: boolean
}

SaveWeed = { variant: 0 | 1; maturity: number; spread: boolean }
SaveTurf = { variant: 0 | 1 | 2; maturity: number }

SaveCell =
  | { kind: 'untilled'; ground: Ground; cover: Cover }
  | { kind: 'empty'; soil: SaveSoil }
  | { kind: 'infertile' }
  | { kind: 'weed'; soil: SaveSoil; weed: SaveWeed }
  | { kind: 'turf'; soil: SaveSoil; turf: SaveTurf }
  | { kind: 'growing'; soil: SaveSoil; plant: SavePlant }
  | { kind: 'ripe'; soil: SaveSoil; plant: SavePlant }
  | { kind: 'dead'; soil: SaveSoil; plant: SavePlant }
  | { kind: 'rotten'; soil: SaveSoil; crop: CropId }
  | { kind: 'house'; base: RectBase }
  | { kind: 'pump'; form: 'starter' | 'jack'; base: Base; stored: number }
  | { kind: 'rain-tank'; base: RectBase; stored: number }
  | { kind: 'tap'; base: RectBase }
  | { kind: 'rock'; base: RectBase }
  | { kind: 'tree'; species: TreeId; base: RectBase; juvenile: number; fruit: number; yield: TreeYield }
  | { kind: 'chest'; base: RectBase; slots: Slot[]; out: 0 | 1; hold: number }
  | { kind: 'grinder'; base: RectBase }
  | { kind: 'compost-box'; base: RectBase; units: number; progress: number }
  | { kind: 'mill'; base: RectBase; recipe: MillRecipe | 'none'; units: number; progress: number; inn: 0 | 1 }
  | { kind: 'jam'; base: RectBase; crop: JamCrop | 'none'; fruit: number; sugar: number; progress: number; inn: 0 | 1 }
  | { kind: 'still'; base: RectBase; feed: { crop: StillCrop; rarity: Rarity; count: number }[]; progress: number; n: number; inn: 0 | 1 }
  | { kind: 'barrel'; base: RectBase; feed: { rarity: Rarity; count: number }[]; age: number; n: number }
  | { kind: 'freezer'; base: RectBase; slots: Slot[]; out: 0 | 1; hold: number }
  | { kind: 'hangar'; base: RectBase }
  | { kind: 'silo-seed'; base: RectBase }
  | { kind: 'silo-spray'; base: RectBase }
  | { kind: 'silo-produce'; base: RectBase }
  | { kind: 'seed-silo'; base: RectBase; useDefault: boolean; seeds: SiloStack[]; out: 0 | 1; hold: number }
  | { kind: 'additive-store'; base: RectBase; useDefault: boolean; held: AdditiveHold[]; out: 0 | 1; hold: number }
  | { kind: 'truck'; base: RectBase }
  | { kind: 'lever'; base: RectBase; on: boolean; inn: 0 | 1; prev: 0 | 1; out: 0 | 1 }
  | { kind: 'button'; base: RectBase; left: number; out: 0 | 1 }
  | { kind: 'lamp'; base: RectBase; inn: 0 | 1 }
  | { kind: 'or'; base: RectBase; out: 0 | 1 }
  | { kind: 'and'; base: RectBase; out: 0 | 1 }
  | { kind: 'not'; base: RectBase; out: 0 | 1 }
  | { kind: 'pulser'; base: RectBase; inn: 0 | 1; prev: 0 | 1; out: 0 | 1 }
  | { kind: 'counter'; base: RectBase; inn: 0 | 1; n: number; count: number; out: 0 | 1 }
  | { kind: 'sensor-water'; base: RectBase; wilt: boolean; over: boolean; out: 0 | 1; hold: number }
  | { kind: 'sensor-fert'; base: RectBase; out: 0 | 1; hold: number }
  | { kind: 'sensor-harvest'; base: RectBase; mode: 'any' | 'all'; out: 0 | 1; hold: number }
  | { kind: 'sensor-day'; base: RectBase; sunrise: boolean; day: boolean; sunset: boolean; twilight: boolean; out: 0 | 1; hold: number }
  | { kind: 'water-system'; base: RectBase; out: 0 | 1; hold: number }
  | { kind: 'vehicle-detector'; base: RectBase; out: 0 | 1; hold: number }
  | { kind: 'occ'; of: Coord }
```

`seats` length ≥ 1. Seat 0 = host / solo. Each `inventory` length 16. `place` and `queue` not in the file. Chest `slots` length `CHEST_SLOTS`. Freezer `slots` length `FREEZER_SLOTS`. Quad `slots` length `VEHICLE_SLOTS`. Harvest trailer `slots` length `HARVEST_SLOTS`. Each `chunks[].cells` is `CHUNK` × `CHUNK`, local `[row][col]`. `chunks` order is `World.owned` order. `stall` is a complete `StallGoodId` map. `vehicles` is every live `Vehicle`. `nextVehicleId` is the next id to mint. `trailers` is every live `Trailer`. `nextTrailerId` is the next id to mint.

`version: 1.72` is a number. JSON `1.72` is that number. Dump writes it. Parse compares it to the dump number and stops on mismatch. It does not pick a reader from it. 1.71 file → `'version'`. No migrate. Still `base.w = 2` `base.h = 1`. Prop `48×24` occupying both cells.

`savedAt` is ISO-8601 from `dump` (`Date.toISOString()`). Wall clock when the snapshot was written. Not farm time. Not in `World`.

## Not in the file

`Cmd[]`. `Cmd.p`. `World.now`. `queue`. `workLeft` / `workTotal` / `filling` / `legStart`. `place` `cue` `speech` `pulse` `hud`. `Seat.drive`. `Seat.stride`. `clock.banner`. `cheatFastResearch`. `StallGood.sat`. `World.contracts`. `consignRevision`. `groundRev`. `bigAcc`. `modifiers`. `netVerts` / nets. `Reservoir.drawn` / `Tap.drawn`. Camera, camera follow, panels, hover, lens, hangar select. Pause net flag. Load Drive `{0,0}`. Restore `pose.driver`; actor at vehicle if driver.

Live `sat` is not in the file. Live `Contracts` is not in the file. Dump tally / recap omit `contracts`. Parse hydrates `tally.contracts` / `Recap.contracts` `[]`. `SAVE_VERSION` stays 1.72. Dump still writes dummy `offered` `market` `target` `acc` so parse of 1.72 still hydrates. Parse does not copy them. Load → `sat` 0, `contracts` empty. New farm → `sat` 0, `contracts` empty. Digest includes `sat` and active contracts — [[architecture/net]]. Assumption: dummy dump values are 0.

## Illegal

- classes in the file
- `Partial<Save>`
- optional that means unsure
- App owning `Save`
- a second snapshot type
- a second reader
- `hydrate10` or any migrate / conversion / recovery of an older save
- picking a parse path from `rec.version`
- hydrating when file `version` ≠ dump `version`
- root `actor` / `hand` / `inventory` as a parse path
- `Cmd[]` as the save
- `World.now` in the file
- Seq `shop` / `fruit` cursors omitted
- `ripenN` omitted (absent cell = 0)
- `bigTicks` omitted
- `pickCount` / offers omitted
- starting a `World` from a fail
- `new World(seed)` new-farm then overlay
- parse calling `Math.random`
- walk queue after load
- gardener working after load
- `Plant.crop` not `AnnualId`
- `Tree.species` not `TreeId`
- `occ` with no origin object
- two live instances for one multi-cell building
- stall missing a `StallGoodId`
- inventory length ≠ 16
- `seats` length < 1
- dump with `actor` / `hand` / `inventory` instead of `seats`
- guest `writeSlot` for a hosted farm
- chest slots length ≠ `CHEST_SLOTS`
- freezer slots length ≠ `FREEZER_SLOTS`
- quad slots length ≠ `VEHICLE_SLOTS`
- harvest slots length ≠ `HARVEST_SLOTS`
- `vehicles` omitted
- `nextVehicleId` omitted
- `trailers` omitted
- `nextTrailerId` omitted
- `wires` omitted
- `smartHold` omitted
- mill/jam/still `inn` omitted
- chest/freezer/seed-silo/additive-store `out` `hold` omitted
- still `w ≠ 2` or `h ≠ 1`
- stored + driver
- quad hitch / tractor slots
- quad boom / boom other than `3 | 5`
- tractor `boom` omitted
- stored tractor hitch ≠ `'none'`
- trailer attached + stored
- live `sat` in the file
- live `Contracts` in the file
- `Soil.weedChance` omitted
- `Weed.spread` omitted
- `sugar.count`
- chunk grid not `CHUNK` × `CHUNK`
- UI copy in this note
