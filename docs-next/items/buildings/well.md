# Well

| | |
|---|---|
| SKU | `buy-well` (Build tab `automation`) |
| price | `SKUS['buy-well'].price` |
| size | 1 × 1 |
| unlocked by | `unlock-water-storage` |
| demolish | yes |
| cell kind | `'well'` |

A water source with its own tank. Its water is not on the water bill.

## Use

Uses `SOURCE.well`: the tank refills at `SOURCE.well.rate` L/s (times the weather's multiplier), holds up to `SOURCE.well.capacity`, and starts full.

- **Fill** with a [[items/other/bucket]] at `SOURCE.well.fill` L/s.
- Joins a water network at any corner of its tile ([[features/water]]).

## Art

`prop-well.svg`.
