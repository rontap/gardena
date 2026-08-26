# Inventory

Hand is one item. Empty or hold.

House: 16 slots. Walk to the door, swap with hand. Auto-merge same crop+rarity seeds and fruit. Sugar merges weighted `unitSale` by liters. Weighted freshness / `unitSale` on fruit.

Chest: `CHEST_SLOTS` — preference. 1×1, `unlock-chest`. Walk up, swap any item. Dump/pull all legal until dest or cargo full. Pads + `Act.load`/`unload` — [[mechanics/vehicles]]. `out` + `SENSOR_HOLD`: full = no empty slot. Port `out` origin bottom. Guest `swapChest` / Load / Unload: not. — [[mechanics/multiplayer]] `mp.guest`.

Freezer: `FREEZER_SLOTS` — preference. 1×1, `unlock-preservatives`. Reuses chest act / `swapChest`. Slots skip `tickFreshness`. Guest may not open. Same pads / `out` / guest ban as chest. — [[mechanics/machines]] [[mechanics/sensors]]

Quad: `VEHICLE_SLOTS` — preference. Any `Item`, chest swap + compact. Freshness ticks (not freezer). `Act.swapVehicle` legal iff parked (`field` && `driver === 'none'`). Stored: no-op. Driven: no-op. Guests may swap. Hangar HUD has no 6-slot. Tractor has no 6-slot. Fuel is not an item.

Trailer cargo: `TRAILER_CAP`. Seed hopper one seeds stack. Spray hopper one fertilizer|synth|compost bag. Harvest `HARVEST_SLOTS`, mixed produce, chest merge+compact. `Act.swapTrailer` legal iff trailer attached to a tractor that is field && `driver === 'none'`. Hangar / driving / stored unattached: no-op. Seeder/sprayer refuse wrong kind. — [[mechanics/vehicles]]

## Stores

Seeds and additives do not live in the house. Each has a store building, placed at world start, 1 wide × 2 tall, not a SKU, not researchable, not deletable, no almanac entry — [[items/buildings]].

`Store` is the shared base: a `cap` and `useDefault`. `useDefault` marks the instance a shop purchase flows into. One default per kind today; nothing else is buyable. The flag is the seam multiple stores will hang off, not a feature yet.

| store | holds |
|---|---|
| `seed-silo` | `{ crop, rarity, count }[]` cap `SILO_SEED_CAP` |
| `additive-store` | `{ id, liters }[]`, `ADDITIVE_IDS = fertilizer · synth · compost`, cap `ADDITIVE_CAP_LITERS` |

Both caps are cumulative across every stack / kind in that store.

Walk up → the store takes back everything it keeps, from hand and from the 16 house slots, then the panel opens ([[ui/store]]). Overflow past the cap stays on you.

Pads + `Act.load`/`unload`. Guest may. `out` + `SENSOR_HOLD`: silo `used >= SILO_SEED_CAP`; additive `used >= ADDITIVE_CAP_LITERS`. Port `out` origin bottom. Load: silo seeds until cargo full; additive bags `min(ADDITIVE_BAG, stored)`. Unload until that cap.

Click a stack → it goes to **hand**. Silo hands over the whole stack. Additive store hands over one bag, `min(ADDITIVE_BAG[id], stored)`. If the hand already holds something the store would not take back, that item is set down on the nearest plot first — the gardener's cell, else a `frontOf` neighbour. No free plot: the take is refused rather than destroying the item.

Buying: `pack-*` → silo, `buy-fertilizer` / `buy-synth-fertilizer` → additive store. Neither arms a place ghost. Over cap the buy is refused: `'Seed silo full'` / `'Additive store full'` (`BuyFail`). Grass seeds, sugar, and weed-spray are not seeds or additives; they still go to the house.

`buyPacks(id)` always legal: five seed packs at `5 × skuPrice(id) × 0.95`. Ctrl still shop gesture. — [[mechanics/family]]

## Starter

Shovel in hand. Bucket on the doorstep (full `CONTAINERS.bucket`). Money `MONEY_START` — preference.

Seed silo: starter carrot / tomato / potato stacks. House: three saplings (apricot, lemon, cherry).

