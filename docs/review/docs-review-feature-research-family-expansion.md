# Docs review: Research, Family and Expansion

Notes: `docs/mechanics/research.md`, `docs/mechanics/family.md`, `docs/mechanics/expansion.md`, `docs/ui/family.md`, `docs/architecture/family.md`, `docs/art/skills.md`
Code: `src/game/defs/research.ts`, `src/game/defs/skills.ts`, `src/game/sim/family.ts`, `src/game/sim/world.ts`, `src/game/sim/feature-place/place.ts`, `src/game/ui/research.tsx`, `src/game/ui/family.tsx`, `src/game/ui/tree-panel.tsx`, `src/game/ui/techtree.ts`, `src/game/view/svgs.ts`, `src/assets/skills/`, `messages/en/research.json`, `messages/en/family.json`, `messages/en/skills.json`
Tests: `src/game/defs/research.test.ts`, `src/game/defs/skills.test.ts`, `src/game/sim/family.test.ts`, `src/game/ui/techtree.test.ts`, `e2e/research.spec.ts`, `e2e/family-research.spec.ts`

Tick the one line that is true in each question. Tick **none** and write a line under it if none is.

## Disagreements

### 1. What does the Family screen look like and how is a skill picked?
- [ ] **doc** `docs/ui/family.md:26-38` — A 2-column grid of cards (`auto-rows-[8.5rem]`, icon over name over cost); click a card to pick the skill; hover shows the description in a callout to the right of the dock.
- [ ] **code** `src/game/ui/family.tsx:10-28`, `src/game/ui/tree-panel.tsx:439-541`, `:670-736` — A drawn tree graph of cards in paths (the same component as Research), with a 22rem detail column on the right; hovering a card previews it in the detail column, clicking selects it, and the **Get skill** button in the detail column picks it (`hud_get_skill`). Research also starts on double-click. The 2.8.4 update notes describe this layout. No unit test; `e2e/family-research.spec.ts` drives it.
- [ ] **none**

### 2. Do the Reputation and Luck bars on the Family screen show their numbers on hover?
- [ ] **doc** `docs/ui/family.md:13-22` — Yes: hover shows a callout with an explanation and **Your Reputation is {n} out of {max}.** / **Your Luck is {n} out of {max}.**
- [ ] **code** `src/game/ui/family.tsx:31-51` — The two bars have no hover handler. The strings `family_reputation_body`, `family_reputation_value`, `family_luck_body`, `family_luck_value` exist in `messages/en/family.json:18-22` and no file in `src/` uses them.
- [ ] **none**

### 3. Which contracts pay skill points?
- [ ] **doc** `docs/mechanics/family.md:54` — 1 / 2 / 3 points by band from Halbert Eijn and Intercrop.
- [ ] **code** `src/game/defs/companies.ts:51-62` — 1 point from Trade Jo at difficulty 20–29 and 1 point from Mercanova at difficulty 20–29. Halbert Eijn and Intercrop pay seeds. Test `src/game/sim/feature-contracts/market.test.ts:760` checks each prize against the table.
- [ ] **none**

### 4. Which contracts pay an expansion permit?
- [ ] **doc** `docs/mechanics/expansion.md:18` — One per difficulty-30+ prize from Trade Jo or Mercanova.
- [ ] **code** `src/game/defs/companies.ts:51-62` — Only Mercanova at difficulty 30+; Trade Jo at 30+ pays a Rotary shovel or Diamond pickaxe. Test `market.test.ts:760`.
- [ ] **none**

### 5. What quality are seeds bought from the Seed silo?
- [ ] **doc** `docs/mechanics/research.md:73`, `:87`, `docs/mechanics/family.md:85` — Plain variety, quality 0; five packs at 5 × price × 0.95, each quality 0.
- [ ] **code + test** `src/game/sim/feature-place/place.ts:226`, `:300-311`, `src/game/sim/store.ts:31-35` — Plain variety at `boughtSeedQuality`: 10% per Seed bank rank (`SEED_BANK_QUALITY` 0.1) plus 2% per familiarity level of that crop (`FAMILIARITY_SEED_QUALITY` 0.02), capped at 1. Five packs cost 5 × price × 0.95. Test `src/game/sim/feature-machines/machine.test.ts:994`, `:1003`.
- [ ] **none**

### 6. Does a Better-crop skill change the sale price?
- [ ] **doc** `docs/mechanics/research.md:128` (`research.better`) — "Better crop is `better-*` `saleMul` and ripen `betterGain`."
- [ ] **doc** `docs/mechanics/family.md:70`, `:98` — `saleMul` 1, so it pushes no price modifier; it raises quality at ripen and the variety chance.
- [ ] **code + test** `src/game/defs/skills.ts:131-175`, `src/game/sim/family.ts:37`, `:57` — Every Better-crop skill has `saleMul: 1`; no modifier is added. Test `src/game/defs/research.test.ts:62`, `src/game/defs/skills.test.ts:86`.
- [ ] **none**

