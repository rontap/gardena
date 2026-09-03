# Inventory

Hand is one item. Empty or hold.

House: 16 slots. Walk to the door, swap with hand. Auto-merge same crop+rarity seeds and fruit. Sugar merges weighted `unitSale` by liters. Weighted freshness / `unitSale` on fruit.

Chest: `CHEST_SLOTS` — preference. 1×1, `unlock-chest`. Walk up, swap any item. Dump/pull all legal until dest or cargo full. Pads + `Act.load`/`unload` — [[mechanics/vehicles]]. `out` + `SENSOR_HOLD`: full = no empty slot. Port `out` origin bottom. Guest `swapChest` / Load / Unload: not. — [[mechanics/multiplayer]] `mp.guest`.

Freezer: `FREEZER_SLOTS` — preference. 1×1, `unlock-preservatives`. Reuses chest act / `swapChest`. Slots rot at `FREEZER_ROT_MUL` of the open rate: cold slows rot, it does not stop it and it never restores freshness. Guest may not open. Same pads / `out` / guest ban as chest. — [[mechanics/machines]] [[mechanics/sensors]]

Quad: `VEHICLE_SLOTS` — preference. Any `Item`, chest swap + compact. Freshness ticks (not freezer). `Act.swapVehicle` legal iff parked (`field` && `driver === 'none'`). Stored: no-op. Driven: no-op. Guests may swap. Hangar HUD has no 6-slot. Tractor has no 6-slot. Fuel is not an item.

Trailer cargo: `TRAILER_CAP`. Seed hopper one seeds stack. Spray hopper one fertilizer|synth|compost bag. `weed-spray` in that hopper unrepresentable. Harvest `HARVEST_SLOTS`, mixed produce, chest merge+compact. `Act.swapTrailer` legal iff trailer attached to a tractor that is field && `driver === 'none'`. Hangar / driving / stored unattached: no-op. Seeder/sprayer refuse wrong kind. — [[mechanics/vehicles]]

## Stores

Seeds and additives do not live in the house. Each has a store building, placed at world start, 1 wide × 2 tall, not a SKU, not researchable, not deletable, no almanac entry — [[items/buildings]].

`Store` is the shared base: a `cap` and `useDefault`. `useDefault` marks the instance a shop purchase flows into. One default per kind today; nothing else is buyable. The flag is the seam multiple stores will hang off, not a feature yet.

| store | holds |
|---|---|
| `seed-silo` | `{ crop, rarity, count }[]` cap `SILO_SEED_CAP` |
| `additive-store` | `{ id, liters }[]`, `ADDITIVE_IDS = fertilizer · synth · compost · weed-spray`, cap `ADDITIVE_CAP_LITERS` |

Both caps are cumulative across every stack / kind in that store.

Walk up → the store takes back everything it keeps, from hand and from the 16 house slots, then the panel opens ([[ui/store]]). Overflow past the cap stays on you. `dest(silo)` = origin of the 1×2, not the south cell. `dest(inventory)` = `DOOR`. [[architecture/world]] `world.dest`.

Pads + `Act.load`/`unload`. Guest may. `out` + `SENSOR_HOLD`: silo `used >= SILO_SEED_CAP`; additive `used >= ADDITIVE_CAP_LITERS`. Port `out` origin bottom. Load: silo seeds until cargo full; additive bags `min(ADDITIVE_BAG, stored)`. Unload until that cap.

Click a stack → it goes to **hand**. Silo hands over the whole stack. Additive store hands over one bag, `min(ADDITIVE_BAG[id], stored)`. If the hand already holds something the store would not take back, that item is set down on the nearest plot first — the gardener's cell, else a `frontOf` neighbour. No free plot: the take is refused rather than destroying the item.

Buying: `pack-*` → silo, `buy-fertilizer` / `buy-synth-fertilizer` / `buy-weed-spray` → additive store. Neither arms a place ghost. Over cap the buy is refused: `'Seed silo full'` / `'Additive store full'` (`BuyFail`). Grass seeds and sugar are not seeds or additives; they still go to the house.

Seed silo Buy row: click `buy(packSku)`, Ctrl+click `buyPacks(packSku)`. Same bodies as shop. No pack (vanilla): no Buy. — [[ui/store]]

`buyPacks(id)` always legal: five seed packs at `5 × skuPrice(id) × 0.95`. Ctrl is shop and seed-silo Buy gesture. — [[mechanics/family]]

## Starter

Shovel in hand. Bucket on the doorstep (full `CONTAINERS.bucket`). Money `MONEY_START` — preference.

Seed silo: starter carrot / tomato / potato stacks. House: three tree seeds (apricot, olive, cherry).

Shop `pack-*` are five seeds. Always common unless the player owns `seed-bank` — [[mechanics/family]].

## Tools

Shovel, better shovel, pickaxe, hardened pickaxe, bucket, large bucket. Uses / work / capacities — preference. Unlock ids on `SKUS`. 0 uses: hand empty. `workSeconds` is baked on the Item. New games / new buys use `SHOVELS.*.workSeconds`. Rotary unchanged.

