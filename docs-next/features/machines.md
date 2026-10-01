# Machines

Code: `feature-machines/` (`machine.ts`, `recipe.ts`, `machines.tick.ts`, `machines.emit.ts`, `machines.helpers.ts`), machine classes in `building.ts`, `ui/recipe.tsx`, `ui/station.tsx`, `view/meter.ts` (the working bar); see [[code-map]].
Unlocked: each machine by its own research ([[features/research]]).

## Purpose

Machines turn crops and farm waste into goods that sell for more than the raw fruit, into bags the farm uses (compost, fuel), and into seeds. They let the player sell a harvest in a different form, and make Named and Heirloom varieties worth more on the use they are best for.

## Where the recipes are

Each machine's page in `items/buildings/` holds that machine's recipes: inputs, amounts, output and time. Item pages do not list the machines that use them. This page holds the rules every machine shares.

| machine | page | recipe kind | intake |
|---|---|---|---|
| Mill | [[items/buildings/mill]] | work | locked |
| Jam machine | [[items/buildings/jam-machine]] | work | locked |
| Grinder | [[items/buildings/grinder]] | work | locked |
| Pot still | [[items/buildings/still]] | fixed | mixed |
| Compost box | [[items/buildings/compost-box]] | fixed | pooled |
| Furnace | [[items/buildings/furnace]] | fixed | pooled; locked for bread |
| Infuser | [[items/buildings/infuser]] | fixed | locked |
| Refueling station | [[items/buildings/refueling-station]] | fixed | pooled |
| Barrel | [[items/buildings/barrel]] | age | locked, by hand only |

The research station and the Sorter are buildings with a tick but no recipe: [[items/buildings/research-station]], [[items/buildings/sorter]].

## Rules

### Three recipe kinds

`Recipe.duration` is one of three kinds. They differ in what makes them faster and in what the player does at the end.

| kind | time per batch | sped up by | end |
|---|---|---|---|
| `work` | `seconds` ÷ (machine speed × furnace speed-up) | `machinery` skill and working Furnaces nearby | product is put out and the next batch starts |
| `fixed` | `seconds` ÷ furnace speed-up | working Furnaces nearby | product is put out and the next batch starts |
| `age` | `seconds`, then keeps aging | nothing | the player collects by hand; value rises with age |

- Machine speed (`machineMul`): 1 + 0.05 × the `machinery` skill rank.
- Furnace speed-up (`furnaceMul`): 1 + `FURNACE_HASTE` for each Furnace that is burning and has a tile within `FURNACE_REACH` tiles (Chebyshev distance) of the machine's footprint. A Furnace does not speed itself up.

### Three ways a machine takes input

- **Locked.** The first item put in fixes the recipe, the crop and the variety. The machine refuses anything else until it is empty. Quality is averaged over everything put in, weighted by count, and the product carries that quality.
- **Mixed.** The Pot still takes any of its crops and varieties; the batch's result depends on what is in it ([[items/produce/spirit]]).
- **Pooled.** Each accepted item adds points by a value table (`COMPOST_VALUE`, `FURNACE_VALUE`, `FUEL_WORTH`). When the points reach the batch size, one batch runs. The product does not depend on which items made the points.

### States

A machine's state (`Craft`, from `craftState`) is shown on its panel and hover line:

```
            item put in             enough for a batch
  idle  ------------------>  filling  ------------------>  working  ----> product put out
                                 ^                            |               |
                                 |      signal input on       v               |
                                 +--------------------------  paused          |
                                                                              v
                                                     next batch, or idle when empty

  ready     output waiting: chest full, no free plot, or a Barrel waiting to be collected
  thirsty   Pot still full but its water network cannot give `STILL_WATER` L (shown as Needs water)
```

While `craftState` is `working`, the Mill, Jam machine, Grinder, Pot still, Compost box, Furnace and Infuser draw a bar along the bottom of the footprint. The fill is that craft's `progress`. Idle, filling, paused, thirsty and ready draw no bar. The list is `METERED` in `view/meter.ts`. The bar is redrawn each frame.

### Input and output

Hand input, input from a chest on the left of the bottom row, output to a chest on the right or onto a free plot, and vehicle loading spots: [[systems/building-io]]. When the output has nowhere to go, the machine keeps the finished batch and waits.

