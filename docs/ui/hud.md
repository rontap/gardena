# HUD

Map full-bleed **PixiJS canvas** under the React HUD. Ribbons and docks sit on top. Controls `pointer-events-auto`. Map under stays live. Chrome tokens [[art/_index]]. No `$`. Coin is gold integer + silver tenths (`moneyParts`).

Canvas host: pan / zoom / `clickHit` as now. Farm sprites have no DOM. `data-cell-stroke` and ghost hooks: HTML overlays over the canvas — [[ui/place]]. No Pixi HUD. No `@pixi/react`. `paintMotion` HUD binds stay.

Type scale: [[ui/type]].

## Top ribbon

`Chrome` `absolute top-4 left-4 right-4 z-20` `h-14`.

Left → right, separated by `w-px bg-ink/20` rules:

1. **Gardena** — `font-display`, `text-base`. The wordmark. Always there.
2. `Coin` (`world.money`), `text-lg` semibold.
3. Phase glyph, then **Day {n} · {phase name}** over a `w-28` `bg-ripe` day bar (`clock.t / DAY_SECONDS`).
4. Weather. After the day block: `w-px bg-ink/20` divider, current glyph, then tomorrow glyph iff husband owns `forecast`. No kind names in the row.
5. Research job when `job.kind === 'run'`: *Researching* **{name}** · **{n}s** over a `bg-leaf` bar. Hidden when idle.
6. Far right, left of Multiplayer: expand chip then points chip then **Multiplayer** then **Pause** then **Gear**.

### Weather

After item 3. Divider `w-px bg-ink/20`, then glyphs. Same chrome as the phase glyph: `h-5 w-5`, `viewBox="0 0 16 16"`. Files `ui-weather-{kind}.svg` for `clear` `rain` `dry` `flood` `drought`. Art [[art/weather]]. Current = `world.weather(clock.day)`. Tomorrow = `world.weather(clock.day + 1)` iff husband owns `forecast`. No extra label in the row. Guest sees the same glyphs; forecast still requires husband owned (world skill).

Each glyph `relative` `pointer-events-auto`. [[ui/callout-hover]] `placement="below"`. Copy locked on [[mechanics/weather]]:

| kind | title | body |
|---|---|---|
| clear | Clear | Fair weather. Crops, weeds, and water behave as usual. |
| rain | Rain | A little extra water on every tilled plot. Weeds and grass come faster. Rain tanks fill six times faster. Shut off irrigation or picky plants will drown. |
| dry | Dry | Plots lose a little water to the air. Weeds and grass stay down. Rain tanks sit empty. Pump water costs more at sundown. |
| flood | Flood | Heavy water on every tilled plot — plants may drown. Rain tanks surge. The stall is closed this morning unless you keep it open around the clock. Fruit sells for more. |
| drought | Drought | Plots dry out. Wells yield half. Pump water is costly. Shop goods cost double. The stall is closed at midday unless you keep it open around the clock. Fruit sells for more. |

Tomorrow title **Tomorrow · {name}**, body of that kind. `{name}` is Clear / Rain / Dry / Flood / Drought.

Weather swaps at the seam. React, not `paintMotion`. Coin does not tick for pump — the bill is recap **Water**. [[ui/docks]] [[mechanics/weather]]

`#debug-weather` — forecast table, not the HUD. [[ui/cheat]]

### Consumables

`ml-auto` cluster. Expand then points then the three icon buttons. Not a `Panel`. Not logged. Guest sees the same counts. `expandLeft()` and `World.points` — derived, not new state. [[mechanics/expansion]] [[mechanics/family]]

Chip hidden at 0. Group hidden if both 0.

Each chip: `relative` `pointer-events-auto`. 24×24 (`h-6 w-6` `viewBox="0 0 24 24"`) `EXPAND_LAND` / `SKILL_POINT` + count `text-sm font-semibold tabular-nums`.

[[ui/callout-hover]] `placement="below"`:

| chip | show | title | body |
|---|---|---|---|
| expand | `expandLeft() > 0` | Expansion | You have {n} farm expansion opportunities. |
| points | `points > 0` | Skill points | You have {n} unspent skill points. Assign them to a family member! |

`n` is that count.

