# Net

P2P farm session. Star. Host sequences. Everyone simulates. Lockstep is host bundles, not wait-for-all-inputs. [[architecture/world]] [[architecture/log]] [[architecture/save]] [[architecture/modules]] [[mechanics/multiplayer]] [[plans/early-access-1.1]]

`sim/mp.ts` owns `PROTOCOL`, `MpMsg`, `MpWire`, `MpHost`, `MpGuest`, loopback, digest, sequencer. `net/peer.ts` owns PeerJS `MpWire`. App holds the session. `World` does not import `peerjs`. `mp.ts` does not import `peerjs`.

## Protocol

Hello compares `PROTOCOL`, not `Save.version` alone. Guest protocol ≠ `PROTOCOL` → `reject: version`. Never hydrate. Digits: [[GLOBAL_VERSION]].

## Topology

Star. Host PeerJS id is the room key. One `DataConnection` per guest. Guest holds one wire to host.

ICE fail is an error string. Not an `MpMsg` arm.

## MpMsg

JSON. Classes forbidden. Closed on `a`. Each `a` has exactly one meaning. Arms: `hello` `welcome` `reject` `ready` `ping` `bundle` `intent` `pause` `digest` `resync` `roster` `bye`. Shape: `sim/mp.ts`.

`full` when `seats.length === 4`. Away occupies a slot. Rejoin is the same `playerId`, not a fifth seat. `busy` if a join is mid-snapshot.

`welcome.now` / `resync.now` is live `World.now`. Not in `Save`. Parse then stamp `now` from the wire.

## Roster

`roster.seats` is `RosterSeat[]`. Presence and names never ride the command log; the host pushes them. `applyRoster` writes `name` `presence` `napping` onto existing seats. It does not write `leave`. `leave` is not `World`.

```
RosterSeat =
  | { id: SeatId; name: string; presence: Presence; napping: boolean }
  | { id: SeatId; name: string; presence: Presence; napping: boolean; leave: 'drop' | 'kicked' }
```

| field | type | |
|---|---|---|
| `id` | `SeatId` | |
| `name` | string | `cleanName` |
| `presence` | `Presence` | |
| `napping` | boolean | |
| `leave` | `'drop' \| 'kicked'` | that push only |

`rosterOf` has no `leave`. Silence (`AWAY_MS` / nap) pushes `roster` with no `leave`. Link released (`drop` / leave / `lost` / `DROP_MS`): that push sets `leave: 'drop'` on that seat. `bye: kicked` then drop: that push sets `leave: 'kicked'` on that seat. Later pushes omit it.

`readMpMsg` copies `leave` iff it is `'drop'` or `'kicked'`. Absent stays absent. Additive JSON. Do not bump `PROTOCOL`.

Command Center rows are stamped at the net/App boundary from that push, not from `noticeRows` — [[ui/notices]] `notices.roster`. Host stamps `joined` on a new seat or `away` → `in`; `quit` on `leave: 'drop'`; `desynced` on `leave: 'kicked'`. Guests: join from seats; quit vs kick from `leave`. Not this page's seat. Solo (`seats.length === 1`, no session) never mints.

## MpWire

Sim speaks this. Tests use loopback. PeerJS implements it in `net/peer.ts` only.

Loopback: in-process pair. `send` on one end is `onRecv` on the other. No PeerJS. No broker.

Host: one `MpWire` per guest. Guest: one `MpWire` to host.

## Bundles

Host rAF accumulator pumps bundles. Guests pump from received bundles. Solo: App accumulator, no wire.

`cmds` may be empty. Empty still ticks. `t` is `World.now` after that tick. Each cmd in the bundle has `Cmd.t` equal to `now` before the tick (`dispatch` stamp) and required `p`.

Per bundle, every peer: apply `cmds` in order, then `tick(DT_MAX)` once. `World.tick` always `now += 1` then `tickWorld`. Seam recap early-return is `tickWorld`, not `World.tick`.

Host input: `dispatch` locally; those cmds are in that bundle. Guest input: `intent`; host stamps `t = World.now` and `p` from that connection's seat (guest `t`/`p` ignored), sequencer, `dispatch`, include in the next bundle. Guest applies when the bundle arrives.

Guests are behind by ~1 RTT, not divergent. A stalled guest fast-forwards queued bundles. They do not hold the others. Gap > 5s wall → resync.

`bundle.t` is a sequence, not a label. Guest applies only `t === now + 1`. `t <= now` is stale, dropped. `t > now + 1` is a gap: `hello`, resync, later bundles stay queued, catching holds. `lastWall` moves only on an applied bundle, so a lost hello still stalls and hellos again. The wire is ordered (`reliable: true`) — the check is the backstop, not the mechanism.

Guest contract cmds are dropped by the sequencer and never enter a bundle. Guest consign at the truck still fills contract bins. — [[mechanics/multiplayer]] `mp.guest`.

## Snapshot

