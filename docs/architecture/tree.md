# Tree

1×2 `Tree` on `Cell`. Same instance in both cells. Not a `Plant`. Not a plot. [[architecture/world]] [[architecture/modules]]

## Ids

```
TreeId = 'apple' | 'apricot' | 'lemon' | 'cherry'
```

`CropId = AnnualId | TreeId` — [[architecture/world]].

Illegal: `Tree.species` not `TreeId`. Illegal: `Plant` with `TreeId`. Illegal: `Tree` with `AnnualId`. Illegal: `seeds.crop` not `AnnualId`.

## Yield

```
TreeYield =
  | { kind: 'pending' }
  | { kind: 'on'; daysLeft: 1 | 2 }
  | { kind: 'off'; chance: number }
```

## Class

```
class Tree {
  kind: 'tree'
  species: TreeId
  base: RectBase
  juvenile: number
  fruit: number
  yield: TreeYield
}
```

`base` always 1×2. `juvenile` 0..1, then stays 1. `fruit` 0..1 toward next drop, only while mature and not pending.

Owner: `sim/building.ts`. Cell only — no `World.trees`. `World.tickTree` in `sim/world.ts` pings `'field'` only on visual stage change. Juvenile increment does not ping. [[mechanics/trees]]

## Defs

`defs/trees.ts` owns `TREE_YIELD_DAYS`, `TREE_YIELD_MUL`, `TREE_OFF_MUL`, and `TREES[TreeId] = { juvenileSeconds, fruitSeconds }`.

`CROPS` still owns sale / rot / desc / class / seed / tols / `waterUsePerSec` for every `CropId`. Trees: `waterUsePerSec = 0`.

## Item

```
{ kind: 'sapling'; tree: TreeId }
```

Illegal: `{ kind: 'apple-tree' }` `{ kind: 'shrub' }` `{ kind: 'berry' }`. Delete `Shrub`.

Plant sapling uses existing `Intent` `{ act: 'plant'; at: Coord }`.
