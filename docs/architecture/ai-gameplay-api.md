# AI gameplay API

Turn-based facade over the command log so an agent can play without a mouse. `window.play`, installed beside `window.__world`. [[architecture/world]] [[architecture/log]] [[ui/cheat]] [[mechanics/day]]

`sim/play.ts` owns `TurnAction`, `TurnReport`, `Snapshot`, `installPlay`. No React import. `App` holds the hold ref and installs. Single seat only: host and guest branches are untouched.

Not a test harness — e2e keeps `__world`. Not a cheat surface — `Act.cheat` is not exposed.

## Hold

The sim is frozen between turns. That is the point: an agent thinks in wall time, and crops die in game time.

First `turn()` sets `aiHoldRef`. The rAF loop in `App` then skips `world.tick` for the solo branch, and `turn()` drives `world.tick(DT_MAX)` itself — the same fixed step the loop uses, so replay stays deterministic. A player who never touches `window.play` is unaffected.

## Turn

`turn(actions)` is synchronous. Two phases.

1. **Dispatch.** Each action in list order. Everything except `enqueue` takes effect immediately.
2. **Drain.** Tick until the local seat is idle — `queue` empty, `workLeft` 0, not `filling`.

A turn with no `wait` still advances the world. Walking to a tile, digging, and hauling to the truck cost game time, and plants grow, machines run, and soil dries while they happen. `TURN` reports the seconds spent.

`{ task: 'wait', sec }` is idle time on top, for growth, research, and machine cycles. Mid-list it stages work.

`DRAIN_MAX` — preference. Bounds the drain. `drained` is `idle` or `cap`.

Seam inside a turn: the recap is captured into `days` and `dismissRecap()` runs. `tick` freezes while `seam.kind === 'recap'`, so a turn that did not dismiss would deadlock at the first rollover — [[mechanics/day]].

**Instant beats queued.** `buy`, `take`, `swap` and the rest fire during dispatch, while queued acts are still walking. A `take` mid-list swaps the hand out from under a queued `shovel` and the sim drops it. Put hand changes in their own turn.

## Actions

`TurnAction` is a discriminated union of plain objects. Data, not code: no callbacks, no strings to evaluate. The type is the constraint; there is no runtime shape check.

| task | maps to |
|---|---|
| `enqueue` | `Act.enqueue` — the whole `Intent` union |
| `click` | `Act.click`, whatever the tile affords |
| `build` | `buy` then the place confirm for that SKU |
| `buy` | `Act.buy` / `Act.buyPacks` |
| `delete` | `armDelete` then the matching delete |
| `valve` | `Act.clickValve` |
| `research` | `Act.startResearch` |
| `market` | `Act.sellAll` |
| `contract` | accept / cancel / reorder |
| `skill` | `Act.pickSkill` |
| `expand` | `Act.expand` |
| `swap`, `swapChest`, `take` | inventory and stores |
| `vehicle` | buy, deploy, embark, dock, load, refill, boom, drive |

`build` is one action. The agent never sees the place handshake: `buy` arms `Seat.place`, then `click` / `placePipe` / `placeSprinkler` confirms, then `cancelPlace` disarms. Valve confirm is the ordinary place path. Two log entries, because a dedicated `Act.build` would change the log format. Edge SKUs take `edge`, everything else takes `at`.

Route editing and wire placement are not implemented. Both are multi-step editor state. `help()` says so.

## Report

`TurnReport` carries a `text` string and the same data as properties. Text so a console read is cheap; properties so the agent can drill in.

Fields are summary plus exceptions: counts by `Plot.kind`, then a line only for cells flagged `ripe`, `dead`, `rotten`, `weed`, or a red band — [[mechanics/soil]]. `fields()` is the full dump. Buildings dedupe by cell identity, so a multi-cell house is one row; rocks fold into a count.

The board is derived, not stored: `rollBoard` filtered by `takenToday`, the same read the market dock does — [[mechanics/contracts]].

Research, shop, and skills are **not** in the report. They do not change turn to turn. `research()`, `shop()`, `skills()` on demand — [[mechanics/research]] [[mechanics/family]].

## Failure

Most `*Body` methods return silently on illegal input, so a task result is built from three sources.

| source | gives |
|---|---|
| precheck | `researchOpen`, `skuOpen`, `marketOpen`, `contractCap`, price vs `money`, `QUEUE_CAP` |
| dispatch | `BuyFail` from `buy`, `'blocked'` / `'noop'` from `click` |
| witness | a public read taken before dispatch, compared after the drain |

No game code carries a new return value.

The witness is what catches a queued act the sim dropped at `begin()`. `shovel` / `mine` / `harvest` / `plant` / `weed-spray` witness `Cell.kind`; `water` and `fertilize` / `compost` require `Soil.water` / `Soil.fertilizer` to rise; `tend` witnesses `Plant.tended`, or `Tree.tended` on a tree cell. A soil act on a cell with no soil is dropped outright. Acts with no witness — `consign`, machines, stores, `walk` — are not claimed either way.

An action that fails does not stop the list. Every remaining action still runs.

## Invariants

`play.hold` — Sim frozen between turns. The first `turn()` engages the hold and the solo rAF branch stops ticking. `turn()` drives `tick(DT_MAX)` itself.

`play.drain` — A turn dispatches in list order, then ticks until the local seat is idle. `wait` adds idle time on top. Bounded by `DRAIN_MAX`; `drained` is `idle` or `cap`.

`play.seam` — A seam inside a turn is captured into `days` and dismissed. A turn never returns while `seam.kind === 'recap'`.

`play.logged` — Every action commits a `Cmd`. Never `World.enqueue`, which is not logged and does not reach guests.

`play.witness` — An enqueued act with a post-condition witness reports dropped when the witness does not move. An act without one is not claimed.
