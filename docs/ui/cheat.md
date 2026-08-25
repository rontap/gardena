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

Boot `#debug-contracts`: generator ladder, not play. 20 rows × 6 slots = 120 offers. D `1…10` then `12,14…20` then `24,28…40`. `grid-cols-6`. Seed 1. Same `OfferCard`. Guest face. `main.tsx` sets `html`/`body`/`#root` overflow auto so `min-h-screen` can scroll. [[ui/contracts]]
