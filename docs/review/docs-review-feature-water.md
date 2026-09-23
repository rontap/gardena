# Docs review: Water

Notes: `docs/mechanics/water.md`, `docs/items/irrigation.md`, `docs/ui/docks.md` (sprinkler and valve parts: `:3`, `:78`, `:82-86`)
Code: `src/game/sim/water.ts`, `src/game/sim/nets.ts`, `src/game/sim/pipe.ts`, `src/game/sim/queue.ts`, `src/game/sim/world.ts`, `src/game/sim/prompt.ts`, `src/game/sim/look.ts`, `src/game/sim/feature-place/place.ts`, `src/game/sim/feature-field/field.helpers.ts`, `src/game/sim/weather.ts`, `src/game/ui/objecthud.tsx`, `src/game/defs/items.ts`, `src/game/defs/research.ts`
Tests: `src/game/sim/water.test.ts`, `src/game/sim/world.test.ts`, `src/game/sim/trees.test.ts`, `src/game/sim/sensor.test.ts`, `e2e/water.spec.ts`, `e2e/irrigation.spec.ts`

Tick the one line that is true in each question. Tick **none** and write a line under it if none is.

## Disagreements

### 1. What does the Smart irrigation research tell the player it does to sprinklers?
- [ ] **doc** `docs/mechanics/water.md:63` — Smart irrigation gives every sprinkler an output slider in litres a day per tile, `0` to `SPRINKLER_TILE_DAY`, on `SPRINKLER_STEP` stops, plus a signal input.
- [ ] **doc** `docs/items/irrigation.md:11` — Smart irrigation adds a signal input to sprinklers and valves "plus the crop dial".
- [ ] **code** `messages/en/research.json:38` — the research description reads "Tune sprinkler to a crop so it pours only what that crop consumes, not Full flow, which stops drowning plants. …". The HUD itself is the slider (`src/game/ui/objecthud.tsx:40`); there is no crop picker and no **Full flow** option.
- [ ] **none**

### 2. What pour setting does a newly placed sprinkler get?
- [ ] **doc** `docs/mechanics/water.md:65` — `{ kind: 'flat' }` and `{ kind: 'crop' }` are only read from sprinklers saved before the slider; "Nothing writes them." Same claim in the comment at `src/game/sim/pipe.ts:16`.
- [ ] **code** `src/game/sim/feature-place/place.ts:136` and `src/game/sim/play.ts:128-130` — every newly placed sprinkler is written with `tune: { kind: 'flat' }`, which pours `SPRINKLER_TILE_RATE` (2.5 L a day per tile) until the player moves the slider; the slider then writes `{ kind: 'rate', day }`.
- [ ] **test** `src/game/sim/world.test.ts:1110`, `:1317` — place sprinklers with `tune: { kind: 'flat' }`.
- [ ] **none**

### 3. What does the delete prompt say on a well?
- [ ] **doc** `docs/mechanics/water.md:23` — **Delete well**.
- [ ] **code** `src/game/sim/prompt.ts:420` — "Demolish {name}" with the lower-cased name, so **Demolish well** (`messages/en/prompt.json:28`, `messages/en/names.json:148`).
- [ ] **test** `src/game/sim/world.test.ts:1087` "well is a 1x1 source cell…" — asserts the delete works, not the prompt text.
- [ ] **none**

### 4. Can a net's sprinklers pour more than its sources make?
- [ ] **doc** `docs/mechanics/water.md:3` — yes: a net can pour above production while tanks hold, then falls back to production.
- [ ] **code** `src/game/sim/nets.ts:229` — `tickWater` pulls the full demand of all pouring sprinklers from the tanks each tick, limited only by what is stored. Matches the doc.
- [ ] **code + test** `src/game/sim/nets.ts:215` — `rate(world, v)` caps a sprinkler's share at the sum of source gather rates (`served = min(total, supply)`). It is called only from tests (`src/game/sim/world.test.ts:1185`, `:1347-1379`, `src/game/sim/sensor.test.ts:778`, `:828`, `:856`), not by the game.
- [ ] **none**

### 5. What adds pumped litres to the day's water bill?
- [ ] **doc** `docs/mechanics/water.md:15` — "Pump-kind `take()` adds litres to `World.pumpLiters`."
- [ ] **code** `src/game/sim/water.ts:34` — `Reservoir.take` only counts `drawn`; the callers add to `pumpLiters`: `World.pullWater` (`src/game/sim/world.ts:900`, used by sprinklers, taps and stills) and `fillDraw` at a pump (`src/game/sim/queue.ts:553`). Every litre drawn from a pump-kind tank is billed either way; well litres are not.
- [ ] **test** `src/game/sim/water.test.ts:39` — tests the per-litre price only.
- [ ] **none**

