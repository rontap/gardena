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

Left list + right pane, same scroll chain as [[ui/almanac]]: row fills a definite height, each side `scroll-pane` `overflow-y-auto` of its own. Bleed `mx-[-1rem]` to the Chrome edge. List `w-44` `border-r border-ink/20`. Height `h-[min(32rem,calc(100vh-14rem))]`.

Chrome changelog wider than home — `w-[48rem]`.

Left list: one button per `RELEASES` row, `{id} {name}`, `truncate`, `text-sm`, `px-2 py-1`. Selected `bg-dirt text-house`. Else `text-ink hover:bg-dirt/30`. No icon. Click selects and `scrollIntoView` `{ behavior: 'auto', block: 'start' }` on that release in the right pane. Instant. Open on `RELEASES[0]`.

Scrolling the right pane selects the release whose heading is at the top of the pane. Scrolled to the end: last release. Selected row `scrollIntoView` `{ block: 'nearest' }` in the left list.

Right pane: existing release body. Array order is render order. Per release, body face only (not Press Start). Heading `text-base`. Summary and bullets `text-sm`.

1. `{id} {name}`
2. `summary`
3. bullets under the heading

Hairline between releases, not after the last.

No body title. No lorem.

## Bullets

Kind emoji is optional. Present: one `ChangeKind`, on the bullet, not the release header. Absent: `improvement`. Markers sit under the heading, never left of `{id} {name}`.

| kind | emoji |
|---|---|
| `major-feature` | 🎉 |
| `feature` | ✨ |
| `improvement` | 🔧 |
| `bugfix` | 🐛 |
| `deprecation` | 🚫 |

Change line: optional emoji then `text`. `notes` under that change, indent past the parent emoji. Nested `changes` under a major-feature indent one step, same bullet shape. Empty `notes` / empty nested `changes` render nothing.

Any top-level line may carry `notes`. Nested emoji `changes` only under `major-feature`.

## Dialect

Parser dialect: [[architecture/changelog]]. `parseChangelog` is total: well-formed `src` → `readonly Release[]`. Ill-formed → throw `ChangelogParseError`. No `??` / `||` recovery.

`topLineShape` is a predicate on `Change.text`. Vitest fixtures only. `parseChangelog` does not call it. Shipped `RELEASES` are not asserted against it. It does not throw.

Wording is player copy. No required verb, type token, colon, or previously/now frame. Ill-formed wording is not a dialect error.

## Tests

Vitest `src/game/ui/changelog.test.ts`. Dialect fixtures: structure, not player copy. [[standards/testing]] copy exemption does not cover the parser. Do not lock dialect fixtures to shipped names, summaries, or bullet text.

`topLineShape` true/false fixtures stay. They do not run on shipped `RELEASES`.
