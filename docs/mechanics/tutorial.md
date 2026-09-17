# Tutorial

The first farm's teaching. No new gameplay. Every line is a Command Center row — [[ui/notices]]. Numbers `src/game/defs/tutorial.ts`. Copy `messages/en/tutorial.json`, prefix `tutorial_`.

Two parts. The **chain** is nine steps in order, one row at a time, ending when the player dismisses step 9. The **event-bound lines** are three single rows after the chain, each fired once for the life of the farm when its condition holds.

## On / off

Decided when play starts, then saved with the farm.

| start | tutorial |
|---|---|
| New Game, `!slotExists()` | `chain`, step 1 |
| New Game, `slotExists()` | `off` |
| Load Save, Upload Save | what the save holds |
| fragment `start_now` / `unlockall`, query `start=now` / `start=unlock` | `off` |

`slotExists()` is `SLOT_KEY` present — [[architecture/save]]. `#start_now` and `#unlockall` build a `new World` and never read the slot; App maps both fragments and both query values to `startTutorial('start_now')`. A `World` is `off` until App assigns, so only `playNew` can start a chain.

Off is permanent for that farm. Nothing turns a tutorial back on.

## State

`World.tutorial`, saved. Three shapes: `{ kind: 'off' }`, `{ kind: 'chain'; step; marks }`, `{ kind: 'events'; fired }`.

`tutorialTick(world)` runs at the end of `tickWorld` — [[architecture/tick]]. It advances the step, and fires event-bound lines. It is the only writer.

`World.delivered` counts fruit consigned at the Produce Warehouse over the farm's whole life, saved. `tally.harvests` is the day's count and is not this.

### Marks

Steps 4, 5 and 8 wait on an act that a later snapshot cannot show. `markTutorial` records them on the chain as the act completes, inside the sim, so a guest replays them the same way.

| mark | set by |
|---|---|
| `poured` | `water` finishing on a `growing` or `ripe` plot |
| `filled` | a container reaching `capacityLiters` at a pump, tap or well |
| `placed` | `drop` putting a held container on the ground |
| `fertilized` | `fertilize` finishing on a plot |

## Steps

One step at a time. Each check recomputes every step's done, takes the least undone, and never moves back — losing the plants that finished a step does not walk the chain back.

| n | done |
|---|---|
| 1 | `world.tilled.size >= TUTORIAL_PLOTS` |
| 2 | seeds in `seats[0]` hand, or any plant standing |
| 3 | `TUTORIAL_PLOTS` plants standing |
| 4 | mark `poured` |
| 5 | marks `filled` and `placed` |
| 6 | `world.delivered > 0` |
| 7 | `TUTORIAL_PLANTS` plants standing |
| 8 | mark `fertilized` |
| 9 | right-click the row |

Standing is a `growing` or `ripe` cell. Any crop counts: the copy names carrots and potatoes as the suggestion, the condition takes whatever the player chose. Dead and rotten cells are not standing.

`world.tilled` is the tilled-cell index, so step 1 counts digging. Grass sprouts as a `cover` on `untilled` and never raises it.

Step 6 is the only step with a wait: it shows nothing until a cell is `ripe`, because the player can do nothing about it before that. `tutorialStep(world)` returns nothing in that gap and the row leaves the column.

Starter farm: shovel in hand, bucket dropped at `DOOR`, `STARTER_SEEDS` in the Seed silo — seven carrot, two tomato, two potato. Step 7 wants six plants, so the player buys seeds to reach it. [[mechanics/inventory]]

## Event-bound lines

After step 9 is dismissed. Each is one row, fired once for the farm's life; `fired` keeps the ids, so a dismissed line never returns and a reload does not repeat it.

| line | fires when |
|---|---|
| `research` | `clock.day >= TUTORIAL_RESEARCH_DAY`, `money > TUTORIAL_RESEARCH_MONEY`, no job running and `done` empty |
| `irrigation` | `clock.day >= TUTORIAL_IRRIGATION_DAY` and `unlock-auto-irrigation` not researched |
| `contracts` | `delivered >= TUTORIAL_DELIVERED` and `unlock-contracts` not researched |

All six numbers are preferences in `src/game/defs/tutorial.ts`.

A chain still running fires nothing: `tutorialTick` only reaches the event-bound lines in the `events` shape.

## Invariants

`tutorial.on` — The chain starts only at New Game with `!slotExists()`; a stored farm, `start_now`, `unlockall`, Load and Upload are all `off`; a fresh `World` is `off` until App assigns; nothing turns a tutorial back on.

`tutorial.save` — `World.tutorial` and `World.delivered` are `Save` fields; a load resumes the step, the marks, the fired lines and the delivered count the farm had.

`tutorial.steps` — The step is the least step not done, recomputed each check, and never decreases; steps 1, 3 and 7 count tilled cells and standing plants of any crop; steps 4, 5 and 8 complete on marks, step 6 on `delivered > 0`, step 9 on the right-click.

`tutorial.mark` — `poured` `filled` `placed` `fertilized` are set inside the sim as the act completes, never from a snapshot, and never twice.

`tutorial.ripe` — Step 6 shows nothing until a cell is `ripe`; every other reached step shows at once.

`tutorial.dismiss` — `seeTutorial` closes the chain at step 9 and does nothing on steps 1 to 8; closing hands over to the event-bound lines with `fired` empty; it is a direct `World` call, not a `Cmd`.

`tutorial.events` — The three event-bound lines fire only in the `events` shape, once each for the farm's life, recorded in `fired`; research skips when a job runs or anything is researched; irrigation skips on `unlock-auto-irrigation`; contracts skips on `unlock-contracts`.

`tutorial.no-force` — The tutorial does not change crops, buildings, skills, or economy; it does not block the HUD, force the camera, or show a step counter.
