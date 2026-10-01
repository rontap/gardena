# Burrow

Code: `feature-burrow/` (`mintStart`, `mintSeam`, `extractBurrow`, `digBurrow`, `burrowOdds`, `rarityOf`), numbers, the daily chance (`burrowDayChance`) and the item table per rarity (`BURROW_ENTRIES`) in `defs/burrow.ts`, the cover on `plot.ts`, the count `World.sinceRare`, the Almanac card in `ui/feature-almanac/concepts.tsx`; see [[code-map]].
Unlocked: from the start.

## Purpose

A burrow is a hole in untilled ground. Digging it with a shovel gives one find: seeds, tree seeds, tools, a Pulled weed, money, a Fly agaric, a skill point, and at times an expansion permit or a Truffle. Burrows appear on the farm's land at the end of most days, more often on the starting chunk than on chunks added later, so they are a small, steady source of items the player does not buy. The item's rarity is drawn at the dig: burrows farther from the house door and later in the game give Uncommon and Rare items more often, and every dig that is not Rare makes the next Rare more likely.

## Rules

### Where burrows appear

A burrow is untilled cover, `{ kind: 'burrow' }`, on a tile with the same `ground` and `hardness` as before. It holds no item until it is dug.

**New game.** Generating chunk (0, 0) places `BURROW_START_N` burrows on tiles more than `BURROW_START_R` tiles from the house door. A tile qualifies when it is untilled, not very hard, and not reserved (`isReserved`). The tiles are picked from that list without repeats.

**Each day.** At the end of each day (`mintSeam`, [[systems/tick]]), each owned chunk draws once against `burrowDayChance`: `BURROW_DAY_CHANCE` + `BURROW_DAY_MYCOLOGIST` × the farm's `mycologist` rank ([[features/family]]), with the `start` values for chunk (0, 0) and the `other` values for every other chunk.

| chunk | rank 0 | I | II | III |
|---|---|---|---|---|
| (0, 0), `start` | 66% | 69% | 72% | 75% |
| every other, `other` | 33% | 44% | 55% | 66% |

The rank changes only this chance, not the rarity or the item. On a hit, one burrow appears on one tile of that chunk that is:

- untilled and not very hard;
- bare or grass (the grass is removed);
- not reserved, not paved, and without an item on the ground.

A chunk with no such tile gets nothing that day. There is no distance limit from the door, no limit on burrows per chunk, and a burrow that is not dug stays. A newly bought chunk gets no burrows when it is bought; its first come from the daily draw.

### Digging

With any shovel in hand, the prompt on a burrow is **Dig** (`{ act: 'shovel'; at }`). The dig takes the shovel's work seconds × `BURROW_MUL`; the ground's hardness does not change it. It uses one shovel use, on hard ground too, and a shovel at 0 uses leaves the hand.

When the dig completes:

1. The rarity and the item are drawn (Rarity and Items below).
2. The farm's count of digs since the last Rare is updated.
3. The tile becomes bare untilled ground with the same `ground` and `hardness`; it is not tilled.
4. The item drops on the first neighbouring plot tile inside the owned land (`nearSite`), or on the dug tile when there is none. An expansion permit and a skill point do not drop: they are added to the farm.

With a pickaxe in hand the hover line is **Burrow** and nothing happens.

A burrow is not solid; the gardener walks across it. Placing a building, paving, a fence or a tree seed on it is refused (`placeSolidOk`, `isPavingSite`, `isFenceSite`).

### Rarity

Three chances, in percent, from the dig day, the burrow's tile and the farm's count:

```
days      = day − 1                      (day 33 is 32 days)
distance  = doorR: straight line from the centre of the house door tile
            to the centre of the burrow tile, in tiles
far       = min(1, distance ÷ BURROW_DIST_FULL)
count     = World.sinceRare, burrows dug on this farm since the last Rare one

Uncommon  = BURROW_UNCOMMON_BASE + BURROW_UNCOMMON_DIST × far
          + BURROW_UNCOMMON_DAYS × min(1, days ÷ BURROW_UNCOMMON_DAYS_FULL)
Rare      = min(BURROW_RARE_MAX,
                BURROW_RARE_BASE + BURROW_RARE_STEP × count + BURROW_RARE_DIST × far
              + BURROW_RARE_DAYS × min(1, days ÷ BURROW_RARE_DAYS_FULL))
Common    = 100 − Uncommon − Rare
```

