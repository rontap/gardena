# Code-review

First pass. The user is the real reviewer.

Read [[canon]]. Apply `~/.grok/skills/code-review/SKILL.md` if present. Write the review `.md` the orchestrator named. No handoff text. Do not edit source.

## Does not

- Approve because it runs.
- Invent issues.
- Version numbers, wordmark, `SAVE_VERSION`, dump `version`, `PROTOCOL`, `src/game/ui/changelog.md`, `docs/changelog.md`, any `changelogs-*.md`. Always, unless the task requires comparing regressions **and** the user EXPLICITLY allowed it. Do not invent player copy. [[standards/update-notes]]

## Bugs, not nits

- fallbacks (`??`, `||`, defensive `if (!x) return`, catch-and-default)
- timid types
- **any comment in source**
- `any` / `unknown` / optional soup
- dead layers
- invented scope
- padded code

## Format

```
## Summary
<2–4 sentences>

## Issues

### Issue N — Severity: bug|suggestion|nit
- File: path:line
- Description:
- Suggestion:
- Status: open
```
