# Expansion

`CHUNK = 32` — preference. Starter owned: `(0,0)` = tiles `[0,32)×[0,32)`.

House `{14,6,4×3}`. Door `(15,9)` — plot, not house. Starter pump `(18,7)`. Actor starts door center.

4-connected. Research `unlock-expand` first — [[mechanics/research]]. Then edge `expand $N`.

```
expandPrice = 40 + 15 * purchases
tax = 2 + 6 * (owned.length - 1)
```

Then `× (1 − 0.02 × tax tier)`. Then min $1 — [[mechanics/family]].

`40`, `15`, `2`, `6` — preference. Tax used at sundown — [[mechanics/day]].

`expand(id)` instant. No-op if owned, not a 4-neighbor, research locked, or `money < price`. Else deduct, push chunk, `purchases++`, generate.

Poor: visible, click no-op.

## Start chunk

House, starter pump, truck, door, yard reserved. Rocks, berry shrubs, one wild apple tree — [[mechanics/plants]]. Soft / hard / very-hard from goodness — [[mechanics/soil]].
