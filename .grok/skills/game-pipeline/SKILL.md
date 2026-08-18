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

List unspecified product / design / mechanic / copy / visual facts.

Non-empty → `ask_user_question` and **stop**. Do not invent.

Renderer and genre stay unlocked until the user locks them. App is at repo root.

## 2. Slice

Minimum sequence from `docs/pipeline.md`. One line to the user, then dispatch.

Designer ∥ ui-ux only after mechanics exist, or the user said there are none.

## 3. Dispatch

One `spawn_subagent` per specialist.

| Field | Value |
|---|---|
| `subagent_type` | `architect` / `game-dev` / `designer` / `ui-ux` / `coder` / `documenter` / `code-review` |
| `description` | `[<type>] <5 words>` |
| `capability_mode` | `read-write` except `coder` and `code-review` → `all` |
| `isolation` | `none` |

Prompt:

```
Task: <exact request for this specialist>

Read first:
- docs/agents/<type>.md
- docs/canon.md
- <docs the previous specialist just wrote>

Write immediately where docs/agents/<type>.md allows.
When those files exist, stop. Final message: paths only.
No handoff block. No chat contract. No code comments.
If unspecified: one-line question, then stop.
Do not spawn confirm-only children.
```

Code-review: unique `docs/.review-<id>.md`. No source edits. Delete that file after a clean run.

## 4. Gate

After each child:

- Allowed `.md` / src / svg missing, or invented scope, or a fallback → reject. Re-ask or re-spawn. Do not silently repair.
- One-line question → ask the user. Do not answer for them.
- Then spawn the next.

## 5. Stop

List artifact paths. Do not commit. Do not push. Do not pick a renderer.
