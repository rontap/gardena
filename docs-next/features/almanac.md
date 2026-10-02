# Almanac

Code: `ui/feature-almanac/` (`almanac.tsx`, `nav.tsx` for `LISTS` and `linksResolve`, `concepts.tsx`, `stats.tsx`, `panes.tsx`, `almanac-cards.tsx` for `Portrait` and the machine cards, `almanac.test.ts`), `defs/catalog.ts` (`catalogEntries`, one `CatalogEntry` per page), strings in `messages/en/almanac.json` and `messages/en/catalog.json`; see [[code-map]].
Unlocked: from the start.

## Purpose

The Almanac is the player's reference for the farm: what each crop, tool, machine, sensor and vehicle building is for, what it gives, and the game concepts behind them. A page answers why the player would want the thing and what they can do with it; numbers come from `src/game/defs/` and follow the difficulty and speed of the farm.

## Rules

### Tabs and lists

Eight tabs (`TABS`): **Fruits**, **Tools & Utility**, **Water**, **Machines**, **Vehicles**, **Sensors**, **Game concepts**, **Miscellaneous**. Each tab has a left list (`LISTS`) of rows under headings. Picking a tab selects its first row (`firstId`). A row is one of (`ListRow`):

| kind | page |
|---|---|
| `overview` | the tab's Overview; on Fruits, Water, Machines, Vehicles and Sensors |
| `concept` | a Game concepts page (`ConceptId`) |
| `sku` | one `CatalogEntry` |
| `forms` | several entries on one page, such as the four pavings, Cut grass and Grass seeds, or Rotten produce, Rotten root and Dead plant |
| `tools` | one tool family with a stats table (`ToolFamily`) |

`AlmanacLink` moves to a tab and row. Overview and concept pages link a few named concepts or one example, never a roster of the tab.

Links follow Wikipedia style: the first mention of a term that has its own page is a link, later mentions on the same page are plain text, and a page does not link itself. A description or paragraph string marks a link inline as `[label](tab:id)`; `Rich` draws it as an `AlmanacLink`. The Water overview (`WATER_OVERVIEW`), the Water pages and the bag pages use this; older overview and concept pages build links from split strings (`_a`, `_b`, …).

### Page shapes

Every page opens with the name and the description, then a row of cards (`Portrait`): a picture on a coloured ground with a caption.

- **Crop and tree** (`CropShell`): cards **Fruit** and **Growing** (the plant or tree cycling its stages), then an arrow and one card per product the fruit makes in a machine whose research is done (`recipesUsing`, `recipeOpen`). Hovering a product card shows its price and recipe in the right-hand callout. Below, a Variety tab row: **Plain** and each Variety the farm's familiarity has found (`foundVarieties`, `VARIANT_AT`, `HEIRLOOM_AT`), and a disabled **Unknown Variety** while some are not found. Each Variety tab lists stats with five rating dots, rated against the other crops or the other trees; a stat the farm has not studied far enough (`ALMANAC_AT`) shows **Study this fruit at the Crop Variety Station {n} more times**.
- **Machine** (`MachinePane`, the Machines tab, `MACHINE_TAB_IDS`): one card that switches between **Idle** and **Working** every `CYCLE_MS`, then the machine's recipes (`MachineRecipes`) where it has them. The Working card shows the machine's map art in its working state (the `on` group where the art has one) with its working effects from [[art/vfx]] playing over it (`MACHINE_LOOK`). The Variety sorter has no working look: one card, its icon, captioned with its name.
- **Sensor** (`SensorPane`): one card cycling the device's states (**On** / **Off**, or its modes), then **Input:** and **Output:** lines.
- **Tool family** (`ToolPane`): one card per grade, then a table of price, Durability and use time. A grade that is not sold shows **Contract prize** as its price.
- **Miscellaneous** (`CardPane`, `FormCards`): one card per item, captioned with its name. Tilled soil shows the tilled ground tile (`DIRT`).
- **Field silos** (`CardPane`): one card.
- **Water** (`CardPane`, `PipePane`, `FormCards`): one card per building; the Pipe card cycles its joins; the three sprinklers share one page and one description, one card each. The descriptions are the `almanac_desc_*` strings, not the Build panel's `catalog_*` strings.
- **Bags** (`BagPane`, `BAG_IDS`): Fertilizer bag, Compost, Weed spray, Extract and Sugar; one card per form in `BAG_FACES`, so Extract shows Extract and Infused Extract. Hovering a card shows every recipe that makes it (`recipesMaking`) in the right-hand callout; a bag no machine makes, the Fertilizer bag, shows none.
- **Storage and vehicle buildings** (`Pane`): the square plate (`Plate`) and the description; the Refueling station adds its recipes.
- `forms` rows on any tab use `FormCards`.
- **Overview and concept**: the title and short paragraphs.

