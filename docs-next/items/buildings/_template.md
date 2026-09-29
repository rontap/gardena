# {Building}

| | |
|---|---|
| SKU | `buy-{id}` (Build tab `{tab}`), or starting building |
| price | `SKUS['buy-{id}'].price` |
| size | {w} × {h} tiles (`SKU_FOOT`) |
| unlocked by | {research id} |
| demolish | yes / no |
| cell kind | `'{kind}'` |

{One or two sentences: what the player uses it for.}

## Use

{What the player does with it: walk-up panel, hand input, what it holds or makes.}

## Recipe

{Machines only. Inputs and outputs with links to [[items/…]]; batch size and time by constant name.}

| input | amount | output | time |
|---|---|---|---|
| [[items/crops/{id}]] | `{CONSTANT}` | [[items/produce/{id}]] | `{CONSTANT}` |

## Connections

{Chest input and output sides, vehicle loading spots, signal input or output. Rules in [[systems/building-io]].}

## Screen

{Prompts, hover line, panel.}

## Art

`src/assets/props/{file}.svg`, groups.

## Sound

{Which actions on it play a sound, by cue ([[systems/sound]]). Leave the section out when none does.}
