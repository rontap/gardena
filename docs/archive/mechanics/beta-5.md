# Beta-5 mechanics

**Historical.** Current law: [[mechanics/beta-6]].

Supersedes [[mechanics/beta-4]] where this file names a replacement. Types: [[architecture/beta-5]]. Chrome: [[ui/beta-5]]. Art: [[art/beta-5]].

Beta-4 world, gen, expand, tax, pumps, rarity, pickaxe, walk, chest, grinder, speech stay except below.

Water network: pumpjacks / wells → pipes on **cell edges** → sprinklers on **grid vertices** → growing plants.

`SPRINKLER_RATE = 0.5`

Forbidden: fertilizer / soil; deleting buildings (house, pumpjack, well, chest, grinder, rock); pipe as an inventory item / stacks; per-edge flow, pressure, or pipe capacity; storing unused water; changing starter or pumpjack output/footprint.

## Geometry

Pipes live on **edges**. Sprinklers live on **vertices**. Neither is a `Cell`. Neither is solid. Walk through. Hoe / plant / drops unchanged on the plots underneath.

```
Edge  = { axis:'h'; col; row }  // north side of cell (col,row); vertices (col,row)↔(col+1,row)
      | { axis:'v'; col; row }  // west side of cell (col,row);  vertices (col,row)↔(col,row+1)

Vertex = { col; row }  // NW corner of cell (col,row)
```

Vertex `(c,r)` incident edges: `h(c-1,r)`, `h(c,r)`, `v(c,r-1)`, `v(c,r)`.

Junction from the incident **set** (not from the SKU):

| degree / shape | sprite |
|---|---|
| 1 | stub |
| 2 collinear | I |
| 2 at a corner | L |
| 3 | T |
| 4 | X |

One pipe SKU. View picks the sprite and rotation.

An edge is **owned** iff at least one of its two cells is `inWorld`. Place / delete only owned edges. Edges along solids (house, pump, rock, …) are legal.

Vertex `(c,r)` incident cells: `(c-1,r-1)`, `(c,r-1)`, `(c-1,r)`, `(c,r)`. A vertex is **owned** iff ≥1 incident cell is `inWorld`. Place / delete sprinkler only owned vertices.

```
Sprinkler =
  | { variant: 'basic'; at: Vertex }
  | { variant: 'vert'; at: Vertex; facing: 'ns' | 'ew' }
  | { variant: 'large'; at: Vertex }
```

One sprinkler per vertex. Not a plot. Not `isSolid`.

## Pipe place

SKU `buy-pipe` **$4**. Shop-place. **Stays armed** after a successful confirm (exception to [[ui/place]]).

Click the **side** of a hovered cell: nearest edge, and only if the pointer is within **0.35** tile of that edge. One edge per click. Corner → one nearest edge, never two.

Confirm:

- edge owned
- no pipe already on it
- `money ≥ 4`

Pay 4. That edge becomes a pipe. Adjacent pipes share a vertex → one system. Tool stays.

Already piped / not an edge / unowned → no-op, no charge. Cannot afford → blocked look, stay armed.

Esc / right-click / shop close → `cancelPlace`.

## Sprinklers

Three SKUs. Snap to the nearest **vertex**. Do not occupy a plot. One sprinkler per vertex. Confirm: owned vertex, no sprinkler already at V, every AoE cell `inWorld`, can pay. Isolated sprinkler (no incident pipe) is stored. `rate` 0 until a pipe path to starter / pumpjack / well. AoE may cover solids / empty / infertile (those cells just waste water).

| SKU | name | $ | AoE |
|---|---|---|---|
| buy-sprinkler | Sprinkler | 15 | 2×2 around V: cells `(v.col-1,v.row-1)`, `(v.col,v.row-1)`, `(v.col-1,v.row)`, `(v.col,v.row)` |
| buy-sprinkler-vert | Vertical sprinkler | 30 | 8 cells, centered on V. NS: `col∈[v.col-1,v.col+1)`, `row∈[v.row-2,v.row+2)`. EW: `col∈[v.col-2,v.col+2)`, `row∈[v.row-1,v.row+1)` |
| buy-sprinkler-large | Large sprinkler | 33 | 4×4 centered on V: `col∈[v.col-2,v.col+2)`, `row∈[v.row-2,v.row+2)`. Two cells each cardinal |

