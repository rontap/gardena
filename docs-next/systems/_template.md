# {System}

Code: {folders or files by name}; see [[code-map]].

## Job

{What this system does for the rest of the game, in one paragraph.}

## Used by

- [[features/{name}]] — {what for}

## Contract

{What the rest of the code may rely on. Prose; a table only where rows share columns.}

## Entry points

{The functions and types other code calls, and what each does.}

## Data

{The state it owns; what is saved; what the digest carries.}

## Invariants

| id | rule | test |
|---|---|---|
| `{system.name}` | {rule} | `{test file}` or none |

## When you change this

- {kind of change}: [[features/{name}]] / [[systems/{name}]] {and why}.

## Decisions

- {a reason the code does not show}