### 7. How does Flood or Drought change fruit prices?
- [ ] **doc** `docs/mechanics/family.md:72` — Fruit stall goods × `WEATHER_FRUIT_SALE` after skills, before saturation.
- [ ] **code** `src/game/sim/store.ts:381`, `src/game/defs/weather.ts:10` — Adds 40 points (`WEATHER_FRUIT_IMPACT` 0.4) to the shown percent of crop goods. `WEATHER_FRUIT_SALE` not found in `src/`. (Same finding as the Market review.)
- [ ] **none**

### 8. Which icon files are live for skills?
- [ ] **doc** `docs/art/skills.md:35` — Live list: boots, driving-classes, machinery, tending, seed-bank, saleswoman, broker, heirloom, better, industrial, jam, lucky, grafting, specialty, point, locked, unknown.
- [ ] **code** `src/game/view/svgs.ts:262`, `:935-970` — Also live: `skill-bulk-buying.svg` for Bulk up and `ui-research-expand` for Inherit land; `skill-research-speed.svg` for the Cheat fast-research button. `skill-locked.svg` is on disk and has no import in `src/game/` (grep).
- [ ] **none**

### 9. Are the three family portraits shown anywhere?
- [ ] **doc** `docs/art/skills.md:5-8` — One portrait per Family panel column.
- [ ] **code** `src/game/view/svgs.ts:282-284`, `:942-946` — `PORTRAIT` is built from the three files; no file outside `svgs.ts` reads `PORTRAIT` (grep). The Family screen has no columns.
- [ ] **none**

### 10. What do the research grant lines say about Contracts and rotten produce?
- [ ] **doc** `docs/mechanics/research.md:60`, `:63` — "Rotten consign $1"; "Contracts board at the stall".
- [ ] **code (player text)** `messages/en/research.json:72`, `:77` — "Contracts tab at the Market"; "Drop off Rotten produce at the Market". Contracts is its own screen, not a Market tab, and drop-off is at the Produce Warehouse (see the Market and Contracts reviews).
- [ ] **none**

### 11. How many paving tiles does Landscaping unlock?
- [ ] **doc** `docs/mechanics/research.md:126` (`research.tiles`) — Paved, Brick, Cobble.
- [ ] **doc** `docs/mechanics/research.md:120` — Fence and all four paving SKUs.
- [ ] **code** `src/game/defs/research.ts:442-446` — Cobble, Asphalt, Brick, Paved and Fence, all shown from the start and bought after `unlock-landscaping`. Test `research.test.ts:54` names three.
- [ ] **none**

## Doc only (no code found)

### 12. Is there a Market "Sell all" gate in Family?
- [ ] **doc** `docs/mechanics/family.md:64-66` — "Sell all always legal." Searched: Sell all button in `src/game/ui/market.tsx`, none; see the Market review.
- [ ] **removed from the game**
- [ ] **none**

### 13. Do the Crop variants and Heirloom rows still change the variety roll, silo rows and packs?
- [ ] **doc** `docs/mechanics/research.md:73`, `:130` — No: "Ladder effects die." The strings for those effects remain: `messages/en/research.json:61-63` `research_grant_rarity_rolls`, `research_grant_silo_rows`, `research_grant_heirloom_column`. Searched: each key in `src/`, 0 uses.
- [ ] **removed from the game** (delete the three strings)
- [ ] **none**

## Code only (no note mentions it)

### 14. Where is the Refueling station unlocked?
- [ ] **code** `src/game/defs/research.ts:468` — `buy-refuel` shows and unlocks on `unlock-dispatch` (Automated dispatch), price 25. `docs/mechanics/research.md` lists no gate for it.
- [ ] **intended, document it**
- [ ] **not intended**

### 15. What does Seed bank do?
- [ ] **code** `src/game/defs/skills.ts:9-13`, `:123-130`, `messages/en/skills.json:15-16` — Seed bank (max rank 1) makes bought seed arrive at 10% quality. `docs/mechanics/family.md` lists the id and cap but not the effect.
- [ ] **intended, document it**
- [ ] **not intended**

### 16. What does the research card show when it cannot start?
- [ ] **code** `src/game/ui/tree-panel.tsx:575-586` — The detail column names the reason: already researched, running now, **Needs {name} first.**, another project running, not enough money.
- [ ] **intended, document it**
- [ ] **not intended**

## Agreed

