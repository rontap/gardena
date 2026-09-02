# Build

The placing half of the shop. Cards, faces, states, hover, search, and the filing rule are [[ui/shop]] — this note is only what differs.

Left [[ui/docks]] `Dock`. Title **Build**. Rail button **Build**, directly under **Shop**. Same `w-[28rem]` as the store: at `left-32` that leaves the [[ui/callout-hover]] gutter clear down to 1280.

## Category rail

Categories are a **vertical** `Tabs.List` down the left of the pane, `tabRailListClass` — an active left border instead of an underline, bled to the window edge — [[ui/docks]]. Horizontal tabs were already at four labels; Sensors and Vehicles would wrap. `orientation="vertical"` keeps `role="tab"`. The store and research use the same rail.

| tab | order | idle footer |
|---|---|---|
| Water | Source pumpjack, well, rain-tank · Flow tap, pipe, valve · Output sprinkler, vertical, large | Source, flow, output. |
| Processing | Grinding grinder, mill · Brewing still, barrel · Preserving jam · Compost compost-box | Machines that make goods. |
| Storage | chest, freezer | Keep what you picked. |
| Vehicles | Hangar `buy-hangar` · Silos seed, spray, produce | Hangar and the field silos that load trailers. |
| Sensors | lever, button, lamp, OR, AND, NOT, pulser, counter, traffic-light, water, fert, harvest, water-system, vehicle-detector, day | Signal, gates, readers. |
| Land | Paving cobble → brick → paved · Fencing fence | Paving and fencing. Click as many tiles as you like, Escape when done. |

Labels **Mill** **Pot still** **Barrel** **Jam machine** **Freezer** **Vehicle hangar** **Seeding silo** **Spraying silo** **Produce silo** **Lever** **Button** **Lamp** **OR gate** **AND gate** **NOT gate** **Pulser** **Counter** **Water sensor** **Fertilizer sensor** **Harvest sensor** **Day sensor** **Water-system sensor** **Vehicle detector** **Traffic light** — [[items/buildings]] [[items/sensors]]. Quad, tractor, and trailers are hangar-buys, not shop SKUs — [[ui/vehicles]]. Paving cheapest first — [[items/tiles]]. Vehicle detector is Sensors. Traffic light is Sensors, Signal group, not readers. Pulser / counter / day: Sensors. Shelf id `logic`. [[ui/sensors]]

## Cluster

`GHOST_SKUS` is derived from the shelves: every Build category whose `cluster` is `'build'`. That is Water, Processing, Storage, Vehicles, and Sensors. Land is `'none'` — paving and fencing are paint tools, and a Rotate button that rotates nothing is worse than no button. The old hand-written `PLACE_TOOLS` list omitted `buy-compost-box`, so the cluster did not appear while it was armed; deriving the list is what fixes it. [[ui/hud]] [[ui/place]]

## Arming

Build owns the placement ghost, but the store can arm one too — a cross-panel search result acts where it lives. So both docks count as arming panels:

- **Shop ↔ Build** keeps the armed ghost and the pipes / sensors lens. Switching decks is not putting the tool down.
- Leaving both for any other panel, or closing the dock, or Escape: `leaveShop` = `cancelPlace`, pipes or sensors lens `off`, query cleared. Matches Esc.
- Right-click: `cancelPlace` only.

`SkuDock` `onShelf: (id: ShelfId) => void`. Shop and Build both receive it. Category rail fires it. App: `id === 'logic'` → `setLens('sensors')`. Does not arm a SKU. Switching to another Build category does **not** force the lens off.

One helper in `App` owns leave, and every path calls it — the menu and multiplayer toggles used to cancel the ghost while leaving the overlay on.
