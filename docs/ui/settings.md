# Settings

Player options behind the gear. One page inside the Menu Chrome. Menu-local, like [[ui/changelog]] — not Overlay, not Window, not a `Panel`. [[ui/menu]] [[ui/type]]

Not per farm. `sim/settings.ts` writes `localStorage` key `gardena.settings`; a new farm, a loaded save, and an uploaded save all read the same values. Not in `Save`. Not in `World`. Not on the wire — [[architecture/net]] carries no settings.

`Settings` is `{ reducedMotion: boolean; pauseWhenHidden: boolean }`. `SETTINGS_DEFAULT` is both false. `settings()` returns the live value; `saveSettings(next)` writes it and replaces the live value. Missing key or unreadable text reads `SETTINGS_DEFAULT` — that is the only recovery, and it is at the storage boundary.

## Page

`MenuPage` arm `{ kind: 'settings' }`. Play only. The boot shell has no gear and no Settings button.

Header row: back button (`←`, `aria-label` **Back**), then **Settings** in the display face. Chrome × on this page goes home, same as changelog.

One `Checkbox.Root` per option, `aria-label` the option name, a `text-base` name and a `text-xs` `ink/55` line under it. Radix. No `input type=checkbox`.

| option | default | does |
|---|---|---|
| `reducedMotion` | off | `[data-reduced-motion]` on `<html>`, and `vfxReduced()` true |
| `pauseWhenHidden` | off | solo pause on window `blur` / `visibilitychange` hidden, resume on `focus` / visible |

`SettingsPage` holds a draft in `useState`, seeded from the value App passes. **Revert to default** sets the draft to `SETTINGS_DEFAULT`; it does not write. **Save** calls `onSave(draft)` and returns to home. Back and × discard the draft. Both buttons sit in one right-aligned row under the options.

## Reduced motion

`prefers-reduced-motion: reduce` and this option are the same effect, either one is enough. `src/index.css` carries both selectors: the media block and `[data-reduced-motion]`. App writes the attribute from `prefs`. `view/vfx.ts` `vfxReduced()` reads the media query and `settings()` on every call — not a module-load const, so a save takes hold without a reload.

## Pause when this tab is not in front

Solo only. Guard is `hostRef` / `guestRef` both undefined, the same rule as the overlay pause — a multiplayer session's pause is the host's, and one player switching tabs does not stop everyone. [[architecture/net]]

`hiddenHeld` records that this handler is the one holding the pause. A farm the player paused themselves is left alone: `away()` returns early when already paused, so `back()` does not resume it.

## Invariants

`settings.store` — settings live in `localStorage`, never in `Save`, never in `World`, never on the wire. New farm, loaded save, uploaded save: same values.

`settings.draft` — Revert to default writes nothing. Only Save writes. Back and × discard.

`settings.solo` — `pauseWhenHidden` and the end-of-day pause act only while `hostRef` and `guestRef` are both undefined.
