# Changelog

Player-facing release list in the menu. Menu-local view state. Not World. Not Save. Not a `Panel` arm. Not a mechanic. [[architecture/modules]] [[architecture/save]] [[ui/menu]]

Assumption: boot `joining` stays App-owned; Menu forces home when `joining`; wordmark click is a no-op while joining.

Wordmark **1.7.0**. Changelog UI does not own `SAVE_VERSION`, dump `version`, or `PROTOCOL`. No migrate.

Assumption: wordmark **1.7.0**; this note does not invent 1.7 `RELEASES` copy.

## Files

| file | owns |
|---|---|
| `src/game/ui/changelog.tsx` | `ChangeKind`, `Change`, `Release`, `RELEASES`, `Changelog` body |
| `src/game/ui/menu.tsx` | `MenuPage`, wordmark click, open/close, whether `Changelog` is shown |
| `src/game/ui/frame.tsx` | `Chrome` / `Window` / `Overlay` as they are. No new export. |

Do not create `src/` here. Copy is a static const. Not fetched. Not imported from `docs/`. Not `defs/`. UI-UX + coder own the strings. This note does not.

`App` `Panel` is unchanged. No `'changelog'`.

## Types

```
ChangeKind = 'bugfix' | 'improvement' | 'feature' | 'deprecation' | 'major-feature'

Change =
  | { kind: 'bugfix'; text: string; notes: readonly string[] }
  | { kind: 'improvement'; text: string; notes: readonly string[] }
  | { kind: 'feature'; text: string; notes: readonly string[] }
  | { kind: 'deprecation'; text: string; notes: readonly string[] }
  | { kind: 'major-feature'; text: string; notes: readonly string[]; changes: readonly Change[] }

Release = {
  id: string
  name: string
  summary: string
  changes: readonly Change[]
}

RELEASES: readonly Release[]

MenuPage = { kind: 'home' } | { kind: 'changelog' }
```

`notes` is sub-bullets. Always present. None → `[]`. Only `major-feature` nests `Change[]`. None → `changes: []`. No `Partial`. No optional that means unsure.

`RELEASES` spans Beta-1 through the current wordmark `1.7.0`. Array order is render order. `id` is the version key the copy owner names. Duplicate `id` illegal.

`Changelog` reads `RELEASES` in-module. No props for copy. No `World`.

## Open / close

`menu.tsx` owns it. `useState<MenuPage>({ kind: 'home' })`. Not App. Not `World`. Dies when `Menu` unmounts.

Open: click the existing wordmark `<p>1.7.0</p>` (boot and play). Sets `{ kind: 'changelog' }`. Toggle: click again → `{ kind: 'home' }`. While boot `joining`: no-op.

Close changelog (Menu):

- wordmark click while `{ kind: 'changelog' }`
- Chrome × while `{ kind: 'changelog' }` (boot and play)

Close menu (App, unchanged): play backdrop, play Esc, gear toggle. Unmounts `Menu`. Boot Esc still only `setJoining(false)`.

Chrome ×:

| state | does |
|---|---|
| changelog | Menu → home |
| boot joining, home | `onJoinClose` |
| play home | `onClose` |

`joining` true → MenuPage home. JoinFields still wins the body.

## Shell

Two menu shells only. Boot: no dim, no backdrop dismiss, no × on home. Play: `bg-ink/50`, backdrop dismiss, × on home. [[ui/menu]]

Changelog is Chrome body, same as JoinFields. Illustration, **Gardena**, wordmark stay. Not `Overlay` (`Overlay` always dims and backdrop-dismisses). Not `Window`. Not a second `absolute inset-0`. Not a HUD overlay. Chrome stays `relative w-[26rem]`.

No new SVG.

## Illegal

- `Panel` arm `'changelog'`
- field on `World` / `Save` / `Cmd`
- fetch, import from `docs/`, copy in `defs/`
- `Overlay` or a third shell
- this note bumping `SAVE_VERSION` / dump `version` / `PROTOCOL`
- migrate
- `Partial<Release>` / omitted `notes` / `bugfix` with nested `Change[]`
- new SVG
- App Esc closing changelog on boot
