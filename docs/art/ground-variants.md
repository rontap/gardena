# Ground variants

Tile selection per ground cell in `layers/ground.ts`. Hardness from `goodness(seed, col, row)` (`src/game/sim/noise.ts`): very-hard `g < 0.2`, hard `g < 0.34`, else soft.

## Bands

Noise-based, not random. Equal thirds within each tier.

| tier | g range | variants |
|---|---|---|
| very-hard | `[0, 0.0667)` | `tile-very-hard-0` (harshest) |
| | `[0.0667, 0.1333)` | `tile-very-hard-1` |
| | `[0.1333, 0.2)` | `tile-very-hard-2` (softest) |
| hard | `[0.2, 0.2467)` | `tile-hard-0` |
| | `[0.2467, 0.2933)` | `tile-hard-1` |
| | `[0.2933, 0.34)` | `tile-hard-2` (bridges to vh-2) |

Infertile cells use the same very-hard band as their position's noise.

## Grass

Random per tile via `tileVariant`: group = `tileVariant(col, row, 2)`, variant within group = `tileVariant(col, row, 4, 1)`. Tile index = `group * 4 + variant`.

## Art

All variants share the grass base `#4a7c3f`. Very-hard family: rock patches (`#1c1710` outline, `#6b4423` fill, `#cfc6b0` glint). Hard family: dirt patches (`#6b4423` border, `#8a5a32` fill).
