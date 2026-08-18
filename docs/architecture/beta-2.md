# Beta-2 architecture

**Historical.** Current law: [[architecture/beta-3]].

Supersedes [[architecture/beta-1]] where this file names a replacement. Files and store shape stay Beta-1 except below.

Chrome: [[ui/beta-2]]. Place: [[ui/place]]. Art: [[art/beta-2]]. Rules: [[mechanics/beta-2]].

## Tree

```
src/
  App.tsx
  main.tsx
  index.css
  game/
    defs/crops.ts items.ts research.ts rarity.ts
    sim/
      world.ts clock.ts plant.ts plot.ts building.ts
      modifiers.ts actor.ts item.ts drop.ts prompt.ts look.ts
    view/map.tsx camera.ts svgs.ts motion.ts
    ui/
      hud.tsx status.tsx held.tsx shop.tsx research.tsx
      market.tsx inventory.tsx recap.tsx queue.tsx frame.tsx
  assets/
```

## Grid / view

World still `32×48` tiles. **1 tile = 48 CSS px** at scale 1. **1 tile = 24 SVG viewBox units**.

`TILE = 48` in the view.

## Items

```
type Item =
  | { kind: 'shovel'; id: 'shovel' | 'better-shovel'; usesLeft: number; workSeconds: number }
  | { kind: 'container'; id: 'bucket' | 'large-bucket'; liters: number; capacityLiters: number }
  | { kind: 'box'; cap: 5 | 15; cargo: { kind: 'empty' } | { kind: 'stack'; goods: 'fruit' | 'seeds'; stack: Stack } }
  | { kind: 'seeds'; crop: CropId; rarity: Rarity; count: number }
  | { kind: 'fruit'; crop: CropId; rarity: Rarity; count: number }
```

`CONTAINERS`: `bucket` 3 L, `large-bucket` 8 L.

No `can` / `large-can` in types, defs, SKUs, or research.

## Actor / queue

```
type Intent =
  | { act: 'walk'; at: Coord }
  | { act: 'shovel'; at: Coord }
  | { act: 'plant'; at: Coord }
  | { act: 'water'; at: Coord }
  | { act: 'harvest'; at: Coord }
  | { act: 'fill' }
  | { act: 'sell' }
  | { act: 'pickup'; at: Coord }
  | { act: 'drop'; at: Coord }
  | { act: 'inventory' }
```

```
type TaskName =
  | 'Move here' | 'Dig' | 'Plant' | 'Water' | 'Harvest'
  | 'Fill' | 'Sell' | 'Pick up' | 'Drop' | 'Inventory'
```

`taskName`: drop → Drop; inventory → Inventory. Others unchanged.

`taskProgress`: drop and inventory use the walk rule until arrived, then `1`, then the act.

Right-click Plot + hold + `place.kind === 'none'` → enqueue `{ act: 'drop'; at }`. Not instant.

House / inventory prompt → enqueue `{ act: 'inventory' }`. Walks to door.

```
type Cue = { kind: 'none' } | { kind: 'inventory' }
```

`World.cue`. On inventory arrive: `cue = { kind: 'inventory' }`. UI opens the inventory dialog and calls `World.ackCue()`.

Place-confirm and pumpjack buy stay instant. Not queue intents.

## Prompt

`{ kind: 'inventory' }` is gone. House yields `{ kind: 'intent'; text: 'Inventory'; intent: { act: 'inventory' } }`.

Drop: `{ kind: 'intent'; text: 'Drop'; intent: { act: 'drop'; at } }` when hand hold and the cell is a Plot.

## Inventory API

```
World.swap(i: number): void
World.sellSlot(i: number): void
World.compactInventory(): void
```

`swap` then `compactInventory`. `sellSlot`: slot must be fruit; add money; empty slot; compact; hand untouched. Non-fruit → no-op.

`compactInventory`: first-seen order; merge seeds/fruit by crop+rarity; never merge shovel / container / box; pack empties to the tail. Length stays 16.

Buy pack calls compact after insert.

## Research API

```
World.unlockAll(): void
```

Every `RESEARCH` id → `done`. `job = idle`. Money unchanged.

`startResearch` still no-op when `job.kind === 'run'`.

## Shop

`SKUS` includes locked rows. `skuOpen` is not a hide filter. View greys locked / poor rows.

`buy-shovel` price `10`. `buy-bucket-large` price `18`. No can SKUs.

Order:

`pack-carrot` `pack-potato` `pack-wheat` `pack-tomato` `pack-raspberry` `buy-shovel` `buy-better-shovel` `buy-bucket-large` `buy-box` `buy-box-large` `buy-pumpjack`

## Money / seam

Start `money = 50`. Door drop: bucket 3 L full.

On clock seam, before building `Recap`: `money += 10`. `recap.money` is that value.

## Ground variants

```
tileVariant(col, row, n) =
  ((Math.imul(col, 374761393) + Math.imul(row, 668265263)) >>> 0) % n
```

Grass: `n = 5` → `tile-grass-{0..4}`. Dirt: `n = 2` → `tile-dirt-{0|1}`.

Not `(col + row) % n`. Cheap integer hash. No noise tables.

Untilled cells paint grass. `empty` / `growing` / `ripe` / `dead` paint dirt under the crop layer.

## Tick / view

`World.tick` does **not** `ping`. Ping is discrete only (mutations already listed, plus seam, job complete, plant kind/stage change, queue head push/shift).

App `setState` only from `world.on`. Never from rAF.

rAF: `world.tick(dt)`, then paint **motion** through refs / direct SVG attributes: actor transform, clock remaining, queue `taskProgress`, research leftover, thirst bar widths. Those reads do not remount the field.

Grass is **one** module-level SVG string, one `dangerouslySetInnerHTML`, built once. Not a `COLS×ROWS` `<pattern>`. Not 1536 React children. Not rebuilt on `rev`.

`Ground` is static (no `rev`). `Marks` remounts on discrete `rev`. Hover is view-local.

App shell and map: `overflow-hidden`. Docks `absolute top-3 left-3` / `right-3`. Left stack `fixed bottom-4 left-4`.

Place ghost: 32px, free-follows the pointer. Armed shop row `bg-dirt-dark`. Hover stroke `stroke-ink` if placeable, else `stroke-roof`. `placeLabel` = `skuLabel`.

Hand/drop fruit art: `fruit-{crop}.svg`. Seeds still use crop `ripe`.

## Copy helpers

```
heldText(hand: Hand): string
lookText(world: World, at: Coord | undefined): string
skuLabel(id: SkuId): string
```

Strings: [[ui/beta-2]].

Map drop scale: `33/24` (50% above the old 22).

## Water overlay

View does not mount `overlay-water.svg`. Asset stays on disk.

## Lookups

`CONTAINERS` keys: `bucket` | `large-bucket`. `RESEARCH` keys: the ten Beta-2 rows. `SKUS` keys: the eleven listed above.
