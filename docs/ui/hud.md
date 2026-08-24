# HUD

Map full-bleed. Ribbons and docks sit on top. Controls `pointer-events-auto`. Map under stays live. Chrome tokens [[art/_index]]. No `$`. Coin is gold integer + silver tenths (`moneyParts`).

Type scale: [[ui/type]].

## Top ribbon

`Chrome` `absolute top-4 left-4 right-4 z-20` `h-14`.

Left → right, separated by `w-px bg-ink/20` rules:

1. **Gardena** — `font-display`, `text-base`. The wordmark. Always there.
2. `Coin` (`world.money`), `text-lg` semibold.
3. Phase glyph, then **Day {n} · {phase name}** over a `w-28` `bg-ripe` day bar (`clock.t / DAY_SECONDS`).
4. Research job when `job.kind === 'run'`: *Researching* **{name}** · **{n}s** over a `bg-leaf` bar. Hidden when idle.
5. Pushed right: **digs {n} · mines {n}**, `text-sm` `text-ink/45`. These are the counters the tool research gates read — [[mechanics/research]].
6. Far right: **Multiplayer** then **Pause** then **Gear**. All `ui-btn-*.svg` faces `idle` / `hover` / `selected` / `disabled` via `btnFace`, icon `h-11 w-11` in the `h-14` row, no label. Do not mint a third icon size. `pointer-events-auto` (the ribbon Chrome stays `pointer-events-none`). Multiplayer (`ui-btn-multiplayer.svg`) left of Pause. Guest and host both show the face. Selected while the in-play [[ui/multiplayer]] dialog is open. Click toggles that dialog. Recap blocks the open, same as Gear. Pause (`ui-btn-pause.svg`) toggles the sim clock; selected while paused, aria-label swaps **Pause**/**Resume**. Gear (`ui-btn-gear.svg`). Gear selected while the in-play [[ui/menu]] is open. Click toggles that shell. Recap blocks the open, same as other panels. Pause stays live during recap (the sim is not ticking anyway).

The clock text, the day bar, the research name and its seconds are painted every frame by `paintMotion`, not by React. Any change to that markup must land in `motion.ts` too: `[data-clock]` `[data-day-bar]` `[data-research-left]` `[data-research-secs]` `[data-research-bar]`. React renders the same strings so the first frame is right.

## Left ribbon

`Chrome` `absolute top-20 left-4 z-20` `w-24`. Icon `h-11 w-11` above, `text-sm` semibold label below.

Order: **Shop** **Build** **Research** **Market** **Lens** **Family** **Almanac** **Cheat**. Then if build cluster: divider, **Delete** **Rotate** **Cancel**. Guest: **Cheat** hidden. Hidden ≠ disabled. [[ui/multiplayer]]

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

Cancel does not change lens. Shop close (toggle, dock **×**), leaving the shop system: `leaveShop` = `cancelPlace`; if `lens === 'pipes'` or `lens === 'sensors'` then `off`. Matches Esc. Leave `water` / `land` / `ripe` / `kind` / `rarity`. Right-click: `cancelPlace` only. Esc: `cancelPlace`; pipes or sensors → `off`; close HUD target and panel. Build **Sensors** tab sets `lens = 'sensors'` and does not arm. Switching Build category does not force the lens off.

## Lenses

The lens picker is its own dock now — [[ui/lens]]. The rail button shows the active lens id under the label.

## Bottom-right

`absolute right-4 bottom-4 z-20` `w-80`. Queue (if any) then [[ui/inspect]].

`e2e/hud.spec.ts` shots: `e2e/shots/hud.png` `shop.png` `research.png` `almanac.png`, plus `family.png` (Family overlay open) and `recap.png`. Screenshot only.
