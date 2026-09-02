# Tutorial

Early Access 1 tour. No new gameplay. Copy: [[ui/tutorial]]. This note is gates, steps, predicates.

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

After step 9 card click: off for this farm this session. A later load is off because the slot exists, or a later New Game is off because the slot exists. Mid-tour load does not resume a step.

## State

Not a `World` field. Not a `Save` field. Sim does not change.

App holds a session value: `{ kind: 'off' }` or `{ kind: 'on'; step: 1..9; poured; sold }`.

`check(world, tutorial)` is read-only on `World`. It returns the next `Tutorial`.

`poured` becomes true when `{ act: 'water' }` completes on a `growing` or `ripe` plot.

`sold` becomes true when `sellAll` pays: `marketOpen` and `marketGain() > 0`. Dispatch of a no-op `sellAll` does not set it.

## Card

One step at a time. Show `step` iff `kind === 'on'` and `ready(step)`. No card while waiting for a time gate (`ready` false).

No step counter. Do not block HUD. Do not force camera.

Step 9: show until the player clicks the tutorial card. Then `{ kind: 'off' }`. No timer. No click-anywhere. No auto-dismiss. Clicks on the card on steps 1–8 do not skip.

## Skip-ahead

Each check: total recompute of `done`, not +1 from a counter.

`need` = least `n` in 1..9 with `!done(n)`.

If `need > step`, `step = need`. If `done(step)`, `step = need`. `step` never decreases.

## Helpers

Owned cells only.

`tilledCount` = number of cells where `isTilled`. Kinds: `empty` `weed` `turf` `growing` `ripe` `dead` `rotten`. Distinct cells. Not `World.digs` (shovel also weeds and plants).

Till = shovel `untilled` → `empty`. Re-shoveling the same tilled plot does not increment.

`holdingSeeds` = `hand.kind === 'hold'` and `hand.item.kind === 'seeds'`. Not `grass-seeds`. Not `tree-seed`.

`planted` = a cell `kind` is `growing` | `ripe` | `dead` | `rotten`.

`items` = hand (if hold) ∪ house `inventory` ∪ every chest `slots` ∪ `drops[].item`.

`hasFruit` = some item `{ kind: 'fruit' }`. Not sugar.

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
| 7 | `ripe` | `hasFruit` |
| 8 | `hasFruit` or `stallStocked` | `sold` |
| 9 | `sold` | click the tutorial card |

Player tasks (not copy):

1. Shovel grass / untilled → till.
2. Till four more. Five distinct `isTilled` cells.
3. House door, seeds in hand.
4. Plant those seeds on tilled (`empty` → `growing`). Hand is one item.
5. `startResearch` any id.
6. Bucket at `DOOR`. Fill at the pump is the existing fill. Pour on the plant. Bucket starts full; fill is not a completion predicate.
7. Pick any fruit, then a second of the same crop onto the same stack — [[mechanics/inventory]].
8. Truck, **Sell all**.
9. Goodbye. Card click. Off.

Starter: shovel in hand, bucket drop at `DOOR`, seeds in the silo. [[mechanics/inventory]].

Crops, buildings, skills, economy stay as they are. Shop prices out of scope. HUD, camera, panels stay as they are.

## Invariants

`tutorial.on` — Tutorial on only at New Game with `!slotExists()` and fragment not `start_now` or `unlockall`. `slotExists()` or `#start_now` or `#unlockall` → off, including New Game. Load / Upload → off.

`tutorial.session` — No tutorial field on `Save` or `World`. Session only. Parse does not resume a step.

`tutorial.tilled` — `tilledCount` is `isTilled` cells (`empty` `weed` `turf` `growing` `ripe` `dead` `rotten`), distinct. Five such cells: not step 2. Not `World.digs`.

`tutorial.research` — Step 5 completes on `startResearch` that sets `job.kind === 'run'`, or `done.size > 0`. Not on opening Research.

`tutorial.thirst` — Step 6 ready is `waterBand(...) === 'red'` on a `growing` plant. No extra thirst flag.

`tutorial.sell` — Step 8 completes on a paying `sellAll` (`marketOpen` and `marketGain() > 0`). No-op does not complete.

`tutorial.dismiss` — Step 9 dismiss is a click on the tutorial card. Then off for this session. No timer, no click-anywhere, no auto-dismiss.

`tutorial.no-force` — Tutorial does not change crops, buildings, skills, or economy. Does not block HUD. Does not force camera. No step counter.
