# 1.1 Early Access — Multiplayer Beta

P2P farm session. PeerJS. Deterministic lockstep, host sequences. No dedicated server. No host migration. No wait-for-all-inputs.

Next agent: read [[canon]], [[pipeline]], [[architecture/save]], [[architecture/log]], [[architecture/world]], [[ui/menu]], [[ui/hud]]. Do not invent a second snapshot. Do not mesh. Do not wait for all four inputs before a tick.

---

## Why lockstep

v0.9 `Cmd[]` + seeded RNG + digest (invariants 40–41) is the live wire. v1.0 `Save` is join/resync, not the stream.

Live rAF currently ticks leftover `min(left, DT_MAX)`, so two machines take different `dt` slices and different `now` counts. That is a solo bug relative to the test invariant. Fix: sim ticks **only** `DT_MAX` (`1/15`). Remainder stays in an accumulator. Solo and MP.

View still paints every rAF. No sim interpolation this slice.

**Host sequences, everyone simulates.** Classic lockstep that waits for all inputs is out: one throttled tab would pause the farm. Silent seats send nothing. Pause is explicit, or join/resync.

Star, not mesh. Host PeerJS id is the room key. One `DataConnection` per guest.

---

## User flow

**Host (in play).** Top ribbon, left of Pause: two-figures face **Multiplayer**. Click → dialog. Copyable room key (host PeerJS id). Close does not end the session.

**Guest (startup menu).** Fourth button **Join Multiplayer**. Paste key, **Join**. Not in-play. Not `#start_now`.

**Handshake.** Host pauses. Overlay on every connected client: **Catching up...**. Host sends protocol + snapshot. Versions must match. Guest hydrates, acks. Host unpauses. Fail stays on that overlay or the join dialog. Host unpauses on fail too.

**Play.** Up to 4 gardeners. Same `actor.svg`, hat recolor per seat. Shared money and farm. Each seat: actor, hand, 16-slot house inventory, walk queue, place.

**Leave / rejoin.** Guest drop → seat `away`. World keeps ticking. That actor vanishes. Hand + inventory (box cargo included) skip freshness. Field / chest / ground rot continues. Rejoin same `playerId` restores that seat. Host pauses for the snapshot again.

**Host leave.** `writeSlot(dump(world))`. Peers get **Host left.** Back to startup. Guest slot **not** written. No migration.

---

## Seats

```
SeatId = 0 | 1 | 2 | 3
Presence = 'in' | 'away'
PlayerId = string   // uuid, localStorage gardena-mp-id, created once

Seat = {
  id: SeatId
  playerId: PlayerId
  actor: Actor
  hand: Hand
  inventory: Slot[]     // length 16
  queue: Intent[]
  presence: Presence
  place: Place
}
```

`World.seats: Seat[]`. Length 1..4. Index 0 is always the host / solo player. No parallel `World.actor` / `hand` / `inventory` / `queue`.

`App.local: SeatId` is who this page is.

**Join kit (P2–P4, first time).** Shovel in hand, 16 empty slots, queue empty, `place: none`. Spawn at `DOOR` offset by `id` (`+ (id * 0.6)` along x). Rejoin does not re-kit.

**Away.** `tick` skips that actor's walk/work and that seat's hand/inventory freshness. Seat stays in `seats`.

---

## Clock and authority

Accumulator in App. Fire `tick(DT_MAX)` only. Never tick a leftover. Recap still early-returns after `now += 1`.

| Path | Rule |
|---|---|
| Tick | Every peer runs `tick(DT_MAX)` once per host `bundle`. Host rAF accumulator pumps bundles. Guests pump from received bundles. |
| Bundle | `{ t, cmds: Cmd[] }` for that `now`. Empty cmds still tick. `t` is `now` after the tick. |
| Guest input | `intent`. Host stamps `t`, sets `p`, includes in the next bundle, `dispatch`. Guest applies when the bundle arrives. No client prediction. |
| Host input | `dispatch` locally, same cmds in that bundle. |
| Pause | Net flag. Host stops bundling. Any player may toggle. Join/resync forces pause until Ready. |
| Cheat | Seat 0 only. Sequencer drops other `Act.cheat`. |
| Permissions | Sequencer drops illegal guest cmds. They never enter a bundle. |

`Cmd` gains required `p: SeatId`. Solo and tests: `p = 0`. Not in `Save`.

Two seats, same tile, same `t`: log order. First wins, second no-op.

Guests are behind by ~1 RTT, not divergent. A stalled guest fast-forwards queued bundles under **Catching up...**. They do not hold the others.

---

## Guest permissions

**Guests may:** walk, till, plant, water, harvest, tend, mine, pick up / drop, fill at pump/tap, own house inventory (`swap`), **Sell all**, shop **Seeds** and **Utility**, shop + place **buildings** (pumpjack, well, rain-tank, tap, chest, grinder, compost-box), **delete building**, Almanac, lens (if shared family owns the skill), Pause.

**Guests may not:** Research start, Family pick, expand, pipes, valves, sprinklers, tiles, fences, chest `swapChest`, sprinkler tune, stall `nudgeOffered`, recap dismiss, cheat, New/Load/Upload.

