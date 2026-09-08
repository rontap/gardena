# Build

One left [[ui/docks]] `Dock` over the whole catalogue: search, a vertical category rail, a card grid, a [[ui/callout-hover]] in `aside`. Type scale [[ui/type]]. `src/game/ui/build.tsx`.

Title **Build**. Rail button **Build**, top of the left ribbon. `w-[28rem]`: at `left-32` that leaves the [[ui/callout-hover]] gutter clear down to 1280.

There is no General store. Seed packs are bought at the [[ui/store]] Seed silo; fertilizer, synthetic fertilizer, weed spray, and sugar at the Additive store. Both stores carry their own Buy rows, so a second panel selling the same bags was a second place to look.

## Category rail

Categories are a **vertical** `Tabs.List` down the left of the pane, `tabRailListClass` — an active left border instead of an underline, bled to the window edge — [[ui/docks]]. `orientation="vertical"` keeps `role="tab"`. Research uses the same rail.

| tab | order | cluster | idle footer |
|---|---|---|---|
| Tools | Digging shovel, better-shovel · Mining pickaxe, hardened, axe, chainsaw · Carry bucket, large bucket | none | Dig, mine, chop, and carry water. |
| Water | Source pumpjack, well, rain-tank · Flow tap, pipe, valve · Output sprinkler, vertical, large | build | Source, flow, output. |
| Automation | Grinding grinder, mill · Brewing still, barrel · Preserving jam · Infusing infuser · Compost compost-box, furnace · Grafting station · Hangar `buy-hangar` | build | Machines that make goods, and the hangar your vehicles come home to. |
| Storage | Boxes chest, freezer, large freezer · Silos seed, spray, produce | build | Boxes for what you picked, and the field silos that load trailers. |
| Sensors | lever, button, lamp, logic, NOT, pulser, counter, traffic-light, water, fert, harvest, variety, weather, vehicle-detector, day | build | Signal, gates, readers. |
| Land | Paving cobble → brick → paved · Fencing fence · Ground cover `pack-grass` | none | Paving, fencing, and grass seed. Click as many tiles as you like, Escape when done. |

Tools opens the dock: a shovel is the first thing bought and the rail is where it is found. That is why opening Build no longer peeks the `pipes` lens — Water does, on click.

Labels **Mill** **Pot still** **Barrel** **Jam machine** **Infuser** **Freezer** **Vehicle hangar** **Seeding silo** **Spraying silo** **Produce silo** **Lever** **Button** **Lamp** **Logic gate** **NOT gate** **Pulser** **Counter** **Water sensor** **Fertilizer sensor** **Harvest sensor** **Variety sensor** **Weather sensor** **Day sensor** **Pressure plate** **Traffic light** — [[items/buildings]] [[items/sensors]]. Quad, tractor, and trailers are hangar-buys, not shelf SKUs — [[ui/vehicles]]. Paving cheapest first — [[items/tiles]]. Pressure plate is Sensors (`buy-vehicle-detector`). Traffic light is Sensors, Signal group, not readers. Pulser / counter / day / variety / weather: Sensors. `buy-water-system` not on the shelf. Parse aliases `and` / `or` are identifiers, not shelf SKUs. Shelf id `logic`. [[ui/sensors]]

A tab with no `skuShown` sku is not rendered at all — the shelf appears when research opens it, and never reorders. With no tab left, the pane reads *Nothing here yet. Research opens this shelf.*

## Filing

`SHELVES` in `src/game/defs/shelf.ts` is the only source of category order, group order, and footer copy. `Sku.tab` is **not** it: that field is the commerce class, read by `skuPrice` for skill discounts and by [[ui/multiplayer]] for guest permission. `pack-grass` is the one `seeds`-tab sku on a shelf; it gates on `unlock-landscaping` with paving and fencing, so it files under Land.

