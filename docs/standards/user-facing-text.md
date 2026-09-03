# User-facing text

Exact word per concept. Agents paste the **say** column. A third word is a coined term.

`lex.user` — This file is chat with the developer, [[standards/update-notes]], HUD, prompts, callouts, almanac, shop, inspect. Not `src/` identifiers. Not vault notes — those stay [[standards/lexicon]].

No row → no name. Plain English, or ask. [[canon]]

Titles of things you can buy, hold, or place: `skuLabel` / catalog `title`. Do not synonymize. This table is the overloaded words those sources do not pin.

## Concepts

| concept                                    | say                                                                                                          | never                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| connected pipes, sources, taps, sprinklers | water network                                                                                                | net, irrigation system, plumbing                          |
| what a wire carries                        | signal                                                                                                       | power, current, juice, high, low                          |
| signal 1                                   | on                                                                                                           | high, true, 1                                             |
| signal 0                                   | off                                                                                                          | low, false, 0                                             |
| the wire itself                            | wire                                                                                                         | cable, connection, lead                                   |
| catalog / skill / research written text    | description                                                                                                  | blurb                                                     |
| money                                      | money                                                                                                        | gold, cash, `$` — glyph is Coin                           |
| one gold glyph                             | Coin                                                                                                         | silver, dollar                                            |
| tilled cell with soil                      | plot                                                                                                         | cell, tile, bed                                           |
| paving on untilled ground                  | Paving slab / Brickwork / Cobblestone                                                                        | tile, path                                                |
| a map cell in general                      | (name the thing on it)                                                                                       | cell                                                      |
| untilled soft cover                        | Grass                                                                                                        | lawn                                                      |
| untilled hard                              | Hard soil                                                                                                    | packed dirt                                               |
| untilled very-hard                         | Very hard soil                                                                                               | rock (rock is the stone cell)                             |
| mined very-hard                            | Infertile soil                                                                                               | barren                                                    |
| stone cell                                 | Rock                                                                                                         | boulder, ore                                              |
| empty tilled                               | Tilled soil                                                                                                  | dirt, bed                                                 |
| grass being sown                           | Grass - rooting                                                                                              | turf                                                      |
| grass in hand                              | Cut grass                                                                                                    | hay                                                       |
| shop pack of grass                         | Grass seeds                                                                                                  | turf seeds                                                |
| grass in hand, singular                    | Grass seed                                                                                                   |                                                           |
| growing plant drinking its plot            | consumes water                                                                                               | pulls (machines pull)                                     |
| plant water green                          | happy                                                                                                        | fine, ok                                                  |
| plant water orange, dry side               | thirsty                                                                                                      | dry (Dry is weather)                                      |
| plant water orange, wet side               | too wet                                                                                                      | damp                                                      |
| plant water red, dry side                  | wilting                                                                                                      | thirsty, dry                                              |
| plant water red, wet side                  | drowning                                                                                                     | flooding (Flood is weather)                               |
| plant fertilizer green                     | fertilized                                                                                                   | fertilized                                                |
| plant fertilizer orange                    | needs fertilizer                                                                                             | low                                                       |
| plant fertilizer red                       | starving for fertilizer                                                                                      | hungry (starve is this, only here)                        |
| still with no water                        | Needs water                                                                                                  | thirsty (engine state only)                               |
| plant happiness 0, drown                   | Rotten produce / rotten                                                                                      | decay, stale                                              |
| plant happiness 0, wilt or starve          | Dead plant                                                                                                   | corpse, wilted plant                                      |
| freshness at 0                             | rot / Rotten produce                                                                                         | expiry, spoil                                             |
| fruit still good                           | freshness                                                                                                    | shelf life                                                |
| live quality while growing                 | Happiness                                                                                                    | health, mood                                              |
| growth fill                                | Growth                                                                                                       | progress, maturity                                        |
| soil nutrient                              | Fertilizer                                                                                                   | nutrients, NPK                                            |
| ordinary bag                               | Fertilizer bag / fertilizer / ordinary fertilizer                                                            | organic fertilizer (that is compost)                      |
| synthetic bag                              | Synthetic fertilizer                                                                                         | chemical                                                  |
| compost bag                                | Compost                                                                                                      | manure                                                    |
| soil / fruit `bio` true                    | organic                                                                                                      | bio (except the skill **Bio farmer**)                     |
| soil / fruit `bio` false                   | not organic                                                                                                  | inorganic, contaminated                                   |
| top rarity                                 | Heirloom                                                                                                     | legendary, gold                                           |
| rarities, in order                         | Common, Uncommon, Rare, Heirloom                                                                             | gem, pip, grade (first almanac sentence may define grade) |
| rarity mark on fruit                       | the mark / a small colored mark                                                                              | gem, pip                                                  |
| tend prompt                                | Tend                                                                                                         | care, pet, water by hand                                  |
| tend skill                                 | Careful tending                                                                                              | Tending                                                   |
| harvest ripe annual                        | Harvest                                                                                                      | pick (Harvest sensor body may say ready to pick)          |
| shovel a tree                              | Dig                                                                                                          | harvest, uproot                                           |
| plant a tree seed                          | Plant {Apple\|Apricot\|Cherry\|Olive}                                                                        | sow a tree                                                |
| sow grass                                  | Sow grass                                                                                                    | plant grass                                               |
| empty-hand weed                            | (gather — item **Pulled weed**)                                                                              | harvest weed                                              |
| shovel a weed                              | Dig                                                                                                          | spray                                                     |
| spray a plot                               | Spray                                                                                                        | herbicide, apply                                          |
| fill a bucket at a source or tap           | Fill                                                                                                         | scoop, collect                                            |
| no container                               | Need a bucket                                                                                                | Need a can                                                |
| walk                                       | Move here                                                                                                    | go, walk here                                             |
| place a SKU                                | Place {skuLabel}                                                                                             | build, spawn, drop                                        |
| delete a placed thing                      | Delete {skuLabel}                                                                                            | remove, destroy                                           |
| delete a wire (tool)                       | Delete wire                                                                                                  |                                                           |
| un-draw the same wire                      | Remove wire                                                                                                  | unwire                                                    |
| cannot cycle combinational                 | Cannot loop                                                                                                  | cycle, feedback                                           |
| illegal port                               | Cannot wire here                                                                                             | invalid connection                                        |
| poor                                       | Cannot afford                                                                                                | too expensive                                             |
| illegal site                               | Cannot place here                                                                                            | blocked                                                   |
| valve already on edge                      | Pipe already has a valve                                                                                     | already gated                                             |
| wired valve click                          | Valve - wired                                                                                                | smart valve                                               |
| unarmed valve                              | Open valve / Close valve                                                                                     | toggle, shutoff                                           |
| hand at stack cap                          | My hand is full!                                                                                             | inventory full                                            |
| empty hand                                 | Nothing in hand                                                                                              | empty                                                     |
| not owned fade                             | (existing `NOT_OWNED` string)                                                                                | fog of war                                                |
| weather clear                              | Clear                                                                                                        | sunny, calm, normal, as usual                             |
| weather rain                               | Rain                                                                                                         | wet, precipitation                                        |
| weather dry                                | Dry                                                                                                          | drought, arid                                             |
| weather flood                              | Flood                                                                                                        | drowning, deluge                                          |
| weather drought                            | Drought                                                                                                      | dry, famine                                               |
| tomorrow glyph title                       | Tomorrow · {Clear\|Rain\|Dry\|Flood\|Drought}                                                                | next day, forecast (the skill is **Weather forecast**)    |
| day counter                                | Day {n}                                                                                                      |                                                           |
| phase `sunrise`                            | Sunrise                                                                                                      | morning                                                   |
| phase `day`                                | Midday                                                                                                       | day, noon, afternoon                                      |
| phase `sunset`                             | Sunset                                                                                                       | evening                                                   |
| phase `twilight`                           | Twilight                                                                                                     | night (`night` is not a phase)                            |
| end-of-day screen                          | end-of-day summary                                                                                           | recap, seam                                               |
| recap stipend line                         | Stipend                                                                                                      | daily pay (almanac may gloss stipend as daily pay)        |
| recap tax line                             | Tax                                                                                                          | land tax, upkeep                                          |
| recap pump bill                            | Water                                                                                                        | pump cost                                                 |
| recap harvested                            | Harvested                                                                                                    | yield                                                     |
| recap died                                 | Lost                                                                                                         | deaths, wilted                                            |
| recap research row                         | Research                                                                                                     | tech                                                      |
| recap money after                          | Balance                                                                                                      | net, worth                                                |
| recap contracts closer                     | A new board is up.                                                                                           | new quests                                                |
| recap contract outcomes                    | Completed / Missed / Cancelled                                                                               | success, failed                                           |
| recap title                                | Day {n} turned in                                                                                            |                                                           |
| recap dismiss                              | Day {n}                                                                                                      | Continue, Next                                            |
| rail overlay Market                        | Market                                                                                                       | stall (stall is the sell tab)                             |
| Market sell tab                            | Stall                                                                                                        | shop                                                      |
| Market contracts tab                       | Contracts                                                                                                    | quests, orders, jobs                                      |
| closed stall, flood                        | Stall closed this morning.                                                                                   |                                                           |
| closed stall, drought                      | Stall closed at midday.                                                                                      |                                                           |
| closed stall, other                        | Stall closed until morning. / Stall closed at twilight.                                                      |                                                           |
| consign at the truck                       | Drop off                                                                                                     | sell, consign                                             |
| look on the truck                          | Market truck                                                                                                 | stall truck                                               |
| house walk-up                              | Inventory                                                                                                    | backpack, chest (Chest is the building)                   |
| seed store building                        | Seed silo                                                                                                    | seed chest, seed bank (skill is **Trusted seed bank**)    |
| additive building                          | Additive store                                                                                               | fertilizer shed                                           |
| field seed tank                            | Seeding silo                                                                                                 | hopper, seed tank                                         |
| field spray tank                           | Spraying silo                                                                                                |                                                           |
| field produce tank                         | Produce silo                                                                                                 |                                                           |
| 2×1 paid source, shop / place / delete     | Pumpjack                                                                                                     | pump, well                                                |
| look on a pump cell                        | Pump                                                                                                         |                                                           |
| free source                                | Well                                                                                                         | borehole                                                  |
| rain gatherer                              | Rainwater tank                                                                                               | cistern, rain barrel                                      |
| bucket fill building                       | Tap                                                                                                          | faucet, spigot                                            |
| 2×2 head                                   | Sprinkler                                                                                                    | sprinkler head                                            |
| 4×2 head                                   | Vertical sprinkler                                                                                           | long sprinkler                                            |
| 4×4 head                                   | Large sprinkler                                                                                              |                                                           |
| edge water                                 | Pipe                                                                                                         | hose, tubing                                              |
| edge shutoff                               | Valve                                                                                                        | gate                                                      |
| still                                      | Pot still                                                                                                    | still, distillery                                         |
| jam building                               | Jam machine                                                                                                  | canner                                                    |
| barrel building                            | Barrel                                                                                                       | cask (cask is the bottled wine / cider)                   |
| grape barrel out                           | Wine                                                                                                         | whisky (illegal)                                          |
| apple barrel out                           | Cider                                                                                                        |                                                           |
| tomato jam                                 | Ketchup                                                                                                      | tomato jam                                                |
| other jam                                  | {Crop} jam                                                                                                   | preserve                                                  |
| mill outs                                  | Sugar / Olive oil / Flour / Extract                                                                          | crush, product                                            |
| spirits                                    | Vodka / Beer / Brandy / Mixed spirit                                                                         | liquor, booze, whisky                                     |
| sugar-cane on the plant                    | Sugar cane                                                                                                   | sugar (sugar is litres)                                   |
| sugar item                                 | Sugar                                                                                                        | cane                                                      |
| seed hopper machine                        | Seed grinder                                                                                                 | mill (Mill is the crush building)                         |
| compost machine                            | Compost box                                                                                                  | composter                                                 |
| cold store                                 | Freezer                                                                                                      | fridge                                                    |
| 6-slot freezer SKU                         | Large freezer                                                                                                |                                                           |
| vehicle shed                               | Vehicle hangar                                                                                               | garage, barn                                              |
| small vehicle                              | Quad                                                                                                         | ATV, cart                                                 |
| big vehicle                                | Tractor                                                                                                      | truck (truck is Market truck)                             |
| seed trailer                               | Seeder                                                                                                       | seed drill                                                |
| spray trailer                              | Sprayer                                                                                                      |                                                           |
| harvest trailer                            | Harvester                                                                                                    | combine                                                   |
| vehicle in hangar                          | stored                                                                                                       | docked (Dock is the dash button)                          |
| vehicle on field, no driver, not running   | parked                                                                                                       | idle                                                      |
| seat driving                               | driven                                                                                                       | piloted                                                   |
| running a route, no driver                 | automated                                                                                                    | auto, AI                                                  |
| trailer on a tractor                       | attached                                                                                                     | hitched as a verb in copy: hitch is engine                |
| hangar buy onto field                      | Deploy                                                                                                       | spawn, launch                                             |
| hangar start route                         | Automate                                                                                                     | auto                                                      |
| dash leave vehicle                         | Dock                                                                                                         | park, disembark as the button                             |
| fuel on the vehicle                        | fuel                                                                                                         | gas, petrol                                               |
| named stop list                            | route                                                                                                        | path, schedule                                            |
| family screen                              | Family                                                                                                       | skills menu                                               |
| player member                              | You                                                                                                          | player                                                    |
| player role                                | Gardener                                                                                                     | farmer                                                    |
| husband member                             | Husband                                                                                                      | researcher                                                |
| husband role                               | Research                                                                                                     |                                                           |
| daughter member                            | Daughter                                                                                                     | trader                                                    |
| daughter role                              | Market                                                                                                       | stall                                                     |
| shared spendable                           | Skill points                                                                                                 | XP, points                                                |
| expansion chip                             | Expansion                                                                                                    | land token                                                |
| expansion body                             | farm expansion opportunities                                                                                 | permits (plate: **No permit left**)                       |
| expand plate                               | Expand                                                                                                       | Buy land                                                  |
| research in flight                         | Researching {name}                                                                                           | researching as a noun, tech tree                          |
| research shelves                           | Plants / Land / Automation / Trade                                                                           |                                                           |
| almanac                                    | Almanac                                                                                                      | encyclopedia, help, wiki                                  |
| almanac tabs                               | Seeds / Trees / Utility / Sensors / Automation / Water systems / Building / Game concepts                    |                                                           |
| shop                                       | Shop                                                                                                         | store (store is Seed silo / Additive store)               |
| build                                      | Build                                                                                                        | construction                                              |
| lens dock                                  | Lens                                                                                                         | overlay, filter, view mode                                |
| no lens                                    | No lens                                                                                                      | off                                                       |
| lock the lens                              | Lock view                                                                                                    | pin                                                       |
| water lens                                 | Water need                                                                                                   | moisture, wetness                                         |
| land lens                                  | Land quality                                                                                                 | fertility lens                                            |
| ripe lens                                  | Ripeness                                                                                                     | growth lens                                               |
| kind lens                                  | Object type                                                                                                  | entity type                                               |
| rarity lens                                | Rarity                                                                                                       |                                                           |
| pipes lens                                 | Pipes                                                                                                        | water lens (that is Water need)                           |
| sensors lens                               | Sensors                                                                                                      | wiring                                                    |
| vehicles lens                              | Vehicle interactions                                                                                         | vehicle lens                                              |
| cheat                                      | Cheat                                                                                                        | debug                                                     |
| multiplayer                                | Multiplayer                                                                                                  | co-op, MP                                                 |
| host / guest                               | host / guest                                                                                                 | server / client                                           |
| pause                                      | Pause / Resume                                                                                               | freeze                                                    |
| gear                                       | Gear                                                                                                         | settings, menu                                            |
| wordmark                                   | Gardena                                                                                                      | the game, this title                                      |
| tree juvenile                              | {Name} tree - growing                                                                                        | sapling                                                   |
| tree yielding                              | {Name} tree - on-season                                                                                      | fruiting                                                  |
| tree rest                                  | {Name} tree - off-season                                                                                     | dormant, pending                                          |
| tree names                                 | Apple / Apricot / Cherry / Olive                                                                             | lemon                                                     |
| crop names                                 | Carrot / Potato / Wheat / Tomato / Raspberry / Grape / Vanilla / Sugar cane                                  | berry, shrub                                              |
| annual seed in hand                        | {Crop} seed                                                                                                  | packet                                                    |
| shop pack                                  | {Crop} seeds                                                                                                 |                                                           |
| tree seed                                  | {Name} seed                                                                                                  | sapling                                                   |
| weed on a plot                             | Weed                                                                                                         | pest, invasive                                            |
| weed in hand                               | Pulled weed                                                                                                  |                                                           |
| spray item                                 | Weed spray                                                                                                   | herbicide                                                 |
| fence                                      | Wooden fence                                                                                                 | barrier                                                   |
| empty plot bar                             | Weed resistance                                                                                              | weed chance                                               |
| barrel before mature                       | maturing                                                                                                     | aging (Aging is the later fill)                           |
| barrel after mature                        | Aging                                                                                                        |                                                           |
| sprinkler HUD                              | Sprinkler output                                                                                             | sprinkler settings                                        |
| unarmed smart vertex                       | Tune sprinkler                                                                                               | configure                                                 |
| default pour row                           | Full flow                                                                                                    | untuned, max                                              |
| water sensor HUD                           | Water sensor                                                                                                 | moisture sensor                                           |
| water checkboxes                           | Wilting / Overwatered                                                                                        | dry / drowning                                            |
| harvest sensor HUD                         | Harvest sensor                                                                                               | ripeness sensor                                           |
| harvest mode                               | Any / All                                                                                                    |                                                           |
| fertilizer sensor                          | Fertilizer sensor                                                                                            | nutrient sensor                                           |
| day sensor HUD                             | Day sensor                                                                                                   | clock sensor                                              |
| day checkboxes                             | Sunrise / Day / Sunset / Twilight                                                                            | Midday (HUD clock says Midday; this checkbox is **Day**)  |
| counter HUD                                | Counter                                                                                                      | timer                                                     |
| counter target                             | Count to                                                                                                     | threshold                                                 |
| counter zero                               | Reset / Reset to 0                                                                                           | clear                                                     |
| water-system look, no pipes                | Water-system sensor - no pipes around sensor!                                                                |                                                           |
| water-system look, else                    | Water-system sensor - on/off                                                                                 | network sensor                                            |
| vehicle plate                              | Vehicle detector                                                                                             | pressure plate                                            |
| traffic light                              | Traffic light                                                                                                | stoplight                                                 |
| pulser                                     | Pulser                                                                                                       | one-shot, pulse generator                                 |
| lamp                                       | Lamp                                                                                                         | LED, light                                                |
| lever prompt                               | Flip lever                                                                                                   | throw, toggle                                             |
| button prompt                              | Press button                                                                                                 | click, tap                                                |
| gates                                      | OR gate / AND gate / NOT gate                                                                                | or, and, not (bare)                                       |
| mill prompts                               | Crush into sugar / Crush into olive oil / Crush into flour / Crush into extract / Crush into vanilla extract | mill it                                                   |
| grind prompt                               | Grind                                                                                                        | crush (crush is mill)                                     |
| still prompt                               | Distill                                                                                                      | brew                                                      |
| barrel fill                                | Fill barrel                                                                                                  | load barrel                                               |
| barrel collect                             | Collect wine / Collect cider                                                                                 | harvest barrel                                            |
| jam fruit                                  | Make jam / Make ketchup                                                                                      | can                                                       |
| jam sugar                                  | Fill sugar                                                                                                   | add sugar                                                 |
| sensor tune prompts                        | Tune water sensor / Tune harvest sensor / Tune counter / Tune day sensor                                     | configure                                                 |
| no expansion permits                       | No expansion permit left                                                                                     | no expansions                                             |
| hangar stores a vehicle                    | Cannot delete here (stores a vehicle)                                                                        |                                                           |
| fence site                                 | Fences need untilled ground                                                                                  |                                                           |
| already fenced                             | Already fenced                                                                                               |                                                           |
| seed silo at cap                           | Seed silo full                                                                                               |                                                           |
| additive store at cap                      | Additive store full                                                                                          |                                                           |
| saturation of a stall good                 | (say the floor and the days to clean, as Market already does)                                                | backpressure, dump                                        |
| research job                               | research / Researching                                                                                       | tech, unlock (never name a gate in a description)         |
| contract                                   | contract / Contracts                                                                                         | quest, order, job                                         |
| family pick                                | Choose one / Nothing left to learn / Learned / None yet                                                      |                                                           |
| skill rank                                 | I–V                                                                                                          | plus, star                                                |
| heirloom daughter skill                    | Őstermelő                                                                                                    | Heirloom farmer                                           |
# Examples of good and bad UI Text