## Doc only (no code found)

None found. Every identifier the notes name exists: `SOURCE`, `TAP_RATE`, `Reservoir`, `pull`, `Gate`, `valveHold`, `SENSOR_HOLD`, `dirtyNets`, `conducts`, `netOfCell`, `sprinklerTargets` cache, `tuneSprinklerBody`, `SPRINKLER_TILE_DAY`, `SPRINKLER_STEP`, `SPRINKLER_TILE_RATE`, `pourTarget`, `World.wells`, `Net.stills`, `Net.waterSystems`.

## Code only (no note mentions it)

### 6. Where can a sprinkler be placed?
- [ ] **code** `src/game/sim/feature-place/place.ts:128` and `src/game/sim/prompt.ts:321` — on any owned vertex with no sprinkler, as long as every cell of its area is inside owned land. No pipe is needed (`e2e/irrigation.spec.ts:73` "sprinkler place without pipes"). A sprinkler with no conducting pipe edge at its vertex is not on any net.
- [ ] **intended, document it**
- [ ] **not intended**

### 7. What area does each sprinkler water?
- [ ] **code + test** `src/game/sim/pipe.ts:110` — basic: the 2×2 around its vertex; large: 4×4; vertical `ns`: 2 wide × 4 tall; vertical `ew`: 4 wide × 2 tall. `src/game/sim/world.test.ts:1290` "aoe formulas". The water note does not give the shapes; the catalog text does ("{w}×{h}", `src/game/sim/item.ts:713-715`).
- [ ] **intended, document it**
- [ ] **not intended**

### 8. Where do the crop marks on the sprinkler slider sit?
- [ ] **code** `src/game/ui/objecthud.tsx:30`, `:56` — one mark for every `CROPS` row that drinks, which includes the four tree species; each mark sits at that crop's base-Variety water use with the player's current modifiers, snapped to the nearest `SPRINKLER_STEP` stop (`snapFlow`).
- [ ] **intended, document it**
- [ ] **not intended**

## Agreed

