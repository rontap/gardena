# Settings

Player options behind the gear. One page inside the Menu Chrome. Menu-local, like [[ui/changelog]] — not Overlay, not Window, not a `Panel`. [[ui/menu]] [[ui/type]]

Not per farm. `sim/settings.ts` writes `localStorage` key `gardena.settings`; a new farm, a loaded save, and an uploaded save all read the same values. Not in `Save`. Not in `World`. Not on the wire — [[architecture/net]] carries no settings.

`Settings` is `{ reducedMotion: boolean; pauseWhenHidden: boolean; music: number; effects: number }`. `SETTINGS_DEFAULT` is both booleans false and both volumes `VOLUME_DEFAULT` (50). `settings()` returns the live value; `saveSettings(next)` writes it and replaces the live value. Missing key or unreadable text reads `SETTINGS_DEFAULT` — that is the only recovery, and it is at the storage boundary.

## Page

`MenuPage` arm `{ kind: 'settings' }`. Play only. The boot shell has no gear and no Settings button.

Header row: back button (`←`, `aria-label` **Back**), then **Settings** in the display face. Chrome × on this page goes home, same as changelog.

The two volumes first, then one `Checkbox.Root` per option, `aria-label` the option name, a `text-base` name and a `text-xs` `ink/55` line under it. Radix. No `input type=checkbox`.

| option | default | does |
|---|---|---|
| `music` | 50 | `musicGain(music / 50)` on Tone's destination: every song |
| `effects` | 50 | `effectsGain(effects / 50)` on the sound-effect context's output gain — [[systems/sound]] |
| `reducedMotion` | off | `[data-reduced-motion]` on `<html>`, and `vfxReduced()` true |
| `pauseWhenHidden` | off | solo pause on window `blur` / `visibilitychange` hidden, resume on `focus` / visible |

`SettingsPage` holds a draft in `useState`, seeded from the value App passes. **Revert to default** sets the draft to `SETTINGS_DEFAULT`; it does not write. **Save** calls `onSave(draft)` and returns to home. Back and × discard the draft. Both buttons sit in one right-aligned row under the options.

## Volume

`Volume` in `ui/settings.tsx`, one per volume. Not `Slider` from `frame.tsx`, not `input type=range`. A row of the name (`text-base`) and the value as `N%` (`text-xs`, `ink/55`), then 20 bars of 5 each, rising from a quarter of the row's height to its full height, left to right. A bar at or under the value is `bg-ink`, above it `bg-ink/15`. A mark under the bars at 50% shows the default.

`role="slider"`, `aria-valuemin` 0, `aria-valuemax` 100, `aria-valuenow`, `aria-valuetext` `N%`, `tabIndex` 0, border `ink` on `focus-visible`. Pointer down on the bars captures the pointer and sets the value to the bar under it, rounded up to the next 5; moving while captured keeps setting it. Left and Down take 5 off, Right and Up add 5, Home is 0, End is 100.

The value is a volume percentage; the gain is `value / VOLUME_DEFAULT`, so 50 is the level the songs and sounds set, 100 twice that, 0 silent. The page plays the draft: every change to a draft volume calls `onVolume`, App's `volumeSound`, so the player hears the level while choosing it. That is not a write. When the page leaves, by Save, Back, ×, or a click outside the menu, it calls `onVolume` with `settings()`, the saved values. App calls `volumeSound` from `prefs` on start and on every Save.

## Reduced motion

`prefers-reduced-motion: reduce` and this option are the same effect, either one is enough. `src/index.css` carries both selectors: the media block and `[data-reduced-motion]`. App writes the attribute from `prefs`. `view/vfx.ts` `vfxReduced()` reads the media query and `settings()` on every call — not a module-load const, so a save takes hold without a reload.

## Pause when this tab is not in front

Solo only. Guard is `hostRef` / `guestRef` both undefined, the same rule as the overlay pause — a multiplayer session's pause is the host's, and one player switching tabs does not stop everyone. [[architecture/net]]

`hiddenHeld` records that this handler is the one holding the pause. A farm the player paused themselves is left alone: `away()` returns early when already paused, so `back()` does not resume it.

## Invariants

`settings.store` — settings live in `localStorage`, never in `Save`, never in `World`, never on the wire. New farm, loaded save, uploaded save: same values.

`settings.draft` — Revert to default writes nothing. Only Save writes. Back and × discard.

`settings.hear` — a draft volume is heard while the page is open. Leaving the page without Save plays the saved volumes again.

`settings.solo` — `pauseWhenHidden` acts only while `hostRef` and `guestRef` are both undefined. There is no end-of-day pause — [[mechanics/day]].
