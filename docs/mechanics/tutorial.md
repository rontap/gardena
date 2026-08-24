# Tutorial

Early Access 1 tour. No new gameplay. Copy: [[ui/tutorial]]. This note is gates, steps, predicates.

[[architecture/save]] [[architecture/world]] [[mechanics/plants]] [[mechanics/inventory]] [[mechanics/research]] [[mechanics/water]] [[mechanics/market]] [[mechanics/day]]

## On / off

Decided when play starts. Not re-checked mid-farm.

| start | tutorial |
|---|---|
| New Game, `!slotExists()`, fragment not `start_now` or `unlockall` | on |
| New Game, `slotExists()` | off |
| Load Save | off |
| Upload Save | off |
| fragment `start_now` (`#start_now`) | off |
| fragment `unlockall` (`#unlockall`) | off |

`slotExists()` is `SLOT_KEY` present. Off even if they press New Game.

`#start_now` is `new World`. `#unlockall` is `new World` then `unlockAll()`. Neither reads or writes the slot. App maps both fragments to `startTutorial('start_now')`.

On only for first-time New Game with no stored farm.

After step 10 card click: off for this farm this session. A later load is off because the slot exists, or a later New Game is off because the slot exists. Mid-tour load does not resume a step.

## State

Not a `World` field. Not a `Save` field. Sim does not change.

App holds a session value:

```
TutorialStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

Tutorial =
  | { kind: 'off' }
  | { kind: 'on'; step: TutorialStep; poured: boolean; sold: boolean }
```

`check(world, tutorial)` is read-only on `World`. It returns the next `Tutorial`.

`poured` becomes true when `{ act: 'water' }` completes on a `growing` or `ripe` plot.

`sold` becomes true when `sellAll` pays: `marketOpen` and `marketGain() > 0`. Dispatch of a no-op `sellAll` does not set it.

Illegal: `World.tutorial`. `Save.tutorial`. Resuming a step from parse.

## Card

One step at a time. Show `step` iff `kind === 'on'` and `ready(step)`. No card while waiting for a time gate (`ready` false).

No step counter. Do not block HUD. Do not force camera.

Step 10: show until the player clicks the tutorial card. Then `{ kind: 'off' }`. No timer. No click-anywhere. No auto-dismiss. Clicks on the card on steps 1–9 do not skip.

## Skip-ahead

Each check: total recompute of `done`, not +1 from a counter.

`need` = least `n` in 1..10 with `!done(n)`.

If `need > step`, `step = need`. If `done(step)`, `step = need`. `step` never decreases.

Illegal to show 2 when five `isTilled` cells already exist.

## Helpers

Owned cells only.

`tilledCount` = number of cells where `isTilled`. Kinds: `empty` `weed` `turf` `growing` `ripe` `dead` `rotten`. Distinct cells. Not `untilled`. Not `infertile`. Not `World.digs` (shovel also weeds and plants).

Till = shovel `untilled` → `empty`. Re-shoveling the same tilled plot does not increment.

`holdingSeeds` = `hand.kind === 'hold'` and `hand.item.kind === 'seeds'`. Not `grass-seeds`. Not sapling.

`planted` = a cell `kind` is `growing` | `ripe` | `dead` | `rotten`.

`items` = hand (if hold) ∪ house `inventory` ∪ every chest `slots` ∪ `drops[].item`.

`hasBox` = some item `{ kind: 'box' }`. Cap `BOX_SMALL` or `BOX_LARGE`. SKU `buy-box` / `buy-box-large` pay on confirm and drop the item. Armed SKU is not a box. `CompostBox` is not a box.

`hasFruit` = some item `{ kind: 'fruit' }`, or a box whose `cargo` is `{ kind: 'stack'; goods: 'fruit' }` with `count >= 1`. Not sugar.

`wilted` = a `growing` cell with `waterBand(soil.water, plant.stats(modifiers).waterTolerance) === 'red'`. Existing water-red band. Drown is water red too. No extra thirst flag.

`ripe` = a cell `kind === 'ripe'`. Annual `Plant`. A tree drop is not this.

`researchStarted` = `job.kind === 'run'` or `done.size > 0`. Completes on `startResearch` that actually starts. No-op (`job` already run, id already done, gated, `money < cost`) does not start. Opening Research is App-local and does not complete.

`stallStocked` = some `StallGood` has any rarity×bio count > 0.

## Steps

| n | ready | done |
|---|---|---|
| 1 | on (start) | `tilledCount >= 1` |
| 2 | `tilledCount >= 1` | `tilledCount >= 5` |
| 3 | `tilledCount >= 5` | `holdingSeeds` or `planted` |
| 4 | `holdingSeeds` | `planted` |
| 5 | `planted` | `researchStarted` |
| 6 | `wilted` | `poured` or `ripe` or `hasFruit` or `sold` |
| 7 | `ripe` | `hasBox` |
| 8 | `hasBox` | `hasFruit` |
| 9 | `hasFruit` or `stallStocked` | `sold` |
| 10 | `sold` | click the tutorial card |

Player tasks (not copy):

1. Shovel grass / untilled → till.
2. Till four more. Five distinct `isTilled` cells.
3. House door, seeds in hand.
4. Plant those seeds on tilled (`empty` → `growing`). Hand is one item.
5. `startResearch` any id.
6. Bucket at `DOOR` (`CONTAINERS.bucket`). Fill at the pump is the existing fill. Pour on the plant. Bucket starts full; fill is not a completion predicate.
7. Buy a fruit box, confirm place.
8. Pick any fruit (harvest ripe annual into hand or box, or pick up fruit).
9. Truck, **Sell all**.
10. Goodbye. Card click. Off.

Starter: shovel in hand, bucket drop at `DOOR` with `CONTAINERS.bucket.capacityLiters`, seeds in house. [[mechanics/inventory]].

## Does not change

Crops, buildings, skills, economy. Shop prices out of scope. No tutorial field on `Save`. HUD, camera, panels stay as they are.

## Illegal

- tutorial on when `slotExists()` or fragment `start_now` or `unlockall`
- tutorial on after Load / Upload
- `Save` or `World` carrying a step
- load resuming a mid-tour step
- showing 2 when `tilledCount >= 5`
- counting the same plot five times
- completing 5 by opening Research
- a thirst flag besides `waterBand === 'red'`
- treating `CompostBox` or an unconfirmed box SKU as `hasBox`
- completing 9 on a no-op `sellAll`
- step 10 timer, click-anywhere, or auto-dismiss
- a step counter
- blocking HUD
- forcing camera
