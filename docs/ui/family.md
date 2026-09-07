# Family

Centered overlay like [[ui/market]] / [[ui/almanac]]. Dim `absolute inset-0` `bg-ink/50`. Content centered `w-[58rem]`, `max-h-[calc(100%-4rem)]`, height from content. Title **Family**. [[mechanics/family]]. Art [[art/skills]]. Type [[ui/type]].

Above the cards: the points band, then the standing band. Then three **cards**, not three loose columns — `grid-cols-3 gap-3`, each card `bg-ink/6` so the three members read as separate people. Every band inside a card is full-bleed; nothing floats.

HUD **Family** toggles it. × closes. Esc closes. Backdrop pointer-down on the dim closes. Selected on the ribbon while open.

Solo (`role === 'off'`): open pauses the sim clock. Close restores the previous pause state unless the player had already paused. Host / guest: no auto-pause. [[ui/hud]]

Guest: overlay opens. Offers not clickable. [[ui/multiplayer]]

## Standing

`grid-cols-2 gap-3`, between the points band and the three cards. Two read-only stats the whole farm carries, not a member's: **Reputation** and **Luck**. They sit here because Family is where the farm's own numbers are read, and neither belongs to one member — Reputation is earned by finishing contracts, Luck by a skill the player learns.

Each is `bg-ink/6 px-3 py-2`: `h-5 w-5` icon, name in `text-sm` semibold, then a `w-24` `Bar` `bg-ripe` on the right. The face carries no digits. Hover puts the exact number in the [[ui/callout-hover]] `aside`, as the `why` line in bold `roof` under the description — the same slot an offer's blocked reason uses.

| stat | value | bar | callout |
|---|---|---|---|
| Reputation | `world.contracts.rep`, rounded to one decimal | `rep / REP_MAX` | what companies think of the farm, what raises and lowers it, and that a higher one puts harder, better-paying contracts on tomorrow's board. **Your Reputation is {n} out of {max}.** |
| Luck | `luckOf(world)` | `luck / SKILLS.lucky.maxTier` | what a new burrow's treasure holds and how often it holds an unsold Variety, that each rank of Lucky raises both, and that a burrow already placed does not change. **Your Luck is {n} out of {max}.** |

Luck is scored against `SKILLS.lucky.maxTier`, not `LUCK_CAP`: three ranks is what the player can actually reach, and a bar that can never pass a third of the way is a lie. [[mechanics/burrow]] [[mechanics/contracts]]

Icons `stat-reputation.svg` and `stat-luck.svg` — [[art/skills]]. A drawn five-point star and a drawn four-leaf clover, not a glyph inside a badge: these two are the farm's own standing, not another skill chip, and the badge form would have read as one. Both bands show for a guest, and before **Contracts** is researched: the callout is where a player learns the number exists.

## Cards

Left → right `player` `husband` `daughter`. Each card, top → bottom:

1. **Header** `bg-ink/10`. Portrait `portrait-{member}.svg` (viewBox `0 0 64 96`) at `h-20 w-[3.334rem]` — hold 2:3, do not stretch — on an `bg-ink/15` plate, beside the text block: name **You** / **Husband** / **Daughter** in `font-display` `text-xs`, role **Gardener** / **Research** / **Market** under it, then a one-line `BLURBS` sentence saying what this member actually governs.
2. `Label` **Choose one**, or **Nothing left to learn** when there are no offers.
3. Three offer slots, fixed `h-11`. An absent offer is an empty `bg-ink/5` slot of the same height — the three cards keep the same rhythm.
4. `Label` **Learned**, then a `min-h-9` `bg-ink/5` tray: chips, or **None yet**.

**Points band.** `skill-point` + `{n} point(s) to spend`. `bg-ripe/25` when `points > 0`, plain and dimmed at zero. Full width above all three cards, over the standing band. It is the call to action, and the only warm colour on the screen.

Roles and blurbs are the only place the UI says what a member is for. Keep them one line.

## Offers

The slot is the button: `h-11`, icon `h-6 w-6`, then `SKILLS[id].name` + roman tier (`I`–`V` = offered `tier` 1–5), truncating. maxTier 3 (`bio` `jam` `industrial` `driving-classes` `haggling` `machinery` `lucky`) only reach **III**. Labels share one left edge. `bg-dirt` when the member has a point, `bg-ink/8 text-ink/45` when not.

Icon: `skill-{id}` except `better-{crop}` — `fruitInner(crop)` under `skill-better`. Player `driving-classes` → `skill-driving-classes`. Player `lucky` → `skill-lucky`. Husband `haggling` → `skill-contracts`.

Live lists. Not `bulk-buying` `tool-contracts` `machine-contracts`. Player includes `driving-classes` `lucky`. Husband: `machinery` `forecast`. `haggling` is `hidden` — not offered, still in `SKILLS`. `forecast` is live — HUD tomorrow iff owned. [[mechanics/weather]] No luck HUD chip; Luck is read on the standing band.

Click `pickSkill(member, slot)` iff that member’s `points > 0`. Else disabled. `forecast` picking still spends the point. Blurb: Tomorrow's weather appears next to today on the top bar, so you can plan irrigation, the stall, and pump spend before morning.

Hover (offers and learned): [[ui/callout-hover]] to the right of the Family window. Title `SKILLS[id].name`, description `skillBlurb(id, tier)`.

## Owned

Chip: `bg-ink/10`, `h-7`, icon `h-5 w-5` + roman tier when `SKILLS[id].maxTier > 1`. Same callout. Tier is the owned rank. Jam blurb uses that rank’s cap. Seed-bank blurb uses that rank’s seed pack percents.

## Blurb

`SKILLS[id].blurb` is the player sentence. Catalog voice. `skillBlurb` swaps jam for the rank’s slower rot, and seed-bank for “there is some chance… (n% uncommon, n% rare, n% heirloom)”. Jam `JAM_ROT` 15% per rank below half freshness. Better-{crop} names the 4% sale and “increased chance that a happy plant will produce a superior fruit” — not the 4%. Carrot / potato / wheat: **Experienced {crop} grower**.

`SKILLS.tending` blurb names plants and off-season trees. `SKILLS.clearance` blurb: rotten produce sells for $1 apiece. `SKILLS.lucky` name **Lucky**. Blurb: A burrow that appears after you learn Lucky holds more money in treasure than a burrow that appeared without Lucky, and more often holds a seed or tree seed of a Variety no shelf sells as a pack. Each rank raises both. Burrows already on the farm do not change.

Assumption: names and blurbs stay in `SKILLS`; this note does not invent them. Live offer pools drop `bulk-buying` `tool-contracts` `machine-contracts`. `industrial` and `forecast` are live, not dummy. Forecast blurb locked on [[mechanics/weather]]. `lucky` icon `skill-lucky`.