## example 1 Research
Bad: "Holds ${n} L and works the same, but the soil and its produce stop being organic." 
Problems: 
- "works the same" - as what? never add unqualified comparisons. 
- "produce" is not a game keyword. fruit is. 
- "stops being" is how it is coded. A human sees that a fruit that grows is not organic. Text should reflect what the human sees, not what the code does. 
- It does not explain at all that synthetic fertilizer is the property of the _soil_  
Should be: "Synthetic fertilizer is cheaper than organic fertilizer and is more efficient , but fruits grown in soil that had synthetic fertilizer added are not considered organic, and are sold for slightly less." 

## example 2 description of grape
Bad: "A mid fruit. Softer than a raspberry, and the path to one." 
Problems: 
- This text should be flavour text, and it does not deliver. 
- Mid is not a game concept, it is not even a code concept. 
- "Path to one" this refers to research being gated behind grape, which is no longer true anyways, and has no place in the description example 3 
## research: unlock irrigation 
Now: "Unlocks Pipe and Tap in the general store. Route the water the farm pump already lifts." Problems: 
- "Farm pump" is loose and underdefined. 
- "route" is the incorrect word here 
- "lifts" is the incorrect word here 
Should be: "Unlocks pipes and tap in the store. Placing a tap closer to the tilled soil can save a lot of walking, and can be connected from the pump through pipes." 
Why this is better: Explains WHY the player should want to research this, and gives a concept of what the mechanic is and what the player will be able to do / need to do once researched.

