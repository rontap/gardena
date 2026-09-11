# Guest water and storage

Feature. Graduates into [[mechanics/multiplayer]], [[ui/multiplayer]], [[ui/build]], [[architecture/net]]. Copy: [[standards/user-facing-text]].

A guest can plant, harvest, dump into machines, draw wires, buy and drive vehicles, and drop goods at the Market truck. A guest cannot place Pipe, Valve, Sprinkler, paving, or Wooden fence, and cannot open a Chest or Freezer. Two people share the field. They cannot share the water network or the chests. This update opens those.

Host still starts research, picks Family skills, expands land, and accepts / cancels / reorders contracts. Cheat stays seat 0.

## Live (keep)

P2P lockstep. Host sequences. `mp.guest` drops illegal cmds; they never enter a bundle. Guest consign fills contract bins. Guest wires, including valve `in` and pump `in`. Place and click on a valve stay host-only today — that click becomes guest-legal with Valve place.

`GUEST_PIPE` is the buy+place ban: pipe, valve, sprinklers, tiles, fence. `swapChest` / chest Load / Unload / walk-up chest cue: guest no-op. Research dock opens read-only. Family overlay opens, offers not clickable.

Catching up, Wooden fence money, Enter, extra Pumpjack order: already fixed.

No host migration. Guest slot not written. No TURN. No client prediction. Not this update.

## New

Guest may buy, place, and delete: Pipe, Valve, Sprinkler, Vertical sprinkler, Large sprinkler, Paving slab, Brickwork, Cobblestone, Asphalt, Wooden fence. Guest `clickValve` / Open valve / Close valve. Guest `placePipe`. `GUEST_PIPE` shrinks to empty, or the permit list gains those SKUs — one list, `mp.guest` and the Build card must name the same set.

Guest may walk up to a Chest or Freezer, `swapChest`, Load, and Unload. Cue opens. Same as host.

Build card that is still host-only (none of the water / paving / fence set after this) says so on the callout, not only by going grey. Copy: the host places that. Water tools are no longer in that set.

Guest name reaches the host seat list (`roster`). Host rename already pushes; guest rename is local today.

Command Center rows for research, Family, Market still do not start those jobs for a guest. Opening the page read-only is already true for the docks; notice click may open the same read-only page. Expansion row stays no click.

`seeRecap` stays chrome, not a `Cmd`. Guest Close of the end-of-day summary is local.

`PROTOCOL` bumps if a 2.3-era guest must not join. Digits: [[GLOBAL_VERSION]] / `sim/mp.ts`. Orchestrator.

## Not this update

Guest `startResearch` / `pickSkill` / `expand` / `acceptContract`. Host leave without ending the session. TURN. Prediction. Away seat freeing a fourth slot.
