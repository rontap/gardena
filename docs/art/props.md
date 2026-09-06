# Props

`src/assets/props/*.svg`. Rules from [[art/svg]] and [[art/palette]] hold.

## Two rules

**Drawn for map scale, not shrunk from the item twin.** 1 tile is 24 units and paints at 48 px, so 1 unit is 2 px. No feature narrower than 4 units. `prop-tap` was `item-tap` with every part one unit thinner and aliased into mush.

**Two objects in one system differ in silhouette, not only in hue.** `prop-freezer` was `prop-chest` with the browns swapped for `water`: same ten rects, same lid, same latch, same box.

Perspective is one per asset. Ground and vehicles are top-down; freestanding props are a flat front elevation. Never both in one file — `prop-pump` had a front-on housing glued to a top-down trough.

## Named assets

| file | viewBox | depicts |
|---|---|---|
| `prop-pump.svg` | `0 0 48 24` | iron pedestal, walking-beam rocker, rod into a sunk sump; industrial + dirt collar, no `roof` |
| `prop-tap.svg` | `0 0 24 24` | ink-outlined `house` riser on a stone slab, spoked handwheel as a ring with a `dirt` hub out to the left, gooseneck stepping down to a spout, stream into a puddle |
| `prop-well.svg` | `0 0 24 24` | coursed `house` wellhead with a dark mouth and water in it, two posts, stepped `roof` gable, rope down the middle |
| `prop-rain-tank.svg` | `0 0 48 24` | wide open cistern: one ink-outlined `dirt-dark` body with `dirt` corner posts and a `house` base course, `water` surface open to the sky with `cfc6b0` glints, gutter and downspout pouring in from above left, tap at the left foot |
| `prop-mill.svg` | `0 0 48 48` | four-course tapered `house` tower, `roof` cap, door at the foot; groups `body` and `sails`. Sails are drawn as an upright cross, hub at `(24, 18)`; the view rotates them — [[art/vfx]] |
| `prop-freezer.svg` `item-freezer.svg` | `0 0 24 24` | low steel cabinet, lid overhanging the front, full-width handle, `house` frost pips |
| `prop-grinder.svg` | `0 0 24 24` | iron drum on its side with bands, shallow hopper, left chute, steel crank spurring right |
| `prop-link-in.svg` | `0 0 24 24` | west chute, wide mouth left, narrow right; `water` trough |
| `prop-link-out.svg` | `0 0 24 24` | east chute, narrow left, wide mouth right; `leaf` trough |
| `prop-burrow.svg` `prop-burrow-1.svg` | `0 0 24 24` | thin three-way ink fissure with a `dirt-dark` crumbled lip, `dirt` crumbs and 1-unit `ripe` glints; two shapes, top-down; atlas `burrow` / `burrow-1`, picked by `tileVariant`. Not a chest |

Mill is a 2×2 windmill: tall, cottage, tapered, sails. Grinder is low, iron, asymmetric, cranked. They were one plinth with different hats.

**Mill against windmill.** `prop-windmill.svg` is the electricity wind pump — a bare lattice tower under a fan wheel and a tail, [[art/electricity]]. The Mill is a solid tapered stone tower under a `roof` cap with a four-arm sail cross. Two towers on one farm read apart by that: lattice and fan against solid and sails. Never give the Mill a fan wheel or the windmill a cap.

**Water fixtures are cottage, not industrial.** Tap, well and rainwater tank take `house` for pale metal and `dirt` / `dirt-dark` for its shadow. `steel` / `iron` / `oil` stay on vehicles and machines — [[art/palette]]. The pumpjack is the exception the palette already names.

**Outline the silhouette, not every rect.** Ink outlines are not optional; dropping them leaves a prop with no edge against the ground. What made the earlier tap and tank illegible was outlining each small part separately, so a dozen little boxes each drew their own black frame and the whole thing read as a tangle. One ink mass per part, large enough to read, with the internal detail carried by fill changes inside it.

**The two buckets differ in silhouette.** `item-bucket` is a tall tapered pail under an arched bail. `item-large-bucket` is a wide straight tub with side lugs and no bail. They were the same eight rects at two scales.

Freezer is steel and overhangs. Chest is brown with a domed lid and a centre latch. Do not re-identify either by colour alone.

Burrow is a **three-way crack in the ground**, not a mound: a thin dark fissure that forks, with a crumbled lip and a glint of gold deep inside.

The fork is off-centre and its three arms differ in length and width — a Y centred in the cell reads as a drawn symbol, not as ground that split. The two shapes are different cracks, not one crack mirrored: different junction, different axis, different arm lengths. A flip is the same shape and a field of them still repeats. It sits flat and reads as something you would walk past, which is the point — a mound with a gold block on it is a chest. Not `prop-chest`. Not Rock. Atlas keys the two files `burrow` and `burrow-1`.

The pump's water sits in the sump, outside the housing, where it can be read.