House click opens *this* seat's 16. Placing a chest is allowed; opening it is not.

Skipped surfaces, this comment form only:

```
// TODO 1.1 multiplayer {one line}
```

Sites: guest chest swap, guest pipe/valve/sprinkler/tile/fence, guest expand, guest family pick, guest research start, host migration, client prediction, TURN.

---

## Protocol

`peerjs`. Default cloud broker + default STUN. No TURN. ICE fail is an error string. PeerJS in `src/game/net/peer.ts`. Sim speaks `MpWire`. Tests use a loopback wire. `World` does not import `peerjs`.

`PROTOCOL = 1.1`. Hello compares this, not `Save.version` alone.

| `a` | dir | body |
|---|---|---|
| `hello` | G→H | `protocol`, `playerId` |
| `welcome` | H→G | `protocol`, `seat`, `save`, `now`, `paused` |
| `reject` | H→G | `reason: 'version' \| 'full' \| 'busy'` |
| `ready` | G→H | — |
| `bundle` | H→G | `t`, `cmds: Cmd[]` |
| `intent` | G→H | `cmd` (host stamps `t` + `p`) |
| `pause` | both | `on: boolean` |
| `digest` | H→G | `t`, `hex` |
| `resync` | H→G | `save`, `now` |
| `bye` | H→G | `why: 'host-left' \| 'kicked'` |

`full` when `seats.length === 4`. Away occupies a slot. Rejoin is the same `playerId`. `busy` if a join is mid-snapshot.

---

## Desync

Not OT. Not rewind. Snapshot is the repair. Digest is real equality: every peer that has applied bundles through `t` must match.

Every 30 ticks host sends `digest`. `hex` hashes the invariant-40 shared digest plus every seat's `actor.x/y`, `hand`, `inventory`, `presence`, `place`. Not `savedAt`. Not camera. Not panels.

Guest behind `t`: **Catching up...**, apply queued bundles. Gap > 5s wall → resync.

Digest mismatch: pause, `resync`, Ready, unpause. One retry. Second mismatch → that guest **This farm drifted and could not be repaired.** Host continues.

Version mismatch: `reject: version`. Never hydrate.

---

## Save 1.1

`Save.version` is `1.1`. Replace `actor` / `hand` / `inventory` with `seats: SaveSeat[]`. Length ≥ 1. Seat 0 = host. `place` and `queue` not in the file.

```
SaveSeat = {
  playerId: PlayerId
  presence: Presence
  actor: { x, y }
  hand: Hand
  inventory: Slot[]
}
```

Dump writes `version: 1.1`. Load: file `version` ≠ dump `version` → `version` alert. No migrate. Same version → hydrate live fields (`seats`). Fail → `unusable`. RFC: [[architecture/save]].

Host leave and recap still `writeSlot`. Guest never `writeSlot` for a hosted farm.

Menu wordmark **1.1.0**.

---

## UI / art (named for later agents)

HUD face `ui-btn-multiplayer.svg` left of Pause. Startup fourth button **Join Multiplayer**. Catch-up overlay. Gear while connected: New/Load/Upload disabled; guest **Leave Multiplayer**. Hat CSS `--hat` off-palette (not cottage): seat 0 straw `#d4a017`, 1 `#ff3d8e`, 2 `#2de8ff`, 3 `#b85cff`. Band `#6b4423`. `actor.svg` groups crown as `id="hat"`.

Copy:

| reason | line |
|---|---|
| `version` | This build is a different version. |
| `full` | This farm already has four gardeners. |
| `busy` | Host is busy letting someone in. |
| ICE / peer fail | Could not reach the host. |
| host-left | Host left. |
| desync | This farm drifted and could not be repaired. |
| unusable | This farm could not be used. |

---

## Files

| file | owns |
|---|---|
| `docs/architecture/net.md` | `MpMsg`, `MpWire`, PeerJS boundary, star, `PROTOCOL`, bundles |
| `docs/mechanics/multiplayer.md` | seats, permissions, away-rot, pause, host leave |
| `src/game/sim/mp.ts` | messages, digest, permissions (no PeerJS) |
| `src/game/net/peer.ts` | PeerJS `MpWire` |
| `src/game/ui/multiplayer.tsx` | dialogs + overlay |

---

## Out of scope

Host migration. TURN. Voice. Names. Guest save slot. Client prediction. Cmd replay viewer. Mesh. Wait-for-all-inputs lockstep. Cross-version play. Guest chest / pipes / tiles / fences / expand / family / research.

---

## Locked

- Lockstep. Host sequences. Everyone ticks `DT_MAX` only.
- Star. PeerJS default broker. No TURN.
- `Cmd.p` required. Sequencer drops illegal guest cmds.
- Save `1.1` seats array. Dump writes `version: 1.1`. File `version` ≠ dump `version` → version alert. No migrate.
- Buildings place/delete allowed for guests. Chest swap, pipes, tiles, fences, expand, research, family, cheat: not.
- Away inventory does not rot. Field rot continues.
- Host leave saves host slot only.
- Comment exception: `// TODO 1.1 multiplayer {one line}` on skip sites only.

Assumption: public PeerJS broker is acceptable for EA; ICE failure is a shown error.
