# Machines

Rects. One concept per file. [[art/svg]] [[art/palette]]

1×1 `0 0 24 24` except still `0 0 48 24`, furnace `0 0 24 48` and mill / infuser `0 0 48 48`. Occupancy stays 2×1 / 1×2 / 2×2. Drawn still is 1.5×1 (`36×24`) centered (`x=6`–`42`). Drawn furnace is 1×1.5 (`24×36`) south-aligned (`y=12`–`48`). Drawn infuser is 1.5×1.75 (`36×42`) south-centered (`x=6`–`42`, `y=6`–`48`). Item face is the same machine as the prop, larger — do not shrink the item. Cottage machines: copper reads as roof. Cold / condenser / litre marks / glass tubes read as water. Still: industrial steel onion, iron lyne arm, oil foot. No `#8b3a2a` on the pot. Condenser stays water. Furnace: iron / oil stone, roof brick, steel lip; opening on the south face of the south cell. Chimney on the north of that body, in the north cell. Chimney mouth `(12, 14)`. Infuser: two tall glass columns on an iron bench, copper arch between their caps, copper serpentine coil east, dial on a post west, pump column between the columns, two fireboxes under the bench. Groups `off` `on`. Roof token is the arch, the collars and the coil, not a rectangular outline. No full-height brown walls. Column interiors are semi-transparent glass the ground reads through, and the liquid sits over that glass.

## Buildings

| file | depicts |
|---|---|
| `prop-mill.svg` | 2x2 `0 0 48 48`, four-course tapered `house` tower on a plinth, `roof` cap, hub and four-arm sail cross in front, door at the foot |
| `item-mill.svg` | same windmill packed into 24x24, card/hand |
| `prop-still.svg` | 2×1 `0 0 48 24`, drawn 1.5×1 (`36×24`) centered `x=6`–`42`, steel onion + iron lyne, water condenser, litre marks |
| `item-still.svg` | same machine, card/hand, stays 24×24 |
| `prop-barrel.svg` | barrel, dirt staves, grape bung |
| `item-barrel.svg` | same, card/hand |
| `prop-jam.svg` | jam cooker, fruit-red pot on house stove |
| `prop-link-in.svg` | blue west chute, mouth on the chest |
| `prop-link-out.svg` | green east chute, mouth on the chest |
| `item-jam-machine.svg` | same, card/hand |
| `prop-freezer.svg` | chest-like freezer, house body, water lid and latch |
| `item-freezer.svg` | same, card/hand |
| `prop-furnace.svg` | 1×2 `0 0 24 48`, drawn 1×1.5 (`24×36`) south-aligned `y=12`–`48`, iron / oil body, roof brick, steel lip, opening south, chimney north; groups `off` `on`; chimney mouth `(12, 14)` |
| `item-furnace.svg` | same machine, card/hand, stays 24×24 |
| `prop-research-station.svg` | 2×1 `0 0 48 24`, cottage seed-tray cabinet west, potting bench with three cuttings east, roof lamp; groups `off` `on`. Iron lamp face is the only metal |
| `item-research-station.svg` | same machine at 1×1 `0 0 24 24`, cabinet and one potted cutting, card/hand; groups `off` `on` |
| `prop-infuser.svg` | 2×2 `0 0 48 48`, drawn 1.5×1.75 south-centered, two glass columns (`x=12`–`20` and `x=28`–`36`, `y=10`–`36`) with copper collars, stepped copper arch between the caps, copper serpentine coil east, dial on a post west, iron pump column and cross pipes between, iron bench and cabinet with two oil fireboxes; groups `off` `on`. No rectangular roof bar. No full-height brown walls |
| `item-infuser.svg` | same machine, card/hand, stays 24×24; groups `off` `on` |
| `prop-necronomicon.svg` | 2×2 `0 0 48 48`, drawn 1.5×1.5 south-aligned (`y=10`–`44`), an open book lying flat: `grape` cover and spine block, `ink` gutter, one `cobble-dark` leaf west and one `slab` leaf east with `house` top edges, `ink` ruled lines, a `roof` ribbon standing up out of the gutter; groups `off` `on`. `on` turns the ruled lines `grape` and adds two `grape` glow bars above the covers. No rectangular roof bar, no brown walls |
| `item-necronomicon.svg` | the same book, card/hand, 24×24, one group |

## Fruit

| file | groups | depicts |
|---|---|---|
| `fruit-sugar-cane.svg` | `common` `rare` `heirloom` | tied cane sheaf. Common leaf; rare roof; heirloom leaf + ripe bands |
| `fruit-chilli.svg` | `base` | one pointed chilli, stem and calyx, fruit-red. One Variety |

## Spirits

No groups. Card/hand/almanac face.

| file | depicts |
|---|---|
| `item-spirit-vodka.svg` | clear bottle, house fill, water foot |
| `item-spirit-beer.svg` | gold bottle, house foam |
| `item-spirit-brandy.svg` | roof bottle, ripe body |
| `item-spirit-mixed.svg` | bottle, dirt / ripe / blush thirds |
| `item-spirit-palinka.svg` | slim bottle, long gold-foiled neck, cream label between gold rules, blush apricot mark and blush spirit — `klosterneuburger` brandy only, `spiritArt` |

