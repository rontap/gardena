# Net

Code: `sim/mp.ts` (messages, `MpHost`, `MpGuest`, digest, loopback), `net/peer.ts` (the PeerJS transport), `sim/player.ts` (player id and name), the session code in `App.tsx`; see [[code-map]].

## Job

Keeps up to four copies of one `World` equal, one per player, without sending the world each step. The host decides the order of every command; every player runs the same simulation on the same commands, and a hash of the world checks that the copies still match. When they do not, the host sends a snapshot. The player side of multiplayer (hosting, joining, seats, what a guest may do) is [[features/multiplayer]].

## Used by

- [[features/multiplayer]] — hosting, joining, leaving, seats and presence.
- [[systems/commands]] — a guest's commands go to the host through `World.remote`; the host's log is what each bundle carries.
- [[systems/tick]] — host and guests step only through bundles.
- [[systems/save]] — `dump` and `parse` are the snapshot.
- [[systems/rng]] — randomness comes from the seed and positions, so every copy draws the same numbers.
- Every feature page's **Save and sync** section lists what its state adds to the digest.

## Contract

### Shape

```
            host (seat 0)                     guest (seat 1..3)
   input -> World.dispatch                  input -> World.remote -> intent --+
            World.log                                                         |
   pump():  tick(DT_MAX)                                                      |
            bundle {t, cmds since last} ----------------------------------> apply cmds, tick(DT_MAX)
            every DIGEST_EVERY ticks: digest {t, hex, sections} ---------> compare at the same t
          <------------------------------------------------------------- intent: host stamps t and seat,
                                                                          checks permit, dispatches
```

The host is the only one who orders commands. It is a star: each guest has one connection, to the host. `World` and `mp.ts` do not import PeerJS; `MpWire` (`send`, `onRecv`, `close`) is the only link, and tests use `loopback()` or `jitterLoopback()` (which lets a test reorder messages) in its place.

### Transport

`openPeer` creates a PeerJS peer; the host's peer id is the room code the host shares. `dial` connects with `reliable: true`, which makes the data channel ordered: bundles must arrive in the order they were sent. `wrapConn` turns the connection closing or failing, or a send on a closed connection, into `{ a: 'bye', why: 'lost' }`.

### Messages

`MpMsg` is JSON, one arm per `a`; `readMpMsg` checks each message received and drops unknown ones.

| `a` | from | carries |
|---|---|---|
| `hello` | guest | `GAME_VERSION`, player id, name; `desyncT` and `diff` when sent because a digest failed |
| `welcome` | host | the seat, a snapshot (`Save`), `now`, paused |
| `reject` | host | `version`, `full` (four seats taken, away seats included), `busy` (another join in progress) |
| `ready` | guest | the snapshot is loaded |
| `ping` | guest | every `PING_MS`, even while paused |
| `bundle` | host | `t` and the commands to apply before tick `t` |
| `intent` | guest | one command |
| `pause` | both | the pause flag |
| `digest` | host | `t`, the hash, and a hash per section |
| `resync` | host | a new snapshot and `now` |
| `roster` | host | every seat's name, presence and napping, and `leave` (`drop` or `kicked`) on the push that reports it |
| `bye` | both | `host-left`, `kicked`, or `lost` (the transport dropped) |

### Joining

1. The guest sends `hello`. A different `GAME_VERSION` is rejected; a guest never loads a snapshot of another version.
2. The host calls `World.join(playerId, name)`: the same player id gets its old seat back; a new one gets the next seat, up to four.
3. The host pauses, calls `rebaseAndSnapshotAll(except the new link)` so every guest already connected gets a fresh `resync`, and sends the new guest `welcome` with its own snapshot.
4. Each guest parses the snapshot, sets `now`, `local` and `remote`, and sends `ready`. The host unpauses when every seated guest is ready.

`rebase()` runs on the host before every snapshot. It clears every seat's jobs, work, Build tool, walking and driving input, zeroes `bigAcc` and `pumpLiters`, turns off cheats, and sorts the source, tap and still lists (`net.order`, [[systems/water-network]]). That makes the host's live world equal to what `parse` produces on the guest. It clears every seat, so every connected guest gets a new snapshot whenever one does.

### Steps

The host's frame loop calls `pump()` for each `DT_MAX` of accumulated time, at most two per frame. `pump` ticks the world, then sends each seated guest a `bundle` with the commands from the log since that guest's last bundle, and every `DIGEST_EVERY` ticks a `digest`. If a guest's position has fallen off the 500-command log (`logSince` returns undefined), the host pauses and snapshots every guest instead of replaying.

A guest applies a bundle only when `bundle.t` is exactly `now + 1`: apply its commands in order, then `tick(DT_MAX)` (`applyBundle`). A lower `t` is dropped. A higher `t` is a gap: the guest keeps it queued, shows **Catching up**, and sends one `hello`, which the host answers with a snapshot. A guest's own input takes effect when the host's bundle carrying it arrives, about one round trip later.

### Digest

