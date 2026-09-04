# Recipe

Crafting shown as a picture. One component, four mounts. Rules [[mechanics/machines]]. Table `sim/recipe.ts`.

**Recipe** is a player-facing word. Defined here, used in the almanac heading.

No pop-up GUI. No ObjectHud. Nothing attaches to the machine — [[ui/machines]]. Station is not a `MachineId` and has no mount here — [[ui/station]].

## Shape

`ui/recipe.tsx`. `Recipes({ view, size })`.

```
RecipeView =
  | { kind: 'list'; machine: MachineId }
  | { kind: 'one'; recipe: Recipe }
  | { kind: 'live'; craft: Craft }

MachineId = 'mill' | 'jam' | 'still' | 'barrel' | 'grinder' | 'compost-box' | 'furnace'

Recipe = {
  machine: MachineId
  inputs: readonly Ingredient[]
  out: Yield
  duration: Duration
}
```

A `one` fruit / seed / jam face carries `variety`. `recipesUsing(face)` matches crop + Variety on a `one` input. Almanac Ingredients follows that list — [[ui/almanac]]. `any` inputs do not pin a Variety.

`size` `'sm'` 24px faces, `'md'` 32px. Three columns per row.

| col | content |
|---|---|
| 1 | inputs stacked, face + amount |
| 2 | arrow, duration under it |
| 3 | the yield, face + amount |

Each slot is face + **name** + amount. Name is `faceName` — the same words as the held line, not an id. Amount: `units` bare digits, `liters` `{n}L` two decimals trimmed, `waste` `{n} waste`, `range` `{min}-{max}`.

Type: `sm` `text-sm`, `md` `text-base`. Time caption matches. Not `text-xs`.

Every mount is `pointer-events-none`. No tooltip, no `title`, no hover state, no focusable node. Ever. Almanac Ingredients plates are the hover target, not this component.

## Mounts

| where | view | size |
|---|---|---|
| Shop / Build callout — [[ui/shop]] | `list`, `machineOfSku(id)` | `sm` |
| Almanac Automation pane — [[ui/almanac]] | `list` | `md` |
| Almanac Overlay Ingredients callout — [[ui/almanac]] | `one` | `sm` |
| Bottom-right `Status` — [[ui/inspect]] | `live` | `md` |

Shop shows every recipe stacked, `divide-y divide-ink/10`, under `skuDesc`, above the gate line. Machine SKUs only. No reverse lookup from ingredients.

Almanac crop / tree Ingredients is the reverse lookup: `recipesUsing(face)` on that Variety's fruit, then `one` in the Overlay callout. `one` is that recipe's row, same three columns as `list`. Hover `Coin` bakes `unitSale` at Quality 0 × that path's `RATING_SALE`.

## List rows

Static. Arrow painted full. Duration is `{n} sec` — `clockText`, the recipe's nominal seconds, base, not divided by `machineMul`, not multiplied by `furnaceMul`, matching the catalog blurbs. Not `m:ss`. Not `Xs`. Not `Xd`.

`any` inputs cycle their faces at `CYCLE_MS`. A `range` yield with `faces` shares that index: grinder fruit `i` shows seed `i`. One `useCycle` per row.

Counts from `sim/recipe.ts`. Do not retype. Rows that pin a Variety carry that Variety on the `one` face.

| machine | rows |
|---|---|
| mill | one `one` row per crop × Variety the mill accepts (`preserve` not `'none'`). Grass unchanged. Vanilla: `MILL_VANILLA_IN` fruit → `MILL_VANILLA_OUT` extract. `millProductName('vanilla')` is **vanilla extract**. |
| jam | one `one` row per Variety the jam accepts (`preserve` not `'none'`). No apple. Named jars below. Base tomato keeps **Ketchup**. |
| still | one `one` row per Variety with `alcohol` not `'none'`, plus mixed `any`. Every still recipe carries `STILL_WATER` liters on the `water` face. Water is not an `Item`. Not `tap`. |
| barrel | one `one` row per Variety with `alcohol` not `'none'` on grape / apple. Grape → wine `barrelNeed('grape')`, apple → cider `barrelNeed('apple')`. |
| grinder | 1. `any` faces: annual fruit plus tree fruit. Yield seeds / tree-seed at `'base'` when the input `tier` is `heirloom` or the input is tree fruit; else same Variety. Quality carries. |
| compost-box | 4: any fruit → `COMPOST_LITERS`, then weed/grass → `COMPOST_LITERS`, then rotten (`CropClass` faces) → `COMPOST_LITERS`, amount `COMPOST_NEED / COMPOST_VALUE.rotten` (5), then ash `one` → `COMPOST_LITERS`, amount `COMPOST_NEED / COMPOST_VALUE.ash`. Variety ignored. |
| furnace | 6: green `any` (includes graft), fruit `any`, sugar `one`, oil `one`, spirit `any`, wood `one`. All yield `FURNACE_ASH` ash. Duration `fixed` `FURNACE_SECONDS`. Mix; no recipe lock. Item counts `FURNACE_NEED / FURNACE_VALUE.*`. Variety and Quality ignored. |

