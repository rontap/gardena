# Update notes

Applies to: the orchestrator pasting the player changelog, and game-text-writer drafting the lines ([[process/agents]]).

Player changelog authorship. Not developer history. Do not invent wording here.

## Source

`src/game/ui/changelog.md` is the only player copy. Manual edits only. Never generate it from code, git, defs, or a TS dump. Parser reads; nothing writes it from code.

Newest release on top.

Working notes do not carry history. The only history is this player file.

## Line

Top-level: `- {emoji}? {text}`. Kind emoji optional. Missing → `improvement`. Nested `- {note}` at two spaces under any kind.

Subject names: [[process/user-facing-text]]. Display-level only. Never `gate`, protocol, save version, research ids, breakpoints, implementation.

No required verb, type token, colon, or previously/now frame. Parser does not throw on wording.

## Who

Orchestrator owns [[process/versions]], wordmark, `GAME_VERSION`, and `src/game/ui/changelog.md`. game-text-writer drafts the lines; orchestrator pastes. [[process/agents]]
