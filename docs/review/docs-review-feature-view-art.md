# Docs review: View and art

Notes: `docs/architecture/view.md`, `docs/art/_index.md`, `docs/art/svg.md`, `docs/art/palette.md`, `docs/art/props.md`, `docs/art/vfx.md`, `docs/art/actor.md`, `docs/art/items.md`, `docs/art/tilled-edges.md`, `docs/art/ground-variants.md`, `docs/art/menu.md`
Code: `src/game/view/` (`camera.ts`, `atlas.ts`, `world-view.ts`, `hit.ts`, `svgs.ts`, `layers/*.ts`), `src/game/sim/noise.ts`, `src/assets/`
Tests: `src/game/view/atlas.test.ts`, `hit.test.ts`, `map.test.ts`, `outline.test.ts`, `layers/overlay.test.ts`, `e2e/vfx.spec.ts`

SVG rule sampling: all 381 `.svg` files under `src/assets/` were grepped for each root rule (not opened one by one). Hex check: every six-digit hex in all 381 files compared against the tokens in `docs/art/palette.md` (cottage, stone, cobble, industrial, tier). Viewbox and group checks: 28 files opened by `grep` for `viewBox` and `<g id>` (listed per question).

Tick the one line that is true in each question. Tick **none** and write a line under it if none is.

## Disagreements

### 1. Do asset SVGs use only named palette hexes?
- [ ] **doc** `docs/art/palette.md:3`, `docs/art/svg.md:13` — No unnamed hex.
- [ ] **code** 21 hexes in 14 files are not in `docs/art/palette.md`: `tile-dirt-edge.svg` / `tile-dirt-inset.svg` (`#5a351c` `#744522` `#a36a38` `#c1844a`), `tile-brick.svg` (`#62352d` `#7b3026` `#a64735` `#c9574b`), `tile-grass-3.svg` (`#ff4422`), `item-rotten.svg` (`#3a3018` `#4a3018` `#5a4a2a` `#7a6438`), `item-compost.svg` / `prop-compost-box.svg` (`#4a3018`), `item-dead.svg` (`#6b5830` `#8a7040`), `crop-weed-0.svg` (`#5b7040` `#a87938`), `crop-weed-1.svg` (`#536b45` `#9b6b35`), `item-synth.svg` (`#2b5c7d`), `skill-unknown.svg` (`#666666`). `#c9574b` is the inspect-bar `bad` token, which the palette note bans from assets. No test.
- [ ] **none**

### 2. Do asset SVGs use integer coordinates?
- [ ] **doc** `docs/art/svg.md:9` — Integer coordinates.
- [ ] **code** 18 files carry decimal `x` / `y` / `width` / `height` values: 12 of the 17 VFX files, `pipe-source.svg`, `item-chilli-flakes.svg`, `item-infuser.svg`, `prop-infuser.svg`, `prop-necronomicon.svg`, `ui-research-infusion.svg`. No test.
- [ ] **none**

### 3. Does the actor file set the hat colour with a CSS variable?
- [ ] **doc** `docs/art/actor.md:16` — Hat group `hat`, default straw gold; on the farm the atlas tints it per seat; "Not CSS `--hat` on the world."
- [ ] **code** `src/assets/actor.svg`, `src/game/view/atlas.ts:719`, `:907-910` — The file's hat fill is `var(--hat, #d4a017)`; the atlas replaces that with white and tints per seat (`#d4a017`, `#ff3d8e`, `#2de8ff`, `#b85cff`). The seat colours agree; the file itself carries a CSS variable, which `docs/art/svg.md:13` does not allow for.
- [ ] **none**

### 4. What building stands where the Market truck was, and which lists does the view patch?
- [ ] **doc** `docs/architecture/view.md:21`, `:65` — Props layer draws the "truck"; the list `truck` is patched.
- [ ] **code** `src/game/view/layers/props.ts:99`, `src/game/view/atlas.ts:92`, `src/game/sim/world.ts:292` — The props layer draws the **Produce Warehouse** from `prop-produce-warehouse.svg` (48×48, no groups) at `World.warehouse`. `prop-truck.svg` and `prop-crate.svg` are on disk and no file in `src/game/` imports them. No art note describes the warehouse art.
- [ ] **none**

### 5. How many annual crops draw the apple cutting as their graft?
- [ ] **doc** `docs/art/items.md:43` — "The eight annuals … all name `apple`."
- [ ] **code** `src/game/view/svgs.ts:376-390` — Nine: carrot, potato, wheat, tomato, raspberry, grape, vanilla, chilli, sugar cane.
- [ ] **none**

### 6. Which files are in `src/game/view/`?
- [ ] **doc** `docs/architecture/view.md:7` — `camera.ts` `atlas.ts` `app.ts` `world-view.ts` `hit.ts` `outline.ts` `layers/*` `map.tsx` `svgs.ts` `motion.ts`.
- [ ] **code** `src/game/view/` — Those, plus `cursor.ts` and `vfx.ts` (the VFX registry named in `docs/art/vfx.md:7`).
- [ ] **none**

### 7. Where does `EDGE_PAD` live?
- [ ] **doc** `docs/architecture/view.md:50`, `docs/art/tilled-edges.md:13` — An atlas constant, 4.
- [ ] **code + test** `src/game/view/camera.ts:4`, `src/game/view/atlas.ts:458` — `EDGE_PAD` 4 is in `camera.ts`; `PADDED` is in `atlas.ts`. Test `atlas.test.ts:14` asserts the 32×32 raster.
- [ ] **none**

