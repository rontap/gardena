# Code map

The folder and file for each part of the code. Other pages name identifiers; this page gives the folder to grep.

## Entry

`src/main.tsx` renders the game, a `#debug-*` page or `#atlas`, selected by the URL hash. `src/App.tsx` is the game's root component: it holds the `World` instance, keyboard and pointer input, the open panel, and the pause state.

## Simulation — `src/game/sim/`

Game state and game rules. No React or Pixi imports.

**Core**
- `world.ts`, `world.h.ts` — `World`: cells, seats, money, indexes over cells, and most entry points the UI calls.
- `tick.ts`, `clock.ts` — the tick, the big tick, the day change.
- `apply.ts` — applies a player command to the world.
- `queue.ts` — a seat's job list and the work each job does when the gardener arrives.
- `prompt.ts` — what a click on a cell would do, and the prompt text.
- `look.ts` — the name line for a hovered cell.
- `plot.ts` — cell kinds.
- `item.ts` — items, stacking, item names and descriptions.
- `drop.ts` — items lying on the ground.
- `actor.ts`, `seat.ts`, `player.ts` — the gardener, a player's seat, the local player's name and id.
- `modifiers.ts` — skill and research modifiers, `statsOf`.
- `rng.ts`, `noise.ts`, `gen.ts` — seeded streams, ground noise, chunk generation.
- `util.ts`, `settings.ts`, `version.ts`.

**Mechanics outside feature folders**
- `plant.ts`, `soil.ts` — plants, weeds, turf, soil, bands; several tuning constants.
- `water.ts`, `nets.ts`, `pipe.ts` — sources, pipe networks, sprinklers, valves.
- `sensor.ts` — sensors, wires, signal evaluation.
- `weather.ts` — daily weather and its effects.
- `loan.ts` — the loan and its payback at the end of the day.
- `family.ts` — skills.
- `stall.ts` — Market goods.
- `store.ts` — Seed silo and Additive store.
- `building.ts` — building classes, footprints, ports, pads.
- `tutorial.ts` — tutorial steps.
- `mp.ts`, `log.ts`, `log.worker.ts` — multiplayer host and guest, digest, command log.
- `play.ts` — scripted play for tests and agents.

**Feature folders**
- `feature-field/` — plants, trees, weeds, grass, and every hand tool used on a plot.
- `feature-place/` — placing, demolishing, the Build tool on the map, and SKU prices (`skuPrice`).
- `feature-machines/` — machines, recipes, sorter.
- `feature-vehicles/` — vehicles, trailers, routes, fuel.
- `feature-contracts/` — contract board, and Market saturation.
- `feature-burrow/`, `feature-mushroom/`, `feature-enclosure/`, `feature-necronomicon/`.
- `feature-save/` — save file shape, write, parse.
- `feature-sound/` — playback. `sound.ts` runs the cues. `sound.utils.ts` is the only `tone` import. `music/` is one file per song. `machines/` and `vfx/` are the other cues.

## Tuning — `src/game/defs/`

Numbers and tables: crops, varieties, trees, items, research and SKUs, catalog, shelves, skills, companies, weather, the loan, burrow chances and items, mushroom chances, Necronomicon pages, tutorial text. Some constants are defined in the sim file that uses them, mainly `soil.ts`, `water.ts` and `feature-contracts/market.ts`; grep both.

## Screen — `src/game/ui/`

React. One file per panel, named after it: `market.tsx`, `research.tsx`, `family.tsx`, `store.tsx`, `build.tsx`, `almanac.tsx` (its cards in `almanac-cards.tsx`), `menu.tsx`, `new-game.tsx`, `settings.tsx`, `recap.tsx`, `necronomicon.tsx`, `station.tsx`, `hangar.tsx`, `vehicle.tsx`, `multiplayer.tsx`, `cheat.tsx`, `feature-contracts/`, `feature-vehicles/`.

Shared pieces: `hud.tsx` (rails), `notices.ts(x)` (Command Center), `status.tsx` (inspect rows), `callout-hover.tsx`, `objecthud.tsx` (small panels on map objects), `held.tsx` (item faces), `sku-card.tsx`, `frame.tsx` (buttons, bars, chrome, tab styles), `panel.ts` (which panel is open).

Developer pages: `debug-*.tsx`, `atlas-view.tsx`, `techtree.ts`.

## Map — `src/game/view/`

Pixi. `world-view.ts` draws the world through `layers/` (ground, plots, props, pipes, actors, overlay, VFX). `atlas.ts` rasterizes SVG groups; `svgs.ts` serves SVGs to React. `map.tsx` is the canvas component and pointer input; `hit.ts` turns a pointer into a target; `camera.ts`, `cursor.ts`, `motion.ts`, `outline.ts`, `meter.ts` (the working bar on a machine).

Picture effects stay here: `vfx.ts`, `layers/vfx.ts`. Sound is `sim/feature-sound/`.

## Other

- `src/game/net/peer.ts` — the peer connection under multiplayer.
- `messages/en/*.json` — every player string, one file per area. Compiled into `src/paraglide/`, which is not in git.
- `src/assets/` — SVGs, in folders by kind: `crops`, `fruits`, `items`, `props`, `tiles`, `ui`, `vfx`, `skills`, `market`, `joints`.
- `public/` — the browser icons, linked from `index.html`: `favicon.svg`, and `apple-touch-icon.png` and `icon-512.png` rendered from it ([[art/svg]]).
- Tests: unit tests sit next to the code as `*.test.ts`; e2e tests are `e2e/*.spec.ts`, one per feature.
- `scripts/no-defensive.mjs` runs before dev, test and build and rejects defensive code.
