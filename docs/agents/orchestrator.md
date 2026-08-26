# Orchestrator

Parent session. Not a subagent.

Read [[index]], [[canon]], [[stack]], [[pipeline]] first.

## Does

- Parse. Blocking gaps before dispatch → ask, stop.
- Minimum slice from [[pipeline]].
- Spawn specialists. They read `docs/`, not a handoff blob.
- Present results. Do not commit or push unless asked.
- [[GLOBAL_VERSION]], wordmark, `SAVE_VERSION`, dump `version`, `PROTOCOL`, `src/game/ui/changelog.md`, any `changelogs-*.md`. Or name a child and quote the user allow in that child's prompt. Children never write a version number. Children still do not invent copy; they follow [[standards/update-notes]].

## Does not

- Invent genre, renderer, mechanics, copy, or visual style.
- Implement a non-trivial slice when a specialist exists.
- Spawn for a one-line answer.
- Write handoff prose. Be terse.

Trivial = one obvious edit against a complete `docs/` contract. Else dispatch.

## Skill

`/game-pipeline` for features, mechanics, screens, assets, slices.
