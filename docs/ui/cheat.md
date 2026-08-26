# Cheat

Debug left [[ui/docks]] `Dock`. Title **Cheat**. Shop-width `w-80`. Four rows, shop row chrome (`bg-dirt`, selected `bg-ink`).

Left ribbon **Cheat** after Almanac. Toggle. Esc / × close.

| row | act |
|---|---|
| Unlock all instantly | `unlockAll()` — same as before: every research done, `money += 999`, job idle, each member `points = 99` |
| Research speed 3× | toggle `World.cheatFastResearch`. Selected while on. Job drain `× 3` on top of Speedy research |
| Gain 200 | `money += 200` |
| Gain 10 skill points | each member `points += 10` |

Not in the Research dock. [[mechanics/research]] [[mechanics/family]].

Boot `#unlockall`: skip menu like `#start_now`, then `unlockAll()`. Not a Cheat row. Play tests use the hash or `window.__world.unlockAll()`, not this dock. [[ui/menu]] [[architecture/save]]

Boot `#debug-techtree`: the unlock graph, not play. Mermaid `flowchart LR`, one subgraph per tree. Nodes are research, leaves are the SKUs, skills and `grants` they open. Filter by tree, toggle leaves. Hover any node to fill the lower panel: own $ / s, total $ / s over the whole prerequisite chain counted once, and the unlock list. Derived from `RESEARCH` / `SKUS` / `SKILLS` at render time — a new row needs no edit here. `src/game/ui/techtree.ts` is the derivation, `debug-techtree.tsx` the page. `main.tsx` imports it dynamically so mermaid stays out of the game bundle. [[mechanics/research]]

Boot `#debug-contracts`: generator ladder, not play. 20 rows × 6 slots = 120 offers. D `1…10` then `12,14…20` then `24,28…40`. `grid-cols-3`. Seed 1. Host `relative mx-auto w-[72rem]`. Same `OfferCard`, host face (`guest={false}` `atCap={false}`). Hover is live: `aside` sibling of Chrome, [[ui/callout-hover]] `right`, same Overlay pattern. Accept click is a no-op. `main.tsx` sets `html`/`body`/`#root` overflow auto so `min-h-screen` can scroll. [[ui/contracts]]