- [ ] 17. One research job at a time; paid up front; refused if running, done, not open, or short of money — doc `docs/mechanics/research.md:3`, code `src/game/sim/world.ts:1915-1928`, test `research.test.ts:22`.
- [ ] 18. Research tree: one parent per row, three start rows (Multi-Crop Farming, Irrigation, Machinery & Expansion); a row is known when its parent is open, open when its parent is done; unknown cards read **Unknown** / **You do not know what this does.**; Necronomicon row needs Grandma's letter and `unlock-grinder` — doc `docs/mechanics/research.md:13-29`, `:39-71`, code `src/game/defs/research.ts:40-360`, `src/game/sim/world.ts:949-953`, `:1909-1913`, `messages/en/research.json:3-4`, test `research.test.ts:126`, `:147`.
- [ ] 19. Research names and the four quoted descriptions (Gardening tools, Hardened tools, Multi-Crop Farming, Advanced Plants, Weather Forecast Station) match — doc `docs/mechanics/research.md:9`, code `messages/en/research.json:5-10`, `:47-56`, test `research.test.ts:10`.
- [ ] 20. Shop gates in the Seeds, machines, Water, Vehicles and Land tables (show and buy research for every listed SKU) — doc `docs/mechanics/research.md:85-120`, code `src/game/defs/research.ts:377-526`, test `research.test.ts:22`, `:228`, `:319`, `:330`.
- [ ] 21. Cheats: unlock all research gives +999 money and 99 points, no skills; fast research drains the job 3× faster; +200 money; +10 points — doc `docs/mechanics/research.md:5-7`, code `src/game/sim/world.ts:1687-1711`, `:1784`, `src/game/sim/tick.ts:35`, test `research.test.ts:108`.
- [ ] 22. Skills: one pool of 20 ids; parents and research gates as the table; caps 3 on the I–III skills and 1 on Tending, Seed bank, Grafting and the Better skills — doc `docs/mechanics/family.md:15`, `:27-48`, `docs/architecture/family.md:13-51`, code `src/game/defs/skills.ts:15-263`, test `src/game/sim/family.test.ts:76`.
- [ ] 23. Picking: rank n costs n points; one point a day (`POINTS_PER_DAY` 1); host only; known, open and research gate met — doc `docs/mechanics/family.md:54`, `:58`, code `src/game/sim/family.ts:25-49`, `src/game/sim/world.ts:216`, test `family.test.ts:31`, `:215`, `e2e/mp-guest.spec.ts:37`.
- [ ] 24. Skill numbers: Boots +5% walk per rank, Machinery +5% per rank, Saleswoman +2%, Heirloom +5%, Specialty +5%, Industrial +3%, Jam 15% slower rot per rank below 50% freshness — doc `docs/mechanics/family.md:76-87`, `:100`, code `src/game/defs/skills.ts:59-65`, `:111-118`, test `family.test.ts:159`, `skills.test.ts:43`.
- [ ] 25. Lucky: one skill, max 3, parent Boots; luck = min(`LUCK_CAP`, rank); bar on the Family screen scored against max rank 3 — doc `docs/mechanics/family.md:104`, `docs/ui/family.md:18-20`, code `src/game/sim/family.ts:6-9`, `src/game/ui/family.tsx:46`, test `skills.test.ts:65`.
- [ ] 26. Unlock all skills sets every skill to its max rank without spending points — doc `docs/mechanics/family.md:56`, code `src/game/sim/family.ts:70-76`, test `family.test.ts:191`.
- [ ] 27. Family screen is a dock 79rem wide (Research 97rem), title **Family**, points footer, guest sees **Only the host can choose a skill.** — doc `docs/ui/family.md:3-7`, `:24`, code `src/game/ui/tree-panel.tsx:537`, `src/game/ui/family.tsx:17-27`, `messages/en/family.json:14`, test `e2e/mp-guest.spec.ts:37`.
- [ ] 28. Expansion: each new chunk needs one permit and money; permits = Expansion + Expand land + Eminent domain + Inherit land rank + prize permits; price 40 + 15 × chunks bought; must touch owned land — doc `docs/mechanics/expansion.md:9-33`, `:43`, code `src/game/sim/world.ts:795-820`, `src/game/sim/feature-place/place.ts:63-81`, no unit test found.
- [ ] 29. Tax at the day seam: 2 + 6 × (chunks owned − 1), at least $1 — doc `docs/mechanics/expansion.md:25-31`, `:41`, code `src/game/sim/world.ts:822-825`, no unit test found.
- [ ] 30. Stat icons: `stat-reputation` and `stat-luck` drawn in rect rows, `skill-lucky` reuses the clover, portraits 64×96 — doc `docs/art/skills.md:5-7`, `:39-47`, `:60`, code `src/assets/skills/` (4 files opened: `stat-luck` 100 rects, `stat-reputation` 82, `skill-lucky` 100, `skill-unknown` 8, no paths), no test.
