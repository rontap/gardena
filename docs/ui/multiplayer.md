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

Boot fourth button **Join Multiplayer** → this dialog. Same menu Chrome. Illustration, **Gardena**, wordmark stay. [[ui/changelog]] [[GLOBAL_VERSION]] Not in-play. Not `#start_now`.

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

Seat identity hex. Farm gardener: atlas `actor-hat` tint. Seat-row chips: that fill. Not CSS `--hat` on a world SVG. Band stays dirt-dark `#6b4423`.

Off-palette. Not cottage.

| seat | hex |
|---|---|
| 0 | `#d4a017` |
| 1 | `#ff3d8e` |
| 2 | `#2de8ff` |
| 3 | `#b85cff` |

Away actor is not drawn.

## Guest rails

`world.local !== 0`. Sequencer drops the three `mp.guest` cmds. Chrome that is not a `Cmd` sits here.

| surface | guest |
|---|---|
| Cheat | hidden on the top ribbon. Hidden ≠ disabled. [[ui/hud]] |
| Family | dock opens. Cards not clickable. Why: **Only the host can choose a skill.** [[ui/family]] |
| Expand plates | hidden. Command Center expansion row stays, `go: none`. [[ui/hud]] [[ui/notices]] |
| Recap | Close / Esc / backdrop live. `seeRecap` is not a `Cmd`. [[ui/docks]] |
| Inventory | this seat's 16. [[ui/docks]] |
| Chest / Freezer | open, `swapChest`, Load, Unload. [[ui/docks]] |
| Gear | **Save game** and **Download Save** live. **New Game** / **Load Save** / **Upload Save** greyed while connected. **Leave Multiplayer** — same leave as this dialog. day-seam / **Main menu** / host-leave `writeSlot` host-only. Lock line: **Starting or loading another farm is off while you are a guest.** [[ui/menu]] |

Build, Research, Market, sensors, sprinkler HUD, pipes, valves, paving, fence: same as host.

Pause face stays. Guests may toggle.

In-play guest × / Esc / backdrop close does not leave. Terminal overlay errors then reuse the fail line on the startup four buttons.
