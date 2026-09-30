# Trees

Code: `Tree` and `TreeYield` in `building.ts`; `tickTree`, `tickTreesSeam`, `advanceYield`, `dropTreeFruit` in `feature-field/field.ts`; planting, chopping, grafting, tending and digging in `feature-field/field.helpers.ts`; `makeTreeSoil` and the `TREE_WATER_*` / `TREE_FERT_MAX` constants in `soil.ts`; `defs/trees.ts`; `TREE_FERT_PER_DAY` and the tree rows of `CROPS` in `defs/crops.ts`; see [[code-map]].
Unlocked: from the start; tree seeds come from the sources in **Getting a tree**.

## Purpose

A tree is a fruit crop the player plants once. It takes a long time before its first fruit, then gives fruit for the rest of the game: fast during a season of `TREE_YIELD_DAYS` days, slower between seasons. It drops its fruit on the ground around it by itself, and the player picks the fruit up. It needs water and fertilizer, but its soil holds more of both than a plot's and it uses them slowly, so it needs them less often than an annual crop. Trees are how the player gets apples, apricots, olives and cherries, and their Named and Heirloom varieties come only from prizes, burrows and grafts.

## Rules

### Species

Four species (`TREE_IDS`): apple, apricot, olive, cherry. Each is a row of `TREES` (`juvenileSeconds`, `fruitSeconds`), a row of `CROPS` (`waterUsePerSec`, `waterTolerance`, `fertTolerance`, `sale`, `rotSeconds`), and a row of `TREE_FERT_PER_DAY`. Per-species pages: [[items/crops/apple]], [[items/crops/apricot]], [[items/crops/olive]], [[items/crops/cherry]].

### Getting a tree

A tree seed (`'tree-seed'`, [[items/other/tree-seed]]) comes from:

| source | species and variety |
|---|---|
| contract prize ([[features/contracts]]) | fixed per company and difficulty: a Plain species, or one from the Plain, Named or Heirloom tree groups |
| a burrow ([[features/burrow]]) | Common: a Plain tree seed; Uncommon: a Named tree seed; Rare: an Heirloom tree seed |
| Grinder, from tree fruit ([[items/buildings/grinder]]) | the fruit's species, always Plain (`grindProduct`) |
| digging up a tree with a shovel | that tree's species and variety |

A graft (`'graft'`, [[items/other/graft]]) comes only from chopping a grown tree with the `grafting` skill.

The first chunk of every new map, chunk `(0, 0)`, has one wild apple tree (`spawnAppleTree` in `gen.ts`): Plain, just planted, on the first two soft untilled tiles one above the other, searched row by row.

### Planting

**Plant {Name}** with a tree seed in hand, on a soft untilled tile whose upper neighbour is also soft untilled, each bare or grass (`seedPair`). The clicked tile is the lower half; the tree's `base` is the tile above. Both tiles hold the same `Tree`.

A new tree starts as a sapling with `juvenile` 0, happiness `TREE_HAPPY_START`, and its own soil (below).

### Tree soil

A tree has one `Soil` of its own for both tiles, `Tree.soil`, made by `makeTreeSoil`. The tree and every action on it read and write that soil: bucket, fertilizer, compost, sprinkler, weather, the Sprayer trailer, sensors and the Command Center.

| | a tree's soil | a plot's soil |
|---|---|---|
| water capacity | `TREE_WATER_MAX` | `SOIL_WATER_MAX` |
| water centre of the range | `TREE_WATER_MID` | `SOIL_WATER_MID` |
| fertilizer capacity | `TREE_FERT_MAX` | `FERT_PLOT_MAX` |
| water at the start | `TREE_WATER_MID` | `SOIL_TILL_WATER` |
| fertilizer at the start | `goodness(col, row)` × `TREE_FERT_MAX`, at `base` | `goodness(col, row)` |

The ranges use the same functions as annual crops ([[features/plants]]), with the tree soil's centre and capacity:

