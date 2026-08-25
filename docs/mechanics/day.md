# Day

`DAY_SECONDS = 240` — preference. `Clock.t` is the only time store. `days(s) = s / DAY_SECONDS` — derived.

## Phases

Share of the day, then `t` range (derived from share × `DAY_SECONDS`):

| phase | share | t |
|---|---|---|
| sunrise | 0.25 preference | `[0, 60)` |
| day | 0.40 preference | `[60, 156)` |
| sunset | 0.25 preference | `[156, 216)` |
| twilight | 0.10 preference | `[216, 240)` |

`'night'` is not a `DayPhase`. `t >= DAY_SECONDS` is the seam, not a phase.

Day sensor reads `clock.phase()` — [[mechanics/sensors]].

At `t = 0` sunrise; `t = 60` day; `t = 156` sunset; `t = 216` twilight.

## Seam / recap

On seam, before any field tick:

1. `money += DAY_STIPEND` (10 — preference).
2. `money -= tax()` — [[mechanics/expansion]]. May go negative.
3. `seam = recap`. Play frozen until `dismissRecap()` — [[mechanics/family]].

`Recap`: ended `day`, `money` after tax, `stipend`, `died`, `harvests`, `research` finished that day, `tax`, `contracts: HistoryEntry[]`. No `recipient` on `Recap`. Recap shows contract outcomes and that a new board is up — [[mechanics/contracts]].

Then `tally` resets. `dismissRecap()` is the only recap exit: +1 skill point to each member, then play, `banner = 2` s — preference.
