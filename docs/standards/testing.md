# Testing

Vitest: `npm test` (`src/`, sim). Playwright: `npm run e2e`.

## What to test

Named invariants on [[mechanics/_index]]. Nothing else unless the user asks.

One `src/game/sim/world.test.ts` (or split by the same topic names as `docs/mechanics/`). Test names are the invariant text, not old version labels.

## What not to test

Copy, layout, SVG, Tailwind. Playwright covers HUD smoke only.

## After a rule change

Update the invariant on [[mechanics/_index]] in the same change as the test.
