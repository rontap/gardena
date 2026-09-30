# Game definitions

Every major concept, one row. The **term** is the word `docs-next/`, commits and reviews use. The **player word** is what the game shows now, from `messages/en/`; where [[name-map]] replaces it, the replacement follows the arrow. The **owner** is the page that defines the rules; other pages link there.

## Farm and field

| term | player word | definition | code | owner |
|---|---|---|---|---|
| tile | — | one square of the grid | `Coord`, `Cell` | [[systems/world]] |
| chunk | — | a `CHUNK` × `CHUNK` block of tiles; the unit of land the farm owns | `ChunkId`, `World.owned` | [[features/expansion]] |
| plot | Tilled soil | a tilled tile, with or without a plant | `Plot`, `isTilled` | [[features/plants]] |
| soil | — | a plot's water, fertilizer and weed chance | `Soil` | [[features/plants]] |
| ground | Grass, Hard soil, Very hard soil, Infertile soil | an untilled tile's type; sets what a tool can do there | `untilled` cell, `ground` | [[features/plants]] |
| hardness | → Dig time | how long a shovel takes on untilled ground, 0 to 1 | `hardness` | [[features/plants]] |
| paving | Paving slab, Brickwork, Cobblestone | a decorative layer on untilled ground | `World.paving`, `TileId` | [[features/build]] |
| grass | Grass, Cut grass | cover on untilled ground; the item picked from it | `cover.kind === 'grass'`, `turf` | [[features/weeds]] |
| weed | Weed, Pulled weed | a plant that sprouts on empty plots | `weed` cell, `Weed` | [[features/weeds]] |
| burrow | Burrow | a hole in untilled ground that gives one find when dug: an item, a skill point or an expansion permit | `cover.kind === 'burrow'` | [[features/burrow]] |
| burrow rarity | Common, Uncommon, Rare | the group a dug burrow's find comes from, drawn at the dig | — | [[features/burrow]] |
| mushroom | Fly agaric, Truffle | cover that comes up on an untilled tile around a grown tree at the end of a day, and is picked for its item | `cover.kind === 'mushroom'`, `MushroomId` | [[features/mushrooms]] |
| fence | Wooden fence | a placed fence piece; closed rings form enclosures | `World.fences`, `Enclosure` | [[features/fences]] |

## Plants

| term | player word | definition | code | owner |
|---|---|---|---|---|
| crop | crop names | a plant type with its growth, water, fertilizer and sale numbers | `CROPS`, `GrownCrop` | [[features/plants]] |
| variety | {Crop} ({Variety}); Plain / Named / Heirloom | one of up to three versions of a crop | `VarietyId`, `VarietyTier` | [[features/plants]] |
| purpose | Fresh / Preserving / Alcohol | the use a Named or Heirloom variety sells best for | `Purpose`, `PURPOSE_MUL` | [[features/plants]] |
| quality | Quality | 0 to 1; fixed at ripening; raises sale price | `quality`, `qualityMul` | [[features/plants]] |
| happiness | Happiness | 0 to `HAPPY_MAX`; rises in range, falls out of range; the plant dies at 0 | `Plant.happiness` | [[features/plants]] |
| growth | Growth | 0 to 1; the plant is ripe at 1 | `Plant.maturity` | [[features/plants]] |
| freshness | Freshness | 1 at ripening, falls over time; fruit at 0 rots | `freshness`, `freshMul` | [[features/plants]] |
| water range | happy / thirsty / too wet / wilting / drowning → see [[name-map]] | green, orange or red, from the plot's water and the plant's tolerance | `waterBand` | [[features/plants]] |
| fertilizer range | fertilized / needs fertilizer / starving for fertilizer → see [[name-map]] | green, orange or red, from the plot's fertilizer and the plant's tolerance | `fertBand` | [[features/plants]] |
| water use | → Water use | litres a growing plant takes from its plot per second | `waterUsePerSec`, `Soil.drink` | [[features/plants]] |
| dead plant | Dead plant | what a plant becomes when it dies too dry or with no fertilizer | `dead` cell | [[features/plants]] |
| rotten produce | Rotten produce | what a plant becomes when it dies too wet, or fruit at 0 freshness | `rotten` cell and item | [[features/plants]] |
| tend | Tend | a once-per-plant happiness boost with the Careful tending skill | `doTend` | [[features/plants]] |
| extract (poured) | Pour extract | Extract poured on a growing plant, sapling or stump adds a share of the growth bar over a set time; on an out-of-season tree it adds to the season chance; once per plant or tree stage | `Plant.boost`, `Tree.boost`, `boosted` | [[features/plants]], [[features/trees]] |
| tree | {Name} tree | a two-tile fruit tree with seasons | `Tree` | [[features/trees]] |
| graft | {Crop} ({Variety}) graft | an item that changes a young plant's or tree's variety | `graft` item | [[features/trees]] |

