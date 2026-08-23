# Multiplayer

P2P lockstep. Host sequences. Types: [[architecture/net]] [[architecture/world]] [[architecture/log]] [[architecture/save]]. Freshness: [[mechanics/inventory]].

No host migration. No TURN. No client prediction. No guest save slot.

## Seat

```
SeatId = 0 | 1 | 2 | 3
Presence = 'in' | 'away'
PlayerId = string
```

`PlayerId` is a uuid in `localStorage` key `gardena-mp-id`, created once.

```
Seat = {
  id: SeatId
  playerId: PlayerId
  actor: Actor
  hand: Hand
  inventory: Slot[]
  queue: Intent[]
  presence: Presence
  place: Place
}
```

`inventory` length 16. `World.seats` length 1..4. Index 0 is always the host / solo player.

No `World.actor` / `hand` / `inventory` / `queue` / `place`.

`App.local: SeatId` is who this page is. Solo: `seats.length === 1`, `local === 0`.

`apply` uses `seats[cmd.p]`. Two seats, same tile, same `t`: log order. First wins, second no-op.

## Join kit

P2–P4, first time only: shovel in hand, 16 empty slots, queue empty, `place: none`. Spawn at `DOOR` offset by `id` (`+ (id * 0.6)` along x). Rejoin same `playerId` does not re-kit. Restores that seat. `presence: 'in'`. Host pauses for the snapshot again.

Seat 0 starter kit is the solo kit — [[mechanics/inventory]].

## Away

Guest drop → `presence: 'away'`. Seat stays in `seats`. World keeps ticking. That actor vanishes.

`tick` skips that actor's walk/work and that seat's hand/inventory freshness (box cargo included). Field / chest / ground rot continues. Freezer slots never tick freshness.

Away occupies a slot. `hello` when `seats.length === 4` → `reject: full`. Rejoin is the same `playerId`.

## Permissions

Sequencer is host-only (`sim/mp.ts`). Drops illegal guest cmds. They never enter a bundle. Dropped cmds no-op.

Cheat: seat 0 only. Sequencer drops every other `Act.cheat`.

**Guests may:** walk, till, plant, water, harvest, tend, mine, pick up / drop, fill at pump/tap, own house inventory (`swap`), **Sell all**, shop Seeds and Utility, shop + place buildings (pumpjack, well, rain-tank, tap, chest, grinder, compost-box, mill, jam, still, barrel, freezer), dump mill/jam/still/barrel like compost, **delete building**, Almanac, lens (if shared family owns the skill), Pause.

House click opens *this* seat's 16. Placing a chest or freezer is allowed; opening it is not.

**Guests may not:** Research start, Family pick, expand, pipes, valves, sprinklers, tiles, fences, chest/freezer `swapChest`, sprinkler tune, stall `nudgeOffered`, recap dismiss, cheat, New/Load/Upload.

Guest never `writeSlot` for a hosted farm.

## Pause / leave

Pause is a net flag. Host stops bundling. Any player may toggle. Join/resync forces pause until `ready`.

Host leave: `writeSlot(dump(world))`. Peers `bye: 'host-left'`. Back to startup. Guest slot not written. No migration.

## Comment exception

Canon forbids comments. This slice only, skip sites only, this form only:

```
// TODO 1.1 multiplayer {one line}
```

Sites: guest chest swap, guest pipe/valve/sprinkler/tile/fence, guest expand, guest family pick, guest research start, host migration, client prediction, TURN.

## Clock

Accumulator in App. `tick(DT_MAX)` only. Never a leftover. Host accumulator pumps bundles. Guests pump from received bundles. Recap still `now += 1` then return.

## Illegal

- parallel `World.actor` / `hand` / `inventory` / `queue` / `place`
- guest forbidden cmd in a bundle
- guest `writeSlot` for a hosted farm
- re-kit on rejoin
- away seat dropped from `seats`
- `Cmd` without `p`
- leftover rAF tick
- comments except the skip-site form
