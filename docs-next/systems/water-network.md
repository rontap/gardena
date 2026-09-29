# Water network

Code: `nets.ts` (networks, sprinklers, the water step, `evalSensors`), `pipe.ts` (edges, vertices, sprinkler areas), `water.ts` (`Reservoir`, `pull`), water methods on `World` in `world.ts`; see [[code-map]].

## Job

Works out which sources, taps, sprinklers and Pot stills are joined by pipes, and moves water: sources refill their tanks, sprinklers pour on their targets, and taps and stills take from the tanks of their network. The rules the player sees are in [[features/water]]; this page is what the rest of the code may rely on.

## Used by

- [[features/water]] — sprinklers, taps, buckets, the water bill.
- [[items/buildings/still]] — the Pot still takes `STILL_WATER` from its network at the start of a batch.
- [[systems/signals]] — valve and sprinkler inputs; a Pump's input stops its refill.
- [[features/weather-day]] — sets each source's refill multiplier.
- [[shell]] — the **Water network is running low** row and the **Pipes** view.
- [[systems/view]] — the pipe layer draws wet and dry joints from `vertexWet`, and the pipe tool's preview from `pendingWet`.

## Contract

### Grid

Pipes are keyed by `Edge` (`axis` `h` or `v`, `col`, `row`); sprinklers by `Vertex` (a tile corner). Neither is a `Cell`. `edgeKey` and `vertexKey` are the map keys.

```
   (c,r)  h:c,r  (c+1,r)       h:c,r  the top edge of tile (c,r)
     +-----------+             v:c,r  the left edge of tile (c,r)
     |           |             a vertex (c,r) is the top-left corner of tile (c,r)
v:c,r|  tile c,r |
     |           |
     +-----------+
```

`World.segments` maps edge key to `Segment` (`at`, `gate`). `Gate` is `bare` or `valve` with `open`. `World.conducts(e)` is true when the edge has a pipe and either its valve is wired and the held input is 1, or it is not wired and `flows(seg)` (bare, or an open valve).

`World.netVerts` is every vertex that has a pipe edge or a sprinkler. It is kept up to date on place and demolish (`pruneVert`) and is what the pipe layer draws.

### Networks

`grid(world)` returns `World.nets`, computed once and kept until `dirtyNets()` clears it:

1. A union-find over vertices joins the two ends of every edge that conducts.
2. Every source (`World.sources()`, Pumps then Wells) joins all corners of the tiles it covers into one set, so a pipe touching any corner is fed.
3. Each set with a source gets one `Net`: its sources' `Reservoir`s, then the sprinklers whose vertex is in a set and has at least one conducting incident edge, then each tap and still, joined at the first of its corners that is in a set and has a conducting incident edge.
4. `World.netAt` maps each vertex key to its `Net`.

