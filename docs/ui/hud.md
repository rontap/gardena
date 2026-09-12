# HUD

Map full-bleed **PixiJS canvas** under the React HUD. Ribbons and docks sit on top. Controls take pointer. Map under stays live. Chrome tokens [[art/_index]]. No `$`. `Coin` is one gold glyph and `Math.round(n)`. Display only — `World.money` and every `unitSale` stay floats. No silver coin; `ui-coin-silver.svg` is unused.

Canvas host: pan / zoom / `clickHit` as now. Farm sprites have no DOM. Ghost hooks: HTML overlays over the canvas — [[ui/place]]. No Pixi HUD. No `@pixi/react`. `paintMotion` HUD binds stay.

Map boot: until `WorldView.mount` + first `layout` (`onReady`), an overlay on the map host: centered **Loading...**, fade in then fade out, then unmount. Play and menu. Menu canvas fade-in still runs after `onReady`. Not Pixi. Not a `DirtyReason`. [[architecture/view]] `view.boot`

Type scale: [[ui/type]]. Overlay pause snapshots `resumeRef` only on entering family/market/almanac/recap popup; switching among them keeps the hold. App `paused`, not `World.pause`. Weather glyphs [[art/weather]]. Sensor Object HUD: `Checkbox` / `Radio` in `frame.tsx` — [[ui/sensors]] [[ui/docks]].

## Top ribbon

`Chrome` top of the play field.

Left → right, separated by rules:

1. **Gardena** — the wordmark. Always there.
2. `Coin` (`world.money`).
3. Phase glyph, then **Day {n} · {phase name}** over a day bar (`clock.t / DAY_SECONDS`).
4. Weather. After the day block: divider, current glyph, then tomorrow glyph iff husband owns `forecast`. No kind names in the row.
5. Far right, left of Multiplayer: **Multiplayer** then **Almanac** then **Cheat** then **Pause** then **Gear**.

The research job, the expansion chip, and the points chip are not here. They are notices on the Command Center — [[ui/notices]]. One place, not two.

### Weather

After item 3. Divider, then glyphs. Same chrome as the phase glyph. Files `ui-weather-{kind}.svg` for `clear` `rain` `dry` `flood` `drought`. Art [[art/weather]]. Current = `world.weather(clock.day)`. Tomorrow = `world.weather(clock.day + 1)` iff husband owns `forecast`. No extra label in the row. Guest sees the same glyphs; forecast still requires husband owned (world skill). Each glyph is a hover target. [[ui/callout-hover]] `placement="below"`. Callout title and body live in src, keyed by kind — [[mechanics/weather]] `weather.forecast`. Tomorrow title **Tomorrow · {name}**, body of that kind. `{name}` is Clear / Rain / Dry / Flood / Drought. Weather swaps at the seam. React, not `paintMotion`. Coin does not tick for pump — the bill is recap **Water**. [[ui/docks]] [[mechanics/weather]]. `#debug-weather` — forecast table, not the HUD. [[ui/cheat]]

### Buttons

