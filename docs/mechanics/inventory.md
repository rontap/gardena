# Inventory

Hand is one item. Empty or hold.

House: 16 slots. Walk to the door, swap with hand. Auto-merge same crop+variety seeds and fruit. Sugar merges weighted `unitSale` and `quality` by liters. Weighted freshness / `unitSale` / `quality` on fruit.

Chest: `CHEST_SLOTS` — preference. 1×1, unlock `start`, price preference. Walk up, swap any item. Dump/pull all legal until dest or cargo full. Pads + `Act.load`/`unload` — [[mechanics/vehicles]]. `out` + `SENSOR_HOLD`: full = no empty slot. Port `out` origin bottom. Guest: [[mechanics/multiplayer]] `mp.guest`.

Freezer: `FREEZER_SLOTS` — preference. 1×1, `unlock-preservatives`. Reuses chest act / `swapChest`. Slots rot at `FREEZER_ROT_MUL` of the open rate: cold slows rot, it does not stop it and it never restores freshness. Same pads / `out` as chest. Guest: [[mechanics/multiplayer]] `mp.guest`. — [[mechanics/machines]] [[mechanics/sensors]]

Quad: `VEHICLE_SLOTS` — preference. Any `Item`, chest swap + compact. Freshness ticks (not freezer). `Act.swapVehicle` legal iff parked (`field` && `driver === 'none'`). Stored: no-op. Driven: no-op. Guests may swap. Hangar HUD has no 6-slot. Tractor has no 6-slot. Fuel is not an item.

Trailer cargo: `TRAILER_CAP`. Seed hopper one seeds stack. Spray hopper one fertilizer|compost bag. `weed-spray` in that hopper unrepresentable. Harvest `HARVEST_SLOTS`, mixed produce, chest merge+compact. `Act.swapTrailer` legal iff trailer attached to a tractor that is field && `driver === 'none'`. Hangar / driving / stored unattached: no-op. Seeder/sprayer refuse wrong kind. — [[mechanics/vehicles]]

## Stores

Seeds and additives do not live in the house. Each has a store building, placed at world start, 1 wide × 2 tall, not a SKU, not researchable, not deletable, no almanac entry — [[items/buildings]].

`Store` is the shared base: a `cap` and `useDefault`. `useDefault` marks the instance a purchase flows into. One default per kind today; nothing else is buyable. The flag is the seam multiple stores will hang off, not a feature yet.

| store | holds |
|---|---|
| `seed-silo` | `SiloStack[]` `{ crop, variety, quality, count }` cap `SILO_SEED_CAP` |
| `additive-store` | `{ id, liters }[]`, `ADDITIVE_IDS = fertilizer · compost · weed-spray`, plus one `sugar: { liters, unitSale, quality }` bin, cap `ADDITIVE_CAP_LITERS` |

Both caps are cumulative across every stack / kind in that store. Silo `used` is crop-stack counts. Silo stacks merge on crop+variety; quality averages weighted by count. `accept` is `{ kind: 'seeds' }`. Grass is a silo crop like chilli: `{ crop: 'grass'; variety: 'base'; quality; count }`. `'base'` only. Field Seeding silos use the same stacks. No extra grass store type. No `SeedStore.grass` field.

Walk up → the store takes back everything it keeps, from hand and from the 16 house slots, then the panel opens ([[ui/store]]). Seed silo keeps annual seeds, grass included. Overflow past the cap stays on you. `dest(silo)` = origin of the 1×2, not the south cell. `dest(inventory)` = `DOOR`. [[architecture/world]] `world.dest`.

Pads + `Act.load`/`unload`. Guest may. `out` + `SENSOR_HOLD`: silo `used >= SILO_SEED_CAP`; additive `used >= ADDITIVE_CAP_LITERS`. Port `out` origin bottom. Load: silo seeds until cargo full; additive bags `min(ADDITIVE_BAG, stored)`. Unload until that cap.

Click a stack → it goes to **hand**. Silo hands over the whole stack. Grass: `takeSilo('grass', 'base')` → `{ kind: 'seeds'; crop: 'grass'; variety: 'base'; quality; count }`. Additive store hands over one bag, `min(ADDITIVE_BAG[id], stored)`. A full hand joins or swaps first, `inventory.swap` below. Only what the store will not take back is set down on the nearest plot — the gardener's cell, else a `frontOf` neighbour. No free plot: the take is refused rather than destroying the item.

