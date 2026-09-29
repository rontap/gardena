# Water

Code: `water.ts`, `nets.ts`, `pipe.ts`, pipe and sprinkler parts of `feature-place/`, `tickFill` and `fillDraw` in `queue.ts`, `doWater` in `feature-field/`; see [[code-map]].
Unlocked: the bucket and the starting Pump from the start. Pipes and taps with `unlock-irrigation`; sprinklers and valves with `unlock-auto-irrigation`; the Vertical and Large sprinklers with `unlock-adv-irrigation`; the Pumpjack and the Well with `unlock-water-storage`; sprinkler output and signal inputs with `unlock-smart-irrigation` ([[features/research]]).

## Purpose

Every plant uses water from its plot, and a plot out of its water range makes the plant unhappy ([[features/plants]]). At first the player carries water in a bucket from the Pump to each plot. Research replaces the walk: pipes join sources into a water network, taps put a filling point next to the field, and sprinklers pour on every growing plot in their area without the gardener. Water from a Pump is billed each day; a Well is not billed but refills more slowly. Valves and, later, sensors decide which part of a network pours and when.

## Rules

### Sources

A source is a building with its own tank (`Reservoir`): the Pump and Pumpjack (`SOURCE.pump`) and the Well (`SOURCE.well`). Each tank starts full, refills by `rate` litres per second up to `capacity`, and is refilled every step in `gatherWater`. A Pump whose signal input is on does not refill ([[systems/signals]]).

| | Pump, Pumpjack | Well |
|---|---|---|
| tank | `SOURCE.pump.capacity` | `SOURCE.well.capacity` |
| refill | `SOURCE.pump.rate` L/s | `SOURCE.well.rate` L/s, times `WELL_DROUGHT` on a Drought day |
| bucket fill | `SOURCE.pump.fill` L/s | `SOURCE.well.fill` L/s |
| billed | yes | no |

The weather multiplier (`sourceRateMul`) is set on every source when the day's weather is applied. It changes the refill rate only, never the fill rate.

### Water bill

Every litre taken from a Pump or Pumpjack tank, by a bucket, a tap, a sprinkler or a Pot still, is added to `World.pumpLiters`. At the day change the farm pays `pumpBill`: those litres × `PUMP_COST_PER_L` × `pumpCostMul` of the day that ended (`PUMP_COST_DRY` on Dry, `PUMP_COST_DROUGHT` on Drought, 1 otherwise). `PUMP_COST_PER_L` is `PUMP_DAY_COST` divided by one Pump's refill over a whole day, so a Pump drawn at its refill rate for a Clear day costs `PUMP_DAY_COST`. The bill is the **Water** line of the end-of-day summary ([[features/weather-day]]).

### Bucket

A bucket (`container` item, [[items/other/bucket]]) is filled and poured by the gardener.

- **Fill**, at a Pump, Pumpjack, Well or tap: a job that runs each step until the bucket is full, the hand changes, or the job is cancelled. At a Pump or Well it takes `SOURCE[kind].fill × dt` from that tank; an empty tank gives what it holds, so the bucket then fills at the refill rate. At a tap it pulls `TAP_RATE × dt` from the tap's network. A tap is a fill target only while its network has at least one source (`fillable`). The gardener walks to the building's origin tile, not to the tile clicked.
- **Water**, on an empty, weed, growing or ripe plot, or on either tile of a tree: pours up to the plot's target (`pourTarget`) and uses only the difference, or what the bucket holds if that is less. The target is the middle of the soil's water range (`SOIL_WATER_MID`) for an empty or weed plot, and the top of the plant's green water band (the middle plus the plant's `waterTolerance`) for a growing or ripe plot or a tree. A plot already at or above its target cannot be watered.

### Pipes

Pipes lie on the edges between tiles, and sprinklers sit on the corners where four tiles meet. A source, a tap or a Pot still joins a network at any corner of any tile it covers.

```
   +-----+-----+-----+          + corner (vertex): sprinklers, pipe joints
   |     |     |     |          - | edge: pipes and valves
   |  P  =  P  |     |          P a 2 x 1 Pump: all 6 of its corners join
   +-----+-----+--o--+          o a sprinkler on a corner
   |     |     |     |
   +-----+-----+-----+
```

The Pipe tool lays one edge per click, or a dragged run of edges. A dragged run is placed only if the farm can pay for every edge in it (**{n} pipe · {cost}** while dragging); otherwise none is placed. An edge must be on owned land (`edgeOwned`) and have no pipe. Demolishing a pipe removes its edge; demolishing a valve leaves the pipe and removes the valve and its wires.

### Valves

A valve sits on one pipe edge. Placed on an edge with no pipe, it lays the pipe and the valve together and charges both, or places neither. Placed on a bare pipe it charges the valve alone. An edge that already has a valve is refused: **Pipe already has a valve**.

A closed valve blocks its own edge only; water reaches the rest of the network by any other open route. **Open valve** / **Close valve** is a job: the gardener walks to the tile beside the edge (`valveStand`) and switches it. A wired valve follows its signal input instead, and its own open or closed setting returns when its last wire is removed ([[systems/signals]]).

### Sprinklers

A sprinkler is placed on an owned corner with no sprinkler, and only where its whole area is on owned land. It is on a network when at least one pipe edge that carries water (`conducts`) touches its corner. Areas and sizes are in [[items/buildings/sprinkler]].

Each step, each sprinkler that may pour (`mayPour`) pours on its targets: every growing plot in its area, and every tree with a tile in its area, counted once at the tree's origin. Ripe, dead and empty plots are not targets. What it asks for is targets × its rate per tile. A network's sprinklers pull their total from the network's tanks together; when the tanks hold less than the total, each sprinkler gets its share in proportion to what it asked for, and each target gets an equal part of its sprinkler's share. A sprinkler with no targets, or on a network with no water, pours nothing and shows no spray.

