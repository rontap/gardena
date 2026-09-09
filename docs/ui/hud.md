# HUD

Map full-bleed **PixiJS canvas** under the React HUD. Ribbons and docks sit on top. Controls `pointer-events-auto`. Map under stays live. Chrome tokens [[art/_index]]. No `$`. `Coin` is one gold glyph and `Math.round(n)`. Display only — `World.money` and every `unitSale` stay floats. No silver coin; `ui-coin-silver.svg` is unused.

Canvas host: pan / zoom / `clickHit` as now. Farm sprites have no DOM. `data-cell-stroke` and ghost hooks: HTML overlays over the canvas — [[ui/place]]. No Pixi HUD. No `@pixi/react`. `paintMotion` HUD binds stay.

Map boot: until `WorldView.mount` + first `layout` (`onReady`), a `pointer-events-none` overlay on the map host: centered **Loading...**, `font-display` `text-5xl` `text-white`, fade in 0.5s ease-in opacity 0 → 0.7, fade out 0.5s ease-out to 0, then unmount. Play and menu. Menu canvas fade-in still runs after `onReady`. Not Pixi. Not a `DirtyReason`. [[architecture/view]] `view.boot`

Type scale: [[ui/type]].

## Top ribbon

`Chrome` `absolute top-4 left-4 right-4 z-20` `h-14`.

Left → right, separated by `w-px bg-ink/20` rules:

1. **Gardena** — `font-display`, `text-base`. The wordmark. Always there.
2. `Coin` (`world.money`), `text-lg` semibold.
3. Phase glyph, then **Day {n} · {phase name}** over a `w-28` `bg-ripe` day bar (`clock.t / DAY_SECONDS`).
4. Weather. After the day block: `w-px bg-ink/20` divider, current glyph, then tomorrow glyph iff husband owns `forecast`. No kind names in the row.
5. Far right, left of Multiplayer: **Multiplayer** then **Almanac** then **Cheat** then **Pause** then **Gear**.

The research job, the expansion chip, and the points chip are not here. They are notices on the Command Center — [[ui/notices]]. One place, not two.

### Weather

After item 3. Divider `w-px bg-ink/20`, then glyphs. Same chrome as the phase glyph: `h-5 w-5`, `viewBox="0 0 16 16"`. Files `ui-weather-{kind}.svg` for `clear` `rain` `dry` `flood` `drought`. Art [[art/weather]]. Current = `world.weather(clock.day)`. Tomorrow = `world.weather(clock.day + 1)` iff husband owns `forecast`. No extra label in the row. Guest sees the same glyphs; forecast still requires husband owned (world skill).

Each glyph `relative` `pointer-events-auto`. [[ui/callout-hover]] `placement="below"`. Copy locked on [[mechanics/weather]]:

| kind | title | body |
|---|---|---|
| clear | Clear | Fair weather. Crops, weeds, and water behave as usual. |
| rain | Rain | A little extra water on every tilled plot. Weeds and grass come faster. Rain tanks fill six times faster. Shut off irrigation or picky plants will drown. |
| dry | Dry | Plots lose a little water to the air. Weeds and grass stay down. Rain tanks sit empty. Pump water costs more at sundown. |
| flood | Flood | Heavy water on every tilled plot — plants may drown. Rain tanks surge. The stall is closed this morning unless you keep it open around the clock. Fruit sells for more. |
| drought | Drought | Plots dry out. Wells yield half. Pump water is costly. Seeds and Tools cost double. The stall is closed at midday unless you keep it open around the clock. Fruit sells for more. |

Tomorrow title **Tomorrow · {name}**, body of that kind. `{name}` is Clear / Rain / Dry / Flood / Drought.

Weather swaps at the seam. React, not `paintMotion`. Coin does not tick for pump — the bill is recap **Water**. [[ui/docks]] [[mechanics/weather]]

`#debug-weather` — forecast table, not the HUD. [[ui/cheat]]

### Buttons

