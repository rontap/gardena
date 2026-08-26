# Changelog

Player-facing release list in the menu. Menu Chrome. Changelog wider than home. Not Overlay. Not Window. Not a `Panel`. Not a HUD overlay. [[ui/menu]] [[architecture/changelog]] [[ui/type]] [[standards/update-notes]]

`changelog.tsx` renders only. No props. No `World`.

Copy is `src/game/ui/changelog.md`. Source of truth. Manual edits only. `changelog.ts`: `import src from './changelog.md?raw'`; `RELEASES = parseChangelog(src)` at module load. Vite `?raw`. Parser reads. It does not write. No markdown library. No generator, dump, codegen. Do not paste a `RELEASES` dump. Do not fetch. Do not import from `docs/`. Drafts `changelogs-*.md` are not sources. This note does not invent player copy.

`RELEASES[0]` is the first heading in that file. File order = array order = render order. This note does not pin `[0]` to a version. Version: [[GLOBAL_VERSION]].

## Shell

Menu Chrome wider on changelog than home. Illustration, **Gardena**, wordmark stay. `Changelog` replaces the home buttons (and fail line). Join still wins the body while `joining`.

| mode | dim | backdrop | Esc |
|---|---|---|---|
| boot | none | none | join-close only (App). Changelog does not change that. No Esc-to-home. |
| play | dim | dismiss → `onClose`, unmounts Menu | closes the menu |

Chrome ×:

| state | does |
|---|---|
| changelog (boot and play) | Menu → home |
| boot joining, home | `onJoinClose` |
| play home | `onClose` |

Boot home: no ×.

Show ×: play, or joining, or `{ kind: 'changelog' }`.

## Wordmark

The version line is a `button`. `aria-label="Version history"`. `aria-pressed` true while changelog. Hover/open uses Btn selected.

Click toggles home ↔ changelog. While boot `joining`: no-op. `joining` true → `MenuPage` forced home.

## Body

Scroll pane. Column already padded — do not pad again.

Array order is render order.

Per release, body face only (not Press Start):

1. `{id} {name}`
2. `summary`
3. bullets under the heading

Hairline between releases, not after the last.

No body title. No lorem.

## Bullets

One emoji per `ChangeKind`, on the bullet, not the release header. Markers sit under the heading, never left of `{id} {name}`.

| kind | emoji |
|---|---|
| `major-feature` | 🎉 |
| `feature` | ✨ |
| `improvement` | 🔧 |
| `bugfix` | 🐛 |
| `deprecation` | 🚫 |

Change line: emoji then `text`. `notes` under that change, indent past the parent emoji. Nested `changes` under a major-feature indent one step, same bullet shape. Empty `notes` / empty nested `changes` render nothing.

Item / building / ui / multiplayer lines have no notes and no nested changes. Mechanic lines may show `notes` bullets. Nested emoji `changes` stay empty.

## Dialect

Parser dialect: [[architecture/changelog]]. `parseChangelog` is total: well-formed `src` → `readonly Release[]`. Ill-formed → throw `ChangelogParseError`. No `??` / `||` recovery.

`topLineShape` is a predicate on `Change.text`. Vitest uses it. `parseChangelog` does not call it. It does not throw.

Named invariant, testable only. Test name is this text:

A top-level changelog line is `{emoji} {New|Added|Removed|Changed|Fixed bug} {building|item|ui|mechanic|multiplayer} {*}`.

| type | notes |
|---|---|
| item / building / ui / multiplayer | `notes` is `[]`. No nested `changes`. |
| mechanic | top-level; keyword `mechanic`; `notes` bullets allowed for the concept only. Nested emoji `changes` stay empty. New items/buildings are not nested under a mechanic and do not get bullets. |

One subject per top-level line.

| verb | shape |
|---|---|
| Added / New | `Added {type}: {Name}. {what it does}.` |
| Changed | `Changed {type}: previously, it {…}, now {…}.` |
| Removed | `Removed {type}: {Name}. {what the player loses}.` |
| Fixed bug | `Fixed bug {type}: {SVO what was wrong and what happens now}.` |

Required form: `Added building: Freezer. Nine slots instead of six, and fruit inside still does not rot.`

Complete SVO sentences. Display-level words only. Never unsurfaced internals. Never code, protocol, save version, research ids. `Fixed bug` lines describe player-visible misbehavior and the fix, not the implementation.

## Tests

Vitest `src/game/ui/changelog.test.ts`. Dialect fixtures: structure, not player copy. [[standards/testing]] copy exemption does not cover the parser or this invariant. Do not lock dialect fixtures to shipped names, summaries, or bullet text.

`topLineShape` true/false fixtures. True: `Added building: Freezer. Nine slots instead of six, and fruit inside still does not rot.` False: `Large freezer.`; `Added a pulser, a counter, and a day sensor`; list-then-verb.

Shipped `RELEASES` top-level `Change.text`: assert `topLineShape` and the notes / nested-`changes` clauses.
