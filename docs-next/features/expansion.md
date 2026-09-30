# Expansion

Code: `faces` and `expandBody` in `feature-place/place.ts`, `expandPrice`, `expandSlots`, `expandLeft` and `tax` on `World`, `gen.ts` (new land), `noise.ts` (ground quality), chunk helpers in `building.ts`; see [[code-map]].
Unlocked: `unlock-expand` ([[features/research]]).

## Purpose

The farm starts on one chunk of land. Expanding buys a neighbouring chunk: more ground to plant and build on, with its own soil, rocks and burrows. Each chunk makes the daily land tax higher, and each expansion needs a permit as well as money, so land is gained a few chunks at a time through research, a skill, contract prizes and Rare burrows, not bought with money alone.

## Rules

### Chunks

The map is split into chunks of `CHUNK` × `CHUNK` tiles (`chunkOf`, `chunkRect`). `World.owned` lists the chunks the farm owns; a new game owns chunk (0, 0), which holds the starting buildings. Only tiles in owned chunks exist for the game (`inWorld`): the gardener, vehicles, placement and every tick stop at the edge.

```
            +--------+
            | (0,-1) |           a chunk can be bought when it shares a side
   +--------+--------+--------+  with an owned chunk; diagonals do not count
   | (-1,0) | (0,0)  | (1,0)  |
   +--------+--------+--------+
            | (0,1)  |
            +--------+
```

### Buying a chunk

After `unlock-expand`, an **Expand** button with the price sits just outside the middle of each side of the owned land that faces an unowned chunk (`faces`). Clicking it buys that chunk at once (`expand`, a command). The purchase is refused unless all of these hold:

- `unlock-expand` is done;
- a permit is left (`expandLeft() > 0`);
- the chunk is not owned and shares a side with an owned chunk;
- the farm has the price in money.

The price is 40 + 15 × `purchases` (`expandPrice`), so each chunk costs 15 more than the last. Buying one spends the money and one permit, adds the chunk to `owned`, generates its tiles, and rebuilds the indexes and water networks.

### Permits

```
expandSlots = 1 for each of unlock-expand, expand-land, eminent-domain
            + the inherit-land skill rank (up to 3)
            + prizeSlots (expansion permits won from contracts or dug from burrows)
expandLeft  = expandSlots − purchases, not below 0
```

Permits come from research ([[features/research]]), the `inherit-land` skill ([[features/family]]), contract prizes ([[features/contracts]]) and Rare burrows ([[features/burrow]]). A permit from a contract or a burrow counts as soon as it is won, also before `unlock-expand`. `expandLeft` is computed, not stored.

### Land tax

At every day change the farm pays `tax()`: 2 + 6 × (owned chunks − 1), at least 1. Money may go below zero ([[features/weather-day]]).

### New land

`generateChunk` fills a chunk from the game's seed. Every value is read from the `gen` stream at the tile's position ([[systems/rng]]), so a chunk's content depends on the seed and its position, not on when or in what order it was bought.

1. **Ground quality.** `goodness(col, row)` is layered noise from 0 to 1, raised near the house door. Below `VERY_HARD_MAX` the ground is very hard, below `HARD_MAX` hard, above that soft; hardness is 1 − goodness. Goodness is also the fertilizer a plot gets when tilled there ([[features/plants]]).
2. **Rocks.** Each tile becomes a rock with chance `ROCK_BASE` + `ROCK_EDGE` × (distance from the middle of chunk (0, 0) ÷ 32) + `ROCK_HARD` × hardness, so rocks are more common farther from the farm and on hard ground. A rock is one tile, or with a second roll two tiles wide or two tall where the neighbour is free.
3. **Around the door** (chunk (0, 0) only, within `CLEAR` tiles of the house door): no rocks, and all ground soft.
4. **Chunk (0, 0) only:** the starting buildings, one wild apple tree on the first pair of soft tiles one above the other, and `BURROW_START_N` burrows ([[features/burrow]]).

Reserved tiles (`isReserved`): the tiles of the starting buildings, the house door, the tiles west of the door (`YARD`) and the Produce Warehouse drop-off tiles. Generation and burrows leave them empty, so no rock or burrow is ever placed on the door, the yard or the drop-off tiles.

### Land around the farm

Unowned tiles up to `FADE` tiles outside the owned land are drawn faded, from the same ground quality ([[art/variants]]). Clicking there says the land is not owned. Nothing is drawn farther out.

## Screen

- **Expand** with a coin and the price on each buyable side, greyed when the farm cannot pay; **No permit left** when `expandLeft` is 0. Hovering it: **Expand {price}**, or **Cannot afford**.
- Command Center: **{n} farm expansion opportunity** / **opportunities** while permits are left.
- End-of-day summary: the land tax line.
- The **Land quality** view (after `unlock-expand`) colours ground by goodness ([[shell]]).

## Guest

A guest cannot expand: `permit` refuses `expand` from a guest, and the **Expand** buttons are drawn only for the host.

## Save and sync

Saved: `owned`, `purchases`, `prizeSlots`, and every tile of every owned chunk. Land is not regenerated on load. The digest carries the tiles through the cell list ([[systems/net]]).

## Invariants

| id | rule | test |
|---|---|---|
| `expansion.price` | the price starts at 40 and rises 15 per purchase; tax is 2 + 6 × (chunks − 1); money may go negative at the day change | `world.test.ts` |
| `expansion.refuse` | no purchase before `unlock-expand`, without the money, for an owned chunk or a chunk that shares no side | `world.test.ts` |
| `mp.guest` | a guest's `expand` is dropped | `mp.test.ts` |

## When you change this

- Permit sources: `expandSlots` reads research, the `inherit-land` rank and `prizeSlots`, which contract prizes and Rare burrows raise; the research and skill descriptions promise one permit each ([[features/research]], [[features/family]], [[features/contracts]], [[features/burrow]]).
- What new land contains: `gen.ts`; burrows on later days are minted by [[features/burrow]], wild grass by [[features/weeds]].
- Chunk size: `CHUNK` also sizes the grass limit ([[features/weeds]]) and the chunk key used by indexes ([[systems/world]]).
- Ground quality: `goodness` drives soil fertilizer in [[features/plants]], dig time in [[items/other/shovel]], and ground art in [[art/variants]].

## Decisions

- Money alone does not buy land: every chunk also spends a permit, so expansion follows progress in research, skills and contracts.
