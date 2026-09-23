# Error boundary

`ErrorBoundary` in `src/game/ui/error-boundary.tsx`. React class — `getDerivedStateFromError` sets `failed`, `componentDidCatch` logs the error and `info.componentStack` so the stack survives the catch. Once `failed`, `Oops` replaces the tree; nothing resets it but a reload.

`main.tsx` wraps the play branch only: `<StrictMode><ErrorBoundary><App/></ErrorBoundary></StrictMode>`. The `#debug-*` and `#atlas` branches stay unwrapped — a developer page reads better as a raw stack.

Catches render, lifecycle and constructor throws under `App`. Does not catch event handlers, `setTimeout`, rAF, the Pixi ticker, or the worker sink. A crash the player can reach from a click handler still reaches the console, not this screen.

## Oops

Full bleed `bg-grass`, `text-white`, centred column, `gap-6`.

| part | copy | type |
|---|---|---|
| title | **Oops** | `font-display` `text-4xl` — [[ui/type]] |
| body | **Gardena encountered an error which could not be recovered. Please try downloading the save and retrying.** | `text-xl`, `max-w-2xl` |
| buttons | **Download save**, **Exit to main menu** | `text-base` `font-semibold`, `bg-dirt` card chrome |

**Download save** writes the stored slot as `DOWNLOAD_NAME` — `readSlot()` verbatim, one `Blob` of `application/json`. It does not call `dump(world)`: the world that crashed may be the cause, and `dump` would throw inside the boundary. The slot is what [[architecture/save]] already treats as the save — `App` writes it on every day rollover and on host change, so a crash mid-day loses that day, not the farm.

No slot: the button is disabled and a line under the row reads **There is no stored save to download.** — a grayed control says why.

**Exit to main menu** is `window.location.reload()`. Boot decides what comes back; this screen holds no route.

Copy: `menu_error_*` in `messages/en/menu.json` — [[standards/user-facing-text]].

## Cheat

**Crash the game** throws from `Cheat`'s own render — [[ui/cheat]]. A throw in the click handler would not reach a boundary, so the row sets local state and the next render throws.