Uncommon is at most `BURROW_UNCOMMON_BASE` + `BURROW_UNCOMMON_DIST` + `BURROW_UNCOMMON_DAYS` and Rare at most `BURROW_RARE_MAX`; the two sum to 100, so Common is at least 0. One draw picks the rarity (`rarityOf`): below Rare it is Rare, below Rare + Uncommon it is Uncommon, above that Common.

After the dig, a Rare result sets the count to 0; a Common or Uncommon result adds 1. The count belongs to the farm: digs by every player count toward it.

With the values in `defs/burrow.ts`:

| day | distance | count | Common | Uncommon | Rare |
|---|---|---|---|---|---|
| 1 | 0 | 0 | 89 | 10 | 1 |
| 33 | 32 | 3 | 19 | 50 | 31 |
| 65 | 32 | 0 | 29 | 50 | 21 |
| 65 | 32 | 6 | 0 | 50 | 50 |

In the last row Rare is 51 before the limit of `BURROW_RARE_MAX`.

### Items

A second draw picks one entry of the rarity, each entry equally likely. A third picks one item inside the entry, each equally likely. Seeds and tree seeds have quality 0.

| rarity | entry | item |
|---|---|---|
| Common | Plain seeds | `SEED_BASE_COUNT` Tomato, Raspberry or Grape seeds, Plain |
| Common | Plain tree seed | an Apple, Apricot, Cherry or Olive seed, Plain |
| Common | Pulled weed | `WEED_LOOT_COUNT` ([[items/other/pulled-weed]]) |
| Common | Treasure | Treasure of `BURROW_TREASURE_MIN` to `BURROW_TREASURE_MAX` coins, each whole number equally likely ([[items/other/treasure]]) |
| Common | tool | a Better shovel, Hardened pickaxe or Axe; one in two has half its uses left, rounded down, the other all of them |
| Uncommon | Named seeds | `SEED_VARIANT_COUNT` Tomato (Green Zebra) or Grape (Concord) seeds |
| Uncommon | Named tree seed | an Apple (Kingston Black), Apricot (Blenheim) or Olive (Arbequina) seed |
| Uncommon | Treasure | Treasure of `BURROW_TREASURE_UNCOMMON_MIN` to `BURROW_TREASURE_UNCOMMON_MAX` coins, each whole number equally likely |
| Uncommon | Fly agaric | `AGARIC_LOOT_COUNT` ([[items/other/fly-agaric]]) |
| Uncommon | Skill point | `SKILL_POINT_LOOT` skill points, added to the farm (`grantPoints`, [[features/family]]) |
| Rare | Heirloom seeds | `SEED_HEIRLOOM_COUNT` Tomato (San Marzano), Raspberry (Black raspberry) or Grape (Kéknyelű) seeds |
| Rare | Heirloom tree seed | an Apple (Pink Lady), Apricot (Klosterneuburger) or Cherry (Bing) seed |
| Rare | Expansion permit | one expansion permit, added to the farm ([[features/expansion]]) |
| Rare | special tool | a Diamond pickaxe, Electric chainsaw or Rotary shovel with `BURROW_SPECIAL_SHARE` of its uses left, rounded |
| Rare | Truffle | `TRUFFLE_LOOT_COUNT` ([[items/other/truffle]]) |

Each rarity has five entries, so each entry is one dig in five of its rarity, and each special tool one Rare dig in fifteen. A treasure entry carries its own coin range (`BurrowEntry` `min` and `max`).

The expansion permit counts from the dig, also when `unlock-expand` is not done yet; buying land with it needs that research ([[features/expansion]]).

### Random draws

Every draw is on the `burrow` stream ([[systems/rng]]). Where a burrow appears is drawn from the chunk, the day and an index (0 to 2, or `BURROW_DAY_SALT` for the daily chance). The rarity, the entry, the item and the treasure coins or tool uses are drawn from the tile, the dig day and `BURROW_DIG_SALT` + 0 to 3, which stays clear of the chunk indexes. A tile holds one burrow at a time and a new one appears only at the end of a day, so no two digs share a tile and a day.

## Screen

