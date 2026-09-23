# Pump

| | |
|---|---|
| size | 2 × 1 |
| cell kind | `'pump'` (`form`: `starter` or `jack`) |

A water source with its own tank. Its water costs money: every litre taken from a pump is added to the day's water bill ([[features/weather-day]]).

## Kinds

| | Pump | Pumpjack |
|---|---|---|
| obtained | starting building (`PUMP_BASE`) | `buy-pumpjack`, after `unlock-water-storage` |
| demolish | no | yes |

Both use `SOURCE.pump`: the tank refills at `SOURCE.pump.rate` litres per second (times the weather's multiplier), holds up to `SOURCE.pump.capacity`, and starts full.

## Use

- **Fill** with a [[items/other/bucket]]: fills at `SOURCE.pump.fill` L/s from the pump's own tank.
- Joins a water network at any corner of its two tiles; sprinklers, taps and stills on that network draw from it ([[features/water]]).
- Water bill: pump litres used today × `PUMP_COST_PER_L` × the weather's price multiplier, paid at the end of the day.

## Connections

Signal input: while on, the tank does not refill ([[systems/signals]]).

## Screen

Hover: **Pump**. Build and demolish name: **Pumpjack**.

## Art

`prop-pump.svg`.