## Water

| term | player word | definition | code | owner |
|---|---|---|---|---|
| source | Pump, Pumpjack, Well | a building that fills its own tank over time | `Reservoir`, `SOURCE` | [[features/water]] |
| water network | water network | sources, taps, sprinklers and stills joined by pipes | `Net` | [[systems/water-network]] |
| pull | → uses water from the network | taking water from a network's tanks in proportion to what each holds | `pull` | [[systems/water-network]] |
| sprinkler | Sprinkler, Vertical sprinkler, Large sprinkler | pours water on the plots and trees in its area | `Sprinkler` | [[features/water]] |
| valve | Valve | opens or closes one pipe edge | `Gate` | [[features/water]] |
| bucket | Bucket, Large bucket | carries water from a source or tap to a plot | `container` item | [[features/water]] |

## Items and storage

| term | player word | definition | code | owner |
|---|---|---|---|---|
| item | item names | anything a gardener, chest or store holds | `Item` | [[features/inventory]] |
| hand | — | the one item or stack a gardener holds | `Hand`, `Seat.hand` | [[features/inventory]] |
| inventory | Inventory | a seat's 16 slots, opened at the house | `Seat.inventory` | [[features/inventory]] |
| stack | — | a counted item; merges up to `stackMax` | `Countable`, `stackable` | [[features/inventory]] |
| chest | Chest, Freezer | a placed building with item slots | `Chest`, `Freezer` | [[features/inventory]] |
| store | Seed silo, Additive store | a building that holds seeds, or fertilizer, compost, Weed spray and sugar | `SeedSilo`, `AdditiveStore` | [[features/inventory]] |
| tool | Shovel, Pickaxe, Axe, Chainsaw | an item with uses that works a tile | `shovel`, `pickaxe`, `axe` items | [[features/inventory]] |
| SKU | shop item names | a buyable entry: building, tool, pack or bag | `SkuId`, `SKUS` | [[features/build]] |

## Buildings and machines

| term | player word | definition | code | owner |
|---|---|---|---|---|
| building | building names | anything placed on tiles with a footprint | `BaseBuilding`, `RectBase` | [[systems/building-io]] |
| machine | machine names | a building that turns inputs into a product over time | `Machine`, `IoCell` | [[features/machines]] |
| input / output side | — | the chest tiles left and right of a machine's bottom row | `machineWest`, `machineEast`, `storePorts` | [[systems/building-io]] |
| loading spot | → loading spot | the tiles above (unload) and below (load) a building where vehicles transfer items | `padPorts` | [[systems/building-io]] |
| recipe | — | what a machine takes and makes | `Recipe` | [[features/machines]] |
| infuse | Infuse | the Infuser adding one reagent to jam, cask, spirit, oil or Extract, which sets `infused`; each good takes two of vanilla extract, flakes, Truffle extract and Fly agaric | `Infuser`, `infused`, `INFUSE_REAGENTS` | [[features/machines]] |

## Economy

| term | player word | definition | code | owner |
|---|---|---|---|---|
| money | coin glyph | the player's funds | `World.money` | [[features/market]] |
| Market | Market, Produce Warehouse | where goods are dropped off and sold | `World.stall`, `StallGoodId` | [[features/market]] |
| price drop | Maximum Market Impact → Price drop | how much a good's price is lowered by recent sales of it | `StallGood.sat` | [[features/market]] |
| contract | Contract | an order for goods by a deadline, paying money or a prize | `Contracts`, `ContractId` | [[features/contracts]] |
| company | company names | the business that posts a contract; decides the prize | `CompanyId` | [[features/contracts]] |
| reputation | Reputation | rises on completed contracts; raises offer difficulty | `contracts.rep` | [[features/contracts]] |
| prize | — | an item a contract pays instead of money | `prizeFor` | [[features/contracts]] |
| tax | Tax | money paid at the end of each day, by owned chunks | `World.tax()` | [[features/weather-day]] |

## Progression

