---
name: game-pipeline
description: >
  Use when building a game feature, mechanic, screen, asset set, or vertical
  slice in this repo, or when the user runs /game-pipeline.
argument-hint: "[what to build]"
---

# Game pipeline

You are the orchestrator. Specialists implement. You do not.

Read: `docs/index.md`, `docs/canon.md`, `docs/stack.md`, `docs/pipeline.md`.

Be terse. No handoff blocks. Contracts go into `docs/**/*.md` immediately.

## 1. Gaps

List unspecified product / design / mechanic / copy / visual facts **visible in the task before dispatch**.

Non-empty → `ask_user_question` and **stop**. Do not invent.

A gap that appears only after a child has started writing is not a parent halt. The child finishes with a one-line assumption in the note.

Renderer and genre stay unlocked until the user locks them. App is at repo root.

## 2. Slice

Minimum sequence from `docs/pipeline.md`. One line to the user, then dispatch.

Designer ∥ ui-ux only after mechanics exist, or the user said there are none.

## 3. Dispatch

One `spawn_subagent` per specialist.

| Field | Value |
|---|---|
| `subagent_type` | `architect` / `designer` / `ui-ux` / `coder` / `documenter` / `code-review` |
| `description` | `[<type>] <5 words>` |
| `capability_mode` | `read-write` except `coder` and `code-review` → `all` |
| `isolation` | `none` |

Prompt:

```
Task: <exact request for this specialist>

Read first:
- docs/agents/<type>.md
- docs/canon.md
- docs/standards/lexicon.md
- docs/standards/user-facing-text.md
- <docs the previous specialist just wrote>

Write immediately where docs/agents/<type>.md allows.
When those files exist, stop.
No handoff block. No chat contract. No code comments.
Halt only if the task as given is blocked before any write: one-line question, then stop.
A gap found after reading or after a write: one-line assumption in the note, finish.
Do not spawn confirm-only children.
Do not edit, write, bump, or modify any version number, write release notes, or touch versions text unless this prompt quotes an explicit user allow.
```

Code-review: unique `docs/.review-<id>.md`. No source edits. Delete that file after a clean run.

Versions and player changelog (`wordmark`, `SAVE_VERSION`, dump `version`, `PROTOCOL`, `src/game/ui/changelog.md`, `docs/changelog.md`, `changelogs-*.md`): orchestrator only, unless the user explicitly allowed a named child.

## 4. Gate

After each child:

- Allowed `.md` / src / svg missing, or invented scope, or a fallback, or a coined / borrowed game word (`docs/standards/lexicon.md`) → reject. Re-ask or re-spawn. Do not silently repair.
- One-line question with no writes → ask the user. Do not answer for them.
- A finished note that names an assumption is not a halt. Spawn the next.

## 5. Stop

List artifact paths. Do not commit. Do not push. Do not pick a renderer.
