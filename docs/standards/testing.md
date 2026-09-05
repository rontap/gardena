# Testing

Vitest: `npm test` (`src/`, sim) — [[agents/coder]]. Playwright: `npm run e2e` — [[agents/code-review]].

## What to test

Named invariants on the owning note. Map: [[mechanics/_index]]. Nothing else unless the user asks. Coder writes the unit tests. Code-review writes e2e for new user paths.

One `src/game/sim/world.test.ts` (or split by the same topic names as `docs/mechanics/`). Test names are the invariant text.

## What not to test

Never test specifically for versions, ever. `expect(SAVE_VERSION)` or `PROTOCOL` `.toBe` is disallowed.

Copy wording, layout, SVG, Tailwind. Playwright covers HUD smoke only. `e2e/buildings.spec.ts` is a placement census shot, not a copy test. Do not `toHaveText` look copy. Boot `?start=now` / `?start=unlock` — wait for the Shop rail, not `.bg-grass` (the menu backdrop is grass too). CI runs one worker.

Changelog *line-shape* is tested (dialect fixtures, not player sentences). Copy exemption does not cover the parser. [[architecture/changelog]] [[standards/update-notes]]

## After a rule change

Update the invariant on the owning note in the same change as the test. Fix the [[mechanics/_index]] id map if the id is new.
