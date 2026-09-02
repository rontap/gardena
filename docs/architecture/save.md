# Save

Farm snapshot. Not `Cmd[]`. Not a replay. Join / resync uses this `Save`. Type: `sim/save.ts`. Live world: [[architecture/world]]. Log: [[architecture/log]]. Net: [[architecture/net]].

Parse identity: `game === "gardena"`. File `version` is the dump number. Dump identity is [[GLOBAL_VERSION]]. `World.wires[]` already a list. Mill/jam/still `inn`; grinder hopper `crop`/`rarity`/`units`/`progress`/`n`; chest/freezer/seed-silo/additive-store `out` `hold`. Pulser `prev`/`out`; counter `n`/`count`/`out`; day flags + `out`/`hold`; lever `inn`/`prev`/`on`/`out`; traffic-light `inn`/`out`/`hold`. `World.routes` `World.nextRouteId`; per vehicle `route`/`cursor`/`running`/`dwell`.

## RFC — versions (active)

A newer game version immediately deprecates every older save. There is no officially supported save migration, conversion, recovery, or compatibility reader. Do not add one. Do not keep `hydrate10` or any other per-version parse path.

Dump still writes `version`. Display still shows the wordmark. Storage of `version` does not change. Notes never write those digits; they [[GLOBAL_VERSION]].

Load **compares** file `version` to the dump number. Unequal (missing included) → `LoadFailReason 'version'`. It does not hydrate an old shape. Same number → one hydrate of the live fields. Fail → `unusable`.

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

After load: `World.log` empty, `sink.reset(seed)`, `World.now = 0`. Each seat: `queue` empty, actor `work = 0`, no fill, idle at saved `x,y` (at vehicle if `pose.driver` this seat), `place` `none`, `drive` `{0,0}`, `stride` `{0,0}`. `cue` `none`. `speech` `none`. `hud` absent. No `World.pulse`. `cheatFastResearch` false. `clock.banner` 0. Every `StallGood.sat` 0. `World.contracts` from the file (`active`, `takenToday`, `history`, `book`, plus top-level `rep` / `repDay`). Tally / recap `contracts` arrays hydrate empty.

Join / resync: `parse` then stamp `World.now` from the wire. Same `Save`. Not a second snapshot.

Camera, panels, hover, `Lens`, App overlay pause: not in the file. New session. Pause net flag not in the file.

## Now

`World.now` is not in the file. It is the log tick counter. [[architecture/log]]

`clock.t` is the day clock. `clock.day` is the day. Those are in the file.

## Rng

Spatial streams: seed + identity ints. No cursor in the file.

`grow` needs `ripenN`. `weed` / `grass` need `bigTicks`. `skill` needs `pickCount`. `tree` / `grind` / `still` / `barrel` / `market` / `gen` use cells, day, seed.

Seq streams: cursor in the file. `SaveRng = { seed; shop; fruit }`. `shop` / `fruit` are `Seq` consumed counts (`n`). Hydrate sets those cursors. Next `next()` is the next roll. Do not reset to 0. Do not replay `next()` for its values.

`Math.random` only when a new farm omits seed. Parse never.

## Classes → JSON

No classes in the file. `dump` copies fields. `parse` constructs live objects. Shape: `sim/save.ts`.

Multi-cell: one instance. Origin is rect `{ col: base.col, row: base.row }`. Circle starter pump: its occupied cell. Origin cell holds the object. Every other occupied cell `{ kind: 'occ'; of: Coord }` with world origin. Hydrate stamps that same instance. `World.house` / `truck` / `pumps` / `tanks` / `taps` / `stills` / `waterSystems` / `hangars` / `seedSilos` / `spraySilos` / `produceSilos` / `silo` / `additives` are those instances. `World.vehicles` from `Save.vehicles`. `World.nextVehicleId` from `Save.nextVehicleId`. `World.trailers` from `Save.trailers`. `World.nextTrailerId` from `Save.nextTrailerId`. `World.routes` from `Save.routes`. `World.nextRouteId` from `Save.nextRouteId`. `World.wires` from `Save.wires`.

`modifiers` not in the file. Rebuild from owned `better-*` (`source: 'skill'`). `netVerts`, nets, `live`, indexes: rebuild (`indexAll`). `purchases` is in the file.

