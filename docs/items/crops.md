# Crops

`AnnualId`: carrot potato wheat tomato raspberry watermelon grape vanilla sugar-cane. `TreeId`: apple apricot olive cherry. Table `CROPS` — [[mechanics/plants]]. Tree intervals `TREES` — [[architecture/tree]].

Packs of 5: `pack-carrot` `pack-potato` `pack-wheat` `pack-tomato` `pack-raspberry` `pack-watermelon` `pack-grape` `pack-sugar-cane`. Prices `SKUS`. Tomato watermelon grape via plants research. Raspberry after grape. Sugar cane after `unlock-fermentation`. Vanilla and trees have no pack — contract prizes only, [[mechanics/contracts]].

Sugar cane harvests as fruit. Mill 5 cane → 2 L sugar — [[mechanics/machines]]. `jam-tomato` display **Ketchup**.

`pack-grass` is not a crop. It is `{ kind: 'grass-seeds'; count }`, no crop id and no rarity — [[mechanics/plants]].
