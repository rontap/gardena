# Log

Player commands. Not ticks. Not sim. [[architecture/world]] [[architecture/rng]] [[architecture/modules]]

Internal enabler. No player-visible change. Not save UI. Not replay viewer. Multiplayer uses this log. [[architecture/net]]

## Files

| file | owns |
|---|---|
| `src/game/sim/log.ts` | `Act`, `Cmd`, `XY`, `LogSink`, `MemorySink`, `WorkerSink`. `Act.drive` `stride` `buyVehicle` `buyTrailer` `deploy` `embark` `disembark` `dock` `swapVehicle` `swapTrailer` `refill` `setBoom` `load` `unload` `armWire` `placeWire` `placeSmartValve` `tuneWater` `tuneHarvest` `tuneCounter` `tuneDay` `acceptContract` `cancelContract` `reorderContract` |
| `src/game/sim/log.worker.ts` | worker. Holds `Cmd[]`. Does not apply. Does not own `World`. |
| `src/game/sim/world.ts` | `World.now`, `World.log`, `dispatch`, `apply`. Wrappers. |

Do not create `src/` here.

## Truth

`World.log: Cmd[]` is source of truth. In-process. Vitest never constructs a Worker, never uses `WorkerSink`, never loads `log.worker.ts`.

`World.log` retains the last 500 cmds (ring: `cmds` + `logBase`). The worker holds full history. Replay from main thread beyond 500 cmds must go through the worker `dump`. `World.logEnd` is absolute; `logSince(n)` returns retained cmds from cursor `n`, clamped to `logBase` — a clamped read means a gap; MP digest/resync covers it.

Worker is an async JSON copy. Main thread owns `World`.

React does not own the log. App holds `World` or none. Panel open/close, camera, hover, `Lens` are view-local and not logged.

## Sink

```
LogSink = { push(cmd: Cmd): void; reset(seed: number): void }
```

`MemorySink.cmds: Cmd[]`. `push` appends. `reset` clears.

`WorkerSink` `postMessage`s. One worker for the page. Spawned in `src/main.tsx` at startup. React does not create or kill it. `terminate()` exists for Vite HMR dispose only. Worker file `src/game/sim/log.worker.ts`. Vitest never loads `main.tsx`.

```
WorkerIn =
  | { kind: 'cmd'; cmd: Cmd }
  | { kind: 'reset'; seed: number }
  | { kind: 'dump' }
```

`dump` replies with `Cmd[]`.

Default sink: `MemorySink`. App may pass `WorkerSink`. `reset(seed)` on construct after seed is chosen.

## Dispatch

No silent flag.

```
dispatch(cmd): this.log.push(cmd); this.sink.push(cmd); return apply(cmd)
apply(cmd): mutate seats[cmd.p] and shared farm. No log. No sink.
```

Replay calls `apply` only.

`dispatch` stamps `t = World.now` on the cmd the wrapper builds. Callers do not pick `t`. Every `Cmd` has required `p: SeatId`. Solo and tests: `p = 0`. Host sequencer sets guest `p` from that connection's seat. `p` is not in `Save`.

## Wrappers vs mutators

Public UI methods wrap `dispatch` so call sites stay:

`click` `clickValve` `buy` `buyPacks` `placePipe` `placeSprinkler` `deletePipe` `deleteSprinkler` `deleteBuilding` `expand` `startResearch` `pickSkill` `sellAll` `nudgeOffered` `swap` `swapChest` `tuneSprinkler` `openHud` `closeHud` `armDelete` `cancelPlace` `rotatePlace` `dismissRecap` `ackCue` `rightClick` `unlockAll` `cheatMoney` `cheatPoints` `toggleCheatResearch` `drive` `stride` `buyVehicle` `buyTrailer` `deploy` `embark` `disembark` `dock` `swapVehicle` `swapTrailer` `refill` `setBoom` `load` `unload` `armWire` `placeWire` `placeSmartValve` `deleteWire` `tuneWater` `tuneHarvest` `tuneCounter` `tuneDay` `acceptContract` `cancelContract` `reorderContract`

`enqueue` is a mutator. Tests call it. `apply` of `click` / `clickValve` / `rightClick` (drop) calls `enqueue`. It does not wrap `dispatch`.

`confirmPlace` is a mutator. Not a cmd. `apply(click)` calls it when prompt is place (buildings, tiles, fence, item drops, cell delete). Tests may call it. Unlogged.

`toggleValve` is actor work from a valve intent. Not a cmd.

`say` / `pulse` / `grantPoint` are not cmds.

`apply(click)` must not call the wrapping `enqueue` / `deleteBuilding` / `confirmPlace` in a way that `dispatch`es again. Body only.

`click` / `buy` still return what they return now.

## Logged vs not

Log = player commands only.

