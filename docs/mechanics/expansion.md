# Expansion

`CHUNK = 32` — preference. Starter owned: `(0,0)` = tiles `[0,32)×[0,32)`.

House `{14,6,4×3}`. Door `(15,9)` — plot, not house. Starter pump `(18,7)`. Actor starts door center.

4-connected. Research `unlock-expand` first — [[mechanics/research]]. Then edge `expand $N`.

## Permits

Money is not enough. Every expansion also spends one permit. 1.8.0.

```
expandSlots = unlock-expand + expand-land + eminent-domain + skillTier('inherit-land') + prizeSlots
expandLeft  = max(0, expandSlots - purchases)
```

Three from research, two from `inherit-land` — [[mechanics/family]] — and one per band-3 prize from Trade Jo or Mercanova — [[mechanics/contracts]]. `World.prizeSlots` is the only new saved field; `purchases` was already the spend counter.

`expandLeft() <= 0` is a hard no-op in `expandBody`. Faces stay drawn and read `No permit left` instead of `Expand $N`, so the edge says why it is dead rather than vanishing.

HUD remaining-permit count is `expandLeft()`. Derived. Not a World field.

```
expandPrice = 40 + 15 * purchases
tax = 2 + 6 * (owned.length - 1)
```

Then `× (1 − 0.02 × tax tier)`. Then min $1 — [[mechanics/family]].

`40`, `15`, `2`, `6` — preference. Tax used at sundown — [[mechanics/day]].

`expand(id)` instant. No-op if owned, not a 4-neighbor, research locked, no permit left, or `money < price`. Else deduct, push chunk, `purchases++`, generate.

Poor: visible, click no-op.

## Start chunk

House, starter pump, truck, door, yard reserved. Rocks, berry shrubs, one wild apple tree — [[mechanics/plants]]. Soft / hard / very-hard from goodness — [[mechanics/soil]].
