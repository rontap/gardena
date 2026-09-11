# Build

One left [[ui/docks]] `Dock` over the whole catalogue: search, a vertical category rail, a card grid, a [[ui/callout-hover]] in `aside`. Type scale [[ui/type]]. `src/game/ui/build.tsx`.

Title **Build**. Rail button **Build**, top of the left ribbon. Width leaves the [[ui/callout-hover]] gutter clear down to 1280.

There is no General store. Seed packs are bought at the [[ui/store]] Seed silo; fertilizer, synthetic fertilizer, weed spray, and sugar at the Additive store. Both stores carry their own Buy rows. `rowState` never returns `need-skill`. Tools is the first tab because it is the first purchase; the mount `onShelf` therefore peeks no lens.

## Category rail

Categories are a **vertical** `Tabs.List` down the left of the pane, `tabRailListClass` — an active left border instead of an underline, bled to the window edge — [[ui/docks]]. `orientation="vertical"` keeps `role="tab"`. Research uses the same rail.

| tab | order | cluster | idle footer |
|---|---|---|---|
| Tools | Digging shovel, better-shovel · Mining pickaxe, hardened, axe, chainsaw · Carry bucket, large bucket | none | Dig, mine, chop, and carry water. |
| Water | Source pumpjack, well, rain-tank · Flow tap, pipe, valve · Output sprinkler, vertical, large | build | Source, flow, output. |
| Automation | Grinding grinder, mill · Brewing still, barrel · Preserving jam · Infusing infuser · Compost compost-box, furnace · Grafting station · Hangar `buy-hangar` | build | Machines that make goods, and the hangar your vehicles come home to. |
| Storage | Boxes chest, freezer, large freezer · Silos seed, spray, produce | build | Boxes for what you picked, and the field silos that load trailers. |
| Sensors | lever, button, lamp, logic, NOT, pulser, counter, traffic-light, water, fert, harvest, variety, weather, vehicle-detector, day | build | Signal, gates, readers. |
| Land | Paving cobble → brick → paved · Fencing fence | none | Paving and fencing. Click as many as you like, Escape when done. |

Tools opens the dock: a shovel is the first thing bought and the rail is where it is found. That is why opening Build no longer peeks the `pipes` lens — Water does, on click.

Labels from `skuLabel` — [[items/buildings]] [[items/sensors]]. Quad, tractor, and trailers are hangar-buys, not shelf SKUs — [[ui/vehicles]]. Paving cheapest first — [[items/tiles]]. Pressure plate is Sensors (`buy-vehicle-detector`). Traffic light is Sensors, Signal group, not readers. `buy-water-system` not on the shelf. Parse aliases `and` / `or` are identifiers, not shelf SKUs. Shelf id `logic`. [[ui/sensors]]

A tab with no `skuShown` sku is not rendered at all — the shelf appears when research opens it, and never reorders. With no tab left, the pane reads *Nothing here yet. Research opens this shelf.*

## Filing

`SHELVES` is the only source of category order, group order, and footer copy. `Sku.tab` is **not** it: that field is the commerce class, read by `skuPrice` for skill discounts and by [[ui/multiplayer]] for guest permission. No `seeds`-tab sku sits on a shelf. `pack-grass` gates on `unlock-landscaping` and is sold at the Seed silo with the other packs — [[ui/store]].

Every sku sits in exactly one shelf group, except the packs and bags the stores sell and `buy-and` `buy-or` `buy-water-system`, which sit in none — [[items/sensors]] [[ui/store]].

**File by primary output.** A shelf splits by what a thing emits — signal → Sensors, water → Water, goods → Automation, ground → Land, held work → Tools. Every sku has exactly one home. The other axis is reached by search, never by a duplicate row. A water sensor is Sensors; a valve is Water (flow); a smart sprinkler is Water.

Order inside a group is the function chain — source, transport, control, output — then tier. Never unlock date. Groups **order** the grid; they do not draw. No headers, no dividers.

## Cards

Three per row, and **the card is one box everywhere**: same height, same width, browsing or searching, one line of label or two. The row height is a constant rather than `fr`, and the category rail stays mounted while searching so results are laid out in the same column as the shelves. One card per `skuShown` sku. The card **is** the button — no nested `Btn`, no separate hover target.

