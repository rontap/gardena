# Recipe

Crafting shown as a picture. One component, three mounts. Rules [[mechanics/machines]]. Table `sim/recipe.ts`.

**Recipe** is a player-facing word. Defined here, used in the almanac heading.

No pop-up GUI. No ObjectHud. Nothing attaches to the machine — [[ui/machines]].

## Shape

`ui/recipe.tsx`. `Recipes({ view, size })`.

```
RecipeView = { kind: 'list'; machine: MachineId } | { kind: 'live'; craft: Craft }
```

`size` `'sm'` 24px faces, `'md'` 32px. Three columns per row.

| col | content |
|---|---|
| 1 | inputs stacked, face + amount |
| 2 | arrow, duration under it |
| 3 | the yield, face + amount |

Each slot is face + **name** + amount. Name is `faceName` — the same words as the held line, not an id. Amount: `units` bare digits, `liters` `{n}L` two decimals trimmed, `waste` `{n} waste`, `range` `{min}-{max}`.

Type: `sm` `text-sm`, `md` `text-base`. Time caption matches. Not `text-xs`.

Both mounts are `pointer-events-none`. No tooltip, no `title`, no hover state, no focusable node. Ever.

## Mounts

| where | view | size |
|---|---|---|
| Shop / Build callout — [[ui/shop]] | `list`, `machineOfSku(id)` | `sm` |
| Almanac Automation pane — [[ui/almanac]] | `list` | `md` |
| Bottom-right `Status` — [[ui/inspect]] | `live` | `md` |

Shop shows every recipe stacked, `divide-y divide-ink/10`, under `skuDesc`, above the gate line. Machine SKUs only. No reverse lookup from ingredients.

## List rows

Static. Arrow painted full. Duration is `{n} sec` — `clockText`, the recipe's nominal seconds, base, not divided by `machineMul`, matching the catalog blurbs. Not `m:ss`. Not `Xs`. Not `Xd`.

`any` inputs cycle their faces at `CYCLE_MS`. A `range` yield with `faces` shares that index: grinder fruit `i` shows seed `i`. One `useCycle` per row.

Counts from `sim/recipe.ts`. Do not retype.

| machine | rows |
|---|---|
| mill | `MILL_RECIPES` 5 — sugar-cane olive wheat grass vanilla. Vanilla: `MILL_VANILLA_IN` fruit → `MILL_VANILLA_OUT` extract. `millProductName('vanilla')` is **vanilla extract**. Grass name unchanged. |
| jam | `JAM_CROPS` 5. No apple. |
| still | `STILL_CROPS` 3 + mixed. Every still recipe carries `STILL_WATER` liters on the `water` face. Water is not an `Item`. Not `tap`. |
| barrel | `BARREL_CROPS` 2 — grape → wine `barrelNeed('grape')` 5, apple → cider `barrelNeed('apple')` 4. |
| grinder | 1 |
| compost-box | 3: any fruit → `COMPOST_LITERS`, then weed/grass → `COMPOST_LITERS`, then rotten (`CropClass` faces) → `COMPOST_LITERS`, amount `COMPOST_NEED / COMPOST_VALUE.rotten` (5) |

## Live row

One row. Machine empty → cycle every recipe at `CYCLE_MS`. Machine has a recipe → pin to it.

Live barrel pins the locked crop’s row (`BARREL_CROPS`: grape wine / apple cider). Empty barrel (`crop === 'none'`) cycles both.

| `Craft` | row | line under |
|---|---|---|
| `idle` | cycles | **Empty** |
| `filling` | pinned, short input shows `{have}/{need}` in `text-roof` bold | — |
| `paused` | pinned | **Paused by wire** |
| `thirsty` | pinned | **Needs water** |
| `working` | arrow fills `progress`, caption counts down | — |
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

The still holds one instance in two cells, so hovering either half binds the same machine and shows one row.

## Cycle

`ui/cycle.ts`. `useCycle(n)`, `CYCLE_MS` 800. `n < 2` runs no timer.

The one cadence. Callers: this component, `AnyJamFace` [[ui/contracts]], `PipePane` / `CropPane` / `TreePane` [[ui/almanac]].

Assumption: `useCycle` ignores `prefers-reduced-motion`, as the four call sites it replaced always did.

Assumption: live compost filling pins the fruit row; empty compost is idle and cycles all list rows.
