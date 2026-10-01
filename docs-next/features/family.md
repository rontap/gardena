# Family

Code: `SKILLS`, `betterGain`, `seedBankQuality`, `jamRotMul` in `defs/skills.ts`, `sim/family.ts` (picking, known and open), `skillTier` and `hasSkill` on `World`, `ui/family.tsx` and `ui/tree-panel.tsx` (the panel); each effect is applied where its feature is computed; see [[code-map]].
Unlocked: from the start. Some skills also need a research row.

## Purpose

The family is the farm's skill tree. Odd ended days earn a skill point, and points buy lasting bonuses: the gardener walks faster and grows better crops, the husband runs machines faster and gets land and vehicles further, the daughter sells for more and gets more contracts. Ranks cost more points each, so the player spreads points or specialises. Skills never unlock content; research and contracts do that.

## Rules

### Points

`World.points` is one bank for the whole farm. It grows by `pointsForEndedDay`: `POINTS_PER_DAY` at the end of an odd day (ended days 1, 3, 5, …) and 0 at the end of an even day ([[features/weather-day]]). It also grows by `FAMILIARITY_POINT` when a crop's familiarity reaches `familiarityMax` ([[features/machines]]), by skill-point prizes from contracts ([[features/contracts]]), by `SKILL_POINT_LOOT` from an Uncommon burrow ([[features/burrow]]), and by `NECRO_PAGE_POINT` for each Necronomicon page a ritual closes ([[features/necronomicon]]). Rank *n* of any skill costs *n* points.

### The tree

Skills (`SkillId`, `SKILLS`) form three trees, one per family member, each starting at a skill with no parent. A skill has a `parent`, a `maxTier` (1 or 3 ranks), an optional research `gate`, and an `effect`.

```
gardener   boots ─┬─ tending
                  ├─ seed-bank ── better-wheat, better-potato, better-tomato, better-grape, better-raspberry
                  ├─ grafting
                  └─ mycologist
husband    bulk-up ─┬─ machinery ── driving-classes
                    └─ inherit-land
daughter   saleswoman ─┬─ jam
                       ├─ heirloom ── specialty
                       └─ broker ── industrial
```

- **Open**: no parent, or the parent has at least one rank (`skillOpen`).
- **Known**: no parent, or the parent is open (`skillKnown`). A skill that is not known shows as **Unknown**, **You do not know what this does.**
- A known skill whose research gate is not done shows its real name, disabled.

**Get skill** (`pickSkill`, a command) takes the next rank when the skill is known, open, its research is done, it is below `maxTier`, and the bank holds that rank's cost. Only the host picks: a guest's `pickSkill` is dropped ([[systems/net]]). Ranks are never refunded.

### Skills

Percentages add per rank; they do not compound.

| skill | name | ranks | research | effect |
|---|---|---|---|---|
| `boots` | **Boots** | 3 | | walking speed + `WALK_PCT` % per rank |
| `tending` | **Careful tending** | 1 | | **Tend** a growing plant or an out-of-season tree once, for happiness ([[features/plants]], [[features/trees]]) |
| `seed-bank` | **Trusted seed bank** | 1 | | bought seeds come with quality `SEED_BANK_QUALITY` ([[features/inventory]]) |
| `better-{crop}` | **Experienced {crop} grower** | 1 | `unlock-crop-variants` (wheat, potato), `unlock-advanced-plants` (tomato, grape), `unlock-raspberry` | that crop ripens with up to `BETTER_QUALITY` more quality, scaled by happiness (`betterGain`), and a higher chance of the next variety (`EXPERIENCED_VAR_BONUS`) ([[features/plants]]) |
| `grafting` | **Tree Grafting** | 1 | | chopping a tree also drops `CHOP_GRAFTS` grafts of its species and variety ([[features/trees]]) |
| `mycologist` | **Mycologist** | 3 | | each grown tree's mushroom chance + `MUSHROOM_MYCOLOGIST` per rank, before the happiness factor ([[features/mushrooms]]); each chunk's daily burrow chance + `BURROW_DAY_MYCOLOGIST` per rank ([[features/burrow]]) |
| `bulk-up` | **Bulk up** | 3 | | hand and slot stack limits + `BULK_UP_STEP` raw, + `BULK_UP_CRAFTED_STEP` processed, per rank ([[features/inventory]]) |
| `machinery` | **Machinery** | 3 | `unlock-grinder` | machines that run on time work + `MACHINE_PCT` % faster per rank (`machineMul`, [[features/machines]]) |
| `driving-classes` | **Driving classes** | 3 | `unlock-vehicles` | vehicles + `DRIVE_PCT` % top speed and acceleration, − 5% fuel use per rank ([[features/vehicles]]) |
| `inherit-land` | **Inherit land** | 3 | `unlock-expand` | one expansion permit per rank ([[features/expansion]]) |
| `saleswoman` | **Saleswoman** | 3 | | every Market sale + `SALE_PCT` % per rank ([[features/market]]) |
| `jam` | **Still good for jam** | 3 | | fruit below `JAM_ROT_FRESH` freshness, on the plant or held, loses freshness `JAM_ROT` × rank slower |
| `heirloom` | **Őstermelő** | 3 | `unlock-heirloom` | Heirloom fruit, spirits and wine sell + `HEIRLOOM_PCT` % per rank |
| `specialty` | **Specialty Maker** | 3 | `unlock-preservatives` | Named and Heirloom jam, spirits, wine and cider sell + `SPECIALTY_PCT` % per rank |
| `broker` | **Broker** | 3 | `unlock-contracts` | one more contract offer and one more running contract per rank ([[features/contracts]]) |
| `industrial` | **Industrial farmer** | 3 | `unlock-contracts` | money contracts pay + `INDUSTRIAL_PCT` % per rank |