The rate per tile starts at `SPRINKLER_TILE_DAY` litres a day, which is more water than any crop uses. After `unlock-smart-irrigation`:

- **Tune sprinkler** opens **Sprinkler output**: a slider from 0 to `SPRINKLER_TILE_DAY` L/day per tile on `SPRINKLER_STEP` stops, with a mark for each crop at the amount that crop uses. The value is snapped (`snapFlow`) when the command is applied, so a guest's setting lands on a stop too.
- A sprinkler set to exactly one crop's amount shows that crop above it on the map (`tunedCrop`); one set between two crops shows none.
- The sprinkler has a signal input. Not wired, it pours. Wired, it pours while the input is on and stops while it is off ([[systems/signals]]).

### Taps

A tap has no tank. It joins a network at any corner and fills buckets at `TAP_RATE` from that network's tanks; when they are empty, the bucket fills only as fast as the sources refill.

### Pot still

A Pot still joins a network like a tap. It starts a batch only if the network's tanks hold `STILL_WATER` litres, and takes them at the start ([[items/buildings/still]]).

## Screen

- Hover a Pump or Well: the building name and a **Content** bar, litres stored of capacity.
- Prompts: **Fill**, **Water**, **Open valve**, **Close valve**, **Valve - wired**, **Tune sprinkler**, **Place {name}**, **Pipe already has a valve**, **Cannot afford**, **Cannot place here**.
- Pipe joints with no source on their network are drawn dry (`-dry` art). While a water tool from `PIPE_PLACE` or the Demolish tool is held, or the **Pipes** view is on, pipes are drawn at full strength and source tiles are marked; otherwise pipes are drawn faint.
- Views: **Water need** (after `unlock-auto-irrigation`) colours plots and trees by their water band; **Pipes** shows the network and every sprinkler's area ([[shell]]).
- Command Center: **Water network is running low**, one row per network whose tanks hold less than `NOTICE_WATER_LOW` of their capacity, with a bar of stored ÷ capacity.
- End-of-day summary: **Water**, the day's bill.

## Guest

A guest can fill, water, switch valves, lay and demolish pipes, place sprinklers and tune them.

## Save and sync

Saved: pipe edges and their valves (`segments`), sprinklers with their setting and input, held valve inputs (`valveHold`), and each source's stored litres on its cell. `pumpLiters` is not saved; networks are rebuilt on load. The digest carries each source's stored litres, `pumpLiters`, held valve inputs, and each wired sprinkler's input.

## Art

Sources and taps: `prop-pump.svg`, `prop-well.svg`, `prop-tap.svg`. Pipes: `assets/joints/pipe-{stub,i,l,t,x}.svg`, drawn from `pipeFit` with a `-dry` variant, `pipe-source.svg`, `pipe-valve.svg` (groups for open and closed), `pipe-valve-jack.svg` (the signal input, shown after `unlock-smart-irrigation`). Sprinklers: `prop-sprinkler.svg`, `prop-sprinkler-vert.svg`, `prop-sprinkler-large.svg`; spray: `vfx-spray.svg`, `vfx-spray-vert.svg`, `vfx-spray-large.svg`, shown only for sprinklers that poured this step ([[art/vfx]]).

## Sound

Watering a plot plays a pour while the job runs and a soak when it ends ([[systems/sound]]).

## Invariants

| id | rule | test |
|---|---|---|
| `water.fill` | refill is `SOURCE.rate`, weather on refill only; bucket fill is `SOURCE[kind].fill` at a source and `TAP_RATE` at a tap; an empty tank gives what it holds | `water.test.ts` |
| `water.pull` | `pull(sources, want)` takes from each tank in proportion to what it holds | `water.test.ts` |
| `water.bill` | `PUMP_COST_PER_L` = `PUMP_DAY_COST` ÷ one Pump's refill over a day | `water.test.ts` |
| `water.valve` | a closed valve blocks its own edge only; a bypass still waters | `e2e/water.spec.ts` |
| `water.join` | two sources on one network share it | `e2e/water.spec.ts` |
| `water.pour` | a connected sprinkler waters its growing plots; dry pipes are drawn dry | `e2e/irrigation.spec.ts` |
| `sprinkler.snap` | the slider offers 0 to `SPRINKLER_TILE_DAY` on `SPRINKLER_STEP` stops; a seat's command is snapped on arrival | `sprinkler-hud.test.ts` |
| `sprinkler.face` | a sprinkler shows the crop whose use matches its setting exactly, else none | `sprinkler-hud.test.ts` |

## When you change this

- A new source kind: a `SOURCE` entry, a cell kind, `World.sources()`, the refill in `gatherWater`, the fill in `fillDraw`, `pumpLiters` if it is billed, and the digest's stored litres ([[systems/water-network]], [[systems/net]]).
- A new building that uses network water: join it through its corners as taps and stills do, add a list to `Net`, and take water through `World.pullWater` so Pump litres are billed ([[systems/water-network]]).
- Sprinkler areas or targets: `aoe`, `sprinklerTargets` and its cache ([[systems/water-network]]); the **Pipes** view draws the areas.
- Hand pour targets: they come from the plant's water band in [[features/plants]] and [[features/trees]].
- Weather effects on water: [[features/weather-day]] owns rain, evaporation and the multipliers; this page owns where they apply.

## Decisions

- A sprinkler starts at more water than any crop uses, so an untuned sprinkler overwaters on purpose.
