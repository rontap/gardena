# Beta-5 architecture

**Historical.** Current law: [[architecture/beta-6]].

Supersedes [[architecture/beta-4]] where this file names a replacement. Rules: [[mechanics/beta-5]]. Chrome: [[ui/beta-5]]. Place: [[ui/place]].

## Tree

```
src/game/
  defs/crops.ts items.ts research.ts rarity.ts catalog.ts
  sim/
    (beta-4)
    ids.ts          CropId ResearchId SkuId
    building.ts     Pump.form
    pipe.ts         Edge Vertex Sprinkler Junction System aoe vertexOwned
    world.ts        off-cell pipes / sprinklers
    prompt.ts       sprinklerPrompt
  view/ map.tsx camera.ts svgs.ts motion.ts
  ui/   (beta-4)
src/App.tsx         lens view-local
playwright.config.ts
e2e/irrigation.spec.ts
```

Pipes and sprinklers are not `Cell`. Not solid. `src/game/sim/pipe.ts` owns geometry. `World` owns storage. `Lens` stays on App. Wetness and ghosts are view-derived.

## Geometry

```
type Edge =
  | { axis: 'h'; col: number; row: number }
  | { axis: 'v'; col: number; row: number }

type Vertex = { col: number; row: number }
```

`h(c,r)` north side of cell `(c,r)`; vertices `(c,r)↔(c+1,r)`.
`v(c,r)` west side of cell `(c,r)`; vertices `(c,r)↔(c,r+1)`.
`Vertex` is the NW corner of cell `(col,row)`.

Incident edges of vertex `(c,r)`: `h(c-1,r)`, `h(c,r)`, `v(c,r-1)`, `v(c,r)`.

Incident cells of vertex `(c,r)`: `(c-1,r-1)`, `(c,r-1)`, `(c-1,r)`, `(c,r)`.

Incident cells of `h(c,r)`: `(c,r)`, `(c,r-1)`. Of `v(c,r)`: `(c,r)`, `(c-1,r)`.

Owned edge: ≥1 incident cell `inWorld`. Place / delete only owned edges.

Owned vertex: ≥1 incident cell `inWorld`.

```
type Junction = 'stub' | 'I' | 'L' | 'T' | 'X'
```

`junction(v)` from the incident **set**: degree 1 stub, 2 collinear I, 2 corner L, 3 T, 4 X. Defined iff degree ≥ 1. Not stored. View picks sprite and rotation.

`pipe.ts`: `edgeKey` `vertexKey` `incident` `edgeOwned` `vertexOwned` `junction` `aoe`.

## Sprinkler

```
type Sprinkler =
  | { variant: 'basic'; at: Vertex }
  | { variant: 'vert'; at: Vertex; facing: 'ns' | 'ew' }
  | { variant: 'large'; at: Vertex }
```

Not a `Cell`. One per vertex.

`aoe(s): Coord[]`

- basic: `(v.col-1,v.row-1)`, `(v.col,v.row-1)`, `(v.col-1,v.row)`, `(v.col,v.row)`
- vert NS: `col∈[v.col-1,v.col+1)`, `row∈[v.row-2,v.row+2)`
- vert EW: `col∈[v.col-2,v.col+2)`, `row∈[v.row-1,v.row+1)`
- large: `col∈[v.col-2,v.col+2)`, `row∈[v.row-2,v.row+2)` — 4×4 centered on V, two cells each cardinal

## Pump

Same class. Fill stays `kind === 'pump'`.

```
class Pump {
  kind: 'pump'
  form: 'starter' | 'jack' | 'well'
  base: Base
  get outputLitersPerSec(): number
}
```

| form | base | L/s | look |
|---|---|---|---|
| starter | existing circle `PUMP_BASE` | 2 | **Pump** |
| jack | rect 2×1 | 2 | **Pump** |
| well | rect 1×1 | 5 | **Well** |

`outputLitersPerSec` is the form getter. Do not store a free output. `World.pumps[0]` is starter. Jack and well append. `Cell` still `Pump`. `isSolid` already pump.

