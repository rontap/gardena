# Weather

Day kind. Table from seed. Not in Save. Owner: `sim/weather.ts`. Stream: `sim/rng.ts`. Numbers: `defs/weather.ts`.

`WeatherKind = 'clear' | 'rain' | 'dry' | 'flood' | 'drought'`

## Table

`forecastWeather(seed, throughDay, pins?): WeatherKind[]` — pure walk days 1…N. Length N. `World.weather(day)` is slot `day - 1`. Current = `weather(clock.day)`. Tomorrow = `weather(clock.day + 1)`.

World at init `throughDay` `WEATHER_THROUGH_DAY` (100 — tomorrow of day 99).

Spatial stream `weather`. `at(day, k)` only. Illegal: `next()`. Illegal: `clock.t` or `money` as entropy.

Start: prev conceptually clear, `specialP` = `SPECIAL_START`.

Walk day D given prev:

- prev clear. `u0 = at(D,0)`. If `u0 < specialP`: rain if `at(D,1) < 0.5` else dry. `continueP` := `CONTINUE_START`. Else clear, `specialP += SPECIAL_STEP`.
- prev rain or dry. Severe if `at(D,0) < SEVERE_P` → flood if rain else drought. Else continue if `at(D,1) < continueP` → same kind, `continueP -= CONTINUE_STEP`. Else clear, `specialP = SPECIAL_AFTER_CLEAR`.
- prev flood or drought. D is clear. `specialP = SPECIAL_START`.

`p <= 0` never fires. Same `u < p` test for special and continue.

Days 1–3 are clear (`SPECIAL_START` then `+ SPECIAL_STEP` twice; `p <= 0` never fires). After a clear end of streak: `specialP = SPECIAL_AFTER_CLEAR`. After severe: next clear, `specialP = SPECIAL_START`.

Pins: `Map<day, WeatherKind>`. Cheat pins tomorrow, rebuilds the table. Not Save. Not `Cmd`. Host only.

## Numbers

Identifiers in `defs/weather.ts`. Do not copy digits.

| id | class |
|---|---|
| `RAIN_SOAK_DAY` | preference |
| `FLOOD_SOAK_DAY` | preference |
| `DRY_EVAP_DAY` | preference |
| `DROUGHT_EVAP_DAY` | preference |
| `WEATHER_FRUIT_SALE` | preference |
| `WEATHER_WEED_MUL` | preference |
| `RAIN_TANK_RAIN` | preference |
| `RAIN_TANK_FLOOD` | preference |
| `WELL_DROUGHT` | preference |
| `PUMP_COST_DRY` | preference |
| `PUMP_COST_DROUGHT` | preference |
| `SPECIAL_START` | preference |
| `SPECIAL_STEP` | preference |
| `SPECIAL_AFTER_CLEAR` | preference |
| `CONTINUE_START` | preference |
| `CONTINUE_STEP` | preference |
| `SEVERE_P` | preference |
| `PUMP_DAY_COST` | preference |
| `PUMP_COST_PER_L` | derived: `PUMP_DAY_COST / (SOURCE.pump.rate × DAY_SECONDS)` |
| soak per `BIG_TICK` | derived: `*_DAY / (DAY_SECONDS / BIG_TICK)` |

## Effects

| | clear | rain | dry | flood | drought |
|---|---|---|---|---|---|
| tilled water / day | 0 | +`RAIN_SOAK_DAY` | −`DRY_EVAP_DAY` | +`FLOOD_SOAK_DAY` | −`DROUGHT_EVAP_DAY` |
| weed / grass | 1× | `WEATHER_WEED_MUL` | 0 | `WEATHER_WEED_MUL` | 0 |
| rain-tank rate | 1× | `RAIN_TANK_RAIN` | 0 | `RAIN_TANK_FLOOD` | 0 |
| well rate | 1× | 1× | 1× | 1× | `WELL_DROUGHT` |
| pump rate | 1× | 1× | 1× | 1× | 1× |
| pump $/L | base | base | ×`PUMP_COST_DRY` | base | ×`PUMP_COST_DROUGHT` |
| fruit sale | 1× | 1× | 1× | ×`WEATHER_FRUIT_SALE` | ×`WEATHER_FRUIT_SALE` |
| shop seeds+utility | 1× | 1× | 1× | 1× | ×2 |
| market | hours | hours | hours | no sunrise unless `open-24` | no midday unless `open-24` |

Soak/evaporate on `BIG_TICK` only, every `isTilled` cell. Index `tilled` in `track()`. `tickBig` walks it. Not `forEachCell`. Not every `dt`. Clamp `0..SOIL_WATER_MAX` — [[mechanics/soil]]. Clear: no write.

Weed: `weed.at < ramped(...) * mul`. `mul` 0 → skip. Grass world-roll threshold same `mul`. — [[mechanics/weeds]]

