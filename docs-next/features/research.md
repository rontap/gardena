# Research

Code: `RESEARCH` and `SKUS` in `defs/research.ts`, `startResearchBody`, `researchOpen`, `researchKnown`, `skuOpen`, `skuShown` on `World`, `tickJob` in `tick.ts`, `ui/research.tsx` and `ui/tree-panel.tsx` (the tree), `ui/techtree.ts` (what each row unlocks); see [[code-map]].
Unlocked: from the start.

## Purpose

Research is how the farm grows past carrots, potatoes and a bucket. The husband runs one project at a time for money and time; each finished row makes new crops, tools, buildings or features available. Rows form three trees, so the player chooses what to open next: more crops and tools, water and automation, or processing and land.

## Rules

### Rows

A row (`ResearchDef`) has a `cost`, a duration in `seconds`, one `parent` (or none), a `path` (the first row of its tree), an `effect`, and `grants`: the player-facing list of what it turns on that no shop item shows.

The three trees start with the rows that have no parent: `unlock-multi-crop`, `unlock-irrigation` and `unlock-grinder`.

```
unlock-multi-crop ─┬─ unlock-better-tools ── unlock-hardened-tools
                   ├─ unlock-advanced-plants ── unlock-raspberry
                   └─ unlock-crop-variants ── unlock-heirloom

unlock-irrigation ─┬─ unlock-auto-irrigation ─┬─ unlock-adv-irrigation
                   │                          └─ unlock-water-storage
                   ├─ unlock-vehicles ── unlock-silos ── unlock-dispatch
                   └─ unlock-sensors ── unlock-advanced-sensors ── unlock-smart-irrigation

unlock-grinder ────┬─ unlock-preservatives ─┬─ unlock-fermentation ── unlock-infusion
                   │                        └─ unlock-furnace
                   ├─ unlock-contracts
                   ├─ unlock-landscaping ─┬─ unlock-expand ─┬─ expand-land
                   │                      │                 └─ eminent-domain
                   │                      └─ unlock-weather-station
                   └─ unlock-necronomicon
```

Cost and seconds are on each `RESEARCH` entry.

### Known, open, done

- **Open**: the row has no parent, or its parent is done (`researchOpen`). Only an open row can be started.
- **Known**: the row has no parent, or its parent is open (`researchKnown`). A row that is not known still shows in the tree as **Unknown**, **You do not know what this does.**, with no cost or time.
- `unlock-necronomicon` is the exception: it is open, and known, only after grandma has told her story (`World.grandma` is `told`) and `unlock-grinder` is done ([[features/necronomicon]]).

### Running a project

**Start** (`startResearch`, a command) is refused while a project runs, for a done row, for a row that is not open, or without the money. Otherwise the cost is paid at once and `World.job` counts the row's seconds down in game time ([[systems/tick]]). When it reaches 0 the row is added to `done` and to the day's tally, and appears in the end-of-day summary ([[features/weather-day]]). There is no cancelling.

### What a row unlocks

A row unlocks in three ways, and the tree lists all three under the row (`buildTree`):

1. **Shop items.** Every shop item (`Sku`) names the row that makes it buyable (`unlock`) and the row that makes it visible (`show`), or `start` for either. Some also need one of a list of rows (`need`). `skuOpen` is buyable, `skuShown` visible; a visible item that is not buyable is drawn locked with the research it needs.
2. **Skills.** A skill whose gate is a research row can be picked only after that row ([[features/family]]).
3. **Features**: effects that are not an item, listed in `grants`, read by the code as `done.has(row)`.