| term | player word | definition | code | owner |
|---|---|---|---|---|
| research | Research, Researching {name} | an unlock bought with money and time | `RESEARCH`, `ResearchId`, `World.job` | [[features/research]] |
| skill | skill names | a family upgrade with ranks | `SKILLS`, `SkillId` | [[features/family]] |
| skill point | Skill points | spent on skills; `POINTS_PER_DAY` on each odd ended day, and `FAMILIARITY_POINT` when a crop reaches `familiarityMax` | `World.points`, `pointsForEndedDay` | [[features/family]] |
| familiarity | — | per-crop study level from the research station; raises variety chance and bought seed quality | `World.familiarity` | [[features/machines]] |
| expansion | Expand, expansion permit | buying an adjacent chunk; needs a permit | `expand`, `expandSlots` | [[features/expansion]] |

## Automation

| term | player word | definition | code | owner |
|---|---|---|---|---|
| signal | on / off | the value a wire carries, 0 or 1 | `Signal` | [[systems/signals]] |
| wire | wire | connects one device's output to another's input | `Wire`, `WireEnd` | [[systems/signals]] |
| sensor | sensor names | a device that sets a signal from the farm's state | `isSensor` | [[features/sensors]] |
| vehicle | Quad, Tractor | a driveable or route-driven vehicle | `Vehicle` | [[features/vehicles]] |
| trailer | Seeder, Sprayer, Harvester | an attachment on a Tractor | `Trailer` | [[features/vehicles]] |
| route | route | a named list of stops a vehicle drives | `Route` | [[features/vehicles]] |
| fuel | fuel | consumed by vehicles while moving | vehicle `fuel` | [[features/vehicles]] |

## Time and weather

| term | player word | definition | code | owner |
|---|---|---|---|---|
| day | Day {n} | `DAY_SECONDS` of game time | `Clock.day` | [[features/weather-day]] |
| phase | Sunrise, Midday, Sunset, Twilight | a share of the day | `DayPhase`, `Clock.phase()` | [[features/weather-day]] |
| end of day | → end of day | the step that crosses `DAY_SECONDS`: income, costs, summary | `Clock.advance` returning `'seam'` | [[systems/tick]] |
| end-of-day summary | Day {n} turned in → End of day {n} | the record of one ended day | `Recap`, `World.recaps` | [[features/weather-day]] |
| loan | Loan, Loan payback | seeds and money given at the end of a day with money below `LOAN_BELOW` and an empty Seed silo, paid back over the next days | `settleLoan`, `World.loanDays` | [[features/weather-day]] |
| weather | Clear, Rain, Dry, Flood, Drought | the day's type, from the seed | `WeatherKind`, `World.weather(day)` | [[features/weather-day]] |

## Story

| term | player word | definition | code | owner |
|---|---|---|---|---|
| Necronomicon | Necronomicon | a buildable book with pages of items to sacrifice | `Necronomicon` | [[features/necronomicon]] |
| page | page | one row of the book | `PageId` | [[features/necronomicon]] |
| sacrifice | Sacrifice | giving an item or money to the book, which destroys it | `necronomicon` job | [[features/necronomicon]] |
| ritual | Perform the ritual | the Twilight action that closes full pages | `performRitual` | [[features/necronomicon]] |
| grandma letter | A letter is waiting | a story letter shown from the Command Center | `Grandma`, `grandmaUnseen` | [[features/necronomicon]] |
| tutorial step | — | one step of the first-game guidance | `Tutorial` | [[features/tutorial]] |

## Players and engine

| term | player word | definition | code | owner |
|---|---|---|---|---|
| seat | player name | one player's gardener, hand, inventory and job list | `Seat` | [[systems/world]] |
| host | Host | the player whose `World` is the reference in multiplayer | `seats[0]` | [[features/multiplayer]] |
| guest | guest | a player who joined a host's farm | `World.local !== 0` | [[features/multiplayer]] |
| job | — | a queued action the gardener walks to and performs | `Intent`, `Seat.queue` | [[systems/commands]] |
| command | — | a player action as data | `Cmd`, `Act` | [[systems/commands]] |
| step | — | one call of `tickWorld` | `World.tick` | [[systems/tick]] |
| big tick | — | a step group every `BIG_TICK` seconds | `tickBig` | [[systems/tick]] |
| digest | — | a hash of the `World` compared between host and guest | `digestParts` | [[systems/net]] |
| save | Save | the `World` as JSON | `Save`, `dump`, `parse` | [[systems/save]] |
| stream | — | a named seeded random sequence | `rng.stream(name)` | [[systems/rng]] |
| lens | Lens → view | a map overlay | `Lens` | [[shell]] |
| notice | row in Command Center | one line in the right-hand column | `Notice` | [[shell]] |
