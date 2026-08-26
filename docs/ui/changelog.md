# Changelog

Player-facing release list in the menu. Menu Chrome. Changelog `w-[36rem]`; home `w-[26rem]`. Not Overlay. Not Window. Not a `Panel`. Not a HUD overlay. [[ui/menu]] [[architecture/changelog]] [[ui/type]] [[standards/update-notes]]

| file | owns |
|---|---|
| `src/game/ui/changelog.md` | player copy. Shipped. Not `docs/`. Only `RELEASES` source. Manual edits only. |
| `src/game/ui/changelog.ts` | `ChangeKind`, `Change`, `Release`, `KIND_EMOJI`, `parseChangelog`, `ChangelogParseError`, `RELEASES`, `topLineShape` |
| `src/game/ui/changelog.tsx` | `Changelog` body only. Imports `RELEASES` / `KIND_EMOJI`. No copy. |
| `src/game/ui/changelog.test.ts` | dialect fixtures (structure, not copy); `topLineShape` true/false; shipped `RELEASES` top-level walk |
| `src/game/ui/menu.tsx` | `MenuPage`, wordmark click, whether `Changelog` is shown |

`changelog.tsx` renders only. No props. No `World`.

Copy is `src/game/ui/changelog.md`. Source of truth. Manual edits only. `changelog.ts`: `import src from './changelog.md?raw'`; `RELEASES = parseChangelog(src)` at module load. Vite `?raw`, same as SVG. Parser reads. It does not write. No markdown library. No generator, dump, codegen. Do not paste a `RELEASES` dump. Do not fetch. Do not import from `docs/`. Drafts `changelogs-facts.md` / `changelogs-player.md` / `changelogs-garden.md` / `changelogs-synth.md` are not sources. This note does not invent player copy.

`RELEASES[0]` is the first heading in that file. File order = array order = render order. This note does not pin `[0]` to a version.

Wordmark **1.8.2**. This note does not own `SAVE_VERSION` / dump `version` / `PROTOCOL`. Do not bump the wordmark.

## Shell

Menu Chrome `relative w-[36rem]` on changelog. Home and join stay `relative w-[26rem]`. Illustration, **Gardena**, **1.8.2** stay. `Changelog` replaces the home buttons (and fail line). Join still wins the body while `joining`.

| mode | dim | backdrop | Esc |
|---|---|---|---|
| boot | none | none | join-close only (App). Changelog does not change that. No Esc-to-home. |
| play | `bg-ink/50` | dismiss → `onClose`, unmounts Menu | closes the menu (unchanged) |

Chrome × (`text-lg`, aria-label Close, `text-ink/60 hover:bg-dirt hover:text-house`):

| state | does |
|---|---|
| changelog (boot and play) | Menu → home |
| boot joining, home | `onJoinClose` |
| play home | `onClose` |

Boot home: no ×.

Show ×: play, or joining, or `{ kind: 'changelog' }`.

## Wordmark

The **1.8.2** line is a `button`. `cursor-pointer`. `aria-label="Version history"`. `aria-pressed` true while changelog.

Rest: `text-sm text-ink/45 text-center px-2 py-0.5`. Hover: `hover:bg-dirt hover:text-house`. Open: `bg-ink text-house` (Btn selected).

Click toggles home ↔ changelog. While boot `joining`: no-op. `joining` true → `MenuPage` forced home.

## Body

`scroll-pane max-h-[min(32rem,calc(100vh-14rem))] overflow-y-auto flex flex-col gap-3`. Column already `px-4` — do not pad again.

Array order is render order.

Per release, body face only (not Press Start):

1. `{id} {name}` — `text-lg font-semibold`
2. `summary` — `text-base text-ink/45`
3. bullets — `pl-3` under the heading

Hairline between releases, not after the last: `h-px bg-ink/20 my-1`.

No body title. No lorem.

## Bullets

One emoji per `ChangeKind`, on the bullet, not the release header. Change list `pl-3` so markers sit under the heading, never left of `{id} {name}`. No `list-disc`.

| kind | emoji |
|---|---|
| `major-feature` | 🎉 |
| `feature` | ✨ |
| `improvement` | 🔧 |
| `bugfix` | 🐛 |
| `deprecation` | 🚫 |

```
KIND_EMOJI: { readonly [K in ChangeKind]: string } = {
  'major-feature': '🎉',
  feature: '✨',
  improvement: '🔧',
  bugfix: '🐛',
  deprecation: '🚫',
}
```

Change line: emoji then `text`, `text-base`, `flex`. Emoji `w-6 shrink-0`. `notes` under that change, `pl-6 text-base text-ink/45` — indent past the parent emoji, not left of it. Nested `changes` under a major-feature indent one step (`pl-4`), same bullet shape. Empty `notes` / empty nested `changes` render nothing.

Item / building / ui / multiplayer lines have no notes and no nested changes — nothing under the line. Mechanic lines may show `notes` bullets. Nested emoji `changes` stay empty.

## Types