### Named jam

`faceName` of the jar. Five Varieties have a product of their own; every other Variety falls back to the plain jam of its crop; base tomato keeps **Ketchup**.

| variety | jam reads |
|---|---|
| `concord` | **Grape jelly** |
| `black-raspberry` | **Black raspberry jam** |
| `montmorency` | **Sour cherry preserve** |
| `blenheim` | **Blenheim apricot jam** |
| `san-marzano` | **Passata** |
| tomato `'base'` | **Ketchup** |
| else | `{Crop} jam` |

## Live row

One row. Machine empty → cycle every recipe at `CYCLE_MS`. Machine has a recipe → pin to it, including the locked Variety.

Live barrel pins the locked crop + Variety row. Empty barrel (`crop === 'none'`) cycles the barrel list.

Live mill / jam / grinder pin the locked Variety. Empty (`'none'`) cycles.

Live furnace empty (`units === 0`) cycles all list rows. Filling / working / ready pin the first list row; `have` / `need` stay furnace units (`FURNACE_NEED`). No `thirsty`. `inn === 1` and `units > 0` → **Paused by wire**.

| `Craft` | row | line under |
|---|---|---|
| `idle` | cycles | **Empty** |
| `filling` | pinned, short input shows `{have}/{need}` in `text-roof` bold | — |
| `paused` | pinned | **Paused by wire** |
| `thirsty` | pinned | **Needs water** |
| `working` | arrow fills `progress`, caption counts down (tick rate: `machineMul × furnaceMul` on `work`, `furnaceMul` on `fixed`) | — |
| `ready` | arrow full | **Output blocked** |

`filling.at` indexes `recipe.inputs`. Jam reports fruit first, then sugar. That index is data, not a guess.

## Arrow

`ui-arrow-right.svg`, groups `ink` `fill` — [[art/svg]]. `UI_ARROW_INK` / `UI_ARROW_FILL`.

Track is `ink` at `opacity-25`. Over it a clipped span of width `progress`, holding `ink` then `fill`. A left-to-right wipe. `preserveAspectRatio="none"`.

Not a `Bar`. `Bar` is a Radix Progress rectangle — wrong shape, wrong meaning.

No keyframes, no transition. Reduced motion is not a concern for the arrow.

## Per-frame paint

`progress` moves every tick and React does not re-render every tick — [[ui/hud]]. The live arrow and its caption are painted by `paintMotion`, not React.

`bindCraft(cell)` from the live mount, `bindHud('craft-fill' | 'craft-time', el)` on the two nodes. `data-craft-fill` / `data-craft-time`. React renders the same values so the first frame is right. Change the markup here and change `motion.ts` too.

`idle` is not painted imperatively — the cycle is React's.

The still holds one instance in two cells, so hovering either half binds the same machine and shows one row. Furnace: either cell of the 1×2, one row.

## Cycle

`ui/cycle.ts`. `useCycle(n)`, `CYCLE_MS` 800. `n < 2` runs no timer.

The one cadence. Callers: this component, `AnyJamFace` [[ui/contracts]], `PipePane` / CropPane plant stages / TreePane stages [[ui/almanac]]. Variety row does not cycle.

Assumption: `useCycle` ignores `prefers-reduced-motion`, as the four call sites it replaced always did.

Assumption: live compost filling pins the fruit row; empty compost is idle and cycles all list rows. Live furnace filling pins the first list row.
