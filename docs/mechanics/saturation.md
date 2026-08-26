# Saturation

Stall pressure. Types `src/game/sim/market.h.ts`. Spec [[plans/1.8.0]] Part 1. Sell all [[mechanics/market]]. Board [[mechanics/contracts]].

Live on Sell all. Not consign. Not contract delivery. Miss and cancel remainders raise `sat`.

## Model

`StallGood.sat: number`, `0..1`, starts 0. Per `StallGoodId`. Bins are decoupled: potato sat does not move vodka. Processed goods do not inherit their input.

Accrues in **dollars**, not units. `SAT_DEPTH` is the clean revenue that takes a good from 0 to fully saturated. Preference.

```
mul(sat, good) = 1 - (1 - SAT_FLOOR[good]) * sat
```

Selling `V` clean dollars raises `sat` by `V / SAT_DEPTH`, clamp 1, after the sale. Rarity, freshness, bio are already inside `V`.

## Floor

`SAT_FLOOR` is a complete `{ [K in StallGoodId]: number }`. Values from groups, preference: starter crops higher floor; other `CropId` mid; sugar / jam / oil / flour / extract lower; `SpiritKind` / wine lowest.

## Trapezoid

Price is linear in `sat`. Sell all of clean `V` pays the integral, not a post-sale sample.

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

`marketGain` computes each good's clean subtotal — freshness, `stallX`, `raritySale`, saleswoman, heirloom, bio, jam floor — [[mechanics/market]]. Saturation applies **last, per good**, over that subtotal.

Clearance's freshness-0 `$1` floor is exempt. That slice is not in `V`, is paid as `$1` each, and does not raise `sat`.

Consign still accumulates `worth` untouched. Saturation is sampled at Sell all only.

At `sat = 0`, `marketGain()` equals the clean number. `marketGain()` returns the paid total (sat applied). Closed: `marketGain()` is 0.

## Recover

Linear. Not a seam reset.

```
sat -= SAT_RECOVER_PER_DAY * dt / DAY_SECONDS      clamp at 0
```

`SAT_RECOVER_PER_DAY` — preference. Every play `dt`, every `StallGoodId`, stocked or empty. Recap freezes the tick, so sat is frozen too. Seam does not write `sat`.

`recoverDays` on a quote is `sat / SAT_RECOVER_PER_DAY`. Derived.

## Quote

`World.marketQuote(): SellAllQuote`. One row per `StallGoodId` with stock. `mul` is `mul(sat, good)` now. `clean` is that good's subtotal before sat, minus the clearance `$1` slice. `paid` is the trapezoid plus that slice. Totals sum the rows.

The panel reads the quote. It does no arithmetic.

`SatSale = { good; clean; paid; before; after }`. `after = min(1, before + clean / SAT_DEPTH)`. Sell all pays, writes `sat = after`, then clears stock and worth.

`marketQuote()` does not mutate `sat`.

Live `sat` is not in the file. Load → `sat` 0. New farm → `sat` 0. Digest includes `sat` — [[architecture/net]]. Dummy dump fields `offered` `market` `target` `acc` — [[architecture/save]].

Assumption: clearance `$1` is excluded from `V`. Dummy dump values are 0.

## Invariants

`sat.recover` — `sat` is `0..1` per `StallGoodId`, starts 0, ticks down `SAT_RECOVER_PER_DAY` per day on every good every `dt`, never resets at the seam.

`sat.trapezoid` — Sell all of clean value `V` at `sat` pays the trapezoid, clamped piecewise at `SAT_FLOOR[good]`. Ten sales of `V/10` pay the same total as one sale of `V`.

`sat.last` — Saturation applies last, per good, over the existing `marketGain` subtotal. Clearance's `$1` floor is exempt.
