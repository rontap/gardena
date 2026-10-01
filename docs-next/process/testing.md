# Testing

Applies to: [[process/agents]] Coder (unit tests) and Code-review (e2e).

Vitest: `npm test` (`src/`, sim) — Coder. Playwright: `npm run e2e` — Code-review.

## What to test

Named invariants on the owning `docs-next` page. Nothing else unless the user asks. Coder writes the unit tests. Code-review writes e2e only for a new user path the asked change added.

Unit tests sit next to the code as `*.test.ts` ([[code-map]]). Test names are the invariant **id**.

Unit tests defend that id by asserting **observable sim state**. They are not a second spec. Do not transcribe the note.

## What not to test

Never test specifically for versions, ever. `expect(GAME_VERSION).toBe` is disallowed.

Copy wording, layout, SVG, Tailwind, markup `contains`, CSS `scale(`. Playwright: new user path, behavior and chrome **presence**. Not a census of class names. `e2e/buildings.spec.ts` is a placement census shot, not a copy test. Do not `toHaveText` look copy. Boot `?start=now` / `?start=unlock` — wait for the Shop rail, not `.bg-grass` (the menu backdrop is grass too). `waitPlay` retries through a reload. CI: one worker, `vite preview` after `build`, not `vite`. Page `evaluate` must not `import('/src/…')` — preview has no source tree. Constructors and look helpers live on `window.__e2e`, next to `__world`.

Changelog *line-shape* is tested (dialect fixtures, not player sentences). Copy exemption does not cover the parser. [[process/update-notes]]

## After a rule change

Rewrite the one-sentence invariant on the owning page in the same change as the assertion. Do not keep a test that matched the old paragraph.
