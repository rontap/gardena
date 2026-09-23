# Docs review: Multiplayer and the command log

Notes: `docs/mechanics/multiplayer.md`, `docs/architecture/net.md`, `docs/ui/multiplayer.md`, `docs/mechanics/log.md`, `docs/architecture/log.md`
Code: `src/game/sim/mp.ts`, `src/game/net/peer.ts`, `src/game/sim/log.ts`, `src/game/sim/log.worker.ts`, `src/game/sim/seat.ts`, `src/game/sim/player.ts`, `src/game/sim/world.ts`, `src/game/sim/apply.ts`, `src/game/sim/tick.ts`, `src/game/ui/multiplayer.tsx`, `src/game/ui/menu.tsx`, `src/App.tsx`, `src/game/view/layers/actors.ts`
Tests: `src/game/sim/mp.test.ts`, `src/game/sim/log.test.ts`, `src/game/net/peer.test.ts`, `src/game/ui/notices.test.ts`, `e2e/mp-guest.spec.ts`

Tick the one line that is true in each question. Tick **none** and write a line under it if none is.

## Disagreements

### 1. What does the player read when joining or a session fails?
- [ ] **doc** `docs/ui/multiplayer.md:11` — `version` **This build is a different version.**; `full` **This farm already has four gardeners.**; `busy` **Host is busy letting someone in.**; ICE **Could not reach the host.**; `host-left` **Host left.**; `desync` **This farm drifted and could not be repaired.**; `unusable` **This farm could not be used.**
- [ ] **code** `src/game/ui/multiplayer.tsx:7`, `messages/en/menu.json:24` — `version` **That farm runs a different build of Gardena. Both players need the same version.**; `full` **That farm is full — it already has four gardeners.**; `busy` **The host is letting someone else in. Try again in a moment.**; `ice` **Could not reach that farm. Check the code and that the host is still hosting.**; `host-left` **The host closed the farm. Anything unsaved stayed with them.**; `lost` **Lost the host and could not get back after three tries.**; `desync` **This farm drifted out of step with the host and could not be repaired.**; `unusable` **This farm could not be used.** Shown as a boxed alert (`border-l-4 border-roof bg-roof/12`), not a `text-roof` line.
- [ ] **test** — no test checks this copy.
- [ ] **none**

### 2. What does the player see while a join or resync is catching up?
- [ ] **doc** `docs/ui/multiplayer.md:56` — a dimmed overlay over the HUD with a `w-[26rem]` card titled **Catching up...**, optional fail line, no ×, Esc does nothing; map takes no pointer.
- [ ] **code** `src/App.tsx:958`, `src/game/ui/hud.tsx:156` — no overlay. A small chip left of the Multiplayer button reads **Catching up** (or **Reconnecting {n} of 3**) as English literals, and the map takes no pointer while catching (`src/App.tsx:1013`).
- [ ] **test** — none.
- [ ] **none**

### 3. What does the in-play host dialog show?
- [ ] **doc** `docs/ui/multiplayer.md:37` — read-only room key, **Copy** button, four seat rows **P1**..**P4**, this page's seat with ` (you)`, occupied seats marked, no names.
- [ ] **code** `src/game/ui/multiplayer.tsx:158` — window titled **Multiplayer**; a status line (**Your farm is open. Share this code and friends can drop in.** / **Opening your farm to the outside world.**); a **Your name** field; **Room code** box (**getting a code...** until the id arrives); **Copy code** (then **Copied** / **Could not copy** with a Ctrl+C hint); **Gardeners ({taken} of 4)** with four rows: hat colour chip, **P1**..**P4**, the seat's name or **Open seat**, and a tag **Host** / **you** / **away** / **playing**.
- [ ] **test** — none.
- [ ] **none**

### 4. What does the in-play guest dialog show, and what is the leave button called?
- [ ] **doc** `docs/ui/multiplayer.md:54` — no key, no **Copy**, no seat list; one **Leave** button, same leave as the Gear **Leave Multiplayer**.
- [ ] **code** `src/game/ui/multiplayer.tsx:216` — **You are gardening on someone else’s farm.**, a **Your name** field, the same seat list as the host, and a **Leave farm** button. The Gear menu has no leave button (`src/game/ui/menu.tsx:148`).
- [ ] **test** — none.
- [ ] **none**

### 5. Which trailer pose numbers are rounded in the digest?
- [ ] **doc** `docs/architecture/net.md:87` — trailer pose is among the floats quantised to four decimals.
- [ ] **code** `src/game/sim/mp.ts:243` — only the trailer `heading` is rounded; its position fields go into the digest unrounded. Vehicle `x`, `y`, `heading`, `speed` are rounded (`:238`).
- [ ] **test** `src/game/sim/mp.test.ts:998` "Every continuously integrated float in the digest is quantised ..." — not read for trailers.
- [ ] **none**

