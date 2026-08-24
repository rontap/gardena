# Net

P2P farm session. Star. Host sequences. Everyone simulates. Lockstep is host bundles, not wait-for-all-inputs. [[architecture/world]] [[architecture/log]] [[architecture/save]] [[architecture/modules]] [[mechanics/multiplayer]] [[plans/early-access-1.1]]

No dedicated server. No host migration. No mesh. No TURN. No client prediction. No second snapshot.

## Files

| file | owns |
|---|---|
| `src/game/sim/mp.ts` | `PROTOCOL`, `MpMsg`, `MpWire`, `MpHost`, `MpGuest`, loopback, digest, sequencer / permissions. No `peerjs`. |
| `src/game/net/peer.ts` | PeerJS `MpWire`. Default cloud broker + default STUN. No TURN. |
| `src/App.tsx` | MP session. `MpHost` / `MpGuest`, PeerJS peer, pause + catching. `DT_MAX` accumulator. Does not own `Save`. |
| `src/game/sim/world.ts` | `World.seats`, `dispatch` / `apply` / `tick`. Does not import `peerjs`. |
| `src/game/sim/save.ts` | join / resync snapshot. Same `Save`. |

Do not create `src/` here. `World` does not import `peerjs`. `mp.ts` does not import `peerjs`.

## Protocol

```
PROTOCOL = 1.72
```

Number. Hello compares `PROTOCOL`, not `Save.version` alone. Guest protocol ≠ `PROTOCOL` → `reject: version`. Never hydrate.

## Topology

Star. Host PeerJS id is the room key. One `DataConnection` per guest. Guest holds one wire to host.

ICE fail is an error string. Not an `MpMsg` arm.

## MpMsg

JSON. Classes forbidden. Closed on `a`. Each `a` has exactly one meaning.

```
MpMsg =
  | { a: 'hello'; protocol: number; playerId: PlayerId }
  | { a: 'welcome'; protocol: number; seat: SeatId; save: Save; now: number; paused: boolean }
  | { a: 'reject'; reason: 'version' | 'full' | 'busy' }
  | { a: 'ready' }
  | { a: 'bundle'; t: number; cmds: Cmd[] }
  | { a: 'intent'; cmd: Cmd }
  | { a: 'pause'; on: boolean }
  | { a: 'digest'; t: number; hex: string }
  | { a: 'resync'; save: Save; now: number }
  | { a: 'bye'; why: 'host-left' | 'kicked' }
```

| `a` | dir | |
|---|---|---|
| `hello` | G→H | `protocol`, `playerId` |
| `welcome` | H→G | `protocol`, `seat`, `save`, `now`, `paused` |
| `reject` | H→G | `version` \| `full` \| `busy` |
| `ready` | G→H | — |
| `bundle` | H→G | `t`, `cmds` |
| `intent` | G→H | `cmd` — host stamps `t` + `p` |
| `pause` | both | `on` |
| `digest` | H→G | `t`, `hex` |
| `resync` | H→G | `save`, `now` |
| `bye` | H→G | `host-left` \| `kicked` |

`full` when `seats.length === 4`. Away occupies a slot. Rejoin is the same `playerId`, not a fifth seat. `busy` if a join is mid-snapshot.

`welcome.now` / `resync.now` is live `World.now`. Not in `Save`. Parse then stamp `now` from the wire.

## MpWire

Sim speaks this. Tests use loopback. PeerJS implements it in `net/peer.ts` only.

```
MpWire = {
  send(msg: MpMsg): void
  onRecv(fn: (msg: MpMsg) => void): void
  close(): void
}
```

Loopback: in-process pair. `send` on one end is `onRecv` on the other. No PeerJS. No broker.

Host: one `MpWire` per guest. Guest: one `MpWire` to host.

## Bundles

Host rAF accumulator pumps bundles. Guests pump from received bundles. Solo: App accumulator, no wire.

```
bundle = { t, cmds: Cmd[] }
```

`cmds` may be empty. Empty still ticks. `t` is `World.now` after that tick. Each cmd in the bundle has `Cmd.t` equal to `now` before the tick (`dispatch` stamp) and required `p`.

Per bundle, every peer: apply `cmds` in order, then `tick(DT_MAX)` once. Recap still early-returns after `now += 1`.

Host input: `dispatch` locally; those cmds are in that bundle. Guest input: `intent`; host stamps `t = World.now` and `p` from that connection's seat (guest `t`/`p` ignored), sequencer, `dispatch`, include in the next bundle. Guest applies when the bundle arrives. No client prediction.

Guests are behind by ~1 RTT, not divergent. A stalled guest fast-forwards queued bundles. They do not hold the others. Gap > 5s wall → resync.

## Pause

Net flag. Not a `Cmd`. Not in `Save`. Host stops bundling while paused. Any player may toggle. Join / resync forces pause until `ready`. Host unpauses on join fail too.

## Digest

Every 30 ticks host sends `digest`. `hex` hashes invariant-40 shared digest plus every seat `actor.x` / `actor.y`, `hand`, `inventory`, `presence`, `place`, plus every vehicle `id` `kind` `fuel` `pose` and quad `slots` / tractor `hitch` `boom`, plus every trailer `id` `kind` `pose` hopper or `slots`, plus every wire `from`/`to`, every sensor `out`/`inn`, mill/jam/still `inn`, chest/freezer/seed-silo/additive-store `out`, sprinkler unwired vs level, smart-valve held level. Not `savedAt`. Not camera. Not panels. Not hangar select. Not lens.

Guest behind `t`: apply queued bundles. Digest mismatch: pause, `resync`, `ready`, unpause. One retry. Second mismatch → that guest `bye: kicked`. Host continues.

Version mismatch: `reject: version`. Never hydrate.

## Illegal

- `World` importing `peerjs`
- `mp.ts` importing `peerjs`
- PeerJS outside `src/game/net/peer.ts`
- mesh
- wait-for-all-inputs
- host migration
- TURN
- client prediction
- a second snapshot type
- `Cmd` on the wire missing `p`
- ticking a leftover `dt`
- hello comparing only `Save.version`
