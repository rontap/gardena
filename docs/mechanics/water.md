# Water

Sources own a tank. They gather every second up to capacity. Consumers spend stored water. A net can burst above production while tanks hold, then falls back to production.

`SOURCE` — preference. Starter pump is `SOURCE.pump`. Pumpjack is the same table, 2×1. Well is edge-based. Rainwater tank gathers with no pipe run to another source.

`pull(sources, want)` draws in proportion to `stored`.

## Grid

Pipes on **edges**. Sprinklers on **vertices**. Valves and wells on edges. None of these are a `Cell`.

A well sits on one owned edge. Its two endpoint vertices are joined (it conducts like a bare pipe) and its reservoir feeds that net from either vertex. No pipe or valve or smart valve may share the well's edge; pipes attach at its endpoints as usual. Place: `Place Well`, stays armed. Click with a container: gardener walks to an adjacent cell and fills at `SOURCE.well.rate`. Delete tool on the edge: **Delete well**, whole edge goes.

Any corner of any tile a source covers connects. A pipe that meets a source at a point is fed. Two pipe runs that both touch the same source are one net and share that output.

A closed valve blocks **its own edge only**. Water still reaches a sprinkler by any other open route. Click: gardener walks over and toggles.

Smart valve: edge SKU `buy-smart-valve`. `Gate` `{ kind: 'smart' }`. No manual click. One signal `in` on the body. Unwired **closed**. High open, low closed. `SENSOR_HOLD` on that input. Guest may place/delete. Manual valve unchanged. — [[mechanics/sensors]]

`TAP_RATE` — preference. Tap 1×1. Not a producer. Fills a bucket at `TAP_RATE` while the net’s tanks hold; once dry, only as fast as sources make.

Still 2×1 joins a net like a tap (any corner). `Net.stills`. Not a producer. Not a fill target. Start still only if `pull(sources, STILL_WATER)` returns `STILL_WATER` — once at start. Stored short → pull 0, retry each tick. — [[mechanics/machines]]

Water-system sensor 1×1 joins a net like a tap. `Net.waterSystems`. Not a producer. Not a fill target. No incident pipe / well / smart-valve edge at any corner → not on a net. Look: **Water-system sensor - no pipes around sensor!** Raw 0. High iff this net’s sprinkler want this tick > stored. Taps / stills not in demand. — [[mechanics/sensors]]

Fill at pump / rain-tank: that tank at its `rate`. Fill at a well edge: the well's tank at its `rate`.

## Sprinklers

Pour per covered **growing** tile, not as one lump.

`SPRINKLER_TILE_DAY` — preference. `SPRINKLER_TILE_RATE = SPRINKLER_TILE_DAY / DAY_SECONDS` — derived. More than any crop drinks. Untuned overwaters on purpose.

Dry, sourceless, unreachable, or nothing growing in the AoE: rate 0, no VFX. `tickWater` writes `World.vfx` from the sprinklers it actually poured and pings `'vfx'`. Not `BIG_TICK` — [[art/vfx]].

Cache each sprinkler's growing targets. Invalidate when a cell in `aoe(s)` changes kind, sprinkler place/delete, expand. `demand = cached.length * tileRate`. `tickWater` soaks that list once. Pour liters unchanged.

Wired vertices: `Set` rebuilt on wire change, not `wires.some` per head per tick.

Water-system sensors: `netOfCell` + cached demand, not `grid().find`. — [[mechanics/sensors]]

`dirtyNets()` only when `conducts(e)` actually flips or topology changes (place/delete pipe/valve/well/smart). Not every tick because `smartHold.size > 0`. — [[architecture/tick]]

`unlock-smart-irrigation`: every vertex sprinkler gains a signal `in` and a crop dial — one row, both halves. Unwired: **on**. Wired: high = pour existing AoE + dial, low = off. Unwired ≠ low. Pour uses this tick’s eval. — [[mechanics/sensors]]

## Smart dial

`unlock-smart-irrigation`. Feature, not a building. Every placed sprinkler gains a crop dial. Tuned: pours that crop’s `waterUsePerSec` per tile. Flat: `SPRINKLER_TILE_RATE`. Tuning does not rewrite soil already wet or dry. The dial and the signal input are one row.

## Hand pour

`CONTAINERS.bucket` / `CONTAINERS['large-bucket']` — [[mechanics/inventory]]. Fill at a source or tap.

`pourTarget`: empty / weed → `SOIL_WATER_MID`. Growing / ripe → `SOIL_WATER_MID + waterTolerance` (top of the green band). Spends only the gap, clamped to bucket. Already at or above target: nothing.

A drowning empty plot (`water >= mid`) takes nothing. A wilting growing plot can take well over 1 L in one pour.

## Invariants

`water.pour` — Untuned sprinkler: `SPRINKLER_TILE_DAY` per covered growing tile. Smart crop dial: that crop’s `waterUsePerSec` per tile. Hand pour tops empty/weed to `SOIL_WATER_MID`, growing/ripe to `SOIL_WATER_MID + waterTolerance`.

`water.targets` — Each sprinkler caches growing targets. Invalidate when a cell in `aoe(s)` changes kind, sprinkler place/delete, or expand. `demand = cached.length * tileRate`. `tickWater` soaks that list once. Wired vertices: `Set` rebuilt on wire change. Water-system: `netOfCell` + cached demand, not `grid().find`. Pour amounts unchanged.