Then **Multiplayer** **Pause** **Gear**. All `ui-btn-*.svg` faces `idle` / `hover` / `selected` / `disabled` via `btnFace`, icon `h-11 w-11` in the `h-14` row, no label. Do not mint a third icon size. `pointer-events-auto` (the ribbon Chrome stays `pointer-events-none`). Multiplayer (`ui-btn-multiplayer.svg`) left of Pause. Guest and host both show the face. Selected while the in-play [[ui/multiplayer]] dialog is open. Click toggles that dialog. Recap blocks the open, same as Gear. Pause (`ui-btn-pause.svg`) toggles user pause on the sim clock; selected while paused, aria-label swaps **Pause**/**Resume**. Gear (`ui-btn-gear.svg`). Gear selected while the in-play [[ui/menu]] is open. Click toggles that shell. Recap blocks the open, same as other panels. Pause stays live during recap (the sim is not ticking anyway). Overlay pause does not replace this toggle.

### Overlay pause

Family / Market / Almanac open and `role === 'off'`: pause the sim clock. App `paused`. Not `World.pause`. Close restores the previous pause state unless the player had already paused — same `resumeRef` pattern as MP lobby `setMpPanel`. Overlay pause is extra on top of user pause.

Rising edge (enter `family` | `market` | `almanac` from anything else): `resumeRef.current = !paused`, then pause. Falling edge (leave those three): if `resumeRef.current`, unpause and clear it. Switching among the three is not a falling edge.

Host or guest: these three overlays do not auto-pause. Pause button still toggles user pause.

Shop / Research / Build / Cheat / Lens do not auto-pause. MP lobby pause is `setMpPanel`, separate.

The clock text, the day bar, the research name and its seconds are painted every frame by `paintMotion`, not by React. Any change to that markup must land in `motion.ts` too: `[data-clock]` `[data-day-bar]` `[data-research-left]` `[data-research-secs]` `[data-research-bar]`. React renders the same strings so the first frame is right. Weather glyphs are React. Coin does not tick for pump.

The hovered machine's recipe arrow and its countdown are on the same contract: `[data-craft-fill]` `[data-craft-time]`, bound by `bindCraft` + `bindHud`, painted only while the machine is not idle — [[ui/recipe]].

## FPS

Top-right, play only. `pointer-events-none` `text-xs` `tabular-nums` Nunito. Host and guest both show it.

Readout `60 4.2ms` then optional ` 32MB` if `performance.memory`. Paint from rAF / `paintMotion`, not React state every frame. FPS is an EMA of `1 / rAF dt`. Tick ms wraps `world.tick` / `host.pump` only. Not logged, not Save, not a Panel, not a `DirtyReason`. — [[architecture/tick]]

## Left ribbon

`Chrome` `absolute top-20 left-4 z-20` `w-24`. Icon `h-11 w-11` above, `text-sm` semibold label below.

Order: **Shop** **Build** **Research** **Market** **Lens** **Family** **Almanac** **Cheat**. The Lens face carries the active lens id as its note, plus *locked* and a **×** that clears lens and lock — [[ui/lens]]. Then if build cluster: divider, **Delete** **Rotate** **Cancel**. Guest: **Cheat** hidden. Hidden ≠ disabled. [[ui/multiplayer]]

Face states: `idle` / `hover` / `selected` / `disabled`. `ui-btn-*.svg`. Family face `ui-btn-family`. Cheat face `ui-btn-cheat`.

| button | act | selected |
|---|---|---|
| Shop / Research / Market / Family / Almanac / Cheat | panel toggle | that panel open |
| Lens | dock toggle | `panel === 'lens'` |
| Delete | `armDelete()` | `place.kind === 'delete'` |
| Rotate | `rotatePlace()` | never |
| Cancel | `cancelPlace` | never |

Build trio visible iff `place.kind === 'delete'` or sku in `GHOST_SKUS` — derived from the Build shelves whose `cluster` is `'build'`, so Water, Processing, Storage, Vehicles, and Sensors. Paving and `buy-fence` are out: they are paint tools. Hidden ≠ disabled. [[ui/build]] [[ui/sensors]]

**Rotate** only renders for a sku in `ROTATABLE` (`buy-sprinkler-vert`). A rotate button that rotates nothing is worse than no button. No rotatable sensor SKU. [[ui/place]].

Cancel does not change lens. Shop close (toggle, dock **×**), leaving the shop system: `leaveShop` = `cancelPlace`; if `lens === 'pipes'` or `lens === 'sensors'` then `off`. Matches Esc. Leave `water` / `land` / `ripe` / `kind` / `rarity` / `vehicles`. Right-click: `cancelPlace` only. Esc: `cancelPlace`; pipes or sensors → `off`; close HUD target and panel. Editor on: close editor first, stay seated, restore lens unless it was already `vehicles` — [[ui/vehicles]]. Build **Sensors** tab sets `lens = 'sensors'` and does not arm. Switching Build category does not force the lens off.

## Lenses

The lens picker is its own dock now — [[ui/lens]]. The rail button shows the active lens id under the label.

## Expand faces

Map-edge plates. HTML overlays over the canvas, not farm sprites. After `unlock-expand` only. Size `TILE * 0.85`, centred on `face.at`. Copy **Expand** + `<Coin n={face.price} />` except no-permit. Host `group`. Tokens `bg-ink/55` `group-hover:bg-ink/75` (clickable / poor), `bg-ink/40` (no permit). Type `text-house` / `text-house/50`. Plates take pointer. [[mechanics/expansion]]

| state | plate | type | pointer |
|---|---|---|---|
| clickable | `bg-ink/55` `group-hover:bg-ink/75` | `text-house` | `cursor-pointer` → `expand(id)` |
| poor (money) | same fill | `text-house/50` | `cursor-pointer`, click no-op |
| no permit | `bg-ink/40` | `text-house/50` **No permit left** | no pointer |

## Speech

HTML overlay, `data-speech`. Chip `bg-house` `px-2` `py-0.5` `text-base` `text-ink`. Ticker pose follows the speaker. `pointer-events-none`. `'speech'` dirty binds the chip; ticker follows. Not React state. [[architecture/view]]

## Right column

Stops Window (editor on): `absolute top-20 right-4 z-20 w-80`. `max-h` clears inspect. Same width. [[ui/vehicles]]

## Bottom-right

`absolute right-4 bottom-4 z-20` `w-80`. Queue (if any) then [[ui/inspect]].

`e2e/hud.spec.ts` shots: `e2e/shots/hud.png` `shop.png` `research.png` `almanac.png`, plus `family.png` (Family overlay open) and `recap.png`. Screenshot only.

Assumption: digs/mines HUD counters are gone with the research gates. Overlay pause snapshots `resumeRef` only on entering family/market/almanac; switching among them keeps the hold. App `paused`, not `World.pause`. Weather glyphs [[art/weather]].
