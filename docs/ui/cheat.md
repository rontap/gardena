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

Boot `#unlockall`: skip menu like `#start_now`, then `unlockAll()`. Not skills. Not a Cheat row. Play tests use the hash or `window.__world.unlockAll()`, not this dock. [[ui/menu]] [[architecture/save]]

Boot `?speed=3`: play World `cheatSpeed` 3 via `Act.cheat` `{ k: 'speed'; n: 3 }`. Any other URL value (absent, `1`, `10`, `3.0`) boots 1.

Boot `#debug-techtree`: the unlock graph, not play. Mermaid `flowchart LR`, one subgraph per tree. Nodes are research, leaves are the SKUs, skills and `grants` they open. Filter by tree, toggle leaves. Hover any node to fill the lower panel: own $ / s, total $ / s over the whole prerequisite chain counted once, and the unlock list. Derived from `RESEARCH` / `SKUS` / `SKILLS` at render time — a new row needs no edit here. `src/game/ui/techtree.ts` is the derivation, `debug-techtree.tsx` the page. `main.tsx` imports it dynamically so mermaid stays out of the game bundle. [[mechanics/research]]

Boot `#debug-contracts`: generator ladder, not play. 20 rows × 6 slots = 120 offers. D `1…10` then `12,14…20` then `24,28…40`. `grid-cols-3`. Seed 1. Host `relative mx-auto w-[72rem]`. Same `OfferCard`, host face (`guest={false}` `atCap={false}`). Hover is live: `aside` sibling of Chrome, [[ui/callout-hover]] `right`, same Overlay pattern. Accept click is a no-op. `main.tsx` sets `html`/`body`/`#root` overflow auto so `min-h-screen` can scroll. [[ui/contracts]]

Boot `#debug-weather`: forecast table, not play. Not mermaid. Days 1…50 of `forecastWeather(seed, 50)`. Seed shown (`seed {n}`). **Random again** `Btn` increments seed — same as contracts Re-roll. Host `relative mx-auto w-[72rem]`. One row per day: number + kind name + glyph `h-5 w-5` `ui-weather-{kind}` `viewBox="0 0 16 16"`. Kind names Clear Rain Dry Flood Drought only. `main.tsx` hash branch, `openScroll` (coder wires it).

Assumption: `#debug-weather` seed starts at 1.
