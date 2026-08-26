# Shop

Two left [[ui/docks]] `Dock`s over one catalogue. **General store** is what you buy; **Build** is what you place — [[ui/build]]. Both are the same widget: search, a vertical category rail, a card grid, a [[ui/callout-hover]] in `aside`. Both are `w-[28rem]`. Type scale [[ui/type]].

Title **General store**. Rail button **Shop**. Categories are a vertical rail, same as [[ui/build]] — one tab shape for the whole system. Single-word labels; nothing wraps.

| tab | idle footer |
|---|---|
| Seeds | Sow on tilled soil. |
| Tools | Tools and carry. |
| Supplies | Feeds go to the additive store. Sugar and weed spray to your hands. |

A tab with no `skuShown` sku is not rendered at all — the shelf appears when research opens it, and never reorders. With no tab left, the pane reads *Nothing here yet. Research opens this shelf.*

## Filing

`SHELVES` in `src/game/defs/shelf.ts` is the only source of panel membership, category order, group order, and footer copy. `Sku.tab` is **not** it: that field is the commerce class, read by `skuPrice` for skill discounts and by [[ui/multiplayer]] for guest permission. Two invariants on [[mechanics/_index]] hold them together — every sku sits in exactly one shelf group, and no build shelf holds a `seeds`-tab sku.

**One axis per level, and file by primary output.** The top level splits by verb: a store you buy from, a build menu you place from. The second splits by what a thing emits — signal → Sensors, water → Water, goods → Processing, ground → Land. Every sku has exactly one home. The other axis is reached by search, never by a duplicate row. A water sensor is Sensors; a smart valve is Water (flow); a smart sprinkler is Water.

Order inside a group is the function chain — source, transport, control, output — then tier. Never unlock date.

Groups **order** the grid; they do not draw. No headers, no dividers. The categories already carry the division, and a header per two cards was louder than what it separated.

## Cards

Three per row on `auto-rows-[6.75rem]`, and **the card is one box everywhere**: same height, same width, browsing or searching, one line of label or two. Two rules keep it that way — the row height is a constant rather than `fr`, and the category rail stays mounted while searching so results are laid out in the same column as the shelves. A grid whose cells resize as you type is unreadable. One card per `skuShown` sku. The card **is** the button — no nested `Btn`, no separate hover target.

`skuInner` icon `h-10 w-10` over `skuLabel` `text-sm` semibold `leading-tight`, `min-h-8` so one-line and two-line labels sit the price on the same baseline, two lines at most, then **placing** when armed, then `Coin` price, `tabular-nums`. Card padding is `px-1 py-1.5`: the icon carries the card, the chrome does not. Label before price: the accessible name is *{label} {price}*.

| state | face | callout reason |
|---|---|---|
| `not-researched` | `bg-ink/6 text-ink/35`, icon at 40% | Needs the **{research name}** research |
| `need-skill` | same | You need to earn the Vanilla tending skill |
| `cannot-afford` | same | Not enough money |
| `inventory-full` | same | No room in the inventory |
| `silo-full` | same | Seed silo full |
| `store-full` | same | Additive store full |
| `ok` | `bg-dirt`, `bg-ink` when armed | — |

The reason names the research by walking `SKUS[id].unlock` into `RESEARCH`. Never say "not researched" and leave the player guessing which one.

`inventory-full` is `grass-seeds`, `sugar`, and `buy-weed-spray` only, when there is no merge slot and no empty house slot. Seed packs answer to the silo cap and fertilizer to the additive-store cap instead — [[mechanics/inventory]]. The card never re-implements a fit rule: it asks the same numbers `buy` does, so a green card cannot fail silently.

**Locked cards sort to the end of their own group.** The `locked` predicate is research gating alone — never money or capacity, which flip while the player hovers and would reshuffle cards under the cursor.

## Hover

[[ui/callout-hover]] to the right of the dock — the same place research and family put theirs. Title `skuLabel`, body `skuDesc`, then the blocking reason in bold `roof` when the card is not `ok`.

**Locked cards must hover.** A disabled `<button>` dispatches no pointer events, so blocked cards carry `aria-disabled` and a guarded `onClick` instead of the `disabled` attribute. The whole point of graying a card is telling the player what to do about it. Research cards and family offers do the same.

Footer is the tab's one-line description, or the search tally, and nothing else.

## Search

One `SearchField` at the top of both docks, autofocused on open, and one query shared between them — a player who opens the wrong dock is not punished for it.

Results are **global**: every `skuShown` sku whose label, shelf name, or `skuDesc` contains the query, in one flat grid where the shelves would be. The rail stays, with no category active; clicking one clears the query and goes there. Locked skus appear with their reason; a search that hides what you have not researched teaches the player the item does not exist.

