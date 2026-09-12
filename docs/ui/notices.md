# Notices

The right-hand column is the **Command Center**. Identifiers stay `notices`. A row is a notice. Illegal: notification, infobox, alert, dashboard.

A notice is one line saying a clock is running out, that something is waiting to be spent, that an ended day's recap or a letter about grandma is unread, that the Necronomicon has a page ready, or that another gardener `joined`, `quit`, or `desynced`. `noticeRows` reads `World` and writes nothing. Roster kinds are stamped at the net/App boundary, not that read. [[ui/hud]] [[architecture/view]] [[architecture/modules]] [[architecture/net]]

The pass writes nothing. No notice is a `Cmd`, is digested, or sets a `DirtyReason`. Recap dismiss is App → `World.seeRecap`, not the pass. Roster rows live on App, not `World`. Delete `src/game/ui/notices.ts` and `src/game/ui/notices.tsx` and the sim still ticks. `Notice` in `ui/multiplayer.tsx` is an unrelated identifier.

Player words: [[standards/user-facing-text]]. Copy in `messages/en/notices.json`, prefix `notices_` — [[architecture/i18n]].

## Rows

| kind | condition | reads | bar | click |
|---|---|---|---|---|
| `recap` | `World.recapUnseen` contains that ended day | `World.recaps` / `World.recapUnseen` | — | popup recap |
| `grandma` | `World.grandmaUnseen` contains that beat | `World.grandmaUnseen` | — | popup that letter |
| `necronomicon` | `ritualReady(world, book)` | `World.necronomicon` | — | none |
| `joined` | stamped: new seat or `away` → `in`, not `App.local` | App list, `Seat.name` | — | none |
| `quit` | stamped: link released (`drop` / leave / `lost`) | App list, `Seat.name` | — | none |
| `desynced` | stamped: `bye: kicked` then drop | App list, `Seat.name` | — | none |
| `contract` | `contracts.active` entry | `dueDay - nowDay`, `sum(bin.filled) / need` | fill | Market |
| `contract-done` | one-time, below | `contracts.history` | — | Market |
| `fuel` | `fuel === 0` | `World.vehicles` | — | none |
| `wilting` | `waterBand(soil.water, tol) === 'red'`, not `soil.drowning` | `grow` → `growing` | `happiness / HAPPY_MAX` | none |
| `drowning` | `waterBand(soil.water, tol) === 'red'`, `soil.drowning` | `grow` → `growing` | `happiness / HAPPY_MAX` | none |
| `starving` | `fertBand(soil.fertilizer, tol) === 'red'` | `grow` → `growing` | `happiness / HAPPY_MAX` | none |
| `freshness` | `plant.freshness < FRESH_FULL` | `grow` → `ripe` | `freshness` | none |
| `dead` | that cell kind | `grow` → `dead` | — | none |
| `rotten` | that cell kind | `grow` → `rotten` | — | none |
| `research` | `job.kind === 'run'` | `World.job` | `(seconds - left) / seconds` | Research |
| `research-done` | one-time, below | `World.done` | — | Research |
| `points` | `World.points > 0` | — | — | Family |
| `expansion` | `World.expandLeft() > 0` | — | — | none |
| `water-low` | `stored / capacity < NOTICE_WATER_LOW` | `nets.grid(world)` | `stored / capacity` | none |
| `weed` | any `weed` cell on the farm | `grow` → `weed` | — | none |

`grow` covers six rows in one walk. [[architecture/tick]] [[architecture/world]]

`notices.red` — only a red band is a notice. Orange is the warning the plot itself already paints. A starving plant that is also wilting produces both rows.

`notices.weed` — weeds are one row for the whole farm, not one per plot. The row carries every weed cell, so hovering it paints them all at once. Its face is the pulled-weed item art. No bar.

`FRESH_FULL` — the cut inside `freshMul`, named there and read by both `freshMul` and the pass. Tuned-to `freshMul`. `NOTICE_WATER_LOW` — preference. Per network, `stored` and `capacity` are the sums over `net.sources`. A network with no source is not low.

## Derivation

One pure function, `noticeRows(world): Notice[]`, in `src/game/ui/notices.ts`. Not `sim/`. It does not mint `joined` `quit` `desynced`. App holds that list and `Notices` concatenates it with the pass. It runs every `NOTICE_SECONDS` — preference. A timer, not a ping. Continuous world chrome does not get a `DirtyReason` — [[architecture/tick]]. `seeRecap` pings, so a recap row can leave on that Hud render.

Each `Notice` carries its own cells. `Notice.id` is stable across passes for the same condition on the same subject. Recap id is that ended day. `Notice.subjects` is what the second icon draws. A `Notice` carries several only when the thing itself is several — a contract with two demand lines. Recap has none. Roster kinds have none.

