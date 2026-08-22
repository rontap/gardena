# Beta-1 architecture

**Historical.** Current law: [[architecture/beta-2]].

Defs + one runtime class per kind + a modifier stack. Rarity is data. `extends` only for SVG view.

One hand. No hotbar. Drops on plots. House has a 16-slot inventory.

Sim does not import React. `World` is the store. View ticks it. View may not remount the tile field on hover.

## Tree

```
src/
  App.tsx
  main.tsx
  index.css
  game/
    defs/crops.ts items.ts research.ts rarity.ts
    sim/
      world.ts
      clock.ts
      plant.ts
      plot.ts
      building.ts
      modifiers.ts
      actor.ts
      item.ts
      drop.ts
      prompt.ts
    view/map.tsx camera.ts
    ui/hud.tsx held.tsx shop.tsx research.tsx market.tsx inventory.tsx recap.tsx
  assets/
```

`inspect.tsx` is gone.

## Grid

Unchanged: 32×48. `grid[row][col]`. `Cell = Plot | Building`.

```
type Coord = { col: number; row: number }
type RectBase = { shape: 'rect'; col: number; row: number; w: number; h: number }
type CircleBase = { shape: 'circle'; cx: number; cy: number; r: number }
type Base = RectBase | CircleBase

type Plot =
  | { kind: 'untilled' }
  | { kind: 'empty' }
  | { kind: 'growing'; plant: Plant }
  | { kind: 'ripe'; plant: Plant }
  | { kind: 'dead'; plant: Plant }

class House { readonly kind = 'house'; base: RectBase; door: Coord }
class Pump { readonly kind = 'pump'; base: CircleBase; outputLitersPerSec: number }
type Building = House | Pump
type Cell = Plot | Building
```

`occupiedCells(base)` unchanged. House `{ col:14, row:0, w:4, h:3 }`. Pump `{ cx:18.5, cy:1.5, r:0.5 }`. Door `{ col:15, row:3 }` is a Plot.

Pumpjack: mutate `outputLitersPerSec` `2 → 5`. No second building. Not an `Item`.

## Items

```
type Stack = { crop: CropId; rarity: Rarity; count: number }

type Item =
  | { kind: 'shovel'; id: 'shovel' | 'better-shovel'; usesLeft: number; workSeconds: number }
  | { kind: 'container'; id: 'bucket' | 'large-bucket' | 'can' | 'large-can'; liters: number; capacityLiters: number }
  | { kind: 'box'; cap: 5 | 15; cargo: { kind: 'empty' } | { kind: 'stack'; goods: 'fruit' | 'seeds'; stack: Stack } }
  | { kind: 'seeds'; crop: CropId; rarity: Rarity; count: number }
  | { kind: 'fruit'; crop: CropId; rarity: Rarity; count: number }

type Hand = { kind: 'empty' } | { kind: 'hold'; item: Item }
type Slot = { kind: 'empty' } | { kind: 'hold'; item: Item }
```

`fruit.count` on the hand is `1`. Box is the only bag (cap 5 | 15). Inventory seed `count` has no extra cap.

`World.inventory: Slot[]` length exactly `16`.

Click slot `i` ↔ swap with hand.

## Drops

`World.drops: { at: Coord; item: Item }[]`. Plot cells only. Top = last.

Left-click hit-tests drops on that cell first, then the cell act.

Pickup unchanged: empty hand takes top; box merge if it can; else swap.

Right-click: if pointer is on a Plot and hand is hold, the hand item becomes a drop on that cell now. No walk. Building / off-map: ignore.

## Place

```
type Place = { kind: 'none' } | { kind: 'sku'; id: SkuId }
```

`World.place`.

Seeds SKUs never enter place. Tool / container / box SKUs do. Pumpjack does not.

Pay on successful place only. Cancel (Esc / close shop / right-click) clears `place`, no money change.

## Shop destinations

