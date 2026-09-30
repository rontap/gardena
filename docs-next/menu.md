# Menu, settings and changelog

Code: `ui/menu.tsx` (both menus and the page switch), `ui/settings.tsx` and `sim/settings.ts` (settings), `ui/changelog.ts`, `ui/changelog.tsx` and `ui/changelog.md` (version history), the start-up and menu handlers in `App.tsx`; see [[code-map]].

The screen before a farm is loaded, the Gear menu during play, and the two pages both of them open: **Settings** and the version history. [[shell]] describes the screen around a running farm; this page describes everything the player reaches from the title.

## Main menu

Shown when no farm is running. Behind it, a farm from `new World()` with a random seed is drawn full screen, not ticking, with no rails and no input (`backdrop` in `App.tsx`). It is not the farm **New Game** creates. The map fades and scales in once its first frame is drawn (`menu-canvas-in`); with reduced motion it appears without the animation.

The column, top to bottom: the `ui-menu.svg` picture, **Gardena**, the version number (a button, see Changelog), then:

| button | does |
|---|---|
| **New Game** | starts a new farm; the tutorial is on only when the save slot is empty ([[features/tutorial]]) |
| **Load Save** / **Load Save ({stamp})** | loads the save slot; greyed when the slot is empty; `{stamp}` is the slot's save time |
| **Upload Save…** | opens a file picker for a `.json` file, loads it, and writes it to the slot |
| **Join Multiplayer** | opens the join fields in the same column ([[features/multiplayer]]) |
| **Settings** | opens Settings |

**New Game**, **Load Save**, **Upload Save…** and the join start sound (`armSound`, [[systems/sound]]). A load that fails leaves the menu up with one red line under the buttons, by `LoadFailReason`: **The file is in an unknown format.**, **The file is not a gardena format**, **This savefile is from an older Gardena version and could not be loaded**, **The savefile could not be loaded**. A cancelled file picker is not a failure. After a multiplayer session ends, its reason is shown in the same place.

The URL `#start_now` or `?start=now` skips this menu and starts a new farm with the tutorial off; the e2e tests start this way.

## Gear menu

**Gear** on the top rail opens the same column over the running farm, on a dark backdrop. The farm keeps running unless the game is solo, where it pauses ([[shell]]). Clicking the backdrop, Escape, × or **Back to game** closes it.

| button | does |
|---|---|
| **Back to game** | closes the menu |
| **Quick Save** | writes the farm to the save slot and closes the menu |
| **Download Save…** | writes the slot and downloads the farm as `DOWNLOAD_NAME` |
| **Load Save** | replaces this farm with the slot, without asking |
| **Upload Save…** | replaces this farm with a file, without asking |
| **Settings** | opens Settings |
| **Exit to main menu** | writes the slot (not for a guest) and returns to the main menu |

While a multiplayer session is open, **Load Save** and **Upload Save…** are greyed, with **Starting or loading another farm is off while you are hosting — it would drop everyone who joined.** for the host and **Starting or loading another farm is off while you are a guest.** for a guest. The version number sits at the bottom of this column. The save slot and the automatic save at each day change are in [[systems/save]].

## Settings

Reached from the main menu and the Gear menu. On the main menu sound has not started, so a volume moved there is not heard. Settings belong to the browser, not to a farm: `sim/settings.ts` keeps them in local storage under `gardena.settings`, and every farm, new, loaded or uploaded, reads the same values. They are not in `Save`, not in `World`, and not sent to other players.

| row | stored as | default | does |
|---|---|---|---|
| **Music** | `music`, 0 to 100 | `VOLUME_DEFAULT` | volume of the songs |
| **Sound effects** | `effects`, 0 to 100 | `VOLUME_DEFAULT` | volume of every sound effect |
| **Reduced motion** | `reducedMotion` | off | picture effects and the menu farm hold still (`data-reduced-motion` on the page, `vfxReduced()`); the system's reduced-motion setting does the same |
| **Pause when this tab is not in front** | `pauseWhenHidden` | off | while the window has lost focus or the tab is hidden, music and sound effects hold; a solo farm also pauses, and resumes on return if this setting paused it |