| row | shop items it makes buyable | also turns on |
|---|---|---|
| `unlock-multi-crop` | Wheat seeds | |
| `unlock-better-tools` | Pickaxe, Axe, Large bucket, Weed spray | |
| `unlock-hardened-tools` | Better shovel, Hardened pickaxe, Chainsaw | |
| `unlock-advanced-plants` | Tomato and Grape seeds | |
| `unlock-raspberry` | Raspberry seeds | |
| `unlock-crop-variants` | Crop Variety Station, Variety sorter, Variety sensor | |
| `unlock-heirloom` | | |
| `unlock-irrigation` | Pipe, Tap | |
| `unlock-auto-irrigation` | Sprinkler, Valve, Water sensor | **Water need** view |
| `unlock-adv-irrigation` | Vertical and Large sprinklers | |
| `unlock-water-storage` | Pumpjack, Well | |
| `unlock-vehicles` | Vehicle hangar | Quad, Tractor and trailers in the hangar; **Vehicle interactions** view |
| `unlock-silos` | the three field silos | |
| `unlock-dispatch` | Traffic light, Refueling station, Vehicle dispatcher | routes and **Automate** ([[features/vehicles]]) |
| `unlock-sensors` | Lever, Button, Lamp, fertilizer and harvest sensors, Vehicle detector (also needs `unlock-vehicles`) | the **Sensors** view |
| `unlock-advanced-sensors` | Logic gate, NOT gate, Pulser, Counter | |
| `unlock-smart-irrigation` | Day sensor, Weather sensor | sprinkler output and signal inputs on sprinklers and valves ([[features/water]]) |
| `unlock-grinder` | Mill, Grinder | |
| `unlock-preservatives` | Jam machine, Freezer, sugar | jam in the almanac |
| `unlock-fermentation` | Pot still, Barrel, Sugar cane seeds | dropping off Rotten produce at the Market |
| `unlock-infusion` | Infuser, Chilli seeds | |
| `unlock-furnace` | Furnace | |
| `unlock-contracts` | | the contract board, and reputation loss on a day with no contract taken ([[features/contracts]]) |
| `unlock-landscaping` | the four pavings, Fence, Grass seeds | |
| `unlock-expand` | | buying land, one expansion permit, **Land quality** view ([[features/expansion]]) |
| `expand-land`, `eminent-domain` | | one expansion permit each |
| `unlock-weather-station` | | tomorrow's weather on the top rail ([[features/weather-day]]) |
| `unlock-necronomicon` | the Necronomicon | |

Carrot and Potato seeds, Shovel, Bucket, fertilizer, Chest and Compost box are buyable from the start. The skills each row unlocks are listed on [[features/family]].

## Screen

- **Research** on the left rail opens the tree panel (`TreePanel`, shared with Family): one chart per tree, drawn left to right with Mermaid, each row a card with its name, cost and time, and under it what it unlocks (**Unlocks**, **Unlocks Skills**, **Unlocks Research**).
- A card that cannot be started says why: **Already researched.**, **Running now.**, **Another project is running. One at a time.**, **Needs {names} first.**, **Not enough money.**
- Footer: **{name} · {secs}s left** while a project runs, else **One project at a time. It runs while you garden.**
- Command Center: the running project with a bar, and **research completed** when it finishes; Build cards for locked items say **Needs the {name} research**.

## Guest

A guest can start research. The project and its progress are the farm's, shared by every player.

## Save and sync

Saved: `done` and `job` (the row and seconds left). The digest carries `done` and `job`.

## Art

Each row's card face is chosen in `researchInner` (`view/svgs.ts`), mostly the art of what the row unlocks; unknown rows show `skill-unknown.svg` ([[art/svg]]).

## Invariants

| id | rule | test |
|---|---|---|
| `research.job` | one project at a time; paid at the start | `research.test.ts` |
| `research.start` | the three trees start at `unlock-multi-crop`, `unlock-irrigation`, `unlock-grinder`; Wheat is not buyable from the start | `research.test.ts` |
| `research.reveal` | known is parent null or parent open; open is parent null or parent done; `unlock-necronomicon` waits for grandma's story | `research.test.ts` |
| `research.dispatch` | routes do nothing before `unlock-dispatch` | `research.test.ts` |
| `research.techtree` | the tree lists every shop item and skill a row unlocks, except `buy-or`, `buy-and` and `buy-water-system` | `research.test.ts`, `techtree.test.ts` |

## When you change this

- A new row: a `ResearchId`, its `RESEARCH` entry with one `parent`, its name and description in `research.json`, and the shop items that name it. The tree places it from `parent`; no layout to edit.
- A feature behind a row: read `done.has(row)` where the feature acts, and add a line to `grants` so the tree says so.
- Moving a shop item to another row: change `unlock` and `show` on its `Sku`; its description must not name the row (player copy does not name what unlocks what).
- Research that changes a running system (like `unlock-smart-irrigation` rebuilding wires): hook it in `tickJob` where the row is added to `done`.

## Decisions

- One parent per row: the tree stays a tree the player can read, and a second requirement on one item goes on the item (`Sku.need`), not on the row.
- Rows two steps away are shown as **Unknown**, so the player sees that the tree continues without seeing all of it.