Shop `pack-*` are five seeds. Always common unless the player owns `seed-bank` — [[mechanics/family]].

## Tools

Shovel, better shovel, pickaxe, hardened pickaxe, bucket, large bucket. Uses / work / capacities — preference. Unlock ids on `SKUS`. 0 uses: hand empty. `workSeconds` is baked on the Item. New games / new buys use `SHOVELS.*.workSeconds`. Rotary unchanged.

Weed spray: `{ kind: 'weed-spray'; usesLeft }`. `WEED_SPRAY_USES`. Illegal: `usesLeft` 0 as held. — [[mechanics/weeds]]

## Boxes

`BOX_SMALL`, `BOX_LARGE` — preference. Small in the shop from the start. Large `unlock-large-box` only.

```
cargo =
  | { kind: 'empty' }
  | { kind: 'stack'; goods: 'seeds'; stack: Stack }
  | { kind: 'stack'; goods: 'fruit'; stack: FruitStack }
  | { kind: 'stack'; goods: 'weed'; count: number }
```

One kind: fruit or seeds (one crop+rarity) or weeds. Harvest and pickup fill the box if it accepts. Weed pull: into the box if empty or already weed cargo, up to cap; else no-op (do not empty-hand). Sugar-cane is fruit. Not sugar liters. Not saplings. Not spirit / wine / jam / oil / flour / extract. Illegal: box weed+fruit mix. Illegal: weed+seeds mix.

## Fertilizer / compost

Ordinary bag `FERT_BAG_LITERS`, always in the shop. Synthetic `SYNTH_BAG_LITERS`, research. Compost `COMPOST_LITERS`, organic feed.

Compost box, `unlock-compost`, plants tree, no prerequisite — priced level with `unlock-fertilizer`. `COMPOST_NEED` units → one bag in `COMPOST_SECONDS` — preference. Output drop on a plot in front. Dump all legal until dest full. Pads; no port. Guest dump / Load / Unload. Keep `frontOf`.

`COMPOST_VALUE` — preference. Sugar composts as `liters × COMPOST_VALUE.fruit`. Empty-hand weeds/grass are feedstock. Compost accepts boxed weeds (`COMPOST_VALUE.weed`). Shovel dead/rotten drops nothing — [[mechanics/plants]]. Spirit / wine / jam / oil / flour / extract: not compost.

## Grind

Seed grinder 1×1, `unlock-grinder`. One annual fruit including sugar-cane (not `TreeId`) → `GRIND_MIN`..`GRIND_MAX` seeds, same crop and rarity. `GRIND_WORK` per fruit — preference. Box dumps all accepted fruit in it. Seeds merge into house or drop if full. Tree fruit and sugar: refuse.

Mill / jam / still / barrel / freezer / shop sugar: [[mechanics/machines]].

## Tiles

`buy-tile-paved` `buy-tile-brick` `buy-tile-cobble` — preference. Cosmetic. Stay armed. Replace bare untilled or an existing tile. Keep `ground`. Grass is not a tile site.

## Invariants

`inventory.slots` — Hand is one item. House 16 slots. Chest `CHEST_SLOTS`. Starter: shovel in hand, bucket on door (`CONTAINERS.bucket`), seed silo starter stacks, three saplings, money `MONEY_START`.

`inventory.compost` — Compost `COMPOST_NEED` → `COMPOST_LITERS` in `COMPOST_SECONDS`. Composting research `unlock-compost`.

`inventory.box` — A box is `Item` `{ kind: 'box' }` in hand, house, chest, or drops. Cap `BOX_SMALL` or `BOX_LARGE`. Cargo empty | seeds | fruit | weed. Not `CompostBox`. Not an unconfirmed SKU. Illegal: box weed+fruit mix. Illegal: weed+seeds mix.

`inventory.containers` — `CONTAINERS.bucket`. `large-bucket`. `FERT_BAG_LITERS`, `buy-fertilizer`. `SYNTH_BAG_LITERS`, `buy-synth-fertilizer`. `COMPOST_LITERS`. `PLANT_FERT_PER_SEC` and `WEED_FERT_PER_SEC` × 0.9 on the prior tuned-to×0.6 values.