## Place

```
type Place = { kind: 'none' } | { kind: 'sku'; id: SkuId }

type StayArmed =
  | 'buy-pipe'
  | 'buy-sprinkler'
  | 'buy-sprinkler-vert'
  | 'buy-sprinkler-large'
  | 'buy-delete'
```

Place union += those SKUs plus `buy-well`. Packs never arm.

Stay-armed: successful confirm does **not** set `none`. Exception to [[ui/place]].

`buy-well` `buy-pumpjack` and the other cell/item SKUs disarm as now.

`placeSprinkler` does **not** require an incident pipe. Confirm:

- matching SKU armed
- `money ≥` price
- owned vertex
- no sprinkler already at V
- every `aoe` cell `inWorld`

Isolated sprinkler (no path to starter / pumpjack / well): stored; `rate` 0 until a pipe path exists. `sprinklerPrompt` / view `sprinklerOk` match those gates. Drop the old incident-pipe block.

## Lens (view-local)

```
type Lens = 'off' | 'water' | 'ripe' | 'kind' | 'pipes'
```

Not on World. Lives in `App` state. `MapView` receives it.

Pipes visible iff lens is `pipes` or `place` is `buy-pipe` / `buy-sprinkler` / `buy-sprinkler-vert` / `buy-sprinkler-large` / `buy-delete` / `buy-well` / `buy-pumpjack`. Sprinklers, wells, pumpjacks always drawn.

AoE wash (not the pipe sprites) iff `lens === 'pipes'` or `place` is `buy-pipe` / `buy-sprinkler` / `buy-sprinkler-vert` / `buy-sprinkler-large` / `buy-delete`. Not well / pumpjack alone.

- placed sprinkler AoE: `fill-water` opacity **0.2**
- placing ghost AoE: `fill-water` opacity **0.35** (existing)

In pipes lens, AoE water wash replaces the generic house wash on those cells. Source cell water 0.72 stays.

Pipes lens icons: `overlay-water.svg` on wells, pumpjacks / starter, and sprinklers. Reuse that asset. At the pump cell min-corner / sprinkler vertex. Kind lens keeps the machine circle; pipes lens uses the icon, not that circle.

Kind lens: well + sprinkler = machine (`water`).

Shop close — X on the shop dock, HUD **Shop** toggle that closes shop, Esc — `World.cancelPlace()` **and** if `lens === 'pipes'` then `lens = 'off'`. Leave `water` / `ripe` / `kind`. Right-click still `cancelPlace` only; does not touch lens.

## Hover cell outline

Beta-1/2: one `stroke-ink` rect on the cell under the pointer.

The cell is `floor` of the world pointer while the pointer is on the map. Always that one ink rect, including when no tool is armed and when pipe / sprinkler / delete is armed. Not gated on `place.kind === 'sku'`.

Pipe / sprinkler / delete keep their own ghosts in addition. Pumpjack still outlines the second tile per [[ui/place]].

Hook: `data-cell-stroke` on that rect.

## Pipe ghost

Not a black `EdgeStroke` bar. Not `item-pipe.svg`.

While `buy-pipe` has an `edgeHit`, the two endpoint vertices draw the **post-confirm** junction: `pipeFit` from the incident arm set **including the pending edge**. Same vertex pieces + rotation as after `placePipe`. Those two vertices show the ghost (`data-pipe-ghost`), not the pre-confirm piece underneath.

Delete still uses `EdgeStroke` / `VertexStroke`.

## Wetness

A pipe edge is **wet** iff `system(e).C > 0`. View-derived. Not a field on `Edge`. No cache.

Vertex piece wetness = C of that component (all incident piped edges at V share it). Dry: omit the water-channel (`#3d7ea6` / token `water`) from the fitting html. Same `pipeFit` junction + rot.

Ghost wetness = C of the component that would exist after confirm (pending edge joined). Isolated pending run, no source touch: dry.