`netOfVertex`, `netOfCell(base)` and `vertexWet` (the vertex's network has a source) read that map. `pendingWet(e)` walks from an edge that is not placed yet and reports whether it would reach a source.

Call `dirtyNets()` after any change to which edges conduct or which members exist: placing or demolishing a pipe, valve, sprinkler, source, tap or still; switching a valve; and a wired valve's held input changing (`evalSensors` checks this each step). `rebuildWired` also calls it.

### Taking water

`pull(sources, want)` takes `min(want, total stored)` from the given tanks, each in proportion to what it holds, and returns what it took. Every draw from a network goes through `World.pullWater`, which adds the part taken from Pump tanks to `World.pumpLiters` for the water bill. A bucket at a Pump or Well takes from that tank with `Reservoir.take` in `fillDraw`, which adds Pump litres to `pumpLiters` itself.

### Sprinklers

`aoe(s)` lists the tiles in a sprinkler's area. `sprinklerTargets(world, s)` lists its targets (growing plots, and tree origins once each) and caches them in `World.sprinklerTargetCache` by vertex. The cache entry is dropped when a sprinkler is placed or demolished there, and by `setCell` whenever a tile in its area changes `kind` ([[systems/world]]). Placement requires the whole area on owned land, so buying land never changes a target list.

`tileRate(world, s)` is the litres per second per target from the sprinkler's `Tune`: `rate` gives `day ÷ DAY_SECONDS`, `flat` gives `SPRINKLER_TILE_RATE`. `demand` is targets × `tileRate`. `mayPour` is true when the sprinkler is not wired, or wired with its held input at 1 (`pourEligible`). `World.wiredVerts` holds the wired sprinkler vertices and is rebuilt with the wire set in `rebuildWired`, which also creates and removes `valveHold` entries for wired valves.

### Order within a step

In `tickWorld` ([[systems/tick]]):

1. `gatherWater` — each Pump whose input is not 1, and each Well, refills.
2. `evalSensors` — signals, including valve and sprinkler inputs ([[systems/signals]]).
3. `tickMachines` — Pot stills take their water here ([[features/machines]]).
4. `tickWater` — for each network, the sprinklers that may pour ask for targets × `tileRate` × `dt` together; one `pullWater` takes the total; each sprinkler gets its share of what came back and splits it evenly over its targets through `Soil.soak`. The vertices that poured go to `tickVfx`, which pings `'vfx'` when the set of spraying sprinklers changes.

Bucket filling runs earlier in the step, in the seat's job (`tickFill`).

## Entry points

- `grid`, `netOfVertex`, `netOfCell`, `vertexWet`, `pendingWet` — network lookups.
- `World.pullWater(sources, want)` — the only way to take water from a network.
- `World.conducts`, `hasPipe`, `hasValve`, `valveWired`, `sprinklerAt`, `segmentAt`, `eachNetVert` — grid reads.
- `World.placePipe`, `deletePipe`, `placeSprinkler`, `deleteSprinkler`, `tuneSprinkler` — commands ([[systems/commands]]); their bodies are in `feature-place/place.ts`. Switching a valve is the `valve` job, which calls `World.toggleValve`.
- `sprinklerTargets`, `demand`, `tileRate`, `tuneDay`, `mayPour` — sprinkler reads for the panel and the view.
- `fillable(world, at)` — whether a tile is a bucket fill target.

## Data

Owned by `World`: `segments`, `sprinklers`, `valveHold`, `netVerts`, `wiredVerts`, `sprinklerTargetCache`, `nets`, `netAt`, `pumpLiters`, and the `water` `Reservoir` on each Pump and Well cell.

Saved: `segments`, `sprinklers`, `valveHold`, each source's `stored`. Not saved: `nets`, `netAt`, `netVerts`, `wiredVerts`, the target cache (rebuilt), and `pumpLiters` (starts at 0 on load).

Digest ([[systems/net]]): each source's `stored` keyed by origin tile, `pumpLiters`, `valveHold`, and each wired sprinkler's input.

## Invariants

| id | rule | test |
|---|---|---|
| `water.pull` | `pull` takes from each tank in proportion to what it holds | `water.test.ts` |
| `net.order` | `rebase()` sorts `pumps`, `wells`, `taps`, `stills` by origin tile (row, then column), so `pull` visits tanks in the same order on host and guest | `mp.test.ts` |
| `water.dirty` | networks are recomputed only after `dirtyNets()`, never each step | none |
| `water.targets` | a sprinkler's targets are cached and dropped when a tile in its area changes kind | none |

## When you change this

- A new network member: a list on `Net`, joining in `grid` through a corner with a conducting edge, a list on `World` sorted in `rebase()`, and `dirtyNets()` on its place and demolish.
- A new way to take water: go through `World.pullWater`, or the Pump litres miss the bill and the digest's `pumpLiters` still matches only by accident.
- Changing what conducts: `conducts` is read by `grid`, the pipe layer and the signal step; call `dirtyNets()` wherever the answer changes.
- Sprinkler areas: `aoe` is also drawn by the **Pipes** view and checked at placement.

## Decisions

- Networks are computed on demand and cached, not each step: pipes change only when the player builds or a valve switches, while water moves every step.
- The source lists are sorted on `rebase()` and not on every change: a host's lists are in purchase order and a guest's are in load order, and `pull` visits tanks in list order, so without the sort `stored` and `pumpLiters` differ after a join.
