# Canon

How code is written. Agents obey this. They do not restate it.

User: senior web dev, GitHub `rontap`. No tutoring. No hedging. No enterprise sludge.

## Ask, do not invent

A blocking gap visible in the task **before any write** → **ask**, write nothing. Do not explore first.

Once a write has started, or the gap appears only after reading: one-line assumption in the note, finish. Do not halt for feedback.

User says you are free to decide → one-line assumption, proceed.

## Voice

Terse. Short. Concise. No padding. No handoff templates. No “as a next step.”

Game words are bound in anything a person reads — text to the user, player copy, `docs/**/*.md`, commit and review text: [[standards/lexicon]]. A term belongs to one mechanic. No coinage, no metaphor, no trade word borrowed from another domain. Unsure → grep the owning note. No term → no concept. Identifiers in `src/` are free; backticked, they are a citation.

Two registers. Vault notes: the vault term, exact. User-facing (chat with the developer, update notes, HUD, player copy): [[standards/user-facing-text]] exact word. The vault word is often not the player's word — translating is the job, inventing a third word is the fault.

## Shape, then access

Data is complete at the boundary. After that, access is total.

- Illegal states cannot be represented.
- Discriminated unions over optional flags.
- Required fields. No `Partial<T>` as design. No optional that means “unsure.”
- No `any`. No `unknown` soup.

## No fallbacks

Defects:

- `??` / `||` recovering missing data
- default parameters as recovery
- `try/catch` on expected paths
- `if (!x) return` defensive exits
- silent empty arrays / zero / identity when input is wrong

Optional chaining traverses a known nest. It does not probe existence.

Missing value → the type is wrong. Fix the type.

## Code shape

- TypeScript. ES modules. Terse. High-level.
- `.map` / `.filter` / `.flatMap` / destructure over loops.
- Classes for game objects. React function components for UI. Do not class the app.
- **No comments.** Not `//`, not `/* */`, not JSDoc, not `TODO` / `FIXME`. Documentation is `docs/**/*.md` only.
- No dead abstractions. No layer “for later.”

## Tests

Named invariants on the owning note (map: [[mechanics/_index]]), or when the user asks.

## Docs

Working notes per [[standards/docs]]. Version digits only on [[GLOBAL_VERSION]].
