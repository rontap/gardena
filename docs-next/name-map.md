# Name map

The words the game shows the player, and the words `docs-next` prose uses. Code identifiers keep their names; they appear only in backticks, and never in player text.

## Rules

1. **The player acts; things do not.** A tap does not fill a bucket, a fence does not stand, a tree does not feed itself. The player fills a bucket at the tap; the fence is placed.
2. **Describe a thing by what it is, holds, needs or makes, with the number.** "Uses {n} L of water a day", not "drinks". "Holds {n} L", not "a buffer of {n} L".
3. **Use the word a stranger to the game already knows.** Plain farming and plain game words: plot, tile, input, output, price, quality, in season.
4. **One word per thing, everywhere.** The prompt, the hover line, the description and the almanac use the same word.
5. **No engine words.** Nothing from how the code works: seam, tick, roll, stamp, hopper, buffer, pad, port, band, tier, path, bin, board, sat.
6. **A stat label is a noun with a unit.** Water use, Dig time, Price drop, Time to first fruit.
7. **Descriptions say what the player does with it.** "Fill buckets here" before "{rate} L/s".

## Replacements

### Time

| avoid                             | use                                   | example                                          |
| --------------------------------- | ------------------------------------- | ------------------------------------------------ |
| seam, day seam                    | end of day, overnight                 | "Weeds left full-grown turn to grass overnight." |
| recap, "Day {n} turned in"        | End of day {n}                        | panel title **End of day 4**                     |
| "Day {n} Finished" (notice)       | Day {n} summary                       | Command Center row                               |
| "Play waits until you dismiss it" | The game is paused until you close it |                                                  |
| on-season / off-season            | in season / out of season             | **Apple tree - in season**                       |
| juvenile                          | sapling; stat: Time to first fruit    |                                                  |

### Ground and plots

| avoid | use | example |
|---|---|---|
| bed, tilled bed | plot | "Sow seeds on a plot." |
| cell | tile (any square of the map), plot (a tilled tile) | "Placed on an untilled tile." |
| hardness | Dig time (stat); Hard soil, Very hard soil (names) | **Dig time: slow** |
| infertile, barren | Infertile soil (name only) | |
| stands, sits, lies (of a placed thing) | placed on / placed along | "Placed along the edge between two tiles." |

### Plants

| avoid | use | example |
|---|---|---|
| drink, drinks | uses water; stat: Water use | "Uses {n} L of water a day." |
| raise fruit | grow | "Seeds are what you sow on a plot to grow a crop." |
| thirsty (plant) | Needs water | orange, too little water |
| dry (plant) | Needs water / Wilting | "Dry" is weather only |
| wilting | Wilting | red, too little water |
| too wet, damp | Too much water | orange, too much water |
| drowning | Overwatered | red, too much water; **{Crop} is overwatered** |
| starving for fertilizer, starve | No fertilizer | red; **{Crop} has no fertilizer** |
| needs fertilizer | Needs fertilizer | orange |
| grade, rarity, Common / Uncommon / Rare, of fruit, seeds or trees | Quality (the percentage); Plain / Named / Heirloom (the variety tier) | **Quality 72%**; **Tomato (San Marzano) · Heirloom** |
| bone meal, boost, fertilizer (for Extract) | Extract; speeds up growth | **Pour extract** |
| spawn, forage (of a mushroom) | comes up; Pick up | "Mushrooms come up around trees after rain." |
| Basic (variety tier) | Plain | |
| path, purpose (in copy) | best for | **Best for Preserving: sells for {mul}× as jam or flour** |
| yield (verb) | gives, makes | "A tree in season gives fruit for {days} days." |
| trunk | Stump | **Apple tree - stump**; it grows back |
| feeds itself | needs no watering or fertilizer | wild apple |

Happiness stays: it is the name of the plant's meter, not a verb.

Common, Uncommon and Rare name a burrow's rarity, and only that ([[features/burrow]]).

### Water

| avoid | use | example |
|---|---|---|
| "Tap fills a bucket at {rate}" | Fill buckets here at {rate} L/s | Tap description |
| "Pipe carries water" | Connects water sources to taps and sprinklers | Pipe description |
| pull (water) | uses water from the network | Pot still |
| net, plumbing | water network | |
| "the tanks run dry" | when the water network is empty | |

### Machines and buildings

| avoid | use | example |
|---|---|---|
| hopper, hopper mill | input; "Put in {n} …" | "Put in {need} Sugar cane to make {liters} L of Sugar." |
| buffer | holds | "Holds {n} L of sugar." |
| yield (machine) | makes | "{need} units burn into {ash} Ash." |
| feedstock, load | input | |
| "A chest to the west feeds it" | Items in a chest on its left are put in automatically | |
| "The {tier} side is full" | The {Plain / Named / Heirloom} output is full | Sorter |
| port | signal input / signal output | sensors |
| pad | loading spot | vehicles |

### Market and contracts

| avoid | use | example |
|---|---|---|
| stall | Market | |
| worth | value, sells for | "Sells for {n} coins." |
| Maximum Market Impact, saturation, sat | Price drop | **Price −{n}% · back to normal in {days} days** |
| clean (price) | back to normal | |
| board (of contracts) | today's contracts | "New contracts are up." |
| bin | order line | "Deliver {n} Carrots." |

### Vehicles

| avoid | use | example |
|---|---|---|
| Boom 3 / Boom 5 | Width 3 / Width 5 | working width in tiles |
| Deploy (from hangar) | Take out | |
| Automate | Start route | |
| Dock | Park in hangar | |
| Disembark | Get out | |
| pad, dropoff, takeup | loading spot, unload, load | |

### Screen

| avoid | use | example |
|---|---|---|
| shelf | tab | "Research unlocks this tab." |
| lens | view | **Water view**, **No view** |
| "{n} more lens waits on research" | {n} more views unlock with research | |
| plate (expand) | Buy land button | |
| "{n} farm expansion opportunities" | {n} land expansions available | |
| Weed infestation | Weeds on the farm | |
| drifted, desync | lost sync | **{name} lost sync with the host** |

### Words that stay

These are plain and already right: plot, tile, Tend, Harvest, Dig, Chop, Sow, Plant, Fill, Spray, Drop off, Sacrifice, Rotten, Happiness, Freshness, Quality, Plain, Named, Heirloom, water network, signal, wire, route, stored, parked.
