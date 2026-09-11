# Inspect

Bottom-right `Status` under the queue. Held face + `heldText` / fruit `ItemLineView`. The held name is rustic, one line. Then `lookText` (cell name, soil, prompt). The first look line is the same rustic face; the rest stays body. Armed place tints the look block roof. Litres and × multipliers a person reads here use `Math.visualRound` — [[architecture/view]] `view.round`.

`Seat.queue` cap `QUEUE_CAP`. A further click `say`s **I can't remember more errands than that!**. [[architecture/world]] `world.queue`

Plant bars on hover of a growing or ripe plot. Empty soil bars. Tree Growth fill. Title, drop, and prompt stay in the look block. `lookText(..., plantStats: false)` — numbers live on the bars, not duplicated as extra look lines. A tree is not a plot: no soil bars.

Player words on this HUD: **Variety** as `{Crop} ({Variety})`, **Quality** as `floor(quality * 100)%`. `tier` and `purpose` are vault-only; a purpose reaches the player as **Fresh** / **Preserving** / **Alcohol** on the seed callout — [[ui/store]] — and as the `×{mul}` on a cask, spirit or jam line.

Held, tooltip, silo cell, silo Buy cell: Variety name, Quality as that percent. A seed pack is `'base'` at Quality 0. Faces carry no mark — the Variety group is the face. [[architecture/view]] [[ui/store]]

## Growing

Look names the Variety, not the crop alone. Copy: **{Variety}**. Growth % stays on the bar.

| row | fill | number |
|---|---|---|
| Growth | fill bar | `floor(maturity * 100)%` |
| Happiness | segmented + notch | `floor(happiness * 100)%` |
| Fertilizer | segmented + notch | `floor(fertilizer * 100)%` |
| Water | segmented + notch | `{water}L` `Math.visualRound` |

Growth is a fill, not a banded bar. Happiness / fertilizer / water: dark track, colored segments, pale notch at current value. Bands: green, amber, red — [[art/palette]].

| bar | red | amber | green |
|---|---|---|---|
| Happiness | `0 .. HAPPY_START/2` | `HAPPY_START/2 .. HAPPY_START` | `HAPPY_START .. 1` |
| Fertilizer | `0 .. floor/2` | `floor/2 .. floor` | `floor .. 1` |
| Water | dry + drown ends | between red and green | `MID ± waterTolerance` |

`floor = FERT_PLOT_MAX - fertTolerance`. Water is 0–`SOIL_WATER_MAX`. Happy band centered on `SOIL_WATER_MID`. Red at both ends. No Quality bar while growing. Happiness is the live care; Quality bakes at ripen.

## Neighbour

One `lookText` line in that same `Status` block, after the plant or tree look, before the prompt. Not a bar. Not ObjectHud. Same insertion as covering haste. `keknyelu` `pink-lady` `bing` only. Rule [[mechanics/plants]] `variety.neighbour`.

| when | line |
|---|---|
| growing annual, that Variety, no valid neighbour | **Needs another {crop} nearby that is not Heirloom.** |
| tree, that Variety, `juvenile >= 1`, `trunk === false`, no valid neighbour | **Needs another {crop} tree nearby that is not Heirloom.** |
| those, valid neighbour | (no line) |
| any other Variety | (no line) |

Hover also paints the reach: one path around the union of the cells in range, the same union walk as the furnace covering outline — [[architecture/view]] `view.outline`. Stroke is the inspect-bar `good` when a valid neighbour is in range, `bad` when none is — [[art/palette]]. It draws for those three Varieties only, whether or not the need is met, and only with an empty place tool. No fill.

## Store contents

Hovering a `chest` or `freezer` that holds anything adds one block under the look text: the filled slots as a wrapped row of `DashFace`. Empty store draws nothing — the look line already names it.

## Barrel aging

Hovering a barrel past `BARREL_MATURE` adds an **Aging** fill row: `(age - BARREL_MATURE) / BARREL_AGE`, with `Math.visualRound(caskMulOf)` as the right-hand readout. The maturing ramp before that is the craft panel's own progress — [[ui/recipe]]. The look block above it carries the aging top line — [[ui/machines]].

## Ripe

Look names the Variety and nothing else. Copy: **{Variety}**. Quality and Freshness are the two bars under it, `FruitStats`. Quality: fill bar, `floor(quality * 100)%`. Freshness: banded, no amber, `floor(freshness * 100)%`. Freshness bands: red `0 .. 0.8`, green `0.8 .. 1`. Notch at current.

## Fruit on the ground

A fruit item lying on the hovered cell draws the same `FruitStats` block, from the item's own `quality` and `freshness`. Top drop only, the one the look line names. Its look line is **{Variety} - {count}** and stops there. Any other dropped item keeps its full `heldText` line and draws no bars. A ripe plot carrying a dropped fruit draws both blocks, plant first, drop second.

Weed / dead / rotten / turf / untilled: no bars. Burrow is untilled cover: no bars. Look names the burrow, not loot: **Burrow**. Not Grass. Not Hard soil.

## Empty

`kind: 'empty'` only. Fertilizer fill bar, `floor(fertilizer * 100)%`. Water fill bar, `{water}L`. Weed resistance banded, no amber, `clamp((1 - weedChance) / 2, 0, 1)`, `floor(* 100)%`. Weed resistance: 1 at `weedChance === -1`. Green `weedChance < 0`. Red `weedChance >= 0`. Outbreak above +1 clamps to 0. Label **Weed resistance**.

## Tend