Large 4×4 is **centered** on V, not 3×3 NW-anchored. Catalog `w×h` = 4×4.

4×2 is **centered** on the vertex.

Vertical facing from pointer offset vs vertex: `|dx|≥|dy|` → EW, else NS. No new key. Right-click still cancels.

Stay armed after confirm. Pay on confirm. Vertical facing follows pointer offset while armed.

Unowned vertex / occupied vertex / AoE off-map / cannot afford → blocked, no charge.

Plots under sprinklers stay plantable.

## Systems and water

A **system** is a connected component of pipe edges, plus any source that touches the component, plus any sprinkler whose vertex has an incident edge in the component.

Source touch: at least one **boundary edge** of a cell occupied by that pump/well is piped.

```
C = Σ outputLitersPerSec of sources in the component
N = sprinkler count in the component
R = N===0 ? 0 : min(0.5, C/N)     // L/s per sprinkler
```

No per-edge throughput. Joining two runs (place a bridging pipe) sums C and N. Deleting a bridge splits them. Spare C beyond `0.5*N` is wasted, not stored.

Isolated sprinkler (no incident pipe): not in a system. `rate` 0. Sprinkler with pipes but no path to a source: `R = 0`.

Pipe wet vs dry is view-derived (`C>0`). Not stored. Does not change C / N / R.

Only **growing** plants in the AoE receive water. Ripe / dead / empty / non-plot: skip.

`thirst` is a 1 L tank (bucket already fills it to 1). `tickField`: existing plant drink / growth / death, **then** sprinkler liters. For each sprinkler with `rate(s.at) > 0`, add up to `R*dt` into growing in-world AoE cells, clamp thirst 1 (split or sequential — impl). Conservation is law. Liters that would push `thirst` past 1 are waste. Overlapping AoEs stack. When `R>0` and ≥1 growing AoE target, thirst must rise (clamp 1).

A growing plant whose total incoming L/s from sprinklers ≥ `waterUsePerSec`, and that started the tick at 1, ends the tick at 1.

Working iff `R>0` and the AoE has ≥1 growing plant. Else idle.

## Sources

| thing | footprint | L/s | $ | notes |
|---|---|---|---|---|
| starter | existing circle `(18.5,7.5) r=0.5` | 2 | — | **can** feed pipes on its occupied cell's edges. Bucket fill unchanged |
| pumpjack | 2×1 rect, as now | 2 | **40** (was 50) | fill unchanged |
| well | 1×1 rect | 5 | 75 | new. Place like chest: one Plot untilled or empty, no drops. Solid. Fill like a pump |

Well is a `Pump` (same fill path). Look **Well**. Starter and pumpjack look stay **Pump**.

`isSolid` += well. Not a Plot. No plant / hoe / drop / SKU-place onto it.

`{ act:'fill'; at }` — walk to `at`, fill at **that** source’s rate.

Primary act well: fill. Speech: well/pump still **fill**. No new speech lines.

Sprinkler is not a cell; no look unless delete/place armed.

## Delete

SKU `buy-delete`, **$0**, Automation. Arms a delete mode. Does not spawn an item. Stays armed. No refund.

Click owned piped edge → remove that pipe. Click owned sprinkler vertex → remove that sprinkler. Else no-op.

Cannot delete buildings. Esc / right-click cancels.

## Research, shop, watermelon

`unlock-pumpjack` **dies**. Replaced by Irrigation on **automation** (off utilities).

Research rows may be hidden. `ResearchDef.reveal: 'start' | ResearchId`. Hidden ≠ greyed. `unlockAll` still completes every row.

Beta-4 RESEARCH except `unlock-pumpjack`. Those rows `reveal: start`.

