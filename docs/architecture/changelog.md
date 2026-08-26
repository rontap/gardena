# Changelog

Player-facing release list in the menu. Menu-local view state. Not World. Not Save. Not a `Panel` arm. Not a mechanic. [[architecture/modules]] [[architecture/save]] [[ui/menu]]

Assumption: boot `joining` stays App-owned; Menu forces home when `joining`; wordmark click is a no-op while joining.

Wordmark **1.8.1**. Changelog UI does not own `SAVE_VERSION`, dump `version`, or `PROTOCOL`. No migrate. Do not bump the wordmark.

Assumption: wordmark stays **1.8.1** (menu already shows it). This note does not invent a number. `ChangelogParseError` is the named parse error.

`src/game/ui/changelog.md` is the source of truth. Manual edits only. No script, dump, codegen, or agent writes that file from TypeScript, git, or defs. Markdown is never generated from code. `parseChangelog` reads. It does not write. No markdown library.

Assumption: plant, tool, tile, seed, sapling → type `item`. Placed machine / store / pipe building → `building`. Overlay / panel / button / lens → `ui`. Multiplayer host / join → `multiplayer`. Contracts, stall pressure, family, wires-as-system → `mechanic`.

## Files

| file | owns |
|---|---|
| `src/game/ui/changelog.md` | player copy. Shipped. Not `docs/`. Only `RELEASES` source. Manual edits only. |
| `src/game/ui/changelog.ts` | `ChangeKind`, `Change`, `Release`, `KIND_EMOJI`, `parseChangelog`, `ChangelogParseError`, `RELEASES`, `topLineShape` |
| `src/game/ui/changelog.tsx` | `Changelog` body only. Imports `RELEASES` / `KIND_EMOJI`. No copy. |
| `src/game/ui/changelog.test.ts` | dialect fixtures (structure, not copy); `topLineShape` true/false; shipped `RELEASES` top-level walk |
| `src/game/ui/menu.tsx` | `MenuPage`, wordmark click, open/close, whether `Changelog` is shown |
| `src/game/ui/frame.tsx` | `Chrome` / `Window` / `Overlay` as they are. No new export. |

Do not create `src/` here. Copy is `changelog.md`, parsed in `src/`. Not a TS string table. Not fetched. Not imported from `docs/`. Not `defs/`. This note does not own the strings.

Drafts beside the shipped file, later agents, **not** `RELEASES` sources, do not import: `src/game/ui/changelogs-facts.md`, `changelogs-player.md`, `changelogs-garden.md`, `changelogs-synth.md`. `changelogs-*.md` are still not `RELEASES` sources.

`import src from './changelog.md?raw'` — Vite `?raw`, same as SVG. `vite/client` already types it. `RELEASES = parseChangelog(src)` at module load. No markdown library. No new npm dep.

`App` `Panel` is unchanged. No `'changelog'`.

## Types

```
ChangeKind = 'bugfix' | 'improvement' | 'feature' | 'deprecation' | 'major-feature'

Change =
  | { kind: Exclude<ChangeKind, 'major-feature'>; text: string; notes: readonly string[] }
  | { kind: 'major-feature'; text: string; notes: readonly string[]; changes: readonly Change[] }

Release = { id: string; name: string; summary: string; changes: readonly Change[] }

KIND_EMOJI: { readonly [K in ChangeKind]: string } = {
  'major-feature': '🎉',
  feature: '✨',
  improvement: '🔧',
  bugfix: '🐛',
  deprecation: '🚫',
}

parseChangelog(src: string): readonly Release[]

RELEASES: readonly Release[]

topLineShape(text: string): boolean

MenuPage = { kind: 'home' } | { kind: 'changelog' }
```

`notes` always present. None → `[]`. Only `major-feature` nests `Change[]`. None → `changes: []`. Nested `Change` that is `major-feature` still has `changes: []` — dialect depth is one nest. No `Partial`. No optional that means unsure.

`RELEASES` is `parseChangelog` of shipped `changelog.md`. File order = array order = render order. `id` is the version key the copy names. Duplicate `id` illegal.

`Changelog` reads `RELEASES` in-module. No props for copy. No `World`.

`topLineShape` is a predicate on `Change.text`. Vitest uses it. `parseChangelog` does not call it. It does not throw.

## Changelog dialect

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

## Parser

`parseChangelog` is total: well-formed `src` → `readonly Release[]`. Ill-formed → throw `ChangelogParseError`. No `??` / `||` recovery. No default, no empty array, no skip.

