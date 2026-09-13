# Market

Centered overlay (`Overlay`, dim `bg-ink/40`), not a dock. Title **Market**. Overlay `className` `h-[min(40rem,calc(100vh-6rem))] w-[72rem]`. Definite height, same pattern as [[ui/almanac]]. Panel `{ kind: 'market' }`. Not `{ kind: 'contracts' }`.

HUD **Market** or consign at the truck opens it. [[mechanics/market]].

Solo (`role === 'off'`): open pauses the sim clock. Close restores the previous pause state unless the player had already paused. Host / guest: no auto-pause. [[ui/hud]]

Underline tabs, same chrome as [[ui/almanac]]:

- `Tabs.Root` `relative z-20 flex min-h-0 flex-1 flex-col`. Controlled, not `defaultValue`.
- `Tabs.List` `shrink-0` wrap: `flex flex-wrap gap-1 border-b border-ink/20 bg-house px-4`.
- Triggers `tabTriggerClass` (`whitespace-nowrap`). Do not `overflow-x-auto`. Do not shrink type.

| tab id | label |
|---|---|
| `market` | **Market** |
| `contracts` | **Contracts** |

**Contracts** trigger omitted iff `!world.done.has('unlock-contracts')`. [[ui/contracts]]. **Market** always.

## Which tab opens

The tab the player last chose. `MarketTab` = `'market' | 'contracts'`, App state beside `panel`, passed in as `tab` with `onTab`. Closing the overlay and opening it again lands on the same tab; a player checking a running contract does not re-pick Contracts every time. `value` is `contracts ? tab : 'market'` — with the Contracts trigger absent there is no panel to show, so a remembered `contracts` reads as Market until the research lands. Not Save, not a `Cmd`: it dies with the session, like the search box.

## Market

Ledger, not a stack of boxes. No stall picture. `Tabs.Content` fills the overlay: Demand chips, header, scroll body, footer.

Demand: Label **Demand**. Empty (`marketDemand()` length 0): level price-arrow plus **All Market prices are normal.** Not a slot grid. Occupied: `w-fit` `grid-cols-6` `gap-2`, each cell `h-20 w-20` `bg-ink/15` padded, icon + price-arrow, hover `bg-ink/25`. One cell per `StallGoodId` whose shown Demand is not 100%. Chip `recoverDays` is on the chip. Hover: [[ui/callout-hover]] Overlay `aside`, title the good’s name, body `{shown}%` and Maximum Market Impact + days to clean.

`quote = world.marketQuote()`. Panel reads `quote` fields. No arithmetic. [[mechanics/saturation]].

Four columns, one template: Produce | Quantity | Demand | Sale price.

Header: Label on every column. Quantity, Demand, and Sale price right-align with their cells.

Empty: `quote.rows.length === 0` → **No produce.** centered in the body. Else one row per `quote.rows` (stocked good × variety × infused). Body is `scroll-pane`. Hairline under each row. Hover `bg-ink/6`. Not `bg-ink/8` cards.

Row: `ItemFace` + name; count `tabular-nums` right; price-arrow + `{shown}%` in water / tier-3 / tier-4; Coin paid right. No Infused column.

Price-arrow `ui-price-arrow.svg`. Rotation is absolute: 50% → 90deg, 100% → 0, 140% → −90deg. Tint: shown > 100% water; else cut < half of that row’s cap → tier-3; else tier-4. Face badge count is `row.count`.

[[ui/callout-hover]] on the row. Title: that row’s name. Description names Maximum Market Impact `{cap * 100}%` and days to clean. Flakes and vanilla-extract have no row.

Footer, pinned: **Sell all** left, `{Coin n=quote.paid}` right. When `quote.paid !== quote.clean`, also `{Coin n=quote.clean}` in `text-ink/55`. `Btn` `w-full` `data-sell-all`. Disabled when `quote.paid === 0`. Click `sellAll()` then close.

`marketOpen` is always true. Overlay opens (HUD or consign). Consign always. Sell all is not hours-blocked. [[mechanics/market]] `market.sell`. [[mechanics/weather]]
