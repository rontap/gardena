# Market

Centered overlay (`Overlay`, dim `bg-ink/40`), not a dock. Title **Market**. Overlay `className` `max-h-[calc(100%-4rem)] w-[72rem]`. Panel `{ kind: 'market' }`. Not `{ kind: 'contracts' }`.

HUD **Market** or consign at the truck opens it. [[mechanics/market]].

Solo (`role === 'off'`): open pauses the sim clock. Close restores the previous pause state unless the player had already paused. Host / guest: no auto-pause. [[ui/hud]]

Underline tabs, same chrome as [[ui/almanac]]:

- `Tabs.Root` `relative z-20 flex min-h-0 flex-1 flex-col`. Controlled, not `defaultValue`.
- `Tabs.List` `shrink-0` wrap: `flex flex-wrap gap-1 border-b border-ink/20 bg-house px-4`.
- Triggers `tabTriggerClass` (`whitespace-nowrap`). Do not `overflow-x-auto`. Do not shrink type.

| tab id | label |
|---|---|
| `stall` | **Stall** |
| `contracts` | **Contracts** |

**Contracts** trigger omitted iff `!world.done.has('unlock-contracts')`. [[ui/contracts]]. **Stall** always.

## Which tab opens

The tab the player last chose. `MarketTab` = `'stall' | 'contracts'`, App state beside `panel`, passed in as `tab` with `onTab`. Closing the overlay and opening it again lands on the same tab; a player checking a running contract does not re-pick Contracts every time. `value` is `contracts ? tab : 'stall'` — with the Contracts trigger absent there is no panel to show, so a remembered `contracts` reads as Stall until the research lands. Not Save, not a `Cmd`: it dies with the session, like the search box.

## Stall

Picture `ui-market-stall`. `svg` `viewBox="0 0 240 120"` `h-24 w-full`. One **Sell all** button.

`quote = world.marketQuote()`. Panel reads `quote` fields. No arithmetic. [[mechanics/saturation]].

Empty: `quote.rows.length === 0` → **No produce.** Else one row per `quote.rows` (stocked `StallGoodId`).

Crop row: `'base'` fruit face + count (sum of variety bins). Sugar: sugar-bag face, one bin, count only. Consign sugar at the truck — [[mechanics/market]]. Count is `binCount(world.stall[row.good])`, not a quote field. One row per stocked `StallGoodId`. No variety tabs.

Row: `flex items-center gap-3 bg-ink/8 px-3 py-2 text-base font-semibold`. `ItemFace` + count, then `ml-auto flex items-center gap-3 text-sm tabular-nums`: `{Math.round(row.mul * 100)}%`, direction, `{recoverDays}` as `Nd`.

Direction from `row.sat` only. No sat history. No second store.

| `row.sat` | direction |
|---|---|
| `0` | `—` |
| else | `↓` |

`Nd`: integer when `recoverDays` is whole, else one decimal. Suffix `d`.

[[ui/callout-hover]] on the row. Overlay `aside` (Family host). Hover sets the tip, leave clears it. Title: that good’s existing name — `cropName` / **Sugar** / `SPIRIT_NAME` / **Wine** / **Ketchup** / `{cropName} jam` / **Olive oil** / **Flour** / **Extract** / **Bread**. Infused stock draws overlay-infused on the face. Description names floor `{SAT_FLOOR[good] * 100}%` and days to clean (`Nd` from `row.recoverDays`). Infused: **Infused goods sell at this percent. Selling them does not change this percent.** No `why`. Sell-all blocked copy stays under the button. Flakes and vanilla-extract have no row.

**Sell all - {Coin n=quote.paid}**. When `quote.paid !== quote.clean`, also `{Coin n=quote.clean}` in `text-ink/55`. `Btn` `w-full` `data-sell-all`. Disabled when `quote.paid === 0` or `!marketOpen`. Click `sellAll()` then close.

`!marketOpen`: overlay still opens (HUD or consign). Consign still works. Sell all stays disabled. Reason under the button (`text-sm text-roof`) — the why line. Weather-blocked copy first; hours copy unchanged otherwise. `open-late` does not reopen a weather block. Closed copy: [[mechanics/market]] `market.sell`. [[mechanics/weather]]
