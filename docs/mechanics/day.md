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

On seam, before any field tick of the new day:

1. `money += DAY_STIPEND`.
2. `money -= tax()` — [[mechanics/expansion]]. May go negative.
3. Pump bill: `bill = pumpLiters × PUMP_COST_PER_L × costMul(ended weather)`, `money -= bill`, `recap.water = bill`, `pumpLiters = 0`. Ended weather is `weather(clock.day - 1)` after increment. Money may go negative. Recap always shows Water line. Mid-day money unchanged. — [[mechanics/weather]]
4. Burrow mint: `+1` per owned chunk on an eligible cell, or skip if none — [[mechanics/burrow]] `burrow.day`.
5. Tree seam — [[mechanics/trees]]. Unchanged order: stipend, tax, pump bill, burrow mint, tree seam.
6. Append `Recap` to `World.recaps` (ended day as key; one per ended day).
7. Push that day onto `World.recapUnseen`.
8. `grantPoints(POINTS_PER_DAY)`.
9. `clock.banner = 4`.
10. `seam` stays `{ kind: 'play' }`.
11. Tally reset, `contracts.takenToday`, ping.

`World.tick` does not return early on recap. Live `Seam` is `{ kind: 'play' }`. Dump `Seam` is always `{ kind: 'play' }`.

`Recap`: ended `day`, `money` after tax and pump bill, `stipend`, `died`, `harvests`, `research` finished that day, `tax`, `water` (pump bill), `contracts: HistoryEntry[]`. `water` required. Recap shows contract outcomes and that a new board is up — [[mechanics/contracts]].

`World.recapAt(day): Recap` — total; missing day throws. `World.seeRecap(day)` removes `day` from `recapUnseen`; no-op if absent. Not a `Cmd`. Ping.

`Act.dismissRecap` / `dismissRecapBody`: no-op. Do not change the log letter.

The recap popup is App `recapDay`, opened from a Command Center recap notice. Close is `seeRecap`, not a grant. [[ui/notices]] [[ui/docks]] [[mechanics/family]]

Solo App: on `clock.day` increment, `writeSlot`. The open panel stays open and there is no pause — the seam does not stop the farm, and it does not take a dock out of the player's hands either. Recap popup uses the same overlay pause as Family / Market / Almanac. [[ui/hud]] [[ui/settings]]

Hydrate a file whose `seam.kind === 'recap'`: append that recap (`contracts` `[]` if the dump omitted them), push its day to `recapUnseen` if missing, `grantPoints(POINTS_PER_DAY)`, play, `banner = 4`. Not a migrate. Total hydrate. [[architecture/save]]

`banner = 4` s — preference. New farm already `banner = 4`. Seam sets it.

## End day

Cheat `Act.cheat` `{ k: 'day' }`. Sets `clock.t = DAY_SECONDS`. Does not tick the remaining day. Next `World.tick` seams through `Clock.advance` — stipend, tax, pump bill, burrow mint, tree seam, recap append, grant, banner, play. Host only. — [[ui/cheat]]

## Invariants

`day.seam` — Seam at `t >= DAY_SECONDS` runs stipend, tax, pump bill, burrow mint, tree seam, then appends `Recap`, pushes `recapUnseen`, `grantPoints(POINTS_PER_DAY)`, `banner = 4`, `seam` stays play, then tally reset — all before any field tick of the new day. `World.tick` does not return early.

`day.phases` — Phases: sunrise, day, sunset, twilight by share of `DAY_SECONDS`. `'night'` is not a `DayPhase`.

`day.recap` — Recap persists on `World.recaps` (one per ended day). Grant is the seam, not Close. Popup opens from a Command Center recap notice (App `recapDay`, not `World.seam`). Close / Esc / backdrop is `seeRecap(day)`. `Act.dismissRecap` is a no-op.

`day.end-day` — End day sets `clock.t = DAY_SECONDS`. No remaining-field sim. Next tick seams.
