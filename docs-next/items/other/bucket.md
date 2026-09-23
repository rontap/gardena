# Bucket

| | |
|---|---|
| item kind | `'container'` |
| unit | litres (`liters`, `capacityLiters`) |
| stack limit | 1 |
| obtained from | see sizes |
| sold at | not sold |

Carries water from a water source to plots and trees.

## Sizes

Values from `CONTAINERS` in `defs/items.ts`.

| | Bucket | Large bucket |
|---|---|---|
| id | `bucket` | `large-bucket` |
| capacity | 5 L | 10 L |
| shop | `buy-bucket`, from the start | `buy-bucket-large`, after `unlock-better-tools` |
| other sources | one at the door of a new game | — |

## Use

- **Fill** at a pump, pumpjack, well or tap. The bucket fills over time at the building's fill rate: `SOURCE.pump.fill` at a pump or pumpjack, `SOURCE.well.fill` at a well, `TAP_RATE` at a tap. A pump or well gives what its own tank holds; a tap draws from its water network ([[features/water]]).
- **Water** on a plot or tree adds water up to the top of the plant's green range, or to the middle for a plot with nothing growing, and uses only the difference ([[features/plants]]).
- An empty bucket on a plot shows **Bucket empty**.

An empty bucket stays in the hand.
