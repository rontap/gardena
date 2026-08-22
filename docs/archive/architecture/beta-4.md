# Beta-4 architecture

**Historical.** Current law: [[architecture/beta-5]].

Supersedes [[architecture/beta-3]] where this file names a replacement. Rules: [[mechanics/beta-4]]. Chrome: [[ui/beta-4]].

## Tree

```
src/game/
  defs/crops.ts items.ts research.ts rarity.ts catalog.ts
  sim/  (beta-3 + speech in world)
  view/ map.tsx camera.ts svgs.ts motion.ts
  ui/   + almanac.tsx  chest.tsx  lenses on hud
```

## Research / SKU

```
ResearchDef.tree: 'plants' | 'utilities' | 'expansion' | 'automation'
ResearchDef.name: string

ResearchId += 'unlock-chest' | 'unlock-grinder'
SkuId += 'buy-chest' | 'buy-grinder'
```

## Cells

```
class Chest { kind:'chest'; base: RectBase; slots: Slot[] }  // 9
class Grinder { kind:'grinder'; base: RectBase }

Cell += Chest | Grinder
isSolid += chest | grinder
```

## Intent / cue / task

```
Cue = { kind:'none' } | { kind:'inventory' } | { kind:'chest'; at: Coord }

Intent += { act:'chest'; at } | { act:'grind'; at }

TaskName += 'Chest' | 'Grind'
```

`dest(chest|grind) = at`. Walk name **Move here**. Arrived: Chest / Grind.

## Speech

```
type Speech = { kind:'none' } | { kind:'say'; text: string; left: number }

World.speech
World.say(text): void
World.swapChest(at, i): void
```

## Place

`buy-chest` `buy-grinder` arm place. `skuItem` → `{ kind:'chest' }` / `{ kind:'grinder' }`. Confirm replaces one Plot.

## Catalog

`src/game/defs/catalog.ts`

```
type CatalogEntry = {
  id: string
  title: string
  icon: Item | { kind:'pumpjack' } | { kind:'chest' } | { kind:'grinder' }
  blurb: string
}

fill(template, vars): string
catalogEntries(): CatalogEntry[]
```

UI maps `catalogEntries()`. No item literals in the React file.

## Lens (view-local)

```
type Lens = 'off' | 'water' | 'ripe' | 'kind'
```

Not on World.

## Shop

```
Sku = { id, price, unlock: 'start' | ResearchId, show: 'start' | ResearchId }

World.skuOpen(id)
World.skuShown(id)
```

`show` hides the store row. `unlock` gates buy.

## Lookups

`CHEST_SLOTS = 9`
`GRIND_WORK = 2`
`GRIND_MIN = 1`
`GRIND_MAX = 3`
`SPEECH_S = 2.5`
`SHRUB_GROW = 360`