```
ChangeKind = 'bugfix' | 'improvement' | 'feature' | 'deprecation' | 'major-feature'

Change =
  | { kind: Exclude<ChangeKind, 'major-feature'>; text: string; notes: readonly string[] }
  | { kind: 'major-feature'; text: string; notes: readonly string[]; changes: readonly Change[] }

Release = { id: string; name: string; summary: string; changes: readonly Change[] }

parseChangelog(src: string): readonly Release[]

RELEASES: readonly Release[]

topLineShape(text: string): boolean

MenuPage = { kind: 'home' } | { kind: 'changelog' }
```

`notes` always present. None → `[]`. Only `major-feature` nests `Change[]`. None → `changes: []`. Nested `Change` that is `major-feature` still has `changes: []` — dialect depth is one nest. No `Partial`. No optional that means unsure.

`id` is the version key the copy names. Duplicate `id` illegal.

`parseChangelog` is total: well-formed `src` → `readonly Release[]`. Ill-formed → throw `ChangelogParseError`. No `??` / `||` recovery. [[architecture/changelog]]

`topLineShape` is a predicate on `Change.text`. Vitest uses it. `parseChangelog` does not call it. It does not throw.

## Dialect

Line-oriented subset, 1:1 with those types. UTF-8. No frontmatter. No HTML. No `##`. No links. No emphasis. No markdown library.

```
# {id} {name}

{summary}

- {emoji} {text}
  - {note}
  - {emoji} {nested text}
    - {nested note}
```

- Heading: line starts with `# `. First token after `# ` is `id`. Rest of the line after the separating space is `name`. Both required. Missing either throws.
- Summary: after the heading, the next non-empty run of lines that are not a heading and not a list item, joined by a single space if wrapped. Required. Missing throws.
- Top-level list items: `- {emoji} {text}` at column 0. Emoji is exactly one `KIND_EMOJI` value, then a space, then `text`. Parser inverts `KIND_EMOJI`. Unknown emoji throws. Empty `text` throws.
- Child at 2 spaces, **no** kind emoji → `notes[]` (encounter order).
- Child at 2 spaces, **with** kind emoji → nested `Change` (encounter order). Legal only under `major-feature`. Else throw.
- Nested notes at 4 spaces under that nested change. A 4-space kind emoji throws. Further nest throws.
- List marker is `- ` only. Indent is 0 / 2 / 4 spaces only. Not tabs.
- Blank lines ignored. Other line shapes throw.

Parser dialect stays this. Ill-formed wording is not a dialect error.

## Line

Named invariant, testable only. Test name is this text:

A top-level changelog line is `{emoji} {New|Added|Removed|Changed|Fixed bug} {building|item|ui|mechanic|multiplayer} {*}`.

Exact. After the kind emoji and one space, `text` matches:

`/^(New|Added|Removed|Changed|Fixed bug) (building|item|ui|mechanic|multiplayer)\b/`

`Fixed bug` is two words. Type token is lowercase: `building` `item` `ui` `mechanic` `multiplayer`. Verb tokens are that exact casing (`New`, `Added`, `Removed`, `Changed`, `Fixed bug`).

Not a runtime parse throw. `topLineShape(text)` is that match. Parser dialect unchanged.

| type | notes |
|---|---|
| item / building / ui / multiplayer | `notes` is `[]`. No nested `changes`. |
| mechanic | top-level; keyword `mechanic`; `notes` bullets allowed for the concept only. Nested emoji `changes` stay empty. New items/buildings are not nested under a mechanic and do not get bullets. |

One subject per top-level line. Never `Added a pulser, a counter, and a day sensor`. Never `Large freezer.` without the verb+type prefix. Never `{list} {verb}`.

| verb | shape |
|---|---|
| Added / New | `Added {type}: {Name}. {what it does}.` |
| Changed | `Changed {type}: previously, it {…}, now {…}.` |
| Removed | `Removed {type}: {Name}. {what the player loses}.` |
| Fixed bug | `Fixed bug {type}: {SVO what was wrong and what happens now}.` |

Required form: `Added building: Freezer. Nine slots instead of six, and fruit inside still does not rot.`

Complete SVO sentences. Display-level words only. Never unsurfaced internals (`gate` → what the player sees, e.g. sensor). Never code, protocol, save version, research ids, breakpoints, difficulty-band internals. `Fixed bug` lines describe player-visible misbehavior and the fix, not the implementation.

## Tests

Vitest `src/game/ui/changelog.test.ts`. Dialect fixtures: structure, not player copy. [[standards/testing]] copy exemption does not cover the parser or this invariant. Do not lock dialect fixtures to shipped names, summaries, or bullet text.

`topLineShape` true/false fixtures. True: `Added building: Freezer. Nine slots instead of six, and fruit inside still does not rot.` False: `Large freezer.`; `Added a pulser, a counter, and a day sensor`; list-then-verb (`Freezer, mill, and chest added`).

Shipped `RELEASES` top-level `Change.text`: assert `topLineShape` and the notes / nested-`changes` clauses.
