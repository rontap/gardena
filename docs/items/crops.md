# Crops

`AnnualId`: carrot potato wheat tomato raspberry grape vanilla chilli sugar-cane grass. `TreeId`: apple apricot olive cherry. Table `CROPS` — [[mechanics/plants]]. No `CROPS.grass` row. Tree intervals `TREES` — [[architecture/tree]]. Variety tables `VARIETY` `VARIETIES` — `defs/varieties.ts`. Infusion — [[mechanics/infusion]].

Olive is `TreeId`. Not an annual. Not a seed pack.

`'base'` is legal on every `CropId`. Carrot, vanilla, sugar-cane, chilli, grass list `['base']` only. A crop carries at most one `variant` and at most one `heirloom` — the display name is `{crop} ({variety})`, `names_variety_pair`. Grass display is Grass seeds.

| crop | varieties |
|---|---|
| carrot | `'base'` |
| potato | `'base'` `bintje` |
| wheat | `'base'` `red-fife` |
| tomato | `'base'` `green-zebra` `san-marzano` |
| raspberry | `'base'` `black-raspberry` |
| grape | `'base'` `concord` `keknyelu` |
| vanilla | `'base'` |
| chilli | `'base'` |
| sugar-cane | `'base'` |
| grass | `'base'` |
| apple | `'base'` `kingston-black` `pink-lady` |
| apricot | `'base'` `blenheim` `klosterneuburger` |
| olive | `'base'` `arbequina` |
| cherry | `'base'` `bing` |

`PACK_N` packs: `pack-carrot` `pack-potato` `pack-wheat` `pack-tomato` `pack-grape` `pack-raspberry` `pack-sugar-cane` `pack-chilli`. `pack-grass` is `GRASS_PACK`, `'base'` quality 0, `{ kind: 'seeds'; crop: 'grass' }`. Prices `SKUS`. Bought packs are `'base'` at quality 0. Tomato grape via plants research: `pack-tomato` / `pack-grape` show `start`, buy after that row. Packs are not free on day 1. Raspberry after grape. Sugar cane after `unlock-fermentation`. `pack-chilli` show and buy `unlock-infusion`, `PACK_N` at 10. `pack-grass` show `start`, buy `unlock-landscaping`. Vanilla and trees have no pack — contract prizes only, `'base'` quality 0, [[mechanics/contracts]]. No `pack-olive`. No `pack-vanilla`. No `unlock-chilli`. No `pack-watermelon`.

Sugar cane harvests as fruit. Mill 5 cane → 2 L sugar — [[mechanics/machines]]. Vanilla mill: `MILL_VANILLA_IN` 1 fruit → `{ kind: 'vanilla-extract' }` count `MILL_VANILLA_OUT` 4, not stall extract. Chilli mill: `MILL_CHILLI_IN` 3 fruit → `{ kind: 'flakes' }` count `MILL_CHILLI_OUT` 2, not stall. Oil, jam, cask, spirit carry required `infused` — [[mechanics/infusion]]. `jam-tomato` display **Ketchup** for every tomato variety but `san-marzano`, which is Passata. Ketchup takes `KETCHUP_SUGAR`, twice a jam; Passata takes none — [[mechanics/machines]]. There is no plain tomato jam. Named jars: [[mechanics/machines]]. Apple is barrel cider, not jam. Grape jam stays.

`pack-grass` is a silo crop like chilli, `'base'` only. `AnnualId` += `'grass'`. Sold at the Seed silo after `unlock-landscaping`, same path as `pack-chilli`, not on Build — [[ui/store]] [[mechanics/inventory]] `inventory.grass-silo`. Item `{ kind: 'seeds'; crop: 'grass'; variety: 'base'; quality: 0; count }`. Sow is turf, not a `Plant` — [[mechanics/plants]] `plants.grass`. No `{ kind: 'grass-seeds' }`.

Neighbour-need: `keknyelu` `pink-lady` `bing` — [[mechanics/plants]] `variety.neighbour`.

Names and descriptions: [[agents/game-text-writer]].