Closed. No `Partial`. No optional that means unsure. `game` and `version` required. Dump always writes this type. Dump writes `seats`, `vehicles`, `trailers`, `routes`, `wires`, `smartHold`.

`seats` length ≥ 1. Seat 0 = host / solo. Each `inventory` length 16. `place` and `queue` not in the file. Chest `slots` length `CHEST_SLOTS`. Freezer `slots` length `FREEZER_SLOTS`. Quad `slots` length `VEHICLE_SLOTS`. Harvest trailer `slots` length `HARVEST_SLOTS`. Each `chunks[].cells` is `CHUNK` × `CHUNK`, local `[row][col]`. `chunks` order is `World.owned` order. `stall` is a complete `StallGoodId` map. `vehicles` is every live `Vehicle` including `route` / `cursor` / `running`. `nextVehicleId` is the next id to mint. `trailers` is every live `Trailer`. `nextTrailerId` is the next id to mint. `routes` is every live `Route`. `nextRouteId` is the next id to mint.

`savedAt` is ISO-8601 from `dump` (`Date.toISOString()`). Wall clock when the snapshot was written. Not farm time. Not in `World`.

## Not in the file

`Cmd[]`. `Cmd.p`. `World.now`. `queue`. `workLeft` / `workTotal` / `filling` / `legStart`. `place` `cue` `speech` `hud`. `Seat.drive`. `Seat.stride`. `clock.banner`. `cheatFastResearch`. `StallGood.sat`. Board. `consignRevision`. `groundRev`. `bigAcc`. `modifiers`. `netVerts` / nets. Indexes (`grow` `machines` `stores` `sensors` `buttons` `recover` `empty`) — `indexAll`. `Reservoir.drawn` / `Tap.drawn`. Camera, camera follow, panels, hover, lens, hangar select, Dash Automate, editor open. Pause net flag. Load Drive `{0,0}`. Restore `pose.driver`; actor at vehicle if driver. Restore `route` / `cursor` / `running`. No `World.pulse`.

Live `sat` is not in the file. Load → `sat` 0. New farm → `sat` 0. Dump stall writes dummy `offered` `market` `target` `acc`; parse does not copy them. `World.contracts` is in the file — [[mechanics/contracts]]. Digest includes `sat` and active contracts — [[architecture/net]].

Working notes never write version digits; they [[GLOBAL_VERSION]].

## Invariants

`save.parse` — `parse(text)`: `JSON.parse` throw or non-object → `{ ok: false, reason: 'unusable' }`. `game !== "gardena"` → `reason: 'not-gardena'`. File `version` ≠ dump `version` (absent included) → `reason: 'version'`. Else one hydrate of live fields including `seats`. Reconstruct → `{ ok: true, world }`. Hydrate fail → `reason: 'unusable'`. No migrate. `LoadFailReason` is `'not-gardena' | 'version' | 'unusable'`.

`save.nomigrate` — Parse identity: `game === "gardena"`. File `version` ≠ dump `version` (absent included) → `reason: 'version'`. No migrate. Dump identity is [[GLOBAL_VERSION]]. Dump persists: `seats`, `vehicles`, `trailers`, `routes`, `nextRouteId`, hangar/silo cells, `wires`, sensor cells, mill/jam/still `inn`, grinder `crop`/`rarity`/`units`/`progress`/`n`, chest/freezer/seed-silo/additive-store `out` `hold`, pulser `prev`/`out`, counter `n`/`count`/`out`, day flags/`out`/`hold`, lever `inn`/`prev`/`on`/`out`, traffic-light `inn`/`out`/`hold`, per vehicle `route`/`cursor`/`running`/`dwell`, `Soil.weedChance`, `Weed.spread`, tractor `boom`, `Item` `weed-spray`, `contracts` (`active`, `takenToday`, `history`, `book`) plus `rep` / `repDay`. `Seat.stride` not in the file. Board not in the file. Machine chest links are not in the file. Illegal: `{ kind: 'box' }`.

Assumption: a [[GLOBAL_VERSION]] farm whose dump lacks `routes` / vehicle `route` / traffic-light fields fails hydrate (`unusable`). No migrate.
