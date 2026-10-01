# Mushrooms

Code: `feature-mushroom/` (`mushroomSeam`, `grownTrees`), numbers and `mushroomChance` in `defs/mushroom.ts`, the cover on `plot.ts`, the index `World.mushrooms`, the tree's area `treeArea` in `feature-field/field.ts`, the Almanac page in `ui/feature-almanac/concepts.tsx`; see [[code-map]].
Unlocked: from the start.

## Purpose

Fly agaric and Truffle are mushrooms that come up on untilled ground around grown trees, most often after rain. The player cannot sow them, but decides where they can come up: ground left untilled around a tree gives them room, a happy tree gets them more often than an unhappy one, the **Mycologist** skill raises the chance ([[features/family]]), and a Named or Heirloom tree gives more Truffles than a Plain one. Each mushroom is used in work the farm already does. Fly agaric turns Extract into Infused Extract, which speeds up a plant's growth for longer. Truffle is crushed into Truffle extract, which infuses spirits, olive oil and Extract. Both go into the Compost box and the Furnace, and a Necronomicon page asks for Fly agaric.

## Rules

### Where mushrooms come up

A mushroom is untilled cover, `{ kind: 'mushroom'; id; day }`, on a tile with the same `ground` and `hardness` as before. `id` is `'fly-agaric'` or `'truffle'` (`MushroomId`); `day` is the day that ended when it came up.

At the end of each day (`mushroomSeam`, [[systems/tick]]), after old mushrooms are removed (below), each grown tree — `juvenile` 1, not a stump — draws once against `mushroomChance`:

```
chance = (MUSHROOM_CHANCE[weather] + MUSHROOM_MYCOLOGIST[weather] × rank)
       × (MUSHROOM_HAPPY_MIN + (MUSHROOM_HAPPY_MAX − MUSHROOM_HAPPY_MIN) × happiness ÷ HAPPY_MAX)

weather   = the weather of the day that ended ([[features/weather-day]])
rank      = the farm's `mycologist` rank, 0 to 3 ([[features/family]])
happiness = the tree's `happiness` at the end of the day ([[features/trees]])
```

The happiness factor is ×0.5 at 0, ×1 at half of `HAPPY_MAX` and ×1.5 at `HAPPY_MAX`, applied after the rank is added. On a hit, one mushroom comes up on one tile of the tree's area, the area where its fruit lands ([[features/trees]]):

```
         col −1  col 0  col +1
 row −1    .      .      .
 row  0    .      T      .       T = the tree; its upper tile is `base`
 row +1    .      T      .       . = a tile a mushroom can come up on
 row +2    .      .      .
```

A tile qualifies when it is inside the owned land and is:

- untilled; a plot never gets a mushroom;
- bare or grass (the grass is removed);
- not paved, and without an item on the ground.

A tree with no such tile gets nothing that day. Trees are taken in order of `base`, row then column; a tile that got a mushroom from an earlier tree no longer qualifies for a later one.

### Which mushroom

A second draw picks the kind: Truffle when it is below `MUSHROOM_TRUFFLE` of the tree's variety tier, Fly agaric otherwise.

With the values in `defs/mushroom.ts`:

| weather of the ended day | `MUSHROOM_CHANCE` | `MUSHROOM_MYCOLOGIST` per rank | rank III, `HAPPY_MAX` |
|---|---|---|---|
| Clear | 2% | 1% | 7.5% |
| Rain | 16% | 2% | 33% |
| Flood | 32% | 4% | 66% |
| Dry | 1% | 1% | 6% |
| Drought | 0% | 0% | 0% |

| tree variety | Fly agaric : Truffle |
|---|---|
| Plain | 4 : 1 |
| Named | 2 : 1 |
| Heirloom | 1 : 2 |

Over a long walk of the weather table, Clear is 74.5% of days, Rain and Dry 11.6% each, Flood and Drought 1.2% each. A tree with a free tile, at half happiness and rank 0, then gives a mushroom about once in 26 days; eight such Plain trees give one about every 3 days, and a Truffle about every 16 days. At rank III and `HAPPY_MAX` one tree gives a mushroom about once in 9 days.

### How long a mushroom stays

A mushroom that came up at the end of day *d* is on the map for days *d* + 1 to *d* + `MUSHROOM_DAYS`. At the end of day *d* + `MUSHROOM_DAYS` it is removed, before new mushrooms come up: the tile becomes bare untilled ground with the same `ground` and `hardness`, and nothing drops.

