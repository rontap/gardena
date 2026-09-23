# Tick

Code: `tick.ts`, `clock.ts`, the frame loop in `App.tsx`; see [[code-map]].

## Job

`tickWorld(world, dt)` advances the simulation by `dt` seconds of game time. One call moves the gardeners, runs their jobs, updates plants, water, machines and vehicles, and, on the call that crosses the end of a day, applies the day's income and costs and writes the end-of-day summary. It is the only code that changes `World` outside a player command.

## Used by

Every feature with time-based state: [[features/plants]], [[features/trees]], [[features/weeds]], [[features/water]], [[features/machines]], [[features/vehicles]], [[features/sensors]], [[features/market]], [[features/contracts]], [[features/research]], [[features/weather-day]], [[features/necronomicon]], [[features/tutorial]].

## Contract

### Step size and frame loop

`World.tick(dt)` caps `dt` at `DT_MAX` and calls `tickWorld`. `World.now` counts calls; every command stores it as `t`.

Solo: the frame loop in `App.tsx` adds real elapsed time, multiplied by `cheatSpeed` (1 or 3), to an accumulator, and calls `world.tick(DT_MAX)` at most twice per animation frame. While the game is paused or the AI hold is on, the accumulator is still reduced but `tick` is not called.

Host: the frame loop calls the host's `pump()`, which calls `world.tick(DT_MAX)` and sends the step to guests. Guest: `applyBundle` applies the commands the host sent for a step, then calls `world.tick(DT_MAX)`. See [[systems/net]].

### Day and phases

A day is `DAY_SECONDS` of game time. `Clock` holds `day` and `t`, the seconds into the day. `phase()` returns Sunrise below 25% of the day, Midday below 65%, Sunset below 90%, and Twilight after.

### Step order

1. Speech bubble timer.
2. Research job timer (times 3 with the research cheat). When it reaches zero, the research is added to `done` and to today's tally.
3. Button timers.
4. For each seat with presence `in` that is not driving: if walking input is held, the gardener moves and the job list is cleared; otherwise `tickQueue` runs the job list ([[systems/commands]]).
5. `tickVehicles` — vehicle movement.
6. `tickField` — plants, trees, weeds and turf: water and fertilizer use, happiness, growth, ripening, freshness, death, rot.
7. `gatherWater` — water sources add to their tanks.
8. `evalSensors` — sensor outputs and wire signals.
9. `tickDispatch` — vehicles on routes choose their next stop.
10. `tickMachines`.
11. `tickWater` — sprinklers pour.
12. `tickFreshness` — freshness of fruit in present seats' hands and inventories, on the ground, in chests, in freezers (at `FREEZER_ROT_MUL`), in Quads and in Harvester trailers. Fruit at zero freshness becomes Rotten produce.
13. `tickBig`, below.
14. `tickContracts` — contracts past their deadline are settled.
15. Each Market good's price drop (`sat`) recovers.
16. `tutorialTick`.

### Big tick

`tickBig` adds `dt` to `bigAcc`. Each time `bigAcc` reaches `BIG_TICK` seconds it runs once: machines take items from the chest on their input side, weather water is added to or removed from every plot and tree, weeds sprout, and wild grass appears. `World.bigTicks` counts big ticks since the game was created; the weed and grass chance ramp reads it.

### End of day

When `Clock.advance` crosses `DAY_SECONDS`, the day number increases, `t` becomes 0, and that call of `tickWorld` runs only the steps below and returns. The step-order list above does not run on that call.

1. Every seat's work timer and bucket filling are cleared.
2. `tickContracts`.
3. Grandma's support for the ended day (`stipendOf`) is added to money; `tax()` is subtracted; the water bill (`pumpBill` of today's pump litres, times the ended day's weather price) is subtracted; `pumpLiters` is reset.
4. `clearOldRotten` removes Rotten produce that has been on the ground for `ROTTEN_GROUND_DAYS`; `clearRipeWeeds` replaces weeds full-grown for `WEED_GONE_DAYS` with grass.
5. `mintSeam` adds burrows; `tickTreesSeam` advances each tree's in-season and out-of-season count; `advanceGrandma` advances the grandma story.
6. A `Recap` for the ended day is added to `recaps` and its day to `recapUnseen`; `POINTS_PER_DAY` skill points are granted; `clock.banner` is set.
7. `tally` is reset. If contracts are unlocked and no contract was accepted that day, reputation is reduced by `REP_IDLE`. `takenToday` is cleared, `repDay` is set to the current reputation, and `applyDayDemand` sets the Market demand for the new day.

The end-of-day summary does not pause the game. It is listed in the Command Center until the player opens it.

## Entry points

- `World.tick(dt)`, `tickWorld(world, dt)`.
- In `tick.ts`: `tickBig`, `tickFreshness`, `tickJob`, `tickSpeech`, `tickButtons`, `clearOldRotten`.
- Feature tick functions called from `tickWorld`: `tickField`, `tickTreesSeam`, `clearRipeWeeds`, `tickMachines`, `pullMachineStores`, `tickVehicles`, `tickDispatch`, `gatherWater`, `tickWater`, `evalSensors`, `tickContracts`, `applyDayDemand`, `mintSeam`, `advanceGrandma`, `tutorialTick`.
- `Clock.advance(dt)` returns `'seam'` when the day ends.
- `endDay()` (cheat) sets `clock.t` to `DAY_SECONDS`; the next call ends the day.

## Data

Saved: `clock` (`day`, `t`), `bigTicks`, `tally`. Not saved and zeroed by `rebase()`: `bigAcc`, `pumpLiters`.

## Invariants

| id | rule | test |
|---|---|---|
| `day.seam` | end of day: support, tax, water bill, burrows, trees, then the summary, unread mark and skill point, then the tally reset | `day.test.ts` |
| `day.stipend` | grandma's support by ended day follows the `STIPEND` bands, then 0 | `day.test.ts` |
| `day.end-day` | the End day cheat sets `t` to `DAY_SECONDS`; the next call ends the day | `day.test.ts` |
| `world.cheatSpeed` | `cheatSpeed` is 1 or 3 and multiplies real time in the frame loop, not `dt` | `day.test.ts` |
| — | no plant changes on the call that ends the day | `world.test.ts`, `day.test.ts` |

## When you change this

- New time-based behaviour: insert its call into the step order after every step whose output it reads (after `evalSensors` if it reads signals, after `gatherWater` if it reads tanks).
- New end-of-day effect: add it to the end-of-day branch of `tickWorld`; decide whether it is shown in the summary (`Recap`); add any new field to [[systems/save]].
- Code that reads wall-clock time or `Math.random` makes host and guests diverge ([[systems/net]]). Use `dt` and [[systems/rng]].