`digestParts(world)` builds named sections: money, day and time of day, today's weather, seats (position, hand, inventory, presence, Build tool), vehicles, trailers, routes, one line per tile with its kind and the state that matters for it, soil, happiness, wires, held valve inputs, wired sprinkler inputs, the count of items on the ground, research, skills, Market goods, active contracts, `bigAcc`, stored water, `pumpLiters`, the research job, skill points, and the next vehicle, trailer and route ids. Every float that is integrated over time is rounded to four decimals (`q`) first. `digestHex` hashes the whole with FNV-1a; `digestSections` hashes each section.

A guest compares a digest only when it has reached the same `t`; behind the host is latency, not a mismatch. On a mismatch it sends `hello` with `desyncT` and the names of the sections that differ; the host logs the names, pauses and snapshots. A second mismatch from the same guest within `DIGEST_EVERY` × 2 ticks gets `bye: kicked`. The count is in ticks, not wall time, so it does not depend on the connection's delay.

### Silence and leaving

The host measures silence per guest on its own wall clock (`sweep`): after `AWAY_MS` the seat is away, after `NAP_MS` it is napping, after `DROP_MS` the connection is closed. A `ping` from an away seat brings it back. An away seat stays in `seats` and counts toward four; its gardener is not drawn and does not work.

A guest with no bundle for `STALL_MS` sends `hello` again; after `RETRY_MAX` attempts with no answer it gives up with `lost` (**Reconnecting {n} of {max}** while it tries). Anything from the host resets the count.

The host leaving writes the save slot and sends `bye: host-left`; guests return to the main menu with the reason ([[menu]]).

### Pause

Pause is a flag on the session, not a command and not saved. Any player can toggle it; the host stops sending bundles while it is on. Joining and resyncing pause until every guest is ready.

### Player identity

`localPlayerId()` is a random id created once and kept in the browser's local storage under `MP_ID_KEY`; it is how a player gets their seat back. The name is kept under `MP_NAME_KEY`, trimmed to `NAME_MAX` characters (`cleanName`). Neither is in the save.

## Entry points

- `MpHost`: `attach(wire)`, `pump()`, `setPaused`, `pushRoster`, `drop(wire, leave)`, `leave()`; callbacks `onPause`, `onCatching`, `onDesync`, `onRoster`.
- `MpGuest`: `hello`, `intent`, `togglePause`, `pumpGap(now)` (heartbeat and stall check, from the frame loop), `leave`; callbacks `onWorld`, `onCatching`, `onRetry`, `onPause`, `onBye`, `onReject`, `onRoster`.
- `permit(cmd)`, `applyBundle`, `digestParts`, `digestHex`, `digestSections`, `digestDiff`, `rosterOf`, `applyRoster`, `readMpMsg`, `loopback`, `jitterLoopback`.
- `net/peer.ts`: `openPeer`, `listen`, `dial`, `wrapConn`.

## Data

Session state lives in `MpHost` and `MpGuest` and in `App`, never in `World` or the save: links, their log positions, ready flags, mismatch counts, the pause flag, the bundle queue. `World.now` is sent with every snapshot and is not saved.

## Invariants

| id | rule | test |
|---|---|---|
| `net.bundle` | each bundle: apply its commands in log order, then one `tick(DT_MAX)`; an empty bundle still ticks | `mp.test.ts` |
| `net.digest` | the same seed and the same commands at the same `t` give the same digest | `mp.test.ts` |
| `mp.float` | integrated floats are rounded to four decimals before hashing, and the water bill to cents, so engine rounding differences are not a mismatch | `mp.test.ts` |
| `net.seq` | a guest applies only `bundle.t === now + 1`; a gap asks for a snapshot and keeps later bundles | `mp.test.ts` |
| `net.snapshot` | the host rebases before every snapshot and snapshots every guest when one joins | `mp.test.ts` |
| `net.kick` | two mismatches within `DIGEST_EVERY` × 2 ticks kick that guest; a `hello` without `desyncT` never counts | `mp.test.ts` |
| `net.full` | four seats, away ones included; the same player id rejoins its seat | `mp.test.ts` |
| `mp.guest` | a guest may send every command except `pickSkill`, `expand` and `cheat` | `mp.test.ts` |
| `net.order` | `rebase()` sorts the water lists by origin tile | `mp.test.ts` |

## When you change this

- New state that changes over time: add it to `digestParts` (rounded with `q` if it is a float integrated over time) and to [[systems/save]]; state missing from the snapshot or the digest makes copies differ without anyone noticing.
- New randomness: draw it from [[systems/rng]] by position or day, never `Math.random` or the wall clock.
- New command: decide in `permit` whether a guest may send it ([[systems/commands]]).
- New message: an arm in `MpMsg` and its check in `readMpMsg`.
- Anything the host's live world holds that `parse` would not rebuild: clear it in `rebase()`.

## Decisions

- Lockstep with host bundles, not a shared world sent each step: only commands cross the connection, so traffic stays small whatever the farm's size.
- Guests do not predict their own input; it waits for the host's bundle.
- Rounding in the digest limits false mismatches between browsers; it does not make the simulation identical across engines.
