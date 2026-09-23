# Docs review: Inventory, stores and building

Notes: `docs/mechanics/inventory.md`, `docs/items/_index.md`, `docs/items/buildings.md`, `docs/items/tools.md`, `docs/items/tiles.md`, `docs/ui/place.md`, `docs/ui/build.md`, `docs/ui/store.md`
Code: `src/game/sim/item.ts`, `src/game/sim/store.ts`, `src/game/sim/seat.ts`, `src/game/sim/building.ts`, `src/game/sim/queue.ts`, `src/game/sim/prompt.ts`, `src/game/sim/apply.ts`, `src/game/sim/feature-place/place.ts`, `src/game/sim/feature-place/place.helpers.ts`, `src/game/defs/research.ts`, `src/game/defs/shelf.ts`, `src/game/defs/items.ts`, `src/game/view/hit.ts`, `src/game/ui/build.tsx`, `src/game/ui/sku-card.tsx`, `src/game/ui/store.tsx`
Tests: `src/game/sim/inventory.test.ts`, `src/game/sim/world.test.ts`, `src/game/sim/plants.test.ts`, `src/game/sim/soil.test.ts`, `src/game/sim/feature-place/place.test.ts`, `src/game/sim/sensor.test.ts`, `e2e/qol.spec.ts`, `e2e/buildings.spec.ts`

`docs/items/_index.md` is a list of links; it states no rule.

Tick the one line that is true in each question. Tick **none** and write a line under it if none is.

## Disagreements

### 1. What does buying a tool from the Build dock do?
- [ ] **doc** `docs/ui/build.md:68` — "tools go to hand"; `docs/ui/build.md:88` — every Build sku "either arms `Seat.place` or goes to hand".
- [ ] **doc** `docs/ui/place.md:65` — item SKUs show the chip **Place {skuLabel}** under the pointer.
- [x] **code** `src/game/sim/feature-place/place.ts:240-242` and `src/game/sim/feature-place/place.helpers.ts:521-526` — buying a tool (shovel, pickaxe, axe, chainsaw, bucket) arms a place ghost; the confirming click on an owned plot pays and lays the tool on that cell as a ground drop, then disarms. Nothing goes to the hand.
- [ ] **test** — no test buys a tool.
- [ ] **none**

### 2. How many things are in the house at the start?
- [ ] **doc** `docs/mechanics/inventory.md:46` — four base tree seeds, one graft of every tree Variety, and `STARTER_FRUIT_N` fruit of each `STARTER_FRUIT` Variety: "Twelve of sixteen slots."
- [ ] **doc** `docs/mechanics/inventory.md:50` — tree seeds and grafts only: "Ten of sixteen."
- [ ] **code + test** `src/game/sim/seat.ts:62` — 4 tree seeds, 6 grafts, and 5 each of `keknyelu` and `san-marzano` fruit: twelve slots. `src/game/sim/world.test.ts:804` "`inventory.slots` — House starter: … Twelve of sixteen."
- [ ] **none**
- [x] Not Documented! Only write "Current house starting inventory is during developement testing"

### 3. Can paving go on grass?
- [ ] **doc** `docs/mechanics/inventory.md:100` and `docs/ui/place.md:65` — "Grass is not a tile site."
- [ ] **doc** `docs/items/tiles.md:13` — `isPavingSite` is any `untilled` cell or a solid building cell; burrow, rock, tree and tilled soil refuse.
- [x] **code** `src/game/sim/plot.ts:155` — `isPavingSite` accepts every untilled cell whose cover is not a burrow, so bare and grass both take paving.
- [ ] **test** `src/game/sim/soil.test.ts:117` "tiles.paving-site…" — tests bare, tilled, house and rock; grass is not tested.
- [ ] **none**

### 4. Which placements stay armed after a confirm?
- [ ] **doc** `docs/ui/place.md:13` — `STAY_ARMED` (pipe, valve, three sprinklers, fifteen sensor-cell SKUs), delete, wire, valve, and tiles `buy-tile-paved` `buy-tile-brick` `buy-tile-cobble`.
- [ ] **doc** `docs/items/tiles.md:3` — paving and fencing both stay armed. `docs/mechanics/inventory.md:100` names three tile SKUs (no asphalt).
- [x] **code** `src/game/view/hit.ts:46` — `STAY_ARMED` is pipe, valve, three sprinklers and the sixteen `SENSOR_CELL_SKUS` (`src/game/sim/ids.ts:311`, which include `buy-water-system`); all four tiles including `buy-tile-asphalt`, and `buy-fence`, stay armed because `confirmPlace` returns without clearing `place` (`src/game/sim/feature-place/place.helpers.ts:258-280`).
- [ ] **none**

### 5. What order are the paving cards in on the Land shelf?
- [x] **doc** `docs/ui/build.md:20` — "Paving cobble → brick → paved"; `docs/ui/build.md:24` — "Paving cheapest first".
- [ ] **code** `src/game/defs/shelf.ts:105` — asphalt, cobble, brick, paved. Prices (`src/game/defs/research.ts:442-445`) are asphalt 3, cobble 4, brick 6, paved 5, so brick comes before the cheaper paved slab.
- [ ] **test** `src/game/sim/world.test.ts:1523` — checks every sku is on one shelf group, not the order.
- [ ] **none**

