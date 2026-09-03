# Tick

Developer law. Not player mechanics. [[architecture/world]] [[architecture/modules]] [[mechanics/_index]]

Sim stays on the main thread. View paints via the Pixi ticker. App accumulator `tick(DT_MAX)` only, at most two ticks per frame. Do not raise `DT_MAX`. Do not interpolate sim. View vehicles keep `QUAD_FOLLOW`. Do not move `World` to a worker. Sim does not camera-cull. View may (`CullerPlugin` on chunks). [[architecture/view]]

Owner: `sim/world.ts`. Indexes live on `World`. `track()` stays on `World`. Do not add `sim/index.ts`.

## Cadence

`BIG_TICK`: weed spawn, grass spawn ([[mechanics/weeds]] `weeds.grass`), west-store pull, weather soak ([[mechanics/weather]] `weather.soak`).

Continuous processes stay every `dt`: pour, growth, sensors, recover. Index them. Do not throttle onto `BIG_TICK` (still-droplets bug). Soak is `BIG_TICK`, not every `dt`.

## Indexes

Maps, same `Coord` values as `live`. Origin-only for multi-cell. `live` is not a tick walk.

| name | members |
|---|---|
| grow | growing, ripe, weed, turf, tree origin |
| machines | mill, jam, still, barrel, grinder, compost origin |
| stores | chest, freezer |
| sensors | sunk sensor cells |
| buttons | button cells |
| recover | tilled with `weedChance < WEED_CHANCE` |
| empty | empty plots |
| tilled | `isTilled` |

Filled by `track()` from `setCell`. `indexAll` on hydrate / rebase.

| walk | index |
|---|---|
| `tickField` | grow + recover |
| `tickMachines` / `tickCompost` | machines |
| `tickFreshness` | stores (+ seats / drops / vehicles, not grow). Freezer slots still skip |
| `tickButtons` | buttons |
| `evalSensors` | sensors + machines + stores. Not `forEachCell` |
| `sproutWeeds` | empty |
| weather soak | tilled. `tickBig` walks it |
| `padBuildings` | machines + stores (+ `silo` / `additives` / `seedSilos`) |
| View dirty | those plus `segments` / `sprinklers` / `fences`. Not `forEachCell` |

A new per-tick cell kind gets a list in `track()`. Scanning the whole farm from `tick` is a defect. Review enforces this. Do not invent a test that spies on `forEachCell`.

Iterate maps directly. `[...this.live.values()]` is illegal. No live-array copy.

`forEachCell` is forbidden on the tick path, including seam (`tickTreesSeam` walks grow). `indexAll` may `forEachCell`.

Assumption: `evalSensors` storeRaw and `padBuildings` also walk existing World silo / additive instance lists (`silo`, `additives`, `seedSilos`). View props for house / truck / pumps / tanks / taps / hangars / field silos come from those World lists; ground stays terrain.

## Nets

`dirtyNets()` only when `conducts(e)` actually flips or topology changes (place / delete pipe / valve / smart, or a source cell). Not every tick because `smartHold.size > 0`.

## Ping

`ping()` / `pingFor` from tick only on discrete change. Continuous world chrome is the Pixi ticker. Continuous HUD chrome is `paintMotion`. No every-tick counter HUD `this.ping()`. FPS readout: [[ui/hud]]. Not a `DirtyReason`.

`DirtyReason = 'act' | 'field' | 'big' | 'speech' | 'vfx'`.

| reason | view |
|---|---|
| `speech` | HTML bind, ticker pose. Not React state |
| `vfx` | `layers/vfx.ts`, not Hud |
| `field` / `big` | world-view patch from indexes, not whole chrome |
| `act` | Hud + world-view patch |

A new `DirtyReason` must have a view that filters it. Unused reason is a defect.

## Stats

`World.modGen` increments when `modifiers` change. Cache `statsOf(crop, rarity)` for that generation. Plants do not re-filter modifiers every tick.

## Water

Cache each sprinkler's growing targets. Invalidate when a cell in `aoe(s)` changes kind, sprinkler place / delete, expand. `demand = cached.length * tileRate`. `tickWater` soaks that list once. Pour liters unchanged.

Wired vertices: `Set` rebuilt on wire change, not `wires.some` per head per tick.

Water-system sensors: `netOfCell` + cached demand, not `grid().find`.

## Invariants

`tick.scan` — `forEachCell` is forbidden on the tick path. A new per-tick cell kind gets a list in `track()`. Scanning the whole farm from `tick` is a defect. Iterate maps directly; no live-array copy. Review enforces. Do not spy on `forEachCell`.

`tick.nets` — `dirtyNets()` only when `conducts(e)` actually flips or topology changes (place / delete pipe / valve / smart, or a source cell). Not every tick because `smartHold.size > 0`.

`tick.ping` — `ping()` / `pingFor` from tick only on discrete change. Continuous world chrome is the Pixi ticker. Continuous HUD chrome is `paintMotion`. No every-tick counter HUD ping. A new `DirtyReason` has a view that filters it. Unused reason is a defect. Sim is not interpolated; view vehicles keep `QUAD_FOLLOW`. Sim does not camera-cull; view may.
