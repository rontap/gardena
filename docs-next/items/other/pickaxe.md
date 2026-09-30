# Pickaxe

| | |
|---|---|
| item kind | `'pickaxe'` |
| unit | uses (`usesLeft`) |
| stack limit | 1 |
| obtained from | see grades |
| sold at | not sold |

The tool for rock and very hard ground.

## Grades

Values from `PICKAXES` in `defs/items.ts`.

| | Pickaxe | Hardened pickaxe | Diamond pickaxe |
|---|---|---|---|
| id | `pickaxe` | `better-pickaxe` | `diamond-pickaxe` |
| uses | 25 | 40 | 120 |
| work seconds | 4 | 2 | 0.4 |
| shop | `buy-pickaxe`, after `unlock-better-tools` | `buy-better-pickaxe`, after `unlock-hardened-tools` | not sold |
| other sources | — | a Common burrow | contract prize (`tool` cell); a Rare burrow, with 20% of its uses |

All three grades do the same actions; they differ only in uses and work seconds.

## Use

Prompt **Mine**.

| target | result | uses | time |
|---|---|---|---|
| very hard ground | Infertile soil, which a shovel cannot till | 1 | work seconds |
| one-tile rock | soft untilled ground | 1 | work seconds |
| two-tile rock | both tiles become soft untilled ground | 2; refused with fewer left | work seconds × 2 |

A pickaxe at 0 uses is removed from the hand.

## Sound

Mining plays a pick on rock every stretch of work and the rock breaking at the end ([[systems/sound]]).
