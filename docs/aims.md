# Aims

Garden sim with Factorio-ish automation: expand the field, research tools and crops, pipe water, care for plants.

You are the gardener. Husband is research (button on the HUD). Daughter is the market stall. Those roles stay. Family is a skill screen.

## Loop

Till → plant → water → harvest → sell at the truck → buy better tools, pipes, and seeds.

Days last 4 minutes (`DAY_SECONDS = 240`, preference). Sunrise / day / sunset / twilight, then an end-of-day recap with tax.

Start: house, pump, shovel in hand, bucket on the doorstep, seed stacks in the house (5 common carrot, 2 rare carrot, 2 rare tomato, 2 heirloom potato), $50.

## Care is not solved by pipes alone

Soil holds water (0–2 L, happy at 1 L) and fertilizer (0–1). Plants drink both. Too dry, too wet, or starved: growth stunts, happiness falls, then the plant dies. Default sprinklers overwater on purpose. Valves, smart-sprinkler dials, and the watering bucket are how you keep the green band.

Happiness at ripen rolls rarity up or down. Freshness keeps falling after pick until you sell.

## What the field is

32×32 chunks, expand at the edge. Soft / hard / very-hard dirt from a goodness map; hard dirt is poor dirt. Weeds take empty tilled plots. Grass is cosmetic cover. Rocks and berry shrubs and one wild apple tree sit on the start chunk.

## Economy

Shop buys tools, seeds, pipes, buildings, tiles. Research unlocks rows. Market is **Sell all** at the truck: one number, freshness and rarity already in it.
