# Family

Left [[ui/docks]] `Dock`, same shell as Research: `w-[28rem]`, `absolute top-20 left-32 z-20`. Title **Family**. No overlay. No dim. No auto-pause. [[mechanics/family]]. Art [[art/skills]]. Type [[ui/type]].

HUD **Family** toggles it. × closes. Esc closes. Selected on the ribbon while open.

Guest: dock opens. Cards not clickable. Why: **Only the host can choose a skill.** [[ui/multiplayer]] [[mechanics/multiplayer]] `mp.guest`

## Standing

Above the card grid, `grid-cols-2`. Two read-only stats the whole farm carries: **Reputation** and **Luck**.

Each is `bg-ink/6 px-2 py-1.5`: `h-5 w-5` icon, name in `text-sm` semibold, then a bar `bg-ripe` on the right. The face carries no digits. Hover puts the exact number in the [[ui/callout-hover]] `aside`, as the `why` line in bold `roof` under the description — the same slot a blocked card uses.

| stat | value | bar | callout |
|---|---|---|---|
| Reputation | `world.contracts.rep`, rounded to one decimal | `rep / REP_MAX` | what companies think of the farm, what raises and lowers it, and that a higher one puts harder, better-paying contracts on tomorrow's board. **Your Reputation is {n} out of {max}.** |
| Luck | `luckOf(world)` | `luck / SKILLS.lucky.maxTier` | what a new burrow's treasure holds and how often it holds an unsold Variety, that each rank of Lucky raises both, and that a burrow already placed does not change. **Your Luck is {n} out of {max}.** |

Luck is scored against `SKILLS.lucky.maxTier`, not `LUCK_CAP`. [[mechanics/burrow]] [[mechanics/contracts]]

Icons `stat-reputation.svg` and `stat-luck.svg` — [[art/skills]]. A drawn five-point star and a drawn four-leaf clover, not a glyph inside a badge. Both bands show for a guest, and before **Contracts** is researched: the callout is where a player learns the number exists.

**Footer.** `skill-point` + `{n} point(s) to spend`. Same footer slot Research uses for the running job.

## Grid

Every `SKILLS` id is a card. Same anatomy as [[ui/docks]] Research: icon `h-10` over name `text-sm` `line-clamp-2 min-h-8` over meta, 2-col, `auto-rows-[8.5rem]`. Faces: done `bg-leaf/20` and **Done**, pickable `bg-dirt`, gated or research-locked or cannot afford `bg-ink/6`, mystery as below.

Mystery (not `skillKnown`): `skill-unknown` icon, unknown name **Unknown**, unknown description **You do not know what this does.** Disabled. No rank. No cost.

Known: icon `skill-{id}` except `better-{crop}` — `fruitInner(crop)` under `skill-better`. `grafting` → `skill-grafting`. `specialty` → `skill-specialty`. `lucky` → `skill-lucky`. Name `SKILLS[id].name` + roman of next rank when `maxTier > 1` and not done (`I`–`III`). Meta: next rank costs n points. At max, **Done**.

Known and research-locked: real name, real icon, disabled. `why` names the research.

Click `pickSkill(id)` iff known, open, research gate met, `points >=` next rank cost, `world.local === 0`. Else disabled. Guest: never.

Hover: [[ui/callout-hover]] to the right of the dock, `Dock` `aside`. Known title `SKILLS[id].name`, description `skillBlurb(id, tier)` at next rank (owned rank when done). Mystery title and body are the unknown slots.

## Blurb

`SKILLS[id].blurb` is the player sentence. Catalog voice. `skillBlurb` swaps jam for the rank’s slower rot, seed-bank for the rank’s seed pack percents, and specialty / heirloom / boots / broker for that rank’s numbers. Names and blurbs stay in `SKILLS`; this note does not invent them. `grafting` name **Tree Grafting**. `specialty` name **Specialty Maker**. `SKILLS.tending` blurb names plants and off-season trees. `SKILLS.lucky` name **Lucky**. `lucky` icon `skill-lucky`.
