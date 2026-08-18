# Beta-3 architecture

Supersedes [[architecture/beta-2]] where this file names a replacement. Rules: [[mechanics/beta-3]]. Chrome: [[ui/beta-3]]. Place: [[ui/place]]. Art: [[art/beta-3]].

## Tree

```
src/game/
  defs/crops.ts items.ts research.ts rarity.ts
  sim/
    world.ts clock.ts plant.ts plot.ts building.ts
    modifiers.ts actor.ts item.ts drop.ts prompt.ts look.ts
    rng.ts gen.ts
  view/map.tsx camera.ts svgs.ts motion.ts
  ui/  (same files as Beta-2)
```

`COLS` / `ROWS` as world size are gone.

## Chunks / coords

```
type ChunkId = { cx: number; cy: number }

CHUNK = 32

chunkOf(at) = { cx: Math.floor(at.col / 32), cy: Math.floor(at.row / 32) }

chunkRect(id) = {
  col0: id.cx * 32, row0: id.cy * 32,
  col1: id.cx * 32 + 32, row1: id.cy * 32 + 32
}

local(at) = {
  col: ((at.col % 32) + 32) % 32,
  row: ((at.row % 32) + 32) % 32
}
```

`World.owned: ChunkId[]`. Starter `[{ cx:0, cy:0 }]`.

`inWorld(at)` iff some owned chunk contains `at`.

Storage: `Map<string, Cell[][]>` key `${cx},${cy}`, each `32×32`. No dense global array.

```
World.cell(at): Cell
World.setCell(at, cell): void
```

`cell` on unowned is illegal. Callers check `inWorld`.

`occupiedCells(base)` intersects `base` with owned tiles only.

## Buildings / start

```
HOUSE_BASE = { shape:'rect', col:14, row:6, w:4, h:3 }
DOOR = { col:15, row:9 }
PUMP_BASE = { shape:'circle', cx:18.5, cy:7.5, r:0.5 }
```

```
class House { kind:'house'; base; door }
class Pump { kind:'pump'; base; outputLitersPerSec }
class Rock { kind:'rock'; base: RectBase }   // w,h in {(1,1),(2,1),(1,2)}
class Shrub { kind:'shrub'; ripe: boolean; grow: number }
```

`World.pumps: Pump[]`. Index 0 = starter, output `2`. Placed pumps append, output `5`.

`World.pump` is `pumps[0]`.

## Ground / cells

```
type Ground = 'soft' | 'hard' | 'very-hard'

type Plot =
  | { kind: 'untilled'; ground: Ground }
  | { kind: 'empty' }
  | { kind: 'infertile' }
  | { kind: 'growing'; plant: Plant }
  | { kind: 'ripe'; plant: Plant }
  | { kind: 'dead'; plant: Plant }

type Cell = Plot | House | Pump | Rock | Shrub

function isPlot(c): c is Plot
function isSolid(c): boolean   // house | pump | rock | shrub
```

## Items

```
type PickaxeId = 'pickaxe' | 'better-pickaxe'

type Item =
  | { kind: 'shovel'; id: ShovelId; usesLeft; workSeconds }
  | { kind: 'pickaxe'; id: PickaxeId; usesLeft; workSeconds }
  | { kind: 'container'; id: ContainerId; liters; capacityLiters }
  | { kind: 'box'; cap: 5 | 15; cargo:
        | { kind: 'empty' }
        | { kind: 'stack'; goods: 'fruit' | 'seeds'; stack: Stack }
        | { kind: 'berry'; rarity: Rarity; count: number } }
  | { kind: 'seeds'; crop; rarity; count }
  | { kind: 'fruit'; crop; rarity; count }
  | { kind: 'berry'; rarity; count }
  | { kind: 'shrub' }
```

Box cargo: fruit/seeds keep `stack: Stack`. Berry cargo uses `{ rarity, count }` (no crop). Discriminate on `goods`.

## Intent / recap

```
type Intent =
  | { act: 'walk'; at }
  | { act: 'shovel'; at }
  | { act: 'mine'; at }
  | { act: 'plant'; at }
  | { act: 'water'; at }
  | { act: 'harvest'; at }
  | { act: 'fill'; at }
  | { act: 'sell' }
  | { act: 'pickup'; at }
  | { act: 'drop'; at }
  | { act: 'inventory' }

type TaskName = 'Move here' | 'Move here and dig' | 'Dig' | 'Mine' | 'Plant' | 'Water' | 'Harvest'
  | 'Fill' | 'Sell' | 'Pick up' | 'Drop' | 'Inventory'

type Recap = { day; money; died; harvests; research; tax: number }
```

`taskName(i)`: if actor not inside `dest(i)` → `Move here`. Else the act name (shovel → Dig, mine → Mine).

`dest(fill)` = `fill.at`. `dest(sell|inventory)` = door.

## World API

```
seed: number
purchases: number
owned: ChunkId[]

expandPrice(): number
tax(): number
faces(): ExpandFace[]
expand(id: ChunkId): void

unlockAll(): void
```

```
type ExpandFace = { id: ChunkId; dir: 'n' | 'e' | 's' | 'w'; at: Coord; price: number }
```

`faces()` empty unless `done.has('unlock-expand')`. One entry per unowned 4-neighbor of owned. `at` = tile just outside the owned face, midpoint of that 32-edge.

```
World.bounds(): { col0: number; row0: number; col1: number; row1: number }
World.forEachCell(fn: (at: Coord, cell: Cell) => void): void
```

`bounds` is the exclusive AABB of owned chunks. `forEachCell` visits every owned tile.

`confirmPlace`: pickaxe SKUs drop an item (like shovel). `buy-pumpjack` places a Pump (not a drop).

`skuItem('buy-pumpjack')` still `{ kind:'pumpjack' }`.

## RNG

`src/game/sim/rng.ts`

```
hash(seed, salt, ...ints): number   // unit float [0,1)
rollRarity(u: number): Rarity
```

Salts are string constants: `soil` `rock` `rock-shape` `shrub` `berry`.

`World` ctor takes no seed arg in play. Tests may assign `world.seed` then call `regen` only if you add `World.withSeed(n)` — **yes**: `new World(seed?: number)`. Omitted → random u32.

## Lookups

`PICKAXES[id] = { uses, workSeconds }`
`BERRY_SALE = 2`
`RARITY_SALE` / `RARITY_WEIGHT` in [[mechanics/beta-3]]

`RESEARCH` / `SKUS` keys: Beta-2 plus `unlock-expand` `unlock-pickaxe` `buy-pickaxe` `buy-better-pickaxe`. No `unlock-better-pickaxe`.
