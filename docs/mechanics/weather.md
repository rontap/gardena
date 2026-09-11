# Weather

Day kind. Table from seed. Not in Save. Owner: `sim/weather.ts`. Stream: `sim/rng.ts`. Numbers: `defs/weather.ts`. Kinds: `clear` `rain` `dry` `flood` `drought`. Chrome [[ui/hud]].

## Table

`forecastWeather(seed, throughDay, pins?)` — pure walk days 1…N. Length N. `World.weather(day)` is slot `day - 1`. Current = `weather(clock.day)`. Tomorrow = `weather(clock.day + 1)`. World at init `throughDay` `WEATHER_THROUGH_DAY` (tomorrow of day 99). Spatial stream `weather`. `at(day, k)` only. Illegal: `next()`. Illegal: `clock.t` or `money` as entropy.

Start: prev conceptually clear, `specialP` = `SPECIAL_START`. Walk day D given prev:

- prev clear. `u0 = at(D,0)`. If `u0 < specialP`: rain if `at(D,1) < 0.5` else dry. `continueP` := `CONTINUE_START`. Else clear, `specialP += SPECIAL_STEP`.
- prev rain or dry. Severe if `at(D,0) < SEVERE_P` → flood if rain else drought. Else continue if `at(D,1) < continueP` → same kind, `continueP -= CONTINUE_STEP`. Else clear, `specialP = SPECIAL_AFTER_CLEAR`.
- prev flood or drought. D is clear. `specialP = SPECIAL_START`.

`p <= 0` never fires. Same `u < p` test for special and continue. Days 1–3 are clear. After a clear end of streak: `specialP = SPECIAL_AFTER_CLEAR`. After severe: next clear, `specialP = SPECIAL_START`. A pin replaces that day's kind and becomes `prev` for D+1; `specialP` / `continueP` follow the same transitions as a natural roll of that kind. Pin rebuilds that span. Pins: `Map<day, WeatherKind>`. Cheat pins tomorrow, rebuilds the table. Not Save. Not `Cmd`. Host only.

## Numbers

Identifiers in `defs/weather.ts`. Do not copy digits. Preference: `RAIN_SOAK_DAY` `FLOOD_SOAK_DAY` `DRY_EVAP_DAY` `DROUGHT_EVAP_DAY` `WEATHER_FRUIT_SALE` `WEATHER_WEED_MUL` `RAIN_TANK_RAIN` `RAIN_TANK_FLOOD` `WELL_DROUGHT` `PUMP_COST_DRY` `PUMP_COST_DROUGHT` `SPECIAL_START` `SPECIAL_STEP` `SPECIAL_AFTER_CLEAR` `CONTINUE_START` `CONTINUE_STEP` `SEVERE_P` `PUMP_DAY_COST`. Derived: `PUMP_COST_PER_L` = `PUMP_DAY_COST / (SOURCE.pump.rate × DAY_SECONDS)`; soak per `BIG_TICK` = `*_DAY / (DAY_SECONDS / BIG_TICK)`.

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
| `seeds` + `utility` tab | 1× | 1× | 1× | 1× | ×2 |
| market | hours | hours | hours | no sunrise unless `open-24` | no midday unless `open-24` |

Soak/evaporate on `BIG_TICK` only, every `isTilled` cell. Index `tilled` in `track()`. `tickBig` walks it. Not `forEachCell`. Not every `dt`. Clamp `0..SOIL_WATER_MAX` — [[mechanics/soil]]. Clear: no write. Weed: `weed.at < ramped(...) * mul`. `mul` 0 → skip. Grass world-roll threshold same `mul`. — [[mechanics/weeds]]. `Reservoir.rate` multiplies `SOURCE[kind].rate` by that kind's weather mul. Gather uses `rate`. — [[mechanics/water]].

Pump: `World.pumpLiters +=` pump-kind `take()` litres during the day. At seam, before recap: `bill = pumpLiters × PUMP_COST_PER_L × costMul(ended weather)`, `money -= bill`, `recap.water = bill`, `pumpLiters = 0`. Ended weather is `weather(clock.day - 1)` after increment. `costMul`: dry `PUMP_COST_DRY`, drought `PUMP_COST_DROUGHT`, else 1. Money may go negative. Recap always shows Water line. Mid-day money unchanged. — [[mechanics/day]]

`skuPrice`: drought, `tab === 'seeds' | 'utility'`, after haggling min $1, then ×2. Automation / building / hangar-buys untouched. — [[mechanics/family]]

`marketOpen`: weather block `(flood ∧ sunrise) ∨ (drought ∧ day)` unless `open-24`; then existing phase hours. `open-late` does not reopen. Consign always. Closed copy: flood **Stall closed this morning.** drought **Stall closed at midday.** Hours copy unchanged otherwise. — [[mechanics/market]]

`marketGain`: flood or drought, fruit stall goods only (annual including sugar-cane and chilli, tree fruit) × `WEATHER_FRUIT_SALE` after skills before sat. Not sugar / jam / spirit / wine / oil / flour / extract / bread.

## Forecast

Husband `forecast` max 1. Effect `{ kind: 'forecast' }`. HUD shows tomorrow iff owned. Recap / almanac / day sensor unchanged. Day sensor still `clock.phase()` only — [[mechanics/sensors]]. Skill description lives in `SKILLS`.

## Debug / save

Cheat pins tomorrow, host only, not Save. `#debug-weather` exists. Layout is UI. Table derived from seed. Not in the file. Pins not in the file. `pumpLiters` not in the file (load 0). Digest includes `weather(clock.day)`. — [[architecture/save]] [[architecture/net]]

## Invariants

`weather.chain` — Walk days 1…N from conceptual prev clear and `specialP = SPECIAL_START`; `forecastWeather` is that table; `World.weather(day)` indexes it; after flood or drought the next day is clear.

`weather.spatial` — `weather.at(day, k)` only; no `next()`; no `clock.t`; no `money`.

`weather.continue-neg` — `continueP <= 0` and not severe → clear.

`weather.severe-first` — On rain/dry prev, severe (`at(D,0) < SEVERE_P`) before continue.

`weather.pump` — Seam bills `pumpLiters × PUMP_COST_PER_L × costMul(ended weather)` before recap; mid-day money unchanged; `recap.water` is the bill; `pumpLiters` then 0; money may go negative.

`weather.soak` — Soak/evap on `BIG_TICK` only, `tilled` index, not `forEachCell`, not every `dt`; full day sums to `*_DAY`.

`weather.market` — `(flood ∧ sunrise) ∨ (drought ∧ day)` closed unless `open-24`; `open-late` does not reopen; consign always.

`weather.shop` — Drought `skuPrice`: `tab === 'seeds' | 'utility'`, after haggling min $1, then ×2; automation / building / hangar-buys untouched.

`weather.forecast` — HUD tomorrow iff husband owns `forecast`.
