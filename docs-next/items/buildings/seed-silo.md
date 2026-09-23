# Seed silo

| | |
|---|---|
| SKU | starting building; not sold |
| size | 1 × 2 tiles (`SILO_BASE`) |
| unlocked by | start |
| demolish | no |
| cell kind | `'seed-silo'` |

The farm's store for seeds and the place to buy seed packs.

## Use

**Open Seed silo** walks the gardener to it, puts every seed item from the hand and inventory into it, and opens its panel.

- Holds up to `SILO_SEED_CAP` seeds, as stacks by crop and variety.
- Taking a stack puts all of it in the hand. If the hand holds seeds of the same crop and variety, the counts merge and quality is averaged.
- Buying a pack (`pack-{crop}`) adds 5 Plain seeds to the silo (the count in `skuItem`). Buying five packs at once adds 25 and costs 5 × the pack price × 0.95 (`packsPrice`). Bought seed quality is `seedBankQuality` of the `seed-bank` skill plus `FAMILIARITY_SEED_QUALITY` × the crop's familiarity, at most 1.
- A purchase that does not fit is refused with **Seed silo full**.

The Seeding silo (`buy-silo-seed`) is a separate building for vehicles with the same store rules ([[features/vehicles]]).

## Connections

Vehicle loading spots above and below ([[systems/building-io]]).

## Screen

Prompt **Open Seed silo** (`prompt_open`). Panel: `store.tsx`.

## Art

`prop-seed-silo.svg`.