Hook: `data-pipe` on each vertex piece, `data-wet="1"` | `"0"`.

## Research / SKU / crop

```
ResearchId -= 'unlock-pumpjack'
ResearchId +=
  | 'unlock-watermelon'
  | 'unlock-irrigation'
  | 'unlock-auto-irrigation'
  | 'unlock-adv-irrigation'

SkuId +=
  | 'pack-watermelon'
  | 'buy-pipe'
  | 'buy-sprinkler'
  | 'buy-sprinkler-vert'
  | 'buy-sprinkler-large'
  | 'buy-well'
  | 'buy-delete'

CropId += 'watermelon'

ResearchDef.reveal: 'start' | ResearchId
ResearchDef.effect: drop { kind: 'pumpjack' }
```

Existing rows `reveal: 'start'`. `unlock-grinder` stays, reveal start.

`World.researchShown(id)`: `reveal === 'start'` or that research is done. Hidden ≠ greyed. `unlockAll` still completes every row.

| id | unlock | show |
|---|---|---|
| pack-watermelon | unlock-watermelon | start |
| buy-pumpjack | unlock-irrigation | start |
| buy-pipe | unlock-auto-irrigation | unlock-auto-irrigation |
| buy-sprinkler | unlock-auto-irrigation | unlock-irrigation |
| buy-sprinkler-vert | unlock-adv-irrigation | unlock-auto-irrigation |
| buy-sprinkler-large | unlock-adv-irrigation | unlock-auto-irrigation |
| buy-well | unlock-adv-irrigation | unlock-auto-irrigation |
| buy-delete | unlock-irrigation | unlock-irrigation |

`buy-pumpjack` price **40**.

## Storage

Off-cell on `World`. Query by edge / vertex.

```
World.pipes
World.sprinklers
World.hasPipe(e: Edge): boolean
World.sprinklerAt(v: Vertex): Sprinkler | undefined
World.edgeOwned(e: Edge): boolean
World.vertexOwned(v: Vertex): boolean
```

No pipe / sprinkler field on `Cell`. No `wet` on `Edge`.

## World API

```
World.placePipe(e: Edge): void
World.deletePipe(e: Edge): void
World.placeSprinkler(s: Sprinkler): void
World.deleteSprinkler(v: Vertex): void

type System = { C: number; N: number; R: number }
World.system(e: Edge): System
World.rate(v: Vertex): number
```

`C` / `N` / `R` derived each call. Do not store. Do not add component caches.

```
C = Σ outputLitersPerSec of sources in the component
N = sprinkler count in the component
R = N === 0 ? 0 : min(0.5, C / N)
```

No incident pipe or no source path → `rate` is 0. Isolated sprinkler: 0 until a path to starter / pumpjack / well exists.

A system is a connected component of pipe edges, plus any source that touches it, plus any sprinkler whose vertex has an incident edge in it. Source touch: at least one boundary edge of a cell occupied by that `Pump` is piped. Isolated sprinklers are not in a system.

`tickField`: existing plant drink / growth / death, **then** sprinkler liters. For each sprinkler with `rate(s.at) > 0`, add up to `R*dt` into growing in-world AoE cells, clamp thirst 1. This step must mutate thirst when `R>0` and ≥1 growing target exists. Keep `rate` / `system` / `tickField` as these contracts. No new store.

`confirmPlace(at)` stays for cell SKUs (`buy-well` → `Pump` form `well`, like chest). Pipe / sprinkler / delete go through the Edge / Vertex methods.

`cancelPlace` clears `place` only. Lens is App.

## Invariants (do not runtime-check)

