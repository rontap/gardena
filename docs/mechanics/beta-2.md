# Beta-2 mechanics

**Historical.** Current law: [[mechanics/beta-3]].

Supersedes [[mechanics/beta-1]] where this file names a replacement. Unnamed rules stay Beta-1 except wilt numbers (below).

Renderer: SVG + DOM. Types: [[architecture/beta-2]]. Chrome: [[ui/beta-2]]. Art: [[art/beta-2]].

## Money

- Start: `$50`.
- Sundown: `money += 10` **before** the recap snapshot. Recap `money` includes the payout.
- No other new payouts.

## Walk

Still **6** tiles/s.

Drop and inventory are queued acts. Not instant.

| input | intent | arrive |
|---|---|---|
| right-click Plot, hand hold, not placing | `{ act: 'drop'; at }` | drop hand onto that Plot |
| left-click house / door inventory prompt | `{ act: 'inventory' }` | walk to door `(15, 3)`, then open inventory |

Place-confirm stays instant on the clicked Plot. Right-click while `place.kind === 'sku'` still cancels place only.

Off-plot / building right-click: ignore.

## Containers

Cans are gone. Two buckets.

| id | capacity L | start | shop |
|---|---|---|---|
| bucket | 3 | yes, full, door drop | — |
| large-bucket | 8 | unlock | $18 |

Same `Container` type. `1 L = 1 watering`.

Deleted: `can`, `large-can`, research `unlock-can`, `unlock-large-can`, SKUs `buy-can`, `buy-can-large`.

## Wilt

Start thirst `1.0`. `witherThreshold = 0.33`. `criticalThreshold = 0.10`. Health bar when `thirst < 0.5`.

| id | growSeconds | waterUse /s | sale | seed |
|---|---|---|---|---|
| carrot | 45 | 0.008333 | 4 | 2 |
| potato | 60 | 0.007333 | 7 | 3 |
| wheat | 75 | 0.006 | 10 | 5 |
| tomato | 90 | 0.009333 | 14 | 7 |
| raspberry | 120 | 0.010 | 20 | 10 |

The table in [[mechanics/beta-1]] is wrong.

## Ripe water

`kind === 'ripe'` does not consume water. `thirst` is frozen. Still cannot die.

## Dig seed

Shovel on `growing` or `ripe` drops one `{ kind:'seeds', crop, rarity, count:1 }` on that plot, then the plot becomes `empty`. `dead` / empty / untilled: no seed.

## Tools / shop

| SKU | price |
|---|---|
| pack-carrot | 4 |
| pack-potato | 6 |
| pack-wheat | 8 |
| pack-tomato | 12 |
| pack-raspberry | 16 |
| buy-shovel | 10 |
| buy-better-shovel | 35 |
| buy-bucket-large | 18 |
| buy-box | 2 |
| buy-box-large | 4 |
| buy-pumpjack | 50 |

## Start

- $50
- hand: shovel (100 / 1.0s)
- inventory slot 0: carrot seeds ×5
- door `(15, 3)`: bucket 3 L full
- actor on door tile
- house + starter pump

## Inventory

16 slots. Click slot ↔ swap with hand (restated).

After every inventory mutation (buy, swap, `sellSlot`):

1. Merge **seeds** with the same crop+rarity into the first such slot (sum `count`).
2. Merge **fruit** the same way.
3. Shovels, containers, boxes never merge.
4. Compact: non-empty slots keep first-seen order; empties at the end.

## House sell

Each fruit slot has **Sell**. Click sells that whole stack now (`effectiveSale * count`). Hand unchanged. No walk.

Market desk still sells the hand / box cargo. Unchanged.

## Research

One job at a time (restated). `startResearch` is a no-op while a job runs.

Costs are floor(Beta-1 / 2):

| id | tree | cost | seconds | effect |
|---|---|---|---|---|
| unlock-tomato | plants | 7 | 30 | tomato in shop |
| unlock-raspberry | plants | 12 | 45 | raspberry in shop |
| bump-carrot | plants | 10 | 40 | carrot `saleMul 1.10` |
| bump-potato | plants | 10 | 40 | potato `saleMul 1.10` |
| bump-wheat | plants | 12 | 45 | wheat `saleMul 1.10` |
| unlock-large-bucket | utilities | 10 | 40 | large-bucket in shop |
| unlock-box | utilities | 10 | 35 | box in shop |
| unlock-large-box | utilities | 17 | 50 | large-box in shop |
| unlock-better-shovel | utilities | 12 | 40 | better-shovel in shop |
| unlock-pumpjack | utilities | 20 | 60 | pumpjack in shop |

**Unlock all instantly**: marks every row done, job → idle. No money change. No SKUs granted.

## Shop rows

Every SKU is listed, including locked.

| state | when | click |
|---|---|---|
| not-researched | gated and `!done` | no-op |
| cannot-afford | unlocked and `money < price` | no-op |
| inventory-full | `pack-*`, no merge, no empty | no-op |
| pack | else pack | buy into inventory, then merge |
| tool / container / box | else | enter place |
| pumpjack | else | mutate pump, deduct |

Hover reason: **not researched** or **cannot afford**. If both gated and poor → **not researched**.

## Water overlay

Do not draw `overlay-water.svg`. File stays. Plant sprite stays. Thirst bar when `thirst < 0.5` stays.

## Prompts

New locked texts: **Drop**. House is **Inventory** as an intent, not a UI-only click.

Other Beta-1 prompt strings unchanged.

## Named invariants (tests)

Beta-1 1–8 still hold, with wilt numbers from this file.

9. `money` at first tick is `50`. Sundown adds `10` once, then recap.
10. `bucket.capacityLiters === 3`. `large-bucket.capacityLiters === 8`. No can ids.
11. Right-click drop and house inventory enqueue; they do not mutate inventory/hand until the actor arrives.
12. After buy / swap / `sellSlot`, inventory has at most one seeds stack and one fruit stack per crop+rarity; no holes before the first empty.
13. `sellSlot` on fruit adds `effectiveSale * count`, clears that slot, does not change `hand`.
14. `unlockAll` ⇒ every research id is done and `job` is idle.
15. Shovel SKU price is `10`.
16. Research costs match the table above.
17. Ripe `thirst` does not change during `tick`.
18. Shovel on growing/ripe leaves a 1-count seed drop of that crop+rarity. Dead does not.

## Out of Beta-2

Same as Beta-1. Cans do not return.
