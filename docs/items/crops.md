# Crops

`AnnualId`: carrot potato wheat tomato raspberry grape vanilla sugar-cane. `TreeId`: apple apricot olive cherry. Table `CROPS` — [[mechanics/plants]]. Tree intervals `TREES` — [[architecture/tree]].

Olive is `TreeId`. Not an annual. Not a seed pack.

Packs of 5: `pack-carrot` `pack-potato` `pack-wheat` `pack-tomato` `pack-grape` `pack-raspberry` `pack-sugar-cane`. Prices `SKUS`. Tomato grape via plants research: `pack-tomato` / `pack-grape` show `start`, buy after that row. Packs are not free on day 1. Raspberry after grape. Sugar cane after `unlock-fermentation`. Vanilla and trees have no pack — contract prizes only, [[mechanics/contracts]]. No `pack-olive`. No `pack-vanilla`. No `pack-watermelon`.

Sugar cane harvests as fruit. Mill 5 cane → 2 L sugar — [[mechanics/machines]]. Vanilla mill: `MILL_VANILLA_IN` fruit → `{ kind: 'extract' }` count `MILL_VANILLA_OUT`, same stall good as grass mill. `jam-tomato` display **Ketchup**. Apple is barrel cider, not jam. Grape jam stays.

`pack-grass` is not a crop. It is `{ kind: 'grass-seeds'; count }`, no crop id and no rarity — [[mechanics/plants]].
