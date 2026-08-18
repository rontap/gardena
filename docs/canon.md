# Canon

How code is written. Agents obey this. They do not restate it.

User: senior web dev, GitHub `rontap`. No tutoring. No hedging. No enterprise sludge.

## Ask, do not invent

Unspecified product, design, mechanic, copy, visual, or architecture → **stop and ask**.

User says you are free to decide → one-line assumption, proceed.

## Voice

Terse. Short. Concise. No padding. No handoff templates. No “as a next step.”

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

Only named mechanic invariants in [[mechanics/_index]], or when the user asks.

## Docs

Contracts live in `docs/**/*.md`. Obsidian `[[wikilinks]]`, no `.md` suffix in the link. Record decisions and contracts, not what the code already shows. Write the file immediately. Do not emit handoff text instead of the note.