```
water      green while |water − TREE_WATER_MID| ≤ waterTolerance
           red from     |water − TREE_WATER_MID| ≥ (TREE_WATER_MID + waterTolerance) ÷ 2
           above TREE_WATER_MID the red range is too much water, below it too little
fertilizer green from  TREE_FERT_MAX − fertTolerance
           red up to   (TREE_FERT_MAX − fertTolerance) ÷ 2
```

`waterTolerance` and `fertTolerance` are the species' `CROPS` values × `VARIETY_TOL` of the variety tier, never below `TOL_MIN`.

### Water and fertilizer use

At every stage — sapling, stump, waiting, in season, out of season — each tree uses, per second:

- water: `CROPS[species].waterUsePerSec` × the water-use modifiers (`statsOf`);
- fertilizer: `TREE_FERT_PER_DAY[species]` ÷ `DAY_SECONDS`, the same for every variety.

Because the soil is larger and the use is small against it, a full tree stays in its green range for:

```
water       2 × waterTolerance ÷ (waterUsePerSec × DAY_SECONDS)     days, from a bucket fill to the bottom of green
fertilizer  fertTolerance ÷ TREE_FERT_PER_DAY[species]              days, from TREE_FERT_MAX to the bottom of green
```

A Named or Heirloom tree has a narrower tolerance (`VARIETY_TOL`), so it leaves the green range sooner at the same use.

Filling the soil:

| action | fills to |
|---|---|
| **Water** with a bucket, on either tile | `TREE_WATER_MID` + `waterTolerance`, the top of the green range (`pourTarget`) |
| **Fertilize** with a fertilizer or compost bag, on either tile | `TREE_FERT_MAX` |
| Sprayer trailer passing over the tree | `TREE_FERT_MAX` ([[features/vehicles]]) |
| sprinkler | the tree counts as one target, and gets the same litres per second as one plot ([[features/water]]) |
| weather, every big tick | the same litres as a plot: + `RAIN_SOAK_TICK` / `FLOOD_SOAK_TICK`, − `DRY_EVAP_TICK` / `DROUGHT_EVAP_TICK`, within 0 and `TREE_WATER_MAX` ([[features/weather-day]]) |

### Happiness

Happiness is 0 to `HAPPY_MAX`, starts at `TREE_HAPPY_START`, and changes by the same rule as an annual plant (`ageHappiness`) with the tree's own times:

| range state | happiness change per second |
|---|---|
| fertilizer red | − 1 ÷ `TREE_HAPPY_STARVE_SECONDS` |
| water red, too little | − 1 ÷ `TREE_HAPPY_WILT_SECONDS` |
| water red, too much | − 1 ÷ `TREE_HAPPY_DROWN_SECONDS` |
| neither red | + 1 ÷ `TREE_HAPPY_GAIN_SECONDS` for each range that is green |

At happiness 0 a tree keeps growing and keeps making fruit. Happiness sets how fast fruit comes and how soon a new season starts (below). The sapling grows at the same rate in every range.

### Growing up

```
 tree seed planted
        |
        v
 sapling ---------- juvenile 0 -> 1 over TREES[species].juvenileSeconds
        |           no fruit; happiness, water and fertilizer run
        v
 waiting ---------- yield 'pending': no fruit until the end of the day
        |
        v  end of day
 in season           (see Seasons)
```

The sapling time is the same for every variety and every happiness. A grown tree has `juvenile` 1 and `trunk` false.

### Seasons

`Tree.yield` is the tree's season. It changes only at the end of the day (`tickTreesSeam` → `advanceYield`), for grown trees:

```
                 end of day
  waiting  ------------------------>  IN SEASON, daysLeft = TREE_YIELD_DAYS
                                           |
                                           |  each end of day: daysLeft − 1
                                           |  when it reaches 0:
                                           |    chance = −0.25 + 0.1 × happiness
                                           |    tended = false
                                           v
        random value < chance       OUT OF SEASON
  IN SEASON  <----------------------  each end of day:
  (daysLeft = TREE_YIELD_DAYS)          chance += TREE_OFF_CHANCE[happiness range]
                                        then the tree stream is compared with chance
                                      Tend (skill tending), once per out-of-season:
                                        chance += 0.15
```

