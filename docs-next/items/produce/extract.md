# Extract

| | |
|---|---|
| item kind | `'extract'` |
| unit | litres; a bag holds `EXTRACT_BAG_LITERS` |
| stack limit | 1 bag |
| made by | [[items/buildings/mill]] from [[items/other/cut-grass]]; Infused Extract by [[items/buildings/infuser]] |
| sold at | not sold |

Pressed from cut grass and poured on a plant or tree to speed up its growth. Different item from [[items/produce/vanilla-extract]] and [[items/produce/truffle-extract]].

## Variants

| name | `infused` | made by | growth time | weed chance of the plot |
|---|---|---|---|---|
| Extract | false | Mill, one full bag per `MILL_GRASS` Cut grass | `EXTRACT_SECONDS` | unchanged |
| Infused Extract | true | Infuser, one full bag of Extract + one Fly agaric or Truffle extract | `EXTRACT_INFUSED_SECONDS` | lowered to `WEED_DUG`, as **Dig weed** sets it; never raised |

Infused Extract shows **Infused Extract** and the infused overlay, as other infused goods do ([[features/machines]]).

## Use

**Pour extract** takes `EXTRACT_WORK` seconds and uses `EXTRACT_POUR` L. On a growing plant that has not had Extract, growth gains `EXTRACT_GROWTH` ÷ `EXTRACT_SECONDS` per second for the growth time of the bag's variant ([[features/plants]]). Infused Extract also sets the plot's weed chance to `WEED_DUG` when it is higher. A growing plot does not recover its weed chance, so the value holds until the plant ripens, dies or is harvested, and then rises as on a dug plot ([[features/weeds]]). On a sapling or stump the tree's growth gains the same; on a grown tree out of season its chance of a new season rises by `EXTRACT_SEASON`, the same for both variants ([[features/trees]]). A plant or tree that cannot take it shows no prompt, and nothing is used. The bag leaves the hand when it holds less than `EXTRACT_POUR` L. The Sprayer trailer does not carry it. While the growth time runs (`boost` > 0), the Growth bar of that plant or tree in the inspect column shows a sweep ([[shell]]); a grown tree out of season has no growth time, so it shows none.

## Properties

Carries `liters`, `capacityLiters` and `infused`; no `quality`, no `unitSale`. No freshness. Bags do not stack.

## Selling

Not a Market good (`consignUnits` returns 0), and no contract asks for it.

## Art

`item-extract.svg`. A finished **Pour extract** shows the green pour burst `pour-green` on the plot or tree ([[art/vfx]]).

## Sound

**Pour extract** plays `pourDeep`, a pour lower than the water pour ([[systems/sound]]).