| id | name | tree | $ | s | reveal | effect |
|---|---|---|---|---|---|---|
| unlock-watermelon | Watermelon seeds | plants | 8 | 35 | start | unlock pack-watermelon |
| unlock-irrigation | Irrigation | automation | 20 | 50 | start | unlock buy-pumpjack |
| unlock-auto-irrigation | Automated irrigation | automation | 22 | 55 | unlock-irrigation | unlock pipe + basic sprinkler |
| unlock-adv-irrigation | Advanced irrigation | automation | 28 | 65 | unlock-auto-irrigation | unlock well + vertical + large |

`unlock-grinder` stays, reveal start.

Shop SKUs:

| id | $ | unlock | show |
|---|---|---|---|
| pack-watermelon | 12 | unlock-watermelon | start |
| buy-pumpjack | 40 | unlock-irrigation | start |
| buy-pipe | 4 | unlock-auto-irrigation | unlock-auto-irrigation |
| buy-sprinkler | 15 | unlock-auto-irrigation | unlock-irrigation |
| buy-sprinkler-vert | 30 | unlock-adv-irrigation | unlock-auto-irrigation |
| buy-sprinkler-large | 33 | unlock-adv-irrigation | unlock-auto-irrigation |
| buy-well | 75 | unlock-adv-irrigation | unlock-auto-irrigation |
| buy-delete | 0 | unlock-irrigation | unlock-irrigation |

Watermelon crop (tomato-shaped, thirsty):

| | growSeconds | waterUsePerSec | sale | seed |
|---|---|---|---|---|
| tomato (ref) | 90 | 0.009333 | 14 | 7 |
| watermelon | 90 | **0.023333** (2.5× tomato) | 14 | 7 |

Pack `pack-watermelon` **12**. Research `unlock-watermelon` **8 / 35**.

## Catalog

`catalogEntries()` maps defs. New entries: watermelon (crop template), pipe, three sprinklers, well. Skip delete.

| entry | keys |
|---|---|
| watermelon | name, growSeconds, waterUsePerSec, sale, seed |
| pipe | price = 4 |
| sprinkler | name, w, h, rate = SPRINKLER_RATE; large w×h = 4×4 |
| well | output = 5 |

Templates:

- pipe: `Pipe. $4 per edge. Hidden unless the Pipes lens or a pipe tool is out.`
- sprinkler: `${name}. ${w}×${h} plots. ${rate} L/s.`
- well: `Well. ${output} L/s. One tile.`

## Named invariants (tests after impl)

Keep 1–42. Add:

43. `buy-pipe` is 4. Two adjacent owned edges, stay armed, one component.
44. Vertex degree 1/2-colinear/2-corner/3/4 ⇒ stub/I/L/T/X.
45. `buy-pumpjack` is 40. `buy-well` is 75, 1×1, output 5. Starter in a piped component adds 2 to C.
46. One pumpjack + five sprinklers on that system: each `R === 0.4`.
47. Sprinkler whose vertex has pipes but no source: `R === 0`.
48. `RESEARCH` names/trees/reveal match R8. `unlock-pumpjack` does not exist. `skuShown('buy-sprinkler')` is true after Irrigation, `skuOpen` is false until Automated.
49. Watermelon `waterUsePerSec === 0.023333`, pack 12, plants research 8/35.
50. Delete pipe or sprinkler: money unchanged. Pumpjack still there.
51. Basic AoE is the four cells around V. Large is the 4×4 centered on V (not 3×3). Vertical NS vs EW match R3.
52. Growing plant at thirst 1, incoming L/s ≥ waterUse, still 1 after a tick. Ripe in AoE does not change thirst.
53. Place basic sprinkler with no incident pipe succeeds; `rate` 0.
54. Isolated sprinkler then a pipe that touches a source on that vertex: `rate` becomes `min(0.5, C/N)`.
55. Growing plant in AoE, `R>0`, after a tick thirst is not below the no-sprinkler trajectory (waters). When `R>0` and ≥1 growing AoE target, thirst must rise (clamp 1).