- Pipe / sprinkler is not a `Cell`. Walk / hoe / plant / drop read `Cell` only.
- One pipe per edge, one sprinkler per vertex — the map.
- `facing` exists only on `vert`.
- Junction is the incident set. Not a field on `Edge`.
- Wet is not a field on `Edge`.
- `form` is starter | jack | well. Output and look follow. No parallel `Well` class. No free `outputLitersPerSec`.
- Owned edge / owned vertex are `inWorld` queries, not stored flags.
- `C` `N` `R` are derived. No cached component id on the pipe.
- Sprinkler place does not require an incident pipe. Isolated `rate` is 0.
- `unlock-pumpjack` is not a `ResearchId`.
- Stay-armed is `StayArmed`, not a flag on `Place`.
- `Lens` is not on `World`.

## Catalog / Face

`src/game/view/svgs.ts` and `CatalogEntry.icon`:

```
type Face =
  | Item
  | { kind: 'pumpjack' }
  | { kind: 'chest' }
  | { kind: 'grinder' }
  | { kind: 'well' }
  | { kind: 'pipe' }
  | { kind: 'sprinkler' }
  | { kind: 'sprinkler-vert' }
  | { kind: 'sprinkler-large' }
  | { kind: 'delete' }
```

`skuItem` returns `Face`. Catalog entries += watermelon (crop template), pipe, three sprinklers, well. Skip delete.

```
pipe:      Pipe. $4 per edge. Hidden unless the Pipes lens or a pipe tool is out.
sprinkler: ${name}. ${w}×${h} plots. ${rate} L/s.
well:      Well. ${output} L/s. One tile.
```

Large `w×h` = 4×4.

`pipeFit(n,e,s,w)` stays in `svgs.ts`. Map ghost and placed pipes both use it.

## Lookups

watermelon: growSeconds 90, waterUsePerSec 0.023333, sale 14, seed 7

`buy-pipe` 4 · `buy-sprinkler` 15 · `buy-sprinkler-vert` 30 · `buy-sprinkler-large` 33 · `buy-well` 75 · `buy-delete` 0 · `buy-pumpjack` 40 · `pack-watermelon` 12

## E2e

New runner: Playwright. Vitest `npm test` stays. Do not screenshot-only.

| | |
|---|---|
| config | `playwright.config.ts` (repo root) |
| script | `package.json` `"e2e": "playwright test"` |
| dep | `@playwright/test` |
| specs | `e2e/irrigation.spec.ts` |
| server | `webServer.command` = `npm run dev` (Vite). `url` `http://localhost:5173`. `reuseExistingServer` when not CI. `use.baseURL` that origin. `testDir` `e2e` |

Arm with the Research button **unlock all instantly** (`World.unlockAll`).

Hooks: `data-cell-stroke`, `data-pipe` + `data-wet`, `data-pipe-ghost`, `data-sprinkler`. Existing `data-thirst`.

| test | assert |
|---|---|
| hover outline | pointer over a map cell → exactly one `[data-cell-stroke]` with `stroke-ink`. Still true with no tool and with pipe / sprinkler / delete armed. Pointer leave → none. |
| shop close exits pipe layer | `lens === 'pipes'` then close via dock **×**, HUD **Shop** toggle (shop was open), and Esc → HUD lens button is **Lens** (not **Lens · Pipes**). Placed pipes not in the SVG (`[data-pipe]` absent). Other lenses untouched by this test. |
| sprinkler place without pipes | basic sprinkler confirms on an owned vertex with no incident pipe. `[data-sprinkler]` present. Money −15. |
| pipe ghost is pipe art | `buy-pipe` armed, pointer on an owned edge → `[data-pipe-ghost]` is `pipeFit` vertex html (junction piece + rot). Not a lone `<line>` EdgeStroke. |
| dry pipes have no water fill | pipe with `system(e).C === 0` → `[data-pipe][data-wet="0"]` has no `#3d7ea6`. |
| connected sprinkler waters | pipe path from starter, sprinkler on that component, growing plant in AoE. After time that thirst would fall below `HEALTH` if `R===0`, the cell is still growing and thirst ≥ `HEALTH` (`[data-thirst]` absent). |

Forbidden still: fertilizer, deleting buildings, pipe as inventory item, per-edge flow/pressure/capacity, storing unused water, changing starter/pumpjack output/footprint, comments in source.
