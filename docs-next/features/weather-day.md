# Weather and day

Code: `clock.ts` (day, phases), `weather.ts` and `defs/weather.ts` (weather table and effects), the end-of-day branch of `tickWorld` in `tick.ts`, `stipendOf` and `STIPEND` in `world.ts`, `settleLoan` in `loan.ts` and `defs/loan.ts` (loan), `ui/recap.tsx` (end-of-day summary); see [[code-map]].
Unlocked: from the start. Tomorrow's weather with `unlock-weather-station` (**Weather Forecast**, [[features/research]]).

## Purpose

The day gives the game its rhythm: money comes and goes at the end of each day, a skill point arrives, and the end-of-day summary shows what the day earned and cost. The weather changes each day and asks the player to react: rain and floods add water, dry days and droughts take it away and make water and seeds dearer, and the extreme days make fruit sell for more. Because the whole weather table follows from the game's seed, the forecast is exact, and planning around it pays.

## Rules

### Day and phases

A day is `DAY_SECONDS` of game time (`Clock.t`). It has four phases by share of the day:

```
t / DAY_SECONDS   0        0.25                  0.65          0.9       1
                  | Sunrise |       Midday         |   Sunset    | Twilight |
```

The phase is read by the Day sensor ([[items/buildings/sensors-environment]]) and by the Necronomicon ritual, which happens at Twilight ([[features/necronomicon]]). Nothing else changes by phase: the Market is open all day.

### End of day

When `t` reaches `DAY_SECONDS`, the day number goes up and the end of day runs before anything else happens on the new day ([[systems/tick]] lists every step). What the player sees from it:

- money: + grandma's support, − land tax ([[features/expansion]]), − the water bill ([[features/water]]), − the loan payback, + a new loan (below); money may go below zero;
- rotten produce left on the ground for `ROTTEN_GROUND_DAYS` is cleared, and weeds full-grown for `WEED_GONE_DAYS` turn to grass ([[features/weeds]]);
- new burrows, trees move through their seasons, grandma's story moves on ([[features/burrow]], [[features/trees]], [[features/necronomicon]]);
- contracts past their deadline are settled, the contract board changes, and reputation drops by `REP_IDLE` if no contract was accepted that day ([[features/contracts]]); Market demand is set for the new day ([[features/market]]);
- `POINTS_PER_DAY` skill points ([[features/family]]);
- the end-of-day summary for the ended day.

The farm does not pause at the end of the day, and open panels stay open. Work in progress is cancelled: every gardener's work timer and bucket filling are cleared.

### Grandma's support

`stipendOf(endedDay)` pays money for the first days, from the `STIPEND` bands: a fixed amount through day 3, a smaller one through day 6, a smaller one through day 10, then nothing.

### Loan

The loan gives a farm with little money and an empty Seed silo seeds to plant and money to start with. `settleLoan` runs at the end of the day, after the support, tax, water bill, burrows, trees and grandma's story, before the summary is written:

1. Payback: while `World.loanDays` is above 0, `LOAN_PAYBACK` is taken from money and `loanDays` goes down by 1.
2. Loan: if money is then below `LOAN_BELOW` and the Seed silo (`World.silo`) holds no seeds, `LOAN_PACKS` packs of `LOAN_PACK` go into the Seed silo at the quality a bought pack has (`boughtSeedQuality`), `LOAN_CASH` is added to money, and `loanDays` goes up by `LOAN_DAYS`.

Only the Seed silo counts: seeds in a hand, an inventory or a Seeding silo, and plants in the ground, do not stop a loan. A loan while one is being paid back adds `LOAN_DAYS` more days; the payback per day stays `LOAN_PAYBACK`. Payback can take money below zero.

### End-of-day summary

Each ended day adds a `Recap` to `World.recaps` and its day to `recapUnseen`. The Command Center shows **Day {n} Finished** for each unread summary; clicking it opens the summary, which pauses a solo game while open ([[shell]]). Closing it (**Close**, Escape or the backdrop) marks it read (`seeRecap`); the skill point was already granted at the end of the day.

The summary shows: **Day {n}**, **Harvested** and **Lost** plant counts, research finished that day, each contract settled (**Completed**, **Missed**, **Cancelled**) and **A new board is up.**, then the money lines **Support from grandma** (only when not 0), **Tax**, **Water**, **Loan payback** (only on a payback day), **Loan** with **{packs} packs of {seeds} went into the {silo}.** under it (only on a loan day), **Days of payback left** (only while `loanDays` is above 0), and **Balance**. `Recap.loan`, `Recap.payback` and `Recap.loanDays` hold those numbers for the ended day.

A large **Day {n}** banner shows over the map for `clock.banner` seconds after a new day starts.

### Weather table

Each day has one weather: Clear, Rain, Dry, Flood or Drought. `forecastWeather(seed, WEATHER_THROUGH_DAY)` computes the whole table when the game starts, from the `weather` stream of the seed ([[systems/rng]]); `World.weather(day)` reads it. It is not saved: the seed rebuilds it.

The table is walked day by day from a Clear day before day 1:

