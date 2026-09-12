# Multiplayer

P2P lockstep. Host sequences. Types: [[architecture/net]] [[architecture/world]] [[architecture/log]] [[architecture/save]]. Freshness: [[mechanics/inventory]].

## Seat

`SeatId` `Presence` `PlayerId` — `sim/ids.ts` / `sim/world.ts`.

`PlayerId` is a uuid in `localStorage` key `gardena-mp-id`, created once.

`inventory` length 16. `World.seats` length 1..4. Index 0 is always the host / solo player.

`App.local: SeatId` is who this page is. Solo: `seats.length === 1`, `local === 0`.

`apply` uses `seats[cmd.p]`. Two seats, same tile, same `t`: log order. First wins, second no-op.

## Join kit

P2–P4, first time only: shovel in hand, 16 empty slots, queue empty, `place: none`. Spawn at `DOOR` offset by `id` (`+ (id * 0.6)` along x). Rejoin same `playerId` does not re-kit. Restores that seat. `presence: 'in'`. Host pauses for the snapshot again. A new seat or `away` → `in` stamps `joined` at the net/App boundary, not for this page's seat — [[ui/notices]] `notices.roster`.

Seat 0 starter kit is the solo kit — [[mechanics/inventory]].

## Away

Guest drop → `presence: 'away'`. Seat stays in `seats`. World keeps ticking. That actor vanishes.

Silence (`AWAY_MS` / nap) also sets `away` and pushes `roster` with no `leave`. That is not a Command Center row. Link release (`drop` / leave / `lost` / `DROP_MS`) and `bye: kicked` stamp at the net/App boundary — [[ui/notices]] `notices.roster` [[architecture/net]].

`tick` skips that actor's walk/work and that seat's hand/inventory freshness. Field / chest / ground / vehicle-slot rot continues. Freezer slots never tick freshness. Away while driving: that vehicle `driver = 'none'`, field pose kept, speed coasts to 0.

Away occupies a slot. `hello` when `seats.length === 4` → `reject: full`. Rejoin is the same `playerId`.

A new seat resyncs every guest already connected: `join` never rides the log and `roster` cannot create a seat. `rebase()` clears every seat, so underflow, seated hello, and new join all dump through `rebaseAndSnapshotAll(except?)` — [[architecture/net]] `net.snapshot`. `net.order` sorts on that rebase.

## Permissions

Sequencer is host-only (`sim/mp.ts`). Drops illegal guest cmds. They never enter a bundle. Dropped cmds no-op. Guest cmds: `mp.guest`.

Cheat: seat 0 only. Sequencer drops every other `Act.cheat`. Ribbon hidden when `world.local !== 0`.

Family overlay opens. `Act.pickSkill` never fires for a guest. Offers not clickable.

Expand plates hidden when `world.local !== 0`. Command Center expansion row stays, `go: none`.

House click opens *this* seat's 16. Chest and freezer open; `swapChest` / Load / Unload live.

Gear **Save game** and **Download Save** live for a guest. **New Game** / **Load Save** / **Upload Save** stay greyed while connected. day-seam / Main menu / host-leave `writeSlot` host-only.

## Pause / leave

Pause is a net flag. Host stops bundling. Any player may toggle. Join/resync forces pause until `ready`.

A join or resync cancels in-flight walk, work and placement ghost on every seat — that is `rebase`, and it is what makes the snapshot match. Unpause waits for every seated guest to be Ready, not just the first.

Host leave: `writeSlot(dump(world))`. Peers `bye: 'host-left'`. Back to startup. Guest slot not written. No migration.

## Clock

Accumulator in App. `tick(DT_MAX)` only. Never a leftover. Host accumulator pumps bundles. Guests pump from received bundles. `World.tick` always `now += 1` then `tickWorld`. Seam recap early-return is `tickWorld`.

## Invariants

`mp.tick` — Live App accumulator calls `tick(DT_MAX)` only. Leftover rAF never ticks a non-`DT_MAX` slice. View paints via the Pixi ticker. Solo and MP.

`mp.bundle` — Per host `bundle`: apply `cmds` in log order, then `tick(DT_MAX)`. Empty `cmds` still tick. `bundle.t` is `now` after that tick. Same seed + same bundles → equal digest: [[architecture/net]] `net.digest` plus every seat `actor.x`/`actor.y`, `hand`, `inventory`, `presence`, `place`.

`mp.drop` — Sequencer drops illegal guest cmds. They never enter a bundle. Those cmds no-op.

`mp.guest` — A guest (`cmd.p !== 0`) may send every `Cmd` a host may send except `Act.pickSkill`, `Act.expand`, `Act.cheat`; the sequencer drops those three and they never enter a bundle.

`mp.away` — `presence === 'away'`: tick skips that actor walk/work and that seat hand/inventory freshness. Field, chest, and ground rot continue. Freezer slots never tick freshness. Seat stays in `seats`.

`mp.hello` — `hello` when `seats.length === 4` → `reject: full`. Away occupies a slot. Rejoin is the same `playerId`.

`mp.float` — `Math.sin/cos/atan2/hypot/exp` differ by an ULP between engines, so every continuously integrated float in the digest is quantised to four decimals before hashing, and the seam's pump bill is rounded to cents so that drift never reaches `money`. A raw float in the digest is a resync storm on two machines and looks clean on one — [[architecture/net]] `net.digest`.

`mp.mismatch` — Digest mismatch: pause, `resync`, Ready, unpause. Two mismatches within two digest periods → that guest `bye: kicked`. Host continues. Host `rebaseAndSnapshotAll(except?)` before every snapshot, so the resync converges for every seated guest — [[architecture/net]] `net.snapshot`.

`mp.stride` — `Seat.stride`. Not driver, `presence === 'in'`: if `stride !== {0,0}` clear queue+work, `actor += dir * walkSpeed() * dt`, diagonal normalized. Surfaces not. Ignored while driver. Not in Save. `Act.stride` logged; integrate not.
