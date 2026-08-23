# Build

The placing half of the shop. Cards, faces, states, hover, search, and the filing rule are [[ui/shop]] — this note is only what differs.

Left [[ui/docks]] `Dock`. Title **Build**. Rail button **Build**, directly under **Shop**. Same `w-[28rem]` as the store: at `left-32` that leaves the [[ui/callout-hover]] gutter clear down to 1280.

## Category rail

Categories are a **vertical** `Tabs.List` down the left of the pane, `tabRailListClass` — an active left border instead of an underline, bled to the window edge — [[ui/docks]]. Horizontal tabs were already at four labels; sensors and vehicles are coming and a wrapping tab row is worse than a rail. `orientation="vertical"` keeps `role="tab"`. The store and research use the same rail.

| tab | order | idle footer |
|---|---|---|
| Water | Source pumpjack, well, rain-tank · Flow tap, pipe, valve · Output sprinkler, vertical, large | Source, flow, output. |
| Processing | Grinding grinder, mill · Brewing still, barrel · Preserving jam · Compost compost-box | Machines that make goods. |
| Storage | chest, freezer | Keep what you picked. |
| Land | Paving cobble → brick → paved · Fencing fence | Paving and fencing. Click as many tiles as you like, Escape when done. |

Labels **Mill** **Pot still** **Wine barrel** **Jam machine** **Freezer** — [[items/buildings]]. Paving cheapest first — [[items/tiles]].

## Cluster

`GHOST_SKUS` is derived from the shelves: every Build category whose `cluster` is `'build'`. That is Water, Processing, and Storage. Land is `'none'` — paving and fencing are paint tools, and a Rotate button that rotates nothing is worse than no button. The old hand-written `PLACE_TOOLS` list omitted `buy-compost-box`, so the cluster did not appear while it was armed; deriving the list is what fixes it. [[ui/hud]] [[ui/place]]

## Arming

Build owns the placement ghost, but the store can arm one too — a cross-panel search result acts where it lives. So both docks count as arming panels:

- **Shop ↔ Build** keeps the armed ghost and the pipes lens. Switching decks is not putting the tool down.
- Leaving both for any other panel, or closing the dock, or Escape: `cancelPlace`, pipes lens `off`, query cleared.

One helper in `App` owns that, and every path calls it — the menu and multiplayer toggles used to cancel the ghost while leaving the pipes lens on.
