# Testing

Vitest: `npm test` (`src/`, sim). Playwright: `npm run e2e`.

## What to test

Named invariants on the owning note. Map: [[mechanics/_index]]. Nothing else unless the user asks.

One `src/game/sim/world.test.ts` (or split by the same topic names as `docs/mechanics/`). Test names are the invariant text.

## What not to test

Copy wording, layout, SVG, Tailwind. Playwright covers HUD smoke only.

Changelog *line-shape* is tested (dialect fixtures, not player sentences). Copy exemption does not cover the parser. [[architecture/changelog]] [[standards/update-notes]]

## After a rule change

Update the invariant on the owning note in the same change as the test. Fix the [[mechanics/_index]] id map if the id is new.
