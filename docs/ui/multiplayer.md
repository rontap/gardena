# Multiplayer

P2P farm session. Rules [[mechanics/multiplayer]] [[architecture/net]] [[plans/early-access-1.1]]. Chrome [[ui/menu]] [[ui/hud]]. Type [[ui/type]].

`src/game/ui/multiplayer.tsx` owns the join dialog, in-play host dialog, in-play guest dialog, and catching-up overlay. Not the HUD face. Not the gear rows.

## Fail

One `text-sm text-roof` line. Last reason; a later attempt replaces it.

| reason | copy |
|---|---|
| `version` | This build is a different version. |
| `full` | This farm already has four gardeners. |
| `busy` | Host is busy letting someone in. |
| ICE / peer fail | Could not reach the host. |
| `host-left` | Host left. |
| `desync` | This farm drifted and could not be repaired. |
| `unusable` | This farm could not be used. |

Join dialog: `version` `full` `busy` ICE/peer fail `unusable` (welcome parse). Not `LoadFailReason`.

Overlay: optional error. `unusable` (resync parse). `desync` is `bye: kicked`. `host-left` is `bye: 'host-left'`.

`host-left` / `desync`: overlay shows the line, then startup four buttons with the same line.

## Startup join

Boot fourth button **Join Multiplayer** → this dialog. Same menu `Chrome` `relative w-[26rem]`. Inner `relative z-20 px-4 pt-4 pb-3 flex flex-col gap-2`. Illustration, **Gardena**, **1.4.0** stay. [[ui/changelog]] Not in-play. Not `#start_now`.

Copyable? No. Paste key: `input` `w-full` `text-base` `select-text` (body is `user-select: none`). **Join** `Btn` `w-full`. Fail line under the buttons.

× top-right, same control as `Window` close (`text-lg`, aria-label Close). **Cancel** `Btn` `w-full`. Esc / × / Cancel → four buttons. Boot shell has no dim; backdrop does not dismiss.

## In-play host

`absolute inset-0 z-20 flex items-center justify-center bg-ink/50`. `Chrome` `relative w-[26rem]`. Inner same column tokens. Backdrop pointer-down on the dim closes. × top-right. Esc closes. Close does not disconnect.

Read-only copyable key (host PeerJS id): `text-base` `select-text`. **Copy** `Btn` writes the key. No paste field.

Four seat rows, always, `text-base`:

| seat | label |
|---|---|
| 0 | P1 |
| 1 | P2 |
| 2 | P3 |
| 3 | P4 |

This page's seat appends ` (you)`. Occupied = index in `World.seats` (`in` or `away`). Empty slots: the row is shown. No names.

## In-play guest

Same shell, dim, × / Esc / backdrop as host. Close does not leave. No key. No **Copy**. No seat list. **Leave** `Btn` `w-full` — same leave as gear **Leave Multiplayer**. No `writeSlot`.

## Catching up

Host and every connected guest during join / resync. Covers HUD. `absolute inset-0 z-20 flex items-center justify-center bg-ink/50`. Map `pointer-events-none`. No backdrop dismiss. No ×. Esc does nothing.

`Chrome` `relative w-[26rem]`. Title **Catching up...** (`font-display` `text-sm`). Optional fail line `text-sm text-roof`.

## Hat

Same `actor.svg`. Crown group `id="hat"`. CSS `--hat` on that group, `fill: var(--hat)`. Not a filter. Band stays dirt-dark `#6b4423`, not `--hat`.

Off-palette. Not cottage.

| seat | `--hat` |
|---|---|
| 0 | `#d4a017` |
| 1 | `#ff3d8e` |
| 2 | `#2de8ff` |
| 3 | `#b85cff` |

Away actor is not drawn.

## Guest rails

`App.local !== 0`. Sequencer still drops illegal cmds.

| surface | guest |
|---|---|
| Cheat | hidden on the left ribbon. Hidden ≠ disabled. |
| Research | dock opens. Cards read-only. No start. Hover stays. |
| Family | overlay opens. Offers not clickable. |
| Shop Seeds / Utility | unchanged |
| Shop Automation + Building | **allowed** (arm + place + delete building): `buy-pumpjack` `buy-well` `buy-rain-tank` `buy-tap` `buy-chest` `buy-grinder` `buy-compost-box`. **disabled** (do not arm): `buy-pipe` `buy-valve` `buy-sprinkler` `buy-sprinkler-vert` `buy-sprinkler-large` `buy-tile-paved` `buy-tile-brick` `buy-tile-cobble` `buy-fence`. Blocked face `bg-ink/6 text-ink/35`, `aria-disabled`. Callout `skuDesc` only. |
| Recap | no dismiss. Esc does not dismiss. [[ui/docks]] |
| Inventory | this seat's 16. [[ui/docks]] |
| Chest | no open, no `swapChest`. [[ui/docks]] |

Pause face stays. Guests may toggle.

Assumption: guest in-play ×/Esc/backdrop close does not leave; terminal overlay errors then reuse the fail line on the startup four buttons.