- [ ] 9. Gather rates: pump and pumpjack 0.6 L/s (144 L a day), tank 50; well 0.4 L/s (96 L a day), tank 150; tanks start full; starter pump and pumpjack are the same `SOURCE.pump` — doc `docs/mechanics/water.md:5`, `docs/items/irrigation.md:7`, code `src/game/sim/water.ts:3`, test `src/game/sim/water.test.ts:11`, `:24`.
- [ ] 10. Bucket fill: well 2 L/s, pump and pumpjack 2.5 L/s, tap 4 L/s while the net's tanks hold; an empty tank fills only as fast as it gathers; weather changes gather only — doc `docs/mechanics/water.md:7-13`, `:35`, `:41`, `:85`, code `src/game/sim/queue.ts:545`, `src/game/sim/water.ts:34`, test `src/game/sim/water.test.ts:45`.
- [ ] 11. `pull` draws from each tank in proportion to what it holds — doc `docs/mechanics/water.md:17`, code `src/game/sim/water.ts:42`, test `src/game/sim/water.test.ts:29`.
- [ ] 12. Pipes on edges, sprinklers on vertices, valves on edges; any corner of a source's cells joins its net; two runs touching one source are one net — doc `docs/mechanics/water.md:21-25`, code `src/game/sim/nets.ts:33`, test `src/game/sim/world.test.ts:1021`, `:1087`, `e2e/water.spec.ts:82`.
- [ ] 13. A well is a 1×1 source cell placed on an owned untilled or empty cell, joins by its four corners, fills a bucket, and deletes like a building — doc `docs/mechanics/water.md:23`, code `src/game/sim/prompt.ts:568-596`, `src/game/sim/nets.ts:27`, test `src/game/sim/world.test.ts:1087`.
- [ ] 14. A closed valve blocks only its own edge; water reaches a sprinkler by any other open route; click walks the gardener over and toggles (**Close valve** / **Open valve**) — doc `docs/mechanics/water.md:27`, code `src/game/sim/pipe.ts:29`, `src/game/sim/prompt.ts:309`, test `e2e/water.spec.ts:41`, `:65`.
- [ ] 15. `buy-valve` on a bare owned edge lays pipe and valve and charges both, or neither; on a bare pipe it adds the valve alone; on a valved edge the prompt is **Pipe already has a valve**; deleting a valve leaves the pipe and drops its wires — doc `docs/mechanics/water.md:29`, `:79`, `docs/items/irrigation.md:9`, code `src/game/sim/feature-place/place.ts:83`, `:113`, test `src/game/sim/sensor.test.ts:996`, `:1009`.
- [ ] 16. After `unlock-smart-irrigation`, a wired valve follows its held input and refuses the click (look **Valve - wired**), keeping `open` for when the last wire goes; an unwired valve is the hand valve — doc `docs/mechanics/water.md:31`, `:77`, code `src/game/sim/nets.ts:174`, `src/game/sim/prompt.ts:312`, test `src/game/sim/sensor.test.ts:753`, `:790`, `:1021`.
- [ ] 17. Taps, stills and water-system sensors join a net at any corner that has a conducting pipe edge; none of them produce water; a water-system sensor with no pipe reads **Water-system sensor - no pipes around sensor!** and is high when this tick's sprinkler want on its net is more than stored — doc `docs/mechanics/water.md:35-39`, code `src/game/sim/nets.ts:78-98`, `:309`, `src/game/sim/look.ts:173`, test `src/game/sim/sensor.test.ts:421`, `:659`.
- [ ] 18. A still starts only when its net's tanks hold at least `STILL_WATER`; then it pulls that amount, else it pulls nothing and retries — doc `docs/mechanics/water.md:37`, code `src/game/sim/feature-machines/machines.emit.ts:41`, test `src/game/sim/plants.test.ts:271`, `:991`.
- [ ] 19. Sprinklers pour per covered growing tile and once per tree (at its base cell); ripe, dead and rotten plots get nothing; a sprinkler with nothing to water, no source, or dry tanks pours 0 and shows no spray — doc `docs/mechanics/water.md:45`, `:49`, code `src/game/sim/nets.ts:145`, `:229`, test `src/game/sim/world.test.ts:1317`, `src/game/sim/trees.test.ts:379`.
- [ ] 20. Each sprinkler caches its targets; the cache drops when a cell in its area changes kind, the sprinkler is placed or deleted, or land is expanded — doc `docs/mechanics/water.md:51`, `:83`, code `src/game/sim/world.ts:660`, `src/game/sim/feature-place/place.ts:74`, `:141`, `:151`, test `src/game/sim/trees.test.ts:379`.
- [ ] 21. The spray effect is set on the tick the pour changes, not on the big tick, and pings `'vfx'` — doc `docs/mechanics/water.md:49`, code `src/game/sim/tick.ts:128`, `src/game/sim/nets.ts:250`, test `src/game/sim/world.test.ts:1148`.
- [ ] 22. Smart irrigation: an unwired sprinkler pours; a wired one pours only while its input is high; unwired is not low — doc `docs/mechanics/water.md:59`, code `src/game/sim/nets.ts:211`, test `src/game/sim/sensor.test.ts:652`, `:813`.
- [ ] 23. Slider: `0` to 2.5 L a day per tile in 0.05 steps, snapped in `tuneSprinklerBody` so remote commands land on a stop; `0` pours nothing — doc `docs/mechanics/water.md:63`, code `src/game/defs/items.ts:50-58`, `src/game/sim/world.ts:1070`, no test of the snap.
- [ ] 24. Sprinkler HUD opens only after Smart irrigation, titled **Sprinkler output**, **Sprinkler output ({crop})** while a mark is hovered or focused; `w-[23.5rem]`; marks with the same amount stack; marks alternate between a strip above and a strip below the track in litres order; each strip is as tall as its own tallest stack; a mark has an `aria-label` and no `title`; clicking a mark sets the slider — doc `docs/ui/docks.md:82-86`, code `src/game/view/hit.ts:350`, `src/game/ui/objecthud.tsx:345-460`, `messages/en/sensors.json:3-4`, no unit test.
- [ ] 25. Hand pour target: empty or weed to `SOIL_WATER_MID` (1); growing or ripe to `1 + waterTolerance`; a tree, either cell, to `5 + waterTolerance`; only the gap is poured, limited by the bucket; at or above target nothing is poured — doc `docs/mechanics/water.md:71-73`, `:81`, code `src/game/sim/feature-field/field.helpers.ts:41`, `:353`, test `src/game/sim/world.test.ts:139`, `src/game/sim/trees.test.ts:361`.
- [ ] 26. Buckets hold 5 L and 10 L — doc `docs/mechanics/water.md:69` (points to inventory), code `src/game/defs/items.ts:28`, test `src/game/sim/world.test.ts:422`.
- [ ] 27. A well's litres are not billed as Water and a drought slows a well's gather; pump gather is not changed by weather — doc `docs/items/irrigation.md:7` (catalog wording), code `src/game/sim/weather.ts:55`, `messages/en/catalog.json:29`, test `src/game/sim/water.test.ts:45` (sets `mul` by hand).
