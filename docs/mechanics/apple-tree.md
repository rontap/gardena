# Apple tree

Apple trees are wild, vertical 1×2 soft-ground objects. They are not planted from seeds and never consume water. The starting chunk receives one tree at the first valid vertical 1×2 soft-ground footprint after procedural terrain generation.

The tree grows from `grow = 0` to ripe over 720 seconds. On ripening, rarity is rolled with the world seed and tree origin. Harvest removes both occupied cells and yields one `fruit` item with crop `apple`, the rolled rarity, and sale value `20 × RARITY_SALE[rarity]`. Heirloom apples are named Pink Lady. The tree can be dug out with a shovel and drops an apple-tree item.
