# Log

Player commands. Seed + [[architecture/log]] `Cmd[]` + time → next `World`. Types: [[architecture/log]]. Streams: [[mechanics/rng]].

`dispatch` logs then `apply`. `apply` mutates only. Replay is `apply` only.

Logged: the `Cmd` union. Not logged: sips, rot, weed sprout, ripen, tree drop, grass, stall ticks, research drain, mill / jam / still / barrel ticks, vehicle integrate / burn, walk, panel, camera, camera follow, hover, lens, hangar select. Store is `Act.dock`, not a tick.

`World.now` counts `tick()` entries. `Cmd.t` is that count at `dispatch`. Ticks are not cmds.

Tests replay `dt = 1/15`. Same-`t` cmds apply in log order.
