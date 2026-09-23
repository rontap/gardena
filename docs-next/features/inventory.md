# Inventory

Code: `item.ts`, `store.ts`, `seat.ts`, `queue.ts` (`doPickup`, `doDrop`), swap methods on `World`, `building.ts` (`Chest`, `Freezer`, `Postbox`, `SeedSilo`, `AdditiveStore`), `defs/items.ts`; see [[code-map]].
Unlocked: from the start. Chests and freezers are bought in [[features/build]].

## Purpose

The gardener carries one item or stack in the hand and more in the inventory at the house. Every action on the farm uses the item in the hand: a shovel digs, seeds plant, a bucket waters. Chests and freezers hold items on the farm; the Seed silo holds seeds and the Additive store holds fertilizer, compost, Weed spray and sugar. Freezers slow the loss of freshness.

## Rules

### Items

`Item` in `item.ts` is a union over `kind`. Three groups by how quantity is stored:

- counted (`count`): seeds, fruit, grafts, processed goods, Rotten produce, dead plants, Pulled weed, Cut grass, wood, ash, Fly agaric;
- litres (`liters` and `capacityLiters`): buckets (`container`), fertilizer, compost, Weed spray, sugar;
- uses (`usesLeft` and `workSeconds`): shovels, pickaxes, axes, chainsaws.

A tree seed has no count; one tree seed is one item. Treasure holds coins.

Fruit carries crop, variety, quality, `unitSale`, freshness and `cut`. Processed goods carry quality and `unitSale`; jam, cask, spirit and oil also carry `infused` ([[features/machines]]).

### Stacks

Two counted items merge when `stackable` is true: same kind, and for seeds, fruit and grafts the same crop and variety; for jam, cask and spirit the same product, variety and `infused`; for oil the same `infused`; for Rotten produce and dead plants the same crop class. Merging averages quality and `unitSale` weighted by count; fruit also averages freshness.

A stack holds at most `stackMax`: `STACK_MAX` for raw items, `STACK_MAX_CRAFTED` for processed goods (`crafted`), each raised by the `bulk-up` skill (`BULK_UP_STEP`, `BULK_UP_CRAFTED_STEP` per rank).

### Hand

Each seat has one hand slot. Picking up, harvesting and taking from a store put the item in the hand. If the hand holds a different item, a pick-up from a plot is refused with a speech line; a pick-up from the ground swaps the hand item with the ground item. A pick-up of a stackable item merges up to the stack limit and leaves the rest.

A new solo game starts with a shovel in the hand. A joining guest also starts with a shovel.

### Inventory

Each seat has an inventory of 16 slots. It is opened with **Inventory** at the house: the gardener walks to the door (`DOOR`) and the inventory panel opens. Clicking a slot swaps it with the hand (`swap`). Empty slots are moved to the end after each change.
### Items on the ground

`World.drops` holds items on tiles. Right-click on an owned plot with an item in hand queues a drop there (`doDrop`). Buildings and machines drop output on a free plot next to them when they have nowhere else to put it. Items that cannot be delivered to the postbox are dropped at the door. Fruit on the ground keeps losing freshness; Rotten produce on the ground is removed after `ROTTEN_GROUND_DAYS`.

### Chests, freezers and postbox

A chest has `CHEST_SLOTS` slots; a freezer has `FREEZER_SLOTS` (a large freezer has more). Clicking a slot swaps it with the hand (`swapChest`). Fruit in a freezer loses freshness at `FREEZER_ROT_MUL` of the normal rate. Machines take input from a chest or freezer on their input side and put output into one on their output side ([[systems/building-io]]).

The postbox has `POSTBOX_SLOTS` slots. Contract prizes that are items (tree seeds, tools) are put there. The player can take items out of the postbox but not put items in.

### Seed silo and Additive store

The Seed silo holds up to `SILO_SEED_CAP` seeds as stacks by crop and variety. **Open Seed silo** puts every seed from the hand and inventory into it. Taking a stack puts all of it in the hand; if the hand holds the same crop and variety, the counts merge.

The Additive store holds up to `ADDITIVE_CAP_LITERS` litres of fertilizer, compost, Weed spray and sugar. Opening it puts those items from the hand and inventory into it. Taking one gives a bag of `ADDITIVE_BAG` litres (sugar: `SUGAR_BAG`), or fills the bag in hand.

Buying seed packs and bags puts them directly into the store. Bought seeds are Plain; their quality is `seedBankQuality` of the `seed-bank` skill plus `FAMILIARITY_SEED_QUALITY` × the crop's familiarity, at most 1.

The field silos for vehicles (Seeding silo, Additive silo, Produce silo) use the same store rules; Auto-restock buys back what a vehicle took ([[features/vehicles]]).

### Tools and buckets

`defs/items.ts` defines shovels (`shovel`, `better-shovel`, `rotary-shovel`), pickaxes (`pickaxe`, `better-pickaxe`, `diamond-pickaxe`), the axe and the chainsaw, each with uses and work seconds, and the two buckets (`bucket`, `large-bucket`) with capacity in litres. Each dig, mine or chop uses one or more uses; a tool at 0 uses is removed from the hand. A bucket is filled at a pump, well or tap ([[features/water]]).

| tool | used for |
|---|---|
| shovel | till, dig up plants and dead plants, dig weeds, dig trees and burrows |
| pickaxe | mine rock and very hard soil |
| axe, chainsaw | chop a grown tree |
| bucket | water plots and trees |

## Screen

- Walk-up prompts: **Open {name}** for chest, freezer, Seed silo, Additive store, house (**Inventory**).
- Refusals: **My hand is full!** (stack at its limit), **I need to drop what is in my hand to pick this up** (different item in hand), **I can't remember more errands than that!** (job list full).
- Store purchase refusals: **Cannot afford**, **Seed silo full**, **Additive store full**.
- Hover on a held item: name, count or litres, and for fruit Quality and Freshness bars.
- todo-almanac

## Guest

A guest has their own hand and inventory and can use chests, freezers, the postbox and both stores.

## Save and sync

Saved: each seat's hand and inventory; chest, freezer and postbox slots; store contents; items on the ground. The digest carries each seat's hand and inventory.

## Art

Item faces are in `src/assets/items/` and `src/assets/fruits/`; `held.tsx` draws them.

## Invariants

| id | rule | test |
|---|---|---|
| `inventory.pick-full` | a plot pick-up with a different item in hand is refused on arrival; a ground pick-up swaps | `queue.test.ts` |
| — | the hand merges the same kind only, up to `STACK_MAX` | `plants.test.ts` |
| — | processed goods stack to `STACK_MAX_CRAFTED`; `bulk-up` raises both limits | `plants.test.ts` |
| — | a different variety never merges; the same variety at a different quality averages quality by count, by litres for sugar | `plants.test.ts` |
| — | a bought pack is Plain at `seedBankQuality` | `plants.test.ts` |

## When you change this

- New item kind: add it to `Item`; decide `countable`, `crafted` and `stackable`; add its name (`itemLine`, `faceName`), its face art, its save handling ([[systems/save]]), and whether the Market, Compost box, Furnace and vehicles accept it ([[features/market]], [[features/machines]], [[features/vehicles]]).
- Stack limits: vehicles, chests and machine output share `stackMax`.
- Store capacity: [[features/vehicles]] field silos and restock.
