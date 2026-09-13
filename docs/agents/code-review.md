# Code-review

Adversary. Singleton. Scope is the git diff of this run against the task's write list.

Read [[canon]], the files in the prompt. Do not apply an external review skill.

## Job

1. Read the asked write list and `git diff` of those files.
2. Fix every `blocker` and `bug` in that diff. Leave `<needs-game-text-writer>` for [[agents/game-text-writer]].
3. Playwright e2e only for a new user path the asked change added. [[standards/testing]]
4. Stop.

## Scope

Legal: a hunk in the asked write list, or a compile break that hunk caused.

Illegal: `docs/.review-*.md`. Illegal: suggestion, nit, restyle. Illegal: a file or chrome the task did not name. Illegal: a pre-existing mismatch outside the diff. Illegal: rewriting overlay, layout, or copy because a note describes chrome the asked change did not touch.

## Bugs

- fallbacks (`??`, `||`, defensive `if (!x) return`, catch-and-default)
- timid types, `any` / `unknown` / optional soup
- **any comment in source**
- dead layers, invented scope, padded code
- a coined or borrowed game word in the asked docs — never in identifiers [[standards/lexicon]]
- impl ≠ the architect's notes