Not logged (follow from seed + cmds + time): sips, rot, weed sprout, outbreak, recover, ripen, tree drop, grass, stall ticks, research drain, mill / jam / still / barrel ticks, vehicle integrate / burn / follow hitch / boom, sensor eval / hold / pourEligible, actor walk, stride integrate, `DYNAMIC_MARKET` retarget, pad paint.

Not logged (view-local): panel open/close, camera, camera follow, hover, lens, hangar select, hide gardener.

Logged via the mutators that set them: `Seat.place`, `World.hud`, `World.cue`.

Cheats are cmds.

`DYNAMIC_MARKET` stays false. `nudgeOffered` is still a cmd.

## Time

`World.now: number` — integer count of `tick()` entries. Starts 0. Each `tick()` entry increments by 1, including recap early return.

`Cmd.t` is `now` after last completed tick, before apply.

Live tick is `DT_MAX` only (`1/15`). App accumulator. Never tick a leftover. View paints every rAF. Solo and MP. Tests replay with `dt = DT_MAX`:

```
w = new World(seed)
for cmd of cmds:
  while (w.now < cmd.t) w.tick(DT_MAX)
  w.apply(cmd)
```

Same-`t` cmds apply in log order. First wins, second no-op. `t` is non-decreasing. Ticks are not cmds. MP: one `tick(DT_MAX)` per host `bundle`. [[architecture/net]]

## JSON

`Cmd` is JSON. Classes forbidden in the log. Field names are one letter. Closed discriminated union on `a`. Each `a` has exactly one meaning.

Letters for `a` live only in `Act` (`src/game/sim/log.ts`). Call sites use `Act.click`, never the letter. JSON still stores the letter.

```
XY = [col: number, row: number]
```

Vertex uses `XY`. Edge in the log is `Edge` (`axis`, `col`, `row`). Intent in the log is `Intent`. Sprinkler in the log is `Sprinkler` (variant, at, facing if vert, tune). Tune is `Tune`. WireEnd in the log is `WireEnd`. ChunkId is `ChunkId`. No `Partial`. No optional that means unsure. `facing` only on vert sprinkler.

`e` is the Edge field. `Act` has no key whose value is `'e'`.

## Cmd

Every arm has required `t: number` and `p: SeatId`. `a` is `typeof Act.<name>`. Solo and tests: `p = 0`.

```
Cmd =
  | { a: typeof Act.click; t; p; c: XY }
  | { a: typeof Act.clickValve; t; p; e: Edge }
  | { a: typeof Act.enqueue; t; p; i: Intent }
  | { a: typeof Act.buy; t; p; s: SkuId }
  | { a: typeof Act.buyPacks; t; p; s: SkuId }
  | { a: typeof Act.placePipe; t; p; e: Edge }
  | { a: typeof Act.placeSprinkler; t; p; s: Sprinkler }
  | { a: typeof Act.delete; t; p; k: 'pipe'; e: Edge }
  | { a: typeof Act.delete; t; p; k: 'sprinkler'; c: XY }
  | { a: typeof Act.delete; t; p; k: 'building'; c: XY }
  | { a: typeof Act.delete; t; p; k: 'wire'; from: WireEnd; to: WireEnd }
  | { a: typeof Act.delete; t; p; k: 'smart'; e: Edge }
  | { a: typeof Act.expand; t; p; k: ChunkId }
  | { a: typeof Act.startResearch; t; p; r: ResearchId }
  | { a: typeof Act.pickSkill; t; p; m: MemberId; s: number }
  | { a: typeof Act.sellAll; t; p }
  | { a: typeof Act.nudgeOffered; t; p; g: StallGoodId; d: 1 | -1 }
  | { a: typeof Act.swap; t; p; i: number }
  | { a: typeof Act.swapChest; t; p; c: XY; i: number }
  | { a: typeof Act.tuneSprinkler; t; p; c: XY; u: Tune }
  | { a: typeof Act.openHud; t; p; k: 'sprinkler' | 'water' | 'harvest' | 'counter' | 'day'; c: XY }
  | { a: typeof Act.closeHud; t; p }
  | { a: typeof Act.armDelete; t; p }
  | { a: typeof Act.cancelPlace; t; p }
  | { a: typeof Act.rotatePlace; t; p }
  | { a: typeof Act.dismissRecap; t; p }
  | { a: typeof Act.ackCue; t; p }
  | { a: typeof Act.rightClick; t; p; c: XY }
  | { a: typeof Act.cheat; t; p; k: 'all' }
  | { a: typeof Act.cheat; t; p; k: 'money' }
  | { a: typeof Act.cheat; t; p; k: 'points' }
  | { a: typeof Act.cheat; t; p; k: 'research' }
  | { a: typeof Act.drive; t; p; throttle: -1 | 0 | 1; steer: -1 | 0 | 1 }
  | { a: typeof Act.buyVehicle; t; p; c: XY; k: VehicleKind }
  | { a: typeof Act.buyTrailer; t; p; c: XY; k: TrailerKind }
  | { a: typeof Act.deploy; t; p; v: VehicleId; c: XY; hitch: TrailerId | 'none' }
  | { a: typeof Act.embark; t; p; v: VehicleId }
  | { a: typeof Act.disembark; t; p }
  | { a: typeof Act.dock; t; p }
  | { a: typeof Act.swapVehicle; t; p; v: VehicleId; i: VehicleSlot }
  | { a: typeof Act.swapTrailer; t; p; u: TrailerId; i: HarvestSlot }
  | { a: typeof Act.refill; t; p; c: XY }
  | { a: typeof Act.setBoom; t; p; w: 3 | 5 }
  | { a: typeof Act.armWire; t; p; from: WireEnd }
  | { a: typeof Act.placeWire; t; p; from: WireEnd; to: WireEnd }
  | { a: typeof Act.placeSmartValve; t; p; e: Edge }
  | { a: typeof Act.tuneWater; t; p; c: XY; wilt: boolean; over: boolean }
  | { a: typeof Act.tuneHarvest; t; p; c: XY; mode: 'any' | 'all' }
  | { a: typeof Act.tuneCounter; t; p; c: XY; n: number }
  | { a: typeof Act.tuneDay; t; p; c: XY; sunrise: boolean; day: boolean; sunset: boolean; twilight: boolean }
  | { a: typeof Act.stride; t; p; x: -1 | 0 | 1; y: -1 | 0 | 1 }
  | { a: typeof Act.load; t; p }
  | { a: typeof Act.unload; t; p }
  | { a: typeof Act.acceptContract; t; p; c: ContractId }
  | { a: typeof Act.cancelContract; t; p; c: ContractId }
  | { a: typeof Act.reorderContract; t; p; c: ContractId; d: 1 | -1 }
```