## Doc only (no code found)

### 8. Is `skill-locked.svg` live?
- [ ] **doc** `docs/art/skills.md:35` — Live: `skill-locked` (research or skill gate). Searched: `skill-locked` in `src/game/` and `src/App.tsx`, no import. (`prop-rain-tank.svg`, which `docs/art/props.md:28` calls not live, is also not imported.)
- [ ] **removed from the game**
- [ ] **none**

## Code only (no note mentions it)

### 9. Which skill art files on disk are not used?
- [ ] **code** `src/assets/skills/` — `skill-bio`, `skill-clearance`, `skill-forecast`, `skill-land-study`, `skill-machine-contracts`, `skill-open-24`, `skill-open-late`, `skill-tax`, `skill-tool-contracts`, `skill-water-study` have no import in `src/game/` (grep, one file at a time). `skill-contracts.svg` is imported (`src/game/view/svgs.ts:267`, `:672`). `docs/art/skills.md:37` says dead skill files remain and does not list them.
- [ ] **intended, document it**
- [ ] **not intended**

## Agreed

- [ ] 10. Root rules: every asset has `shape-rendering="crispEdges"`, no root `width`, no `currentColor`, no `<text>`, no `<image>`, no editor metadata (381 of 381 files) — doc `docs/art/svg.md:9-13`, code `src/assets/**/*.svg`, no test.
- [ ] 11. Tile viewBoxes: pump 48×24, still 48×24, research station 48×24, furnace / weather station / trees 24×48, mill / infuser / generator 48×48, hangar 72×48, house 96×72, windmill 24×60, menu 240×64, actor 24×24 (13 files opened) — doc `docs/art/svg.md:17-29`, `docs/art/menu.md:3`, `docs/art/actor.md:3`, code `src/assets/`, no test.
- [ ] 12. `TILE` 48; drop face 33, inset 4, step 6; camera scale 0.5–3; hit radii edge 0.35, vertex 0.3, sprinkler 0.45; vehicle follow 0.35 — doc `docs/architecture/view.md:9-11`, `:81`, `:87`, `:73`, code `src/game/view/camera.ts:3-7`, `:23`, `src/game/view/hit.ts:18-20`, `src/game/view/layers/actors.ts:13`, test `hit.test.ts:49`.
- [ ] 13. Layer order ground, plots, dig patch, pipes, props, actors, overlay, VFX; farm `eventMode` none — doc `docs/architecture/view.md:15-24`, code `src/game/view/world-view.ts:70-80`, test `hit.test.ts:58`.
- [ ] 14. Variety group is the tier; atlas asks exactly for the groups each file carries; named jars and bottles draw their own file; infused faces are the plain face plus the overlay — doc `docs/architecture/view.md:30-48`, `:155-161`, code `src/game/view/atlas.ts`, `src/game/view/svgs.ts:396-400`, test `atlas.test.ts:20`, `:40`, `:61`, `:100`.
- [ ] 15. Loading overlay **Loading...** until first layout — doc `docs/architecture/view.md:130`, code `src/game/view/map.tsx`, test `map.test.ts:22`.
- [ ] 16. Route drag L-path for pipes and fences; hover outline one path per footprint; furnace cover outline — doc `docs/architecture/view.md:91-99`, `:134-140`, code `src/game/view/hit.ts`, `src/game/view/outline.ts`, test `hit.test.ts:10-29`, `outline.test.ts:18`, `:47`.
- [ ] 17. VFX files and frame counts: spray 4 (48×48), spray-large 4 (96×96), spray-vert 2 (96×48), steam 4 (48×24), dust 2, tend 2, pour 2, burrow-pop 3, brew / dig / grind / station / exhaust / furnace / furnace-smoke / graft / age 4 (17 files opened) — doc `docs/art/vfx.md:49-71`, code `src/assets/vfx/`, test `e2e/vfx.spec.ts`.
- [ ] 18. Tractor exhaust while speed ≥ 0.15, offset 0.45 behind; flow dash cycle 1.1 — doc `docs/art/vfx.md:21`, `:105-107`, code `src/game/view/layers/vfx.ts:23-24`, `src/game/view/layers/overlay.ts:40`, no unit test.
- [ ] 19. Ground bands: very hard below 0.2, hard below 0.34, each split into equal thirds; eight grass tiles picked by `tileVariant` — doc `docs/art/ground-variants.md:3-24`, code `src/game/sim/noise.ts:4-5`, `src/game/view/layers/ground.ts:11-12`, `src/assets/tiles/tile-grass-0..7.svg`, no test.
- [ ] 20. Pump `body` / `arm`, mill `body` / `sails`, postbox `off` / `on`, trees `trunk` `grow` `unripe` + ripe per variety, grafts: apple and apricot three groups, cherry `base` `heirloom`, olive `base` `variant` (8 files opened) — doc `docs/art/props.md:17-23`, `docs/art/svg.md:40-41`, `docs/art/items.md:39-50`, code `src/assets/props/`, `src/assets/items/item-graft-*.svg`, test `atlas.test.ts:61`.
- [ ] 21. Art index lists the art notes — doc `docs/art/_index.md:3-20`, code not applicable, no test.