Empty hand, player owns `tending`, work `TEND_WORK`. Click queues `{ act: 'tend'; at }`. Prompt **Tend**. Growing plot, `plant.tended === false`: plants unchanged. Not ripe. Not twice. Tree, `juvenile >= 1`, `yield.kind === 'off'`, `Tree.tended === false`, `trunk === false`: either cell of the 1×2. Not pending. Not `{ on }`. Not juvenile. Not trunk. `pending` look is off-season; prompt is not Tend. Else empty-hand growing / tree stays **Move here**. [[mechanics/family]] [[mechanics/trees]] `trees.tend`.

## Tree

Cell `kind: 'tree'`. Not a plot. No Happiness / Fertilizer / Water / Freshness bars. No soil bars. `lookText` uses the Variety name. No `%` in the line. Copy: **{Variety} tree - {trunk \| growing \| on-season \| off-season}**. Neighbour line may follow.

| state | line |
|---|---|
| `trunk === true` | **{Name} tree - trunk** |
| `trunk === false` && `juvenile < 1` | **{Name} tree - growing** |
| `yield` `{ on }` | **{Name} tree - on-season** |
| `pending` or `{ off }` | **{Name} tree - off-season** |

`{Name}` is the Variety, not only the species. FillBar label **Growth**: `juvenile` 0..1 while `trunk` or `grow`; `fruit` 0..1 once mature.

## Prompts

Tree seed in hand, hovered cell plus the cell **above** it a valid owned 1×2 untilled `ground === 'soft'` (bare or grass): **Plant {Apricot|Olive|Cherry|Apple}**. `{ act: 'plant' }`. Tilled plot: no-op. Burrow: no-op — [[mechanics/plants]] [[mechanics/burrow]] `burrow.block`.

Shovel on tree: **Dig**. `{ act: 'shovel' }`. Including trunk. No harvest on trees. Shovel on burrow: **Dig**. Work `workSeconds × BURROW_MUL`. 1 use. Does not till. Look does not name loot. Pickaxe: no-op, prompt stays the look line. [[mechanics/burrow]] `burrow.dig`.

Treasure on the ground: **Pick up**, `{ act: 'pickup'; at }`. Picking it up pays `coins` and clears the drop. It is never held, so there is no **Open treasure**.

Held axe, `cell.kind === 'tree'`, `juvenile >= 1`, `trunk === false`: **Chop**. `{ act: 'chop'; at }`. Either cell. Axe on grow / trunk: no-op. Chop yields 1 wood and 2 grafts of that tree's Variety, then `trunk = true`, `juvenile = 0`, fruit lost.

Held graft, hovered legal target, same crop, target `tier` is not `heirloom`: **Graft**. `{ act: 'graft'; at }`. Annual `growing`. Tree `juvenile < 1`. Illegal target: prompt stays the look line. A graft is never planted.

Ripe annual including sugar-cane: **Harvest**. Empty hand, or the same crop + Variety in hand under the stack cap. `{ act: 'harvest' }`. Same crop + Variety at the cap: `blocked` **My hand is full!** — [[mechanics/inventory]]. Cane is fruit, not sugar liters.

Held `weed-spray`, tilled plot, `liters >= 1`: **Spray**. `{ act: 'weed-spray'; at }`. Instant. Spend 1 L. Not untilled. Not spray-trailer. [[mechanics/weeds]]

## Machines

Mill, jam, still, barrel, freezer, grinder, furnace, infuser: look and prompt [[ui/machines]]. Station: look, prompt, and walk-up panel [[ui/station]]. Not plots. No Growth / Happiness / Fertilizer / Water / Freshness bars. No ObjectHud. Mill, jam, still, barrel, grinder, compost-box, furnace, infuser hover adds one recipe row under the look block — [[ui/recipe]]. Freezer has no recipe. Station has no recipe row. Covering haste is a `lookText` line in that same `Status` block, after the machine look, before the prompt — [[ui/machines]].

## Held

| item | line |
|---|---|
| fruit | **{Variety} - {count}, freshness {n}% · Quality {n}%** — the held line, not the ground line |
| seeds | **{Variety} seed - {count}, plant it · Quality {n}%** |
| tree-seed | **{Variety} seed - plant it on soft ground · Quality {n}%** |
| graft | **{Variety} graft - {count} · Quality {n}%** |
| spirit / cask / jam / oil / flour / extract / sugar / flakes / vanilla-extract / bread | Quality as percent with the existing name line. Named jam and **Premium** casks from [[ui/recipe]]. Sugar **Sugar - {n}L**. Infused: **Infused {name}** plus overlay-infused. Flakes: **Flakes - {count}**. Vanilla-extract: **Vanilla extract - {count}**. Bread: **Bread - {count}** |
| wood | **Wood - {count}** |
| ash | **Ash - {count}, compost it** |
| axe | **Axe - {left}/{uses} uses left** |
| treasure | **Treasure - {coins}** — Coin for `coins`. Money, not gold |

`cut` on fruit is not a HUD flag. Tooltip is `itemTip`: same Variety + Quality words as the held line.

## Vehicles

Hangar, parked or automated Quad, parked or automated tractor: look and prompt [[ui/vehicles]]. Field silos: look name only, no prompt, no dialog. Not plots. No soil bars. No ObjectHud. Illegal: hangar or vehicle on `HudTarget`.

## Sensors

Sensor cells and valves: look names [[ui/sensors]]. Not plots. No Growth / Happiness / Fertilizer / Water / Freshness bars. Look may append **on** / **off**. Water-system not on a net: **Water-system sensor - no pipes around sensor!** Exact. Else **Water-system sensor - on/off**. Fenceable reader on a fence that closes nothing: **open fence, close it to turn the sensor on**. Exact. Lever / button walk-to: **Flip lever** / **Press button**. Water / harvest / counter / day / logic / variety / weather / pressure HUD: **Tune {skuLabel}** when port hits are off. Fertilizer / water-system / pulser / lamp / traffic light: look only. [[ui/sensors]]
