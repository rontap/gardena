# Inspect

Bottom-right `Status` under the queue. Held face + `heldText` / fruit `ItemLineView`. Then `lookText` (cell name, soil, prompt). Armed place tints the look block roof (`bg-roof/20`, larger type).

Plant bars on hover of a growing or ripe plot. Empty soil bars. Tree Growth fill. Title, drop, and prompt stay in the look block. `lookText(..., plantStats: false)` — numbers live on the bars, not duplicated as extra look lines. A tree is not a plot: no soil bars.

Player words on this HUD: **Variety**, **Quality** as `floor(quality * 100)%`, paths **Preserving** / **Fresh** / **Alcohol**. A rating number never appears without its path. `tier` is vault-only.

Held, tooltip, silo cell, shop seed card: Variety name, Quality as that percent. Shop pack is `'base'` at Quality 0. Faces carry no mark — the Variety group is the face. [[architecture/view]] [[ui/store]]

## Growing

Look names the Variety, not the crop alone. Copy: `<needs-game-text-writer>`. Growth % stays on the bar.

| row | fill | number |
|---|---|---|
| Growth | fill bar | `floor(maturity * 100)%` |
| Happiness | segmented + notch | `floor(happiness * 100)%` |
| Fertilizer | segmented + notch | `floor(fertilizer * 100)%` |
| Water | segmented + notch | `{water}L` two decimals |

Growth is a fill, not a banded bar. Blue `#4b91c2` vs empty `#8b887d`.

Happiness / fertilizer / water: dark track, colored segments, pale notch at current value. Notch `#fff6d5`, outlined, taller than the bar.

Bands: green `#4f9d69`, amber `#d69a3a`, red `#c9574b`.

| bar | red | amber | green |
|---|---|---|---|
| Happiness | `0 .. HAPPY_START/2` | `HAPPY_START/2 .. HAPPY_START` | `HAPPY_START .. 1` |
| Fertilizer | `0 .. floor/2` | `floor/2 .. floor` | `floor .. 1` |
| Water | dry + drown ends | between red and green | `MID ± waterTolerance` |

`floor = FERT_PLOT_MAX - fertTolerance`. Water is 0–`SOIL_WATER_MAX` (2 L). Happy band centered on `SOIL_WATER_MID` (1 L). Red at both ends.

No Quality bar while growing. Happiness is the live care; Quality bakes at ripen.

## Neighbour

One `lookText` line in that same `Status` block, after the plant or tree look, before the prompt. Not a bar. Not ObjectHud. Not a new dock. Same insertion as covering haste.

`keknyelu` `pink-lady` `bing` only. `NEIGHBOUR_REACH` Chebyshev from the plot, or from either cell of a 1×2 tree. A valid neighbour is the same crop, `tier` not `heirloom`, and:

- annual: `growing`, water band not red, fertilizer band not red
- tree: `juvenile >= 1`, `trunk === false`

| when | line |
|---|---|
| growing annual, that Variety, no valid neighbour | `<needs-game-text-writer>` names what it is waiting for |
| tree, that Variety, `juvenile >= 1`, `trunk === false`, no valid neighbour | `<needs-game-text-writer>` names what it is waiting for |
| those, valid neighbour | (no line) |
| any other Variety | (no line) |

Without a neighbour the plant does not advance toward fruit — annual `maturity` holds, tree `fruit` holds and the seam does not turn `pending` into `on`. Water, fertilizer, happiness, stunt, death, and `juvenile` still tick. Copy [[agents/game-text-writer]].

## Store contents

Hovering a `chest` or `freezer` that holds anything adds one block under the look text: the filled slots as a wrapped row of `DashFace` (`h-6 w-6` face plus its count badge), same `bg-dirt/25 px-3 py-2.5` chrome as the plant bars. Empty store draws nothing — the look line already names it.

## Barrel aging