Every sku sits in exactly one shelf group, except the twelve the stores sell (`pack-carrot` `pack-potato` `pack-wheat` `pack-tomato` `pack-grape` `pack-raspberry` `pack-sugar-cane` `pack-chilli` `buy-fertilizer` `buy-synth-fertilizer` `buy-weed-spray` `buy-sugar`) and `buy-and` `buy-or` `buy-water-system`, which sit in none — [[items/sensors]] [[ui/store]].

**File by primary output.** A shelf splits by what a thing emits — signal → Sensors, water → Water, goods → Automation, ground → Land, held work → Tools. Every sku has exactly one home. The other axis is reached by search, never by a duplicate row. A water sensor is Sensors; a valve is Water (flow); a smart sprinkler is Water.

Order inside a group is the function chain — source, transport, control, output — then tier. Never unlock date.

Groups **order** the grid; they do not draw. No headers, no dividers. The categories already carry the division, and a header per two cards was louder than what it separated.

## Cards

Three per row, and **the card is one box everywhere**: same height, same width, browsing or searching, one line of label or two. The row height is a constant rather than `fr`, and the category rail stays mounted while searching so results are laid out in the same column as the shelves. A grid whose cells resize as you type is unreadable. One card per `skuShown` sku. The card **is** the button — no nested `Btn`, no separate hover target.

`skuInner` over `skuLabel`, two lines at most, then **placing** when armed, then `Coin` price. The icon carries the card. Label before price: the accessible name is *{label} {price}*. Drought `skuPrice` ×2 on `seeds` | `utility` is already that Coin. No extra why. No new face. [[mechanics/weather]]

| state | face | callout reason |
|---|---|---|
| `not-researched` | `bg-ink/6 text-ink/35`, icon at 40% | Needs the **{research name}** research |
| `cannot-afford` | same | Not enough money |
| `inventory-full` | same | No room in the inventory |
| `silo-full` | same | Seed silo full |
| `store-full` | same | Additive store full |
| `ok` | `bg-dirt`, `bg-ink` when armed | — |

The reason names the research by walking `SKUS[id].unlock` into `RESEARCH`. Never say "not researched" and leave the player guessing which one.

`inventory-full` is `grass-seeds` only, when there is no merge slot and no empty house slot. The card never re-implements a fit rule: it asks the same numbers `buy` does, so a green card cannot fail silently.

**Locked cards sort to the end of their own group.** The `locked` predicate is research gating alone — never money or capacity, which flip while the player hovers and would reshuffle cards under the cursor.

## Hover

[[ui/callout-hover]] to the right of the dock — the same place research and family put theirs. First line is the shelf name, `crumbOf` = `shelfOf(id).label()`. Then title `skuLabel`, body `skuDesc`, then the blocking reason in bold `roof` when the card is not `ok`.

Machine SKUs (`machineOfSku`) add every recipe under `skuDesc`, above the blocking reason — [[ui/recipe]]. Locked machines still show them: knowing what a still makes is the reason to research it. No reverse lookup — a seed pack does not list the machines that eat it.

**Locked cards must hover.** A disabled `<button>` dispatches no pointer events, so blocked cards carry `aria-disabled` and a guarded `onClick` instead of the `disabled` attribute. The whole point of graying a card is telling the player what to do about it. Research cards and family offers do the same.

## Footer

The tab's one-line description, or the search tally. While `place.kind === 'sku'`, a second muted line: *Hold Shift while you click to keep this tool in hand.* It appears only while something is armed, which is the only moment it means anything — [[ui/place]].

## Search

One `SearchField` at the top, autofocused on open.

Results are **global**: every `skuShown` sku whose label, shelf name, or `skuDesc` contains the query, in one flat grid where the shelves would be. The rail stays, with no category active; clicking one clears the query and goes there. Locked skus appear with their reason; a search that hides what you have not researched teaches the player the item does not exist.

Escape in the field clears the query and goes no further. Escape with the field already empty falls through to the window handler, which cancels the ghost and closes the dock — the most-used key in the game does not get swallowed by a text box.

## Cluster

