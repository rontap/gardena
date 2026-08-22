# Beta-2 UI

**Historical.** Current law: [[ui/beta-3]], [[ui/place]].

See [[mechanics/beta-2]], [[architecture/beta-2]], [[art/beta-2]]. Beta-1 chrome holds except below.

Copy adds **Drop**, **not researched**, **unlock all instantly**, **Sell** on fruit slots. Beta-1 strings otherwise unchanged. Typo “cannot affort” is **cannot afford**.

## Tokens

Beta-1 `@theme` tokens stay. Buttons are `bg-dirt` / `bg-dirt-dark`. No ink border.

## Regions

| region | where | contents |
|---|---|---|
| HUD | top, full width | money, day, remaining, research, **Shop**, **Research**, **Market** |
| Shop | left dock | SKU buttons. Not a dialog. |
| Research / Market | right dock | one at a time. Not a dialog. No modal overlay. |
| Status | bottom-left | two stacked panes: **hand** then **look** |
| Queue | above status, same stack | `w-80`, `Chrome`, gap-3 from status |
| Inventory / Recap | centered Dialog | stay dialogs |
| Map | rest | 48px tiles |

`user-select: none` on `html`, `body`, `#root`.

No `border-ink` / black stroke. Shop, Research, Market, Status, Queue use `Chrome`. Left stack is `fixed bottom-4 left-4 w-80 flex-col gap-3`: Queue then Status.

## Status

`src/game/ui/status.tsx`. Bottom-left. Two panes. `Chrome` (same header/rail as HUD). Copy from `heldText` / `lookText` only.

| pane | render |
|---|---|
| hand | item art 48px + `heldText(hand)` |
| look | `lookText(world, hover)` |

Empty hand: **Nothing in hand**. No hover: **—**.

No on-tile prompt text. No cursor chip. No drop tooltip. Tile hover is a stroke only. Place: 32px ghost follows the pointer. See [[ui/place]].

Map reports `hover` up to App.

## Held copy

`heldText` in `src/game/sim/item.ts`. Crop name = crop id with first letter upper.

| item | line |
|---|---|
| shovel | `Shovel - {usesLeft}/{uses} uses left` |
| better-shovel | `Better shovel - {usesLeft}/{uses} uses left` |
| seeds | `{Crop} seed - {count}, plant it` |
| fruit | `{Crop} - {count}, sell it` |
| bucket | `Bucket - {liters}/{capacity}L` |
| large-bucket | `Large bucket - {liters}/{capacity}L` |
| box empty | `Box - empty` |
| box stack seeds | `Box - {Crop} seed {count}/{cap}` |
| box stack fruit | `Box - {Crop} {count}/{cap}` |
| empty | `Nothing in hand` |

## Look copy

`lookText(world, at)` in `src/game/sim/look.ts`. Lines joined by `\n`.

| cell | line |
|---|---|
| off-map / none | `—`, or `Place {skuLabel}` if `place.kind === 'sku'` |
| house | `House` |
| pump | `Pump` |
| untilled | `Grass` |
| empty | `Tilled soil` |
| growing | `{Crop} - growing {floor(maturity*100)}%, water {floor(thirst*100)}%` |
| ripe | `{Crop} - ripe, water {floor(thirst*100)}%` |
| dead | `{Crop} - dead` |
| drop on cell | extra line `heldText` of the top drop (treat as hold) |
| always, if prompt | extra line `prompt.text` |

## Clicks

| pointer | condition | ui |
|---|---|---|
| left | house / inventory prompt | enqueue `{ act: 'inventory' }`. Do not open now. |
| left | `World.cue.kind === 'inventory'` | `panel = inventory`, `ackCue()` |
| right | `place.kind === 'sku'` | `place = none` |
| right | Plot and hand hold | enqueue `{ act: 'drop'; at }`. Not instant. |
| left | fruit **Sell** in inventory | `World.sellSlot(i)` |

Other Beta-1 click rows stay.

## Shop

Left dock. Not Radix Dialog. Title **Shop**. `w-72`. Sits above the status stack.

Every SKU in the architecture order. Each row is a **Btn**.

| row | look | hover | click |
|---|---|---|---|
| not-researched | greyed disabled button | **not researched** | no-op |
| cannot-afford | greyed disabled button | **cannot afford** | no-op |
| inventory-full | greyed | **inventory-full** | no-op |
| else | idle / hover button | none required | Beta-2 shop action |

Locked SKUs stay visible. Grey = disabled Btn, not removed.

## Research

Right dock. Not a dialog. No overlay. **unlock all instantly** at the top. Click → `World.unlockAll()`.

Rows still one job at a time. Running row is Progress. Clicking another idle row while running is no-op.

## Market

Right dock. Not a dialog. No overlay. Same sell confirm.

## Inventory

Slot click ↔ swap, then compact.

Fruit slot: **Sell** button on the slot. Sells that stack. Hand pane is the status panel.

## Buttons

`Btn`: rustic, quiet. `bg-dirt` face, `bg-dirt-dark` hover, `cursor-pointer`, disabled `opacity-50 cursor-default`. Text `text-ink`. **No `border-ink`.** Thin `ui-header` strip on the top edge only (not a stretched slab). Padding `px-3 py-2`. Full-width rows in docks.

Shop / Research / Market docks: `absolute top-3 left-3` / `right-3`. Not flush. App shell `overflow-hidden`. Map `absolute inset-0 overflow-hidden`.

Shop row label = `skuLabel(id)` + ` $` + price:

| SKU | label |
|---|---|
| `pack-*` | `{Crop} seeds` |
| `buy-shovel` | `Shovel` |
| `buy-better-shovel` | `Better shovel` |
| `buy-bucket-large` | `Large bucket` |
| `buy-box` | `Box` |
| `buy-box-large` | `Large box` |
| `buy-pumpjack` | `Pumpjack` |

## Map

Tile **48px** at scale 1.

Untilled: one baked grass string (`tile-grass-{tileVariant(col,row,5)}`). Not 1536 React nodes. Not a map-sized pattern. Not remounted on tick.

`empty` / `growing` / `ripe` / `dead`: `tile-dirt-{tileVariant(col,row,2)}` under the crop. Not flat `dirt` / `dirt-dark` rects.

No `overlay-water.svg` in the tree.

Plant thirst bar unchanged (`thirst < 0.5`).

Camera clamp / wheel / pan unchanged. Start still `{ x: 15.5, y: 3.5, scale: 1 }`.

## Files

`hud.tsx` `status.tsx` `held.tsx` `shop.tsx` `research.tsx` `market.tsx` `inventory.tsx` `recap.tsx` `queue.tsx` `frame.tsx`

`look.ts` `motion.ts`

Status and Queue are not HUD children. They share one left stack.