The `Store · Seeds` / `Build · Water` crumb is the first line of the [[ui/callout-hover]], not a fourth line on the card. On the card it made search results taller than shelf cards, and reserving a blank line for it while browsing made every card look stretched.

Acting on a result whose home is the other dock switches to that dock. The query survives the switch; the armed ghost survives it too.

`SkuDock` `onShelf: (id: ShelfId) => void`. Shop and Build both receive it. Category rail `onValueChange` calls it with the shelf id. Shop never emits `logic`. App: `id === 'logic'` → `setLens('sensors')`. Does not arm a SKU. Other ids: no-op. Switching away from Sensors does not force the lens off. [[ui/build]] [[ui/sensors]]

Escape in the field clears the query and goes no further. Escape with the field already empty falls through to the window handler, which cancels the ghost and closes the dock — the most-used key in the game does not get swallowed by a text box.

## Buying

Packs never arm. `buy-fertilizer` and `buy-synth-fertilizer` do not arm either: they are delivered to the additive store. `buy-weed-spray` does not arm `Seat.place`: it is a hand tool, delivered to the house like sugar — [[mechanics/inventory]]. Everything on the Build shelves arms `Seat.place` — [[ui/place]].

Bulk buying is on. No skill. Ctrl+click on a seed SKU always calls `buyPacks(id)`. The callout still shows the discounted `Coin` from `packsPrice(id)`. Ctrl on anything that cannot bulk-buy is a plain `buy(id)`.

The bulk line has its own state, `world.buyPacksFail(id)`. `'Locked'` hides the line (not a seed, or the sku is closed). `buyPacksFail` does not return Locked-for-skill. Any other reason still shows the line, in `roof`, with the reason appended — a hint that advertises a purchase must say when that purchase would bounce.

## Shelves

Seeds: crops `pack-carrot` `pack-potato` `pack-wheat` `pack-tomato` `pack-watermelon` `pack-olive` `pack-grape` `pack-raspberry` `pack-vanilla` `pack-sugar-cane`, then Ground cover `pack-grass` — [[mechanics/plants]]. No sapling SKU. No berry.

Tools: Digging shovel → better → rotary, Mining pickaxe → better → diamond, Carry buckets then boxes. Tiers read along the group — [[items/tools]].

Supplies: Feeds `buy-fertilizer` `buy-synth-fertilizer` `buy-weed-spray`, Pantry `buy-sugar`, label **Sugar**. None of them arm.

Gates: `skuShown` / `skuOpen` from [[mechanics/research]] Shop gates. `pack-olive` show `unlock-tomato` buy `unlock-olive`. `pack-grape` show `start` buy `unlock-grape`. `pack-raspberry` show `unlock-grape` buy `unlock-raspberry`. `pack-vanilla` show `unlock-raspberry` buy `vanilla-tending`. Locked copy: “You need to earn the Vanilla tending skill.” `pack-sugar-cane` show + buy `unlock-fermentation`. `buy-mill` show `start`, buy `unlock-grinder`. `buy-jam` `buy-freezer` `buy-sugar` show `unlock-grinder`, buy `unlock-preservatives`. `buy-still` `buy-barrel` show `start`, buy `unlock-fermentation`. `buy-hangar` shows `unlock-irrigation`, buys `unlock-vehicles`. The three silo SKUs show `unlock-vehicles`, buy `unlock-silos`. `buy-weed-spray` show + buy `unlock-fertilizer`. Lever, button, lamp, pulser, counter, water, fert, harvest, water-system, day: show + buy `unlock-sensors`. AND / OR / NOT: show `unlock-sensors`, buy `unlock-advanced-sensors`, `need: []`. Locked callout: Needs the **Advanced sensors** research. `buy-smart-valve` shows `unlock-sensors`, buys `unlock-smart-irrigation`. `buy-vehicle-detector` shows and buys `unlock-sensors`, `need: ['unlock-vehicles']`. `buy-pipe` `buy-tap` show `start`, buy `unlock-irrigation`. `buy-rain-tank` show + buy `start`. `buy-pumpjack` show `start`, `buy-well` show `unlock-irrigation`, both buy `unlock-water-storage`. `buy-compost-box` shows `start`, buys `unlock-compost`. `skuDesc` [[ui/sensors]].

Assumption: `buy-weed-spray` files under Feeds and goes to house/hand; it does not arm a place ghost. `buyPacksFail` still returns `'Locked'` for non-seed / closed skus (hides the bulk line), never for a missing skill.