### 6. Which lists does `rebase()` sort?
- [ ] **doc** `docs/architecture/net.md:75`, `:99` — `pumps` `tanks` `wells` `taps` `stills` `waterSystems`.
- [ ] **code + test** `src/game/sim/world.ts:538`; `src/game/sim/mp.test.ts:858` — `pumps`, `wells`, `taps`, `stills`, `waterSystems`. There is no `tanks` list on `World`.
- [ ] **none**

### 7. Which `Act.cheat` kinds exist?
- [ ] **doc** `docs/architecture/log.md:92` — `all` `money` `points` `research` `speed` `day` `skills`.
- [ ] **doc** `docs/mechanics/log.md:23` — the same plus `produce`.
- [ ] **code** `src/game/sim/log.ts:126` — the same eight as `docs/mechanics/log.md`, including `produce`.
- [ ] **test** `src/game/sim/log.test.ts:91` — letters test; `produce` not checked.
- [ ] **none**

### 8. Which command letters does the letter map list?
- [ ] **doc** `docs/mechanics/log.md:23` — the map lists `W` `N` `L` `U` `K` `M` `O` `J` `Y` `Z` `o` `fb` `u`, no `Act.necronomicon`.
- [ ] **code** `src/game/sim/log.ts:78` — also `Act.necronomicon` `'0'` with `k: 'gold' | 'ritual'` (`:181`), and `Act.sellAll` `'s'` (`:37`).
- [ ] **none**

## Doc only (no code found)

### 9. Is there a **Leave Multiplayer** button in the Gear menu?
- [ ] **doc** `docs/ui/multiplayer.md:89`, `docs/ui/menu.md:76` — Gear adds **Leave Multiplayer** for a guest. Searched `menu.tsx`, `messages/en/menu.json` for "Leave"; only `menu_leave_farm` in the guest dialog.
- [ ] **removed from the game**
- [ ] **none**

## Code only (no note mentions it)

### 10. Pressing **Multiplayer** in solo play opens the room
- [ ] **code** `src/App.tsx:799`, `:680` — `toggleMp` calls `startHost` when no session exists, so the first press opens a PeerJS peer and makes this page the host; the room key is the peer id (agrees with `docs/architecture/net.md:13`). No note says the button itself starts hosting.
- [ ] **intended, document it**
- [ ] **not intended**

### 11. Guest reconnect after a dropped link
- [ ] **code** `src/App.tsx:843`, `:854` — when the link drops (`bye: 'lost'`) and a room key is known, App opens a new peer and dials the same room after `RECONNECT_DELAY_MS` (1.5 s), up to `RETRY_MAX` (3) times, showing **Reconnecting {n} of 3**; after that it goes to the boot screen with the `lost` line.
- [ ] **intended, document it**
- [ ] **not intended**

### 12. Join gives up after 20 seconds
- [ ] **code** `src/App.tsx:73`, `:892` — `DIAL_TIMEOUT_MS` = 20000; if no welcome, reject or bye arrives, the join closes the peer and shows the `ice` line.
- [ ] **intended, document it**
- [ ] **not intended**

### 13. Player names
- [ ] **code** `src/game/sim/player.ts:3`, `src/App.tsx:509` — each page stores a name in `localStorage` `gardena-mp-name` (at most `NAME_MAX` 16 characters, spaces collapsed); `hello` carries it; the host pushes names in the roster; renaming in either dialog updates the seat and re-pushes the roster. Default name **P{n}**.
- [ ] **intended, document it**
- [ ] **not intended**

### 14. Opening the Multiplayer dialog pauses the farm for everyone
- [ ] **code** `src/App.tsx:782` — opening the dialog sets the host pause (`host.setPaused(true)`) or the solo pause, and closing restores it unless the player had already paused. Only `docs/ui/hud.md:35` names `setMpPanel`; the multiplayer notes do not.
- [ ] **intended, document it**
- [ ] **not intended**

### 15. Closing the tab ends the session on purpose
- [ ] **code** `src/App.tsx:435` — on `pagehide` a guest closes its link and a host saves and goes to the boot screen, so the host frees the seat at once.
- [ ] **intended, document it**
- [ ] **not intended**

### 16. `Act.sellAll` is still a command
- [ ] **code** `src/game/sim/log.ts:37`, `src/game/sim/apply.ts:53`, `src/game/sim/play.ts:42` — the command and its body `store.sellAllBody` exist and the gameplay API offers a `market sellAll` task; no UI sends it.
- [ ] **intended, document it**
- [ ] **not intended**

### 17. A guest that receives a welcome with the wrong version waits silently
- [ ] **code** `src/game/sim/mp.ts:752` — sets `fail = 'version'` without calling `onReject`; App keeps **Connecting** until the 20 s join timeout shows the `ice` line. The host normally rejects first (`src/game/sim/mp.ts:590`).
- [ ] **intended, document it**
- [ ] **not intended**

