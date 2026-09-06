# Cheat

Debug left [[ui/docks]] `Dock`. Title **Cheat**. Shop-width `w-80`. Shop row chrome (`bg-dirt`, selected `bg-ink`).

Left ribbon **Cheat** after Almanac. Toggle. Esc / × close. Guest: Cheat hidden. Host only.

| row | act |
|---|---|
| Unlock all instantly | `unlockAll()` — every research done, `money += 999`, job idle, `World.points = 99`. Does not grant skills. Does not reroll. |
| Unlock all skills | `unlockAllSkills()` — every `SKILLS` id at `maxTier` including `haggling`, ignores gates, rebuilds modifiers, empties offers. Not `unlockAll`. |
| Research speed 3× | toggle `World.cheatFastResearch`. Selected while on. Job drain `× 3` on top of Speedy research. `Act.cheat` `{ k: 'research' }`. |
| 1× / 3× | one `flex` row, two buttons, each `flex` 2. Not a toggle. Click 1× dispatches `Act.cheat` `{ k: 'speed'; n: 1 }`. Click 3× `{ k: 'speed'; n: 3 }`. Selected = current `World.cheatSpeed`. |
| Gain 200 | `money += 200` |
| Gain 10 skill points | `World.points += 10` |
| End day | `Act.cheat` `{ k: 'day' }`. `clock.t = DAY_SECONDS`. No remaining-field sim. Recap: no-op. |

1× / 3× is world time, not a research-drain arm. Same field as `?speed=`. — [[architecture/world]] `world.cheatSpeed`

Assumption: 1× / 3× buttons use the same shop row chrome.

Weather pins after End day. Wrap the five kind rows in `grid grid-cols-2 gap-1.5`. Not `grid-cols-4`. Selected = that kind is pinned as tomorrow. Click pins tomorrow and rebuilds the table. One selected at a time; selecting another replaces the pin. Click the selected row: leave selected. No clear-pin row. Pins not Save. Not `Cmd`. [[mechanics/weather]]

Not in the Research dock. [[mechanics/research]] [[mechanics/family]].

Boot `#unlockall` or `?start=unlock`: skip menu like `#start_now` / `?start=now`, then `unlockAll()`. Not skills. Not a Cheat row. Play tests use `?start=unlock` or `window.__world.unlockAll()`, not this dock. [[ui/menu]] [[architecture/save]]

Boot `?speed=3`: play World `cheatSpeed` 3 via `Act.cheat` `{ k: 'speed'; n: 3 }`. Any other URL value (absent, `1`, `10`, `3.0`) boots 1.

Boot `#debug-techtree`: the unlock graph, not play. Mermaid `flowchart LR`, one subgraph per tree. Nodes are research, leaves are the SKUs, skills and `grants` they open. Filter by tree, toggle leaves. Hover any node to fill the lower panel: own $ / s, total $ / s over the whole prerequisite chain counted once, and the unlock list. Derived from `RESEARCH` / `SKUS` / `SKILLS` at render time — a new row needs no edit here. `src/game/ui/techtree.ts` is the derivation, `debug-techtree.tsx` the page. `main.tsx` imports it dynamically so mermaid stays out of the game bundle. [[mechanics/research]]

Boot `#debug-contracts`: generator ladder, not play. 20 rows × 6 slots = 120 offers. D `1…10` then `12,14…20` then `24,28…40`. `grid-cols-3`. Seed 1. Host `relative mx-auto w-[72rem]`. Same `OfferCard`, host face (`guest={false}` `atCap={false}`). Hover is live: `aside` sibling of Chrome, [[ui/callout-hover]] `right`, same Overlay pattern. Accept click is a no-op. `main.tsx` sets `html`/`body`/`#root` overflow auto so `min-h-screen` can scroll. [[ui/contracts]]

