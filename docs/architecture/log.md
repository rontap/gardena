# Log

Player commands. Not ticks. Not sim. [[architecture/world]] [[architecture/rng]] [[architecture/modules]]

Internal enabler. No player-visible change. Not save UI. Not replay viewer. Not multiplayer.

## Files

| file | owns |
|---|---|
| `src/game/sim/log.ts` | `Cmd`, `XY`, `LogSink`, `MemorySink`, `WorkerSink` |
| `src/game/sim/log.worker.ts` | worker. Holds `Cmd[]`. Does not apply. Does not own `World`. |
| `src/game/sim/world.ts` | `World.now`, `World.log`, `dispatch`, `apply`. Wrappers. |

Do not create `src/` here.

## Truth

`World.log: Cmd[]` is source of truth. In-process. Vitest never constructs a Worker, never uses `WorkerSink`, never loads `log.worker.ts`.

Worker is an async JSON copy. Main thread owns `World`.

React does not own the log. App holds `World`. Panel open/close, camera, hover, `Lens` are view-local and not logged.

## Sink

```
LogSink = { push(cmd: Cmd): void; reset(seed: number): void }
```

`MemorySink.cmds: Cmd[]`. `push` appends. `reset` clears.

`WorkerSink` `postMessage`s. Worker file `src/game/sim/log.worker.ts`.

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
apply(cmd): mutate. No log. No sink.
```

Replay calls `apply` only.

`dispatch` stamps `t = World.now` on the cmd the wrapper builds. Callers do not pick `t`.

## Wrappers vs mutators

Public UI methods wrap `dispatch` so call sites stay:

`click` `clickValve` `buy` `buyPacks` `placePipe` `placeSprinkler` `deletePipe` `deleteSprinkler` `deleteBuilding` `expand` `startResearch` `pickSkill` `sellAll` `nudgeOffered` `swap` `swapChest` `tuneSprinkler` `openHud` `closeHud` `armDelete` `cancelPlace` `rotatePlace` `dismissRecap` `ackCue` `rightClick` `unlockAll` `cheatMoney` `cheatPoints` `toggleCheatResearch`

`enqueue` is a mutator. Tests call it. `apply` of `click` / `clickValve` / `rightClick` (drop) calls `enqueue`. It does not wrap `dispatch`.

`confirmPlace` is a mutator. Not a cmd. `apply(click)` calls it when prompt is place (buildings, tiles, fence, item drops, cell delete). Tests may call it. Unlogged.

`toggleValve` is actor work from a valve intent. Not a cmd.

`say` / `pulse` / `grantPoint` are not cmds.

`apply(click)` must not call the wrapping `enqueue` / `deleteBuilding` / `confirmPlace` in a way that `dispatch`es again. Body only.

`click` / `buy` still return what they return now.

## Logged vs not

Log = player commands only.

Not logged (follow from seed + cmds + time): sips, rot, weed sprout, ripen, tree drop, grass, stall ticks, research drain, actor walk, `DYNAMIC_MARKET` retarget.

Not logged (view-local): panel open/close, camera, hover, lens.

Logged via the mutators that set them: `World.place`, `World.hud`, `World.cue`.

Cheats are cmds.

`DYNAMIC_MARKET` stays false. `nudgeOffered` is still a cmd.

## Time

`World.now: number` — integer count of `tick()` entries. Starts 0. Each `tick()` entry increments by 1, including recap early return.

`Cmd.t` is `now` after last completed tick, before apply.

Keep current rAF remainder stepping (`min(left, DT_MAX)`). Tests replay with `dt = 1/15`:

```
w = new World(seed)
for cmd of cmds:
  while (w.now < cmd.t) w.tick(1/15)
  w.apply(cmd)
