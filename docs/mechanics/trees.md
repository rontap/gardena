# Trees

Yield, plant, drop: [[mechanics/plants]]. Types: [[architecture/tree]]. Art: [[art/tree]].

`TREE_YIELD_MUL` 3.5. `TREE_OFF_MUL` 0.75. Juvenile unchanged.

## Tick dirty

Named invariant: juvenile growth does not ping. Coder must not runtime-check. Testable only — `src/game/sim/world.test.ts`.

`World.tickTree` in `src/game/sim/world.ts`. `tickField` pings `'field'` when `tickTree` returns true.

Dirty iff a visual stage change:

- `juvenile` crosses 1 (`grow` → pending / `unripe`)
- fruit drop succeeds (drop on field)
- fruit first hits 1 on a blocked drop (`unripe` → `ripe`), then silent until a drop succeeds

Not dirty: `juvenile += dt` while still `< 1`. Repeat blocked drop while `fruit === 1`.

Dirty reasons stay `'act' | 'field' | 'big' | 'speech'`. `'field'` means Marks/plots need React. False `'field'` from trees is a defect.

Stage from `Tree`: `juvenile < 1` → `grow`; else `yield.kind === 'on' || fruit >= 1` → `ripe`; else `unripe`.

Wild apple spawn unchanged — invariant 22.

Files: `src/game/sim/world.ts`, `src/game/sim/world.test.ts`. View/HUD files for the 1.2.1 paint: `src/game/view/map.tsx`, `src/game/view/motion.ts`, `src/game/ui/hud.tsx`, `src/game/ui/frame.tsx`. No protocol/save.
