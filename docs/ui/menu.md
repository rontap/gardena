# Menu

Startup and in-play gear share one Chrome shell. Type [[ui/type]]. Chrome tokens. Buttons are `Btn` `w-full`. [[architecture/save]] [[mechanics/tutorial]]

Chrome home and join narrower than changelog. Inner column padded.

Top of the column: `ui-menu.svg` (illustration only — no text in the SVG). Then `h1` **Gardena**. Then wordmark — [[ui/changelog]] [[GLOBAL_VERSION]]. Then the body. Then fail copy if any (home only).

No `$`. No Window title (the `h1` is the name). Not Overlay. Not Window. Not a `Panel`.

## Pages

Menu-local `useState<MenuPage>({ kind: 'home' })`. Dies with Menu.

`MenuPage` = `{ kind: 'home' } | { kind: 'changelog' } | { kind: 'settings' }`. Settings is play only — [[ui/settings]].

| body | when |
|---|---|
| JoinFields | boot `joining` |
| `Changelog` | `{ kind: 'changelog' }` and not joining |
| `SettingsPage` | `{ kind: 'settings' }`, play, and not joining |
| home buttons + fail | else |

`joining` true → force `{ kind: 'home' }`. JoinFields still wins.

Wordmark is a `button`, `aria-label="Version history"`. Hover/open uses Btn selected. `aria-pressed` while changelog. Click toggles home ↔ changelog. While joining: no-op.

Chrome × (aria-label Close):

| state | does |
|---|---|
| changelog (boot and play) | Menu → home |
| settings (play) | Menu → home |
| boot joining, home | `onJoinClose` |
| play home | `onClose` |

Show ×: play, or joining, or changelog. Boot home: no ×.

## Startup

First paint. A `new World` (random seed, MemorySink) is the backdrop: map full-bleed, **no HUD**, **no tick**. Camera default. Map `pointer-events-none`. Not the play farm — New Game constructs a different `World`. Outer `absolute inset-0 bg-grass`. Inner starts `menu-canvas-wait` (opacity 0). After `WorldView.mount` (atlas + Pixi `app.init`) and first `layout`, `MapView.onReady` swaps to `menu-canvas-in`: 0.6s ease-out, `transform-origin` center, opacity 0 / scale 0.7 → opacity 1 / scale 1, `both`. No wall-clock delay. `prefers-reduced-motion: reduce`, or **Reduced motion** in [[ui/settings]], skips the motion.

Menu shell `absolute inset-0 z-20 flex items-center justify-center`. No `bg-dirt`. No dim. Backdrop does not dismiss. Esc is App join-close only — not changelog-to-home. Boot home: no ×. Changelog × → home.

Skip this screen only when the fragment is `start_now` (`#start_now`) or `unlockall` (`#unlockall`) → new farm, tutorial off, play. `#unlockall` then `unlockAll()` — [[ui/cheat]].

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

`absolute inset-0 z-20 flex items-center justify-center bg-ink/50`. Backdrop pointer-down on the dim closes the menu (unmounts), including from changelog. × on home closes the menu; × on changelog or settings → home. Esc closes the menu. Close → farm.

Seven buttons, in order:

| Button | Does |
|---|---|
| **New Game** | Discard current farm. New farm. Play. No confirm. |
| **Load Save** | Discard current farm. Same as startup Load, including the stamp on the label. No confirm. Greyed if `!slotExists()`. |
| **Upload Save** | Discard current farm. Same as startup Upload. No confirm. |
| **Save game** | `writeSlot(dump(world))`. Close. Farm. |
| **Download Save** | Download `gardena.json`. Stay on the shell. |
| **Settings** | `MenuPage` → `{ kind: 'settings' }`. Same shell. Not play. [[ui/settings]] |
| **Main menu** | `writeSlot(dump(world))` unless guest, then `toStartup` — startup shell, no `World`. No confirm. |

While connected (host or guest of an MP session): **New Game** **Load Save** **Upload Save** `Btn disabled`. Host: **Save game** + **Download Save** stay. Guest: those five greyed; add **Leave Multiplayer** — same leave as the in-play guest dialog. No `writeSlot`. **Settings** and **Main menu** stay live for host and guest; **Main menu** skips the `writeSlot` for a guest, the farm is not theirs. [[ui/multiplayer]]

Gear selected while this shell is open. Click gear again toggles it shut. Opening any other panel replaces this one.

While `seam.kind === 'recap'`: do not open, do not show. Recap stays exclusive. [[ui/docks]]

## Fail

Stay on the shell. Do not start a farm. One `text-sm text-roof` line under the buttons. Same strings for Load and Upload. Last reason; a later attempt replaces it. Gone when play starts.

Join dialog showing → MP reasons, not `LoadFailReason`. [[ui/multiplayer]]

`host-left` / `desync` after a session: four-button startup, MP line.

| `LoadFailReason` | copy |
|---|---|
| `unknown-format` | The file is in an unknown format. |
| `not-gardena` | The file is not a gardena format |
| `version` | This savefile is from an older Gardena version and could not be loaded |
| `unusable` | The savefile could not be loaded |

Missing slot is not a reason — Load is greyed.
