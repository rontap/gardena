# Docs review: Necronomicon and Tutorial

Notes: `docs/mechanics/necronomicon.md`, `docs/ui/necronomicon.md`, `docs/mechanics/tutorial.md`
Code: `src/game/defs/necronomicon.ts`, `src/game/sim/feature-necronomicon/necronomicon.ts`, `src/game/sim/building.ts:1118-1142`, `src/game/ui/necronomicon.tsx`, `src/game/ui/story.tsx`, `src/game/ui/notices.ts`, `src/game/sim/tutorial.ts`, `src/game/defs/tutorial.ts`, `src/game/sim/seat.ts`, `src/App.tsx`, `messages/en/necronomicon.json`, `messages/en/tutorial.json`
Tests: `src/game/sim/necronomicon.test.ts`, `src/game/sim/tutorial.test.ts`

Tick the one line that is true in each question. Tick **none** and write a line under it if none is.

## Disagreements

### 1. Do the page names carry their amounts as words written into the text?
- [ ] **doc** `docs/ui/necronomicon.md:70` — "Amounts arrive through `fill` from `defs/necronomicon.ts`. Never digits."
- [ ] **code** `messages/en/necronomicon.json:13-26` — Page names and descriptions spell the amounts as words fixed in the text: "A crop, twenty times over", "{crop}, twenty times over", "Sixty-six measures of ash", "Six hundred and sixty-six in coin", "Three red mushrooms", "Sacrifice twenty fruit…", "…each of the six crops…", "Sacrifice three Fly agaric". Changing `NECRO_CROP`, `NECRO_ASH`, `NECRO_GOLD` or `NECRO_AGARIC` would not change them. Only the money button (`necro_gold_pay`) and **{have} of {want}** take numbers through `fill`. No test.
- [ ] **none**

### 2. What does the money button say?
- [ ] **doc** `docs/ui/necronomicon.md:36` — **Sacrifice $666**, the amount through `fill`, treasure art, shown only while the gold page is open, unclosed and unpaid.
- [ ] **code** `src/game/ui/necronomicon.tsx:140-153`, `messages/en/necronomicon.json:27` — `necro_gold_pay` is "Sacrifice {amount}" filled with the bare number, so the button reads **Sacrifice 666** with no `$`; treasure art; the row sits between the page list and the ritual button. No test.
- [ ] **none**

### 3. Can a guest perform the ritual?
- [ ] **doc** `docs/mechanics/necronomicon.md:66` — Guest rule is in `docs/mechanics/multiplayer.md` `mp.guest` (not assigned to this review).
- [ ] **code** `src/game/sim/mp.ts:214-217`, `src/game/ui/necronomicon.tsx:44-53` — A guest's `Act.necronomicon` is permitted and the ritual button has no guest check. The string **Only the gardener who owns this farm can perform the ritual.** (`necro_ritual_guest`, `messages/en/necronomicon.json:9`) exists and no file in `src/` uses it.
- [ ] **none**

### 4. What seeds and items does a new farm start with?
- [ ] **doc** `docs/mechanics/tutorial.md:63` — Shovel in hand, bucket dropped at the door, and in the Seed silo seven carrot, two tomato, two potato.
- [ ] **code** `src/game/sim/seat.ts:11-16`, `:62-80`, `src/game/defs/varieties.ts:143-163`, `src/game/sim/world.ts:476-477` — The same, plus five seeds each of seven Named and Heirloom varieties (Bintje, Red Fife, Green Zebra, San Marzano, Black raspberry, Concord, Kéknyelű) in the Seed silo, and in the solo player's inventory a Plain tree seed of every tree, grafts of the starter tree varieties, and five fruit each of Kéknyelű and San Marzano. No test found for the kit.
- [ ] **none**

### 5. How do the start fragments turn the tutorial off?
- [ ] **doc** `docs/mechanics/tutorial.md:18` — App maps `#start_now`, `#unlockall`, `start=now`, `start=unlock` to `startTutorial('start_now')`.
- [ ] **code + test** `src/App.tsx:64-65`, `:520-523` — Only `playNew` calls `startTutorial('new', slotExists())`; the start fragments build a `World`, whose tutorial is `off` by default, without calling `startTutorial`. Test `tutorial.test.ts:33` asserts `startTutorial('start_now', …)` returns off and a fresh `World` is off.
- [ ] **none**

## Doc only (no code found)

None found.

## Code only (no note mentions it)

### 6. What does the book's hover line say?
- [ ] **code** `src/game/sim/look.ts:266`, `messages/en/necronomicon.json:37` — **Necronomicon - {done} of {open} pages done**.
- [ ] **intended, document it**
- [ ] **not intended**

### 7. Does a fruit that fills a contract or comes by vehicle count toward the tutorial's delivered total?
- [ ] **code** `src/game/sim/store.ts:222-224` — Every fruit passed to `consignItem` counts, whether it fills a contract or the stall, and whether a person or a vehicle drops it off (`vehicle.ts:1480`).
- [ ] **intended, document it**
- [ ] **not intended**

## Agreed

