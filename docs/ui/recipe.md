# Recipe

Crafting shown as a picture. One component, four mounts. Rules [[mechanics/machines]] `machines.recipe-source` `machines.recipe-collapse`. Table `sim/recipe.ts`.

**Recipe** is a player-facing word. Defined here, used in the almanac heading.

No pop-up GUI. No ObjectHud. Nothing attaches to the machine — [[ui/machines]]. Station is not a `MachineId` and has no mount here — [[ui/station]]. Infuser is a `MachineId`. Infused yield faces draw overlay-infused — [[mechanics/infusion]] `infusion.overlay`.

## Shape

`Recipes({ view, size })`. `list` is every recipe of a machine. `one` is a single recipe. `live` is the hovered machine's craft.

A `one` fruit / seed / jam face carries `variety`. `recipesUsing(face)` matches crop + Variety on a `one` input. Almanac Ingredients follows that list — [[ui/almanac]]. `any` inputs do not pin a Variety.

`size` `'sm'` / `'md'`. Three columns per row: inputs, arrow + duration, yield. The row does not wrap. Names truncate. Cycle never changes row height. Each slot is face + **name** + amount. Name is `faceName` — the same words as the held line. Amount: `units` bare digits, `liters` `{n}L` `Math.visualRound`, `waste` `{n} waste`, `range` `{min}-{max}`. Duration caption `clockText` uses `Math.visualRound`.

Every mount is not a hover target. No tooltip. Almanac Ingredients plates are the hover target, not this component.

## Mounts

| where | view | size |
|---|---|---|
| Build callout — [[ui/build]] | `list`, `machineOfSku(id)` | `sm` |
| Almanac Automation pane — [[ui/almanac]] | `list` | `md` |
| Almanac Overlay Ingredients callout — [[ui/almanac]] | `one` | `sm` |
| Bottom-right `Status` — [[ui/inspect]] | `live` | `md` |

Build shows every recipe stacked under `skuDesc`, above the gate line. Machine SKUs only. No reverse lookup from ingredients.

Almanac crop / tree Ingredients is the reverse lookup: `recipesUsing(face)` on that Variety's fruit, then `one` in the Overlay callout. Hover `Coin` bakes `unitSale` at Quality 0 × that Variety's `purposeMul` on that path.

## List rows

Static. Arrow painted full. Duration is `{n} sec` — `clockText`, the recipe's nominal seconds, base, not divided by `machineMul`, not multiplied by `furnaceMul`. Row counts and inputs: [[mechanics/machines]] `machines.recipe-source`. Named jam titles and **Premium** casks from `faceName` / `caskName` — [[mechanics/machines]] `machines.cask-premium`.

`any` inputs cycle their faces at `CYCLE_MS`. A `range` yield with `faces` shares that index: grinder fruit `i` shows seed `i`. One `useCycle` per row.

Still water is an input of `STILL_WATER` liters on the `water` face. Water is not an `Item`. Not `tap`. Infuser yield face overlay-infused. One reagent, not both.

## Live row

One row. Machine empty → cycle every recipe at `CYCLE_MS`. Machine has a recipe → pin to it, including the locked Variety.

Live barrel pins the locked crop + Variety row. Empty barrel (`crop === 'none'`) cycles the barrel list. Live mill / jam / grinder pin the locked Variety. Empty (`'none'`) cycles. Live furnace empty (`units === 0`) cycles all list rows; filling / working / ready pin the locked recipe. Live infuser empty (`lock === 'none'`) cycles; filling / working / ready pin the locked good. Live compost filling pins the fruit row; empty compost is idle and cycles all list rows. `filling.at` indexes `recipe.inputs`. Jam reports fruit first, then sugar. Infuser reports the good first, then the reagent.

| `Craft` | row | line under |
|---|---|---|
| `idle` | cycles | **Empty** |
| `filling` | pinned, short input shows `{have}/{need}` | — |
| `paused` | pinned | **Paused by wire** |
| `thirsty` | pinned | **Needs water** |
| `working` | arrow fills `progress`, caption counts down (tick rate: `machineMul × furnaceMul` on `work`, `furnaceMul` on `fixed`) | — |
| `ready` | arrow full | **Output blocked** |

The still holds one instance in two cells, so hovering either half binds the same machine and shows one row. Furnace: either cell of the 1×2, one row. Infuser: any of four cells of the 2×2, one row.

## Arrow

`ui-arrow-right.svg`, groups `ink` `fill` — [[art/svg]]. Track is `ink` faded. Over it a clipped span of width `progress`. A left-to-right wipe. Not a `Bar`. No keyframes.

## Per-frame paint

`progress` moves every tick and React does not re-render every tick — [[ui/hud]]. The live arrow and its caption are painted by `paintMotion`, not React. `bindCraft(cell)` from the live mount. React renders the same values so the first frame is right. `idle` is not painted imperatively — the cycle is React's.

## Cycle

`ui/cycle.ts`. `useCycle(n)`, `CYCLE_MS`. `n < 2` runs no timer. The one cadence. Callers: this component, `AnyJamFace` [[ui/contracts]], `PipePane` / CropPane plant stages / TreePane stages [[ui/almanac]]. Variety row does not cycle. `useCycle` ignores `prefers-reduced-motion`.
