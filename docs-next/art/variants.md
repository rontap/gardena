# Variants

Code: `view/layers/ground.ts`, `view/layers/plots.ts`, `tileVariant` in `view/camera.ts`, `goodness` in `sim/noise.ts`, the face selectors `ripeGroup`, `fruitGroup`, `jamArt`, `spiritArt` in `view/svgs.ts`; see [[code-map]].

Art that changes from tile to tile, so a field does not repeat, and art that changes with a crop's variety, so the player can see which variety they hold.

## Picking a variant by position

`tileVariant(col, row, n, salt)` hashes a tile's position to a number from 0 to n − 1. It is the same on every load and every player's screen, and it is not a random stream. Grass, dirt, rocks and burrows use it.

| on the map | files | picked by |
|---|---|---|
| grass | `tile-grass-0` … `tile-grass-7` | `tileVariant(col, row, 2) × 4 + tileVariant(col, row, 4, 1)` |
| tilled plot | `tile-dirt-0`, `tile-dirt-1` | `tileVariant(col, row, 2)` |
| one-tile rock | `prop-rock`, `prop-rock-1` | `tileVariant(col, row, 2)`; a two-tile rock is `prop-rock-long` |
| burrow | `prop-burrow`, `prop-burrow-1` | `tileVariant(col, row, 2)` |

The two burrow files are two different cracks, not one crack mirrored: a mirrored copy is the same shape, and a field of them repeats.

## Ground hardness

Hard and very hard ground are drawn from the same noise that decides the soil (`goodness`, [[features/plants]]), split into bands so the ground darkens smoothly toward the hardest patches.

```
goodness  0 ........ VERY_HARD_MAX ........ HARD_MAX ........................ 1
          | vh-0 | vh-1 | vh-2 | hard-0 | hard-1 | hard-2 |     grass by position
          harshest                                      softest
```

Each range is split in three equal bands. Very hard ground and infertile ground use `tile-very-hard-{0,1,2}`; hard ground `tile-hard-{0,1,2}`; soft ground is grass. All of them share the grass base colour: very hard ground adds rock patches, hard ground dirt patches.

A rock is drawn over the band its tile's noise gives, not over grass, so a rock on hard ground does not cut a green square out of it.

## Land not owned

Tiles outside the owned chunks, up to `FADE` tiles away, are drawn with the same hardness bands at reduced opacity: the first ring more visible, the rest fainter. Clicking there says the land is not owned. Farther out nothing is drawn ([[features/expansion]]).

## Tilled edges

Tilled plots next to each other share one continuous dirt texture. Where a plot meets untilled ground, a rotated `tile-dirt-edge` draws a raised lip that hangs over the neighbour tile, so plot borders do not read as hard boxes. Where three of the four quarters around a corner are tilled and the fourth is not, `tile-dirt-inset` fills that corner.

Both files draw outside their 24-unit box. The atlas pads them by `EDGE_PAD` on every side (a `-4 -4 32 32` viewBox) so the overhang is kept (`view.edge` in `atlas.test.ts`).

## Variety faces

A crop's variety is one of three tiers: Plain (`base`), Named (`variant`) and Heirloom (`heirloom`) ([[features/plants]]). A crop has one face for each variety it has, no more and no fewer: a spare face is art no player can reach, and a copy of the base face is a variety the player cannot tell apart.

| art | groups | selector |
|---|---|---|
| ripe annual crop on a plot | `ripe`, `ripe-variant`, `ripe-heirloom` | `ripeGroup` |
| ripe tree | the same three, in `prop-*-tree` | `treeAtlasStage` |
| fruit | `base`, `variant`, `heirloom` | `fruitGroup` |
| graft | `base`, `variant`, `heirloom` in `item-graft-*`; an annual crop's graft draws the apple cutting (`graftSpecies`) | `fruitGroup` |
| wine and cider | `base`, `heirloom`; a Named cask draws `base` | `caskGroup` |

Growing, dead and unripe stages carry no variety: the player cannot tell the variety until the fruit colours. The variety shows in the fruit's colour and shape only, never in a leaf or canopy tint.

A variety that renames its product draws its own file; every other variety of that crop draws the crop's face. `jamArt` and `spiritArt` are the only places this is decided (`view.named-face`):

| variety | product | file |
|---|---|---|
| `concord` | jam | `item-jam-concord` |
| `black-raspberry` | jam | `item-jam-black-raspberry` |
| `san-marzano` | passata, sold in a can | `item-passata` |
| any tomato | ketchup | `item-ketchup` |
| `klosterneuburger` | brandy | `item-spirit-palinka` |

An infused good draws its plain face with `overlay-infused.svg` in the top-right corner ([[features/machines]]).

## Invariants

| id | rule | test |
|---|---|---|
| `view.variety` | ripe, fruit, cask, tree and graft faces pick the variety's tier as the group; one crop has at most one `variant` and one `heirloom` | `atlas.test.ts` |
| `view.named-face` | `jamArt` and `spiritArt` decide every renamed product face, and each face they name has a file | `atlas.test.ts` |
| `view.groups` | each file carries exactly the groups the code asks for | `atlas.test.ts` |
| `view.edge` | `tile-dirt-edge` and `tile-dirt-inset` are padded to 32 units; `tile-dirt-0` stays 24 | `atlas.test.ts` |

## When you change this

- A new variety: a ripe group, a fruit group, and a graft group for its species if it can be grafted; `atlas.test.ts` will name any missing one.
- A new ground kind: a band in `ground.ts` and its tiles, drawn on the grass base.
