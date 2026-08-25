# Saturation

Stall pressure. Replaces the dead dynamic market. Types `src/game/sim/market.h.ts`. Spec [[plans/1.8.0]] Part 1. Sell all [[mechanics/market]]. Board [[mechanics/contracts]].

Live on Sell all. Not consign. Not contract delivery. Miss and cancel remainders raise `sat`.

## Files

| file | owns |
|---|---|
| `src/game/sim/market.h.ts` | typedef only. `SAT_DEPTH` `SAT_RECOVER_PER_DAY` `SAT_FLOOR` `PriceMul` `SatSale` `MarketQuote` `SellAllQuote`. Every constant `declare const` |
| `src/game/sim/market.ts` | valued `SAT_*` + `mul` `paid` `recover`. No `World` |
| `src/game/sim/stall.ts` | `StallGood.sat` |
| `src/game/sim/world.ts` | `World.marketQuote()` `marketGain()` recover tick, sell-all bump |
| `src/game/sim/save.ts` | dummy `offered` `market` `target` `acc`. Live `sat` not in the file |

Do not create `src/` here.

## Model

`StallGood.sat: number`, `0..1`, starts 0. Per `StallGoodId`. Bins are decoupled: potato sat does not move vodka. Processed goods do not inherit their input.

Accrues in **dollars**, not units. `SAT_DEPTH` is the clean revenue that takes a good from 0 to fully saturated. Preference.

```
mul(sat, good) = 1 - (1 - SAT_FLOOR[good]) * sat
```

Selling `V` clean dollars raises `sat` by `V / SAT_DEPTH`, clamp 1, after the sale. Rarity, freshness, bio are already inside `V`. A $72 vodka batch moves the vodka bin as far as $72 of carrots moves the carrot bin.

## Floor

`SAT_FLOOR` is a complete `{ [K in StallGoodId]: number }`. Values from groups, preference:

| group | floor |
|---|---|
| `carrot` `potato` `wheat` | 0.55 |
| other `CropId` | 0.40 |
| `sugar` `jam-*` `oil` `flour` `extract` | 0.35 |
| `SpiritKind` `wine` | 0.25 |

Other `CropId`: tomato raspberry watermelon olive grape vanilla sugar-cane apple apricot lemon cherry.

## Trapezoid

Price is linear in `sat`. Sell all of clean `V` pays the integral, not a post-sale sample. No loop, no chunking.

```
k    = 1 - SAT_FLOOR[good]
paid = V * (1 - k * (sat + V / (2 * SAT_DEPTH)))
```

Piecewise if `sat + V / SAT_DEPTH > 1`: integrate to `v* = SAT_DEPTH * (1 - sat)`, remainder at `SAT_FLOOR[good]`.

```
paid = v* * (1 - k * (sat + v* / (2 * SAT_DEPTH))) + (V - v*) * SAT_FLOOR[good]
```

Then `sat = min(1, sat + V / SAT_DEPTH)`.

Ten sales of `V/10` pay the same total as one sale of `V`.

## Order

`marketGain` computes each good's clean subtotal exactly as today — freshness, `stallX`, `raritySale`, saleswoman, heirloom, bio, jam floor — [[mechanics/market]]. Saturation applies **last, per good**, over that subtotal.

Clearance's freshness-0 `$1` floor is exempt. That slice is not in `V`, is paid as `$1` each, and does not raise `sat`.

Consign still accumulates `worth` untouched. Saturation is sampled at Sell all only.

At `sat = 0`, `marketGain()` equals today's number. `marketGain()` returns the paid total (sat applied). Closed: `marketGain()` is 0.

## Recover

Linear. Not exponential. Not a seam reset.

```
sat -= SAT_RECOVER_PER_DAY * dt / DAY_SECONDS      clamp at 0
```

`SAT_RECOVER_PER_DAY` is `1 / 3`. Preference. Every play `dt`, every `StallGoodId`, stocked or empty. Recap freezes the tick, so sat is frozen too. Seam does not write `sat`.

`recoverDays` on a quote is `sat / SAT_RECOVER_PER_DAY`. Derived.

## Quote

```
MarketQuote = {
  good: StallGoodId
  sat: number
  mul: number
  clean: number
  paid: number
  recoverDays: number
}

SellAllQuote = { rows: readonly MarketQuote[]; clean: number; paid: number }
```

`World.marketQuote(): SellAllQuote`. One row per `StallGoodId` with stock. `mul` is `mul(sat, good)` now. `clean` is that good's subtotal before sat, minus the clearance `$1` slice. `paid` is the trapezoid plus that slice. Totals sum the rows.

The panel reads the quote. It does no arithmetic.

`SatSale = { good; clean; paid; before; after }`. `after = min(1, before + clean / SAT_DEPTH)`. Sell all pays, writes `sat = after`, then clears stock and worth.

`marketQuote()` does not mutate `sat`.

## Constants

Valued in `market.ts`. Header stays `declare const`.

| id | value | |
|---|---|---|
| `SAT_DEPTH` | 400 | preference |
| `SAT_RECOVER_PER_DAY` | `1 / 3` | preference |
| `SAT_FLOOR` | groups above | preference |

## Deleted

`DYNAMIC_MARKET`. `nudgeOffered` `nudgeOfferedBody`. `World.sales`. `World.mktAcc`. `retarget`. `rate()`. `StallGood.offered` `market` `target` `acc`. `StallSale`. `Act.nudgeOffered` and its `Cmd` arm. `DynamicMarketRows` `DynamicStallRow`. `tickStall` market walk.

Keep dummy save fields — [[architecture/save]].

## Illegal

- `sat` outside `0..1`
- `SAT_FLOOR` missing a `StallGoodId`
- sat at consign
- sat on the clearance `$1` slice
- seam reset
- exponential recover
- chunking the sale
- panel computing `paid` / `mul` / `recoverDays`
- live `sat` in the file
- processed good inheriting input `sat`
- `DYNAMIC_MARKET` `nudgeOffered` `World.sales` `rate()` `StallGood.offered`

Assumption: clearance `$1` is excluded from `V`. Dummy dump values are 0.