- The map shows the burrow's hole; hovering it says **Burrow**. Nothing on screen names the item before the dig.
- Prompt **Dig** with a shovel.
- A Treasure lies on the ground; **Pick up** adds its coins to the farm's money, and it never goes into a hand.
- An expansion permit shows in the Command Center row for unused permits ([[features/expansion]]).
- Almanac, **Game concepts** tab, **Burrow** page: the description, then one bordered box each for **Common**, **Uncommon** and **Rare**, holding one card per entry of the Items table (`BURROW_ENTRIES`) in one row. A card is the Almanac item card (`Portrait`): the entry's name as its caption (**{tier} seeds**, **{tier} tree seed**, **Tool**, **Treasure {min}–{max}**, **Skill point**, or the item's name), and a picture that cycles through the entry's items; the skill point card shows the Family skill point picture.

## Guest

A guest can dig burrows. A guest's dig counts toward the farm's count, and an expansion permit a guest digs up belongs to the farm.

## Save and sync

Saved: every burrow tile (the cover, no item) and `sinceRare`, the farm's count of digs since the last Rare. The digest carries burrows through the cell list, and `sinceRare`.

## Art

`prop-burrow.svg` and `prop-burrow-1.svg`, picked by tile position ([[art/variants]]). The dig plays the `burrow-pop` burst ([[art/vfx]]).

## Sound

**Dig** on a burrow plays the shovel hits, lower and looser than on ground, and the `burrow` cue, a rising chime over the shovel's finish, when the burrow is dug out ([[systems/sound]]).

## Invariants

| id | rule | test |
|---|---|---|
| `burrow.start` | generating chunk (0, 0) places `BURROW_START_N` burrows more than `BURROW_START_R` tiles from the door; none on reserved, rock, tree or very hard tiles; no other chunk gets burrows when generated | `burrow.test.ts` |
| `burrow.day` | at the end of each day each owned chunk draws once against `burrowDayChance` and gets at most one burrow, on an untilled, not very hard, bare or grass tile that is not reserved, paved or under an item | `burrow.test.ts` |
| `burrow.block` | a burrow is untilled cover and holds no item; it is walkable; placing, paving, fencing and planting a tree seed on it are refused | `burrow.test.ts` |
| `burrow.dig` | any shovel digs it in work seconds × `BURROW_MUL`, one use, hardness ignored; the tile becomes bare untilled ground with the same ground and hardness; the item drops on `nearSite`; a pickaxe does nothing | `burrow.test.ts` |
| `burrow.rarity` | Uncommon = 10 + 20 × distance share + 20 × days share (32 tiles, 32 days); Rare = 1 + 5 × count + 10 × distance share + 10 × days share (32 tiles, 64 days), at most 50; Common is the rest | `burrow.test.ts` |
| `burrow.count` | a Rare dig sets the farm's count to 0; a Common or Uncommon dig adds 1; the count is saved | `burrow.test.ts` |
| `burrow.items` | each rarity's entries are equally likely, and each entry's items; seeds and tree seeds have quality 0; the special tool has 20% of its uses; Common Treasure is 10 to 150 coins, Uncommon 70 to 140 | `burrow.test.ts` |
| `burrow.permit` | a Rare expansion permit adds one permit and drops nothing | `burrow.test.ts` |
| `burrow.point` | an Uncommon skill point adds `SKILL_POINT_LOOT` skill points and drops nothing | `burrow.test.ts` |
| `burrow.mycologist` | chunk (0, 0) draws against 66% + 3% per `mycologist` rank, every other chunk against 33% + 11% per rank | `burrow.test.ts` |

## When you change this

- The entries of a rarity: `BURROW_ENTRIES` feeds both the dig and the Almanac **Burrow** card, and the item pages list burrows as a source ([[items/other/treasure]], [[items/other/fly-agaric]], [[items/other/truffle]], [[items/other/tree-seed]], [[items/other/shovel]], [[items/other/pickaxe]], [[items/other/axe]], [[items/other/pulled-weed]]).
- The expansion permit: permits are counted in [[features/expansion]].
- Fly agaric and Truffle: they also come up around trees ([[features/mushrooms]]).
- The skill point: skill points are spent in [[features/family]].
- The daily chance: the **Mycologist** description (`skillBlurb`) quotes both chances from `burrowDayChance` ([[features/family]]).
- The count: it is saved ([[systems/save]]) and in the digest ([[systems/net]]).
- A new draw: keep it on the `burrow` stream with integers that name it uniquely ([[systems/rng]]).

## Decisions

- The rarity is drawn at the dig, not when the burrow appears, so the count of digs since the last Rare applies to the next burrow dug, wherever it is.