`Act.drive` `'V'`. `Act.stride` `'K'`. `pickSkill` stays `'k'`. `Act.buyVehicle` `'Q'`. `Act.buyTrailer` `'T'`. `Act.deploy` `'D'`. `Act.embark` `'B'`. `Act.disembark` `'E'`. `Act.dock` `'P'`. `Act.swapVehicle` `'H'`. `Act.swapTrailer` `'A'`. `Act.refill` `'F'`. `Act.setBoom` `'W'`. `Act.load` `'L'`. `Act.unload` `'U'`. `Act.armWire` `'R'`. `Act.placeWire` `'N'`. `Act.placeSmartValve` `'I'`. `Act.tuneWater` `'C'`. `Act.tuneHarvest` `'G'`. `Act.tuneCounter` `'M'`. `Act.tuneDay` `'O'`. `Act.acceptContract` `'J'`. `Act.cancelContract` `'Y'`. `Act.reorderContract` `'Z'`. Latest `Act.drive` same `t` wins. Latest `Act.stride` same `t` wins. Latest `Act.setBoom` same `t` wins. Seated `Act.click` field acts no-op. Store is `Act.dock`, not a tick. Boom is not a cmd. Load/unload no coord; floor of driven vehicle. [[mechanics/vehicles]]. Cycle `placeWire` no-op. [[mechanics/sensors]]. Board generation is not a cmd. [[mechanics/contracts]].

`Act.delete` inner `k` is a closed union: pipe / sprinkler / building / wire / smart. Not one mushy target.

`Act.cheat` inner `k` is a closed union.

Map calls `rightClick`. Log `Act.rightClick`, not a split cancel/drop. `apply` that arm uses `seats[cmd.p]`: if that `place` is not `none`, cancel-place body; else enqueue `{ act: 'drop', at }` when in-world plot and that hand holds. HUD/App `cancelPlace` logs `Act.cancelPlace`.

Map `placePipe` / `placeSprinkler` / `deletePipe` / `deleteSprinkler` / `clickValve` / `openHud` / `click` / `expand` — those public methods.

`confirmPlace` is inside `click`. No `confirmPlace` cmd.

## Illegal

- `Cmd` missing `t`
- `Cmd` missing `p`
- two meanings for one `a`
- a letter for `a` written outside `Act`
- classes in the log
- React owning the log
- Worker applying cmds
- Worker owning `World`
- Vitest using a Worker
- logging sips / rot / weed / ripen / tree drop / grass / mill / jam / still / barrel / vehicle ticks / boom / sensor eval / stride integrate
- `Act.load` / `Act.unload` with a coord
- logging board generation
- `Act.acceptContract` `'K'` / `Act.cancelContract` `'X'` / `Act.reorderContract` `'O'`
- logging panel / camera / camera follow / hover / lens / hangar select
- `confirmPlace` as a cmd
- silent apply (dispatch without log, or a silent flag)
- `enqueue` wrapping `dispatch`
- `Math.random` except `World` seed when omitted

Assumption: spec `K`/`X`/`O` collided with `stride` / `resetCounter` / `tuneDay`; `J` `Y` `Z` are the remaining uppercase.