| SKU | destination |
|---|---|
| `pack-*` | inventory: merge same crop+rarity seeds, else first empty slot. No empty and no merge → buy refused |
| `buy-shovel` `buy-better-shovel` `buy-bucket-large` `buy-can` `buy-can-large` `buy-box` `buy-box-large` | `place = { kind:'sku', id }`. Left-click Plot: if money ≥ price, deduct, push drop on that cell, `place = none` |
| `buy-pumpjack` | mutate pump, deduct |

Buy never plants. Buy never auto-holds.

## Inventory start

Hand: shovel 100 / 1.0s.  
Inventory slot 0: carrot seeds ×5. Other slots empty.  
Door drop: bucket 2 L full only.  
Actor `{ x:15.5, y:3.5 }`. Money `$10`.

## Actor / queue

Speed `6` tiles/s. Straight line to cell center. No collision. Arrived iff position ∈ `[col, col+1) × [row, row+1)`.

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
```

Click appends (cap 8) only when `prompt` yields an intent. Failed acts do not queue.

`walk` is walk-only. Sell still walks to door, then sells. Fill walks to pump.

Queue UI reads `World.queue` in order. Head is current.

```
type TaskName = 'Move here' | 'Dig' | 'Plant' | 'Water' | 'Harvest' | 'Fill' | 'Sell' | 'Pick up'

World.taskName(i: Intent): TaskName
World.taskProgress(): number
```

`taskName`: walk → Move here; shovel → Dig; plant → Plant; water → Water; harvest → Harvest; fill → Fill; sell → Sell; pickup → Pick up.

`taskProgress` is `0..1` for `queue[0]` only:

| head | value |
|---|---|
| walking | `1 - dist(pos, destCenter) / dist(legStart, destCenter)` |
| work timer | `1 - workLeft / workTotal` |
| fill | `liters / capacityLiters` |
| sell / pickup (arrived) | `1` |

`World` stores `legStart: { x, y }` when the head starts walking, and `workTotal` when a work timer arms.

Right-click drop and place-confirm are not queue intents.

House left-click is not an intent. It opens inventory UI.

## Prompt

`World.prompt(at: Coord): Prompt`. Total. UI renders `text`. Does not invent strings.

```
type Prompt =
  | { kind: 'intent'; text: string; intent: Intent }
  | { kind: 'inventory'; text: 'Inventory' }
  | { kind: 'place'; text: string }
  | { kind: 'blocked'; text: string }
```

Locked texts: [[mechanics/beta-1]].

## Day counters / recap

```
type DayTally = { died: number; harvests: number; research: ResearchId[] }

type Recap = {
  day: number
  money: number
  died: number
  harvests: number
  research: ResearchId[]
}

type Seam = { kind: 'play' } | { kind: 'recap'; recap: Recap }
```

`World.tally` resets when a day starts. Increment `died` on growing→dead. Increment `harvests` on harvest. Push research id when a job completes.

On clock seam: no plant/job/work tick. `seam = { kind:'recap', recap }` from the ended day's tally + money + that day number. Then tally resets and `day` is already N+1 on the clock. UI dismisses recap, then shows `Day N` banner.

## Market

Not a World field. UI reads `World.saleOffer()`:

```
type SaleOffer =
  | { kind: 'ok'; money: number; label: string }
  | { kind: 'blocked'; text: string }
```

Confirm enqueues `{ act: 'sell' }`. Same `doSell` as before.

## Pulse

```
type Pulse = { text: string; at: Coord }
```

`World.pulse` is the last finished act (shovel / plant / water / harvest / fill / sell / pickup / place). View shows it. One slot, overwritten.

## Hover / tick

Hover is view-local. Not World state. Not a reason to rebuild the 32×48 field.

`World.tick` may notify subscribers. The tile field must stay cheap: untilled grass is a tiled ground, not 1536 hover-reactive nodes.

## Lookups

`CROPS[id]`, `CONTAINERS[id]`, `RESEARCH[id]`, `SKUS[id]` are total maps.

`apply(def, rarity, modifiers)` is pure.

Plant start thirst, waterUse, health-bar threshold: [[mechanics/beta-1]].

Chrome: [[ui/beta-1]]. Art: [[art/beta-1]].