`skuInner` over `skuLabel`, two lines at most, then **placing** when armed, then `Coin` price. The icon carries the card. Label before price: the accessible name is *{label} {price}*. Drought `skuPrice` ×2 on `seeds` | `utility` is already that Coin. No extra why. No new face. [[mechanics/weather]]

| state | face | callout reason |
|---|---|---|
| `not-researched` | muted | Needs the **{research name}** research |
| `cannot-afford` | same | Not enough money |
| `silo-full` | same | Seed silo full |
| `store-full` | same | Additive store full |
| `ok` | dirt, ink when armed | — |

The reason names the research by walking `SKUS[id].unlock` into `RESEARCH`. Never say "not researched" and leave the player guessing which one. The card never re-implements a fit rule: it asks the same numbers `buy` does. `pack-grass` is not a Build card. **Locked cards sort to the end of their own group.** The `locked` predicate is research gating alone — never money or capacity.

## Hover

[[ui/callout-hover]] to the right of the dock — the same place research and family put theirs. First line is the shelf name, `crumbOf` = `shelfOf(id).label()`. Then title `skuLabel`, body `skuDesc`, then the blocking reason in bold when the card is not `ok`. Machine SKUs (`machineOfSku`) add every recipe under `skuDesc`, above the blocking reason — [[ui/recipe]]. Locked machines still show them. No reverse lookup. **Locked cards must hover.** Blocked cards carry `aria-disabled` and a guarded `onClick` instead of the `disabled` attribute. Research cards and family offers do the same.

## Footer

The tab's one-line description, or the search tally. While `place.kind === 'sku'`, a second muted line: *Hold Shift while you click to keep this tool in hand.* It appears only while something is armed — [[ui/place]].

## Search

One `SearchField` at the top, autofocused on open. Results are **global**: every `skuShown` sku whose label, shelf name, or `skuDesc` contains the query, in one flat grid where the shelves would be. The rail stays, with no category active; clicking one clears the query and goes there. Locked skus appear with their reason. Escape in the field clears the query and goes no further. Escape with the field already empty falls through to the window handler, which cancels the ghost and closes the dock.

## Cluster

`GHOST_SKUS` is derived from the shelves: every category whose `cluster` is `'build'`. That is Water, Automation, Storage, and Sensors. Tools and Land are `'none'` — tools go to hand, and paving and fencing are paint tools. It no longer gates the left-ribbon buttons. Opening this dock is enough to show **Demolish**, and **Cancel** follows `place.kind !== 'none'` — [[ui/hud]] [[ui/place]].

## Arming

Build owns the placement ghost, and it is the only panel that does. `arming(kind)` is `kind === 'build'`. Escape, dock **×**, the rail toggle, or opening any other panel: `leaveBuild` = `cancelPlace`, query cleared, peeked lens restored. A locked lens stays. Right-click: `cancelPlace` only. Shift held on a confirm that would disarm: App re-arms the same sku — [[ui/place]].

`Build` `onShelf: (id: ShelfId) => void`. The category rail fires it, including the tab that is open when the dock mounts. Does not arm a SKU.

Build peek, no lock — [[ui/lens]]:

| tab | lens |
|---|---|
| Water | `pipes` |
| Sensors (`logic`) | `sensors` |
| Automation, Storage, Tools, Land | restore the lens that was on before the peek |

Automation peeks no lens. Storage peeks no lens. Water still peeks pipes. Sensors still peeks sensors. A locked lens is not touched. Twitching off a peek tab, closing Build, or leaving it restores that saved lens. `toolLens` still wins while a sku is armed. One helper in `App` owns leave, and every path calls it.

## Buying

`onAct` is `world.buy(id)` and nothing else. Every Build shelf sku either arms `Seat.place` or goes to hand — [[ui/place]]. Bulk buying (Ctrl+click, `buyPacks`) lives on the Seed silo Buy row, the only place seed packs are sold — [[ui/store]]. Show / buy / `need` [[mechanics/research]].
