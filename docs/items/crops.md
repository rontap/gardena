# Crops

`AnnualId`: carrot potato wheat tomato raspberry grape vanilla sugar-cane. `TreeId`: apple apricot olive cherry. Table `CROPS` — [[mechanics/plants]]. Tree intervals `TREES` — [[architecture/tree]]. Variety tables `VARIETY` `VARIETIES` — `defs/varieties.ts`.

Olive is `TreeId`. Not an annual. Not a seed pack.

`'base'` is legal on every `CropId`. Carrot, vanilla, sugar-cane list `['base']` only. A crop carries at most one `variant` and at most one `heirloom` — the display name is `{crop} ({variety})`, `names_variety_pair`.

| crop | varieties |
|---|---|
| carrot | `'base'` |
| potato | `'base'` `bintje` |
| wheat | `'base'` `red-fife` |
| tomato | `'base'` `green-zebra` `san-marzano` |
| raspberry | `'base'` `black-raspberry` |
| grape | `'base'` `concord` `keknyelu` |
| vanilla | `'base'` |
| sugar-cane | `'base'` |
| apple | `'base'` `kingston-black` `pink-lady` |
| apricot | `'base'` `blenheim` `klosterneuburger` |
| olive | `'base'` `arbequina` |
| cherry | `'base'` `bing` |

Packs of 5: `pack-carrot` `pack-potato` `pack-wheat` `pack-tomato` `pack-grape` `pack-raspberry` `pack-sugar-cane`. Prices `SKUS`. Shop packs are `'base'` at quality 0. Tomato grape via plants research: `pack-tomato` / `pack-grape` show `start`, buy after that row. Packs are not free on day 1. Raspberry after grape. Sugar cane after `unlock-fermentation`. Vanilla and trees have no pack — contract prizes only, `'base'` quality 0, [[mechanics/contracts]]. No `pack-olive`. No `pack-vanilla`. No `pack-watermelon`.

Sugar cane harvests as fruit. Mill 5 cane → 2 L sugar — [[mechanics/machines]]. Vanilla mill: `MILL_VANILLA_IN` fruit → `{ kind: 'extract' }` count `MILL_VANILLA_OUT`, same stall good as grass mill. `jam-tomato` display **Ketchup** for every tomato variety but `san-marzano`, which is Passata. Ketchup takes `KETCHUP_SUGAR`, twice a jam; Passata takes none — [[mechanics/machines]]. There is no plain tomato jam. Named jars: [[mechanics/machines]]. Apple is barrel cider, not jam. Grape jam stays.

`pack-grass` is not a crop. It is `{ kind: 'grass-seeds'; count }`, no crop id and no variety — [[mechanics/plants]].

Neighbour-need: `keknyelu` `pink-lady` `bing` — [[mechanics/plants]] `variety.neighbour`.

Names and descriptions: [[agents/game-text-writer]].