## Wine

| file | groups | depicts |
|---|---|---|
| `item-wine.svg` | `common` `rare` `heirloom` | long-neck bottle. `common` grape; `rare` house; `heirloom` ripe |
| `item-cider.svg` | `common` `rare` `heirloom` | squat bottle, ripe fill |

Wine and cider carry two faces, `base` and `heirloom` — a variant cask draws the plain jar. The heirloom face is the one the player reads as **Premium wine** / **Premium cider** — [[mechanics/machines]].

## Jams

Jar = skill-jam language. Ketchup is a bottle.

| file | depicts |
|---|---|
| `item-jam-apricot.svg` | jar, ripe fill, apricot mark |
| `item-jam-grape.svg` | jar, grape fill, cluster mark |
| `item-jam-raspberry.svg` | jar, fruit-red fill, berry dots |
| `item-jam-cherry.svg` | jar, roof fill, two cherries |
| `item-ketchup.svg` | squeeze bottle, fruit-red |
| `item-jam-concord.svg` | tall jelly jar, gold wax cap, grape jelly, gold label with a cluster |
| `item-jam-black-raspberry.svg` | jar under a cloth lid tied with twine, near-black fill, gold-ruled label with five ink berries |
| `item-passata.svg` | tin can, rims top and bottom, fruit-red label between gold rules, house tomato |

A named jar is a face, not only a name. `jamArt` selects it. `concord` and `black-raspberry` stay jars and say premium with the cap and the gold; `san-marzano` leaves the jar language altogether, because passata is sold in a can.

## Mill outs

| file | depicts |
|---|---|
| `item-sugar.svg` | 2 L sack, house bag, two ripe volume bars |
| `item-oil.svg` | tall bottle, gold cap and foil neck, grass-dark / grass body, ripe gold shield. Not vanilla. Not grass extract |
| `item-flour.svg` | house sack, wheat heads |
| `item-extract.svg` | vial, grass-dark / leaf. Grass mill. Not vanilla |
| `item-vanilla-extract.svg` | tall thin dropper vial, house bulb, roof crimson fill to the neck. Not oil. Not grass extract |

Station `off` is dark seed trays, an unlit lamp, and three bare cuttings in their pots. `on` lights the lamp fruit-red and puts leaf shoots on the trays and every cutting. Cottage propagation bench. Language: seed tray, potting bench, cutting. Lamp face is iron; no steel or oil.

Infuser: two glass columns side by side on an alchemy bench, not a brown box. Copper collars top and bottom of each column, a stepped copper arch joining the two caps, a small steel vessel hanging under the arch crown, a copper serpentine coil off the east column, a dial on an iron post west, an iron pump column with cross pipes into both columns, an iron bench over a cabinet with a drawer and two fireboxes. `off` water in both columns, dark firebox mouths, needle low. `on` fruit-red west and ripe east, higher liquid, house bubbles, fire in both fireboxes, needle high. Copper is roof, and only on the arch, the collars and the coil. Everything structural is iron, steel or oil. Glass carries a house sheen column west and an iron shade column east.

## Infusion

| file | groups | depicts |
|---|---|---|
| `crop-chilli.svg` | `sprout` `grow` `dead` `ripe` | bush, hanging pointed fruit-red chillies. One Variety |
| `item-chilli-flakes.svg` | — | open house dish, fruit-red flakes, roof bits. Not a jam jar |
| `item-bread.svg` | — | loaf, ripe crust, house crumb in the split |
| `overlay-infused.svg` | — | small + mark, ink + ripe, flush top-right border of the 24×24 (`x=19`–`24`, `y=0`–`5`). Draw-over. Not centered |
| `ui-research-infusion.svg` | — | flask + ripe + mark. Infusion research face |

Necronomicon: an open book flat on the ground, not a lectern and not a chest. `grape` is the cover and the only saturated colour; the two leaves are `cobble-dark` west and `slab` east so the open page reads as two faces of one material, the way paving needs `slab` beside `house`. Ruled lines are `ink` at rest and `grape` when a page is ready for the ritual, which is the same `off` / `on` pair every machine prop carries — [[mechanics/necronomicon]] `necro.ritual`. `grape` is also in `@theme` for the panel — [[art/palette]] [[ui/necronomicon]].

Assumption: occupancy stays 2×1 / 1×2 / 2×2; still / furnace drawings are 1.5×1 / 1×1.5; infuser drawing is 1.5×1.75 south-centered. Wine / cider / cane `rare` unused: `common` stands in. Ketchup is a bottle not a jar. Passata is a can not a jar. Still shop face is the 2×1 still packed into 24×24. Chilli has one Variety; ripe group is `ripe` only. Vanilla extract is a distinct vial from grass `item-extract`.
