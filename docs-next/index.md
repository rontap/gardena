# Gardena docs

Start here. Find the task type, read the pages it lists, then grep the code using [[code-map]].

## How these pages are written

- **Never write about the starting kit**: what a new game puts in the inventory at the house or in the Seed silo (`STARTER_SEEDS`, `STARTER_FRUIT`, `STARTER_TREE_GRAFTS`, `STARTER_VARIETY_PACKS`, the items in `soloSeat`). No page lists it, names it as a source of an item, or refers to it.

- The code is the truth. A page states what `src/`, `src/game/defs/` and `messages/en/` do now.
- A page describes the current game only. Git versions the pages: a page states what the game does, and leaves out what it used to do, what it lacks, leftovers in the code, and bugs. Findings go to the developer in chat.
- The old `docs/` is used only for what code cannot show: why a rule exists, architectural decisions, invariants.
- Pages name identifiers, constants and string keys. They do not cite line numbers or restate code; [[code-map]] says where to look.
- Constants by name, never their digits.
- Prose by default. A table only where rows share columns.
- ASCII diagrams where a layout, a range or a flow is easier to read as a picture: tile layouts, number ranges, call order.
- Prose uses the words in [[name-map]]. Code identifiers appear only in backticks.

## Pages

- [[game]] — what the game is, the loop, the pillars.
- [[definitions]] — every major concept, one row each.
- [[code-map]] — the folder and file for each part of the code.
- [[items/_index|items]] — one page per crop, building, product and other item.
- [[features/_index|features]] — one page per player-facing feature.
- [[systems/_index|systems]] — one page per shared or engine system.
- [[shell]] — the screen around the farm.
- [[name-map]] — the words to use, and the words to replace.
- [[howto/_index|howto]] — checklists for recurring tasks.
- [[process/_index|process]] — how agents work and write.

## Where to start by task

| task | read first | then |
|---|---|---|
| new mechanic | [[game]], [[definitions]] | nearest feature pages; [[systems/world]], [[systems/save]], [[systems/net]] |
| new building or machine | [[howto/add-building]] | [[systems/building-io]], [[features/machines]] |
| new crop or variety | [[howto/add-crop]] | [[features/plants]] |
| UI pass | [[shell]], [[name-map]] | feature pages whose **Screen** changes |
| shared system overhaul | the system page | every page in its **Used by** list |
| engine change | [[systems/_index]] | pages that link to the changed system |
| art | [[howto/add-art]] | [[systems/view]] |
| player text | [[howto/add-player-text]], [[name-map]] | owning feature page |
