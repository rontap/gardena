# Beta-1 UI

See [[mechanics/beta-1]], [[architecture/beta-1]], [[art/beta-1]].

Chrome: React + Tailwind + Radix. Map: SVG. No inspect. No `Q`. No hotbar. No keys `1–8`.

Copy is `World.prompt(at).text`, `World.pulse.text`, `SaleOffer.label` / `SaleOffer.text`, `Day N`, and the locked labels **Shop**, **Research**, **Market**, **Sell**, **Inventory**. Shop row states **cannot-afford** and **inventory-full**. Nothing else.

## Tokens

`@theme` only. No unnamed hex.

| token | hex | chrome |
|---|---|---|
| grass | `#4a7c3f` | map ground |
| grass-dark | `#3a6232` | grass tile shade |
| dirt | `#8a5a32` | empty plot, HUD controls |
| dirt-dark | `#6b4423` | planted plot, progress track, empty held |
| water | `#3d7ea6` | plant thirst bar fill |
| leaf | `#6bc04a` | research bar fill, done mark |
| ripe | `#d4a017` | pulse |
| ink | `#1c1710` | text, borders, overlay, hover stroke |
| house | `#cfc6b0` | HUD, dialogs, tooltip, cursor chip |
| roof | `#8b3a2a` | held face plate |

Paste: `bg-house text-ink border-ink`, `bg-dirt`, `bg-dirt-dark`, `bg-roof`, `bg-ink/40`, `fill-grass`, `fill-grass-dark`, `fill-dirt`, `fill-dirt-dark`, `bg-water`, `bg-leaf`, `text-ripe`.

## Radix

| primitive | package | mounts |
|---|---|---|
| Dialog | `@radix-ui/react-dialog` | shop, research, market, inventory, recap |
| Tooltip | `@radix-ui/react-tooltip` | held, inventory slots, map drops |
| Progress | `@radix-ui/react-progress` | HUD research, research job row, plant thirst |
| Tabs | `@radix-ui/react-tabs` | inventory — one tab **Inventory** |

## Regions

| region | where | contents |
|---|---|---|
| HUD | top, full width | game bar: money, day, remaining seconds, research (bar + name + seconds left), **Shop**, **Research**, **Market**, held face, hover prompt status |
| Map | rest of viewport | SVG world |
| Cursor chip | follows pointer | `prompt.text` |
| Place ghost | follows pointer | SKU art when `place.kind === 'sku'` |
| Pulse | tile center | `World.pulse.text` |
| Queue | bottom-left | Factorio-style task list + one progress bar |
| Plant bar | that plant tile | thirst Progress when shown |
| Dialog | Radix | one of shop / research / market / inventory; recap exclusive on seam |
| Banner | overlay, top center | `Day N` |

Mount every `src/assets/ui-*.svg` on the HUD as decoration (frame / corners). Do not invent other chrome art.

## State

```
type Panel =
  | { kind: 'none' }
  | { kind: 'shop' }
  | { kind: 'research' }
  | { kind: 'market' }
  | { kind: 'inventory' }

type Ui = {
  panel: Panel
  hover: Coord | undefined
  banner: { status: 'hidden' } | { status: 'day'; n: number }
}
```

`hover` is view-local. Not World. Not a reason to rebuild the 32×48 field.

Recap is `World.seam`, not `Panel`. While `seam.kind === 'recap'`, only the recap dialog. HUD buttons do not open other dialogs.

Start: `panel none`, `hover` undefined, banner `Day 1` for 2s.

After recap dismiss: banner `Day {clock.day}` for 2s. No banner while recap is open.

Camera start `{ x: 15.5, y: 3.5, scale: 1 }`, clamp `[0.5, 3]`, wheel toward pointer, drag pan.

## HUD

Top bar. `bg-house border-b border-ink text-ink`. Looks like a game HUD, not three raw buttons. `ui-*.svg` decorations sit in the bar.