### Card colours

The ground of a card says what kind of thing it shows. Constants `BROWN`, `GREEN`, `BLUE`.

| ground | token | for |
|---|---|---|
| brown | `dirt-dark` | seeds and anything planted, grown or gathered: fruit, a growing plant, seeds and tree seeds, weeds, grass, Tilled soil, Rotten produce, dead plants, Wood, mushrooms |
| green | `grass` | trees and everything built: a growing tree, machines, sensors, water and vehicle buildings, storage, Wooden fence, paving, the Necronomicon; and bags: fertilizer, compost, Weed spray |
| blue | `water` | tools and abstract things: tools, machine goods (products, Sugar, Extract, Ash), Treasure, Expansion permit, skill points |

`skuFill` colours a `CatalogEntry`: `MADE_IDS` blue, `GROWN_IDS` brown, every other entry green. `ENTRY_SLOT` colours a burrow entry. The rule is the Almanac's only; other panels keep their own grounds.

### Burrow page

The Burrow concept page draws one box per rarity (`BURROW_RARITIES`) with a card per entry of `BURROW_ENTRIES`. The page sorts each box by `ENTRY_SLOT.order`: seeds, tree seed, Weed or mushroom, Treasure or Expansion permit, tool or skill point. A card whose entry draws from a pool cycles through the pool's pictures.

## Screen

The top rail **Almanac** button opens it; title **Almanac**; × or Escape closes it. Card captions: **Fruit**, **Growing**, **Idle**, **Working**, **On**, **Off**, the item or rarity name. Tool table rows: **Price**, **Durability**, use time. Recipes heading **Recipes**.

## Guest

A guest opens and reads it the same way the host does; it changes nothing.

## Save and sync

Nothing is saved. Pages read `World.familiarity`, `World.done`, `World.rules` and `World.pace`.

## Art

No asset of its own except `ui-arrow-right`. Cards reuse item icons (`itemInner`), crop and tree stages, map props (`GRINDER`, `MILL`, `JAM`, `STILL`, `BARREL`, `COMPOST_BOX`, `furnaceArt`, `stationArt`, `infuserArt`) and atlas effect frames (`atlasHtml`, `vfxKey`). An effect on a card animates through the `vfx-frame` class and the `vfx-cut-{slots}` keyframes in `src/index.css`; with **Reduced motion** on it shows frame 0.

## Invariants

| id | rule | test |
|---|---|---|
| `almanac.fill` | a card's ground follows the colour table above | none |
| `almanac.burrow-order` | the page sorts burrow entries for display; `BURROW_ENTRIES` keeps its order, which is the draw order | none |
| `almanac.machine-look` | every id in `MACHINE_TAB_IDS` has a `MACHINE_LOOK`; its working effects are the ones the map draws for that machine | none |
| `almanac.links` | every `[label](tab:id)` in a catalog description or the Water overview opens an existing row (`linksResolve`) | `ui/feature-almanac/almanac.test.ts` |

## When you change this

- A new page for a SKU: a `CatalogEntry` in `catalogEntries`, its id in `LISTS`, and its colour (`MADE_IDS`, `GROWN_IDS`, or green by default).
- A row id that a `[label](tab:id)` link points at: renaming or removing it fails `almanac.links`.
- A new card page goes in `ui/feature-almanac/almanac-cards.tsx`. A Game concepts page goes in `concepts.tsx`. A crop or tree stat goes in `stats.tsx`. Tab rows are `LISTS` in `nav.tsx`.
- A new machine: its id in `MACHINE_TAB_IDS` and a `MACHINE_LOOK` with its art and working effects ([[art/vfx]]).
- A new burrow entry kind: its order and colour in `ENTRY_SLOT` ([[features/burrow]]).
- Description text: `messages/en/catalog.json`, numbers through `fill` from `src/game/defs/` ([[name-map]]).

## Decisions

- The burrow page orders entries on the page only: reordering `BURROW_ENTRIES` would change which entry a given draw gives.
- A machine description leaves out inputs, outputs and times; the recipes under it show them.
- The card colours are an Almanac rule; the developer chose not to apply them to other panels.
