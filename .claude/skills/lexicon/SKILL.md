---
name: lexicon
description: >
  Use in this repo whenever writing text a person reads — player copy, UI
  strings, almanac and shop descriptions, changelog lines, docs, invariants,
  plans, reviews, commit messages, chat replies, subagent prompts. Binds every
  game word to the note that owns it, translates vault shorthand into player
  words, and blocks coined or borrowed vocabulary. Does not govern identifiers
  inside `src/`. Read before the first sentence, not after.
---

# Lexicon

Law is [[standards/lexicon]]. Read it. This is the gate.

## Bound

| bound | free |
|---|---|
| text to the user, player copy, every `docs/**/*.md`, commit / PR / review text | identifiers and locals in `src/` |

Vault notes stay the vault term. Player copy: [[agents/game-text-writer]] pastes **say** from `docs/standards/user-facing-text.md`.

Name a variable what you like. Backticked in bound text, that name is a citation; bare, it is a coinage.

## Register

| audience | register |
|---|---|
| vault notes, commits, reviews | the vault term, exact; identifiers backticked |
| chat with the developer, update notes, HUD, player copy | **say** column; `game-text-writer` owns new strings |

Both forbid coining. The player register additionally forbids the vault's own compressions: `net` is a **water network**, `high` is a **signal**, `blurb` is a **description**.

## Check a word

```bash
grep -rniE "\b<word>" docs/ src/game --include=*.md --include=*.ts --include=*.tsx | head
```

| result | verdict |
|---|---|
| the owning note defines it, same mechanic | developer text: use it. Player text: translate it |
| defined on another mechanic's note | borrowed — use that domain's own word |
| only in `src/` | identifier — backtick it, never prose, never player copy |
| nothing | coined — cut it. State the rule in plain words |

## Check player copy

Read the string back as someone who has played once. Then:

| fault | shipped | fix |
|---|---|---|
| unqualified comparison | "works the same, but the soil stops being organic" | name the other side: cheaper and more efficient **than organic fertilizer** |
| code's view, not the player's | "stops being organic" | "fruit grown in that soil is not organic, and sells for less" |
| property with no owner | synthetic fertilizer, described without soil | say the **soil** carries it, and the fruit after |
| no reason to want it | "Unlocks Pipe and Tap in the general store." | what it saves: a tap near the beds instead of the walk back to the pump |
| wrong verb for the view | sprinkler "waters around a corner" | it waters a 4×4 **area** |
| slang, or stale gating | grape: "A mid fruit… the path to one." | one true, distinctive line about grapes |
| the tuning table, printed | "2 days at ×3.5, then ×0.75" | name the concept first — trees fruit in **seasons** |
| typed list of what data owns | "jam, wine, spirit, oil, flour, extract" | "anything you make in a machine", or compose from the id list |
| defining a state by the others | "Crops, weeds, and water behave as usual." | what a calm day itself does |
| dragged-in concept | tending, inside a tree's description | cut it — it belongs to its own subject |

Numbers arrive through `fill` from `src/game/defs/`. Never digits.

One word used across a whole shelf moves as a set. Propose it; do not fix one string of fifteen.

## Dispatch

`game-text-writer` prompt carries `docs/standards/user-facing-text.md`. Vault writers follow this file.

A coined or borrowed word in a note, in copy, or in the reply is a failed run. Reject on the word, name it, re-spawn. Identifiers are not reviewed for it.