Boot `#debug-weather`: forecast table, not play. Not mermaid. Days 1…50 of `forecastWeather(seed, 50)`. Seed shown (`seed {n}`). **Random again** `Btn` increments seed — same as contracts Re-roll. Host `relative mx-auto w-[72rem]`. One row per day: number + kind name + glyph `h-5 w-5` `ui-weather-{kind}` `viewBox="0 0 16 16"`. Kind names Clear Rain Dry Flood Drought only. `main.tsx` hash branch, `openScroll` (coder wires it).

Boot `#debug-balance`: crop income table, not play. Not mermaid. Host fills the window. Left pane: globals by category. Right: four tables, last **Derived stats**. **Show varieties** lists every Variety under its crop. Imports `CROPS` / `TREES` / `SKUS` / `statsOf` / `jamSale` / `jamSugar` / `bakeSpiritSale` / `bakeCaskSale` / `millProduct`. Globals and per-crop fields start at live defs; edits do not write back. Sale columns, then `$/min`, then `$/click`. `$/min` and `$/click` are net: seed pack, fertilizer when **Fertilizer** is on, sugar on jam. Jam / mill / alcohol sale is batch / fruit in. Barrel **Alcohol (max aged)**: Plain/Named `CASK_AGE_MIN` and `BARREL_AGE`; Heirloom `CASK_AGE_MAX` and `BARREL_AGE × MAX/MIN`. Jam machine / Mill / Alcohol mark ⬆️ or ❌ against Fresh. **Show variety preferences** tints purpose. **Show best** is a per-column colour scale. **Compost** / **Fertilizer**: Compost leaves fertilizer out of net; Fertilizer subtracts bag cost for the fruit grown. Fruit sale, jam / mill / alcohol sale, and jam sugar tint if they disagree with those functions while every field is still the live def. **Revert to default** restores defs. `CSV` downloads the live rows. `scripts/crop-stats.mjs` is gone. `main.tsx` hash branch, `openScroll`.

Boot `#debug-iconset`: fruit, seed, growth, and tree SVG groups, not play. Not mermaid. Parses `<g id>` from each `fruit-*`, annual `crop-*` (seed faces + growth stages), `item-seed-*`, and `prop-*-tree`. Grid: one cell per group, face + file + id. Growth lists `sprout` `grow` `dead` plus the ripe group of each Variety that crop has. There are no unused Variety slots to deprecate: a file carries exactly the groups `VARIETIES[crop]` asks for — [[architecture/view]] `view.groups`. Icon art stays full color. Host `relative mx-auto w-[72rem]`. `main.tsx` hash branch, `openScroll`.

Boot `#atlas`: every asset file and every `<g id>` in it, not play. Not mermaid. `import.meta.glob` over `src/assets/**/*.svg` as raw — the same sweep [[architecture/view]] `view.groups` uses. One cell per `(file, group)`; a file with no group is one cell reading `whole`. Sections in folder order, files sorted inside one. Face size from the viewBox, 3rem per tile, capped at 7rem, so a 1×2 and a 4×3 keep their proportions. `-edge` / `-inset` files raster with the `EDGE_PAD` overhang the atlas gives them, so the lip is visible instead of clipped. Host `relative mx-auto w-full max-w-[86rem]`. `main.tsx` hash branch, `openScroll`, dynamic import so the glob stays out of the game bundle. `src/game/ui/atlas-view.tsx`.

**VFX** checkbox, top right. Off: `vfx-*` files are still cells like any other. On: a **vfx on props** section leads the page, one cell per (prop, VFX) pairing, the VFX animating over the prop face at its own `dur` and tile offset — furnace fire south and smoke north, mill and jam dust, still steam, barrel brew and age, the three sprinklers, dig, pour, tend, graft. The pairing table is hand-written in that file from `VFX` and `layers/vfx.ts`; it is a debug page, not a second source of truth. Frames cut on one `setInterval` and the frame index is `floor(p × slots)`, the same cut `VfxLayer.draw` makes. The `no rAF outside the Pixi ticker` rule in [[art/vfx]] governs the Pixi world; a `#debug-*` React page is not that world.

Assumption: `#debug-weather` seed starts at 1.
