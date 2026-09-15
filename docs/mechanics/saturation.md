# Saturation

Market pressure. Types `src/game/sim/market.h.ts`. Sell all [[mechanics/market]]. Board [[mechanics/contracts]].

Live on Sell all. Not consign. Not contract delivery. Miss and cancel plain remainders raise `sat`. Infused stall and infused miss / cancel remainders do not — [[mechanics/infusion]] `infusion.stall`.

## Model

`StallGood.sat: number`, `0..1`, starts 0. Per `StallGoodId`. Bins are decoupled: potato sat does not move vodka. Processed goods do not inherit their input.

Accrues in **units**, not dollars. `sat = 1` is `SAT_MAX_CUT` of cut. Preference.

```
cut(sat, cap) = min(cap, sat * SAT_MAX_CUT)
mul(sat, cap, weatherAdd) = 1 - cut(sat, cap) + weatherAdd
```

`weatherAdd` is `WEATHER_FRUIT_IMPACT` on fruit during flood or drought, else 0. — [[mechanics/weather]]

## Maximum market impact

`cap` is that row's maximum cut from 100%. Preference:

| row | cap |
|---|---|
| fruit, variety tier `base` | `SAT_IMPACT_FRUIT.base` |
| fruit, variety tier `variant` | `SAT_IMPACT_FRUIT.variant` |
| fruit, variety tier `heirloom` | `SAT_IMPACT_FRUIT.heirloom` |
| jam / spirit / wine / cider, variety tier `base` | `SAT_IMPACT_CRAFT.base` |
| jam / spirit / wine / cider, variety tier `variant` or `heirloom` | `SAT_IMPACT_CRAFT.variant` |
| sugar / oil / flour / extract / bread | `SAT_IMPACT_CRAFT.base` |

Fruit and craft steps: `SAT_STEP_FRUIT` per fruit unit, `SAT_STEP_CRAFT` per jam / alcohol / mill unit and per sugar liter. Shared `sat` on the good still rises by `n * step / SAT_MAX_CUT` when plain units sell, even if this row's `cap` is already reached.

Shown percent = `100 × mul`. Clear + full Plain fruit = 50%. Flood + none = 140%. Flood + full Plain fruit = 90%.

## Trapezoid

Price is linear in units. Sell all of `n` units from `sat` pays the integral, not a post-sale sample. Unit `i` (0-indexed) is cut `min(cap, sat * SAT_MAX_CUT + i * step)`. Then `sat = min(1, sat + n * step / SAT_MAX_CUT)`.

At `sat = 0` the first unit pays 0 cut and still raises `sat` by one step. `n` singles with no recover pay the same total as one sale of `n`.

Piecewise if the ramp crosses `cap`: sum the ramp, remainder at `cap`. `sat` may still rise toward 1.

Infused units all pay `mul` at that good's `sat` at the start of Sell all for that good, and do not raise `sat`.

## Order

`marketGain` computes each row's clean subtotal — [[mechanics/market]]. Saturation applies **last, per good**. Plain stacks of that good walk `VARIETY_IDS` order (base, then Named, then Heirloom). Infused of that good sample start-of-good `sat`.

Clearance's `{ kind: 'rotten' }` `$1` is exempt. That slice is not in the unit count, is paid as `$1` each, and does not raise `sat`.

Consign still accumulates `worth` untouched. Saturation is sampled at Sell all only.

## Recover

Linear toward 100% shown, 30 points a day, both sides. Not a seam reset.

50% → 80%. 70% → 100%. 99% → 100%. 120% → 100% the same day.

`SAT_RECOVER_PER_DAY` is shown points (preference). `sat` step is that over `SAT_MAX_CUT`.

A crop stall recovers faster the more that crop has been studied: `recoverPerDay` is `SAT_RECOVER[good] + familiarity × FAMILIARITY_RECOVER`, crop stalls only, never a crafted good — [[mechanics/machines]] `familiarity.gain`. Since one fruit costs `SAT_STEP_FRUIT` of cut, a level is `FAMILIARITY_RECOVER / SAT_STEP_FRUIT` more fruit the stall absorbs in a day, so how much a crop gains is set by its cap: one band 2.5 fruit, two bands 5, three bands 7.5. Every play `dt`, every `StallGoodId`, stocked or empty. Recap does not freeze the tick. Overlay pause while the recap popup is open is App-local. Seam does not write `sat` from recover.

At seam, two fruit crops get integer `[-20, 20]` shown points from `rng.stream('market-demand')` at the new day. `sat` clamp `SAT_MIN`..`SAT_MAX` (−80%..+50% cut).

`recoverDays` on a quote is `|sat| * SAT_MAX_CUT / SAT_RECOVER_PER_DAY`. Derived.

## Quote

`World.marketQuote(): SellAllQuote`. One row per stocked `(StallGoodId, VarietyId, InfusedKey)`. `mul` is `mul(sat, cap, weatherAdd)` now for that row. `clean` is that row's subtotal before sat, minus the clearance `$1` slice. `paid` is the unit trapezoid (plain) or `clean × mul` (infused) plus that slice on the total. `after` is each good's `sat` if Sell all ran. Totals sum the rows.

The panel reads the quote. It does no arithmetic.

Sell all pays, writes `sat = after[good]`, then clears stock and worth.

`marketQuote()` does not mutate `sat`.

Live `sat` is not in the file. Load → `sat` 0. New farm → `sat` 0. Digest includes `sat` — [[architecture/net]]. Dummy dump fields `offered` `market` `target` `acc` are 0 — [[architecture/save]].

## Invariants

`sat.recover` — `sat` starts 0, ticks toward 0 by `SAT_RECOVER_PER_DAY` shown points per day on every good every `dt`, never resets at the seam. 50% → 80%, 70% → 100%.

`familiarity.market` — `recoverPerDay(good)` adds `familiarity × FAMILIARITY_RECOVER` to `SAT_RECOVER[good]` for crop stalls only; a crafted good never moves however studied its input crop is. A studied apple or apricot doubles its `0.15`; wheat and olive stop at two bands and reach `0.25`.

`sat.trapezoid` — Sell all of `n` units at `sat` pays the unit trapezoid, unit `i` cut `min(cap, sat * SAT_MAX_CUT + i * step)`, then `sat = min(1, sat + n * step / SAT_MAX_CUT)`. `n` singles with no recover pay the same total as one sale of `n`.

`sat.last` — Saturation applies last, per good, over the existing `marketGain` subtotal. Clearance `{ kind: 'rotten' }` `$1` is exempt.

`sat.infused` — Infused clean `V_inf` pays `V_inf × mul(sat, cap, weatherAdd)` at sat at the start of that good and does not raise `sat`. Plain unit trapezoid from that same sat still raises `sat` by `n * step / SAT_MAX_CUT`. Infused miss / cancel remainders do not raise `sat`.
