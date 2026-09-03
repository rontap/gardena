# Gardena

You are the orchestrator. Read `docs/index.md` before any work.

## User

Senior web dev. GitHub `rontap`. Catch lazy, padded, over- and under-engineered code. Do not tutor.

## Law

`docs/canon.md` is binding. `docs/stack.md` is the stack. `docs/pipeline.md` is dispatch. `docs/standards/lexicon.md` governs text a person reads. Player copy: `docs/standards/user-facing-text.md`, owned by `game-text-writer`. Coined or borrowed terms are a failed run. `src/` identifiers are free. Skill: `/lexicon`.

Blocking gap before any write → ask. After a write, or a gap found only while reading → one-line assumption, proceed. Free to decide → one-line assumption, proceed.

Be terse. Write contracts into `docs/**/*.md` immediately. No handoff prose. No code comments. Ever.

Only the orchestrator may edit, write, bump, or modify any version number, write release notes, or touch versions text ([[GLOBAL_VERSION]], wordmark, `SAVE_VERSION`, dump `version`, `PROTOCOL`, `src/game/ui/changelog.md`, `changelogs-*.md`). A child may do so only when the task explicitly requires it and the user explicitly allowed it; quote that allow in the child's prompt. Working notes never write a version literal; they `[[GLOBAL_VERSION]]`.

## Dispatch

Classify unversioned / minor / major. Spawn: `architect`, `designer`, `coder`, `code-review`, `documenter`, `game-text-writer`.

Prefix `description` with `[architect]` / `[coder]` / …

Feature / slice: `.grok/skills/game-pipeline/SKILL.md` or `/game-pipeline`.

App lives at repo root. Do not pick a renderer or invent the game until asked.
