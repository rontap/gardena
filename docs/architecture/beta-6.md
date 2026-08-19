# Beta-6 architecture

Supersedes [[architecture/beta-5]] where this file names a replacement. Beta-5 tree / pipes / pumps / catalog Face stay except below.

## Tree

```
src/game/
  defs/crops.ts        CropDef.rotSeconds freshMul lookups
  defs/research.ts     SKUS -= buy-delete; pack $; ResearchDef.blurb
  defs/catalog.ts      fruit Face rarity; skip delete
  sim/
    clock.ts           DayPhase phase() remaining days()
    ids.ts             SkuId -= buy-delete
    item.ts            fruit.unitSale fruitMoney Face
    plant.ts           freshness
    plot.ts            rotten
    world.ts           Place StayArmed armDelete rotatePlace deleteBuilding harvest merge
    prompt.ts          place.kind === 'delete'; vert facing from Place
    look.ts            place.kind === 'delete'
    (beta-5 else)
  view/map.tsx         Lens += rarity
  view/svgs.ts         stageOnly hyphen ids
  view/motion.ts       clock paint: day + phase, not remaining
  ui/frame.tsx         Dock left only; research wide
  ui/shop.tsx          left, past ribbon
  ui/research.tsx      left, wide grid
  ui/market.tsx        left, past ribbon
  ui/almanac.tsx       grow raw days()
  ui/hud.tsx           clock: day + phase, not remaining
src/App.tsx            lens view-local; docks left; status+queue bottom-right
```

Do not create `src/` from this note.

## SkuId

```
SkuId -= 'buy-delete'
```

Delete is not a SKU. Not in `SKUS`. Not an argument to `World.buy`. `skuItem` has no delete arm. Face `{ kind: 'delete' }` stays for the toolbar icon.

## Place

```
type Place =
  | { kind: 'none' }
  | { kind: 'sku'; id: Exclude<SkuId, 'buy-sprinkler-vert'> }
  | { kind: 'sku'; id: 'buy-sprinkler-vert'; facing: 'ns' | 'ew' }
  | { kind: 'delete' }
```

Illegal: `facing` on any id other than `buy-sprinkler-vert`. Illegal: `buy-delete`. Facing exists only on the vert arm. A shovel arm cannot carry facing.

```
type StayArmed =
  | 'buy-pipe'
  | 'buy-sprinkler'
  | 'buy-sprinkler-vert'
  | 'buy-sprinkler-large'
  | 'delete'
```

Stay-armed: successful confirm does **not** set `none`. `place.kind === 'delete'` stays armed. Packs never arm. `buy-well` `buy-pumpjack` and other cell/item SKUs disarm as now.

Vert facing lives on `Place`, not pointer-derived.

```
World.buy(id: SkuId): …
World.armDelete(): void
World.rotatePlace(): void
World.deleteBuilding(at: Coord): void
World.deletePipe(e: Edge): void
World.deleteSprinkler(v: Vertex): void
```

`buy('buy-sprinkler-vert')` constructs `{ kind: 'sku'; id: 'buy-sprinkler-vert'; facing }`. Other `buy` ids: `{ kind: 'sku'; id }`. `buy` never arms delete.

`armDelete()` sets `{ kind: 'delete' }`.

`rotatePlace()`: no-op unless place is the vert sku; toggles `ns` ↔ `ew`.

`deletePipe` / `deleteSprinkler` require `place.kind === 'delete'`. They do not clear place.

`deleteBuilding` requires `place.kind === 'delete'`. House and starter pump are not delete targets. Does not clear place.

`placeSprinkler` for vert uses `place.facing`. Confirm still: matching SKU armed, `money ≥` price, owned vertex, no sprinkler at V, every `aoe` cell `inWorld`.

Build cluster (toolbar visible): `buy-pumpjack` `buy-well` `buy-pipe` `buy-sprinkler` `buy-sprinkler-vert` `buy-sprinkler-large` `buy-chest` `buy-grinder`, or `place.kind === 'delete'`.

Pipes visible iff `lens === 'pipes'` or `place` is `buy-pipe` / `buy-sprinkler` / `buy-sprinkler-vert` / `buy-sprinkler-large` / `buy-well` / `buy-pumpjack` or `place.kind === 'delete'`.

AoE wash iff `lens === 'pipes'` or `place` is `buy-pipe` / `buy-sprinkler` / `buy-sprinkler-vert` / `buy-sprinkler-large` or `place.kind === 'delete'`. Not well / pumpjack alone.

## Plant / Plot / Item

```
class Plant {
  freshness: number
  happiness: number
  rarity: Rarity
}
```

`freshness = 1` at the instant `growing` → `ripe`. Ticks only while ripe. Not copied onto Item.

```
Plot += { kind: 'rotten' }
```

Not a `CropId`. No `plant`. `isPlot` includes `rotten`. Dig with shovel → `{ kind: 'empty' }`.

