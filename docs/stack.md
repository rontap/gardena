# Stack

Locked for this game.

| Layer | Choice |
|---|---|
| Bundler | Vite |
| UI | React |
| Style | Tailwind |
| Language | TypeScript |
| Tests | Vitest (sim), Playwright (e2e) |

Do not add Vue, CSS-in-JS, a second bundler, or a CSS framework.

Renderer: **SVG + DOM**. Camera on an SVG world. HUD/panels are React + Tailwind, not canvas.

App lives at repo root: `package.json`, `vite.config.ts`, `src/`. Tailwind v4 via `@tailwindcss/vite`. `npm run dev` / `npm run build`.

Vitest: `npm test` (sim). Playwright: `npm run e2e`, config `playwright.config.ts`, specs `e2e/`.
