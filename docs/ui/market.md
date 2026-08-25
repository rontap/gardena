# Market

Centered overlay (`Overlay`, dim `bg-ink/40`), not a dock. Title **Market**. Overlay `className` `max-h-[calc(100%-4rem)] w-[52rem]`. Panel `{ kind: 'market' }`. Not `{ kind: 'contracts' }`.

HUD **Market** or consign at the truck opens it. [[mechanics/market]].

Underline tabs, same chrome as [[ui/almanac]]:

- `Tabs.Root` `relative z-20 flex min-h-0 flex-1 flex-col`. Default `stall`.
- `Tabs.List` `shrink-0` wrap: `flex flex-wrap gap-1 border-b border-ink/20 bg-house px-4`.
- Triggers `tabTriggerClass` (`whitespace-nowrap`). Do not `overflow-x-auto`. Do not shrink type.

| tab id | label |
|---|---|
| `stall` | **Stall** |
| `contracts` | **Contracts** |

**Contracts** trigger omitted iff `!world.done.has('unlock-contracts')`. [[ui/contracts]]. **Stall** always.

## Stall

Picture `ui-market-stall`. `svg` `viewBox="0 0 240 120"` `h-24 w-full`. One **Sell all** button.

`quote = world.marketQuote()`. Panel reads `quote` fields. No arithmetic. [[mechanics/saturation]].

Empty: `quote.rows.length === 0` → **No produce.** Else one row per `quote.rows` (stocked `StallGoodId`). No berry.

Crop row: box face + count (sum of rarities). Sugar: sugar-bag face, one bin, count only, no rarity tabs. Consign sugar at the truck — [[mechanics/market]]. Count is `binCount(world.stall[row.good])`, not a quote field.

Row: `flex items-center gap-3 bg-ink/8 px-3 py-2 text-base font-semibold`. `ItemFace` + count, then `ml-auto flex items-center gap-3 text-sm tabular-nums`: `{Math.round(row.mul * 100)}%`, direction, `{recoverDays}` as `Nd`.

Direction from `row.sat` only. No sat history. No second store.

| `row.sat` | direction |
|---|---|
| `0` | `—` |
| else | `↓` |

`Nd`: integer when `recoverDays` is whole, else one decimal. Suffix `d`.

[[ui/callout-hover]] on the row. Overlay `aside` (Family host). Hover sets the tip, leave clears it. Title: that good’s existing name — `cropName` / **Sugar** / `SPIRIT_NAME` / **Wine** / **Ketchup** / `{cropName} jam` / **Olive oil** / **Flour** / **Extract**. Description names floor `{SAT_FLOOR[good] * 100}%` and days to clean (`Nd` from `row.recoverDays`). No `why`. Sell-all blocked copy stays under the button.

**Sell all - {Coin n=quote.paid}**. When `quote.paid !== quote.clean`, also `{Coin n=quote.clean}` in `text-ink/55`. `Btn` `w-full` `data-sell-all`. Disabled when `quote.paid === 0` or `!marketOpen`. Click `sellAll()` then close.

`!marketOpen`: overlay still opens (HUD or consign). Consign still works. Sell all stays disabled. Reason under the button: **Stall closed until morning.** (`sunset`, no `open-late`) or **Stall closed at twilight.** (`twilight`, no `open-24`). `text-sm text-roof`.

Assumption: direction is `sat === 0` → `—`; else `↓` (depressed).