```
after Clear:           Rain or Dry (even odds) with chance specialP, else Clear
                       specialP starts at SPECIAL_START (below 0) and rises by SPECIAL_STEP each Clear day
after Rain or Dry:     Flood (after Rain) or Drought (after Dry) with chance SEVERE_P
                       else the same weather again with chance continueP (starts at CONTINUE_START,
                         falls by CONTINUE_STEP each repeat)
                       else Clear, and specialP becomes SPECIAL_AFTER_CLEAR
after Flood or Drought: Clear, and specialP becomes SPECIAL_START
```

A chance of 0 or below never happens, so the first days are Clear, a Rain or Dry spell ends by itself, and a Flood or Drought lasts one day.

### Weather effects

| | Clear | Rain | Dry | Flood | Drought |
|---|---|---|---|---|---|
| water on every tilled plot and tree, per day | — | + `RAIN_SOAK_DAY` | − `DRY_EVAP_DAY` | + `FLOOD_SOAK_DAY` | − `DROUGHT_EVAP_DAY` |
| weed and grass chance | × 1 | × `WEATHER_WEED_MUL` | none | × `WEATHER_WEED_MUL` | none |
| Well refill | × 1 | × 1 | × 1 | × 1 | × `WELL_DROUGHT` |
| Pump water price | × 1 | × 1 | × `PUMP_COST_DRY` | × 1 | × `PUMP_COST_DROUGHT` |
| fruit sale price | — | — | — | + `WEATHER_FRUIT_IMPACT` | + `WEATHER_FRUIT_IMPACT` |
| Seed silo and Tools prices (`seeds`, `utility` tabs) | × 1 | × 1 | × 1 | × 1 | × 2 |

Water is added or removed each big tick (`BIG_TICK`), in equal parts over the day (`soakDelta`), on every tilled plot and once on each tree, within the soil's limits ([[features/plants]], [[features/trees]]). The water bill uses the weather of the day that ended. The fruit price change applies to raw fruit only, not to goods made from it ([[features/market]]).

### Forecast

After `unlock-weather-station`, `forecastCount` is 1 and the top rail shows tomorrow's weather next to today's.

## Screen

- Top rail: **Day {n} · {phase}**, a bar for the time of day, today's weather glyph, and tomorrow's after the forecast research. Hovering a glyph shows its name (**Tomorrow · {name}** for tomorrow) and its description, for example Rain: **A little extra water on every tilled plot. Weeds and grass come faster than on Clear. Close valve or plants that want a tight water range will drown.**
- Command Center: **Day {n} Finished**.
- The end-of-day summary, above.

## Guest

A guest sees the same days, weather and end-of-day summaries.

## Save and sync

Saved: `clock` (`day`, `t`), `recaps` and `recapUnseen`, the day's `tally`, `loanDays`. Not saved: the weather table (rebuilt from the seed) and `pumpLiters` (0 on load). The digest carries today's weather and `loanDays`.

## Art

Weather glyphs `ui/ui-weather-{clear,rain,dry,flood,drought}.svg`, `0 0 16 16`; phase glyphs `ui-phase-*`; summary header `ui-recap-night.svg` ([[art/svg]]).

## Invariants

| id | rule | test |
|---|---|---|
| `weather.chain` | the table is walked from a Clear day before day 1; a Flood or Drought is followed by Clear | `weather.test.ts` |
| `weather.spatial` | the table reads the `weather` stream by day only, never the clock or money | `weather.test.ts` |
| `weather.continue-neg` | a continue chance of 0 or below ends the spell | `weather.test.ts` |
| `weather.severe-first` | after Rain or Dry, the Flood or Drought roll comes before the continue roll | `weather.test.ts` |
| `weather.pump` | the water bill is Pump litres × `PUMP_COST_PER_L` × the ended day's price, at the end of the day, rounded to cents | `weather.test.ts` |
| `weather.soak` | weather water is added on big ticks only, to tilled plots and each tree once; a day sums to the `*_DAY` amount | `weather.test.ts` |
| `weather.market` | the Market is open in every weather and every phase | `weather.test.ts` |
| `weather.shop` | on Drought, `seeds` and `utility` prices double; other tabs do not change | `weather.test.ts` |
| `weather.forecast` | tomorrow's weather shows only after `unlock-weather-station` | `weather.test.ts` |
| `day.stipend`, `day.recap` | support follows the `STIPEND` bands; a summary is kept per ended day and closing it grants nothing | `day.test.ts` |
| `day.loan` | after the day's money changes and payback, money below `LOAN_BELOW` with an empty Seed silo gives `LOAN_PACKS` packs of `LOAN_PACK`, `LOAN_CASH` and `LOAN_DAYS` more payback days of `LOAN_PAYBACK` each | `day.test.ts` |

## When you change this

- A new weather kind: `WeatherKind`, the walk in `forecastWeather`, each effect function in `weather.ts` (`soakDelta`, `weedMul`, `sourceRateMul`, `pumpCostMul`), the drought price in `skuPrice`, the fruit price in the Market, a glyph, a name and a description, and the Weather sensor ([[items/buildings/sensors-environment]]).
- A new end-of-day effect: [[systems/tick]]; add a summary line if the player should see it.
- Phase shares: the Day sensor and the Necronomicon ritual read them.

## Decisions

- The weather table comes from the seed, not a running random stream, so the forecast is exact and every player in a multiplayer game sees the same weather without sending it.
- The chance of a special day starts below zero, so a new farm gets Clear days first.
