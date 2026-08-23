# Stores

Seed silo and additive store panels. Dialogs, not docks — [[ui/docks]]. Opened by a walk-up cue, never from the rail. Mechanics and caps: [[mechanics/inventory]]. Buildings: [[items/buildings]].

`src/game/ui/store.tsx` owns both. One `Shell` (Radix dialog + `Frame`) with an optional width.

Walking up deposits first, then the panel opens. The panel is a withdraw screen; there is no deposit control.

## Capacity line

`Capacity`: hint text left, then `Bar` and the count as one right-hand group. The bar is `bg-ripe`, `h-1.5 w-20` — small and touching the number it describes, not a full-width rule floating above the grid. Same line in both stores.

`Bar` lives in `frame.tsx`: `value` 0..1, `color` and `track` as palette classes, default `h-1.5`. Research cards use it too — gate progress `bg-roof`, run/done `bg-leaf` on `bg-ink/25`. The HUD day and research bars stay hand-rolled; `motion.ts` paints those every frame through `[data-day-bar]` / `[data-research-bar]` and must keep its own markup.

## Seed silo

Title **Seed silo**. Footer *Walking up stores every seed you were carrying.*

Width is `w-fit` inside `min-w-80 max-w-[min(calc(92vw-17rem),72rem)] max-h-[min(88vh,48rem)]`, so the panel grows with what is unlocked instead of carrying a width per shelf. The `17rem` subtracted from the viewport is the callout gutter: the panel may never grow so wide that the hover callout falls off screen. Past the max the grid scrolls inside `overflow-x-auto`, never the page.

Table. Columns are crops, rows are rarities. Column head is the crop icon over its name. Row head is the rarity name, then its gem.

Cells are `4.25rem` square with an `h-8` icon and the count under it — big enough to hit and to read a crop at a glance.

Shown columns: `world.skuShown('pack-{crop}')`, **or** the silo holds any rarity of that crop. Shown rows: every rarity except `heirloom`, which needs `unlock-heirloom` done **or** heirloom stock present. Stock is never hidden by a gate — the starter kit carries heirloom potato before the research exists, and a row the player cannot reach is worse than an early row.

`bg-dirt` with stock, `bg-ink/6` at zero and `aria-disabled`. Click → `takeSilo(crop, rarity)`, whole stack to hand.

No crops to show at all: *Empty. Seeds you buy are delivered here.*

## Rarity gems

`rarityInner(rarity)` in `svgs.ts`. Heirloom **is** the `unlock-heirloom` research icon (`skill-heirloom.svg`); uncommon and rare are that same gem with its `id="fill"` rect recolored to the `qualityPip` hues — `#6bc04a` and `#3d7ea6`. One drawing, three tints, so the silo and the research tree can never drift apart.

Common returns `undefined`: plain stock needs no badge. The row head still reads **Common**, so the label carries the meaning and the gem only decorates it — hence `{name} {gem}`, name first, at `h-4`. A gem large enough to compete with the crop icons would read as another thing to click.

## Hover

`CalloutHover` to the right of the dialog, the same component and position docks use — `Frame` takes an `aside` for it. Title is the crop name. Body is the pack price (`skuPrice`, per pack of 5) and the per-fruit stall price at **that cell's rarity**, `CROPS[crop].sale × raritySale(...)`. Hovering a rarity row is how a player compares what heirloom is worth against what it costs to start one.

Empty cells hover too. What a crop sells for is worth knowing before you own any.

## Additive store

Title **Additive store**. `w-[30rem]` — three fixed rows, nothing to grow into. Capacity line reads **Click to fill a bag.** and `{used} / {cap} L`.

One row per `ADDITIVE_IDS` — **Fertilizer**, **Synthetic fertilizer**, **Compost** — always all three, so an empty tank reads as empty rather than missing. Icon, label, stored liters right. `bg-ink/6` and `aria-disabled` at zero liters. Click → `takeAdditive(id)`, one bag to hand.

Footer names the delivery rule while the store is empty, then *Walking up empties any bag you were carrying back into the tanks.*

## Cue

`Cue` gains `{ kind: 'silo' | 'additives'; at }`. `App.Panel` gains the matching kinds and `cued(kind)` covers chest, silo, and additives everywhere a close has to `ackCue`. Closing acks. A map click while one is open closes it, same as chest.