Throw (named `ChangelogParseError`): empty file; missing `id` / `name` / `summary`; empty `text` / empty note; unknown emoji; nested `Change` under non-`major-feature`; duplicate `id`; extra constructs (frontmatter, HTML, `##`, links, emphasis, wrong indent, other markers).

Ill-formed *wording* does not throw at module load.

## Invariant

Named invariant, testable only. Test name is this text:

A top-level changelog line is `{emoji} {New|Added|Removed|Changed|Fixed bug} {building|item|ui|mechanic|multiplayer} {*}`.

Exact. After the kind emoji and one space, `text` matches:

`/^(New|Added|Removed|Changed|Fixed bug) (building|item|ui|mechanic|multiplayer)\b/`

`Fixed bug` is two words. Type token is lowercase: `building` `item` `ui` `mechanic` `multiplayer`. Verb tokens are that exact casing (`New`, `Added`, `Removed`, `Changed`, `Fixed bug`).

Not a runtime parse throw. `topLineShape(text)` is that match. Parser dialect unchanged.

Also testable on shipped `RELEASES` (every top-level `Change.text`):

- Item, building, ui, multiplayer: `notes` is `[]` and no nested `changes`.
- Mechanic: top-level; keyword is `mechanic`; may have `notes` bullets. Nested emoji `changes` stay empty. New items/buildings are not nested under a mechanic and do not get bullets.
- One subject per top-level line. Never `Added a pulser, a counter, and a day sensor`. Never `Large freezer.` without the verb+type prefix. Never `{list} {verb}`.
- Required form: `Added building: Freezer. Nine slots instead of six, and fruit inside still does not rot.`
- Changed: `Changed {type}: previously, it {…}, now {…}.`
- Complete SVO sentences. Not “Unlock land grants the first.”
- Display-level words only. Never unsurfaced internals (`gate` → what the player sees, e.g. sensor). Never code, protocol, save version, research ids, breakpoints, difficulty-band internals.
- `Fixed bug` lines describe player-visible misbehavior and the fix, not the implementation.

## Tests

Vitest `src/game/ui/changelog.test.ts`. Dialect fixtures: structure, not player copy. [[standards/testing]] copy exemption does not cover the parser or this invariant.

Dialect fixtures stay. Do not lock dialect fixtures to shipped names, summaries, or bullet text. Extract round-trip (`parse` equals today's `RELEASES`) is extract-time only.

Add `topLineShape` true/false fixtures. True: `Added building: Freezer. Nine slots instead of six, and fruit inside still does not rot.` False: `Large freezer.`; `Added a pulser, a counter, and a day sensor`; list-then-verb (`Freezer, mill, and chest added`).

Add a test that walks shipped `RELEASES` top-level `Change.text`. Assert `topLineShape`. Assert the notes / nested-`changes` clauses. That shipped test fails until copy is rewritten. Coder writes the test. Coder does not edit `changelog.md`.

## Open / close

`menu.tsx` owns it. `useState<MenuPage>({ kind: 'home' })`. Not App. Not `World`. Dies when `Menu` unmounts.

Open: click the existing wordmark **1.8.1** (boot and play). Sets `{ kind: 'changelog' }`. Toggle: click again → `{ kind: 'home' }`. While boot `joining`: no-op.

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

Changelog is Chrome body, same as JoinFields. Illustration, **Gardena**, wordmark stay. Not `Overlay` (`Overlay` always dims and backdrop-dismisses). Not `Window`. Not a second `absolute inset-0`. Not a HUD overlay. Home and join Chrome `relative w-[26rem]`. Changelog `relative w-[36rem]`. — [[ui/menu]] [[ui/changelog]]

No new SVG.

## Illegal

- `Panel` arm `'changelog'`
- field on `World` / `Save` / `Cmd`
- fetch, import from `docs/`, copy in `defs/`
- import of `changelogs-facts.md` / `changelogs-player.md` / `changelogs-garden.md` / `changelogs-synth.md`
- markdown library / new npm dep / npm markdown
- generator, script, dump, codegen, or agent writing `changelog.md` from TypeScript, git, or defs
- `RELEASES` dump back into md
- `parseChangelog` writing, or calling `topLineShape`
- `topLineShape` throwing; wording throw at module load
- `Overlay` or a third shell
- this note bumping wordmark / `SAVE_VERSION` / dump `version` / `PROTOCOL`
- migrate
- `Partial<Release>` / omitted `notes` / non-`major-feature` with nested `Change[]`
- `??` / `||` recovery in `parseChangelog`
- new SVG
- App Esc closing changelog on boot
- this note writing player copy
