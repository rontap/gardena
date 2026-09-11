# Tutorial patch

Minor. Graduates into [[mechanics/tutorial]], [[ui/tutorial]], `messages/en/tutorial.json`. Copy: [[agents/game-text-writer]] after the coder marks the strings.

The tour still points at the house for crop seeds. Crop seeds live in the Seed silo. Step 6 calls a dry plant thirsty; thirsty is the Pot still (player **Needs water**). Step 1 tells a new farm to buy better tools; Gardening tools is research, not a day-one SKU.

Predicates, skip-ahead, on/off, nine steps, no HUD block, no forced camera: keep.

## Live that is wrong

| step | copy now | task line now |
|---|---|---|
| 1 | Till, plant, water, harvest, sell, buy better tools. Click a grass tile to dig. | Shovel grass / untilled → till. |
| 3 | Click the house and take seeds in hand. | House door, seeds in hand. |
| 6 | A plant is thirsty. Pick up the bucket ({n} L), fill it at the pump, water the plant. | Ready when a growing plot is water-band red. Done when poured, or ripe, or has fruit, or sold. |

Starter: shovel in hand, bucket at `DOOR`, seeds in the Seed silo. Step 3’s predicate already completes on `holdingSeeds` or `planted` — taking from the silo works. The copy and the task line do not.

## New

Step 1 copy drops “buy better tools”. The loop is till, plant, water, harvest, sell. Click grass to dig.

Step 3 copy: take seeds from the Seed silo. Task line: Seed silo, seeds in hand. Predicate unchanged (`holdingSeeds` or `planted`).

Step 6 copy: the plant is wilting (water red, dry side). Bucket liters stay `{n}` from `CONTAINERS.bucket`. Do not say thirsty. Predicate unchanged.

Steps 2, 4, 5, 7, 8, 9: no change unless a string still names the house for crop seeds or thirsty for a plant.

## Not this update

New steps. Teaching pipes, machines, or Variety. Saving tutorial progress. Command Center.