- [ ] 8. Grandma's letters: ill at day 4, not getting better at 6, died at 8, "We can fix it" at 10 (`GRANDMA_DAY`); the seam pushes every beat passed onto the unread list; titles as the note's table — doc `docs/mechanics/necronomicon.md:18-28`, `:76`, code `src/game/defs/necronomicon.ts:97`, `src/game/sim/feature-necronomicon/necronomicon.ts:178-188`, `messages/en/necronomicon.json:29-36`, test `necronomicon.test.ts:107`, `:131`.
- [ ] 9. Research row Necronomicon: parent Machinery & Expansion, cost 13, 66 s, known and open only after the last letter and its parent — doc `docs/mechanics/necronomicon.md:32`, `:74`, code `src/game/defs/necronomicon.ts:7-8`, `src/game/defs/research.ts:349-359`, `src/game/sim/world.ts:949-953`, `:1909-1913`, test `necronomicon.test.ts:63`.
- [ ] 10. The book: 2×2, price 66, one per farm (shelf stops offering it, a second placement refused), cannot be demolished (**The Necronomicon stays where you put it.**), a chest west of its bottom row feeds it — doc `docs/mechanics/necronomicon.md:36-38`, `:78`, `:82`, `docs/ui/necronomicon.md:13`, code `src/game/defs/necronomicon.ts:4-9`, `src/game/sim/world.ts:929`, `:938`, `src/game/sim/feature-place/place.helpers.ts:377-383`, `src/game/sim/feature-machines/machine.ts:57-85`, `messages/en/prompt.json:170`, test `necronomicon.test.ts:280`, `:364`.
- [ ] 11. Seven pages and their locks: crop (20 of one crop) and one-of-each-early-fruit open at start; Fly agaric (3), ash (66, also needs Furnace research) and gold (666) after 2 closed; tool after 3; supper after 4 — doc `docs/mechanics/necronomicon.md:42-54`, code `src/game/defs/necronomicon.ts:11-95`, `necronomicon.ts:38-41`, test `necronomicon.test.ts:147`.
- [ ] 12. What the book takes: one dump feeds one page; early-fruit takes one unit before the crop page; crop page locks on the first crop; cut fruit refused; tool takes one Rotary shovel or Diamond pickaxe; supper takes Bread, Klosterneuburger brandy and Kéknyelű wine, one each — doc `docs/mechanics/necronomicon.md:54-58`, `:80`, code `necronomicon.ts:61-128`, test `necronomicon.test.ts:182-266`.
- [ ] 13. Gold is a button: pays 666 whole or nothing, only while the page is open and unpaid — doc `docs/mechanics/necronomicon.md:62`, `:86`, code `necronomicon.ts:158-166`, test `necronomicon.test.ts:297`.
- [ ] 14. Ritual only at twilight, closes every full open page at once, no-op when none is full; pages closed at one ritual can open gold in the same ritual — doc `docs/mechanics/necronomicon.md:66`, `:84`, code `necronomicon.ts:168-176`, test `necronomicon.test.ts:322`, `:341`.
- [ ] 15. Panel: title **Necronomicon**, page rows with **{have} of {want}** or **Done**, closed pages faded, fruit and supper pages drawn as faces, **The book has more pages.**, ritual button with its two reasons, footer text — doc `docs/ui/necronomicon.md:17-45`, code `src/game/ui/necronomicon.tsx:14-135`, `messages/en/necronomicon.json:3-12`, no UI test.
- [ ] 16. Walk-up prompts **Sacrifice** and **Read the Necronomicon** — doc `docs/ui/necronomicon.md:11`, code `messages/en/prompt.json:167-168`, test not found.
- [ ] 17. Letters: popup 26rem with the night wash, one **Close**; Command Center rows **A letter is waiting** and **A page is ready for the ritual** — doc `docs/ui/necronomicon.md:47-66`, code `src/game/ui/story.tsx:21-53`, `src/game/ui/notices.ts:407-430`, `messages/en/notices.json:69-70`, test `necronomicon.test.ts:131`, `:353`.
- [ ] 18. Save keeps the book (one instance on four cells), Grandma's beat and unread letters — doc `docs/mechanics/necronomicon.md:70`, `:88`, code `src/game/sim/feature-save/save.ts:199`, `:325-327`, test `necronomicon.test.ts:388`.
- [ ] 19. Tutorial on only at New Game with no stored farm; off is permanent; state saved — doc `docs/mechanics/tutorial.md:9-24`, `:81-83`, code `src/game/sim/tutorial.ts:26-30`, `src/App.tsx:520-523`, test `tutorial.test.ts:33`, `:47`.
- [ ] 20. Nine steps with the done conditions in the table (4 plots, seeds or a plant, 4 plants, poured, filled and placed, one fruit delivered, 6 plants, fertilized, right-click); step never decreases; step 6 hidden until a crop is ripe — doc `docs/mechanics/tutorial.md:30-61`, `:85-91`, code `src/game/sim/tutorial.ts:32-115`, `src/game/defs/tutorial.ts:1-3`, `src/game/sim/queue.ts:253`, `:481-483`, `:538`, test `tutorial.test.ts:66-138`.
- [ ] 21. Event lines after the chain: research at day 2 with money over 20 and nothing researched; irrigation at day 5 without Automated irrigation; contracts at 30 delivered fruit without Contracts; each fires once — doc `docs/mechanics/tutorial.md:65-77`, `:93`, code `src/game/sim/tutorial.ts:88-123`, `src/game/defs/tutorial.ts:5-11`, test `tutorial.test.ts:140-195`.
