# Family

Centered overlay like [[ui/market]] / [[ui/almanac]]. Dim `absolute inset-0` `bg-ink/50`. Content centered `w-[58rem]`, `max-h-[calc(100%-4rem)]`, height from content. Title **Family**. [[mechanics/family]]. Art [[art/skills]]. Type [[ui/type]].

Three **cards**, not three loose columns — `grid-cols-3 gap-3`, each card `bg-ink/6` so the three members read as separate people. Every band inside a card is full-bleed; nothing floats.

HUD **Family** toggles it. × closes. Esc closes. Backdrop pointer-down on the dim closes. Selected on the ribbon while open.

Guest: overlay opens. Offers not clickable. [[ui/multiplayer]]

## Cards

Left → right `player` `husband` `daughter`. Each card, top → bottom:

1. **Header** `bg-ink/10`. Portrait `portrait-{member}.svg` (viewBox `0 0 64 96`) at `h-20 w-[3.334rem]` — hold 2:3, do not stretch — on an `bg-ink/15` plate, beside the text block: name **You** / **Husband** / **Daughter** in `font-display` `text-xs`, role **Gardener** / **Research** / **Market** under it, then a one-line `BLURBS` sentence saying what this member actually governs.
2. **Points band.** `skill-point` + `{n} point(s) to spend`. `bg-ripe/25` when `points > 0`, plain and dimmed at zero. The band is the call to action; it is the only warm colour in the card.
3. `Label` **Choose one**, or **Nothing left to learn** when there are no offers.
4. Three offer slots, fixed `h-11`. An absent offer is an empty `bg-ink/5` slot of the same height — the three cards keep the same rhythm.
5. `Label` **Learned**, then a `min-h-9` `bg-ink/5` tray: chips, or **None yet**.

Roles and blurbs are the only place the UI says what a member is for. Keep them one line.

## Offers

The slot is the button: `h-11`, icon `h-6 w-6`, then `SKILLS[id].name` + roman tier (`I`–`V` = offered `tier` 1–5), truncating. maxTier 3 (`bio` `jam` `industrial` `driving-classes` `contracts` `machinery`) only reach **III**. Labels share one left edge. `bg-dirt` when the member has a point, `bg-ink/8 text-ink/45` when not.

Icon: `skill-{id}` except `better-{crop}` — `fruitInner(crop)` under `skill-better`. Player `driving-classes` → `skill-driving-classes`.

Live lists. Not `bulk-buying` `tool-contracts` `machine-contracts`. Player includes `driving-classes`. Husband: `machinery` + `contracts`.

Click `pickSkill(member, slot)` iff that member’s `points > 0`. Else disabled. Dummy skills (`forecast`, `industrial`) still show; picking spends the point.

Hover (offers and learned): [[ui/callout-hover]] to the right of the Family window. Title `SKILLS[id].name`, description `skillBlurb(id, tier)`.

## Owned

Chip: `bg-ink/10`, `h-7`, icon `h-5 w-5` + roman tier when `SKILLS[id].maxTier > 1`. Same callout. Tier is the owned rank. Jam blurb uses that rank’s cap. Seed-bank blurb uses that rank’s shop pack percents.

## Blurb

`SKILLS[id].blurb` is the player sentence. Catalog voice. `skillBlurb` swaps jam for the rank’s “will not knock more than N% off”, and seed-bank for “there is some chance… (n% uncommon, n% rare, n% heirloom)”. Jam floors `0.10 / 0.20 / 0.30` (max 3) → N = 90 / 80 / 70. Better-{crop} names the 4% sale and “increased chance that a happy plant will produce a superior fruit” — not the 4%.

Assumption: names and blurbs stay in `SKILLS`; this note does not invent them. Live offer pools drop `bulk-buying` `tool-contracts` `machine-contracts`.
