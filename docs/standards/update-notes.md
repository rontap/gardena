# Update notes

Player changelog authorship. Not developer history. Do not invent wording here.

## Source

`src/game/ui/changelog.md` is the only player copy. Manual edits only. Never generate it from code, git, defs, or a TS dump. Parser reads; nothing writes it from code.

Newest release on top. File dialect: [[architecture/changelog]] / [[ui/changelog]].

Working notes do not carry history. The only history is this player file.

## Line

Top-level: `- {emoji}? {text}`. Kind emoji optional. Missing → `improvement`. Nested `- {note}` at two spaces under any kind. File dialect: [[architecture/changelog]].

Subject names: [[standards/user-facing-text]]. Display-level only. Never `gate`, protocol, save version, research ids, breakpoints, implementation.

No required verb, type token, colon, or previously/now frame. Parser does not throw on wording.

## Who

Orchestrator owns [[GLOBAL_VERSION]], wordmark, `GAME_VERSION`, and `src/game/ui/changelog.md`. [[agents/game-text-writer]] drafts the lines; orchestrator pastes. [[pipeline]] [[agents/orchestrator]]
