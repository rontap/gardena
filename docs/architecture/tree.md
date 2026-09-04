# Tree

1×2 `Tree` on `Cell`. Same instance in both cells. Not a `Plant`. Not a plot. [[architecture/world]] [[architecture/modules]] [[mechanics/trees]]

Ids: `sim/ids.ts`. `TreeId` = apple | apricot | olive | cherry. `CropId = AnnualId | TreeId`. Olive is `TreeId`. Not an annual. Not a seed pack.

Illegal: `Tree.species` not `TreeId`. Illegal: `Plant` with `TreeId`. Illegal: `Tree` with `AnnualId`. Illegal: `seeds.crop` not `AnnualId`. Illegal: `{ kind: 'apple-tree' }` `{ kind: 'shrub' }` `{ kind: 'berry' }`. Illegal: olive pack. Illegal: optional `Tree.variety`.

`better-apple` `better-apricot` `better-olive` `better-cherry` are player skills — [[architecture/family]].

## Yield

```
TreeYield =
  | { kind: 'pending' }
  | { kind: 'on'; daysLeft: 1 | 2 }
  | { kind: 'off'; chance: number }

TreeStage = 'trunk' | 'grow' | 'unripe' | 'ripe'
```

`base` always 1×2. `juvenile` 0..1. From seed: once, then stays 1. After chop: two grows (`trunk` then `grow`). `fruit` 0..1 toward next drop, only while mature and not pending. `tended: boolean` required, starts `false`. `trunk: boolean` required, starts `false`. `variety: VarietyId` required. Illegal: optional `tended`. Illegal: optional `trunk`. Illegal: optional `variety`. No `Tree.quality` — fruit quality is 0.

Stage: `trunk === true` → `trunk`; else `juvenile < 1` → `grow`; else `yield.kind === 'on' || fruit >= 1` → `ripe`; else `unripe`.

Chop: [[mechanics/trees]] `trees.chop` `trees.trunk` `graft.axe`.

Owner: `sim/building.ts`. Cell only — no `World.trees`. `World.tickTree` in `sim/world.ts` pings `'field'` only on visual stage change. Juvenile increment does not ping. Trunk→grow and grow→mature ping.

Tend: [[mechanics/trees]] `trees.tend`. Play witness `Tree.tended` — [[architecture/ai-gameplay-api]].

Neighbour: [[mechanics/plants]] `variety.neighbour`.

## Defs

`defs/trees.ts` owns `TREE_YIELD_DAYS`, `TREE_YIELD_MUL`, `TREE_OFF_MUL`, and `TREES[TreeId] = { juvenileSeconds, fruitSeconds }`. Income `$/min` derived, not a field. No tree shop pack.

`CROPS` still owns sale / rot / desc / class / seed / tols / `waterUsePerSec` for every `CropId`. Trees: `waterUsePerSec = 0`. Numbers: [[mechanics/trees]]. Variety tables: `defs/varieties.ts`.

## Item

`{ kind: 'tree-seed'; tree: TreeId; variety: VarietyId; quality: number }`. Quality 0. Plant uses existing `Intent` `{ act: 'plant'; at: Coord }`. `at` is the **foot**: `base` is `{ col: at.col, row: at.row - 1 }`. New tree takes `variety` from the seed.

`{ kind: 'graft'; crop: CropId; variety: VarietyId; quality: number; count: number }`. Attach, never plant — [[mechanics/plants]] `graft.attach`.
