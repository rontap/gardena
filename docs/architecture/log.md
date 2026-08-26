# Log

Player commands. Not ticks. Not sim. [[architecture/world]] [[architecture/rng]] [[architecture/modules]]

Internal enabler. Multiplayer uses this log. [[architecture/net]]

`sim/log.ts` owns `Act`, `Cmd`, `XY`, `LogSink`, `MemorySink`, `WorkerSink`. `sim/log.worker.ts` holds `Cmd[]`. Does not apply. Does not own `World`. `World.now`, `World.log`, `dispatch`, `apply` live on `sim/world.ts`.

## Truth

`World.log: Cmd[]` is source of truth. In-process. Vitest never constructs a Worker, never uses `WorkerSink`, never loads `log.worker.ts`.

`World.log` retains the last 500 cmds (ring: `cmds` + `logBase`). The worker holds full history. Replay from main thread beyond 500 cmds must go through the worker `dump`. `World.logEnd` is absolute; `logSince(n)` returns retained cmds from cursor `n`, clamped to `logBase` — a clamped read means a gap; MP digest/resync covers it.

Worker is an async JSON copy. Main thread owns `World`.

React does not own the log. App holds `World` or none. Panel open/close, camera, hover, `Lens` are view-local and not logged.

## Sink

`LogSink = { push(cmd); reset(seed) }`. `MemorySink.cmds`. `push` appends. `reset` clears.

`WorkerSink` `postMessage`s. One worker for the page. Spawned in `src/main.tsx` at startup. React does not create or kill it. `terminate()` exists for Vite HMR dispose only. Vitest never loads `main.tsx`.

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

Public UI methods wrap `dispatch` so call sites stay. `enqueue` is a mutator. Tests call it. `apply` of `click` / `clickValve` / `rightClick` (drop) calls `enqueue`. It does not wrap `dispatch`.

`confirmPlace` is a mutator. Not a cmd. `apply(click)` calls it when prompt is place. Tests may call it. Unlogged.

`toggleValve` is actor work from a valve intent. Not a cmd.

`say` / `pulse` / `grantPoint` are not cmds.

`apply(click)` must not call the wrapping `enqueue` / `deleteBuilding` / `confirmPlace` in a way that `dispatch`es again. Body only.

## Logged vs not

Log = player commands only.

Not logged (follow from seed + cmds + time): sips, rot, weed sprout, outbreak, recover, ripen, tree drop, grass, stall ticks, research drain, mill / jam / still / barrel / grinder ticks, west-store pull, east-store push, vehicle integrate / burn / follow hitch / boom, synthesized auto drive, wait / load / unload resolve, sensor eval / hold / pourEligible, actor walk, stride integrate, pad paint.

Not logged (view-local): panel open/close, camera, camera follow, hover, lens, hangar select, hide gardener, Dash Automate, editor open.

Logged via the mutators that set them: `Seat.place`, `World.hud`, `World.cue`.

Cheats are cmds.

## Time

`World.now: number` — integer count of `tick()` entries. Starts 0. Each `tick()` entry increments by 1, including recap early return.

`Cmd.t` is `now` after last completed tick, before apply.

Live tick is `DT_MAX` only. App accumulator. Never tick a leftover. View paints every rAF. Solo and MP. Tests replay with `dt = DT_MAX`. Same-`t` cmds apply in log order. First wins, second no-op. `t` is non-decreasing. Ticks are not cmds. MP: one `tick(DT_MAX)` per host `bundle`. [[architecture/net]]

## JSON

`Cmd` is JSON. Classes forbidden in the log. Field names are one letter. Closed discriminated union on `a`. Each `a` has exactly one meaning. Arms: `sim/log.ts`.

Letters for `a` live only in `Act`. Call sites use `Act.click`, never the letter. JSON still stores the letter.

`XY = [col, row]`. Vertex uses `XY`. Edge in the log is `Edge`. Intent in the log is `Intent`. No `Partial`. No optional that means unsure. `facing` only on vert sprinkler.

Every arm has required `t: number` and `p: SeatId`. Solo and tests: `p = 0`.

Letter map: [[mechanics/log]] `log.letters`. Latest `Act.drive` same `t` wins. Latest `Act.stride` same `t` wins. Latest `Act.setBoom` same `t` wins. Latest `Act.route` `assign` / `start` same `t` wins. Seated `Act.click` field acts no-op. Store is `Act.dock`, not a tick. Boom is not a cmd. Auto load/unload/wait/motion are tick, not cmds. Load/unload no coord; floor of driven vehicle. Cycle `placeWire` no-op. Board generation is not a cmd.

`Act.delete` inner `k` is a closed union: pipe / sprinkler / building / wire / smart.

`Act.cheat` inner `k` is a closed union.

`Act.route` `'o'`. Inner `k` closed union: `create` | `delete` | `assign` | `add` | `remove` | `reorder` | `rename` | `start` | `automate`. Guest may. All no-op unless `unlock-dispatch` in `done`.

Map calls `rightClick`. Log `Act.rightClick`, not a split cancel/drop. `apply` that arm uses `seats[cmd.p]`: if that `place` is not `none`, cancel-place body; else enqueue `{ act: 'drop', at }` when in-world plot and that hand holds. HUD/App `cancelPlace` logs `Act.cancelPlace`.

`confirmPlace` is inside `click`. No `confirmPlace` cmd.

Assumption: lowercase `o` was the remaining free letter; `Act.route` bundles inner `k`.
