# Crops

`AnnualId`: carrot potato wheat tomato raspberry watermelon olive grape vanilla sugar-cane. `TreeId`: apple apricot lemon cherry. Table `CROPS` — [[mechanics/plants]]. Tree intervals `TREES` — [[architecture/tree]].

Packs of 5: `pack-carrot` `pack-potato` `pack-wheat` `pack-tomato` `pack-raspberry` `pack-watermelon` `pack-olive` `pack-grape` `pack-vanilla` `pack-sugar-cane`. Prices `SKUS`. Tomato watermelon grape via plants research. Olive after tomato. Raspberry after grape. Vanilla pack after raspberry, buy `vanilla-tending`. Sugar cane after `unlock-fermentation`. Trees have no pack.

Sugar cane harvests as fruit. Mill 5 cane → 2 L sugar — [[mechanics/machines]]. `jam-tomato` display **Ketchup**.

`pack-grass` is not a crop. It is `{ kind: 'grass-seeds'; count }`, no crop id and no rarity — [[mechanics/plants]].
