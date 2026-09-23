# Docs review: Engine (world, tick, save, random streams, strings, build)

Notes: `docs/architecture/_index.md`, `docs/architecture/world.md`, `docs/architecture/tick.md`, `docs/architecture/modules.md`, `docs/architecture/rng.md`, `docs/architecture/save.md`, `docs/architecture/i18n.md`, `docs/architecture/ai-gameplay-api.md`, `docs/mechanics/rng.md`, `docs/mechanics/_index.md`, `docs/stack.md`, `docs/infra/index.md`
Code: `src/game/sim/world.ts`, `src/game/sim/world.h.ts`, `src/game/sim/tick.ts`, `src/game/sim/clock.ts`, `src/game/sim/rng.ts`, `src/game/sim/apply.ts`, `src/game/sim/play.ts`, `src/game/sim/version.ts`, `src/game/sim/feature-save/save.ts`, `src/game/sim/feature-save/save.parse.ts`, `src/game/sim/feature-save/save.h.ts`, `src/game/sim/feature-contracts/market.ts`, `src/App.tsx`, `src/main.tsx`, `package.json`, `vite.config.ts`, `playwright.config.ts`, `project.inlang/settings.json`, `.github/workflows/push.yml`
Tests: `src/game/sim/rng.test.ts`, `src/game/sim/feature-save/save.test.ts`, `src/game/sim/day.test.ts`, `src/game/sim/play.test.ts`, `src/game/sim/world.test.ts`, `src/game/sim/mp.test.ts`, `src/game/ui/hud.test.ts`

Tick the one line that is true in each question. Tick **none** and write a line under it if none is.

## Disagreements

### 1. Does a `#start_now` / `?start=now` farm write the save slot?
- [ ] **doc** `docs/architecture/save.md:47` — `#start_now`, `#unlockall`, `?start=now`, `?start=unlock` do not read or write the slot.
- [x] **code** `src/App.tsx:252` — they do not read it, but the day-change effect writes the slot for any play `World` with `local === 0`, so the first day end of a quick-start farm replaces the stored save.
- [ ] **test** — none.
- [ ] **none**

### 2. When does App write the save slot at the day change: solo only, or host too?
- [ ] **doc** `docs/architecture/tick.md:55` — solo only (`hostRef` and `guestRef` both undefined), and App also closes the open panel.
- [ ] **doc** `docs/architecture/save.md:38` — "solo App, same moment as the seam"; host leave also writes.
- [x] **code** `src/App.tsx:260` — writes whenever `world.local === 0`, which includes a host in a session; does not close any panel.
- [ ] **test** — none.
- [ ] **none**

### 3. Which version number does a save file and the multiplayer hello carry?
- [ ] **doc** `docs/architecture/save.md:5`, `:131`; `docs/architecture/net.md:9` — dump identity and protocol are [[GLOBAL_VERSION]] (2.9.4 in `docs/GLOBAL_VERSION.md`).
- [x] **code** `src/game/sim/version.ts:1`, `src/game/sim/feature-save/save.ts:47`, `src/game/sim/mp.ts:590` — `GAME_VERSION = 2.9`; the dump `version` and the hello `protocol` are 2.9, so every 2.9.x build loads and joins every other 2.9.x build.
- [ ] **none**

### 4. Which writes of the save slot exist?
- [ ] **doc** `docs/architecture/save.md:36` — day increment, Save game, successful upload, host leave; Download may also write.
- [x] **code** `src/App.tsx:260`, `:480`, `:543`, `:547`, `:553`, `:939` — those, plus **Exit to main menu** (any page that is not a guest), and Download always writes.
- [ ] **none**

### 5. What does `nextRouteId` start at, and does a new farm have a route?
- [ ] **doc** `docs/architecture/world.md:103` — `World.nextRouteId` starts 1.
- [ ] **code** `src/game/sim/world.ts:278` — a new farm already has route 1 named **Route 1** (deploy quad, no stops) and `nextRouteId` is 2.
- [ ] **none**
- [ ] Developement question, not documentation.

### 6. Which placement tools carry a `facing`?
- [ ] **doc** `docs/architecture/world.md:49` — illegal on any id other than `buy-sprinkler-vert`.
- [x] **code** `src/game/sim/world.h.ts:101` — `buy-sprinkler-vert` (`'ns' | 'ew'`) and `buy-sorter` (`Facing`).
- [ ] **none**