```
 day        |   d   |  d+1  |  d+2  |  d+3  |  d+4
 mushroom   |       |  on   |  on   |  on   |
 end of day         ^                       ^
                    comes up                removed      (MUSHROOM_DAYS = 3)
```

### Picking

**Pick up** puts one Fly agaric or one Truffle into the hand, with the same hand rules as picking Cut grass from a grass tuft ([[features/weeds]]). The tile becomes bare untilled ground with the same `ground` and `hardness`.

A mushroom is not solid; the gardener walks across it. Placing a building, paving, a fence or a tree seed on it is refused, and a shovel does not till it; the player picks it first. With any other item in hand the hover line names the mushroom and nothing happens.

### Random draws

Every draw is on the `mushroom` stream ([[systems/rng]]), from the tree's `base` col and row, the ended day, and 0 for the chance, 1 for the tile, 2 for the kind.

## Screen

- The map shows the mushroom on its tile; hovering it says **Fly agaric** or **Truffle**.
- Prompt: **Pick up**.
- Almanac, **Game concepts** tab, **Mushrooms** page: where mushrooms come up, a card for each mushroom, a table of the chance per weather at half happiness (`MUSHROOM_CHANCE`) with what each **Mycologist** rank adds (`MUSHROOM_MYCOLOGIST`), a line on the happiness factor (`MUSHROOM_HAPPY_MAX`, `MUSHROOM_HAPPY_MIN`), a table of the Truffle share per variety tier (`MUSHROOM_TRUFFLE`), how long a mushroom stays, and what each is used for. Fly agaric and Truffle also have item pages under **Compostable** on the **Misc** tab.

## Guest

A guest can pick mushrooms.

## Save and sync

Saved: every mushroom tile (the cover, with its kind and day). The digest carries mushrooms through the cell list.

## Art

`prop-fly-agaric.svg` and `prop-truffle.svg` for the mushroom on its tile; `item-fly-agaric.svg` and `item-truffle.svg` for the item ([[art/svg]]).

## Invariants

| id | rule | test |
|---|---|---|
| `mushroom.day` | at the end of each day each grown tree draws once against `mushroomChance` and places at most one mushroom in its area, on an owned, untilled, bare or grass tile that is not paved or under an item | `mushroom.test.ts` |
| `mushroom.chance` | `mushroomChance` is (`MUSHROOM_CHANCE` + `MUSHROOM_MYCOLOGIST` × `mycologist` rank) × 0.5 at happiness 0, × 1 at half, × 1.5 at `HAPPY_MAX`; the seam reads the farm's rank | `mushroom.test.ts` |
| `mushroom.till` | no mushroom comes up on a plot; a tree with no free tile gets nothing | `mushroom.test.ts` |
| `mushroom.kind` | Truffle below `MUSHROOM_TRUFFLE` of the tree's variety tier, Fly agaric otherwise | `mushroom.test.ts` |
| `mushroom.gone` | a mushroom from the end of day *d* is removed at the end of day *d* + `MUSHROOM_DAYS`, before new ones come up; the tile becomes bare untilled ground | `mushroom.test.ts` |
| `mushroom.order` | trees are taken by `base`, row then column; one tile gets at most one mushroom | `mushroom.test.ts` |
| `mushroom.pick` | **Pick up** gives one item of the mushroom's kind and leaves bare untilled ground | `mushroom.test.ts` |
| `mushroom.block` | a mushroom is walkable; placing, paving, fencing, planting a tree seed and tilling on it are refused | `mushroom.test.ts` |

## When you change this

- A new mushroom kind: `MushroomId`, the kind draw and its shares, an item page, prop and item art, the Almanac page.
- The area: it is the fruit landing area of [[features/trees]]; change both on purpose.
- The uses: [[items/buildings/infuser]] (Fly agaric, Truffle extract), [[items/buildings/mill]] (Truffle), [[items/buildings/compost-box]], [[items/buildings/furnace]], [[features/necronomicon]] (Fly agaric).
- Fly agaric also comes from Uncommon burrows, and Truffle from Rare ones ([[features/burrow]]).
- The chance: the **Mycologist** description (`skillBlurb`) quotes the Rain chance at half happiness from `mushroomChance` ([[features/family]]).

## Decisions

- Mushrooms come up only on untilled ground: tilling breaks up the fungus in the soil. The player chooses between plots up to the tree and ground left for mushrooms.
- The chance follows the weather of the day that ended, because mushrooms come up after rain.
- A Named or Heirloom tree gives a larger share of Truffles than a Plain one: Truffle is the scarcer mushroom, and those trees are harder to get.
- A mushroom is removed after `MUSHROOM_DAYS` days, so the player checks the trees after wet days.