Buying: `pack-*` including `pack-grass` → silo as `'base'` quality 0, `buy-fertilizer` / `buy-weed-spray` / `buy-sugar` → additive store. Neither arms a place ghost. Over cap the buy is refused: `'Seed silo full'` / `'Additive store full'` (`BuyFail`). Field Seeding silo: `'Seeding silo full'`. `pack-grass` does not go to the house.

Sugar is not an `AdditiveId`. It sits in its own `sugar` bin on the store because it carries `unitSale` and `quality` and the additives carry neither, and because a spray trailer must never be able to load it. `putSugarInto` mixes `unitSale` and `quality` weighted by liters, the way `mergeSugar` does in the hand. `takeSugar()` hands over `min(SUGAR_BAG, stored)` at the bin's sale and quality. Walk-up deposit folds a carried bag back in. `Act.takeStore` `k: 'sugar'`.

Seed silo Buy row: click `buy(packSku)`, Ctrl+click `buyPacks(packSku)`. `packSku('grass')` is `pack-grass`. The Seed silo is the only place a pack is sold, including `pack-grass`. No pack (vanilla): no Buy. `pack-chilli` Buy when `skuShown`. `pack-grass` Buy when `skuShown`, buy after `unlock-landscaping`. Field Seeding silos included. — [[ui/store]]

`buyPacks(id)` always legal: five seed packs at `5 × skuPrice(id) × 0.95`, each `'base'` quality 0. `pack-grass` delivers five × `GRASS_PACK` of `{ kind: 'seeds'; crop: 'grass'; variety: 'base'; quality: 0 }`. Ctrl is the seed-silo Buy gesture. — [[mechanics/family]]

## Starter

Shovel in hand. Bucket on the doorstep (full `CONTAINERS.bucket`). Money `MONEY_START` — preference.

House: four `base` tree seeds, one graft of every tree variety, and `STARTER_FRUIT_N` fruit of every `STARTER_FRUIT` Variety — `keknyelu` and `san-marzano`, Quality 0, fresh. Twelve of sixteen slots. That is one barrel of Premium wine and one Passata without waiting on a first crop.

