# Menu

Startup and in-play gear share one Chrome shell. Type [[ui/type]]. Chrome tokens. Buttons are `Btn` `w-full`. [[architecture/save]] [[mechanics/tutorial]]

`Chrome` `relative w-[26rem]`. Inner column `relative z-20 px-4 pt-4 pb-3 flex flex-col gap-2`.

Top of the column: `ui-menu.svg` `w-full` (illustration only — no text in the SVG). Then `h1` **Gardena** (`font-display` `text-base` `leading-none` `text-center`). Then **1.1.0** (`text-sm` `text-ink/45` `text-center`). Then the buttons. Then fail copy if any.

No `$`. No Window title (the `h1` is the name).

## Startup

First paint. A `new World` (random seed, MemorySink) is the backdrop: map full-bleed, **no HUD**, **no tick**. Camera default. Map `pointer-events-none`. Not the play farm — New Game constructs a different `World`.

Menu shell `absolute inset-0 z-20 flex items-center justify-center`. No `bg-dirt`. No ×. Backdrop does not dismiss. Esc does nothing.

Skip this screen only when the fragment is `start_now` (`#start_now`) → new farm, tutorial off, play.

Four buttons, in order:

| Button | Does |
|---|---|
| **New Game** | New farm. Play. |
| **Load Save** | `readSlot` + `parse`. Play that farm. `Btn` `disabled` when `!slotExists()`. Label **Load Save (YYYY/MM/DD HH:MM)** from `Save.savedAt` local time when the slot has a stamp; **Load Save** when it does not. |
| **Upload Save** | File picker `accept=".json,application/json"`. `parse` the text. Play that farm. |
| **Join Multiplayer** | Join dialog. Same Chrome. Not play. [[ui/multiplayer]] |

Picker cancel is not a fail. No new reason line.

## In play

Same shell over the farm. HUD and map stay. Sim not frozen.

`absolute inset-0 z-20 flex items-center justify-center bg-ink/50`. Backdrop pointer-down on the dim closes. × top-right, same control as `Window` close (`text-lg`, aria-label Close). Esc closes. Close → farm.

Five buttons, in order:

| Button | Does |
|---|---|
| **New Game** | Discard current farm. New farm. Play. No confirm. |
| **Load Save** | Discard current farm. Same as startup Load, including the stamp on the label. No confirm. Greyed if `!slotExists()`. |
| **Upload Save** | Discard current farm. Same as startup Upload. No confirm. |
| **Save game** | `writeSlot(dump(world))`. Close. Farm. |
| **Download Save** | Download `gardena.json`. Stay on the shell. |

While connected (host or guest of an MP session): **New Game** **Load Save** **Upload Save** `Btn disabled`. Host: **Save game** + **Download Save** stay. Guest: those five greyed; add **Leave Multiplayer** — same leave as the in-play guest dialog. No `writeSlot`. [[ui/multiplayer]]

Gear selected while this shell is open. Click gear again toggles it shut. Opening any other panel replaces this one.

While `seam.kind === 'recap'`: do not open, do not show. Recap stays exclusive. [[ui/docks]]

## Fail

Stay on the shell. Do not start a farm. One `text-sm text-roof` line under the buttons. Same strings for Load and Upload. Last reason; a later attempt replaces it. Gone when play starts.

Join dialog showing → MP reasons, not `LoadFailReason`. [[ui/multiplayer]]

`host-left` / `desync` after a session: four-button startup, MP line.

| `LoadFailReason` | copy |
|---|---|
| `not-gardena` | This file is not a Gardena save. |
| `version` | This save could not be loaded because of a version difference. |
| `unusable` | This file could not be used. |

Missing slot is not a reason — Load is greyed.
