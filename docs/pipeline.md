# Pipeline

Orchestrator dispatches. Children cannot spawn children.

Skill: `/game-pipeline`.

## Slice

Minimum set:

| Request | Who |
|---|---|
| Module / type / boundary | [[agents/architect]] |
| Rules / state / game object API | [[agents/game-dev]] |
| SVG / visual identity | [[agents/designer]] |
| Layout / HUD / interaction | [[agents/ui-ux]] |
| Implementation | [[agents/coder]] |
| Vault hygiene | [[agents/documenter]] |
| Quality gate | [[agents/code-review]] |
| Feature / vertical slice | architect → game-dev → designer ∥ ui-ux → coder → documenter → code-review |

Designer ∥ ui-ux only after mechanics exist, or the user said there are none.

Unspecified → orchestrator asks, stops. See [[canon]].

## Write, do not hand off

Specialists write their allowed `.md` (and assets/src if allowed) **immediately**.

No Intent / Assumptions / Artifacts / Open questions / Handoff block. Next agent reads the notes, not chat.

If blocked: one-line question, then **stop**. Do not keep reading.

Done: allowed files written → stop. Final chat line is paths only.

There is no handoff block. `.grok/agents/*` must not ask for one. Confirm-only / “write nothing if complete” tasks are forbidden — the child has no exit.

Invented scope or a just-in-case fallback is a failed run. Reject. Do not silently repair.

## Spawn

- `subagent_type` = agent file name
- `description` prefixed `[architect]`, `[coder]`, …
- Prompt: task, files to read, write the contract `.md` now, no handoff, ask if unspecified
- Capability: architect / game-dev / designer / ui-ux / documenter → `read-write`. Coder → `all`. Code-review → `all` (review file only)
