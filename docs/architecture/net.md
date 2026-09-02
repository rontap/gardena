# Net

P2P farm session. Star. Host sequences. Everyone simulates. Lockstep is host bundles, not wait-for-all-inputs. [[architecture/world]] [[architecture/log]] [[architecture/save]] [[architecture/modules]] [[mechanics/multiplayer]] [[plans/early-access-1.1]]

`sim/mp.ts` owns `PROTOCOL`, `MpMsg`, `MpWire`, `MpHost`, `MpGuest`, loopback, digest, sequencer. `net/peer.ts` owns PeerJS `MpWire`. App holds the session. `World` does not import `peerjs`. `mp.ts` does not import `peerjs`.

## Protocol

Hello compares `PROTOCOL`, not `Save.version` alone. Guest protocol ≠ `PROTOCOL` → `reject: version`. Never hydrate. Digits: [[GLOBAL_VERSION]].

## Topology

Star. Host PeerJS id is the room key. One `DataConnection` per guest. Guest holds one wire to host.

ICE fail is an error string. Not an `MpMsg` arm.

## MpMsg

JSON. Classes forbidden. Closed on `a`. Each `a` has exactly one meaning. Arms: `hello` `welcome` `reject` `ready` `bundle` `intent` `pause` `digest` `resync` `bye`. Shape: `sim/mp.ts`.

`full` when `seats.length === 4`. Away occupies a slot. Rejoin is the same `playerId`, not a fifth seat. `busy` if a join is mid-snapshot.

`welcome.now` / `resync.now` is live `World.now`. Not in `Save`. Parse then stamp `now` from the wire.

## MpWire

Sim speaks this. Tests use loopback. PeerJS implements it in `net/peer.ts` only.

Loopback: in-process pair. `send` on one end is `onRecv` on the other. No PeerJS. No broker.

Host: one `MpWire` per guest. Guest: one `MpWire` to host.

## Bundles

Host rAF accumulator pumps bundles. Guests pump from received bundles. Solo: App accumulator, no wire.

`cmds` may be empty. Empty still ticks. `t` is `World.now` after that tick. Each cmd in the bundle has `Cmd.t` equal to `now` before the tick (`dispatch` stamp) and required `p`.

Per bundle, every peer: apply `cmds` in order, then `tick(DT_MAX)` once. Recap still early-returns after `now += 1`.

Host input: `dispatch` locally; those cmds are in that bundle. Guest input: `intent`; host stamps `t = World.now` and `p` from that connection's seat (guest `t`/`p` ignored), sequencer, `dispatch`, include in the next bundle. Guest applies when the bundle arrives.

Guests are behind by ~1 RTT, not divergent. A stalled guest fast-forwards queued bundles. They do not hold the others. Gap > 5s wall → resync.

`bundle.t` is a sequence, not a label. Guest applies only `t === now + 1`. `t <= now` is stale, dropped. `t > now + 1` is a gap: `hello`, resync. One `hello` per gap. The wire is ordered (`reliable: true`) — the check is the backstop, not the mechanism.

Guest contract cmds are dropped by the sequencer and never enter a bundle. Guest consign at the truck still fills contract bins. — [[mechanics/multiplayer]] `mp.guest`.

## Snapshot

`dump` → `parse` normalises. The host does not. So host `rebase()` before every `dump` for `welcome` / `resync`: clear each seat `queue` `cue` `workLeft` `workTotal` `filling` `place` `drive` `stride`, snap a driving seat's actor to its vehicle, zero `bigAcc`, `indexAll()`. Same body as hydrate. Without it the guest is born diverged in `place` / `actor` (digested) and in `bigAcc` phase / `live` order (not digested), and `resync` ships the same dump so it never converges.

A new seat never rides the log and `roster` cannot create one. New seat → resync every other seated guest.

## Pause

Net flag. Not a `Cmd`. Not in `Save`. Host stops bundling while paused. Any player may toggle. Join / resync forces pause until `ready`. Host unpauses on join fail too.

## Invariants

Floats in the digest are rounded to 4 decimals: `Math.cos`/`sin`/`atan2`/`hypot` are implementation-approximated, so two engines differ by an ULP on vehicle and actor integration. Bounds false positives; does not make the sim bit-identical across engines. `digestSections` / `digestDiff` name which section drifted.

`net.digest` — Same seed + same `Cmd[]` applied at those `t` with `dt = DT_MAX` → equal digest: `money`, `clock.day`, `clock.t`, each seat `hand`/`inventory`, cell kinds, plant crop/rarity/maturity, drop count, `done`, family `owned`, stall stock, every `StallGood.sat`, per active contract `offer.id` `dueDay` each bin `filled`, `takenToday`, every wire `from`/`to`, every sensor `out`/`inn`, mill/jam/still `inn`, chest/freezer/seed-silo/additive-store `out`, sprinkler unwired vs wired level, wired-valve held level, every vehicle `id` `kind` `fuel` `pose` `route` `cursor` `running` `dwell` and quad `slots` / tractor `hitch` `boom`, every trailer `id` `kind` `pose` hopper or `slots`, every route `id` `name` `stops`, `nextRouteId`, traffic-light `inn`/`out`/`hold`. Board not digested. Two Worlds, same seed, no cmds, N ticks of `DT_MAX` → equal digest.

`net.bundle` — Per host `bundle`: apply `cmds` in log order, then `tick(DT_MAX)`. Empty `cmds` still tick. `bundle.t` is `now` after that tick.

`net.full` — `hello` when `seats.length === 4` → `reject: full`. Away occupies a slot. Rejoin is the same `playerId`.

`net.kick` — Digest mismatch: guest `hello` carrying `desyncT` = the digest `t` it failed on. Host: pause, `resync`, Ready, unpause. Two mismatches within `DIGEST_EVERY * 2` ticks → that guest `bye: kicked`. Keyed on `t`, not wall time, so it holds at any RTT. A `hello` without `desyncT` is a join or a stall retry and never counts. Host continues. Guest behind `t`: apply queued bundles. Version mismatch: `reject: version`. Never hydrate.

`net.seq` — Guest applies a bundle only when `bundle.t === now + 1`. Stale dropped, gap → resync. `net.snapshot` — Host `rebase()` before every `dump` on the wire. New seat → resync every other seated guest. `logSince` below `logBase` → `undefined` → resync, never a clamped replay.
