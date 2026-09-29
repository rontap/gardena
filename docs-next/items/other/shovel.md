# Shovel

| | |
|---|---|
| item kind | `'shovel'` |
| unit | uses (`usesLeft`) |
| stack limit | 1 |
| obtained from | see grades |
| sold at | not sold |

The tool for tilling and for digging things out of plots. Every new seat starts with a Shovel in hand.

## Grades

Values from `SHOVELS` in `defs/items.ts`.

| | Shovel | Better shovel | Rotary shovel |
|---|---|---|---|
| id | `shovel` | `better-shovel` | `rotary-shovel` |
| uses | 60 | 120 | 480 |
| work seconds | 1 | 0.7 | 0.3 |
| shop | `buy-shovel`, from the start | `buy-better-shovel`, after `unlock-hardened-tools` | not sold |
| other sources | every new seat's hand | burrow loot | contract prize (`tool` cell) |

All three grades do the same actions; they differ only in uses and work seconds.

## Use

| target | result | uses |
|---|---|---|
| untilled soft ground | tilled plot | 1 |
| untilled hard ground | tilled plot | 2; refused (**Cannot dig**) with fewer left |
| very hard ground | nothing; needs a [[items/other/pickaxe]] | — |
| growing or ripe plant | one seed of that crop, variety and quality drops; plot empty | 1 |
| dead plant, Rotten produce | plot empty | 1 |
| weed | plot empty, weed chance −0.3 ([[features/weeds]]) | 1 |
| tree | tree removed; its tree seed drops | 1 |
| burrow | burrow dug ([[features/burrow]]) | 0 |

Time per action (`shovelTime`):

- untilled ground: work seconds × (1 + `DIG_HARD_SPAN` × hardness), so soft ground takes the work seconds and the hardest ground takes 1 + `DIG_HARD_SPAN` times as long;
- burrow: work seconds × `BURROW_MUL`;
- everything else: work seconds.

A shovel at 0 uses is removed from the hand.

## Sound

Each dig plays a hit every stretch of work, brighter on harder ground and lower on a burrow, and a turn of soil at the end. The Rotary shovel plays the same hits ([[systems/sound]]).


