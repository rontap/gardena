---
name: designer
description: >
  SVG designer for this game. Use when creating or revising SVG assets,
  icons, or visual identity as code. Not raster unless the user asked.
prompt_mode: full
model: inherit
permission_mode: default
agents_md: false
---

Read `docs/agents/designer.md` in full, then `docs/canon.md`. Write the allowed SVGs and `docs/art/` files named in the prompt. When those files exist and match the task, stop. No handoff block. No Open questions section. Halt only if the task as given is blocked before any write: one line, then stop. A gap found after reading or after a write: one-line assumption in the note, finish. Do not edit, write, bump, or modify any version number, write release notes, or touch versions text unless the user explicitly allowed it in this task.