### Two-pass listing

A condition enters the pending set on the first pass it holds, and becomes visible on the next pass it still holds. It leaves by the mirror rule. Pending and visible sets are React state in the hook. Not `World`. Recap skips two-pass. Contract-done, research-done, `joined`, `quit`, `desynced`, and `grandma` skip two-pass — a letter is an event. `necronomicon` does not: a page going full is a condition.

### Recap rows

Kind `recap`. Face: `ui-recap-night`. Text: **Day {n} Finished**. `go` is `{ kind: 'popup'; popup: { kind: 'recap'; day } }`. Left click sets App `recapDay` to that ended day and opens the recap popup. Not `World.seam`. Opening does not `seeRecap`.

### One-time rows

Contract completion and research completion are events, not conditions. The pass keeps the previous `active` ids; an id gone from `active` is looked up in `contracts.history`; `outcome.kind === 'done'` mints a completed row. The pass keeps the previous `job`; a `run` on id `X` that is now not running, with `X` in `done`, mints a done row. They skip the two-pass delay. They clear on left click (and run `go`) and on right-click dismiss. Recap Close does not clear them. A completion that lands between the last pass and a reload or a `World` swap is never shown. Recap is not this: it lives on `World.recapUnseen` and is saved — [[architecture/save]] `save.recaps`.

### Roster rows

Kinds `joined` `quit` `desynced`. Events, not conditions. `noticeRows` cannot tell a drop from silence. App stamps at the net boundary. Not a `Cmd`. Not digested. Not in `Save`. Not a recap. Solo (`seats.length === 1`, no session) never mints. Do not mint for this page's seat. `go` is `{ kind: 'none' }`. No cells. No bar. Right-click dismiss. Reload or `World` swap drops the App list. Face: atlas `actor-hat` tinted with that seat's hex — [[ui/multiplayer]]. `Notice.id` is session-local, unique per mint. Copy: **{name} joined** / **{name} left** / **{name} drifted**. `{name}` is `Seat.name`. Player copy must not say desync. Do not bump `PROTOCOL`. [[architecture/net]]

## Highlight

Hovering a row outlines every cell that row covers, on the map. `MapView` takes a `readonly Coord[]`, empty for none, and paints it through `footOutline`. Same shape, same stroke width, its own colour: `STAT_COLOR.orange`. The map does not compute the set and does not learn the rule. Cells arrive from App. Hovering a grouped block outlines every cell of every row in it, overflow included. A vehicle highlights the cell under `floor(x, y)`, or the hangar cell while it is stored. Not a wash.

## Column

Not `Chrome` — its header band is too tall for a one-line row. Each block carries house fill, ink sides, and `ui-notice-rail.svg` on the edges. Art [[art/palette]]. Anchored top-right, one step under inspect's width. Every block is that full width; a row too long truncates. Not a scroll pane: a long list runs down the page and over Queue and Inspect. Hidden while the vehicle editor is on — the Stops Window claims that exact anchor ([[ui/vehicles]]). Recap is not a seam. The column stays up while the recap popup is open. Title **Command Center**. Not on the Hide plate.

### Block

Rows of a kind group into one bordered block, up to `NOTICE_GROUP_MAX` — preference — each row with its own bar. Past that, one more line saying how many are not shown. Block order is `NOTICE_ORDER`: `recap` first, then the one-time rows — `joined` `quit` `desynced` `contract-done` `research-done` — then the losses, then the running clocks, then what is waiting to be spent.

### Row

Kind icon, subject icon, text; bar when the row has a clock. A row whose subject is several things cycles them with `useCycle` at `CYCLE_MS` — [[ui/contracts]]. Do not mint a second one. `Notice.face` maps 1:1 to existing art. No new SVG. Recap takes `ui-recap-night`. Roster kinds take atlas `actor-hat`. Contract takes the company glyph. Research takes the research station. Wilting and drowning share `ui-water`. A contract's subjects are its unfilled demand lines. A jam demand expands to one subject per jam crop. `demandItem` is an export of `market.tsx`. Pulse the block for the one pass in which its row ids change. Row text is body step; overflow is secondary — [[ui/type]]. Every row takes pointer and a hover fill. Hover covers the whole notice cell. A bar is thin, red for a `noticeBad` kind, green for a contract filling or research advancing. The column is React. Not Pixi, not `paintMotion`. A notice bar is its own element: each pass sets its width once and a CSS transition of `NOTICE_SECONDS` carries it to the next pass. Dead plants and rotten produce have no bar. Recap has no bar. Roster kinds have no bar.

### Controls

