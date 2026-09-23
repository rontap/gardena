# Docs review: Machines

Notes: `docs/mechanics/machines.md`, `docs/mechanics/infusion.md`, `docs/ui/machines.md`, `docs/ui/recipe.md`, `docs/ui/station.md`, `docs/art/machines.md`
Code: `src/game/sim/building.ts`, `src/game/sim/feature-machines/machine.ts`, `machines.tick.ts`, `machines.helpers.ts`, `machines.emit.ts`, `recipe.ts`, `recipe.h.ts`, `src/game/sim/prompt.ts`, `src/game/sim/look.ts`, `src/game/defs/items.ts`, `src/game/ui/recipe.tsx`, `src/game/ui/station.tsx`, `src/game/ui/status.tsx`, `src/assets/`
Tests: `src/game/sim/feature-machines/machine.test.ts`, `recipe.test.ts`, `sorter.test.ts`, `src/game/sim/infusion.test.ts`, `e2e/infusion.spec.ts`, `e2e/furnace.spec.ts`

Tick the one line that is true in each question. Tick **none** and write a line under it if none is.

## Disagreements

### 1. What does the Seed grinder make from Heirloom annual fruit?
- [ ] **doc** `docs/mechanics/machines.md:58` — Seeds of the same crop and variety, Heirloom included.
- [ ] **doc** `docs/mechanics/machines.md:205` (`machines.grind-tree`) — Heirloom annual fruit gives Plain (`'base'`) seeds.
- [x] **code + test** `src/game/sim/feature-machines/machine.ts:190-197` — Every annual fruit gives seeds of its own variety, Heirloom included; tree fruit gives a Plain tree seed. Test `recipe.test.ts:145` asserts the grinder row yields `[seeds, crop, variety]` for every annual pin including Heirloom.
- [ ] **none**

### 2. Does a lone working Furnace show the "Finishes faster" line on its own hover?
- [ ] **doc** `docs/ui/machines.md:148` — Yes: "A lone working furnace covers itself, so its own hover shows the line."
- [ ] **doc** `docs/mechanics/machines.md:141`, `:245` — A furnace never counts itself.
- [x] **code + test** `src/game/sim/feature-machines/machine.ts:499-501`, `src/game/sim/look.ts:187-190` — A furnace never counts itself, so a lone furnace shows no line. Test `machine.test.ts:533` "…A furnace never counts itself, so a lone furnace has no line…" asserts it.
- [ ] **none**

### 3. What does studying a crop at the Crop Variety Station give?
- [ ] **doc** `docs/mechanics/machines.md:92` — "Familiarity pays into the ripen roll and nothing else."
- [ ] **doc** `docs/ui/station.md:45-47` — Three effects: Variety chance, shop seed quality, Market price recovery.
- [x] **code + test** `src/game/defs/varieties.ts:197-204` (`varietyChance`), `src/game/sim/store.ts:31-35` (`boughtSeedQuality`), `src/game/sim/feature-contracts/market.ts:159-161` (`recoverPerDay`) — The three effects of `docs/ui/station.md`. Tests `machine.test.ts:994` (seed quality), `src/game/sim/feature-contracts/market.test.ts:584` (price recovery).
- [ ] **none**

### 4. Is the Refueling station a `MachineId`?
- [ ] **doc** `docs/mechanics/machines.md:155`, `:157` — `MachineId` is mill jam still barrel grinder compost-box furnace infuser (no refuel).
- [ ] **doc** `docs/mechanics/machines.md:106`, `docs/ui/recipe.md:7` — Refuel is a `MachineId`.
- [x] **code + test** `src/game/sim/feature-machines/recipe.h.ts:5` — `MachineId` includes `'refuel'`. Test `recipe.test.ts:66` asserts four refuel rows.
- [ ] **none**

### 5. Which buildings show the "Finishes faster" line?
- [ ] **doc** `docs/mechanics/machines.md:259` — Mill, jam, still, grinder, compost box, furnace, infuser.
- [ ] **doc** `docs/ui/machines.md:139` — The same list plus the Refueling station.
- [x] **code** `src/game/sim/look.ts:187-190` — Every building with `hasted` true, which includes the Refueling station (`building.ts:946`); barrel and station are not `hasted`. Test `machine.test.ts:533` covers mill, jam, grinder, compost box, still, furnace, barrel; not refuel or infuser.
- [ ] **none**

### 6. What is the dump prompt at the Crop Variety Station?
- [ ] **doc** `docs/ui/station.md:90` — **Analyze**.
- [x] **code** `src/game/sim/prompt.ts` (station intent), `messages/en/prompt.json:131` `prompt_station_analyze` — **Study**. No test.
- [ ] **none**

