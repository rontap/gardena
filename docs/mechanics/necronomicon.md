# Necronomicon

The endgame goal. Grandmother sickens, dies, and the husband finds what she was looking for. The book is bought, built once, and fed until it closes. Numbers `defs/necronomicon.ts`. Panel [[ui/necronomicon]]. Research [[mechanics/research]]. Command Center [[ui/notices]].

This note owns four terms. They exist nowhere else in the game.

| term | is | is not |
|---|---|---|
| **page** | one row of the book: a thing it wants and how much. `PageId` `crop` `early-fruit` `agaric` `ash` `gold` `tool` `supper` | a contract line, a research row, a shelf entry |
| **sacrifice** | giving an item or money to the book. The thing is destroyed and nothing comes back | consign, dump, deliver, sell, compost |
| **ritual** | the twilight act that closes every open page already full | a tick, a seam, a craft |
| **beat** | one step of `Grandma`, `well` → `ill` → `care` → `gone` → `told` | a day, a phase, a recap |

Sacrifice is not dump. A dump into a mill is feedstock and something comes out. Nothing comes out of the book. Player words: [[standards/user-facing-text]]. The engine word `beat` never reaches the player; they read a letter.

## Grandma

`World.grandma: Grandma`, always present, starts `well`. `World.grandmaUnseen: Grandma[]` is the letters not yet read, the same shape as `recapUnseen` — [[mechanics/day]]. `GRANDMA_DAY` — preference.

| beat | ended day | letter |
|---|---|---|
| `well` | 0 | none |
| `ill` | 4 | A letter from grandma |
| `care` | 6 | Grandma is not getting better |
| `gone` | 8 | Grandma has died |
| `told` | 10 | We can fix it |

`grandmaAt(endedDay)` is the latest beat whose day is at or below that day — derived. `advanceGrandma(w, endedDay)` runs at the seam, after the tree seam, before the `Recap` is appended. It only moves forward, and it pushes **every** beat it passes onto `grandmaUnseen`, so a farm loaded past a beat still gets that letter rather than losing it. `World.seeGrandma(beat)` drops one beat from `grandmaUnseen`. Not a `Cmd`. Same shape as `seeRecap`. Support from grandma is `stipendOf` and this note does not touch it. Its last band still pays through day 10, two days after she dies — [[mechanics/day]] `day.stipend`.

## Research

`unlock-necronomicon`, Trade, `NECRO_COST` and `NECRO_SECONDS` — preference. `requires` and `reveal` are both `[]`; the row is not revealed by either. `World.researchShown` returns false for `NECRO_RESEARCH` until `grandma` is `told`, and that branch is the only place a research row reads the world beyond `done`. The gate is the story, not a research topology, so it does not live in `reveal`. Unlocks `buy-necronomicon`, Automation tab, Build Automation shelf, group Necronomicon.

## Building

`Necronomicon` extends `BaseBuilding`. 2×2, origin NW, no rotate, same instance on all four cells, `squareSiteOk` — [[items/buildings]]. `World.necronomicon` holds that same instance or `'none'`. `ticks` is true and there is no `tick` body: the flag puts the book in `pullMachineStores`. It is an `IoCell` and `buy-necronomicon` is an `IO_SKU`: a chest or freezer **west** of the book, on its bottom row, is emptied into the open page on the big tick. That is what makes sixty-six ash reachable — a hand holds `STACK_MAX` — [[mechanics/inventory]]. No `pads`, no `ports`, no `inn`. It takes no signal and drives none, so it is not a `Machine` and never owns a wire endpoint. Illegal: `ports` on the book.

**One book per farm.** `skuShown` and `skuOpen` are false for `buy-necronomicon` while `World.necronomicon` is not `'none'`. `confirmPlace` refuses a second one as well. **It cannot be demolished.** `deleteBuildingBody` has no `necronomicon` arm and the book is not a `Plot`. Place [[ui/place]].

## Pages

`PAGES` in `defs/necronomicon.ts`, order `PAGE_IDS`. Amounts preference.

| page | wants | lock |
|---|---|---|
| `crop` | `NECRO_CROP` fruit of **one** crop | none |
| `early-fruit` | one fruit of each of `EARLY_FRUIT` | none |
| `agaric` | `NECRO_AGARIC` fly agaric | 2 pages closed |
| `ash` | `NECRO_ASH` ash | 2 pages closed **and** `unlock-furnace` done |
| `gold` | `NECRO_GOLD` money | 2 pages closed |
| `tool` | one `rotary-shovel` **or** one `diamond-pickaxe` | 3 pages closed |
| `supper` | one of each of `SUPPER` | 4 pages closed |

