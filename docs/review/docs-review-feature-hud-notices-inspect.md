# Docs review: HUD, Command Center, inspect

Notes: `docs/ui/hud.md`, `docs/ui/notices.md`, `docs/ui/inspect.md`, `docs/ui/callout-hover.md`, `docs/ui/_index.md`
Code: `src/App.tsx`, `src/game/ui/hud.tsx`, `src/game/ui/notices.ts`, `src/game/ui/notices.tsx`, `src/game/ui/callout-hover.tsx`, `src/game/ui/status.tsx`, `src/game/ui/queue.tsx`, `src/game/ui/panel.ts`, `src/game/view/motion.ts`, `src/game/view/map.tsx`, `src/game/sim/look.ts`, `src/game/sim/prompt.ts`, `src/game/sim/clock.ts`, `src/game/sim/tick.ts`, `src/game/sim/feature-field/field.helpers.ts`, `src/game/sim/feature-place/place.ts`, `src/index.css`
Tests: `src/game/ui/notices.test.ts`, `src/game/sim/inspect.test.ts`, `src/game/sim/day.test.ts`, `e2e/notices.spec.ts`, `e2e/hud.spec.ts`, `e2e/qol.spec.ts`, `e2e/mp-guest.spec.ts`, `e2e/trees.spec.ts`

Tick the one line that is true in each question. Tick **none** and write a line under it if none is.

## Disagreements

### 1. Which open windows pause the farm clock on their own (solo play)?
- [ ] **doc** `docs/ui/hud.md:35` — the Market, the Almanac, and the day recap popup pause the clock; closing restores the earlier pause state. Build, Research, Family, Cheat and Lens do not pause.
- [ ] **code** `src/App.tsx:719` — `overlayHold` pauses for the day recap popup, the Contracts window, the Almanac, and the Gear menu (`menu`). The Market does not pause. Only when `role === 'off'` (`src/App.tsx:724`).
- [ ] **test** — no test covers which windows pause.
- [ ] **none**
- [x] Market, Almanac, Day recap, Research and Family pause

### 2. Does right-clicking a Command Center row that still holds (a wilting plant, low water) keep it away?
- [ ] **doc** `docs/ui/notices.md:104` — a condition row that is right-clicked stays dismissed while the condition still holds; only when the condition clears and later returns does it come back, after the two-pass delay.
- [x] **code + test** `src/game/ui/notices.tsx:273`, `src/game/ui/notices.ts:606`; `src/game/ui/notices.test.ts:293` "notices.dismiss" — right-click removes the row from the tracked set, so on the next pass it is pending again and on the pass after it is visible again: a dismissed row returns after about two seconds (`NOTICE_SECONDS` = 1) while the condition still holds. The test asserts that return.
- [ ] **none**

### 3. Is the Command Center hidden while the vehicle route editor is open?
- [ ] **doc** `docs/ui/notices.md:86` — hidden while the vehicle editor is on, because the Stops Window takes that same top-right anchor.
- [x] **code** `src/App.tsx:1090` — `Notices` is always given `off={false}`; the column is never hidden by the editor. The `off` prop exists (`src/game/ui/notices.tsx:229`) but nothing sets it.
- [ ] **test** — no test covers it.
- [ ] **none**

### 4. What does chopping a mature tree drop?
- [ ] **doc** `docs/ui/inspect.md:125` — held axe on a mature, non-trunk tree: **Chop**. Chop yields 1 wood and 2 grafts of that tree's Variety, then the tree becomes a trunk and its fruit is lost.
- [x] **code** `src/game/sim/feature-field/field.helpers.ts:421` — axe **or chainsaw**. Drops 1 wood; drops `CHOP_GRAFTS` (2, `src/game/defs/items.ts:38`) grafts only when the gardener has the `grafting` skill. Nothing drops when `dropSpot` finds no free spot. Uses one tool use; tree becomes trunk, fruit 0, `yield` pending, `tended` false.
- [ ] **test** `e2e/trees.spec.ts:88` "axe on mature tree, trunk, grow, mature; axe no-op; shovel trunk" and `e2e/trees.spec.ts:294` "chop with Chainsaw" — cover chopping; not read for the graft condition.
- [ ] **none**

### 5. Which placement tools show the **Rotate** button?
- [ ] **doc** `docs/ui/hud.md:59` — only a sku in `ROTATABLE`, which is `buy-sprinkler-vert`.
- [x] **code** `src/game/ui/hud.tsx:36` — `ROTATABLE` is `buy-sprinkler-vert` and `buy-sorter` (the Variety sorter).
- [ ] **test** — no test covers it.
- [ ] **none**

### 6. What does a right-click on the farm do when no tool is picked?
- [ ] **doc** `docs/ui/hud.md:59` — right-click is `cancelPlace` only, except over a stop of the picked route, which removes that stop.
- [ ] **doc** `docs/ui/notices.md:104` — calls the map right-click "cancel-place-or-drop".
- [x] **code** `src/game/view/map.tsx:460`, `src/game/sim/feature-place/place.ts:289` — removes a route stop when one is under the pointer in the route editor; otherwise, with a tool picked, cancels it; with no tool picked, on an owned plot, while holding something, queues a **drop** of the held item on that plot.
- [ ] **test** — no test found for right-click drop.
- [ ] **none**

