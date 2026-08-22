# Market

Centered overlay (`bg-ink/40`), not a dock. Title **Market**. Stall picture `ui-market-stall`. One **Sell all** button.

HUD **Market** or consign at the truck opens it. [[mechanics/market]].

Empty stall: **No produce.** Else one row per stocked `StallGoodId` (`carrot` `potato` `wheat` `tomato` `raspberry` `watermelon` `olive` `grape` `vanilla` `apple` `apricot` `lemon` `cherry` `sugar`). No berry. No `sugar-cane` fruit.

Crop row: box face + count (sum of rarities). Sugar: sugar-bag face, one bin, count only, no rarity tabs. Consign sugar at the truck — [[mechanics/market]].

**Sell all - {Coin n=gain}**. Disabled when `gain === 0` or `!marketOpen`. Click `sellAll()` then close. One number; freshness and rarity already in `marketGain`.

`!marketOpen`: overlay still opens (HUD or consign). Consign still works. Sell all stays disabled. Reason under the button: **Stall closed until morning.** (`sunset`, no `open-late`) or **Stall closed at twilight.** (`twilight`, no `open-24`).
