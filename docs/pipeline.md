# Pipeline

Orchestrator dispatches. Children cannot spawn children.

Skill: `/game-pipeline`.

## Slice

Minimum set:

| Request | Who |
|---|---|
| Module / type / rules / state / game object API | [[agents/architect]] |
| SVG / visual identity | [[agents/designer]] |
| Layout / HUD / interaction | [[agents/ui-ux]] |
| Implementation | [[agents/coder]] |
| Vault hygiene | [[agents/documenter]] |
| Quality gate | [[agents/code-review]] |
| Feature / vertical slice | architect → designer ∥ ui-ux → coder → documenter → code-review |

Designer ∥ ui-ux only after mechanics exist, or the user said there are none.

Blocking gaps before dispatch → orchestrator asks, stops. See [[canon]].

## Write, do not hand off

Specialists write their allowed `.md` (and assets/src if allowed) **immediately**.

No Intent / Assumptions / Artifacts / Open questions / Handoff block. Next agent reads the notes, not chat.

Halt only before any write, and only if the task as given is blocked: one-line question, then **stop**. After a write, or a gap found only while reading: one-line assumption in the note, finish. Do not keep reading in order to halt.

Done: allowed files written → stop. Final chat line is paths only.

There is no handoff block. `.grok/agents/*` must not ask for one. Confirm-only / “write nothing if complete” tasks are forbidden — the child has no exit.

Invented scope or a just-in-case fallback is a failed run. Reject. Do not silently repair.

## Spawn

- `subagent_type` = agent file name
- `description` prefixed `[architect]`, `[coder]`, …
- Prompt: task, files to read, write the contract `.md` now, no handoff. Halt: [[canon]]
- Capability: architect / designer / ui-ux / documenter → `read-write`. Coder → `all`. Code-review → `all` (review file only)