- The season lasts `TREE_YIELD_DAYS` ends of day after it starts. The first draw is at the end of day after the one that ends the season.
- The happiness range for `TREE_OFF_CHANCE` is `happyBand`: red below a quarter, orange below a half, green from a half. `chance` keeps what it gained on earlier days, so every day out of season makes the next season more likely.
- The random value is `rng.stream('tree').at(base.col, base.row, day)` ([[systems/rng]]).

A timeline for a tree that grows up during day *d*, drawn with the current `TREE_YIELD_DAYS`:

```
 day       |    d     |   d+1    |   d+2    |   d+3    |   d+4    | ...
 season    | waiting  |    in    |    in    |   out    |   out    | out until a draw succeeds
 end of day           ^          ^          ^          ^          ^
                      start      daysLeft   daysLeft   first      next
                      season     − 1        − 1 = 0    draw       draw
```

### Fruit

A grown tree that is not waiting fills `Tree.fruit` from 0 to 1, then drops one fruit:

```
fruit += dt ÷ (fruitSeconds ÷ rate)

 rate in season       2.75 + 0.5 × happiness
 rate out of season   0.25 + 0.5 × happiness
```

So a tree out of season gives fruit at a lower rate, and happiness adds the same amount in both seasons.

When `fruit` reaches 1, `dropTreeFruit` puts one fruit on the ground on a random tile of the area around the tree, and `fruit` goes back to 0:

```
         col −1  col 0  col +1
 row −1    .      .      .
 row  0    .      T      .       T = the tree; its upper tile is `base`
 row +1    .      T      .       . = a possible landing tile
 row +2    .      .      .
```

A landing tile must be inside the owned land and be ground (`isPlot`: untilled or tilled, with or without a plant); fruit can land on a tile that already has items on it. When no tile qualifies, `fruit` stays at 1, the tree shows ripe, and the fruit drops as soon as a tile is free.

Fly agaric and Truffle come up on the untilled tiles of the same area at the end of a day ([[features/mushrooms]]).

The fruit is the tree's species and variety, quality 0, freshness 1, with the sale price from `statsOf` at quality 0. On the ground it loses freshness like any other fruit, at `rotSeconds` × `VARIETY_ROT` ([[features/plants]] freshness). The player picks it up with **Pick up**. Each drop counts as a harvest in the end-of-day summary (`tally.harvests`).

### Chopping

**Chop** with an axe or chainsaw ([[items/other/axe]]) on either tile of a grown tree that is not a stump. It takes one use of the tool and the tool's work time. Then:

- one Wood, and with the `grafting` skill `CHOP_GRAFTS` grafts of the tree's species and variety, drop on the first ground tile next to the tree, checked below it, then left, right and above (`dropSpot`);
- the tree becomes a stump: `trunk` true, `juvenile` 0, `fruit` 0, season waiting, `tended` false, `boost` 0, `boosted` false. Soil, happiness and variety stay.

A stump grows back:

```
 grown tree --Chop--> stump --juvenileSeconds--> sapling --juvenileSeconds--> waiting --end of day--> in season
```

The stump uses water and fertilizer and changes happiness like any tree. With an axe or chainsaw in hand, a stump or sapling shows its hover line as the prompt.

### Digging up

**Dig** with a shovel on either tile of any tree, stump or sapling. It takes one use. The tree is removed, both tiles become bare soft ground, and a tree seed of its species and variety, quality 0, drops on the clicked tile. The tree's soil and happiness are lost.

### Grafting

**Graft** with a graft in hand, on a tree of the graft's species that is not grown yet — a sapling or a stump — and is not Heirloom (`canGraft`). The tree takes the graft's variety; soil, happiness and growth stay. One graft is used; the work time is `GRAFT_WORK`. To change a grown tree's variety, the player chops it and grafts the stump.

Grafts of annual crops follow the same item rules on growing plants ([[features/plants]]).

### Tending

With the `tending` skill and an empty hand, **Tend** on either tile of a grown tree that is out of season, not a stump, and not yet tended this out-of-season: `chance` + 0.15. `tended` resets when the next season ends.

### Extract

