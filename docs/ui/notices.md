# Notices

The right-hand column is the **Command Center**. Identifiers stay `notices`. A row is a notice. Illegal: notification, infobox, alert, dashboard.

A notice is one line saying a clock is running out, that something is waiting to be spent, or that an ended day's recap is unseen. `noticeRows` reads `World` and writes nothing. [[ui/hud]] [[architecture/view]] [[architecture/modules]]

The pass writes nothing. No notice is a `Cmd`, is digested, or sets a `DirtyReason`. Recap dismiss is App → `World.seeRecap`, not the pass. Delete `src/game/ui/notices.ts` and `src/game/ui/notices.tsx` and the sim still ticks; unseen recaps sit on `World`.

`Notice` in `ui/multiplayer.tsx` is an unrelated identifier. These files do not reuse that name.

## Rows

| kind | condition | reads | bar | click |
|---|---|---|---|---|
| `recap` | `World.recapUnseen` contains that ended day | `World.recaps` / `World.recapUnseen` | — | popup recap |
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

`grow` covers six rows in one walk. It already holds `dead` and `rotten` — [[architecture/tick]] [[architecture/world]].

`notices.red` — only a red band is a notice. Orange is the warning the plot itself already paints; a second one in the column would fire on most of a healthy farm.

A starving plant that is also wilting produces both rows. They are different clocks on the same plot and both are true.

`FRESH_FULL` — the cut inside `freshMul` ([`defs/crops.ts`](../../src/game/defs/crops.ts)), named there and read by both `freshMul` and the pass. The notice and the sale multiplier must not be able to disagree about when fruit starts losing money. Tuned-to `freshMul`.

`NOTICE_WATER_LOW` — preference, in `ui/notices.ts` beside `CYCLE_MS`'s precedent in `ui/cycle.ts`. Per network, `stored` and `capacity` are the sums over `net.sources`. A network with no source is not low; it has no capacity to be low against, and it is skipped.

## Derivation

One pure function, `noticeRows(world): Notice[]`, in `src/game/ui/notices.ts`. Not `sim/` — `sim/` is the game, and this is not.

It runs every `NOTICE_SECONDS` — preference, 1s. A timer, not a ping: the Hud only re-renders on `act` ([App.tsx](../../src/App.tsx)), and no ping fires at the moment a band goes red. Continuous world chrome does not get a `DirtyReason` — [[architecture/tick]]. `seeRecap` pings, so a recap row can leave on that Hud render.

Each `Notice` carries its own cells. That is what the map paints and what the column groups by.

`Notice.id` is stable across passes for the same condition on the same subject, so the two-pass sets, the hover, and React keys all address the same row. Recap id is that ended day.

`Notice.subjects` is what the second icon draws: a crop, a research id, or a contract demand. A `Notice` carries several only when the thing itself is several — a contract with two demand lines. A row with none draws its kind icon alone. Recap has none.

### Two-pass listing

A condition enters the pending set on the first pass it holds, and becomes visible on the next pass it still holds. It leaves by the mirror rule. Visible delay is one to two passes, which is the point: a plot that dips red for a second while a sprinkler swings past is not a notice.

Pending and visible sets are React state in the hook. Not `World`.

Recap skips two-pass. Contract-done and research-done skip two-pass.

### Recap rows

Kind `recap`. Condition: `World.recapUnseen` contains that ended day. `noticeRows` reads `World.recaps` / `World.recapUnseen` and writes nothing.

Face: `ui-recap-night` already imported in `svgs.ts`. No new SVG file.

Text: **Day {n} Finished**.

`go` is `{ kind: 'popup'; popup: { kind: 'recap'; day } }`. Left click sets App `recapDay` to that ended day and opens the recap popup. Not `World.seam`. Opening does not `seeRecap`.

### One-time rows

Contract completion and research completion are events, not conditions. Neither leaves a state to read: a contract that completes frees its slot on the delivering tick, and a research job that finishes goes idle and drops its id into `done`. Both are recovered by comparing the last pass to this one.

- The pass keeps the previous `active` ids. An id gone from `active` is looked up in `contracts.history` by `HistoryEntry.id`; `outcome.kind === 'done'` mints a completed row. `history` is a ring of `CONTRACT_HISTORY_MAX` and at most a handful close between two passes, so the id is still there.
- The pass keeps the previous `job`. A `run` on id `X` that is now not running, with `X` in `done`, mints a done row.

They skip the two-pass delay — delaying an event is wrong.

They clear on left click (and run `go`) and on right-click dismiss. Recap Close does not clear them. The recap popup is not a seam, and play is not held for it.

Cost of taking nothing from the sim: a completion that lands between the last pass and a reload or a `World` swap is never shown. Accepted. Recap is not this: it lives on `World.recapUnseen` and is saved — [[architecture/save]] `save.recaps`.

## Highlight

Hovering a row outlines every cell that row covers, on the map.

