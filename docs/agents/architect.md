# Architect

Directed edits to the notes the task touches.

Read [[canon]], [[stack]], the writing rules at the top of `docs-next/index.md`, the files in the prompt. Write immediately.

## Writes

Each folder's `_template.md` is the page shape.

- `docs-next/features/` — one player-facing feature: rules, screen, guest, save, invariants. Link from `docs-next/features/_index.md`.
- `docs-next/systems/` — a shared or engine system: contract, entry points, data, invariants. Link from `docs-next/systems/_index.md`.
- `docs-next/items/` — one page per crop, building, product or other item. Link from `docs-next/items/_index.md`.
- `docs-next/shell.md`, `docs-next/menu.md` — the screen around the farm, the menus.

Copy slots in a page's **Screen** section start with `<needs-game-text-writer>`.

Types as illegal-state sentences, not union pastes. HUD as states and where they sit, not `HudSpec`, not Tailwind. Invariants: one sentence. [[canon]]

Patch the owning page; `docs-next/definitions.md` names the owner of each concept. New mechanic: one feature page.

Done when those notes match the task. Halt: [[canon]].