`dump` → `parse` normalises. The host does not. So host `rebase()` before every `dump` for `welcome` / `resync`: clear each seat `queue` `cue` `workLeft` `workTotal` `filling` `place` `drive` `stride` `actor.work`, rewrite `legStart`, snap a driving seat's actor to its vehicle, zero `bigAcc`, `pumpLiters`, every `StallGood.sat`, `cheatFastResearch` false, `cheatSpeed` 1, `nets` undefined, sort `pumps` `tanks` `wells` `taps` `stills` `waterSystems` (`net.order`), `indexAll()`. Same body as hydrate. Without it the guest is born diverged in `place` / `actor` (digested) and in `bigAcc` phase / `live` order (not digested), and `resync` ships the same dump so it never converges.

`rebase()` clears every seat. A dump to one link leaves the others on old `place` (digested). One `rebaseAndSnapshotAll(except?)` for underflow, seated hello, and new join. `except` is the joining link that already got `welcome`. A new seat never rides the log and `roster` cannot create one.

## Pause

Net flag. Not a `Cmd`. Not in `Save`. Host stops bundling while paused. Any player may toggle. Join / resync forces pause until `ready`. Host unpauses on join fail too.

## Invariants

Floats in the digest are rounded to 4 decimals: `Math.cos`/`sin`/`atan2`/`hypot` are implementation-approximated, so two engines differ by an ULP on vehicle and actor integration. Bounds false positives; does not make the sim bit-identical across engines. `digestSections` / `digestDiff` name which section drifted.

`net.digest` — Same seed + same `Cmd[]` applied at those `t` with `dt = DT_MAX` → equal digest: `money`, `clock.day`, `clock.t`, `weather(clock.day)`, each seat `hand`/`inventory`, cell kinds, plant crop/variety/quality/maturity/`happiness`, per-cell `Soil` water and fertilizer, tree variety, drop count, `done`, family `owned`, stall stock, every `StallGood.sat`, per active contract `offer.id` `dueDay` each bin `filled`, `takenToday`, every wire `from`/`to`, every sensor `out`/`inn`, mill/jam/still/station `inn`, mill/jam/grinder/station locked crop+variety, chest/freezer/seed-silo/additive-store `out`, sprinkler unwired vs wired level, wired-valve held level, every vehicle `id` `kind` `fuel` `pose` `route` `cursor` `running` `dwell` and quad `slots` / tractor `hitch` `boom`, every trailer `id` `kind` `pose` hopper or `slots`, every route `id` `name` `stops`, `nextRouteId`, `nextVehicleId`, `nextTrailerId`, traffic-light `inn`/`out`/`hold`, `bigAcc`, reservoir `stored`, `pumpLiters`, `job`, `points`. Board not digested. Pins not digested. Two Worlds, same seed, no cmds, N ticks of `DT_MAX` → equal digest.

`net.bundle` — Per host `bundle`: apply `cmds` in log order, then `tick(DT_MAX)`. Empty `cmds` still tick. `bundle.t` is `now` after that tick.

`net.full` — `hello` when `seats.length === 4` → `reject: full`. Away occupies a slot. Rejoin is the same `playerId`.

`net.kick` — Digest mismatch: guest `hello` carrying `desyncT` = the digest `t` it failed on, and `diff` the section names. Host `onDesync` prints those names. Host: pause, `resync`, Ready, unpause. Two mismatches within `DIGEST_EVERY * 2` ticks → that guest `bye: kicked`. The roster push that follows carries `leave: 'kicked'` on that seat. Keyed on `t`, not wall time, so it holds at any RTT. A `hello` without `desyncT` is a join or a stall retry and never counts. Host continues. Guest behind `t`: apply queued bundles. Version mismatch: `reject: version`. Never hydrate.

`net.seq` — Guest applies a bundle only when `bundle.t === now + 1`. Stale dropped. Gap: `hello`, later bundles stay queued, catching holds until the next applied tick or a resync. `lastWall` moves only on an applied bundle. `wrapConn.send` reads `conn.open`; false → `{ a: 'bye', why: 'lost' }`.

`net.snapshot` — Host `rebase()` before every `dump` on the wire. `rebase()` clears every seat, so a dump to one link leaves the others on old `place`. One `rebaseAndSnapshotAll(except?)` for underflow, seated hello, and new join. `logSince` below `logBase` → `undefined` → resync, never a clamped replay.

`net.order` — `World.pumps` `tanks` `wells` `taps` `stills` `waterSystems` are purchase order on the host. Dump writes no arrays for them; parse walks cells, so those lists are chunk then row/col after hydrate. `pull` shares by array order, so `stored` and `pumpLiters` diverge after join. `rebase()` sorts those lists by `originCell` row then col (comparator in `sim/util.ts`, same shape as `boomHits`: `a.row === b.row ? a.col - b.col : a.row - b.row`). Not per tick. Not per push. `World.pump` and `generateChunk`'s starter argument find `form === 'starter'`; sort must not be required to keep index 0. Parse does not `unshift` the starter pump. Do not sort hangars, silos, or modifiers — those are not in `pull`.
