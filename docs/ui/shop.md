# Shop

Left [[ui/docks]] `Dock`. Title **General store**. `wide` — `w-[30rem]`. Type scale [[ui/type]].

Four tabs. Tab labels are single words; nothing wraps.

| tab | label | idle footer |
|---|---|---|
| `seeds` | Seeds | Sow on tilled soil. |
| `utility` | Utility | Tools and carry. |
| `automation` | Automation | Machines you place. |
| `building` | Building | Paving and fencing. Click as many tiles as you like, Escape when done. |

An empty tab reads *Nothing here yet. Research opens this shelf.* rather than a blank pane.

## Rows

One row per `skuShown` sku. The row **is** the button — no nested `Btn`, no separate hover target.

`skuInner` icon `h-7 w-7` | `skuLabel` `text-base` semibold, truncating | **placing** when armed | `Coin` price, right-aligned, `tabular-nums`.

| state | face | callout reason |
|---|---|---|
| `not-researched` | `bg-ink/6 text-ink/35`, icon at 40% | Needs the **{research name}** research |
| `cannot-afford` | same | Not enough money |
| `inventory-full` | same | No room in the inventory |
| `ok` | `bg-dirt`, `bg-ink` when armed | — |

The reason names the research by walking `SKUS[id].unlock` into `RESEARCH`. Never say "not researched" and leave the player guessing which one.

`inventory-full` is packs only (`seeds` and `grass-seeds`), when there is no merge slot and no empty house slot.

## Hover

[[ui/callout-hover]] to the right of the dock — the same place research and family put theirs. Title `skuLabel`, body `skuDesc`, then the blocking reason in bold `roof` when the row is not `ok`.

**Locked rows must hover.** A disabled `<button>` dispatches no pointer events, so blocked rows carry `aria-disabled` and a guarded `onClick` instead of the `disabled` attribute. The whole point of graying a row is telling the player what to do about it. Research cards and family offers do the same.

Footer is the tab's one-line description and nothing else.

Packs never arm. Place SKUs arm `World.place` — [[ui/place]].

Husband owns `bulk-buying`: seed row Ctrl+click calls `buyPacks(id)`, and the footer says so with the discounted `Coin`. Normal click stays `buy(id)`. Non-seed rows ignore Ctrl.

## Shelves

Utility runs shovel → better → rotary, pickaxe → better → diamond, then buckets, boxes, fertilizer. Tiers read down the list — [[items/tools]].

Seeds: `pack-carrot` `pack-potato` `pack-wheat` `pack-tomato` `pack-raspberry` `pack-watermelon` `pack-olive` `pack-grape` `pack-vanilla` `pack-sugar-cane`, then `pack-grass` — [[mechanics/plants]]. No sapling SKU. No berry.

Gates: `skuShown` / `skuOpen` from [[mechanics/research]] Shop gates. `pack-olive` show `unlock-tomato` buy `unlock-olive`. `pack-grape` show `start` buy `unlock-grape`. `pack-raspberry` show `unlock-grape` buy `unlock-raspberry`. `pack-vanilla` show `unlock-raspberry` buy `vanilla-tending`. Locked copy: “You need to earn the Vanilla tending skill.” `pack-sugar-cane` show + buy `unlock-fermentation`.

Building is `buy-fence` then cobble / brick / paved, cheapest paving first — [[items/tiles]].

Automation includes `buy-compost-box` (gated) plus rain-tank, tap, valve, sprinklers, well, pumpjack, chest, grinder.
