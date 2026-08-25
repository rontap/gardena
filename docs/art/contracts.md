# Contracts

`src/assets/ui/ui-contract-stars.svg`. Rules from [[art/svg]] and [[art/palette]] hold.

## Stars

`ui-contract-stars.svg` — viewBox `0 0 36 8`. No width/height. Sibling groups `s1` `s2` `s3` `s4`. Each group is the full 4-slot strip. View shows exactly one group (`s{offer.stars}`). All groups paint if the whole file is mounted.

`sN` fills slots `0..N-1` ripe, rest house. Slot 0 left. No `s0`. Stars `1 | 2 | 3 | 4`. Do not draw four loose marks.

5×5 pixel-rect star per slot, 1px gap (stride 6). Ink silhouette, body fill.

| token | hex | use |
|---|---|---|
| ripe | `#d4a017` | filled star body |
| house | `#cfc6b0` | empty star body |
| ink | `#1c1710` | outline |

Assumption: 1px top inset in the 8-tall box; strip left-aligned, spare viewBox to the right.
