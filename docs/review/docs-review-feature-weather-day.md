# Docs review: Weather and the day

Notes: `docs/mechanics/weather.md`, `docs/mechanics/day.md`, `docs/art/weather.md`, `docs/art/recap-night.md`
Code: `src/game/sim/weather.ts`, `src/game/defs/weather.ts`, `src/game/sim/clock.ts`, `src/game/sim/tick.ts`, `src/game/sim/world.ts`, `src/game/sim/water.ts`, `src/game/sim/feature-save/save.parse.ts`, `src/game/ui/recap.tsx`, `src/game/ui/hud.tsx`, `src/game/defs/shelf.ts`, `src/game/defs/research.ts`, `src/assets/ui/ui-weather-*.svg`, `src/assets/ui/ui-recap-night.svg`
Tests: `src/game/sim/weather.test.ts`, `src/game/sim/day.test.ts`, `src/game/sim/water.test.ts`, `src/game/sim/world.test.ts`

Tick the one line that is true in each question. Tick **none** and write a line under it if none is.

## Disagreements

### 1. What happens at the day change, in order?
- [ ] **doc** `docs/mechanics/day.md:22-35` — stipend, tax, pump bill, burrow mint, tree seam, `advanceGrandma`, append recap, push `recapUnseen`, grant points, banner, seam stays play, tally reset and `contracts.takenToday`, ping.
- [ ] **code** `src/game/sim/tick.ts:147-189` — first every seat's current work is cancelled (`workLeft`, `workTotal`, `filling` reset) and `tickContracts` runs; then stipend, tax, pump bill; then `clearOldRotten` and `clearRipeWeeds`; then burrow mint, tree seam, `advanceGrandma`; recap append, `recapUnseen`, points, banner, play, tally reset; then, when `unlock-contracts` is done and no contract was taken that day, reputation drops by `REP_IDLE` (0.3); then `takenToday` reset, `repDay`, `applyDayDemand`, ping. The day note lists neither the work cancel, the contract tick, the two clean-ups, the idle reputation loss, nor the day demand.
- [ ] **test** `src/game/sim/day.test.ts:17` "Seam at `t >= DAY_SECONDS` runs `stipendOf`, tax, pump bill, burrow mint, tree seam…" — asserts money, recap fields, points, banner, tally, one new burrow, and that a growing plant does not grow on the seam tick.
- [ ] **none**

### 2. Is the pump bill rounded?
- [ ] **doc** `docs/mechanics/weather.md:36` and `docs/mechanics/day.md:26` — `bill = pumpLiters × PUMP_COST_PER_L × costMul(ended weather)`; no rounding.
- [ ] **code + test** `src/game/defs/weather.ts:26` — `pumpBill` rounds the bill to cents. `src/game/sim/weather.test.ts:119` "Seam bills `pumpBill(pumpLiters, costMul(ended weather))`, rounded to cents so engine float drift never reaches `money`…".
- [ ] **none**

## Doc only (no code found)

None found. `forecastWeather`, `WEATHER_THROUGH_DAY`, every constant in the Numbers list, `soakDelta`, `pumpCostMul` (the note says `costMul`), `forecastCount`, `marketOpen`, `#debug-weather` (`src/main.tsx:37`), `stipendOf`, `STIPEND`, `recapAt`, `seeRecap`, `dismissRecapBody` and `endDayBody` exist. `costMul` is named `pumpCostMul` in `src/game/sim/weather.ts:60`.

## Code only (no note mentions it)

### 3. What is the weather after day 100?
- [ ] **code** `src/game/sim/world.ts:889` — the weather table is built once for days 1 to `WEATHER_THROUGH_DAY` (100) and never extended. `World.weather(101)` returns `undefined`. From day 100 the forecast glyph reads `weather(101)`, and from day 101 the current glyph reads it too; `WEATHER_NAME[undefined]()` in `src/game/ui/hud.tsx:131` would throw. Soak, weed and grass rolls, well rate and pump cost fall to their clear-day values because each function's last branch is the clear case.
- [ ] **intended, document it**
- [ ] **not intended**

### 4. Does a job in progress survive the day change?
- [ ] **code** `src/game/sim/tick.ts:149-153` — at the day change every seat's `workLeft` and `workTotal` go to 0 and `filling` stops, so a dig, chop or bucket fill in progress at midnight has to start again.
- [ ] **intended, document it**
- [ ] **not intended**