Hovering a barrel past `BARREL_MATURE` adds an **Aging** fill row: `(age - BARREL_MATURE) / BARREL_AGE`, with `caskAgeOf` as the right-hand readout. `caskAgeTop(q)` lerps the top over Quality; `caskAgeOf` still reads the multiplier back out of `unitSale`. The maturing ramp before that is the craft panel's own progress — [[ui/recipe]].

## Ripe

Look names the Variety and Quality as a percent. Copy: `<needs-game-text-writer>`. Freshness only on the bar. Red `0 .. 0.8`, green `0.8 .. 1`. No amber. Notch at current. Number `floor(freshness * 100)%`.

Weed / dead / rotten / turf / untilled: no bars.

## Empty

`kind: 'empty'` only.

| row | style | value | number |
|---|---|---|---|
| Fertilizer | blue FillBar `#4b91c2` / `#8b887d` | `fertilizer / FERT_PLOT_MAX` | `floor(fertilizer * 100)%` |
| Water | blue FillBar | `water / SOIL_WATER_MAX` | `{water}L` two decimals |
| Weed resistance | banded, no amber | `clamp((1 - weedChance) / 2, 0, 1)` | `floor(* 100)%` |

Weed resistance: 1 at `weedChance === -1`. Green `weedChance < 0` (bar 0.5..1). Red `weedChance >= 0` (bar 0..0.5). Outbreak above +1 clamps to 0. Notch at current. Label **Weed resistance**.

## Tend

Empty hand, player owns `tending`, work `TEND_WORK` 0.7s. Click queues `{ act: 'tend'; at }`. Prompt **Tend**.

- growing plot, `plant.tended === false`: plants unchanged. Not ripe. Not twice.
- tree, `juvenile >= 1`, `yield.kind === 'off'`, `Tree.tended === false`, `trunk === false`: either cell of the 1×2. Not pending. Not `{ on }`. Not juvenile. Not trunk. Not grow. Not twice.

`pending` look is off-season; prompt is not Tend. Else empty-hand growing / tree stays **Move here**. [[mechanics/family]] [[mechanics/trees]] `trees.tend`.

## Tree

Cell `kind: 'tree'`. Not a plot. No Happiness / Fertilizer / Water / Freshness bars. No soil bars.

`lookText` uses the Variety name. No `%` in the line. Player copy: resting → off-season, yielding → on-season. Copy: `<needs-game-text-writer>`.

| state | line |
|---|---|
| `trunk === true` | **{Name} tree - trunk** |
| `trunk === false` && `juvenile < 1` | **{Name} tree - growing** |
| `yield` `{ on }` | **{Name} tree - on-season** |
| `pending` or `{ off }` | **{Name} tree - off-season** |