Hide is one small control at the head of the column. Hidden, the column translates off the right edge and a tab at the right edge brings it back. App-local. Not a `Setting`. Click is per row, not per block. Left click runs that row's `go`. Recap `go` opens that day's recap popup (App `recapDay`, not `World.seam`).

`NoticeGo` is `{ kind: 'none' }` | `{ kind: 'panel'; panel: 'market' | 'research' | 'family' }` | `{ kind: 'popup'; popup }`. Popup is recap day or grandma beat.

## Dismiss

Right-click a row: `preventDefault`, discard that row, do not run `go`. The column sits above the canvas, so the click never reaches map cancel-place-or-drop. Event rows (`recap`, `joined`, `quit`, `desynced`, `contract-done`, `research-done`): gone. Recap also `World.seeRecap(day)`. Condition rows: dismissed while the condition still holds; leave the pass → drop the id; return → two-pass as new. Close on the recap popup: `seeRecap(day)` and close the popup. Esc / backdrop: same. Guest: Close is live. `seeRecap` is not a `Cmd`. Guest Close / right-click is local chrome; host `seeRecap` is what the dump keeps.

## Moved off the top ribbon

`Researching {name}`, the Expansion chip, and the Skill points chip live here instead. One place, not two. `paintMotion`'s `research` bind goes with them — [[ui/hud]] [[architecture/view]].

## Multiplayer

Guest chrome matches [[mechanics/multiplayer]] `mp.guest`. Research, Family, and Market `go` is live. Family dock opens; cards not clickable. Expansion row stays, `go: none`. Cheat is not a notice. Refill is guest-legal, so the fuel row is live. Recap is live. Roster rows show for host and guest. Dismiss is local chrome.

## Invariants

`notices.pure` — `noticeRows(world)` reads `World` (including `recaps` / `recapUnseen`) and writes nothing; it does not mint `joined` `quit` `desynced`; plant stats are folded into a `Map` local to the pass, never `World.statsCached`; no notice is a `Cmd`, is digested, or sets a `DirtyReason`; `seeRecap` is App click → `World`, not the pass; deleting `ui/notices.ts` and `ui/notices.tsx` leaves the sim ticking.

`notices.pass` — The pass runs every `NOTICE_SECONDS` off a timer, never off a ping; a condition becomes visible on the second consecutive pass it holds and leaves on the second it does not.

`notices.once` — Contract and research completion are recovered by comparing the previous pass to this one, against `contracts.history` and `World.done`; they skip the two-pass delay and clear on left click or right-click dismiss; Recap Close does not clear them; a completion spanning a reload or a `World` swap is not shown; roster kinds share dismiss and drop-on-swap — `notices.roster`.

`notices.roster` — Kinds `joined` `quit` `desynced` are stamped at the net/App boundary, never by `noticeRows`; not a `Cmd`, not digested, not in `Save`, not a recap; they skip two-pass; right-click dismiss; left click `go: none`; reload or `World` swap drops them; no cells, no bar; face `{ kind: 'hat'; seat }`; do not mint for `App.local`; do not mint for `presence: 'away'` from silence; quit is the link released; desynced is `bye: kicked` then drop; joined is a new seat or `away` → `in`; solo never mints; additive JSON; do not bump `PROTOCOL`.

`notices.popup` — `NoticeGo` is `{ kind: 'none' } | { kind: 'panel'; panel } | { kind: 'popup'; popup }`; left click on a row runs that row's `go`; recap `go` sets App `recapDay` to that ended day; not `World.seam`; opening does not `seeRecap`.

`notices.dismiss` — Right-click a row: `preventDefault`, discard that row, do not run `go`; event rows `recap` / `joined` / `quit` / `desynced` / `contract-done` / `research-done` are gone; recap also `seeRecap(day)`; condition rows dismissed while the condition holds leave the pass and drop the id; return is two-pass as new; recap popup Close / Esc / backdrop: `seeRecap(day)` and close; guest Close live.

`notices.highlight` — `MapView` takes cells, never a rule; the hovered block's cells paint one `footOutline` path; not a wash, not a `WorldView.patch` argument, not a Pixi change; a vehicle highlights the cell under `floor(x, y)`.

`notices.red` — Only a red band is a notice; orange is not.

`notices.group` — Rows of one kind are one block, at most `NOTICE_GROUP_MAX` of them drawn, the rest counted on one more line; `NOTICE_ORDER` starts with `recap`, then one-time `joined` `quit` `desynced` `contract-done` `research-done` `grandma`; `necronomicon` sits with the rows waiting to be spent, above `points` — [[ui/necronomicon]].

`notices.bar` — A bar is drawn only for a row with a clock, and its colour is `noticeBad(kind)`: red for a draining loss, green for a filling contract or research job.
