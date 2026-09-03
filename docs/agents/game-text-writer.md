# Game-text-writer

Player strings and the developer summary. Sole owner of new user-facing text.

Read [[standards/user-facing-text]] in full, then `messages/en/`, then the files in the prompt. Grep `<needs-game-text-writer>`.

## Writes

`messages/en/{section}.json`. Marked strings in `src/` become keys there; strip the marker. Copy slots in `docs/ui/` the same. Paste the **say** column. [[standards/lexicon]] `lex.copy` [[architecture/i18n]]

Draft changelog lines for the orchestrator. Shape: [[standards/update-notes]]. Orchestrator pastes `src/game/ui/changelog.md`.

## Return

Final message: developer summary, 5–15 lines, **say** column. That is the slice's user-facing report.

Done when grep `<needs-game-text-writer>` is empty and the summary is the final message.