`{Name}` is the Variety, not only the species. Neighbour line may follow — [[#Neighbour]].

Blue plant FillBar (`#4b91c2` / `#8b887d`), label **Growth**: `juvenile` 0..1 while `trunk` or `grow`; `fruit` 0..1 once mature. Number `floor(* 100)%`. Trunk and grow both **Growth** on `juvenile`.

## Prompts

Tree seed in hand (`{ kind: 'tree-seed'; tree; variety; quality }`), hovered cell plus the cell **above** it a valid owned 1×2 untilled `ground === 'soft'` (bare or grass): **Plant {Apricot|Olive|Cherry|Apple}** (`TREE_NAME`). `{ act: 'plant' }`. Work same as sowing. Cover grass clears to bare. Tilled plot: no-op — [[mechanics/plants]].

Shovel on tree: **Dig**. `{ act: 'shovel' }`. Including trunk. No harvest on trees.

Held axe, `cell.kind === 'tree'`, `juvenile >= 1`, `trunk === false`: **Chop**. `{ act: 'chop'; at }`. Either cell. Axe on grow / trunk: no-op. Prompt is the look line. Chop yields 1 wood and 2 grafts of that tree's Variety, then `trunk = true`, `juvenile = 0`, fruit lost.

Held `{ kind: 'graft'; crop; variety; quality; count }`, hovered legal target, same crop, target `tier` is not `heirloom`: **Graft**. `{ act: 'graft'; at }`. `dest` = `at`. Work `GRAFT_WORK`.

| target | state |
|---|---|
| annual `Plant` | `growing`. Not ripe, dead, rotten, empty. |
| `Tree` | `juvenile < 1` — sapling or `trunk`. Not mature. |

Illegal target: prompt stays the look line. A graft is never planted.

Ripe annual including sugar-cane: **Harvest**. Empty hand, or the same crop + Variety in hand under the stack cap. `{ act: 'harvest' }`. Same crop + Variety at the cap: `blocked` **My hand is full!** — [[mechanics/inventory]]. Cane is fruit, not sugar liters. Not holding sugar. Quality averages on merge.

Held `weed-spray`, tilled plot, `liters >= 1`: **Spray**. `{ act: 'weed-spray'; at }`. Instant. Spend 1 L. Not untilled. Not spray-trailer. [[mechanics/weeds]]

## Machines

Mill, jam, still, barrel, freezer, grinder, furnace: look and prompt [[ui/machines]]. Station: look, prompt, and walk-up panel [[ui/station]]. Not plots. No Growth / Happiness / Fertilizer / Water / Freshness bars. No ObjectHud.

Mill, jam, still, barrel, grinder, compost-box, furnace hover adds one recipe row under the look block, own `bg-dirt/25 px-3 py-2.5` band, like the plant bars. The arrow is a fill, not a `Bar` — [[ui/recipe]]. Freezer has no recipe. Station has no recipe row. Still / furnace: either cell, one row.

Covering haste is a `lookText` line in that same `Status` block, after the machine look, before the prompt. Not the recipe row. Not ObjectHud. Not a new dock.

| when | line |
|---|---|
| mill / jam / still / grinder / compost-box / furnace, covering working `n > 0` | **Finishes {pct}% faster with {n} working Furnace than without a Furnace.** / **Finishes {pct}% faster with {n} working Furnaces than without a Furnace.** |
| those, `n === 0` | (no line) |
| barrel | never |
| station | never |

`{pct}` is `FURNACE_HASTE × n` as percent. `{n}` is covering count. Still / furnace: either cell, one line. Live working set. Copy [[ui/machines]].

## Held

| item | line |
|---|---|
| fruit | `<needs-game-text-writer>` Variety, count, Quality as percent, freshness |
| seeds | `<needs-game-text-writer>` Variety, count, Quality as percent |
| tree-seed | `<needs-game-text-writer>` species, Variety, Quality as percent |
| graft | `<needs-game-text-writer>` Variety, count, Quality as percent |
| spirit / cask / jam / oil / flour / extract / sugar | Quality as percent with the existing name line. Named jam from [[ui/recipe]]. Sugar **Sugar - {n}L** |
| wood | **Wood - {count}** |
| ash | **Ash - {count}, compost it** |
| axe | **Axe - {left}/{uses} uses left** |

`cut` on fruit is not a HUD flag. Tooltip is `itemTip`: same Variety + Quality words as the held line.

## Vehicles

Hangar, parked or automated Quad, parked or automated tractor: look and prompt [[ui/vehicles]]. Field silos: look name only (**Seeding silo** / **Spraying silo** / **Produce silo**), no prompt, no dialog. Not plots. No soil bars. No ObjectHud. Illegal: hangar or vehicle on `HudTarget`.

## Sensors

Sensor cells and valves: look names [[ui/sensors]]. Not plots. No Growth / Happiness / Fertilizer / Water / Freshness bars. Look may append **on** / **off**.

Water-system not on a net: **Water-system sensor - no pipes around sensor!** Exact. Else **Water-system sensor - on/off**.

Lever / button walk-to: **Flip lever** / **Press button**. Water / harvest / counter / day HUD: **Tune water sensor** / **Tune harvest sensor** / **Tune counter** / **Tune day sensor** when port hits are off. ObjectHud family, not a new shell. Fertilizer / water-system / vehicle detector / pulser / gates / lamp / traffic light: look only. Pulser **Pulser**. Counter **Counter**. Day **Day sensor**. Traffic light **Traffic light**. [[ui/sensors]]
