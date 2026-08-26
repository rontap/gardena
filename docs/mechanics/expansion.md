# Expansion

`CHUNK` — preference. Starter owned: `(0,0)`.

House, door (plot, not house), starter pump, actor at door center. Layout identifiers in `sim/ids.ts`.

4-connected. Research `unlock-expand` first — [[mechanics/research]]. Then edge expand.

## Permits

Money is not enough. Every expansion also spends one permit.

```
expandSlots = unlock-expand + expand-land + eminent-domain + skillTier('inherit-land') + prizeSlots
expandLeft  = max(0, expandSlots - purchases)
```

Three from research, two from `inherit-land` — [[mechanics/family]] — and one per band-3 prize from Trade Jo or Mercanova — [[mechanics/contracts]]. `World.prizeSlots` is the saved prize counter; `purchases` is the spend counter.

`expandLeft() <= 0` is a hard no-op in `expandBody`. Faces stay drawn and read `No permit left` instead of `Expand $N`.

HUD remaining-permit count is `expandLeft()`. Derived. Not a World field.

```
expandPrice = 40 + 15 * purchases
tax = 2 + 6 * (owned.length - 1)
```

Then `× (1 − 0.02 × tax tier)`. Then min $1 — [[mechanics/family]].

`40`, `15`, `2`, `6` — preference. Tax used at sundown — [[mechanics/day]].

`expand(id)` instant. No-op if owned, not a 4-neighbor, research locked, no permit left, or `money < price`. Else deduct, push chunk, `purchases++`, generate.

## Start chunk

House, starter pump, truck, door, yard reserved. Rocks, one wild apple tree — [[mechanics/trees]]. Soft / hard / very-hard from goodness — [[mechanics/soil]].

## Invariants

`expansion.tax` — Seam: `money += DAY_STIPEND` then `money -= tax()`. `tax() = 2 + 6 * (owned.length - 1)`, then `× (1 − 0.02 × tax tier)`, then min $1. Money may be negative.

`expansion.chunk` — `CHUNK`. `expandPrice = 40 + 15 * purchases`. 4-connected after `unlock-expand`.