### 7. Which object HUD targets exist?
- [ ] **doc** `docs/architecture/world.md:105` — sprinkler vertex or a sensor cell (water, harvest, counter, day, logic, variety, weather, pressure).
- [ ] **code** `src/game/sim/world.h.ts:176` — those plus `refuel` (the Refueling station HUD). `docs/architecture/log.md:84` does list `refuel`.
- [ ] **none**
- [x] Developement question, not documentation.

### 8. Which random streams exist?
- [ ] **doc** `docs/architecture/rng.md:13`, `docs/mechanics/rng.md:7` — spatial `gen` `weed` `grass` `tree` `skill` `grind` `contract` `weather` `burrow` `variety`; sequence `fruit`.
- [ ] **code** `src/game/sim/rng.ts:20` — also spatial `market-demand`, rolled at every day seam as `at(day, 0)` and `at(day, 1)` to pick one crop stall that recovers and one that drops by `DEMAND_NUDGE` (`src/game/sim/feature-contracts/market.ts:181`, called from `src/game/sim/tick.ts:187`).
- [ ] **none**
- [x] Developement question, not documentation.

### 9. Which message files exist?
- [ ] **doc** `docs/architecture/i18n.md:19` — `names` `catalog` `prompt` `hud` `skills` `research` `almanac` `market` `family` `vehicles` `sensors` `menu` `tutorial` `notices`.
- [ ] **code** `project.inlang/settings.json:8`, `messages/en/` — those plus `necronomicon` (`necro_*` keys).
- [ ] **none**
- [x] Developement question, not documentation.

### 10. How does `npm run build` compile the message files?
- [ ] **doc** `docs/architecture/i18n.md:7` — `dev`, `build` and `test` compile through `paraglideVitePlugin`; `npm run i18n` is for CI or one-shot.
- [ ] **doc** `docs/infra/index.md:9` — `build` compiles paraglide, then `tsc -b`.
- [x] **code** `package.json:10` — `build` runs `scripts/no-defensive.mjs`, then `npm run i18n`, then `tsc -b`, then `vite build`; `dev` and `test` run `no-defensive.mjs` first and then use the plugin. Add that i18n should not be seperately run.
- [ ] **none**
- [ ] 

### 11. Is the invariant id `market.vodka-heirloom` in `docs/mechanics/market.md`?
- [ ] **doc** `docs/mechanics/_index.md:22` — maps `market.vodka-heirloom` to [[mechanics/market]].
- [ ] **doc** `docs/mechanics/market.md:81` — the invariant there is `market.vodka-bintje` (the `bintje` potato Variety). No `market.vodka-heirloom` in the note.
- [ ] **none**
- [x] ??? skip 

### 12. Which invariants does `docs/mechanics/_index.md` fail to map?
- [ ] **doc** `docs/mechanics/_index.md:3` — "Named invariants live on the owning note. Grep the id"; the map is the list of ids.
- [ ] **doc** — invariants defined in their notes but absent from the map: `notices.pure` `notices.pass` `notices.once` `notices.highlight` `notices.red` `notices.group` `notices.wrap` `notices.tutorial` `notices.bar` `notices.weed` (`docs/ui/notices.md:116`–`:138`), `settings.store` `settings.draft` `settings.solo` (`docs/ui/settings.md:36`), `net.seq` `net.snapshot` (`docs/architecture/net.md:95`, `:97`), `building.flags` `building.ports-single` `machines.tick-self` `building.io-ports` (`docs/architecture/modules.md:56`), `view.route` `view.lens` `view.outline` `view.flow` `view.prop-motion` `view.variety` `view.groups` (`docs/architecture/view.md`), `burrow.treasure`, `inventory.restock`, `inventory.swap`, `machines.recipe-collapse`, `variety.purpose`, `trees.foot`, `vehicles.silo-pads`, `mechanics.locality` `mechanics.ownership` `mechanics.capability` `mechanics.funnel` (`docs/standards/mechanics.md`). Every other mapped id exists in its note, and every mapped note exists.
- [ ] **none**
- [ ] ??? skip

## Doc only (no code found)

### 13. Is there a truck?
- [ ] **doc** `docs/architecture/world.md:17`, `:65`; `docs/architecture/modules.md:30` — the truck is not a delete target, truck cells enqueue `consign`, `World.truck` is a stored instance. Searched `truck`, `Truck` in `src/game`: only `src/game/ui/changelog.md`. Consign now comes from the warehouse cell (`src/game/sim/prompt.ts:625`).
- [ ] **removed from the game**
- [ ] **none**
- [ ] truck is in the game.