### 7. How are the chips laid out on a station crop card?
- [ ] **doc** `docs/ui/station.md:41`, `:49-68` — Three fixed columns (Variety chance, Shop seed quality, Market price recovery); slot 1 stays empty for a crop with only a Plain variety so the others keep their columns; level chips in a second, wrapping row; purpose chips read **Fresh** / **Preserving** / **Alcohol**.
- [x] **code** `src/game/ui/station.tsx:188`, `:204-219`, `:237-289` — All chips (gains then level chips) share one `grid-cols-3`; the Variety chance chip is left out for a Plain-only crop, so the next chips move left; purpose chips read **Best for {purpose}** (`hud_station_best_for`); the Almanac chip reads **{n} almanac entries**. No test.
- [ ] **none**

### 8. What does the Pot still say when refusing a crop, and when full without water?
- [ ] **doc** `docs/ui/machines.md:37-43` — **Pot still - potatoes, wheat or apricot**; **Pot still - {cap}/{cap}, needs water**.
- [x] **code** `src/game/sim/prompt.ts:977-987`, `messages/en/prompt.json:98`, `:100` — **Pot still - Potato, Wheat or Apricot**; **Pot still - 10/10, Needs water**. No test.
- [ ] **none**

### 9. What does the Barrel say when refusing a crop, and while aging?
- [ ] **doc** `docs/ui/machines.md:49-57` — **Barrel - grapes or apples**; aging **Barrel - aging {n}d, sells at ×{mul}**.
- [x] **code** `src/game/sim/prompt.ts:989-1006`, `src/game/sim/look.ts:219-237`, `messages/en/prompt.json:103-107` — Refuse: **Barrel - Grape or Apple**. The hover look line (`look.ts`) reads **Barrel - aging {n}d, sells at ×{mul}** plus the cask line; the prompt line (`prompt.ts:994`) reads **Barrel - aging {n}d** without the price. Test `machine.test.ts:873` asserts the cask line only.
- [ ] **none**

### 10. What do the Sugar cane fruit faces look like?
- [ ] **doc** `docs/art/machines.md:41` — `fruit-sugar-cane.svg` groups `common` `heirloom`.
- [x] **code** `src/assets/fruits/fruit-sugar-cane.svg` — One group `base`, 33 rects. Sugar cane has one variety, `'base'` (`src/game/defs/varieties.ts:135`).
- [ ] **none**

### 11. Can a guest open a Freezer?
- [ ] **doc** `docs/mechanics/machines.md:80`, `docs/ui/machines.md:81` — No; host only.
- [x] **code** `src/game/sim/mp.ts:214-217` — Guests are refused only skill picks, Expand and Cheat; no guest check on the chest / freezer panel found in `src/App.tsx`. The 2.8.3 update notes (`src/game/ui/changelog.md`) say a guest can open a Chest or Freezer. No test found.
- [ ] **none**

### 12. What sale rate does the grass mill use?
- [ ] **doc** `docs/mechanics/machines.md:52` — Grass takes `NO_PATH_SALE`.
- [x] **code** `src/game/sim/feature-machines/machine.ts:108-118` — Grass uses rate 1 × quality factor; `NO_PATH_SALE` not found in `src/`. Extract is `EXTRACT` 8.
- [ ] **none**

## Doc only (no code found)

### 13. Where does the grass mill's sale rate come from?
- [x] **doc** `docs/mechanics/machines.md:52` — "Grass takes `NO_PATH_SALE`." Searched: `NO_PATH_SALE` in `src/`, nothing found (see question 12 for what the code does).
- [ ] **removed from the game**
- [ ] **none**

## Code only (no note mentions it)

### 14. Do the Mill and Jam machine have a hopper limit?
- [x] **code** `src/game/sim/building.ts:671-678`, `:739-744` — No. A dump of a matching crop and variety takes the whole stack, whatever is already inside. The mill look reads **Mill - full** once it holds one batch (`prompt.ts:960`), though it still takes more.
- [ ] **intended, document it**
- [ ] **not intended**

### 15. Do the Infuser's Flakes and Vanilla extract stores have a limit?
- [x] **code** `src/game/sim/building.ts:1013-1031` — No. Any number of Flakes or Vanilla extract is taken, whatever is locked.
- [ ] **intended, document it**
- [ ] **not intended**

### 16. What tree seed does the grinder give, and how many?
- [x] **code** `src/game/sim/building.ts:583-597`, `machine.ts:195` — Tree fruit gives one Plain tree seed per fruit at the fruit's quality; the random count (`GRIND_MIN` 1 to `GRIND_MAX` 3, floor raised by quality) is drawn but not used for tree seeds.
- [ ] **intended, document it**
- [ ] **not intended**

### 17. What does the station intro text promise?
- [x] **code** `messages/en/hud.json:122` `hud_station_intro` — "Fruits can have up to 30 levels…"; the cap is 10, 20 or 30 by crop (`familiarityMax`, `FAMILIARITY_PER_VARIETY` 10 per variety).
- [ ] **intended, document it**
- [ ] **not intended**
