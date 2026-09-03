# Stack

Locked for this game.

| Layer | Choice |
|---|---|
| Bundler | Vite |
| UI | React |
| Style | Tailwind |
| Language | TypeScript |
| Tests | Vitest (sim), Playwright (e2e) |
| i18n | Paraglide JS. English only. [[architecture/i18n]] |

Do not add Vue, CSS-in-JS, a second bundler, or a CSS framework.

One exception: `mermaid`, for the `#debug-techtree` unlock graph only — [[ui/cheat]]. Dynamically imported in `main.tsx`, so it lands in its own chunk and never in the game bundle. Vite `optimizeDeps.exclude` lists it: a lockfile change otherwise re-bundles every mermaid diagram at `npm run dev` and the server looks hung. Do not reach for it in game UI.

Renderer: **PixiJS v8 canvas world**. HUD/panels are React + Tailwind, not Pixi. No `@pixi/react`. Chrome SVGs stay in React. Contract: [[architecture/view]].

App lives at repo root: `package.json`, `vite.config.ts`, `src/`. Tailwind v4 via `@tailwindcss/vite`. `npm run dev` / `npm run build`. Project `.npmrc` sets `audit=false`: electron-builder's tree makes the registry audit POST stall `npm i`.

Vitest: `npm test` (sim). Playwright: `npm run e2e`, config `playwright.config.ts`, specs `e2e/`.
