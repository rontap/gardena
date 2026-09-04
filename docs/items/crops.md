# Crops

`AnnualId`: carrot potato wheat tomato raspberry grape vanilla sugar-cane. `TreeId`: apple apricot olive cherry. Table `CROPS` — [[mechanics/plants]]. Tree intervals `TREES` — [[architecture/tree]]. Variety tables `VARIETY` `VARIETIES` — `defs/varieties.ts`.

Olive is `TreeId`. Not an annual. Not a seed pack.

`'base'` is legal on every `CropId`. Carrot, vanilla, sugar-cane list `['base']` only.

| crop | varieties |
|---|---|
| carrot | `'base'` |
| potato | `'base'` `bintje` `russian-banana` |
| wheat | `'base'` `sonora` `red-fife` |
| tomato | `'base'` `green-zebra` `san-marzano` |
| raspberry | `'base'` `black-raspberry` |
| grape | `'base'` `concord` `thompson` `keknyelu` |
| vanilla | `'base'` |
| sugar-cane | `'base'` |
| apple | `'base'` `kingston-black` `pink-lady` |
| apricot | `'base'` `moorpark` `klosterneuburger` `blenheim` |
| olive | `'base'` `kalamata` `arbequina` |
| cherry | `'base'` `montmorency` `bing` |

Packs of 5: `pack-carrot` `pack-potato` `pack-wheat` `pack-tomato` `pack-grape` `pack-raspberry` `pack-sugar-cane`. Prices `SKUS`. Shop packs are `'base'` at quality 0. Tomato grape via plants research: `pack-tomato` / `pack-grape` show `start`, buy after that row. Packs are not free on day 1. Raspberry after grape. Sugar cane after `unlock-fermentation`. Vanilla and trees have no pack — contract prizes only, `'base'` quality 0, [[mechanics/contracts]]. No `pack-olive`. No `pack-vanilla`. No `pack-watermelon`.

Sugar cane harvests as fruit. Mill 5 cane → 2 L sugar — [[mechanics/machines]]. Vanilla mill: `MILL_VANILLA_IN` fruit → `{ kind: 'extract' }` count `MILL_VANILLA_OUT`, same stall good as grass mill. `jam-tomato` display **Ketchup** when variety is `'base'`. Named jars: [[mechanics/machines]]. Apple is barrel cider, not jam. Grape jam stays.

`pack-grass` is not a crop. It is `{ kind: 'grass-seeds'; count }`, no crop id and no variety — [[mechanics/plants]].

Neighbour-need: `keknyelu` `pink-lady` `bing` — [[mechanics/plants]] `variety.neighbour`.

Names and descriptions: [[agents/game-text-writer]].