Weed spray: `{ kind: 'weed-spray'; liters; capacityLiters }`. `WEED_SPRAY_BAG` 30 L — preference (old 30 uses). `ADDITIVE_BAG.weed-spray = WEED_SPRAY_BAG`. Shared `ADDITIVE_CAP_LITERS`. Buy / walk-up / take like fertilizer. Illegal: `liters` 0 as held (empty bag leaves the hand). No `usesLeft` field. — [[mechanics/weeds]]

## Stacks

Countable items — `Extract<Item, { count: number }>` — merge in hand when kind and identity match: seeds and fruit by crop+rarity, spirit by kind+rarity, wine by rarity, jam by crop, rotten / dead by `CropClass`, weed and grass by kind alone.

Cap `STACK_MAX`; `STACK_MAX_CRAFTED` for spirit / wine / jam / oil / flour / extract — preference. `bulk-up` adds `BULK_UP_STEP` per rank, `BULK_UP_CRAFTED_STEP` on the crafted cap — [[mechanics/family]]. `World.stackMax(item)` is derived, not a field.

The cap is on growth, not possession. Harvest, pickup, weed pull, and barrel collect stop at it. A stack handed over whole — silo take, house / chest / vehicle swap — may exceed it; those containers keep their own caps and merge freely.

Refused merge: `say(HAND_FULL)`, prompt `blocked` `My hand is full!`. The crop stays on the plant, the remainder stays on the ground, the hand is not emptied. A different kind or identity is not a refusal — pickup still swaps hand and ground.

Liters are not counts. Buckets, fertilizer / synth / compost / weed-spray bags, and sugar cap at `capacityLiters`. `bulk-up` does not touch them.

## Fertilizer / compost

Ordinary bag `FERT_BAG_LITERS`, always in the shop. Synthetic `SYNTH_BAG_LITERS`, research. Compost `COMPOST_LITERS`, organic feed.

Compost box, start SKU. `COMPOST_NEED` units → one bag in `COMPOST_SECONDS` — preference. Output: east store else `frontOf`. Dump all legal until dest full. Pads; no port. Guest dump / Load / Unload. Chest I/O [[mechanics/machines]].

`COMPOST_VALUE` — preference. Sugar composts as `liters × COMPOST_VALUE.fruit`. Empty-hand weeds/grass are feedstock. Compost accepts weeds (`COMPOST_VALUE.weed`). Shovel dead/rotten drops nothing — [[mechanics/plants]]. Spirit / wine / jam / oil / flour / extract: not compost.

## Grind

Seed grinder 1×1, `unlock-grinder`. Hopper machine, not actor work. Annual fruit including sugar-cane (not `TreeId`) → `GRIND_MIN`..`GRIND_MAX` seeds, same crop and rarity. `GRIND_WORK` 12 per fruit tick — preference. A held fruit stack dumps all of it. Tree fruit and sugar: refuse. Rules: [[mechanics/machines]] `machines.grind-hopper`.

Mill / jam / still / barrel / freezer / shop sugar: [[mechanics/machines]].

## Tiles

`buy-tile-paved` `buy-tile-brick` `buy-tile-cobble` — preference. Cosmetic. Stay armed. Replace bare untilled or an existing tile. Keep `ground`. Grass is not a tile site.

## Invariants

`inventory.slots` — Hand is one item. House 16 slots. Chest `CHEST_SLOTS`. Starter: shovel in hand, bucket on door (`CONTAINERS.bucket`), seed silo starter stacks, three tree seeds, money `MONEY_START`.

`inventory.compost` — Compost `COMPOST_NEED` → `COMPOST_LITERS` in `COMPOST_SECONDS`. `buy-compost-box` unlock `start`.

`inventory.stack` — Countable items merge in hand by kind and identity only. Cap `STACK_MAX`; `STACK_MAX_CRAFTED` for spirit / wine / jam / oil / flour / extract. `bulk-up` adds `BULK_UP_STEP` / `BULK_UP_CRAFTED_STEP` per rank. Growth only: silo / house / chest / vehicle handovers may exceed it. Refused merge says `HAND_FULL`, does not empty the hand, and leaves the crop on the plant or the remainder on the ground. Liters unaffected. Illegal: `{ kind: 'box' }`.

`inventory.containers` — `CONTAINERS.bucket`. `large-bucket`. `FERT_BAG_LITERS`, `buy-fertilizer`. `SYNTH_BAG_LITERS`, `buy-synth-fertilizer`. `COMPOST_LITERS`. `WEED_SPRAY_BAG`, `buy-weed-spray`. `PLANT_FERT_PER_SEC` and `WEED_FERT_PER_SEC` × 0.9 on the prior tuned-to×0.6 values.

`inventory.silo-buy` — Seed silo Buy row click `buy(packSku)`, Ctrl+click `buyPacks(packSku)`. Same fail / merge / shop-stream as shop. No pack: no Buy.
