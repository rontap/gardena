# Tree

1×2 `Tree` on `Cell`. Same instance in both cells. Trees stay untilled. Not a `Plant`. Not a plot. [[architecture/world]] [[architecture/modules]] [[mechanics/trees]]

Ids: `sim/ids.ts`. `TreeId` = apple | apricot | olive | cherry. `CropId = AnnualId | TreeId`. Olive is `TreeId`. Not an annual. Not a seed pack.

| field | law |
|---|---|
| `species` | required `TreeId` |
| `base` | 1×2 origin |
| `juvenile` | 0..1 |
| `fruit` | 0..1 |
| `yield` | `TreeYield` |
| `tended` | required boolean, starts `false` |
| `trunk` | required boolean, starts `false` |
| `variety` | required `VarietyId` |
| `happiness` | required `[0,1]`, starts `TREE_HAPPY_START` |
| `soil` | required `Soil`, one instance both cells |

Illegal: `Tree.species` not `TreeId`. Illegal: `Plant` with `TreeId`. Illegal: `Tree` with `AnnualId`. Illegal: `seeds.crop` not `AnnualId`. Illegal: `{ kind: 'apple-tree' }` `{ kind: 'shrub' }` `{ kind: 'berry' }`. Illegal: olive pack. Illegal: optional `Tree.variety`. Illegal: optional `Tree.tended`. Illegal: optional `Tree.trunk`. Illegal: optional `happiness`. Illegal: optional `soil`. Illegal: `Tree.quality`. Fruit Quality stays 0.

`better-apple` `better-apricot` `better-olive` `better-cherry` are player skills — [[architecture/family]].

## Yield

```
TreeYield =
  | { kind: 'pending' }
  | { kind: 'on'; daysLeft: 1 | 2 }
  | { kind: 'off'; chance: number }

TreeStage = 'trunk' | 'grow' | 'unripe' | 'ripe'
```

`base` always 1×2. `juvenile` 0..1. From seed: once, then stays 1. After chop: two grows (`trunk` then `grow`). `fruit` 0..1 toward next drop, only while mature and not pending. `tended` `trunk` `variety` `happiness` `soil` required as the field table. No `Tree.quality` — fruit quality is 0.

Stage: `trunk === true` → `trunk`; else `juvenile < 1` → `grow`; else `yield.kind === 'on' || fruit >= 1` → `ripe`; else `unripe`.

Chop: [[mechanics/trees]] `trees.chop` `trees.trunk` `graft.axe`.

Owner: `sim/building.ts`. Cell only — no `World.trees`. `World.tickTree` in `sim/world.ts` drinks, starves, ages Happiness first, then juvenile / pending / fruit. Pings `'field'` only on visual stage change. Juvenile increment does not ping. Drink, starve, Happiness do not ping. Trunk→grow and grow→mature ping.

`mp` digest includes tree Happiness and soil at the origin.

Tend: [[mechanics/trees]] `trees.tend`. Play witness `Tree.tended` — [[architecture/ai-gameplay-api]].

Neighbour: [[mechanics/plants]] `variety.neighbour`.

## Defs

`defs/trees.ts` owns `TREE_YIELD_DAYS`, `TREE_HAPPY_*`, and `TREES[TreeId] = { juvenileSeconds, fruitSeconds }`. Capacities: [[mechanics/soil]] `soil.tree`. Income `$/min` derived, not a field. No tree shop pack.

`CROPS` still owns sale / rot / desc / class / seed / tols / `waterUsePerSec` and the Fertilizer litre draw for every `CropId`. Numbers: [[mechanics/trees]]. Variety tables: `defs/varieties.ts`.

## Item

`{ kind: 'tree-seed'; tree: TreeId; variety: VarietyId; quality: number }`. Quality 0. Plant uses existing `Intent` `{ act: 'plant'; at: Coord }`. `at` is the **foot**: `base` is `{ col: at.col, row: at.row - 1 }`. New tree takes `variety` from the seed, `happiness` `TREE_HAPPY_START`, required `soil` — [[mechanics/trees]].

`{ kind: 'graft'; crop: CropId; variety: VarietyId; quality: number; count: number }`. Attach, never plant — [[mechanics/plants]] `graft.attach`.