A machine with a signal input stops starting and advancing batches while that input is on ([[systems/signals]]). Filling continues.

### Infusion

The Infuser sets `infused` on jam, spirits, wine and cider, olive oil, and Extract. Each good takes two of the reagents vanilla extract, flakes, Truffle extract and Fly agaric (`INFUSE_REAGENTS`, [[items/buildings/infuser]]). An infused item keeps the quality and `unitSale` of the good that went in, and stacks separately from the plain good. An infused jam, cask, spirit or oil has two outcomes:

1. **Market: a fixed price drop.** Infused units of a good all sell at the price drop that good had when the drop-off started, and leave it as it is, so any number of infused units sells at one price (`marketQuote`, [[features/market]]).
2. **Contracts: more reputation.** Infused units count toward a contract like plain ones. On completion, reputation gained is multiplied by 1 + 0.25 × (infused units delivered ÷ units required) ([[features/contracts]]).

Infused Extract is not sold. Poured on a plant, sapling or stump, it speeds up growth for `EXTRACT_INFUSED_SECONDS` instead of `EXTRACT_SECONDS` ([[items/produce/extract]]).

### Familiarity

The research station studies fruit. Each fruit studied raises the crop's familiarity (`World.familiarity`) by `FAMILIARITY_GAIN` of its variety tier, up to `familiarityMax(crop)`. The step that reaches `familiarityMax` grants `FAMILIARITY_POINT` skill points, once per crop (`GROWN_IDS`, 13 crops). A later study of a crop already at the cap grants nothing. Loading a save does not grant it again: familiarity is stored, and the points already paid are stored with it. Familiarity raises the chance of a better variety at ripening ([[features/plants]]) and the quality of bought seeds ([[features/inventory]]).

## Screen

- Recipe panel (`recipe.tsx`): for a machine, `recipesOf(machine)`; for an item, `recipesUsing(item)` across all machines. Rows of one crop that make the same product are shown as one row with several fruit faces.
- Hover line per machine (`look.ts`): its state and contents.
- Prompts with a matching item in hand (`prompt.ts`): **Crush into {name}**, **Crush into flakes**, **Make jam** / **Make {jar name}**, **Fill sugar**, **Distill**, **Fill barrel**, **Collect {name}**, **Grind**, **Compost**, **Burn**, **Bake**, **Infuse**, **Fill**, **Study**; see each machine's page.

## Guest

A guest can put items into machines and collect from them.

## Save and sync

Each machine's contents, lock, quality and progress are saved with its cell. The digest carries the lock of the Mill, jam machine, Infuser and Furnace, and the Refueling station's contents.

## Sound

Putting an item into any machine plays one load sound: lid open, item in, lid shut. A machine working and a batch put out push their own cues (`machineLoop`, `machineOnce`), one working cue per machine kind ([[systems/sound]]).

## Invariants

| id | rule | test |
|---|---|---|
| — | a machine with its signal input on does not advance; hand and vehicle input still fill it | `plants.test.ts` |
| `machines.grinder-io` | the Grinder has a signal input that pauses it, and loading spots: fruit in, seeds out | `machine.test.ts` |
| — | Furnace: `FURNACE_NEED` units burn in `FURNACE_SECONDS` into `FURNACE_ASH` ash; leftover units stay | `machine.test.ts` |
| — | Mill: `MILL_IN` cane makes `SUGAR_BAG` L of sugar | `plants.test.ts` |
| — | Pot still starts only when its water network gives the full `STILL_WATER` | `plants.test.ts` |
| `familiarity.point` | reaching `familiarityMax` grants `FAMILIARITY_POINT` once per grown crop; 13 crops grant 13 | `plants.test.ts`, `machine.test.ts` |
| — | `METERED` machines show `progress` only while `craftState` is `working` | `meter.test.ts` |

## When you change this

- New machine: [[howto/add-building]]; a `MachineId`, recipes in `recipe.ts`, a `Craft` function, a page in `items/buildings/`, a row in the table above.
- New recipe on an existing machine: its `accept` / `apply`, its recipe row, the product's item page ([[items/_index]]).
- Speed rules: the recipe panel's time labels use `recipeSeconds`; keep them equal to the tick code.
- The working bar: add the machine's `MachineId` to `METERED`. Its `craftState` must report `working` with `progress`.