### 6. Which groups are on the Automation shelf?
- [ ] **doc** `docs/ui/build.md:17` — Grinding, Brewing, Preserving, Infusing, Compost, Grafting, Hangar (`buy-hangar`, `buy-refuel`).
- [x] **code** `src/game/defs/shelf.ts:44-53` — the same, plus **Sorting** (`buy-sorter`) and **Necronomicon** (`buy-necronomicon`) between Grafting and Hangar.
- [ ] **none**

### 7. What does a Build card say when the store is full?
- [ ] **doc** `docs/ui/build.md:48-49` — "Seed silo full" / "Additive store full".
- [x] **code** `src/game/ui/sku-card.tsx:31-34` — "The seed silo is full" / "The additive store is full" (`messages/en/hud.json:97-98`); on a field silo "The seeding silo is full" / "The additive silo is full". The internal `BuyFail` codes are the short forms the note quotes.
- [ ] **none**

### 8. What does the delete prompt say on the Necronomicon?
- [ ] **doc** `docs/ui/place.md:121` — **Cannot demolish here**, like the house and rocks.
- [x] **code** `src/game/sim/prompt.ts:415` — "The Necronomicon stays where you put it." (`messages/en/prompt.json:170`).
- [ ] **test** `src/game/sim/feature-place/place.test.ts:74` "place.demolish-filter…" — not read for this string.
- [ ] **none**

### 9. How does the player cash treasure?
- [ ] **doc** `docs/mechanics/inventory.md:90` — house, chest and vehicle may hold treasure; `{ act: 'open'; at }`, work 0, `money += coins`, hand empty.
- [ ] **doc** `docs/mechanics/burrow.md:72` — treasure never enters a hand; **Pick up** adds the coins and removes the drop; no `open` intent.
- [x] **code + test** `src/game/sim/queue.ts:619` — pick-up adds the coins and removes the drop; no `open` act exists (searched `act: 'open'`). `src/game/sim/feature-burrow/burrow.test.ts:364`.
- [ ] **none**

### 10. Which stores does a purchase flow into, and is anything else buyable?
- [ ] **doc** `docs/mechanics/inventory.md:19` — `useDefault` marks the instance a purchase flows into; one default per kind; "nothing else is buyable".
- [x] **code** `src/game/sim/building.ts:1245` and `:1308-1316` — the field Seeding silo and Additive silo are bought and placed by the player and are `Store`s too; they are built with `useDefault` true (the constructor default). A purchase goes to the store at the cell the panel was opened on (`seedStoreAt` / `additiveStoreAt`, `src/game/sim/store.ts:19-29`), not by `useDefault`. `useDefault` is read only when a save loads, to pick `world.silo` and `world.additives` (`src/game/sim/feature-save/save.parse.ts:310-311`).
- [ ] **none**

### 11. What quality are bought seed packs?
- [ ] **doc** `docs/mechanics/inventory.md:34`, `:40`, `:52` and `docs/ui/store.md:33`, `:62` — `'base'`, quality 0.
- [x] **code** `src/game/sim/feature-place/place.ts:226`, `:305` — `boughtSeedQuality`: the `seed-bank` value plus 0.02 × familiarity with that crop, capped at 1 (see the plants review, question 3).
- [ ] **test** `src/game/sim/plants.test.ts:627` and `src/game/sim/inventory.test.ts:28` "…Packs `'base'` quality 0…" — quality 0 on a new world without `seed-bank` and with familiarity 0.
- [ ] **none**

## Doc only (no code found)

### 12. Is there a `MONEY_START` constant?
- [ ] **doc** `docs/mechanics/inventory.md:44`, `:104` — money `MONEY_START` — preference. Searched: `MONEY_START`, nothing found. Starting money is the literal `money = 50` on `World` (`src/game/sim/world.ts:311`); `src/game/sim/world.test.ts:409` "money starts 50…".
- [ ] **removed from the game** (the number exists, the name does not)
- [ ] **none**
- [ ] Developement question, not doc mateiral.

## Code only (no note mentions it)

### 13. Can the Sugar Buy button grey out because the house is full?
- [ ] **code** `src/game/ui/sku-card.tsx:53-57` — `rowState` for `buy-sugar` returns `inventory-full` ("No room in the inventory") when the house has no empty slot and no sugar slot, although a sugar buy is delivered to the Additive store (`src/game/sim/feature-place/place.ts:216`), not the house.
- [ ] **intended, document it**
- [x] **not intended**

### 14. How many seeds does a new farm start with?
- [ ] **code** `src/game/sim/seat.ts:11` — carrot 7, tomato 2, potato 2 (all `'base'`, quality 0), plus 5 of each of the seven `STARTER_VARIETY_PACKS`. The note says "today's starter counts" without numbers (`docs/mechanics/inventory.md:48`).
- [ ] **intended, document it**
- [ ] **not intended**
- [ ] skip

### 15. Does the demolish prompt use the shop label?
- [ ] **code** `src/game/sim/prompt.ts:358-420` — demolish reads "Demolish {name}" with the building name from `DELETE_NAME`, lower-cased (for example "Demolish chest", "Demolish wooden fence"). The note writes **Demolish {skuLabel}** (`docs/ui/place.md:9`, `:122`).
- [ ] **intended, document it**
- [ ] **not intended**
- [ ] skip