With an Extract or Infused Extract bag in hand ([[items/produce/extract]]), **Pour extract** on either tile of a tree that has not had Extract (`Tree.boosted` false) takes `EXTRACT_WORK` seconds, uses `EXTRACT_POUR` L and sets `boosted`:

| tree | effect |
|---|---|
| sapling or stump | `Tree.boost` is set to `EXTRACT_SECONDS`, or `EXTRACT_INFUSED_SECONDS` with Infused Extract. While it is above 0, `juvenile` gains `EXTRACT_GROWTH` ÷ `EXTRACT_SECONDS` more per second, at every happiness and range as the sapling's own growth does, and `boost` falls by `dt`. When `juvenile` reaches 1, `boost` becomes 0. |
| grown, out of season | `chance` + `EXTRACT_SEASON`, the same for both bags; it adds to `chance` as Tend does |
| grown, waiting or in season | no prompt; nothing is used |

`boosted` resets at a chop, when a stump becomes a sapling, and when a season ends. Extract and Tend both count on the same out-of-season.

### Varieties: how trees differ from annual crops

| | annual crop | tree |
|---|---|---|
| variety at the start | the seed's | the seed's |
| variety change | a random chance at every ripening (`upgradeVariety`), from quality, skills, a different variety nearby and familiarity; a graft | a graft only |
| graft | on a growing plant that is not Heirloom; also sets the plant's quality | on a sapling or stump that is not Heirloom |
| fruit quality | set at ripening from happiness | 0 |
| grow time | × `VARIETY_GROW` | `juvenileSeconds` and `fruitSeconds`, the same for every variety |
| tolerances × `VARIETY_TOL` | yes | yes |
| rot time × `VARIETY_ROT` | yes | yes, for fallen fruit |
| sale × `PURPOSE_MUL` | yes | yes |
| Grinder seeds | the fruit's variety | always Plain |
| where Named and Heirloom come from | upgrades at ripening; seeds from prizes and burrows | tree seeds from prizes and burrows; grafts; digging up a tree |

**Neighbour.** Varieties in `NEIGHBOUR_IDS` need a neighbour; among trees these are Pink Lady (apple) and Bing (cherry). The neighbour is another grown tree of the same species, not a stump and not Heirloom, within `NEIGHBOUR_REACH` tiles of either of the tree's tiles (`hasNeighbour`). A grown tree fills fruit and moves through its seasons only while it has one; the sapling and stump grow, and water, fertilizer and happiness run, either way.

## Screen

- Hover: **{Name} tree - {detail}** (`treeLine`), where detail is **trunk**, **growing** (sapling), **on-season** or **off-season** (also shown while waiting). The name includes the variety: **{Crop} ({Variety}) tree**. [[name-map]] replaces trunk with Stump and on-season / off-season with in season / out of season.
- Hover on a Pink Lady or Bing tree without a neighbour: **Needs another {name} tree nearby that is not Heirloom.**
- Inspect rows: **Growth** (sapling progress while growing, fruit progress after), **Happiness**, **Fertilizer** (litres of `TREE_FERT_MAX`, with the red, orange and green parts of the range), **Water** (litres of `TREE_WATER_MAX`, with the ranges around `TREE_WATER_MID`).
- Prompts: **Plant {Name}**, **Water**, **Fertilize**, **Chop**, **Dig**, **Graft**, **Tend**, **Pour extract**, **Pick up** for fallen fruit.
- Command Center: **{Crop} is wilting**, **{Crop} is drowning**, **{Crop} is starving for fertilizer** for a tree in a red range, with happiness as the bar and both tiles marked ([[shell]]).
- Sensors: the variety sensor sees trees that are not stumps; the water and fertilizer sensors read the tree's soil once per tree ([[features/sensors]]).

## Guest

A guest can do everything on this page.

## Save and sync

Saved per tree, on its cells: species, `base`, `juvenile`, `fruit`, `yield`, `tended`, `boost`, `boosted`, `trunk`, variety, happiness, and the soil's water, fertilizer and weed chance. Fallen fruit is saved with the ground items.

