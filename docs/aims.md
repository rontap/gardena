# Aims

Garden sim with Factorio-ish automation: expand the field, research tools and crops, pipe water, care for plants.

You are the gardener. Husband is research. Daughter is the market stall. Family is a skill screen.

## Loop

Till → plant → water → harvest → sell at the truck → buy tools, pipes, and seeds. Days run `DAY_SECONDS`. Sunrise / day / sunset / twilight, then recap with tax.

## Care is not solved by pipes alone

Soil holds water and fertilizer. Plants drink both. Too dry, too wet, or starved: growth stunts, happiness falls, then the plant dies. Default sprinklers overwater on purpose. Valves, smart-sprinkler dials, and the watering bucket keep the green band.

Happiness at ripen rolls rarity. Freshness keeps falling after pick until sold.

## Field

Chunks of `CHUNK`. Soft / hard / very-hard dirt from goodness; hard dirt is poor dirt. Weeds take empty tilled plots. Grass is cosmetic cover, and sowing turf un-tills.

## Economy

Shop buys tools, seeds, pipes, buildings, tiles. Research unlocks rows. Market is **Sell all** at the truck: one number, freshness and rarity already in it. Contracts are a second stall tab.