## General Guidelines
1. listing items statically (jam, wine, spirit, oil, flour, extract) is dangerous because the player might not have encountered with this thing before and agents may forget to change the description.
2. "another part" is undefined. You can say "signal". "power" is also a reserved term, these are sensors sending signals
3. When writing text to not subtract universe from object to define it. It should not tutorialize on mechanics in the game code "The day after a flood or a drought is always clear". what if that changes or becomes toggleable? Description should be ""this state and its effects""
4. No need to bring in unrelated concepts, such as tending or negating world by saying no fertilizer. it also doesnt need oil or carrot seeds.
5. When writing numbers, always say what unit. Never "3" - 3 what? apples? children? 3 days, 3 L, 3 {fruit}, etc.
6. Always qualify subject: "each time it gets there" -> what is "it"? 
7. ONLY use game concepts, never use CODE concepts. Common code concept issues are "drinks", "blurb", "beds", "out of air", ""

## Chrome

Rail left: **Shop** **Build** **Research** **Market** **Lens** **Family** **Almanac** **Cheat**. Build cluster: **Delete** **Rotate** **Cancel**.

Rail top: **Gardena**, Coin, **Day {n} · {phase}**, weather glyphs, **Researching**, **Expansion**, **Skill points**, **Multiplayer**, **Pause**/**Resume**, **Gear**.

Almanac Overview pages may define a word on first use. They still may not say: gem, pip, overlay, HUD, ribbon, dock, SKU, stall (link **Market**), rolled, RNG, tick, DAG, node, dump, seam, Cmd, hash.

## Update notes

Line shape [[standards/update-notes]]. Types: `building` `item` `ui` `mechanic` `multiplayer`. Verbs: `New` `Added` `Removed` `Changed` `Fixed bug`. Subject names come from this table / `skuLabel`. `{what it does}` is player register [[standards/lexicon]] `lex.copy`.