Seven pages, two open at the start. Closing both opens `agaric`, `gold`, and `ash` behind the furnace; the third closure opens `tool` and the fourth `supper`. `SupperId` is `palinka` `wine` `bread`. `supperOf(item)` maps an item onto one of them: `bread` on kind alone, `palinka` on `spirit` `brandy` at `klosterneuburger`, `wine` on `cask` `wine` at `keknyelu`. Any other spirit or cask is refused outright. Quality, `unitSale` and `infused` are not read; `variety` is, and it is the only page that reads one — [[mechanics/plants]] [[mechanics/infusion]]. `agaric` is the only sink fly agaric has — [[mechanics/burrow]] `burrow.agaric`. `tool` takes the two tools no shelf sells. `Necronomicon.tool` is a boolean, so `pageFilled` reads it as 0 or 1, and the second tool is refused once the first is in. A locked page is not drawn and takes nothing. `pagesHidden` puts one line under the list saying the book has more pages. It names no gate — [[standards/lexicon]] `lex.copy`. `pageFilled` reads the field that page owns. There is no second count field. `pageWant` is off `PageNeed` — derived.

### What the book takes

`pageClaim(book, item)` returns the one page that claims that item, or nothing. **One dump feeds one page.** Order by item kind, and one kind reaches at most one page: `ash` to `ash`, `fly-agaric` to `agaric`, the two prize tools to `tool`, bread and the two named drinks to `supper`. Fruit is the only kind two pages want, and there `early-fruit` claims before `crop`. The six-fruit page is the pickier and takes exactly **one** unit, so a stack of ten carrots gives it one and the next dump gives the rest to the bulk page. `crop` locks on the first fruit sacrificed and refuses every other crop after. Refused always: cut fruit, and every item no page asks for. Fruit Variety, Quality, and freshness are not read — a page counts units. A closed page takes nothing. A page full but not yet closed takes nothing either.

### Gold

`gold` is not a dump. One button in the panel, legal only when the page is open, not closed, not already paid, and `money >= NECRO_GOLD`. It pays the whole amount at once and never part-pays.

## Ritual

`Act.necronomicon` `'0'` `{ k: 'gold' | 'ritual' }`. `ritualBody`: legal only while `clock.phase()` is `twilight`. It closes **every** open page that is full, in one go, and does nothing when none is. Closing pages is what opens the next lock, so two pages closed at one ritual open `gold` at that same ritual. `ritualReady` is what the prop's lit frame and the Command Center row read. Guest may sacrifice by hand and may open the panel. Guest may not perform the ritual, sacrifice gold, or buy the book — [[mechanics/multiplayer]] `mp.guest`.

## Save

Fields added, no migrate — [[architecture/save]]. `SaveCell` `necronomicon` carries `base`, `crop`, `cropCount`, `fruit`, `ash`, `gold`, `agaric`, `tool`, `supper`, `pages`. `Save` carries `grandma` and `grandmaUnseen`. `originOf` lists `necronomicon`. Without it every one of the four cells dumps a full record and a load builds four books. Digest carries the book's crop, counts, fruit, fly agaric, tool, supper and closed pages — [[architecture/net]].

## Invariants

`necro.reveal` — `unlock-necronomicon` is a Trade row, `reveal` and `requires` both `[]`; `researchShown` is false until `World.grandma` is `told`, whatever `reveal` says; no other research row reads `grandma`.

`necro.grandma` — `grandmaAt(endedDay)` is the latest beat at or below that day; `advanceGrandma` runs at the seam off the ended day, only moves forward, and pushes every beat it passes onto `grandmaUnseen`; `seeGrandma` drops one and is not a `Cmd`; an unseen beat is one `grandma` notice that skips the two-pass delay.

`necro.one` — One book per farm; `skuShown` and `skuOpen` are false for `buy-necronomicon` while one stands, so no ghost arms; `confirmPlace` refuses a second; it cannot be demolished.

`necro.claim` — `pageClaim` returns one page or nothing, and one dump feeds one page; fruit is the only kind two pages want, and `early-fruit` claims before `crop` and takes exactly one unit; `fly-agaric` reaches only `agaric`, prize tools only `tool`, bread and the two named drinks only `supper`; `crop` locks on the first fruit; cut fruit is never a sacrifice; a closed page and a shut page both take nothing; Variety, Quality, and freshness are not read.

`necro.chest` — The book is an `IoCell` and `buy-necronomicon` an `IO_SKU`, so a chest or freezer west of its bottom row is emptied into the open page on the big tick, capped at what that page still wants; the book has no `pads`, no `ports` and no `inn`.

`necro.ritual` — The ritual runs only at `twilight`; it closes every open page that is full in one go and is a no-op when none is; two pages closed at one ritual open `gold` at that ritual; guest may not perform it, sacrifice gold, or buy the book.

`necro.gold` — `gold` is a button, not a dump; it pays `NECRO_GOLD` whole or not at all, only while the page is open, unclosed and unpaid and the farm can pay.

`necro.save` — A dump and parse round-trips the locked crop, the counts, the fruit given, the fly agaric, the tool, the supper given and the closed pages, as **one** instance on all four cells with `World.necronomicon` pointing at it; `originOf` lists `necronomicon`; `Save` keeps `grandma` and every unread letter.