## Agreed

- [ ] 18. Seat 0 is the host or solo player; at most 4 seats; a new player gets the next seat with a shovel in hand, 16 empty slots, standing at the door shifted 0.6 tiles per seat id; a returning `playerId` gets its old seat back unchanged — doc `docs/mechanics/multiplayer.md:11`, `:19`, code `src/game/sim/world.ts:547`, `src/game/sim/seat.ts:56`, test `src/game/sim/mp.test.ts:185`, `:447`.
- [ ] 19. `PlayerId` is a uuid kept in `localStorage` `gardena-mp-id`, created once — doc `docs/mechanics/multiplayer.md:9`, code `src/game/sim/player.ts:19`, no test.
- [ ] 20. `hello` with 4 seats taken → `reject: full`; an away seat still counts; `busy` while another join is mid-snapshot; `version` when `protocol !== GAME_VERSION` — doc `docs/architecture/net.md:21`, code `src/game/sim/mp.ts:589`, test `src/game/sim/mp.test.ts:185`.
- [ ] 21. Guest commands: the host stamps `t` and `p` from the link, drops `Act.pickSkill`, `Act.expand`, `Act.cheat` from a guest, and dispatches the rest — doc `docs/mechanics/multiplayer.md:69`, `docs/architecture/net.md:65`, code `src/game/sim/mp.ts:214`, `:556`, test `src/game/sim/mp.test.ts:81`, `:97`.
- [ ] 22. Each bundle: apply the commands in order, then one `tick(DT_MAX)`; empty bundles still tick; `bundle.t` is `now` after the tick — doc `docs/architecture/net.md:61`, code `src/game/sim/mp.ts:219`, `:489`, test `src/game/sim/mp.test.ts:64`.
- [ ] 23. A guest applies a bundle only when `t === now + 1`; older ones are dropped; a gap sends one `hello`, keeps later bundles queued and keeps catching up; `lastWall` moves only on an applied bundle — doc `docs/architecture/net.md:69`, `:95`, code `src/game/sim/mp.ts:841`, test `src/game/sim/mp.test.ts:747`, `:817`.
- [ ] 24. After `STALL_MS` (5 s) with no applied bundle an unpaused guest says `hello` again; after `RETRY_MAX` (3) such retries it gives up with `bye: 'lost'`; any message from the host resets the count — doc `docs/architecture/net.md:67`, code `src/game/sim/mp.ts:703`, test `src/game/sim/mp.test.ts:551`, `:579`, `:329`.
- [ ] 25. Digest every `DIGEST_EVERY` (30) ticks; a mismatch makes the guest send `hello` with `desyncT` and the drifted section names; the host pauses, re-snapshots every guest, and unpauses after every seated guest is ready; two mismatches within 60 ticks → `bye: kicked` — doc `docs/mechanics/multiplayer.md:77`, `docs/architecture/net.md:93`, code `src/game/sim/mp.ts:571`, `:589`, `:547`, test `src/game/sim/mp.test.ts:210`, `:246`, `:261`, `:304`.
- [ ] 26. Digest content: money, day, clock, weather, seats (rounded position, hand, inventory, presence, place), cells with plant, soil, machine and sensor state, wires, valves, sprinklers, drop count, research, family, stall stock and `sat`, active contracts, vehicles, trailers, routes, id counters, `bigAcc`, reservoir `stored`, `pumpLiters`, job, points; floats rounded to four decimals; money not rounded — doc `docs/architecture/net.md:87`, code `src/game/sim/mp.ts:250`, test `src/game/sim/mp.test.ts:697`, `:998`.
- [ ] 27. Before every snapshot the host runs `rebase()`: clears every seat's queue, cue, work, place, drive, stride, snaps a driver to the vehicle, zeroes `bigAcc`, `pumpLiters` and stall `sat`, resets both cheats, clears `nets`, sorts the water lists by origin row then column; one `rebaseAndSnapshotAll` for a new join, a seated `hello`, or a cursor that fell off the log — doc `docs/architecture/net.md:75`, `:97`, code `src/game/sim/world.ts:512`, `src/game/sim/mp.ts:498`, `:582`, test `src/game/sim/mp.test.ts:727`, `:770`, `:797`, `:906`.
- [ ] 28. Silence: `AWAY_MS` (8 s) marks the seat away, `NAP_MS` (30 s) marks it napping, `DROP_MS` (60 s) releases the link with `leave: 'drop'`; a ping from an away seat brings it back in; guests ping every `PING_MS` (2 s), also while paused — doc `docs/mechanics/multiplayer.md:27`, `docs/architecture/net.md:43`, code `src/game/sim/mp.ts:461`, `:535`, `:641`, `:705`, test `src/game/sim/mp.test.ts:592`, `:497`.
- [ ] 29. Roster: `RosterSeat` with `id`, `name`, `presence`, `napping`, and `leave` only on the push that releases or kicks; `readMpMsg` keeps `leave` only when `'drop'` or `'kicked'`; `applyRoster` writes name, presence, napping — doc `docs/architecture/net.md:27`, code `src/game/sim/mp.ts:38`, `:75`, `:91`, `:100`, test `src/game/sim/mp.test.ts:480`.
- [ ] 30. Away seat: stays in `seats`, its actor is not walked or drawn, its hand and inventory do not lose freshness, a vehicle it drove loses its driver — doc `docs/mechanics/multiplayer.md:25`, `:29`, code `src/game/sim/world.ts:561`, `src/game/sim/tick.ts:73`, `:195`, `src/game/view/layers/actors.ts:147`, test `src/game/sim/mp.test.ts:132`.
- [ ] 31. Pause is a wire flag, not a command; any player may toggle; join and resync force it until ready; a join that fails before ready unpauses — doc `docs/architecture/net.md:81`, code `src/game/sim/mp.ts:439`, `:518`, `:563`, `:695`, no test named for it.
- [ ] 32. Host leave sends `bye: 'host-left'` and saves the host's farm; guests go to the boot screen with the host-left line; a guest's slot is not written on day change or **Exit to main menu** — doc `docs/mechanics/multiplayer.md:55`, code `src/game/sim/mp.ts:523`, `src/App.tsx:260`, `:475`, `:937`, test `src/game/sim/mp.test.ts:416`.
- [ ] 33. PeerJS wire: `reliable: true`; unknown `a` dropped; transport close or error, or send on a closed channel, becomes `bye: 'lost'` — doc `docs/architecture/net.md:69`, `:95`, code `src/game/net/peer.ts:13`, `:59`, test `src/game/net/peer.test.ts:27`, `:58`.
- [ ] 34. Seat hat colours `#d4a017`, `#ff3d8e`, `#2de8ff`, `#b85cff` — doc `docs/ui/multiplayer.md:68`, code `src/game/view/map.tsx:72`, no test.
- [ ] 35. Guest restrictions in the UI: Cheat hidden, Expand plates hidden, Family cards not clickable; chest and freezer Load / Unload work for a guest — doc `docs/ui/multiplayer.md:81`, code `src/game/ui/hud.tsx:164`, `src/game/view/map.tsx:784`, test `e2e/mp-guest.spec.ts:37`, `:64`, `src/game/sim/mp.test.ts:623`, `:660`.
- [ ] 36. `World.now` starts at 0 and `tick()` adds 1 before `tickWorld`; the day seam's early return is inside `tickWorld` — doc `docs/mechanics/log.md:15`, `docs/architecture/log.md:66`, code `src/game/sim/world.ts:1956`, `src/game/sim/tick.ts:147`, test `src/game/sim/mp.test.ts:49`.
- [ ] 37. `dispatch` appends to the log (last 500 kept, `logBase` counts the rest) and to the sink, then applies; `apply` does not log; `logSince` below `logBase` returns nothing, which forces a resync — doc `docs/architecture/log.md:13`, `:31`, code `src/game/sim/world.ts:244`, `:500`, `:592`, test `src/game/sim/mp.test.ts:797`.
- [ ] 38. `MemorySink` and `WorkerSink` (`push`, `reset`, `terminate` for hot reload); the worker keeps every command and answers `dump` with a copy; one worker made in `main.tsx` — doc `docs/architecture/log.md:21`, code `src/game/sim/log.ts:189`, `src/game/sim/log.worker.ts:1`, `src/main.tsx:68`, no worker test (by design).
- [ ] 39. Commands are JSON with one-letter `a` values from `Act`; every arm has `t` and `p`; `Act.setFuelBuy` is `'fb'` — doc `docs/architecture/log.md:74`, code `src/game/sim/log.ts:25`, test `src/game/sim/log.test.ts:6`, `:91`.
- [ ] 40. `Act.rightClick` cancels a picked tool, or with nothing picked queues a drop on an owned plot while the hand holds something — doc `docs/architecture/log.md:96`, code `src/game/sim/feature-place/place.ts:289`, test `src/game/sim/log.test.ts:45` (fixture only).
- [ ] 41. `Act.dismissRecap` does nothing; `seeRecap` is not a command — doc `docs/ui/docks.md:74`, code `src/game/sim/world.ts:1954`, `:1936`, no test.
- [ ] 42. `Act.stride` sets the seat's stride unless it is driving; the tick moves the actor and clears its queue while stride is non-zero, diagonal normalised — doc `docs/mechanics/multiplayer.md:79`, code `src/game/sim/world.ts:1484`, `src/game/sim/tick.ts:198`, no test named for it.
