# Stores

Seed silo and additive store panels. Dialogs, not docks — [[ui/docks]]. Opened by a walk-up cue, never from the rail. Mechanics and caps: [[mechanics/inventory]]. Buildings: [[items/buildings]]. Station reuses `Shell` — [[ui/station]].

`src/game/ui/store.tsx` owns both stores. One `Shell` (Radix dialog + `Frame`) with an optional width.

Walking up deposits first, then the panel opens. The panel is a withdraw screen; there is no deposit control.

## Capacity line

`Capacity`: hint text left, then `Bar` and the count as one right-hand group. The bar is `bg-ripe`, `h-1.5 w-20` — small and touching the number it describes, not a full-width rule floating above the grid. Same line in both stores.

`Bar` lives in `frame.tsx`: `value` 0..1, `color` and `track` as palette classes, default `h-1.5`. Research cards use it too — gate progress `bg-roof`, run/done `bg-leaf` on `bg-ink/25`. Station progress uses that run `Bar`. The HUD day and research bars stay hand-rolled; `motion.ts` paints those every frame through `[data-day-bar]` / `[data-research-bar]` and must keep its own markup.

## Seed silo

Title **Seed silo**. Footer *Walking up stores every seed you were carrying.*

Width is `w-fit` inside `min-w-80 max-w-[min(calc(92vw-17rem),72rem)] max-h-[min(88vh,48rem)]`, so the panel grows with what is unlocked instead of carrying a width per shelf. The `17rem` subtracted from the viewport is the callout gutter: the panel may never grow so wide that the hover callout falls off screen. Past the max the grid scrolls inside `overflow-x-auto`, never the page.

Table with a crop head row. Columns are crops; the `thead` cell carries the crop's `'base'` ripe face at `h-9` over the crop name in `text-[11px] text-ink/60`, so a column is read by its crop before anything under it.

There is no shared row ladder and no row-head `tier` label — Variety is identity, not a ladder, so nothing labels a row. Each column stacks `VARIETIES[crop]` in list order. Row 0 is `'base'` on every shown crop. Later rows are that crop's later ids; a crop with fewer Varieties leaves the cell empty, not a dummy. Rows therefore mix tiers across columns, which is correct: row 1 is one crop's variant and another's heirloom.

A `'base'` cell carries no name — the crop head already names it. Every other cell names its Variety.

Cells are `4.25rem` wide and `5.5rem` tall, with a `shrink-0` `h-8` icon, the Variety name, and the count under it. Height is set by the tallest cell a Variety name can make — two lines — so the icon keeps its size and its inset in every cell instead of being squeezed against the top edge. Face is that Variety's group. No extra mark.

Shown columns: `world.skuShown('pack-{crop}')`, **or** the silo holds any Variety of that crop. Shown cells: `'base'` always on a shown crop. Any other Variety: stock of that Variety. Stock is never hidden by a gate.

`bg-dirt` with stock, `bg-ink/6` at zero and `aria-disabled`. Click → `takeSilo(crop, variety)`, whole stack to hand. Identity is crop + Variety; Quality is the stack average.

Buy row directly under the crop head, above the Variety stacks — the price to restock a column sits with the column's name, not at the far end of a grid that grows every time a Variety is earned. One cell per shown crop that has a `pack-*` SKU. Cell width matches the column (`4.25rem`). Face: same three-state as additive **Buy** — `rowState` / `gateLine`. Click → `world.buy(packSku)`. Ctrl+click → `world.buyPacks(packSku)` when `buyPacksFail` is not `'Locked'`; else plain `buy`, same as shop. Failed afford / fit / closed: no-op. Vanilla has no pack: no Buy. Bought seed is `'base'`, Quality 0. Hover / focus of a Buy cell renders the crop `SeedTip` plus the bulk `Coin` from `packsPrice` when bulk is legal, and `gateLine` in `text-roof` when grey — [[ui/callout-hover]] [[ui/shop]].

No crops to show at all: *Empty. Seeds you buy are delivered here.*

## Hover

`CalloutHover` to the right of the dialog, the same component and position docks use — `Frame` takes an `aside` for it.

| tip | title | body |
|---|---|---|
| stock cell | Variety name | **Quality {n}%**; pack price (`skuPrice`, per pack of 5) when a pack exists; **Sells for** `{Coin}` **each** at `CROPS[crop].sale × qualityMul(quality) × RATING_SALE[use.fresh]` |
| Buy cell | crop name | pack price, bulk `Coin`, `gateLine` when grey. Quality 0, Variety `'base'` |

Empty cells hover too. What a Variety sells for at Quality 0 is worth knowing before you own any.

Shop seed cards use the same Variety + Quality words. Pack is `'base'` at Quality 0.

## Additive store

Title **Additive store**. `w-[30rem]` — five rows, nothing to grow into. Capacity line reads **Click to fill a bag.** and `{used} / {cap} L`.

One row per `ADDITIVE_IDS` then one for **Sugar** — **Fertilizer**, **Synthetic fertilizer**, **Compost**, **Weed spray**, **Sugar** — always all five, so an empty tank reads as empty rather than missing. Icon, label, stored liters right. `bg-ink/6` and `aria-disabled` at zero liters. Click → `takeAdditive(id)`, or `takeSugar()` on the sugar row, one bag to hand. Sugar draws `SUGAR_BAG`, not `ADDITIVE_BAG` — [[mechanics/inventory]].

Each row that has a SKU (`ADDITIVE_SKU`: fertilizer, synth, weed-spray, sugar; compost is `'none'` and gets no button) carries a `w-20` **Buy** button at its right end, `Coin` price under the word, same three-state face as the dispense row. Click → `world.buy(sku)`, which delivers straight to these tanks. State and grey-out come from `rowState` / `gateLine` — the panel never re-derives afford or capacity. Hover or focus renders `AdditiveTip` as the `Shell aside`: label, price, liters delivered, and the `gateLine` reason in `text-roof` when the button is grey — [[ui/callout-hover]] [[ui/shop]].

Footer names the delivery rule while the store is empty, then *Walking up empties any bag you were carrying back into the tanks.*

## Cue

```
Cue |=
  | { kind: 'silo'; at: Coord }
  | { kind: 'additives'; at: Coord }
  | { kind: 'station'; at: Coord }
```

`App.Panel` gains the matching kinds and `cued(kind)` covers chest, silo, additives, hangar, vehicle, and station everywhere a close has to `ackCue`. Closing acks. A map click while one is open closes it, same as chest.