| cell | render |
|---|---|
| money | `$` + `Math.floor(world.money)` |
| day | `clock.day` integer |
| remaining | `Math.floor(clock.remaining)` + `s` |
| research | if `job.kind === 'run'`: Progress `(seconds - left) / seconds` fill `leaf` track `dirt-dark`, `RESEARCH[id].id`, `Math.floor(left)` + `s`. If idle: omit |
| Shop | button, toggles shop dialog |
| Research | button, toggles research dialog |
| Market | button, opens market dialog |
| held | [[#Held]] |
| status | if `hover` set: `world.prompt(hover).text`. If unset: omit |

Buttons: `bg-dirt border border-ink px-3 py-1`. Not unstyled native chrome.

Prompt is always visible on hover (status + cursor chip). Both render `text` only.

## Held

Right side of the HUD. Face **≥ 64×64 px**. `bg-roof border border-ink`. Obvious hit target. Hovertip if hold. Empty: `bg-dirt-dark`, no badge, no tooltip.

Hold face: `item-*.svg` / crop art at 64px.

| item | badge |
|---|---|
| shovel | `usesLeft` |
| container | `liters` |
| box | cargo count + `/` + `cap`, or `cap` if empty |
| seeds | `count` |
| fruit | `count` |

No click act on the face.

## Hovertips

Radix Tooltip. `bg-ink text-house` / `bg-house text-ink border border-ink`. Data fields only.

| item | tooltip |
|---|---|
| shovel | `{id} {usesLeft}` |
| container | `{id} {liters}/{capacityLiters}` |
| box empty | `box {cap}` |
| box stack | `{goods} {crop} {rarity} {count}/{cap}` |
| seeds | `{crop} {rarity} {count}` |
| fruit | `{crop} {rarity} {count}` |

Same string on held, inventory slot, map drop. No tile / plant inspect tooltip.

## Cursor

Chip: `bg-house text-ink border border-ink`, offset from pointer, `pointer-events-none`. Text = `prompt.text`. Hidden when no hover.

Place: `prompt.kind === 'place'` — chip is that text (`Place {item}` from World). Ghost: SKU item art, 32px, on the pointer.

## Clicks

Failed click does not queue. View calls `prompt` first.

| pointer | condition | ui |
|---|---|---|
| left | `seam` recap | ignored (dialog owns pointer) |
| left | house / `prompt.kind === 'inventory'` | `panel = inventory` |
| left | `place.kind === 'sku'` and Plot | World place-confirm. Not a queue intent |
| left | `prompt.kind === 'intent'` | enqueue that intent |
| left | `prompt.kind === 'blocked'` or `'place'` without confirm | no queue |
| right | `place.kind === 'sku'` | `place = none` |
| right | Plot and hand hold | World drop now. Not a queue intent |
| right | building / off-map | ignore |
| Esc | `place.kind === 'sku'` | `place = none` |
| Esc | recap | dismiss recap → Day N banner |
| Esc | panel open | `panel = none`; if shop was open, `place = none` |

Shop / Research / Market / Inventory dialogs close on Esc / overlay (Radix). Close shop also clears `place`.

No map-click-to-inspect. No `Q`.

## Place

Tool / container / box SKU click (affordable) sets `World.place` and leaves the shop open. Seeds never enter place. Pumpjack never enters place.

Shop Dialog **`modal={false}`** — no blocking overlay — so the map stays live. Ghost + cursor chip while `place.kind === 'sku'`.

Pay on successful place only. Cancel (Esc / close shop / right-click) clears `place`, no money change.

## Shop

Radix Dialog, non-modal. Title **Shop**. `bg-house text-ink border-ink`.

Rows: unlocked SKUs (`skuOpen`) in this order:

`pack-carrot` `pack-potato` `pack-wheat` `pack-tomato` `pack-raspberry` `buy-shovel` `buy-better-shovel` `buy-bucket-large` `buy-can` `buy-can-large` `buy-box` `buy-box-large` `buy-pumpjack`

Each row: SKU icon + `$` + `SKUS[id].price`.

| SKU | icon |
|---|---|
| `pack-*` | that crop SVG |
| `buy-shovel` | `item-shovel.svg` |
| `buy-better-shovel` | `item-better-shovel.svg` |
| `buy-bucket-large` | `item-large-bucket.svg` |
| `buy-can` | `item-can.svg` |
| `buy-can-large` | `item-large-can.svg` |
| `buy-box` | `item-box.svg` |
| `buy-box-large` | `item-large-box.svg` |
| `buy-pumpjack` | `prop-pump.svg` |

| row state | when | click |
|---|---|---|
| cannot-afford | `money < price` | no-op; show **cannot-afford** on the row |
| inventory-full | `pack-*` and no merge and no empty slot | no-op; show **inventory-full** on the row |
| pack | else | buy into inventory |
| tool / container / box | else | enter place |
| pumpjack | else | mutate pump, deduct |

## Research

Radix Dialog, modal. Title **Research**. Overlay `bg-ink/40`.

Two trees, `RESEARCH[id].tree`: **plants** then **utilities**.

| plants | utilities |
|---|---|
| `unlock-tomato` `unlock-raspberry` `bump-carrot` `bump-potato` `bump-wheat` | `unlock-can` `unlock-large-bucket` `unlock-large-can` `unlock-box` `unlock-large-box` `unlock-better-shovel` `unlock-pumpjack` |

Each row: `id`, `$` + cost, seconds + `s`.

| row | render | click |
|---|---|---|
| idle | cost / time | `startResearch(id)` |
| running (`job.id`) | Progress + `Math.floor(left)` + `s` | no-op |
| done (`done.has`) | marked (`leaf`) | no-op |

## Market

Radix Dialog, modal. Title **Market**. Overlay `bg-ink/40`. Reads `World.saleOffer()`.

| offer | render |
|---|---|
| `{ kind: 'ok'; money; label }` | `label`, `$` + `money`, button **Sell** → enqueue `{ act: 'sell' }`, close |
| `{ kind: 'blocked'; text }` | `text` only. No Sell |

## Inventory

House left-click. Radix Dialog, modal. Overlay `bg-ink/40`. Tabs: one trigger **Inventory**.

4×4 = `World.inventory` slots `0..15` row-major. Slot 64×64, `border-ink bg-dirt-dark`. Hold: item art + same badge rules as held. Click slot `i` ↔ swap with hand. Tooltip on hold slots.

## Recap

On `seam.kind === 'recap'`. Radix Dialog, modal. Overlay `bg-ink/40`. No invented title.

| field | render |
|---|---|
| day | `recap.day` |
| money | `$` + `recap.money` |
| died | `recap.died` |
| harvests | `recap.harvests` |
| research | `recap.research` ids |

Dismiss (Esc / overlay) → World leaves recap → `Day N` banner.

## Queue

Bottom-left overlay. Hidden when `queue.length === 0`. `pointer-events-none`.

Factorio-style: vertical list, head on top, remaining below. `bg-house border border-ink text-ink`. Mount `ui-rail` / `ui-corner-*` if present.

| part | render |
|---|---|
| current row | `World.taskName(queue[0])`, highlighted (`bg-dirt`) |
| bar | one Progress, value `World.taskProgress()`, fill `leaf`, track `dirt-dark`. Only this bar. |
| next rows | `taskName` for `queue[1..]` |

No extra copy. No per-row bars.

`src/game/ui/queue.tsx`.

## Map

Tile 32px at scale 1.

Untilled grass is **one** tiled ground from `tile-grass-0`…`3` ([[art/beta-1]]), not 1536 hover-reactive nodes, not a checker. Empty / growing / ripe / dead: `dirt` / `dirt-dark` plot rects + crop layer. Buildings: `prop-house.svg` / `prop-pump.svg`.

Hover: **one** overlay rect on `hover`, `stroke` `ink`. Do not remount the field on hover.

Drops: ~24px item art on the plot, stacked, last on top. Hit-test drop first. Tooltip on each drop.

Water: `overlay-water.svg` on growing / ripe when `thirst < 0.33`. Not on dead. `thirst < 0.10`: same file, full opacity; else 0.7.

Plant thirst bar: Radix Progress on that tile only, growing / ripe, `thirst < 0.5`. Value = `thirst` (0–1). Fill `water`, track `dirt-dark`. Do not mount a bar per empty tile.

Pulse: last `World.pulse`. `text-ripe` at `at` tile center, one-shot, then gone. One slot, overwritten. `pointer-events-none`.

## Files

`hud.tsx` `held.tsx` `shop.tsx` `research.tsx` `market.tsx` `inventory.tsx` `recap.tsx`

No `inspect.tsx`. No `toolbar.tsx`.
