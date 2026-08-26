# Day

`Clock.t` is the only time store. `days(s) = s / DAY_SECONDS` — derived. `DAY_SECONDS` — preference.

## Phases

Share of the day (preference). `t` range is share × `DAY_SECONDS` (derived).

| phase | share |
|---|---|
| sunrise | 0.25 |
| day | 0.40 |
| sunset | 0.25 |
| twilight | 0.10 |

`'night'` is not a `DayPhase`. `t >= DAY_SECONDS` is the seam, not a phase.

Day sensor reads `clock.phase()` — [[mechanics/sensors]].

## Seam / recap

On seam, before any field tick:

1. `money += DAY_STIPEND`.
2. `money -= tax()` — [[mechanics/expansion]]. May go negative.
3. `seam = recap`. Play frozen until `dismissRecap()` — [[mechanics/family]].

`Recap`: ended `day`, `money` after tax, `stipend`, `died`, `harvests`, `research` finished that day, `tax`, `contracts: HistoryEntry[]`. Recap shows contract outcomes and that a new board is up — [[mechanics/contracts]].

Then `tally` resets. `dismissRecap()` is the only recap exit: `World.points += POINTS_PER_DAY`, then play, `banner = 2` s — preference.

## Invariants

`day.seam` — Seam at `t >= DAY_SECONDS` opens recap before any field tick for the new day.

`day.phases` — Phases: sunrise, day, sunset, twilight by share of `DAY_SECONDS`. `'night'` is not a `DayPhase`.

`day.recap` — Recap exit is only `dismissRecap()`. Grants `POINTS_PER_DAY` to `World.points`, then play, `banner = 2`.