`MapView` takes one new prop — a `readonly Coord[]`, empty for none — and paints it through the existing `footOutline` into a fourth `<path>`, alongside `data-cell-stroke`, `data-furnace-cover` and `data-neighbour-reach` ([map.tsx](../../src/game/view/map.tsx)). Same shape, same stroke width, its own colour: `STAT_COLOR.orange`, `data-notice-cells`.

The map does not compute the set and does not learn the rule. Cells arrive from App, which holds the pass and the hovered row id. When the pass reruns while a row is hovered, the outline follows.

Hovering a grouped block outlines every cell of every row in it, overflow included. The block is what the player points at.

Scattered cells produce one path with disjoint subpaths off `footOutline`'s min-col / min-row origin. The `<svg>` is absolutely positioned and `overflow-visible`, so a farm-wide spread is one element. It is not N elements. Do not split it.

A vehicle is not a cell — it sits at a fractional pose in the actors layer. Its notice outlines the cell under `floor(x, y)`, or the hangar cell while it is stored. A vehicle with no fuel is not moving, so that cell is stable.

Not a wash. A wash means a new parameter through `WorldView.patch` → `OverlayLayer.patch` ([overlay.ts](../../src/game/view/layers/overlay.ts)), which sits on the dirty path, to buy nothing the outline does not already give.

## Column

`Chrome` is not used — its header band and corners are too tall for a one-line row. The column itself is transparent; each block carries the same chrome vocabulary at a third the height: `bg-house` fill, `border-x border-ink` sides, and `ui-notice-rail.svg` repeated across the top and bottom edges. That file is `ui-rail.svg` compressed to 3px — ink, roof with dirt studs, ink. No new hex, [[art/palette]].

`absolute top-20 right-4 z-20`, `w-72` — one step under the bottom-right column's `w-80`. Every block is that full width, and a row too long for it truncates with an ellipsis. Not a scroll pane: the column has no height cap and no `scroll-pane`, so a long list runs down the page and over Queue and Inspect at `right-4 bottom-4` ([[ui/hud]] Bottom-right). Accepted for now.

Hidden while the vehicle editor is on — the Stops Window claims that exact anchor ([[ui/vehicles]]). Recap is not a seam. The column stays up while the recap popup is open.

Title on the column, same plate as Hide: **Command Center**.

### Block

Rows of a kind group into one bordered block, up to `NOTICE_GROUP_MAX` — preference, 3 — each row with its own bar. Past that, one more line saying how many are not shown.

Block order is `NOTICE_ORDER`: `recap` first, then the current one-time rows, then the losses in the order they cost the player — fuel, drowning, wilting, starving, freshness, rotten, dead — then the running clocks, then what is waiting to be spent. Not the Rows table order.

### Row

```
{kind icon} {subject icon} {text}
{bar, when the row has a clock}
```

Kind icon is the notice: recap, research, no fuel, wilting. Subject icon is the thing: the row being researched, the crop wilting, the good a contract still wants. A row whose subject is several things cycles them with `useCycle` at `CYCLE_MS` — the interval `AnyJamFace` already uses ([[ui/contracts]]). Do not mint a second one.

`Notice.face` is a total union the view maps 1:1 to existing art. No new SVG. Recap takes `ui-recap-night`. Contract and contract-completed take the company glyph — there is no generic contract glyph, and the company is what names that contract anyway. Research takes the research station. Wilting and drowning share `ui-water`: both are the water band gone red, and the text is what separates them. Fuel takes `item-oil`, starving `item-fertilizer`, ready-to-harvest the Harvest sensor, low water the Water system, dead and rotten their own art at that crop's class.

A contract's subjects are its unfilled demand lines. A jam demand expands to one subject per jam crop, so the same one cycle shows what `AnyJamFace` shows in [[ui/contracts]] without a second timer inside it. `demandItem` moves to an export of `market.tsx` and both call sites read it.

`animate-pulse` on the block for the one pass in which its row ids change. A pass is `NOTICE_SECONDS`, so no second timer.

Row text is `text-base`, the body and row-label step; the overflow line is `text-sm` as secondary — [[ui/type]]. Both icons are `h-5 w-5`, the ribbon's glyph size. One line, dense, and readable at arm's length.

Every row takes `cursor-pointer` and a hover fill, whether or not it clicks through. Hovering is itself the interaction — it outlines that block's cells on the map — and a row that reacts to the pointer must say so.

A bar is `h-[2px]`, and its colour is its news: `STAT_COLOR.red` for a `noticeBad` kind — a clock draining toward a loss — and `STAT_COLOR.green` for a contract filling or research advancing. A green bar under a dying plant reads as progress toward something wanted.

The column is React. Not Pixi, not `paintMotion` — that file is a fixed `HudKind` registry with one element per kind, and notices are N bars that come and go. A notice bar is its own element in `notices.tsx`: each pass sets its width once and a CSS transition of `NOTICE_SECONDS` carries it to the next pass. No per-frame React render, nothing reads `World` between passes, and the two files stay deletable. Not `Bar` from `frame.tsx` — that one has no hook for the transition.