### 7. Does the day seam close the open window?
- [ ] **doc** `docs/ui/hud.md:35` — on `clock.day` increment App `writeSlot`s when `world.local === 0` and closes the open panel.
- [x] **code** `src/App.tsx:252` — on a day change App writes the save slot when `world.local === 0`; it does not close the open panel. No other day-change handler closes one.
- [ ] **test** — no test covers panel close at the seam.
- [ ] **none**

### 8. Where does the `NOTICE_ORDER` put the letter row (`grandma`) and the tutorial rows?
- [ ] **doc** `docs/ui/notices.md:90` — `recap` first, then the one-time rows `joined` `quit` `desynced` `contract-done` `research-done`, then losses, then running clocks, then what waits to be spent. No tutorial or `grandma`.
- [ ] **doc** `docs/ui/notices.md:132` (`notices.group`) — `recap`, then `tutorial` `tutorial-end` `tutorial-event`, then `joined` `quit` `desynced` `contract-done` `research-done` `grandma`; `necronomicon` above `points`.
- [x] **code + test** `src/game/ui/notices.ts:48`; `src/game/ui/notices.test.ts:244` "rows of one kind are one block, in NOTICE_ORDER" — matches `notices.group`: recap, tutorial kinds, roster, contract-done, research-done, grandma, then `fuel` `drowning` `wilting` `starving` `freshness` `rotten` `dead` `weed`, then `contract` `research` `water-low`, then `necronomicon` `points` `expansion`. The test only checks that blocks come out in `NOTICE_ORDER`.
- [ ] **none**

### 9. What is the tree Fertilizer bar number in inspect?
- [ ] **doc** `docs/ui/inspect.md:110` — tree Fertilizer shows `{fertilizer}L`, rounded; scale 0 to `TREE_FERT_MAX`.
- [x] **code** `src/game/ui/status.tsx:178` — shows litres (`liters(cell.soil.fertilizer)`), scale 0 to `cell.soil.fertMax` (the tree's own `Soil`, not the constant). `TREE_FERT_MAX` is 2 (`src/game/sim/soil.ts:25`).
- [ ] **test** `e2e/trees.spec.ts:394` "tree inspect bars, bucket, Fertilizer bag; 3-arg Soil plot defaults" — covers the tree bars; exact scale not read.
- [ ] **none**

## Doc only (no code found)

None found in this slice: every function, type, string and file these notes name exists.

## Code only (no note mentions it)

### 12. Expansion plate strings are not in the message files
- [ ] **code** `src/game/view/map.tsx:805` — the map-edge plates print **Expand** and **No permit left** as English literals in the component, not from `messages/en/*.json`. The hovered plate's look line uses `prompt_expand` "Expand {price}" or `prompt_cannot_afford` "Cannot afford" (`src/game/sim/look.ts:83`).
- [ ] **intended, document it**
- [x] **not intended**, fix it

### 13. The vehicle dashboard buttons are English literals in `App.tsx`
- [ ] **code** `src/App.tsx:1374` — **Disembark**, **Dock**, **Unload**, **Load**, **Boom 3** / **Boom 5**, the tooltip "Dock at the hangar arrows.", and the readouts `F: {n}%` / `V: {n} km/h` are literals, not message keys.
- [x] **intended, document it**
- [ ] **not intended**

### 14. Pause when the window loses focus
- [x] **code** `src/App.tsx:263` — with the `pauseWhenHidden` setting on, solo play pauses when the browser window blurs or the tab hides, and resumes on return unless the player had already paused. Not in `docs/ui/hud.md` overlay-pause rules.
- [ ] **intended, document it**
- [ ] **not intended**

### 15. Route-editor hint in the inspect look block
- [ ] **code** `src/App.tsx:1533`, `src/game/ui/status.tsx:389` — while a route is picked in the vehicle editor, hovering a stop cell puts a first line in the look block (`vehicles_hint_go` / `_load` / `_unload` / `_refuel` / `_wait`).
- [ ] **intended, document it**
- [ ] **not intended**
- [ ] Developement question, not doc mateiral.

### 16. Speech is one line for the whole farm, drawn over the local gardener
- [ ] **code** `src/game/sim/world.ts:1360`, `src/game/view/map.tsx:924` — `World.speech` is one field, not per seat; the chip is always drawn above `seats[world.local]`, and is repositioned every Pixi ticker frame (`src/game/view/world-view.ts:179`). Lasts `SPEECH_S` = 2.5 s (`src/game/defs/items.ts:45`).
- [ ] **intended, document it**
- [x] **not intended**, fix it.

### 17. Blocked control faces use the `disabled` attribute on the left ribbon
- [ ] **code** `src/game/ui/hud.tsx:330` — `FaceBtn` sets `disabled` on the button when `disabled` is true. `docs/ui/callout-hover.md:30` says blocked controls must use `aria-disabled` and never `disabled`. No caller passes `disabled` today, so no button is affected.
- [ ] **intended, document it**
- [ ] **not intended**
- [ ] Developement question, not doc mateiral.

### 18. Plant look lines with numbers still exist behind `plantStats`
- [ ] **code** `src/game/sim/look.ts:148` — `lookText(..., plantStats: true)` adds Happiness, Water and Fertilizer lines with words such as `prompt_water_thirsty` "thirsty" for a plant. The HUD always passes `false` (`src/game/ui/status.tsx:387`); no in-game caller passes `true` found.
- [ ] **intended, document it**
- [ ] **not intended**
- [ ] Developement question, not doc mateiral.
