# Necronomicon

Code: `feature-necronomicon/necronomicon.ts`, `defs/necronomicon.ts` (`PAGES`, `PAGE_IDS`, `GRANDMA_DAY`, the amounts), the `Necronomicon` class in `building.ts`, `ui/necronomicon.tsx` (panel), `ui/story.tsx` (letters), `grandmaRows` and `necronomiconRows` in `ui/notices.ts`; see [[code-map]].
Unlocked: the story reveals the research `unlock-necronomicon`; it unlocks `buy-necronomicon` ([[features/research]]).

## Purpose

The Necronomicon is the farm's long goal. Grandma falls ill, dies, and leaves a note about a book that can bring a person back. The player researches it, builds it once, and fills its pages with what the farm produces: a lot of one crop, one of each early crop, mushrooms from burrows, ash, money, a tool no shop sells, and a supper that needs named Varieties. Nothing given to the book comes back, so each page costs the farm real output.

## Rules

### Grandma

`World.grandma` is a `Grandma` beat: `well` → `ill` → `care` → `gone` → `told`. `grandmaAt(endedDay)` is the latest beat whose `GRANDMA_DAY` is at or below that day. At each day change `advanceGrandma` moves the beat forward, never back, and pushes every beat it passes onto `World.grandmaUnseen`, so a farm that skips past a beat still gets that letter. Each unseen beat is a Command Center row **A letter is waiting**; clicking it opens the letter (`story.tsx`), and **Close** removes it (`seeGrandma`). The beat word is developer register; the player reads a letter.

The research `unlock-necronomicon` (parent `unlock-grinder`, `NECRO_COST`, `NECRO_SECONDS`) is known and open only once `World.grandma` is `told` and `unlock-grinder` is done. It is the only research row that reads the story.

### The book

`buy-necronomicon` costs `NECRO_PRICE`, is `NECRO_W` × `NECRO_H`, and cannot be demolished (**The Necronomicon stays where you put it.**). One book per farm: `World.necronomicon` holds it, and the SKU is not shown while it stands. It takes no signal and has no ports or vehicle loading spots. A chest or freezer to its west feeds it on the big tick, as a chest feeds a machine ([[systems/building-io]]).

### Pages

`PAGE_IDS` in order. A page opens when enough pages are closed and its research is done (`pageOpen`, `PageLock`); only open pages are listed, with **The book has more pages.** under them while any is not open.

| page | wants | opens after |
|---|---|---|
| `crop` | `NECRO_CROP` fruit of one crop; the first fruit sets the crop | start |
| `early-fruit` | one fruit of each crop in `EARLY_FRUIT` | start |
| `agaric` | `NECRO_AGARIC` Fly agaric | 2 pages closed |
| `ash` | `NECRO_ASH` Ash | 2 pages closed and `unlock-furnace` |
| `gold` | `NECRO_GOLD` money | 2 pages closed |
| `tool` | one Rotary shovel, Diamond pickaxe or Electric chainsaw | 3 pages closed |
| `supper` | one each of `SUPPER`: Barackpálinka, Premium wine (Kéknyelű) and Bread | 4 pages closed |

### Sacrifice

**Sacrifice** gives the item in hand to the one page that claims it (`pageClaim`, `openClaim`). One sacrifice feeds one page: Ash goes to `ash`, Fly agaric to `agaric`, the three prize tools to `tool`, Bread and the two named drinks to `supper`. Fruit is the only item two pages want: `early-fruit` takes one fruit of a crop it still lacks, and otherwise `crop` takes as many as it has room for, of its crop only. Cut fruit, a closed page, a full page, and anything no page asks for are refused. Variety, Quality and freshness are not read, except that `supper` reads the Variety of the drinks (`supperOf`).

`gold` is paid with a panel button, **Sacrifice {amount}**: the whole `NECRO_GOLD` at once, only while the page is open and unpaid and the farm has the money (`sacrificeGoldBody`).

### Ritual

**Perform the ritual** works only at Twilight (`ritualBody`). It closes every open page that is full, at once; closing pages can open new ones in the same ritual. Each page it closes grants `NECRO_PAGE_POINT` skill points ([[features/family]]); a ritual that closes nothing grants none. `ritualReady` is true while some open page is full and not closed: the Command Center shows **A page is ready for the ritual** and the book's prop shows its lit art.

## Screen

Prompts: **Sacrifice** with an item a page wants; **Read the Necronomicon** otherwise; **No open page wants what you are carrying.**; **Every open page already has what it asked for.** Panel: title **Necronomicon**, **Each open page names what it wants. Sacrifice it, then perform the ritual at twilight.**, one row per open page with its name, description and **{have} of {want}** or **Done**, the gold button, **Perform the ritual** (with **The ritual can only be performed at twilight.** or **No page has everything it asked for yet.** when it cannot run), and **Put what a page asks for in your hands and walk up to the book. A chest to the west of the book feeds it for you.** Hover: **{done} of {open} pages done**. Command Center: **A letter is waiting**, **A page is ready for the ritual**.

## Guest

A guest can sacrifice, pay the gold page and perform the ritual (`permit` allows `Act.necronomicon` for both kinds).

## Save and sync

`SaveCell` `necronomicon` carries the locked crop, `cropCount`, the early fruit given, `ash`, `gold`, `agaric`, `tool`, the supper given and the closed pages, saved once from the origin tile. `Save` carries `grandma` and `grandmaUnseen`. The digest carries the book's crop, counts, fruit, Fly agaric, tool, supper and closed pages ([[systems/net]]).

## Art

`prop-necronomicon.svg`, atlas keys `necronomicon-off` and `necronomicon-on` (while `ritualReady`).

## Invariants

| id | rule | test |
|---|---|---|
| `necro.reveal` | `unlock-necronomicon` is known and open only once `grandma` is `told` and `unlock-grinder` is done | `necronomicon.test.ts` |
| `necro.grandma` | the beat only moves forward, and every beat passed becomes an unseen letter | `necronomicon.test.ts` |
| `necro.one` | one book per farm; it cannot be demolished | `necronomicon.test.ts` |
| `necro.claim` | one sacrifice feeds one page; `early-fruit` claims fruit before `crop` and takes one unit | `necronomicon.test.ts` |
| `necro.ritual` | the ritual runs only at Twilight and closes every full open page at once | `necronomicon.test.ts` |
| `necro.point` | each page the ritual closes grants `NECRO_PAGE_POINT` skill points | `necronomicon.test.ts` |
| `necro.gold` | the gold page is paid whole or not at all | `necronomicon.test.ts` |

## When you change this

- A new page: a `PageId`, its `PAGES` entry with `need` and `lock`, its field on `Necronomicon`, `pageFilled`, `pageClaim`, the save cell and the digest ([[systems/save]], [[systems/net]]).
- A new letter: a `Grandma` beat, its `GRANDMA_DAY`, its title and body in `story.tsx`.

## Decisions

- Nothing comes back from the book: a sacrifice is not a sale or a machine input, which is why it has its own word.
- The supper reads Variety so that the last page needs Heirloom work, not only volume.
