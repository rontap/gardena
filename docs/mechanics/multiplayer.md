# Multiplayer

P2P lockstep. Host sequences. Types: [[architecture/net]] [[architecture/world]] [[architecture/log]] [[architecture/save]]. Freshness: [[mechanics/inventory]].

## Seat

`SeatId` `Presence` `PlayerId` — `sim/ids.ts` / `sim/world.ts`.

`PlayerId` is a uuid in `localStorage` key `gardena-mp-id`, created once.

`inventory` length 16. `World.seats` length 1..4. Index 0 is always the host / solo player.

`App.local: SeatId` is who this page is. Solo: `seats.length === 1`, `local === 0`.

`apply` uses `seats[cmd.p]`. Two seats, same tile, same `t`: log order. First wins, second no-op.

## Join kit

P2–P4, first time only: shovel in hand, 16 empty slots, queue empty, `place: none`. Spawn at `DOOR` offset by `id` (`+ (id * 0.6)` along x). Rejoin same `playerId` does not re-kit. Restores that seat. `presence: 'in'`. Host pauses for the snapshot again.

Seat 0 starter kit is the solo kit — [[mechanics/inventory]].

## Away

Guest drop → `presence: 'away'`. Seat stays in `seats`. World keeps ticking. That actor vanishes.

`tick` skips that actor's walk/work and that seat's hand/inventory freshness (box cargo included). Field / chest / ground / vehicle-slot rot continues. Freezer slots never tick freshness. Away while driving: that vehicle `driver = 'none'`, field pose kept, speed coasts to 0.

Away occupies a slot. `hello` when `seats.length === 4` → `reject: full`. Rejoin is the same `playerId`.

## Permissions

Sequencer is host-only (`sim/mp.ts`). Drops illegal guest cmds. They never enter a bundle. Dropped cmds no-op. Guest cmds: `mp.guest`.

Cheat: seat 0 only. Sequencer drops every other `Act.cheat`.

House click opens *this* seat's 16. Placing a chest or freezer is allowed; opening it is not.

Guest never `writeSlot` for a hosted farm.

## Pause / leave

Pause is a net flag. Host stops bundling. Any player may toggle. Join/resync forces pause until `ready`.

Host leave: `writeSlot(dump(world))`. Peers `bye: 'host-left'`. Back to startup. Guest slot not written. No migration.

## Clock

Accumulator in App. `tick(DT_MAX)` only. Never a leftover. Host accumulator pumps bundles. Guests pump from received bundles. Recap still `now += 1` then return.

## Invariants

`mp.tick` — Live App accumulator calls `tick(DT_MAX)` only. Leftover rAF never ticks a non-`DT_MAX` slice. View paints every rAF. Solo and MP.

`mp.bundle` — Per host `bundle`: apply `cmds` in log order, then `tick(DT_MAX)`. Empty `cmds` still tick. `bundle.t` is `now` after that tick. Same seed + same bundles → equal digest: [[architecture/net]] `net.digest` plus every seat `actor.x`/`actor.y`, `hand`, `inventory`, `presence`, `place`.

`mp.drop` — Sequencer drops illegal guest cmds. They never enter a bundle. Those cmds no-op.

`mp.guest` — Guest may: shop + place + `delete` building for pumpjack, well, rain-tank, tap, chest, grinder, compost-box, mill, jam, still, barrel, freezer, hangar, silo-seed, silo-spray, silo-produce, lever, button, lamp, AND, OR, NOT, pulser, counter, water/fert/harvest/water-system/day sensors, vehicle detector; dump mill/jam/still/barrel like compost; `load`/`unload` mill/jam/still/compost/seed-silo/additive-store; `placeSmartValve`, wires (`armWire` `placeWire` delete wire), toggle lever/button, water/harvest/counter/day HUD, stride; hangar cue HUD, `buy-hangar` + three silo SKUs in `GUEST_BUILD`, buy Quad / tractor / trailers, refill, `swapVehicle` `swapTrailer`, embark, disembark, dock, drive, `setBoom`, delete empty hangar. Guest consign fills contract bins. Guest `placeWire` permitted. Guest may not: chest/freezer `swapChest`, chest/freezer `load`/`unload`, pipes, `placePipe`, manual valves, sprinklers, tiles, fences, expand, research start, family pick, `acceptContract` `cancelContract` `reorderContract`, cheat. Guest Unload chest no-op. Guest Load chest no-op. Guest contract cmds never enter a bundle.

`mp.away` — `presence === 'away'`: tick skips that actor walk/work and that seat hand/inventory freshness (box cargo included). Field, chest, and ground rot continue. Freezer slots never tick freshness. Seat stays in `seats`.

`mp.hello` — `hello` when `seats.length === 4` → `reject: full`. Away occupies a slot. Rejoin is the same `playerId`.

`mp.mismatch` — Digest mismatch: pause, `resync`, Ready, unpause. One retry. Second mismatch → that guest `bye: kicked`. Host continues.

`mp.stride` — `Seat.stride`. Not driver, `presence === 'in'`, not recap: if `stride !== {0,0}` clear queue+work, `actor += dir * walkSpeed() * dt`, diagonal normalized. Surfaces not. Ignored while driver. Not in Save. `Act.stride` logged; integrate not.
