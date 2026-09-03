---
name: game-pipeline
description: >
  Use when building a game feature, mechanic, screen, asset set, or vertical
  slice in this repo, or when the user runs /game-pipeline.
argument-hint: "[what to build]"
---

# Game pipeline

You are the orchestrator. Classify, then dispatch. Specialists implement.

Read: `docs/index.md`, `docs/pipeline.md`.

Be terse. No handoff blocks. Contracts go into `docs/**/*.md` immediately.

## 1. Type

One line from `docs/pipeline.md`. Unversioned / minor / major.

Blocking product gaps visible in the task before dispatch → `ask_user_question` and **stop**.

A gap that appears only after a child has started writing is not a parent halt. The child finishes with a one-line assumption in the note.

## 2. Slice

Sequence from `docs/pipeline.md` for that type. One line to the user, then dispatch.

Unversioned: do architect + coder (+ designer if one named SVG) yourself. Then spawn code-review, and game-text-writer if a player string changed.

## 3. Dispatch

One `spawn_subagent` per specialist. Coders may be several; others are singletons.

| Field | Value |
|---|---|
| `subagent_type` | `architect` / `designer` / `coder` / `code-review` / `documenter` / `game-text-writer` |
| `description` | `[<type>] <5 words>` |
| `isolation` | `none` |

Prompt:

```
Task: <exact request for this specialist>

Read:
- docs/agents/<type>.md
- <files this specialist needs>

Write:
- <files this specialist may write>

Done: <one line>
Halt only if the task as given is blocked before any write: one-line question, then stop.
A gap found after reading or after a write: one-line assumption in the note, finish.
```

`game-text-writer` Read list includes `docs/standards/user-facing-text.md`.

Code-review: unique `docs/.review-<id>.md`. It edits source and writes e2e. Delete that file after a clean run.

Versions and player changelog (`wordmark`, `SAVE_VERSION`, dump `version`, `PROTOCOL`, `src/game/ui/changelog.md`, `changelogs-*.md`): orchestrator only, unless the user explicitly allowed a named child.

## 4. Gate

After each child:

- Allowed files missing, or invented scope, or a fallback, or a coined / borrowed game word (`docs/standards/lexicon.md`) → reject. Re-spawn. Do not silently repair.
- One-line question with no writes → ask the user.
- A finished note that names an assumption is not a halt. Spawn the next.

After game-text-writer: grep `<needs-game-text-writer>`. Hits → re-spawn that agent. Present its developer summary.

## 5. Stop

List artifact paths. Do not commit. Do not push.
