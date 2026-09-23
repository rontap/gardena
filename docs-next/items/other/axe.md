# Axe

| | |
|---|---|
| item kind | `'axe'`, `'chainsaw'` |
| unit | uses (`usesLeft`) |
| stack limit | 1 |
| obtained from | see grades |
| sold at | not sold |

The tool for chopping grown trees.

## Grades

Values from `AXES` in `defs/items.ts`. The Chainsaw is a separate item kind with the same use.

| | Axe | Chainsaw |
|---|---|---|
| kind | `axe` | `chainsaw` |
| uses | 30 | 90 |
| work seconds | 5 | 3 |
| shop | `buy-axe`, after `unlock-better-tools` | `buy-chainsaw`, after `unlock-hardened-tools` |
| other sources | burrow loot | — |

## Use

Prompt **Chop**, on a grown tree (past its juvenile period, not a stump). One use per chop.

- Drops 1 [[items/other/wood]] on the first free ground tile next to the tree (`dropSpot`), and, with the `grafting` skill, `CHOP_GRAFTS` grafts of the tree's species and variety.
- The tree becomes a stump and its fruit is lost. The stump grows back over the species' juvenile time, then grows again as a young tree before it bears fruit ([[features/trees]]).

On a young tree or a stump the prompt is the tree's state. An axe at 0 uses is removed from the hand.