### Standing

The panel's header shows one bar that belongs to the farm, not to a skill: **Reputation** (from contracts, [[features/contracts]]).

## Screen

- **Family** on the left rail opens the tree panel (`TreePanel`, shared with Research): one chart per family member, each skill a card with its name, rank and next rank's cost (**{n} points**); hovering shows its description for the next rank (`skillBlurb`).
- The selected card's detail says why it cannot be taken: **Needs {names} first.** (the research gate, else the parent skill), **Needs {n} points.**, **Done** at the last rank; a guest sees **Only the host can choose a skill.**
- Footer: the bank, **{n} point to spend** / **points to spend**.
- Command Center: a row while points are unspent; clicking it opens Family.

## Guest

A guest can open the panel but not pick: skills are the host's choice.

## Save and sync

Saved: `family.owned` (skill and rank) and `points`. Skill `Modifier`s are rebuilt on load (`rebuildSkillModifiers`). The digest carries `owned` and `points`.

## Art

Skill icons `src/assets/skills/skill-{id}.svg`, one per skill for every rank; `skill-point.svg`, `skill-unknown.svg`, `skill-locked.svg`; standing icon `stat-reputation.svg` ([[art/svg]]). `skill-mycologist.svg` is a Fly agaric with a Truffle at its foot.

## Invariants

| id | rule | test |
|---|---|---|
| `family.pick` | rank *n* costs *n* points; a pick needs known, open, research done, below `maxTier`; only the host picks | `family.test.ts` |
| `family.cost` | an odd ended day grants `POINTS_PER_DAY`; an even ended day grants 0; ended days 1 through 80 grant 40 | `day.test.ts` |
| `family.jam-rot` | `jam` slows the loss of freshness below `JAM_ROT_FRESH` by `JAM_ROT` × rank | `family.test.ts` |
| `family.grafting` | chopping drops `CHOP_GRAFTS` grafts only with `grafting`; wood always | `family.test.ts` |
| `family.specialty` | `specialty` raises Named and Heirloom jam, spirit, wine and cider | `family.test.ts` |
| `family.mycologist` | `mycologist` is one skill with three ranks under `boots`, no research; its description names the Rain mushroom chance at half happiness and both daily burrow chances for that rank | `skills.test.ts` |
| `family.better-set` | `better-*` exists for potato, wheat, tomato, raspberry and grape only | `skills.test.ts` |

## When you change this

- A new skill: a `SkillId`, a `SKILLS` row with its parent and gate, a `SkillEffect` arm read where the feature computes, name and description in `skills.json` with numbers passed in, and an icon. The tree places it from `parent`.
- A skill that changes a crop's stats: push a `Modifier` from `pickSkillBody` and rebuild it in `rebuildSkillModifiers`, or saved games lose it on load.
- A research row that gates a skill: the gate is on the skill (`gate`), and the Research tree lists it automatically ([[features/research]]).

## Decisions

- One bank of points and one set of owned skills for the whole farm; no member owns a skill. The three members only group the tree.