Right-hand cluster: **Multiplayer** **Almanac** **Cheat** **Pause** **Gear**. Not a `Panel`. Not logged. All `ui-btn-*.svg` faces `idle` / `hover` / `selected` / `disabled` via `btnFace`, icon in the row, no label. Do not mint a third icon size. Multiplayer leftmost. Multiplayer: guest and host both show the face. Selected while the in-play [[ui/multiplayer]] dialog is open. Click toggles that dialog. App `recapDay` blocks the open, same as Gear. Almanac and Cheat sit here, face only, no label. Selected while that panel is open. Click toggles it. Guest: Cheat is not rendered and the cluster closes up — [[ui/multiplayer]]. Pause toggles user pause on the sim clock; selected while paused, aria-label swaps **Pause**/**Resume**. Gear selected while the in-play [[ui/menu]] is open. Click toggles that shell. Pause stays live while the recap popup is open. Overlay pause does not replace this toggle.

### Overlay pause

Family / Market / Almanac open, or App `recapDay` set, and `role === 'off'`: pause the sim clock. App `paused`. Not `World.pause`. Close restores the previous pause state unless the player had already paused — same `resumeRef` pattern as MP lobby `setMpPanel`. Overlay pause is extra on top of user pause. Rising edge (enter `family` | `market` | `almanac` | recap popup from anything else): `resumeRef.current = !paused`, then pause. Falling edge (leave those four): if `resumeRef.current`, unpause and clear it. Switching among the four is not a falling edge. Host or guest: these overlays do not auto-pause. Pause button still toggles user pause. Build / Research / Cheat / Lens do not auto-pause. MP lobby pause is `setMpPanel`, separate. The day seam does not pause. On `clock.day` increment App `writeSlot`s when `world.local === 0` and closes the open panel. The **Day {n} Finished** notice is how the day is noticed, and opening the recap popup from it pauses under the same overlay rule as Family / Market / Almanac. [[ui/settings]] [[mechanics/day]] [[ui/notices]]

The clock text and the day bar are painted every frame by `paintMotion`, not by React. Any change to that markup must land in `motion.ts` too. React renders the same strings so the first frame is right. Weather glyphs are React. Coin does not tick for pump. Research progress left this ribbon with its `motion.ts` bind — [[ui/notices]]. The hovered machine's recipe arrow and its countdown are on the same contract, bound by `bindCraft` + `bindHud`, painted only while the machine is not idle — [[ui/recipe]].

## FPS

Three spans at the right end of the top ribbon, before the net chip. Play only, host and guest. `{n} FPS` off `Math.round`, `{n}ms` tick time to one decimal, `{n}MB` only if `performance.memory`. FPS colour warns under 60 and under 25. Paint from rAF / `paintMotion`, not React state every frame. FPS is an EMA of `1 / rAF dt`. Tick ms wraps `world.tick` / `host.pump` only. Not logged, not Save, not a Panel, not a `DirtyReason`. — [[architecture/tick]]

## Left ribbon

Order: **Build** **Research** **Market** **Lens** **Family**. The Lens face carries the active lens id as its note, plus *locked* and a **×** that clears lens and lock — [[ui/lens]]. Then, while **Build** is open or something is armed: a divider, **Demolish**, and **Cancel** once there is something to cancel. Almanac and Cheat are top-ribbon buttons. [[ui/multiplayer]]

Face states: `idle` / `hover` / `selected` / `disabled`. `ui-btn-*.svg`. Family face `ui-btn-family`. Cheat face `ui-btn-cheat`.

| button | act | selected |
|---|---|---|
| Build / Research / Market / Family | panel toggle | that panel open |
| Lens | dock toggle | `panel === 'lens'` |
| Demolish | `armDelete()` | `place.kind === 'delete'` |
| Rotate | `rotatePlace()` | never |
| Cancel | `cancelPlace` | never |

Divider and **Demolish** render iff `panel === 'build' || place.kind !== 'none'`. **Cancel** renders iff `place.kind !== 'none'`. `GHOST_SKUS` gates none of the three. Hidden ≠ disabled. [[ui/build]] [[ui/sensors]] [[ui/place]]. **Rotate** only renders for a sku in `ROTATABLE` (`buy-sprinkler-vert`). No rotatable sensor SKU. Cancel does not change lens. Build close (toggle, dock **×**), opening another panel: `leaveBuild` = `cancelPlace` and restores an unlocked Build peek. Close Build / Esc: cancel the armed pipe (`cancelPlace`). A locked lens stays. Right-click: `cancelPlace` only. Esc: `cancelPlace`; close HUD target and panel. Editor on: close editor first, stay seated, restore lens unless it was already `vehicles` — [[ui/vehicles]]. Build Water peeks pipes. Build Sensors peeks sensors. Build Automation peeks no lens. Build Storage peeks no lens — [[ui/lens]] [[ui/build]].

## Lenses

The lens picker is its own dock now — [[ui/lens]]. The rail button shows the active lens id under the label.

## Expand faces

Map-edge plates. HTML overlays over the canvas, not farm sprites. After `unlock-expand` only. Size `TILE * 0.85`, centred on `face.at`. Copy **Expand** + `<Coin n={face.price} />` except no-permit. Plates take pointer. Hidden when `world.local !== 0`. Command Center expansion row stays, `go: none`. [[mechanics/expansion]] [[mechanics/multiplayer]] `mp.guest` [[ui/notices]]

| state | plate | pointer |
|---|---|---|
| `world.local !== 0` | hidden | no plate |
| clickable | hover fill | pointer → `expand(id)` |
| poor (money) | same fill, muted type | pointer, click no-op |
| no permit | muted | no pointer; **No permit left** |

## Speech

HTML overlay. Chip follows the speaker. `'speech'` dirty binds the chip; ticker follows. Not React state. [[architecture/view]]

## Right column

Stops Window (editor on): top-right, same width as inspect. [[ui/vehicles]]. Command Center claims that anchor while the editor is off — [[ui/notices]]. Never both.

## Bottom-right

Queue (if any) then [[ui/inspect]]. Held name and the first look line: rustic — [[ui/type]]. The queue lists the first `QUEUE_SHOWN` errands, then one dimmer line reading **and {n} more** for the rest, the same shape a Command Center block uses past `NOTICE_GROUP_MAX` — [[ui/notices]]. `QUEUE_CAP` is 12. The progress bar stays under the list.

## Day banner

`clock.banner > 0` starts it. Copy **Day {n}**. Top of the play field, below the ribbon. Fade in, hold, fade out. Total `banner = 4` s. New farm already `banner = 4`. Seam sets it. `paintMotion` writes the day string. Not Pixi. [[ui/type]] [[mechanics/day]]

`e2e/hud.spec.ts` shots: `e2e/shots/hud.png` `build.png` `research.png` `almanac.png`, plus `family.png` and `recap.png`. Screenshot only. `e2e/buildings.spec.ts`: `#unlockall`, place every cell Build sku, `e2e/shots/buildings.png`.