```
type Item fruit = { kind: 'fruit'; crop: CropId; rarity: Rarity; count: number; unitSale: number }
```

```
fruitMoney(it) = it.unitSale * it.count
```

Harvest is the only writer of `unitSale`: bake `stats.sale * freshMul(freshness)` (`stats.sale` already has rarity and research saleMul). Freshness is not on Item.

Box fruit cargo carries `unitSale`. Seeds cargo does not. Discriminate so `unitSale` cannot exist on seeds.

Merge same `crop`+`rarity` (inventory, box, chest, house):

```
unitSale' = (a.unitSale * a.count + b.unitSale * b.count) / (a.count + b.count)
```

Rarity must match. Different rarities never combine.

## Lens

```
type Lens = 'off' | 'water' | 'ripe' | 'kind' | 'rarity' | 'pipes'
```

App-local. `MapView` receives it. Not on `World`. `cancelPlace` clears `place` only.

## CropDef

```
CropDef += rotSeconds: number
```

`src/game/defs/crops.ts`. `DAY_SECONDS = 240` (`src/game/sim/clock.ts`).

```
freshMul(f) = f >= 0.8 ? 1 : f / 0.8
```

While `kind === 'ripe'`: `freshness -= dt / rotSeconds`. `freshness <= 0` → `{ kind: 'rotten' }`. Then sprinkler liters as [[architecture/beta-5]].

## Face / catalog

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

Face delete stays (toolbar icon). Catalog still skips delete.

Fruit icon Face is the fruit Item: `rarity` so view can pick fruit group + quality pip.

## Lookups

| crop | growSeconds | waterUsePerSec | sale | seed | rotSeconds | pack $ |
|---|---|---|---|---|---|---|
| carrot | 103.5 | 0.004889 | 4 | 1 | 480 | 3 |
| potato | 184 | 0.00375 | 8 | 2 | 480 | 6 |
| wheat | 276 | 0.003333 | 14 | 2 | 480 | 10 |
| tomato | 345 | 0.003111 | 18 | 3 | 300 | 15 |
| watermelon | 345 | 0.013333 | 19 | 4 | 360 | 18 |
| raspberry | 414 | 0.003333 | 24 | 4 | 158.4 | 22 |

raspberry `rotSeconds` = `0.66 * 240` = 158.4.

Pack $ is `SKUS['pack-*'].price`. Other SKU prices stay. No `buy-delete` row.

## Clock phase

Derived. Not stored. `src/game/sim/clock.ts`.

```
type DayPhase = 'sunrise' | 'day' | 'sunset' | 'twilight'

Clock.phase(): DayPhase
  p = t / DAY_SECONDS
  p < 0.25 → sunrise
  p < 0.65 → day      // 0.25+0.40
  p < 0.90 → sunset   // +0.25
  else twilight       // last 0.10
```

Night is the recap seam, not a phase. Illegal: `'night'` on `DayPhase`. Illegal: a `phase` field on `Clock`.

`remaining` stays for tests. HUD does not show seconds. HUD clock and `paintMotion` clock line: `day` + `phase()`. Not `remaining`.

## ResearchDef

`src/game/defs/research.ts`.

```
ResearchDef += blurb: string
```

Required. Templates only, from `effect`. No lore.

| effect | blurb vars |
|---|---|
| unlock-sku | sku |
| sale-mul | crop, saleMul |
| expand | — |

`RESEARCH` rows set `blurb` at the def. UI reads `.blurb`. No item literals in the React file.

## Almanac days

```
days(seconds) = seconds / DAY_SECONDS
```

`src/game/sim/clock.ts`. Grow time raw is `days(growSeconds)`, not seconds. Storage stays `growSeconds`. Drink raw stays `L/day`. Meter still ranks on stored `growSeconds`.

## Crop stage select

`src/game/view/svgs.ts` `stageOnly(raw, stage)`.

Must hide every `<g id>` whose id ≠ stage, including hyphen ids (`ripe-rare`, `ripe-heirloom`). `\w+` is illegal here.

## Docks

`src/game/ui/frame.tsx` `Dock`. Shop, research, market: **left**, offset past the HUD left ribbon (Shop / Research / Market / build trio). Not the right. `side: 'right'` dies.

Research dock is wide (grid). Shop and market are not.

Status + queue: bottom-right. Same stack (Queue then Status). Left stack dies. `src/App.tsx`.

## Invariants (do not runtime-check)

- `buy-delete` is not a `SkuId`
- `Place.facing` exists only on `buy-sprinkler-vert`
- `Lens` is not on `World`
- `freshness` is not on `Item`
- `rotten` has no `Plant`
- `unitSale` is set at harvest only
- rarity does not mix across stacks
- house and starter pump are not delete targets
- `DayPhase` is not stored
- night is not a `DayPhase`
- HUD clock does not read `remaining`
- `ResearchDef.blurb` is from `effect`, not lore
- `stageOnly` hides hyphenated `<g id>`
- shop / research / market docks are not on the right
- status + queue are not on the left