```

Same-`t` cmds apply in log order. `t` is non-decreasing. Ticks are not cmds.

## JSON

`Cmd` is JSON. Classes forbidden in the log. One-letter keys. Closed discriminated union on `a`. Each `a` has exactly one meaning.

```
XY = [col: number, row: number]
```

Vertex uses `XY`. Edge in the log is `Edge` (`axis`, `col`, `row`). Intent in the log is `Intent`. Sprinkler in the log is `Sprinkler` (variant, at, facing if vert, tune). Tune is `Tune`. ChunkId is `ChunkId`. No `Partial`. No optional that means unsure. `facing` only on vert sprinkler.

`e` is the Edge field. `a` is never `'e'`.

## Cmd

Every arm has required `t: number`.

```
Cmd =
  | { a: 'c'; t: number; c: XY }                                          // click
  | { a: 'v'; t: number; e: Edge }                                        // clickValve
  | { a: 'q'; t: number; i: Intent }                                      // enqueue (tests / apply)
  | { a: 'b'; t: number; s: SkuId }                                       // buy
  | { a: 'p'; t: number; s: SkuId }                                       // buyPacks
  | { a: 'y'; t: number; e: Edge }                                        // placePipe
  | { a: 'n'; t: number; s: Sprinkler }                                   // placeSprinkler
  | { a: 'd'; t: number; k: 'pipe'; e: Edge }                             // deletePipe
  | { a: 'd'; t: number; k: 'sprinkler'; c: XY }                          // deleteSprinkler (vertex)
  | { a: 'd'; t: number; k: 'building'; c: XY }                           // deleteBuilding
  | { a: 'x'; t: number; k: ChunkId }                                     // expand
  | { a: 'r'; t: number; r: ResearchId }                                  // startResearch
  | { a: 'k'; t: number; m: MemberId; s: number }                         // pickSkill (s = offer slot)
  | { a: 's'; t: number }                                                 // sellAll
  | { a: 'o'; t: number; g: StallGoodId; d: 1 | -1 }                      // nudgeOffered
  | { a: 'w'; t: number; i: number }                                      // swap (inventory index)
  | { a: 'h'; t: number; c: XY; i: number }                               // swapChest
  | { a: 't'; t: number; c: XY; u: Tune }                                 // tuneSprinkler (vertex)
  | { a: 'j'; t: number; c: XY }                                          // openHud sprinkler
  | { a: 'l'; t: number }                                                 // closeHud
  | { a: 'm'; t: number }                                                 // armDelete
  | { a: 'f'; t: number }                                                 // cancelPlace
  | { a: 'g'; t: number }                                                 // rotatePlace
  | { a: 'i'; t: number }                                                 // dismissRecap
  | { a: 'a'; t: number }                                                 // ackCue
  | { a: 'z'; t: number; c: XY }                                          // rightClick (map)
  | { a: 'u'; t: number; k: 'all' }                                       // unlockAll
  | { a: 'u'; t: number; k: 'money' }                                     // cheatMoney
  | { a: 'u'; t: number; k: 'points' }                                    // cheatPoints
  | { a: 'u'; t: number; k: 'research' }                                  // toggleCheatResearch
```

`d` is delete. Inner `k` is a closed union: pipe / sprinkler / building. Not one mushy target.

`u` is cheat. Inner `k` is a closed union.

Map calls `rightClick`. Log `z`, not a split cancel/drop. `apply(z)`: if `place` is not `none`, cancel-place body; else enqueue `{ act: 'drop', at }` when in-world plot and hand holds. HUD/App `cancelPlace` logs `f`.

Map `placePipe` / `placeSprinkler` / `deletePipe` / `deleteSprinkler` / `clickValve` / `openHud` / `click` / `expand` — those public methods.

`confirmPlace` is inside `click`. No `confirmPlace` cmd.

## Illegal

- `Cmd` missing `t`
- two meanings for one `a`
- classes in the log
- React owning the log
- Worker applying cmds
- Worker owning `World`
- Vitest using a Worker
- logging sips / rot / weed / ripen / tree drop / grass
- logging panel / camera / hover / lens
- `confirmPlace` as a cmd
- silent apply (dispatch without log, or a silent flag)
- `enqueue` wrapping `dispatch`
- `Math.random` except `World` seed when omitted
