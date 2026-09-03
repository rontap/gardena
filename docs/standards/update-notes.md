# Update notes

Player changelog authorship. Not developer history. Do not invent wording here.

## Source

`src/game/ui/changelog.md` is the only player copy. Manual edits only. Never generate it from code, git, defs, or a TS dump. Parser reads; nothing writes it from code.

Newest release on top. File dialect: [[architecture/changelog]] / [[ui/changelog]].

Working notes do not carry history. The only history is this player file.

## Line

Top-level line EXACTLY:

`{emoji} {New|Added|Removed|Changed|Fixed bug} {building|item|ui|mechanic|multiplayer} {*}`

One subject per line. Never a list of items then bullets that unpack the list.

Foreach subject: its own `Added {type}: {Name}. {what it does}.`

Subject names and every noun in `{*}`: [[standards/user-facing-text]]. `{what it does}` is a distinctive player-facing difference. Never restate the kind. Illegal: a plant that “you can plant / grow / harvest / sell”; paving that “you can pave”; a tree whose only line is “fruit drops” copied onto every species; a house that “stands on the farm.” If several subjects share one behavior, that behavior is one `mechanic` line. The item line names what makes that subject different. If nothing distinctive exists, fold the name into the mechanic. Do not invent a tautology to fill the slot.

| type | bullets |
|---|---|
| item / building / ui / multiplayer | none |
| mechanic | top-level, keyword `mechanic`; bullets allowed for the concept only |

## Verbs

| verb | shape |
|---|---|
| Added / New | `Added {type}: {Name}. {what it does}.` |
| Changed | `Changed {type}: previously, it {…}, now {…}.` |
| Removed | `Removed {type}: {Name}. {what the player loses}.` |
| Fixed bug | `Fixed bug {type}: {SVO what was wrong and what happens now}.` |

Complete SVO. Terse and well formed. Not fragments.

Display-level only. Never `gate`, protocol, save version, research ids, breakpoints, implementation.

## Who

Orchestrator owns [[GLOBAL_VERSION]], wordmark, `SAVE_VERSION`, dump `version`, `PROTOCOL`, and `src/game/ui/changelog.md`. [[agents/game-text-writer]] drafts the lines; orchestrator pastes. [[pipeline]] [[agents/orchestrator]]
