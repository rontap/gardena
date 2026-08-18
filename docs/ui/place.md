# Place

Current law. Mechanics [[mechanics/beta-4]]. Types [[architecture/beta-4]]. Chrome [[ui/beta-4]].

`World.place`: `{ kind: 'none' } | { kind: 'sku'; id: SkuId }`.

Placeable: `buy-shovel` `buy-better-shovel` `buy-pickaxe` `buy-better-pickaxe` `buy-bucket` `buy-bucket-large` `buy-box` `buy-box-large` `buy-pumpjack` `buy-chest` `buy-grinder`. Packs never arm.

Pay on confirm only. Esc / shop × / HUD shop toggle / right-click → `cancelPlace`, no charge. Map pan/zoom stay live. While armed, `readPrompt` is place or blocked only.

## Pointer

| pointer | when `place.kind === 'sku'` | ui |
|---|---|---|
| move | anywhere | ghost follows pointer. `pointer-events-none` |
| hover valid, can pay | `prompt.kind === 'place'` | tile `stroke-ink`. Pumpjack: both cells. Map `cursor-pointer` |
| hover else | blocked or off-map | `stroke-roof` if a cell. Map `cursor-crosshair` |
| left valid, can pay | `confirmPlace` | ghost off |
| left blocked | no-op | look already has the string |
| right / Esc / shop close | `cancelPlace` | ghost off |

Item SKUs: 64px item ghost + **Place {skuLabel}** under the pointer. Drop on the Plot.

`buy-pumpjack`: 2-tile ghost (well + trough, 48×24). Confirm replaces two cells with a Pump. No drop.

`buy-chest` `buy-grinder`: 1-tile 64px ghost + **Place Chest** / **Place Seed grinder**. Confirm replaces one Plot. No drop.

Armed shop row (`place.id === id`): `bg-dirt-dark`. Label `skuLabel` + ` $` + price.

Look: `lookText`. If armed and `hover` unset → `Place {skuLabel}`, not **—**.

## Copy

`placeLabel` = `skuLabel`.

| when | text |
|---|---|
| place / pulse item SKU | **Place {skuLabel}** |
| place / pulse `buy-pumpjack` | **Place Pumpjack** |
| blocked | **Cannot place here** |
| blocked, `money < price` | **Cannot afford** |