Dead plants and rotten produce have no bar. They do not worsen and they do not clear themselves, so there is no clock to draw. The row stands until the plot is dug. Recap has no bar.

### Controls

Hide is one small control at the head of the column, on the same plate as the title. Hidden, the column translates off the right edge over 300ms and a tab at `right-0` brings it back. Both carry a hit area — a bare glyph at this size is not clickable. App-local. Not a `Setting` — nothing behind the gear, nothing in `localStorage`.

Click is per row, not per block. Left click runs that row's `go`. Recap `go` opens that day's recap popup (App `recapDay`, not `World.seam`).

```
NoticeGo =
  | { kind: 'none' }
  | { kind: 'panel'; panel: 'market' | 'research' | 'family' }
  | { kind: 'popup'; popup: NoticePopup }

NoticePopup = { kind: 'recap'; day: number }
```

`goNotice` takes `NoticeGo`. Recap arm is App `recapDay`.

## Dismiss

`notices.dismiss` — Right-click a row: `preventDefault`, discard that row, do not run `go`. The column sits above the canvas, so the click never reaches map cancel-place-or-drop.

- Event rows (`recap`, `contract-done`, `research-done`): gone. Recap also `World.seeRecap(day)`.
- Condition rows: dismissed while the condition still holds; leave the pass → drop the id; return → two-pass as new.

Close on the recap popup: `seeRecap(day)` and close the popup. Esc / backdrop: same. Guest: Close is live (chrome, not a gate). `seeRecap` is not a `Cmd`. Assumption: guest Close / right-click is local chrome; host `seeRecap` is what the dump keeps.

## Moved off the top ribbon

`Researching {name}`, the Expansion chip, and the Skill points chip leave the top ribbon and live here instead. One place, not two. `paintMotion`'s `research` bind and the `[data-research-*]` hooks go with them — [[ui/hud]] [[architecture/view]].

## Multiplayer

A guest may not accept contracts, start research, pick a skill, or expand ([[mechanics/multiplayer]] `mp.guest`). Those four rows show for a guest and do not click through. Refill is guest-legal, so the fuel row is live for both. Recap is live for both: left click opens the popup; Close is live.

## Copy

`messages/en/notices.json`, prefix `notices_` — [[architecture/i18n]]. Words are fixed by [[standards/user-facing-text]] and are not open: **wilting**, **drowning**, **starving for fertilizer**, **freshness**, **Dead plant**, **Rotten produce**, **Researching {name}**, **Skill points**, **Expansion**, **water network**, **Quad**, **Tractor**, **fuel**, **Harvest**, **contract**, **Command Center**, **Day {n} Finished**.

## Not this update

A settings row. Any second highlight that is not a cell outline. Any notice that reads a state the sim does not already keep.

## Invariants

`notices.pure` — `noticeRows(world)` reads `World` (including `recaps` / `recapUnseen`) and writes nothing. Plant stats are folded into a `Map` local to the pass, never `World.statsCached`. No notice is a `Cmd`, is digested, or sets a `DirtyReason`. `seeRecap` is App click → `World`, not the pass. Deleting `ui/notices.ts` and `ui/notices.tsx` leaves the sim ticking.

`notices.pass` — The pass runs every `NOTICE_SECONDS` off a timer, never off a ping. A condition becomes visible on the second consecutive pass it holds and leaves on the second it does not.

`notices.once` — Contract and research completion are recovered by comparing the previous pass to this one, against `contracts.history` and `World.done`. They skip the two-pass delay and clear on left click or right-click dismiss. Recap Close does not clear them. A completion spanning a reload or a `World` swap is not shown.

`notices.popup` — `NoticeGo` is `{ kind: 'none' } | { kind: 'panel'; panel } | { kind: 'popup'; popup }`. Left click on a row runs that row's `go`. Recap `go` sets App `recapDay` to that ended day. Not `World.seam`. Opening does not `seeRecap`.

`notices.dismiss` — Right-click a row: `preventDefault`, discard that row, do not run `go`. Event rows `recap` / `contract-done` / `research-done` are gone; recap also `seeRecap(day)`. Condition rows dismissed while the condition holds leave the pass and drop the id; return is two-pass as new. Recap popup Close / Esc / backdrop: `seeRecap(day)` and close. Guest Close live.

`notices.highlight` — `MapView` takes cells, never a rule. The hovered block's cells paint one `footOutline` path. Not a wash, not a `WorldView.patch` argument, not a Pixi change. A vehicle highlights the cell under `floor(x, y)`.

`notices.red` — Only a red band is a notice. Orange is not.

`notices.group` — Rows of one kind are one block, at most `NOTICE_GROUP_MAX` of them drawn, the rest counted on one more line. `NOTICE_ORDER` starts with `recap`.

`notices.bar` — A bar is drawn only for a row with a clock, and its colour is `noticeBad(kind)`: red for a draining loss, green for a filling contract or research job.
