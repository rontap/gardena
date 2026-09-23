# The game

## Summary

Gardena is a farming game with automation, played in the browser alone or with up to three other players. The player controls a gardener on a tile grid. They till plots, plant and water crops, harvest fruit and sell it at the Market truck. The money pays for tools, buildings, land, research and a daily land tax. Later the player automates the work with water networks, sprinklers, sensors and wires, processing machines, and vehicles that drive routes.

The player's family gives each part of the game a member: the player is the gardener, the husband runs research, and the daughter runs the Market. Skill points, one per day, are spent on skills for any of them.

## Daily loop

1. Till plots with a shovel and plant seeds from the Seed silo ([[features/plants]]).
2. Keep each plot's water and fertilizer in range: bucket, fertilizer bag, later sprinklers ([[features/water]]).
3. Harvest ripe fruit and take it to the Market truck. **Drop off** fills accepted contracts first, then sells the rest at once ([[features/market]], [[features/contracts]]).
4. Spend money in Build, the Seed silo and the Additive store; start research ([[features/build]], [[features/inventory]], [[features/research]]).
5. At the end of the day: grandma's support comes in for the first days, land tax and the water bill are paid, a skill point is granted, and the end-of-day summary is written ([[systems/tick]], [[features/weather-day]]).

A day is `DAY_SECONDS` of game time, in four phases: Sunrise, Midday, Sunset, Twilight. Each day has a weather type from a table fixed by the game's seed: Clear, Rain, Dry, Flood or Drought.

## Money

In: selling at the Market; completed contracts; grandma's support on the first days (`STIPEND`).
Out: land tax each day, growing with the number of owned chunks (`World.tax()`); the water bill for water taken from pumps; purchases in Build and the stores; research; land expansions, each more expensive than the last (`World.expandPrice()`); contract penalties.

## Progression

Research has three paths. Each row costs money when started and takes a fixed number of seconds; one row runs at a time ([[features/research]]):

- `unlock-multi-crop` — crops, tools, crop varieties.
- `unlock-irrigation` — water network, sprinklers, sensors, vehicles, field silos, routes.
- `unlock-grinder` — processing machines, contracts, land expansion, landscaping, the Necronomicon, the weather station.

Skill points buy family skills ([[features/family]]). Contracts pay money or items that cannot be bought: named and Heirloom tree seeds, vanilla seeds, tools, freezers, skill points and expansion permits ([[features/contracts]]). Expansion permits allow buying more land ([[features/expansion]]).

Crops improve through play: a well-kept plant ripens with higher quality, and a high-quality plant can ripen as the next variety of its crop (Plain → Named → Heirloom) ([[features/plants]]).

## Story

Grandma supports the farm with money on the first days and writes letters as the days pass. The Necronomicon is a buildable book with pages of items to sacrifice; a full page is closed with a ritual at Twilight ([[features/necronomicon]]). A tutorial guides a new game through its first steps ([[features/tutorial]]).

## Features

| feature | what it gives the player |
|---|---|
| [[features/plants]] | crops to grow, harvest and improve |
| [[features/trees]] | fruit trees that produce for several days per season; grafting |
| [[features/weeds]] | a cost for leaving plots unplanted |
| [[features/water]] | pumps, wells, taps, pipes, valves, sprinklers |
| [[features/weather-day]] | the day cycle, weather, end-of-day summary |
| [[features/inventory]] | hand, inventory, chests, freezers, stores, tools |
| [[features/build]] | buying and placing buildings, paving, demolishing |
| [[features/machines]] | processing fruit into goods that sell for more |
| [[features/market]] | selling, and the price drop from selling a lot of one good |
| [[features/contracts]] | daily orders with deadlines and prizes |
| [[features/research]] | unlocks |
| [[features/family]] | skills |
| [[features/expansion]] | more land |
| [[features/sensors]] | signals that switch sprinklers, valves, machines and vehicles |
| [[features/vehicles]] | Quads and Tractors with trailers, driven or on routes |
| [[features/burrow]] | holes that give items when dug |
| [[features/fences]] | fenced areas for sensors |
| [[features/necronomicon]] | the book, its pages and rituals |
| [[features/tutorial]] | first-game guidance |
| [[features/multiplayer]] | hosting and joining a shared farm |
| [[features/almanac]] | todo-almanac |