### 5. Does the day-change tick move anything else?
- [ ] **code + test** `src/game/sim/tick.ts:189` — the tick that crosses midnight does the day-change work and returns; walking, plants, water, machines, vehicles and freshness do not advance on that tick. The clock sets `t = 0`, dropping the part of `dt` past midnight (`src/game/sim/clock.ts:36-40`). `src/game/sim/world.test.ts:98` "no plant tick across sundown" and `src/game/sim/day.test.ts:17` assert a growing plant does not change on that tick.
- [ ] **intended, document it**
- [ ] **not intended**

## Agreed

- [ ] 6. Five kinds: clear, rain, dry, flood, drought; names **Clear**, **Rain**, **Dry**, **Flood**, **Drought** — doc `docs/mechanics/weather.md:3`, code `src/game/sim/weather.ts:20`, `messages/en/names.json:20-24`, test `src/game/sim/weather.test.ts:47`.
- [ ] 7. Table walk: from a clear start with `specialP` −0.4; after clear, special fires if `at(D,0) < specialP` (rain if `at(D,1) < 0.5` else dry) and sets `continueP` 0.4, else clear and `specialP += 0.2`; after rain or dry, severe first (`at(D,0) < 0.1` → flood or drought), else continue if `at(D,1) < continueP` (then `continueP −= 0.15`), else clear with `specialP` −0.2; after flood or drought, clear with `specialP` −0.4; days 1–3 are clear; pins replace a day and the walk carries on from them — doc `docs/mechanics/weather.md:9-15`, `:56-62`, code `src/game/sim/weather.ts:22`, `src/game/defs/weather.ts:15-20`, test `src/game/sim/weather.test.ts:47`, `:66`, `:74`, `:89`.
- [ ] 8. The table covers days 1 to 100 from the seed and pins; `World.weather(day)` reads slot `day − 1`; not saved — doc `docs/mechanics/weather.md:7`, `:52`, code `src/game/sim/world.ts:875`, `:889`, `src/game/defs/weather.ts:22`, test `src/game/sim/weather.test.ts:47`.
- [ ] 9. Soak and evaporation per day: rain +0.15, flood +0.8, dry −0.2, drought −0.4 L, applied in equal parts every `BIG_TICK` to every tilled plot and once to each tree, clamped to each soil's max — doc `docs/mechanics/weather.md:25`, `:34`, `:66`, code `src/game/sim/tick.ts:108-122`, `src/game/defs/weather.ts:6-9`, `:29-32`, test `src/game/sim/weather.test.ts:154`.
- [ ] 10. Weed and grass multiplier: rain and flood ×1.5, dry and drought 0 (no sprouting), clear ×1 — doc `docs/mechanics/weather.md:26`, code `src/game/sim/weather.ts:66`, `src/game/defs/weather.ts:11`, test `src/game/sim/plants.test.ts:656`, `:772`.
- [ ] 11. Well gather ×0.5 in drought; pump gather unchanged by weather — doc `docs/mechanics/weather.md:27-28`, code `src/game/sim/weather.ts:55`, `src/game/sim/world.ts:893`, test `src/game/sim/water.test.ts:45` (sets the multiplier by hand).
- [ ] 12. Pump bill: pumped litres × `PUMP_COST_PER_L` (10.8 ÷ 144 = 0.075) × 1.5 on a dry day or ×3 on a drought day, charged at the day change for the day that ended, stored as `recap.water`, `pumpLiters` then 0, money may go negative — doc `docs/mechanics/weather.md:29`, `:36`, `:64`, `docs/mechanics/day.md:26`, code `src/game/sim/tick.ts:159-161`, `src/game/defs/weather.ts:13-14`, `:21`, `:24`, test `src/game/sim/weather.test.ts:108`, `:119`.
- [ ] 13. Flood and drought add `WEATHER_FRUIT_IMPACT` (0.4) to the shown sale percent of crop and tree fruit stall goods only — doc `docs/mechanics/weather.md:30`, `:42`, code `src/game/sim/feature-contracts/market.ts:864`, `src/game/sim/store.ts:381`, `src/game/sim/stall.ts:39`, no weather test of the sale.
- [ ] 14. Drought doubles the price of `seeds` and `utility` tab SKUs only — doc `docs/mechanics/weather.md:31`, `:38`, `:70`, code `src/game/sim/world.ts:864`, test `src/game/sim/weather.test.ts:219`.
- [ ] 15. The market is always open — doc `docs/mechanics/weather.md:32`, `:40`, `:68`, code `src/game/sim/world.ts:871`, test `src/game/sim/weather.test.ts:200`.
- [ ] 16. Forecast: the HUD shows tomorrow's glyph ("Tomorrow · {name}") when at least one Weather Forecast Station stands; more stations add nothing; `forecastCount` counts placed stations — doc `docs/mechanics/weather.md:46`, `:72`, code `src/game/sim/world.ts:844`, `src/game/ui/hud.tsx:128`, `messages/en/hud.json:65`, test `src/game/sim/weather.test.ts:230`.
- [ ] 17. `buy-weather-station`: Land shelf, shown and sold after `unlock-weather-station`, price 24, 1×2, not a machine (no `inn`, `ticks` false), demolishable; label **Weather Forecast Station** and the description the note quotes — doc `docs/mechanics/weather.md:48`, code `src/game/defs/research.ts:518`, `src/game/defs/shelf.ts:107`, `src/game/sim/building.ts:202`, `messages/en/names.json:298`, `messages/en/catalog.json:161`, test `src/game/sim/weather.test.ts:230`.
- [ ] 18. Phases by share of the 240 s day: sunrise 0.25, day 0.40, sunset 0.25, twilight 0.10; no night — doc `docs/mechanics/day.md:3-16`, `:76`, code `src/game/sim/clock.ts:3`, `:27-33`, test `src/game/sim/world.test.ts:1643`.
- [ ] 19. Stipend: 12 on ended days 1–3, 6 on 4–6, 3 on 7–10, else 0; stored as `Recap.stipend`; the recap line is hidden at 0 — doc `docs/mechanics/day.md:43-52`, `:74`, code `src/game/sim/world.ts:218-228`, `src/game/ui/recap.tsx:67`, test `src/game/sim/day.test.ts:53`.
- [ ] 20. Recap fields: ended day, money after tax and pump bill, stipend, died, harvests, research, tax, water, contracts; one per ended day on `World.recaps`; `recapAt` throws on a missing day; `seeRecap` removes the day from `recapUnseen`; `dismissRecapBody` does nothing — doc `docs/mechanics/day.md:39`, `:54-56`, `:78`, code `src/game/sim/tick.ts:167-179`, `src/game/sim/world.ts:1930-1954`, test `src/game/sim/day.test.ts:77`.
- [ ] 21. Recap popup: night strip on top, title **Day {n}**, subtitle **turned in**, rows **Harvested**, **Lost**, **Research** (— when none), contract lines and **A new board is up.** when contracts are unlocked, ledger **Support from grandma** / **Tax** / **Water**, then **Balance**, button **Close** — doc `docs/mechanics/day.md:39`, `docs/art/recap-night.md:3`, code `src/game/ui/recap.tsx:36-81`, `messages/en/hud.json:54-85`, no unit test of the popup.
- [ ] 22. Points `POINTS_PER_DAY` (1) are granted at the day change, not on Close; banner is 4 s — doc `docs/mechanics/day.md:32`, `:64`, code `src/game/sim/tick.ts:180-181`, `src/game/sim/world.ts:216`, test `src/game/sim/day.test.ts:17`.
- [ ] 23. Loading a file saved on a recap seam appends that recap, adds its day to `recapUnseen`, grants the day's points and sets the banner — doc `docs/mechanics/day.md:62`, code `src/game/sim/feature-save/save.parse.ts:196`, `:219-229`, test `src/game/sim/feature-save/save.test.ts:132`.
- [ ] 24. End day cheat sets `clock.t = DAY_SECONDS` without simulating the rest of the day; the next tick runs the day change — doc `docs/mechanics/day.md:68`, `:80`, code `src/game/sim/world.ts:1801`, `src/game/sim/apply.ts:112`, test `src/game/sim/day.test.ts:104`.
- [ ] 25. The solo app saves the slot when the day number goes up — doc `docs/mechanics/day.md:60`, code `src/App.tsx:260`, no test read.
- [ ] 26. Weather glyphs `ui-weather-{clear,rain,dry,flood,drought}.svg` at viewBox `0 0 16 16`, `crispEdges`, no width or height; recap strip `ui-recap-night.svg` at `0 0 240 64` — doc `docs/art/weather.md:3-13`, `docs/art/recap-night.md:3`, code `src/assets/ui/ui-weather-*.svg`, `src/assets/ui/ui-recap-night.svg`, `src/game/ui/recap.tsx:39`, no test.
