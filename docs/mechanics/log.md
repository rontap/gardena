# Log

Player commands. Seed + [[architecture/log]] `Cmd[]` + time → next `World`. Types: [[architecture/log]]. Streams: [[mechanics/rng]].

`dispatch` logs then `apply`. `apply` mutates only. Replay is `apply` only. `enqueue` does not `dispatch`.

Logged: the `Cmd` union. `Act.stride` is a cmd. `Act.setBoom` is a cmd. `Act.load` `Act.unload` are cmds. `Act.route` is a cmd. Not logged: sips, rot, weed sprout, outbreak, recover, ripen, tree drop, grass, stall ticks, research drain, mill / jam / still / barrel ticks, vehicle integrate / burn / follow hitch / boom, synthesized auto drive, wait / load / unload resolve, sensor eval / hold / pourEligible, walk, stride integrate, panel, camera, camera follow, hover, lens, hangar select, dash faces, Dash Automate, editor open. Store is `Act.dock`, not a tick. Boom is not a cmd. Auto load/unload/wait/motion are tick, not cmds. `toggle` is actor work. Wire bezier is view. Place light is buy + `confirmPlace` inside `click`.

`World.now` counts `tick()` entries. `Cmd.t` is that count at `dispatch`. Ticks are not cmds.

Tests replay `dt = DT_MAX`. Same-`t` cmds apply in log order.

## Invariants

`log.now` — `World.now` starts 0. Each `tick()` entry, including recap return, `now += 1`. `dispatch` stamps `Cmd.t = now`. Same-`t` cmds apply in log order. Ticks are not cmds.

`log.dispatch` — `dispatch` appends to `World.log` and `sink`, then `apply`. `apply` does not log. Replay is `apply` only. `enqueue` does not `dispatch`.

`log.cmds` — Log is player `Cmd`s only. Not sips, rot, weed sprout, outbreak, recover, ripen, tree drop, grass, stall ticks, research drain, mill / jam / still / barrel ticks, vehicle integrate / burn / follow hitch / boom, synthesized auto drive, wait / load / unload resolve, walk, stride integrate, panel, camera, hover, lens, pad paint, dash faces, Dash Automate, editor open. `Act.setBoom` `Act.load` `Act.unload` `Act.stride` `Act.route` are cmds. Auto load/unload/wait/motion are tick, not cmds.

`log.json` — `JSON.parse(JSON.stringify(cmd))` equals that `Cmd` arm.

`log.letters` — `Act.setBoom` `'W'`; `Act.placeWire` `'N'`; `Act.load` `'L'`; `Act.unload` `'U'`; `Act.stride` `'K'`; `Act.tuneCounter` `'M'`; `Act.tuneDay` `'O'`; `Act.acceptContract` `'J'`; `Act.cancelContract` `'Y'`; `Act.reorderContract` `'Z'`; `Act.route` `'o'`; inner `k` closed union `create` | `delete` | `assign` | `add` | `remove` | `reorder` | `rename` | `start` | `automate`. Latest same-`t` `assign` / `start` wins like drive. Spray click is `Intent` `{ act: 'weed-spray'; at }`.
