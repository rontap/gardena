# Changelog

Player-facing release list in the menu. Menu-local view state. Not World. Not Save. Not a `Panel` arm. Not a mechanic. [[architecture/modules]] [[architecture/save]] [[ui/menu]]

Boot `joining` stays App-owned; Menu forces home when `joining`; wordmark click is a no-op while joining.

Changelog UI does not own `SAVE_VERSION`, dump `version`, or `PROTOCOL`. No migrate. Version: [[GLOBAL_VERSION]].

`src/game/ui/changelog.md` is the source of truth. Manual edits only. No script, dump, codegen, or agent writes that file from TypeScript, git, or defs. Markdown is never generated from code. `parseChangelog` reads. It does not write. No markdown library.

`changelog.ts` owns `ChangeKind` `Change` `Release` `KIND_EMOJI` `parseChangelog` `ChangelogParseError` `RELEASES` `topLineShape`. `changelog.tsx` renders only. `menu.tsx` owns `MenuPage` and open/close. Drafts `changelogs-*.md` are not `RELEASES` sources.

`import src from './changelog.md?raw'` — Vite `?raw`. `RELEASES = parseChangelog(src)` at module load.

`App` `Panel` is unchanged. No `'changelog'`.

## Types

`sim` does not own these. Shape: `src/game/ui/changelog.ts`.

`notes` always present. None → `[]`. Only `major-feature` nests `Change[]`. None → `changes: []`. Nested `Change` that is `major-feature` still has `changes: []` — dialect depth is one nest. No `Partial`. No optional that means unsure.

`RELEASES` is `parseChangelog` of shipped `changelog.md`. File order = array order = render order. `id` is the version key the copy names. Duplicate `id` illegal.

`Changelog` reads `RELEASES` in-module. No props for copy. No `World`.

`topLineShape` is a predicate on `Change.text`. Vitest fixtures only. `parseChangelog` does not call it. Shipped `RELEASES` are not asserted against it. It does not throw.

## Changelog dialect

Line-oriented subset, 1:1 with those types. UTF-8. No frontmatter. No HTML. No `##`. No links. No emphasis. No markdown library.

```
# {id} {name}

{summary}

- {emoji}? {text}
  - {note}
  - {emoji} {nested text}
    - {nested note}
```

- Heading: line starts with `# `. First token after `# ` is `id`. Rest of the line after the separating space is `name`. Both required. Missing either throws.
- Summary: after the heading, the next non-empty run of lines that are not a heading and not a list item, joined by a single space if wrapped. Required. Missing throws.
- Top-level list items: `- {emoji}? {text}` at column 0. Emoji, if present, is exactly one `KIND_EMOJI` value, then a space, then `text`. Missing emoji: `kind` is `improvement`, `text` is the trimmed body. Parser inverts `KIND_EMOJI`. A leading pictograph that is not a kind emoji throws. Empty `text` throws. Body is trimmed.
- Child at 2 spaces, **no** kind emoji → `notes[]` (encounter order). Legal under any kind.
- Child at 2 spaces, **with** kind emoji → nested `Change` (encounter order). Legal only under `major-feature`. Else throw.
- Nested notes at 4 spaces under that nested change. A 4-space kind emoji throws. Further nest throws.
- List marker is `- ` only. Indent is 0 / 2 / 4 spaces only. Not tabs.
- A line whose trimmed end is `NOTE_SIGN` (`- Aron`) is prose, whatever else it holds: it is read before every other rule, so emphasis, a link, a leading space or a stray marker in it is not an error. In the summary block it joins the summary, trimmed. Anywhere else it is passed over. A line signed with any other name is not this rule and throws as before.
- Blank lines ignored. Other line shapes throw.

Parser dialect stays this. Ill-formed wording is not a dialect error.

## Parser

`parseChangelog` is total: well-formed `src` → `readonly Release[]`. Ill-formed → throw `ChangelogParseError`. No `??` / `||` recovery. No default, no empty array, no skip.

Throw (named `ChangelogParseError`): empty file; missing `id` / `name` / `summary`; empty `text` / empty note; unknown emoji; nested `Change` under non-`major-feature`; duplicate `id`; extra constructs (frontmatter, HTML, `##`, links, emphasis, wrong indent, other markers). A `NOTE_SIGN` line is none of those — a release whose only summary line is signed still has a summary.

Ill-formed *wording* does not throw at module load.

## Line

`topLineShape` is a preferred-shape predicate on `Change.text`. Vitest fixtures only. `parseChangelog` does not call it. Shipped `RELEASES` are not asserted against it. It does not throw.

Missing kind emoji is `improvement`. Nested emoji `changes` only under `major-feature`. `notes` legal under any kind.

Player copy. No required verb, type token, colon, or previously/now frame.

## Tests

Vitest `src/game/ui/changelog.test.ts`. Dialect fixtures: structure, not player copy. [[standards/testing]] copy exemption does not cover the parser.

Dialect fixtures stay. Do not lock dialect fixtures to shipped names, summaries, or bullet text.

`topLineShape` true/false fixtures stay. They do not run on shipped `RELEASES`. Coder writes the test. Coder does not rewrite `changelog.md` copy.

## Open / close

`menu.tsx` owns it. `useState<MenuPage>({ kind: 'home' })`. Not App. Not `World`. Dies when `Menu` unmounts.

Open: click the existing wordmark (boot and play). Sets `{ kind: 'changelog' }`. Toggle: click again → `{ kind: 'home' }`. While boot `joining`: no-op. Version shown: [[GLOBAL_VERSION]].

Close changelog (Menu):

- wordmark click while `{ kind: 'changelog' }`
- Chrome × while `{ kind: 'changelog' }` (boot and play)

Close menu (App, unchanged): play backdrop, play Esc, gear toggle. Unmounts `Menu`. Boot Esc still only `setJoining(false)`.

Chrome ×: changelog → home; boot joining home → `onJoinClose`; play home → `onClose`.

`joining` true → MenuPage home. JoinFields still wins the body.

## Shell

Two menu shells only. Boot: no dim, no backdrop dismiss, no × on home. Play: dim, backdrop dismiss, × on home. [[ui/menu]]

Changelog is Chrome body, same as JoinFields. Illustration, **Gardena**, wordmark stay. Not `Overlay`. Not `Window`. Not a HUD overlay. Chrome is wider on changelog than home. — [[ui/menu]] [[ui/changelog]]