`ml-auto` cluster: **Multiplayer** **Almanac** **Cheat** **Pause** **Gear**. Not a `Panel`. Not logged. All `ui-btn-*.svg` faces `idle` / `hover` / `selected` / `disabled` via `btnFace`, icon `h-11 w-11` in the `h-14` row, no label. Do not mint a third icon size. `pointer-events-auto` (the ribbon Chrome stays `pointer-events-none`). Multiplayer (`ui-btn-multiplayer.svg`) leftmost.

Multiplayer: guest and host both show the face. Selected while the in-play [[ui/multiplayer]] dialog is open. Click toggles that dialog. App `recapDay` blocks the open, same as Gear.

Almanac (`ui-btn-almanac.svg`) and Cheat (`ui-btn-cheat.svg`) sit here, face only, no label: the two panels that answer a question stand beside the two controls that stop the day, and the left ribbon keeps only what acts on the farm. Selected while that panel is open. Click toggles it. App `recapDay` blocks the open, same as Gear. Guest: Cheat is not rendered and the cluster closes up — [[ui/multiplayer]].

Pause (`ui-btn-pause.svg`) toggles user pause on the sim clock; selected while paused, aria-label swaps **Pause**/**Resume**. Gear (`ui-btn-gear.svg`). Gear selected while the in-play [[ui/menu]] is open. Click toggles that shell. App `recapDay` blocks the open, same as other panels. Pause stays live while the recap popup is open. Overlay pause does not replace this toggle.

### Overlay pause

Family / Market / Almanac open, or App `recapDay` set, and `role === 'off'`: pause the sim clock. App `paused`. Not `World.pause`. Close restores the previous pause state unless the player had already paused — same `resumeRef` pattern as MP lobby `setMpPanel`. Overlay pause is extra on top of user pause.

Rising edge (enter `family` | `market` | `almanac` | recap popup from anything else): `resumeRef.current = !paused`, then pause. Falling edge (leave those four): if `resumeRef.current`, unpause and clear it. Switching among the four is not a falling edge.

Host or guest: these overlays do not auto-pause. Pause button still toggles user pause.

Build / Research / Cheat / Lens do not auto-pause. MP lobby pause is `setMpPanel`, separate.

The day seam does not pause. On `clock.day` increment App only `writeSlot`s and closes the open panel — a new day is not an interruption, and a player watering a bed keeps watering. The **Day {n} Finished** notice is how the day is noticed, and opening the recap popup from it pauses under the same overlay rule as Family / Market / Almanac. [[ui/settings]] [[mechanics/day]] [[ui/notices]]

The clock text and the day bar are painted every frame by `paintMotion`, not by React. Any change to that markup must land in `motion.ts` too: `[data-clock]` `[data-day-bar]` `[data-banner]`. React renders the same strings so the first frame is right. Weather glyphs are React. Coin does not tick for pump. Research progress left this ribbon with its `motion.ts` bind — [[ui/notices]].

The hovered machine's recipe arrow and its countdown are on the same contract: `[data-craft-fill]` `[data-craft-time]`, bound by `bindCraft` + `bindHud`, painted only while the machine is not idle — [[ui/recipe]].

## FPS

Three spans at the right end of the top ribbon, before the net chip. Play only, host and guest. `pointer-events-auto` (the `Chrome` wrapper is `pointer-events-none`, so a native tooltip is inert without it) `text-xs` `tabular-nums` `text-ink/40` `hover:text-ink/80`. Each carries its own `title`: frames per second / simulation time per frame / JS heap in use.

`{n} FPS` off `Math.round`, `{n}ms` tick time to one decimal, `{n}MB` only if `performance.memory` — three separately diffed writes bound as `fps` / `render` / `mem`. FPS colour is an inline style set only when warning: `#d69a3a` under 60, `#c9574b` under 25, cleared otherwise, so the muted and hover classes govern the normal case. Paint from rAF / `paintMotion`, not React state every frame. FPS is an EMA of `1 / rAF dt`. Tick ms wraps `world.tick` / `host.pump` only. Not logged, not Save, not a Panel, not a `DirtyReason`. — [[architecture/tick]]

## Left ribbon

`Chrome` `absolute top-20 left-4 z-20` `w-24`. Icon `h-11 w-11` above, `text-sm` semibold label below.

Order: **Build** **Research** **Market** **Lens** **Family**. The Lens face carries the active lens id as its note, plus *locked* and a **×** that clears lens and lock — [[ui/lens]]. Then, while **Build** is open or something is armed: a divider, **Demolish**, and **Cancel** once there is something to cancel. Almanac and Cheat are top-ribbon buttons — see above. [[ui/multiplayer]]

Face states: `idle` / `hover` / `selected` / `disabled`. `ui-btn-*.svg`. Family face `ui-btn-family`. Cheat face `ui-btn-cheat`.

| button | act | selected |
|---|---|---|
| Build / Research / Market / Family | panel toggle | that panel open |
| Lens | dock toggle | `panel === 'lens'` |
| Demolish | `armDelete()` | `place.kind === 'delete'` |
| Rotate | `rotatePlace()` | never |
| Cancel | `cancelPlace` | never |

Divider and **Demolish** render iff `panel === 'build' || place.kind !== 'none'`. Opening Build is enough — a player who wants a building gone should not have to arm an unrelated shelf sku first — and an armed ghost keeps the cluster after Build closes. **Cancel** renders iff `place.kind !== 'none'`, which now covers paving and fencing too. `GHOST_SKUS` gates none of the three. Hidden ≠ disabled. [[ui/build]] [[ui/sensors]] [[ui/place]]

**Rotate** only renders for a sku in `ROTATABLE` (`buy-sprinkler-vert`). A rotate button that rotates nothing is worse than no button. No rotatable sensor SKU. [[ui/place]].

Cancel does not change lens. Build close (toggle, dock **×**), opening another panel: `leaveBuild` = `cancelPlace` and restores an unlocked Build peek. Close Build / Esc: cancel the armed pipe (`cancelPlace`). A locked lens stays. Right-click: `cancelPlace` only. Esc: `cancelPlace`; close HUD target and panel. Editor on: close editor first, stay seated, restore lens unless it was already `vehicles` — [[ui/vehicles]]. Build Water peeks pipes. Build Sensors peeks sensors. Build Automation peeks no lens. Build Storage peeks no lens — [[ui/lens]] [[ui/build]].

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

Command Center claims that anchor at `w-72` while the editor is off — [[ui/notices]]. Never both.

## Bottom-right

`absolute right-4 bottom-4 z-20` `w-80`. Queue (if any) then [[ui/inspect]]. Held name and the first look line: `font-display` `text-sm` — [[ui/type]].

The queue lists the first `QUEUE_SHOWN` errands, then one dimmer line reading **and {n} more** for the rest, the same shape a Command Center block uses past `NOTICE_GROUP_MAX` — [[ui/notices]]. `QUEUE_CAP` is 12, so the whole queue would otherwise be twelve lines tall over the map. The progress bar stays under the list.

## Day banner

`clock.banner > 0` starts it. `font-display` `text-4xl` `text-white`. Top of the play field, below the ribbon (`pt-24`). `pointer-events-none`. Copy **Day {n}**. Fade in 0.5s ease-in opacity 0 → 0.7, hold, fade out 0.5s ease-out to 0. Total `banner = 4` s. New farm already `banner = 4`. Seam sets it. `data-banner`. `paintMotion` writes the day string. Not Pixi. [[ui/type]] [[mechanics/day]]

`e2e/hud.spec.ts` shots: `e2e/shots/hud.png` `build.png` `research.png` `almanac.png`, plus `family.png` (Family overlay open) and `recap.png`. Screenshot only.

`e2e/buildings.spec.ts`: `#unlockall`, place every cell Build sku, `e2e/shots/buildings.png`.

Assumption: digs/mines HUD counters are gone with the research gates. Overlay pause snapshots `resumeRef` only on entering family/market/almanac/recap popup; switching among them keeps the hold. App `paused`, not `World.pause`. Weather glyphs [[art/weather]]. Sensor Object HUD: `Checkbox` / `Radio` in `frame.tsx` — [[ui/sensors]] [[ui/docks]].
