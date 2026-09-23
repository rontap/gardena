# {Crop}

| | |
|---|---|
| kind | annual / tree |
| class | root / grain / fruit (`CROPS.{id}.cls`) |
| seeds from | {Seed silo pack, contract prize, Grinder, …} |
| unlocked by | {research id of the pack, or start} |
| code id | `'{id}'` |

{One or two sentences: what the crop is for the player and what sets it apart.}

## Varieties

Always these three columns; `—` where the crop has no variety of that tier. Purpose and placement need: [[features/plants]].

| | Plain | Named | Heirloom |
|---|---|---|---|
| name | {Crop} | {name} / — | {name} / — |
| purpose | — | Fresh / Preserving / Alcohol / — | Fresh / Preserving / Alcohol / — |
| placement need | — | — / neighbour | — / neighbour |

## Growing

Fields of `CROPS.{id}` (trees also `TREES.{id}`, `TREE_FERT_PER_DAY.{id}`): `growSeconds`, `waterUsePerSec`, `waterTolerance`, `fertTolerance`, `fertUseMul`, `rotSeconds`. {Anything specific to this crop.}

## Selling

{Fruit at the Market; price rule; link [[features/market]].}

## Affected by

- {skills, research specific to this crop}

## Art

`crop-{id}.svg` / `prop-{id}-tree.svg`, `fruit-{id}.svg`.