`GHOST_SKUS` is derived from the shelves: every category whose `cluster` is `'build'`. That is Water, Automation, Storage, and Sensors. Tools and Land are `'none'` — tools go to hand, and paving, fencing and grass seed are paint tools, so a Rotate button that rotates nothing is worse than no button. [[ui/hud]] [[ui/place]]

## Arming

Build owns the placement ghost, and it is the only panel that does. `arming(kind)` is `kind === 'build'`.

- Escape, dock **×**, the rail toggle, or opening any other panel: `leaveBuild` = `cancelPlace`, query cleared, peeked lens restored. A locked lens stays.
- Right-click: `cancelPlace` only.
- Shift held on a confirm that would disarm: App re-arms the same sku — [[ui/place]].

`Build` `onShelf: (id: ShelfId) => void`. The category rail fires it, including the tab that is open when the dock mounts. Does not arm a SKU.

Build peek, no lock — [[ui/lens]]:

| tab | lens |
|---|---|
| Water | `pipes` |
| Automation, Storage | `vehicles` |
| Sensors (`logic`) | `sensors` |
| Tools, Land | restore the lens that was on before the peek |

Automation holds the hangar and every machine that carries a pad; Storage holds the chests, freezers and field silos a trailer docks at. Both are what the vehicle-interaction lens is for.

A locked lens is not touched. Twitching off a peek tab, closing Build, or leaving it restores that saved lens. `toolLens` still wins while a sku is armed.

One helper in `App` owns leave, and every path calls it — the menu and multiplayer toggles used to cancel the ghost while leaving the overlay on.

## Buying

`onAct` is `world.buy(id)` and nothing else. Every Build shelf sku either arms `Seat.place` or goes to hand — [[ui/place]]. Bulk buying (Ctrl+click, `buyPacks`) lives on the Seed silo Buy row, the only place seed packs are sold — [[ui/store]].

## Gates

`skuShown` / `skuOpen` from [[mechanics/research]]. `buy-mill` show `start`, buy `unlock-grinder`. `buy-jam` `buy-freezer` show `unlock-grinder`, buy `unlock-preservatives`. `buy-still` show `unlock-grinder`, buy `unlock-fermentation`. `buy-barrel` show `start`, buy `unlock-fermentation`. `buy-furnace` show `unlock-grinder`, buy `unlock-furnace`. `buy-infuser` show `unlock-preservatives`, buy `unlock-infusion`. `buy-research-station` show and buy `unlock-crop-variants`. `buy-better-pickaxe` and `buy-chainsaw` show + buy `unlock-hardened-tools`. `buy-axe` show + buy `unlock-pickaxe`. `buy-hangar` shows `unlock-irrigation`, buys `unlock-vehicles`. The three silo SKUs show `unlock-vehicles`, buy `unlock-silos`. Lever, button, lamp, pulser, counter, water, fert, harvest, day, variety, weather: show + buy `unlock-sensors`. `buy-water-system` `skuShown` false. Logic gate / NOT: show `unlock-sensors`, buy `unlock-advanced-sensors`, `need: []`. Locked callout: Needs the **Advanced sensors** research. One valve. `unlock-smart-irrigation` gives every valve a signal `in`. `buy-vehicle-detector` (player **Pressure plate**) shows and buys `unlock-sensors`, `need: ['unlock-vehicles']`. `buy-traffic-light` shows `unlock-sensors`, `need: ['unlock-dispatch']`. Locked callout names **Automated dispatch**. `buy-pipe` `buy-tap` show `start`, buy `unlock-irrigation`. `buy-rain-tank` show + buy `start`. `buy-pumpjack` show `start`, `buy-well` show `unlock-irrigation`, both buy `unlock-water-storage`. `buy-compost-box` shows `start`, buys `start`. `pack-grass`, `buy-fence` and all four paving SKUs show from `start`, buy after `unlock-landscaping`. `skuDesc` [[ui/sensors]].

Assumption: `rowState` never returns `need-skill`. Tools is the first tab because it is the first purchase; the mount `onShelf` therefore peeks no lens.