`Reservoir.rate` multiplies `SOURCE[kind].rate` by that kind's weather mul. Gather uses `rate`. — [[mechanics/water]]

Pump: `World.pumpLiters +=` pump-kind `take()` litres during the day. At seam, before recap: `bill = pumpLiters × PUMP_COST_PER_L × costMul(ended weather)`, `money -= bill`, `recap.water = bill`, `pumpLiters = 0`. Ended weather is `weather(clock.day - 1)` after increment. `costMul`: dry `PUMP_COST_DRY`, drought `PUMP_COST_DROUGHT`, else 1. Money may go negative. Recap always shows Water line. Mid-day money unchanged. — [[mechanics/day]]

`skuPrice`: drought, `tab === 'seeds' | 'utility'`, after haggling min $1, then ×2. Automation / building / hangar-buys untouched. — [[mechanics/family]]

`marketOpen`: weather block `(flood ∧ sunrise) ∨ (drought ∧ day)` unless `open-24`; then existing phase hours. `open-late` does not reopen. Consign always. Closed copy: flood “Stall closed this morning.” drought “Stall closed at midday.” Hours copy unchanged otherwise. — [[mechanics/market]]

`marketGain`: flood or drought, fruit stall goods only (annual including sugar-cane, tree fruit) × `WEATHER_FRUIT_SALE` after skills before sat. Not sugar / jam / spirit / wine / oil / flour / extract.

## Forecast

Husband `forecast` max 1. Effect `{ kind: 'forecast' }`. HUD shows tomorrow iff owned. Recap / almanac / day sensor unchanged. Day sensor still `clock.phase()` only — [[mechanics/sensors]].

Skill blurb: Tomorrow's weather appears next to today on the top bar, so you can plan irrigation, the stall, and pump spend before morning.

## HUD

After the day block, divider, current glyph. Forecast → second glyph tomorrow. No names in the row.

Tomorrow glyph title: Tomorrow · {name}

Callouts:

| kind | title | body |
|---|---|---|
| clear | Clear | Fair weather. Crops, weeds, and water behave as usual. |
| rain | Rain | A little extra water on every tilled plot. Weeds and grass come faster. Rain tanks fill six times faster. Shut off irrigation or picky plants will drown. |
| dry | Dry | Plots lose a little water to the air. Weeds and grass stay down. Rain tanks sit empty. Pump water costs more at sundown. |
| flood | Flood | Heavy water on every tilled plot — plants may drown. Rain tanks surge. The stall is closed this morning unless you keep it open around the clock. Fruit sells for more. |
| drought | Drought | Plots dry out. Wells yield half. Pump water is costly. Seeds and Tools cost double. The stall is closed at midday unless you keep it open around the clock. Fruit sells for more. |

Layout is UI.

## Debug

Cheat pins tomorrow, host only, not Save. `#debug-weather` exists. Layout is UI.

## Save / net

Table derived from seed. Not in the file. Pins not in the file. `pumpLiters` not in the file (load 0). Digest includes `weather(clock.day)`. — [[architecture/save]] [[architecture/net]]

## Invariants

`weather.chain` — Walk days 1…N from conceptual prev clear and `specialP = SPECIAL_START`. `forecastWeather` is that table. `World.weather(day)` indexes it. After flood or drought the next day is clear.

`weather.spatial` — `weather.at(day, k)` only. No `next()`. No `clock.t`. No `money`.

`weather.continue-neg` — `continueP <= 0` and not severe → clear.

`weather.severe-first` — On rain/dry prev, severe (`at(D,0) < SEVERE_P`) before continue.

`weather.pump` — Seam bills `pumpLiters × PUMP_COST_PER_L × costMul(ended weather)` before recap. Mid-day money unchanged. `recap.water` is the bill. `pumpLiters` then 0. Money may go negative.

`weather.soak` — Soak/evap on `BIG_TICK` only, `tilled` index, not `forEachCell`, not every `dt`. Full day sums to `*_DAY`.

`weather.market` — `(flood ∧ sunrise) ∨ (drought ∧ day)` closed unless `open-24`. `open-late` does not reopen. Consign always.

`weather.shop` — Drought `skuPrice`: `tab === 'seeds' | 'utility'`, after haggling min $1, then ×2. Automation / building / hangar-buys untouched.

`weather.forecast` — HUD tomorrow iff husband owns `forecast`.

## Files

`sim/weather.ts` — `WeatherKind`, `forecastWeather`. Stream on `sim/rng.ts`. Numbers `defs/weather.ts`. `World.weather` / `pumpLiters` / pins on `sim/world.ts`.

## Out of scope

Rain particles, puddles, tint, day-sensor flags, almanac weather pane, recap forecast glyph, guest cheat, save of pins, per-tick pump billing, continuous soak.

Assumption: a pin replaces that day's kind and becomes `prev` for D+1; `specialP` / `continueP` follow the same transitions as a natural roll of that kind. Init `throughDay` 99; pin rebuilds that span.