A volume row is 20 bars in steps of 5, with a mark at `VOLUME_DEFAULT`; pointer and arrow keys set it, Home is 0 and End is 100. The gain is value ÷ `VOLUME_DEFAULT`, so the default plays at the level each song and sound was made at ([[systems/sound]]).

The page edits a draft. Moving a volume plays the draft volume at once, so the player hears it while choosing. **Save** writes the draft and returns to the menu. **Revert to default** sets the draft to `SETTINGS_DEFAULT` and writes nothing. ← (**Back**), × and closing the menu discard the draft and restore the saved volumes.

**Pause when this tab is not in front** pauses the farm only in a solo game; in a multiplayer session pause belongs to the host. It holds music and sound effects on the player's own client in every game, including a farm that was already paused. It does not resume a farm the player paused themselves.

## Changelog

Clicking the version number shows the version history in the menu column, widened; clicking it again, or ×, returns to the buttons. While the join fields are open the version number does nothing.

The text is `src/game/ui/changelog.md`, written by hand ([[process/update-notes]]). `changelog.ts` imports it as text and parses it once at load (`parseChangelog` into `RELEASES`); nothing generates it. The file order is the display order, newest first.

Left: one row per release, **{id} {name}**. Right: every release, each with its heading, its summary, and its lines. Clicking a row scrolls the right side to that release; scrolling the right side selects the release at its top.

### File format

```
# {id} {name}

{summary}

- {emoji} {text}
  - {note}
  - {emoji} {nested text}
    - {nested note}
```

- A release starts with `# `; the first word after it is the `id`, the rest the name. Both are required, and an `id` may appear once.
- The summary is the first paragraph after the heading, required.
- A line is `- ` at column 0, optionally starting with one kind emoji from `KIND_EMOJI`: 🎉 `major-feature`, ✨ `feature`, 🔧 `improvement`, 🐛 `bugfix`, 🚫 `deprecation`. No emoji means `improvement`; any other leading emoji is an error.
- Two spaces in, a line without an emoji is a note on the line above; with an emoji it is a nested change, allowed only under 🎉. Four spaces in is a note on a nested change. No deeper indent, no tabs.
- A line ending in `NOTE_SIGN` is the developer's own remark: in the summary it joins the summary, anywhere else it is skipped.
- Anything else, including headings of other levels, links, emphasis and HTML, is an error.

Every error throws `ChangelogParseError` when the module loads, so a malformed file stops the game from starting and fails `changelog.test.ts`.

## Invariants

| id | rule | test |
|---|---|---|
| `settings.store` | settings live in local storage, never in `Save`, `World` or the wire | none |
| `settings.draft` | only **Save** writes; **Revert to default**, **Back** and × do not | none |
| `settings.hear` | a draft volume is heard while the page is open; leaving without **Save** restores the saved volumes | none |
| `settings.solo` | **Pause when this tab is not in front** pauses the farm only in a solo game; it holds sound in every game | none |
| `changelog.parse` | a malformed `changelog.md` throws `ChangelogParseError`; a well-formed one parses to `RELEASES` in file order | `changelog.test.ts` |

## When you change this

- A new setting: a field on `Settings`, its default in `SETTINGS_DEFAULT`, `decode`, `sameSettings`, a row in `SettingsPage`, and the code that reads `settings()` or App's `prefs`.
- A new menu button: `menu.tsx`, both `mode`s if it belongs in both; decide whether a multiplayer session greys it.
- The changelog format: `parseChangelog`, its fixtures in `changelog.test.ts`, and [[process/update-notes]].
- The version number shown here is written only by the orchestrator (CLAUDE.md, Version text).

## Decisions

- Settings are per browser, not per farm: a player who loads another farm keeps their volume and motion settings.
- The changelog is a hand-written file parsed strictly, so a formatting mistake fails the build instead of showing wrong text.