### 14. Are there rain tanks?
- [ ] **doc** `docs/architecture/modules.md:23`, `:30` — `RainTank.water`, `World.tanks`. Searched `RainTank`, `tanks` in `src/game/sim`: nothing.
- [x] **removed from the game**
- [ ] **none**

### 15. Does the save file carry `smartHold`?
- [ ] **doc** `docs/architecture/save.md:113` — dump writes `smartHold`. Searched `smartHold` in `src/game/sim/feature-save/`: nothing; the dump writes `valveHold` (`src/game/sim/feature-save/save.ts:124`).
- [ ] **removed from the game**
- [ ] **none**
- [x] Developement question.

### 16. Where is the save type?
- [ ] **doc** `docs/architecture/save.md:3`, `:107` — "Type: `sim/save.ts`". The file is `src/game/sim/feature-save/save.h.ts` (types) with `save.ts` and `save.parse.ts`.
- [ ] **removed from the game**
- [ ] **none**
- [x] Developement question.

### 17. Where do `Place` and `StayArmed` live?
- [ ] **doc** `docs/architecture/modules.md:9` — "stay on `world.ts`". They are declared in `src/game/sim/world.h.ts:101`, `:109`.
- [ ] **removed from the game**
- [ ] **none**
- [x] Developement question, should not inbe  docs.

## Code only (no note mentions it)

### 18. Seat name and presence are saved and restored
- [x] **code** `src/game/sim/feature-save/save.ts:61`, `src/game/sim/feature-save/save.parse.ts:131` — each seat's `playerId`, `name` and `presence` go into the file and come back on load. A host's save written while a guest was `in` loads with that seat still `in`, so its gardener is drawn and its hand and inventory keep losing freshness in solo play. `docs/architecture/save.md` lists seat fields without these.
- [x] **intended, document it**
- [ ] **not intended**

### 19. Weather pins change the host's weather but not a guest's
- [ ] **code** `src/game/sim/world.ts:883`, `src/game/sim/mp.ts:318` — **Tomorrow: {name}** pins are host-only, not a command and not in the save, while the digest includes `weather(clock.day)`. A pin that changes tomorrow's kind gives the host a different digest from every guest the next day, and a resync ships no pins. No test covers pins in a session.
- [ ] **intended, document it**
- [x] **not intended**, bug! fix it!

### 20. The object HUD target is one field for the whole farm
- [x] **code** `src/game/sim/world.ts:314`, `:1051` — `World.hud` is not per seat, and `Act.openHud` is a command, so in a session one player opening a sensor or sprinkler HUD opens it on every player's screen. `docs/architecture/log.md:60` lists `World.hud` and `World.cue` as logged; `cue` is now per seat (`Seat.cue`), `hud` is not.
- [x] **intended, document it**
- [ ] **not intended**

### 21. Extra seam steps
- [x] **code** `src/game/sim/tick.ts:148` — besides the steps `docs/architecture/world.md:87` lists, the seam also runs `tickContracts`, clears rotten drops older than `ROTTEN_GROUND_DAYS`, clears ripe weeds, advances the grandma letters, removes Reputation when contracts are unlocked and none was taken that day, and applies the day's stall demand nudge; the seam tick then returns without any field tick.
- [x] **intended, document it**
- [ ] **not intended**

### 22. Two more indexes
- [x] **code** `src/game/sim/world.ts:699` — `track()` also keeps `tufts` (untilled grass cover) and `rocks` (rock origins); the `machines` index is every origin cell whose `ticks` flag is set, not a fixed kind list. `docs/architecture/tick.md:19` lists neither.
- [x] **intended, document it**
- [ ] **not intended**

### 23. Electron desktop build, lint and the defensive-code guard
- [ ] **code** `package.json:6`, `:10`, `electron/main.cjs`, `scripts/no-defensive.mjs` — an Electron entry and `electron-build` script; `oxlint`; and `no-defensive.mjs`, which fails `dev`, `build`, `lint` and `test` when `src/` contains `typeof … ===`, `Array.isArray(` or `Number.isFinite(`. `docs/stack.md` names none of these (it mentions electron-builder only for `.npmrc`).
- [ ] **intended, document it**
- [ ] **not intended**
- [x] intended, do not document.

### 24. The AI API is installed in every session
- [x] **code** `src/App.tsx:193`, `src/game/sim/play.ts:649` — `window.play` is installed for every play `World`, host and guest included; the hold only stops the solo branch of the rAF loop, so a host or guest calling `turn()` ticks its own `World` directly outside the bundle stream. `docs/architecture/ai-gameplay-api.md:5` says host and guest branches are untouched.
- [ ] **intended, document it**
- [ ] **not intended**

