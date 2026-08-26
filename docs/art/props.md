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
| `prop-tap.svg` | `0 0 24 24` | 4-wide riser, valve handwheel, gooseneck with an elbow, stream landing on the plinth |
| `prop-freezer.svg` `item-freezer.svg` | `0 0 24 24` | low steel cabinet, lid overhanging the front, full-width handle, `house` frost pips |
| `prop-mill.svg` | `0 0 24 24` | cottage housing, stepped millstone with an ink spindle, top-left feed chute, flour sack |
| `prop-grinder.svg` | `0 0 24 24` | iron drum on its side with bands, shallow hopper, left chute, steel crank spurring right |

Mill is tall, cottage, round, centred. Grinder is low, iron, asymmetric, cranked. They were one plinth with different hats.

Freezer is steel and overhangs. Chest is brown with a domed lid and a centre latch. Do not re-identify either by colour alone.

The pump's water sits in the sump, outside the housing, where it can be read.
