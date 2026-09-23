# Variety sorter

| | |
|---|---|
| SKU | `buy-sorter` (Build tab `automation`) |
| price | `SKUS['buy-sorter'].price` |
| size | 1 × `SORT_LEN` or `SORT_LEN` × 1, by facing |
| unlocked by | `unlock-crop-variants` |
| demolish | yes |
| cell kind | `'sorter'` |
| recipe kind | none ([[features/machines]]) |

Splits seeds, fruit, tree seeds and grafts by variety tier into three chests.

## Use

Rotated when placed (**Rotate**, four facings). It takes one item with a variety at a time from the chest at its input, holds it `SORT_SECONDS`, and puts it into the chest at the output for its tier: Plain, Named or Heirloom. If that chest is full it waits with the item.

```
facing e:
              +---+
              | S |--> Plain chest
              +---+
  input  -->  | S |--> Named chest
  chest       +---+
              | S |--> Heirloom chest
              +---+
```

## Connections

Input and outputs as drawn; the same tiles serve vehicles ([[systems/building-io]]).

## Screen

Hover: **Variety sorter**, sorting **{name}**, or **The {tier} side is full**.

## Art

`prop-sorter-h.svg`, `prop-sorter-v.svg`.