Seed silo: starter carrot / tomato / potato at `'base'` quality 0 (today's starter counts, merged onto `'base'`), plus one `PACK_N` pack of each annual variety: `bintje` `red-fife` `green-zebra` `san-marzano` `black-raspberry` `concord` `keknyelu`. Seven packs. Total under `SILO_SEED_CAP`.

House: four `'base'` tree seeds — apple, apricot, olive, cherry — quality 0, and one graft of every tree variety: `kingston-black` `pink-lady` `blenheim` `klosterneuburger` `arbequina` `bing`. Ten of sixteen. Graft quality 0.

`pack-*` are `PACK_N` seeds, `'base'`, quality 0.

## Tools

Shovel, better shovel, pickaxe, hardened pickaxe, axe, chainsaw, bucket, large bucket. Uses / work / capacities — preference. `SHOVELS.shovel.uses` and `buy-shovel` price preference. `SHOVELS['better-shovel'].uses` and `buy-better-shovel` price preference. Unlock ids on `SKUS`. 0 uses: hand empty. `workSeconds` is baked on the Item. New games / new buys use `SHOVELS.*.workSeconds` / `AXES.axe.workSeconds` / `AXES.chainsaw.workSeconds`. No better-axe. Burrow extract: any shovel id, work `workSeconds × BURROW_MUL`, 1 use, not hardness — [[mechanics/burrow]] `burrow.dig`.

`{ kind: 'axe'; usesLeft; workSeconds }`. `{ kind: 'chainsaw'; usesLeft; workSeconds }`. No `id`. SKU `buy-axe` `buy-chainsaw`. Chop: [[mechanics/trees]] `trees.chop`.

Weed spray: `{ kind: 'weed-spray'; liters; capacityLiters }`. `WEED_SPRAY_BAG` 30 L — preference (old 30 uses). `ADDITIVE_BAG.weed-spray = WEED_SPRAY_BAG`. Shared `ADDITIVE_CAP_LITERS`. Buy / walk-up / take like fertilizer. Illegal: `liters` 0 as held (empty bag leaves the hand). No `usesLeft` field. — [[mechanics/weeds]]

## Stacks

Countable items — `Extract<Item, { count: number }>` — merge in hand when kind and identity match: seeds and fruit by crop+variety (grass seeds are `crop: 'grass'`), graft by crop+variety, spirit by kind+variety+`infused` (mixed by kind+`infused`), wine by variety+`infused`, jam by crop+variety+`infused`, oil by `infused`, flakes / vanilla-extract / bread by kind, rotten / dead by `CropClass`, weed, grass, wood, ash by kind alone.

Cap `STACK_MAX`; `STACK_MAX_CRAFTED` for spirit / wine / jam / oil / flour / extract / flakes / vanilla-extract / bread — preference. `bulk-up` adds `BULK_UP_STEP` per owned tier, `BULK_UP_CRAFTED_STEP` on the crafted cap — [[mechanics/family]]. `World.stackMax(item)` is derived, not a field.

The cap is on growth, not possession. Harvest, pickup, weed pull, and barrel collect stop at it. A stack handed over whole — silo take, house / chest / vehicle swap — may exceed it; those containers keep their own caps and merge freely.

Refused merge: `say(HAND_FULL)`, prompt `blocked` `My hand is full!`. The crop stays on the plant, the remainder stays on the ground, the hand is not emptied. A different kind or identity is not a refusal — pickup still swaps hand and ground.

Liters are not counts. Buckets, fertilizer / compost / weed-spray bags, and sugar cap at `capacityLiters`. `bulk-up` does not touch them. Sugar merges weighted `unitSale` and `quality` by liters.

Same variety at different quality merges and averages, weighted by count — by liters for sugar.

## Fertilizer / compost

Ordinary bag `FERT_BAG_LITERS`, always at the Additive store. Compost `COMPOST_LITERS` — preference. Compost is a bag that feeds like fertilizer.

Compost box, start SKU. `COMPOST_NEED` units → one bag in `COMPOST_SECONDS` — preference. Output: east store else `frontOf`. Dump all legal until dest full. Pads; no port. Guest dump / Load / Unload. Chest I/O [[mechanics/machines]].

`COMPOST_VALUE` — preference. Sugar composts as `liters × COMPOST_VALUE.fruit`. Ash composts as `count × COMPOST_VALUE.ash`. Empty-hand weeds/grass are feedstock. Compost accepts weeds (`COMPOST_VALUE.weed`). Shovel dead/rotten drops nothing; an empty hand picks one up instead, and both compost at 1 — [[mechanics/plants]] `plants.pick-spoiled`. Fruit composts at `COMPOST_VALUE.fruit` regardless of variety. Spirit / wine / jam / oil / flour / extract / flakes / vanilla-extract / bread / wood / graft / treasure: not compost.

`FURNACE_CAP` `FURNACE_NEED` — preference. `furnaceValue` — [[mechanics/machines]] `machines.furnace-feed`. Wood `{ kind: 'wood'; count }`. Ash `{ kind: 'ash'; count }`. Graft at the green rate. Not stall goods. `STACK_MAX`. Treasure not furnace. Flour is bread lock, not ash — [[mechanics/infusion]] `infusion.furnace`. Flakes and vanilla-extract refuse.

## Treasure

`{ kind: 'treasure'; coins }`. Not countable. Not compost. Not furnace. Not stall. Not silo. House / chest / vehicle may hold it. `{ act: 'open'; at }`, work 0: `money += coins`, hand empty. [[mechanics/burrow]] `burrow.open`

## Grind

Seed grinder 1×1, `unlock-grinder`. Hopper machine, not actor work. Fruit including sugar-cane and tree fruit → seeds or tree-seed. `GRIND_WORK` 12 per fruit tick — preference. A held fruit stack dumps all of it. Sugar: refuse. Rules: [[mechanics/machines]] `machines.grind-hopper` `machines.grind-tree`.

Mill / jam / still / barrel / freezer / furnace / infuser / bought sugar / station: [[mechanics/machines]] [[mechanics/infusion]].

## Tiles

`buy-tile-paved` `buy-tile-brick` `buy-tile-cobble` — preference. Cosmetic. Stay armed. Replace bare untilled or an existing tile. Keep `ground`. Grass is not a tile site. Burrow is not a tile site.

## Invariants

`inventory.slots` — Hand is one item. House 16 slots. Chest `CHEST_SLOTS`. Starter: shovel in hand, bucket on door (`CONTAINERS.bucket`), seed silo starter `'base'` stacks plus one pack of each annual variety, four `'base'` tree seeds, one graft of every tree variety, `STARTER_FRUIT_N` fruit of every `STARTER_FRUIT` Variety, money `MONEY_START`.

`inventory.compost` — Compost `COMPOST_NEED` → `COMPOST_LITERS` in `COMPOST_SECONDS`. `buy-compost-box` unlock `start`. Graft not compost. Treasure not compost.

`inventory.stack` — Countable items merge in hand by kind and identity only. `variety` is in the identity key. `infused` is in the identity key on jam, cask, spirit, oil. Cap `STACK_MAX`; `STACK_MAX_CRAFTED` for spirit / wine / jam / oil / flour / extract / flakes / vanilla-extract / bread. `bulk-up` adds `BULK_UP_STEP` / `BULK_UP_CRAFTED_STEP` per owned tier. Growth only: silo / house / chest / vehicle handovers may exceed it. Refused merge says `HAND_FULL`, does not empty the hand, and leaves the crop on the plant or the remainder on the ground. Liters unaffected. Illegal: `{ kind: 'box' }`. Illegal: `{ kind: 'treasure'; count }`.

`variety.stack` — Different variety never merges. Same variety at different quality merges and averages quality, weighted by count — by liters for sugar. Fruit `cut` is not in the identity key; a merged stack is cut when either side was — [[mechanics/machines]] `station.cut`. Infused never merges with plain.

`inventory.infused` — `infused: boolean` required on jam, cask, spirit, oil. Flakes and vanilla-extract countable, no `unitSale`, not stall. Bread countable, stall. — [[mechanics/infusion]] `infusion.item`

`inventory.containers` — `CONTAINERS.bucket`. `large-bucket`. `FERT_BAG_LITERS`, `buy-fertilizer`. `COMPOST_LITERS`. `WEED_SPRAY_BAG`, `buy-weed-spray`. `PLANT_FERT_PER_SEC` preference.

`inventory.restock` — `SiloSeed.restock` / `SiloSpray.restock`, saved, default false. Field silos only; the house `SeedSilo` and `AdditiveStore` have no such field. On a removal, the silo's `levels()` taken before it are compared with the levels after, and `buyBody` runs `ceil(missing / pack)` times per row, stopping on the first failure. Only `'base'` seeds (`packSku`, grass included) and the `ROW_SKU` rows that have a SKU restock; a named Variety and compost do not. `Act.takeStore` is the only removal that reaches a field silo. `Act.setRestock` toggles it. — [[ui/store]]

`inventory.swap` — Taking from a Seed silo or an Additive store with a full hand never spills what the store itself holds. The same row as the hand joins it: seed counts add and Quality averages by count; a bag tops up to its `capacityLiters` and no further, sugar averaging `unitSale` and `quality` by liters. Any other row is a swap — the held item goes back into that store, then the new stack comes out. Only what the store has no room for, and anything the store does not take, goes to `freeHand`. — [[ui/store]]

`inventory.silo-buy` — Seed silo Buy row click `buy(packSku)`, Ctrl+click `buyPacks(packSku)`. Packs `'base'` quality 0. No pack: no Buy. `pack-chilli` after `unlock-infusion`. `pack-grass` after `unlock-landscaping`, `GRASS_PACK`, `{ kind: 'seeds'; crop: 'grass'; variety: 'base'; quality: 0 }`.

`inventory.grass-silo` — `pack-grass` is not on Build. After `unlock-landscaping` it is sold at the Seed silo on the same path as `pack-chilli`: column when shown, Buy / bulk Buy, lands in the silo as a `'base'` stack, take to hand, walk-up deposits, field Seeding silos included. Item `{ kind: 'seeds'; crop: 'grass'; variety: 'base'; quality: 0; count }`. `packSku('grass')` is `pack-grass`. No `SeedStore.grass`. No `Act.takeStore` `k: 'grass'`. Take is `k: 'silo'` `c: 'grass'` `r: 'base'`. No extra grass store type. Sow is turf — [[mechanics/plants]] `plants.grass`.

`inventory.ash` — 1 ash = `COMPOST_VALUE.ash` compost waste. Wood/ash not stall goods.