The digest carries each tree tile's variety, and at `base` the tree's happiness, water and fertilizer ([[systems/net]]).

## Art

`src/assets/props/prop-{species}-tree.svg`, one tile wide and two tall, with groups `trunk`, `grow`, `unripe` and one ripe group per variety the species has (`ripe`, `ripe-variant`, `ripe-heirloom`), chosen from `Tree.stage()`. Items: `item-seed-{species}.svg`, `item-graft-{species}.svg`, `item-wood.svg`; fruit faces in `src/assets/fruits/`.

## Sound

Chopping with an axe or chainsaw plays a knock on every stretch of work and a crack and thud at the end; digging a tree up plays the shovel's dig; watering and fertilizing play as on a plot ([[systems/sound]]).

## Invariants

| id | rule | test |
|---|---|---|
| `trees.drink` | every stage uses `waterUsePerSec` and `TREE_FERT_PER_DAY ÷ DAY_SECONDS` from the tree's soil, once per tree | `trees.test.ts` |
| `trees.happy` | tree happiness uses the `TREE_HAPPY_*` times; at happiness 0 the tree stays, the sapling grows and fruit fills | `trees.test.ts` |
| `trees.chance` | out of season, each end of day adds `TREE_OFF_CHANCE` of the happiness range; a season ends with `chance = −0.25 + 0.1 × happiness` | `trees.test.ts` |
| `trees.yield` | sapling for `juvenileSeconds`, then waiting, then `TREE_YIELD_DAYS` in season; fruit rates `2.75 + 0.5 × happiness` and `0.25 + 0.5 × happiness` | `plants.test.ts` |
| `trees.trunk` | chop → stump for `juvenileSeconds` → sapling for `juvenileSeconds` → waiting | `trees.test.ts` |
| `trees.chop` | one wood, and `CHOP_GRAFTS` grafts with `grafting`; fruit progress lost; soil and happiness kept | `trees.test.ts` |
| `trees.wild` | chunk `(0, 0)` has one Plain wild apple with the new-tree soil and happiness | `trees.test.ts` |
| `trees.drop` | fallen fruit has the tree's variety, quality 0, freshness 1; digging gives a tree seed of that variety at quality 0 | `plants.test.ts`, `world.test.ts` |
| `trees.tend` | tending an out-of-season tree adds 0.15 to `chance` once per out-of-season | `plants.test.ts` |
| `trees.extract` | Extract on a sapling or stump adds `EXTRACT_GROWTH` ÷ `EXTRACT_SECONDS` to `juvenile` per second for the bag's seconds; on an out-of-season tree it adds `EXTRACT_SEASON` to `chance`; no prompt on a waiting or in-season tree; once until a chop, a stump becoming a sapling, or a season end | `extract.test.ts` |
| `water.pour` | a bucket fills a tree to `TREE_WATER_MID` + `waterTolerance` | `trees.test.ts` |
| — | a tree's variety changes by a graft only | `plants.test.ts` |
| — | chop, trunk, grow and dig in the browser; tree inspect bars; Command Center rows for a tree | `e2e/trees.spec.ts` |

## When you change this

- New tree species: `TreeId`, `TREE_IDS`, a `TREES` row, a `CROPS` row, a `TREE_FERT_PER_DAY` row, `VARIETIES`, the Market rows for its fruit ([[features/market]]), the contract tables `GOOD_COST`, `GOOD_TIER`, `FEASIBLE_PER_DAY` ([[features/contracts]]), art with one ripe group per variety, a species page in `items/crops/`.
- Soil or range rules: the tree shares `waterBand`, `fertBand`, `ageHappiness` and `Soil` with annual crops ([[features/plants]]); change both on purpose.
- Anything that waters or fertilizes tiles (a new trailer, sprinkler or weather kind) must treat a tree as one target with its own soil.

## Decisions

- A tree lives for the rest of the game; its variety changes by a graft only.
- A tree uses water and fertilizer from its own soil, which holds more than a plot's, and uses it slowly.
- Tree seeds come from contract prizes, burrows, the Grinder and digging up a tree.
- After a chop the tree grows back in two full sapling periods: first the stump, then the sapling.
