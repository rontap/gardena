# 2.7.3 Better build

Delete is now Demolish, and it sits on the left rail whether or not you picked something in Build. Cancel appears whenever something is on the cursor. Taking a building down leaves plain untilled ground instead of watered, fertilized soil. Demolish reaches the Seed Variety Station and paving, which used to read Cannot demolish here and do nothing. Placing a machine shows the sides a Chest connects to, and the pads a Quad or Tractor loads at.

- 🔧 Changed ui: Demolish. previously, the button read Delete and showed up only after you picked a building in Build, now it reads Demolish and stays on the left rail.
- 🔧 Changed ui: Cancel. previously, it showed up only with some Build items, now it is there whenever something is on the cursor, paving and fencing included.
- 🔧 Changed mechanic: Demolish. previously, taking a building down left tilled soil already holding water and fertilizer, now it leaves untilled ground you can till, pave, or fence.
- 🐛 Fixed bug ui: Seed Variety Station. Pointing Demolish at it read Cannot demolish here and the click did nothing, now it reads Demolish Seed Variety Station and both cells come down.
- 🐛 Fixed bug ui: Paving. Pointing Demolish at a laid slab read Cannot demolish here, now it reads Demolish paving and lifts it.
- 🎉 Added ui: Chest connection preview. While a machine is on the cursor, the blue side it takes from and the green side it gives to are painted on the ground, so you can see where a Chest goes before you build.
- 🎉 Added ui: Pad preview. After Vehicles, a building on the cursor shows the Unload and Load pads it will have.

# 2.7.2 Grass seeds at the Seed silo

Grass seeds leave Build Land. After Landscape architecture they are bought at the Seed silo like Chilli seeds, they land in the silo, and Sow grass turns a plot back into Grass. A Chest beside a Mill, Infuser, or Furnace sits on the south side, not the north side. Opening Build Automation or Storage no longer turns on Vehicle interactions. Support from grandma gets smaller over the first days and then stops. The end-of-day summary hides that line when there is none, and Almanac Day & Night uses the same words.

- 🔧 Changed item: Grass seeds. previously, they sat under Land in Build, now after Landscape architecture they are bought at the Seed silo like Chilli seeds, they land in the silo, and Sow grass turns a plot back into Grass.
- 🔧 Changed mechanic: Chest beside Mill, Infuser, or Furnace. previously, it sat on the north side, now it sits on the south side.
- 🔧 Changed ui: Lens. previously, opening Build Automation or Storage turned on Vehicle interactions, now opening those tabs does not change the Lens.
- 🔧 Changed mechanic: Support from grandma. previously, the extra money at the end of the day stayed the same size, now it gets smaller over the first days and then stops.
- 🔧 Changed ui: End-of-day summary. previously, that money line said Stipend and always showed, now it says Support from grandma and the line is hidden when there is no Support from grandma.
- 🔧 Changed ui: Almanac Day & Night. previously, it called that money daily pay, now it says Support from grandma.
- 🔧 Changed ui: Build Land. previously, the line under the shelf listed Grass seeds with paving and fencing, now it is paving and fencing.

# 2.7.1 Catching up

Guests who miss what the host already did show Catching up instead of an unmoving farm. A Wooden fence run keeps money and fence together. Enter Embarks both gardeners. Extra Pumpjacks share water in the same order after join. Command Center names other gardeners when they join, leave, or their farm drifted.

- 🐛 Fixed bug multiplayer: Catching up. Missing what the host already did used to leave the guest's farm unmoving, with no Catching up and no return to the main menu, now what the host does next waits, Catching up can show, and the guest tries again if they stay behind.
- 🐛 Fixed bug multiplayer: Wooden fence. The host dragging Wooden fence used to spend money only on the host, so the guest's farm drifted and they were sent back to the main menu, now both farms keep the same money and the same Wooden fence.
- 🐛 Fixed bug multiplayer: Enter. Pressing Enter beside a Quad or Tractor used to put one gardener in the seat and leave the other walking, now both Embark when they stand next to it.
- 🐛 Fixed bug multiplayer: Pumpjack. Extra Pumpjacks used to share water in a different order after a guest joined, so the farms drifted, now they share water in the same order.
- 🎉 Added ui: {name} joined. Command Center shows that gardener's name when they arrive on the farm.
- 🎉 Added ui: {name} left. Command Center shows that gardener's name when they leave.
- 🎉 Added ui: {name} drifted. Command Center shows that gardener's name when their farm drifted.

# 2.7.0 Infusion

Place an Infuser and Infuse jam, wine, cider, spirits, or Olive oil with Flakes or Vanilla extract. Infused goods sell at Market without changing that good's percent, and finishing a contract with them raises Reputation more than the same contract without them. The Mill crushes Chilli into Flakes. The Furnace Bakes flour into Bread.

- 🎉 Added mechanic: Infusion. Infuse jam, wine, cider, spirits, or Olive oil at an Infuser with Flakes or Vanilla extract, one of those two, not both. Infused goods sell at Market at the percent shown for that good, and selling them does not change that percent. Finishing a contract with Infused goods raises Reputation more than the same contract without them.
  - Flakes come from crushing Chilli at a Mill. Vanilla extract comes from crushing Vanilla at a Mill.
- ✨ Added building: Infuser. The good keeps its name and Quality and shows a plus, instead of becoming a new good.
- ✨ Added item: Chilli seeds. Sow Chilli on tilled soil. It ripens sooner than Vanilla and later than Potato, and the fruit keeps longer than Potato. Crush at a Mill into Flakes.
- ✨ Added item: Vanilla extract. Crushed Vanilla, used at an Infuser. Extract from Cut grass is a different good the Market buys.
- ✨ Added item: Bread. Bake flour at a Furnace.
- 🔧 Changed building: Furnace. previously, flour burned into Ash, now flour Bakes into Bread, and a Furnace locked on ash will not take flour.
- 🔧 Changed building: Mill. previously, it did not crush Chilli, now Crush into flakes.
- 🔧 Changed ui: Market. previously, selling a good raised that good's percent, now Infused goods sell at the percent shown and do not change it.
- 🔧 Changed ui: Seed silo. previously, taking a second crop while your hand was full put the first one on the ground, now the seeds in your hand go back on the shelf and the crop you clicked comes out, and clicking the crop you are already holding adds the two together.
- 🔧 Changed ui: Additive store. previously, taking a second bag while your hand was full put the first one on the ground, now the bag in your hand is poured back and the one you clicked comes out, and clicking the bag you are already holding fills it back to the brim.
- 🔧 Changed mechanic: Weed spray. previously, a plot was sprayed the moment you clicked it, now the gardener takes a third of a second over it, the same way tending takes its time.
- 🔧 Changed ui: end of day. previously, a new day closed whatever panel you had open, now it leaves it open and you carry on reading it.
- 🔧 Changed ui: errands. previously, the whole list of errands filled the corner of the screen, now it shows the next five and says how many more are waiting.
- 🎉 Added ui: Weed infestation. A Command Center notice while weeds are standing anywhere on the farm; point at it and every weeded plot lights up on the map.

# 2.6.4 One build menu

The General store is gone. Every tool and everything you place is in the Build menu; seeds stay at the Seed silo and bags at the Additive store. Almanac and Cheat moved to the top bar, Hold Shift keeps a tool in hand, and Family shows Reputation and Luck.

- 🚫 Removed ui: General store. Seeds are bought at the Seed silo and bags at the Additive store, so the store only repeated what those two panels already sell.
- 🔧 Changed ui: Build. previously, its tabs were Water, Processing, Storage, Vehicles, Sensors and Land, now they are Tools, Water, Automation, Storage, Sensors and Land: shovels, pickaxes, axes and buckets open the menu, the Vehicle hangar sits under Automation, the field silos under Storage, and Grass seeds under Land.
- 🎉 Added mechanic: Hold Shift. Holding Shift as you click keeps what you are placing in hand, so a row of chests is one pick and many clicks instead of a trip back to the Build menu for each one.
- 🔧 Changed ui: Almanac. previously, it opened from the left rail, now it opens from a button on the top bar beside Pause.
- 🔧 Changed ui: Cheat. previously, it opened from the left rail, now it opens from a button on the top bar beside Pause.
- 🎉 Added ui: Reputation. A gold star on Family shows what the companies think of your farm; point at it to read what raises it, what it does to tomorrow's contracts, and the exact number.
- 🎉 Added ui: Luck. A four-leaf clover on Family shows your Luck; point at it to read what it changes about a burrow that has not appeared yet, and the exact number.
- 🔧 Changed ui: Market. previously, it opened on Stall every time, now it opens on the tab you last read.
- 🎉 Added mechanic: Auto-restock. A Seeding silo and an Additive silo each gain a tick box; with it on, whatever you take out of that silo is bought back, up to the amount it held, as long as there is money for it, so a silo out in the field keeps itself stocked without a walk home. A named Variety and Compost have nothing to buy, so they are left as they are.
- 🔧 Changed mechanic: end of day. previously, a new day paused the farm, now the farm keeps running and only opening the end-of-day summary from Day {n} Finished pauses it.

# 2.6.3 Research rebalance

Hardened tools sells the Hardened pickaxe and a Chainsaw. Gardening tools and Synthetic additives take their new names. Seed Variety Station waits on Crop variants.

- ✨ Added item: Chainsaw. Chops a mature tree into Wood in fewer seconds than an Axe, and lasts for more uses.
- 🎉 Added mechanic: Hardened tools. A Hardened pickaxe lasts for more uses and mines faster than a Pickaxe, and a Chainsaw chops a mature tree in fewer seconds than an Axe and lasts for more uses.
- 🔧 Changed item: Hardened pickaxe. previously, Pickaxes sold it with the Pickaxe, now Hardened tools sells it.
- 🔧 Changed item: Axe. previously, it lasted for more uses, now it lasts for fewer.
- 🔧 Changed mechanic: Synthetic additives. previously, this research was named Synthetic fertilizer, now it is named Synthetic additives, and the bag in the Shop is still Synthetic fertilizer.
- 🔧 Changed mechanic: Gardening tools. previously, this research was named Better gardening tools and sat in Trade, now it is named Gardening tools and sits in Plants.
- 🔧 Changed building: Seed Variety Station. previously, it sat on Processing from the first day, now it shows after Crop variants.
- 🔧 Changed item: Cobblestone. previously, the cobbles read as brown courses, now they read as stone.
- 🔧 Changed mechanic: Landscape architecture. previously, Expansion had to show first, now it sits on Land from the start.
- 🔧 Changed building: Pot still. previously, it sat on Processing from the first day, now it shows after Machinery.
- 🔧 Changed building: Furnace. previously, it sat on Processing from the first day, now it shows after Machinery.
- 🔧 Changed mechanic: Machinery. previously, Husband could learn it from the first day, now it is offered after Machinery research.

# 2.6.2 Command center update II

The right-hand column is titled Command Center. Ending a day no longer holds the farm; Day {n} Finished opens the end-of-day summary, Day {n} sits on the field when a day starts, and Loading... sits in the middle of the farm while the map is still coming up.

- 🔧 Changed ui: Command Center. previously, the right-hand column of clocks and things waiting to be spent had no title, now it is titled Command Center.
- 🔧 Changed ui: end-of-day summary. previously, ending a day held the farm on a screen you had to dismiss before the next day would play, now the farm keeps playing, a Command Center line reads Day {n} Finished, and you open the end-of-day summary from that line. Close takes Day {n} Finished off Command Center.
- 🔧 Changed ui: Day {n}. previously, a new day did not write its number on the field, now Day {n} sits at the top of the field when the day starts, then it goes.
- 🎉 Added ui: Loading.... While the map is still coming up, Loading... sits in the middle of the farm.

# 2.6.0 Command Center

A column down the right of the screen carries a line for each thing on the farm running out of time and each thing waiting to be spent, and three counts leave the top of the screen to live in it.

- 🎉 Added ui: Notices. A column down the right of the screen carries one line for each thing on the farm running out of time and each thing waiting to be spent, so you read a plot going red or a contract coming due without going looking for it. Point at a line to outline the plots it covers, click one to open the page that answers it, and Hide slides the column off the right edge.
- 🔧 Changed ui: Researching. previously, the research you had running showed along the top of the screen with the seconds left beside it, now it is a notice that opens Research when you click it, and the seconds left are read on the Research page.
- 🔧 Changed ui: Skill points. previously, unspent skill points showed as a small count at the top of the screen, now they are a notice that opens Family when you click it.
- 🔧 Changed ui: Expansion. previously, farm expansion opportunities showed as a small count at the top of the screen, now they are a notice.
- 🔧 Changed ui: Changelog. previously, every release ran down one scrolling page, now a list of releases sits down the left and clicking one jumps the page to it.

# 2.5.0 Automation update V

One Logic gate does the work of the old OR and AND, a Variety sensor and a Weather sensor join Sensors, and the Pressure plate (once the Vehicle detector) can watch You and things on the ground, and can sit on a Wooden fence.

- ✨ Added building: Logic gate. Two incoming signals: set OR so it turns on if either is on, or AND so it turns on only while both are on.
- 🚫 Removed building: OR gate. Buy a Logic gate and set OR.
- 🚫 Removed building: AND gate. Buy a Logic gate and set AND.
- ✨ Added building: Variety sensor. Turns on when a growing or ripe plant or tree around it matches the plain crop, a named Variety, or Heirloom, as you tick.
- ✨ Added building: Weather sensor. Turns on while today's weather is one you tick.
- 🔧 Changed building: Pressure plate. previously, it was the Vehicle detector and turned on only while a Quad or Tractor sat on its tile, now it is a Pressure plate, you tick Vehicle, You, or On the ground, and it watches the ground around it.
- 🔧 Changed building: Pump. previously, it always drew water, now a signal on its input stops it drawing until the signal goes off.
- 🎉 Added mechanic: Fenced sensors. A Water sensor, Fertilizer sensor, Harvest sensor, Variety sensor, or Pressure plate on a Wooden fence watches the plots inside that fence. An open fence looks as open fence, close it to turn the sensor on.

# 2.4.5 Errands

The gardener keeps twelve Digs in mind, a Better shovel opens a burrow faster, and litres on Recipes and Inspect round to the nearest half.

- 🔧 Changed mechanic: previously, the gardener kept eight Dig and Plant clicks in mind and dropped the rest with no word, now they keep twelve and say I can't remember more errands than that! when you click another.
- 🔧 Changed mechanic: Burrow. previously, every shovel took the same time to Dig a burrow, now that time is three times that shovel's Dig time.
- 🔧 Changed item: Rotary shovel. previously, a Dig was faster than it is now, now each Dig takes a third of a second.
- 🔧 Changed ui: Recipes. previously, litre amounts printed two decimals, now they round to the nearest half litre.
- 🔧 Changed ui: Inspect. previously, plot water printed two decimals, now it rounds to the nearest half litre.

# 2.4.4 Sails and Silos

The Mill turns real sails, the three field silos finally hold what their names promise, and paving stays put under whatever you build on it.

- 🎉 Added mechanic: Ground hardness. Every patch of untilled ground now carries its own hardness instead of falling into one of three steps, so digging gets slower the poorer the dirt is rather than doubling the moment you cross a line.
  - The plain Shovel digs the softest ground a little faster than it used to.
  - Hard ground still takes two uses off the shovel, and very hard ground still needs a pickaxe.
- 🎉 Added item: Asphalt. The cheapest surface you can lay, and a Tractor crosses it as fast as Paving slab.
- 🔧 Changed mechanic: Paving. previously, putting a building on a paved cell destroyed the paving under it, now paving stays under whatever you build and lifts only once nothing is standing on it.
  - You can also pave a cell a building already occupies.
  - Every paved area now draws a kerb where it meets anything else.
- 🔧 Changed building: Mill. previously, it was a one-tile hopper, now it is a two-by-two windmill with a tapered stone tower and four sails.
- 🔧 Changed building: Seeding silo. previously, walking up to it only told you its name, now it opens a seed store of its own that holds three hundred seeds.
- 🔧 Changed building: Additive silo. previously, it was the Spraying silo and held nothing, now it is a six-hundred-litre store of fertilizer, compost, weed spray and sugar out on the field.
- 🔧 Changed building: Produce silo. previously, it held nothing, now it has sixteen slots and takes fruit, pulled weeds and cut grass.
- 🔧 Changed ui: Rock. previously, boulders were smooth loaves that turned up anywhere on the farm, now they are faceted, come in two shapes, and cluster in stony ground.
- 🔧 Changed ui: Sprinkler. previously, the spray was a bright arc that snapped a quarter turn several times a second, now it is a fine translucent mist that drifts outward.
- 🎉 Added ui: Working machines. A Mill turns its sails and throws flour dust at its door, a Seed grinder throws green chips while it grinds, a Seed Variety Station lights its trays in turn, a Tractor trails smoke while it drives, and a Pumpjack rocks its arm while you fill a bucket at it.
- 🔧 Changed building: Well. previously, it read as a pale cabinet, now it is a coursed stone wellhead with water in its mouth under a tiled gable.
- 🔧 Changed building: Rainwater tank. previously, it was a plain crate, now it is a hooped wooden butt with a downpipe into it, a sight gauge, and a tap at its foot.
- 🔧 Changed building: Tap. previously, its handwheel sat beside the riser and read as a smudge, now the wheel is on top and the spout steps down into a puddle.
- 🔧 Changed item: Bucket. previously, the two buckets were the same drawing at two sizes, now the small one is a tapered pail under a handle and the large one is a wide tub with grips at its sides.
- 🔧 Changed ui: Paving slab. previously, it was four squares under a cross, now it is offset flagstones whose courses line up from cell to cell.
- 🔧 Changed ui: Burrow. previously, it was a dirt mound with a gold block on it, now it is a thin crack in the ground that forks three ways with a glint deep inside, in one of two shapes, and it flashes when you dig it open.

# 2.4.3 Burrows

Holes in the ground hold treasure, seeds, and tools. Dig them with a shovel. Lucky on Family makes later holes better.

- 🎉 Added mechanic: Burrow. A hole in untilled ground that you Dig with a shovel to drop what it holds, and digging it does not till the ground.
  - Looking at a burrow does not say what it holds.
  - A few sit on the farm when you start. When a day begins, one more can appear on untilled ground in each piece of land you own, if there is room.
  - You cannot place, pave, fence, or plant a tree on it. You can walk across it.
- ✨ Added item: Treasure. You open it on a plot you own for the money it holds, and the Market does not take it.
- ✨ Added mechanic: Lucky. A burrow that appears after you learn this gardener skill on Family, ranks I–III, holds more money in treasure than a burrow that appeared without Lucky, and more often holds a seed or tree seed of a Variety the shop does not sell as a pack.
  - Burrows already on the farm do not change.

# 2.4.1 QoL V

Heirloom Varieties leave the barrel and the jam machine as products of their own, with names and containers to match, and the inspect panel reads Quality and Freshness off bars.

- 🐛 Fixed bug building: Seed Variety Station. Placing it showed a Pot still, now the ghost is the station.
- 🔧 Changed ui: Build. previously, only the Sensors tab locked the Sensors lens, now the Water tab turns on Pipes, the Vehicles tab turns on Vehicle interactions, and the Sensors tab turns on Sensors, none of them locked, and leaving Build or those tabs restores the lens you had, unless Lock view is already on.
- 🔧 Changed ui: Load and Unload. previously, both arrows pointed into the building, now Unload points out of the building.
- 🔧 Changed ui: Recipes. previously, a long name wrapped the row while faces cycled, now the row stays one line and the hover card is wider.
- 🔧 Changed ui: Held item. previously, its name sat in the body face, now it sits in the rustic title face and reads a little larger.
- 🔧 Changed building: Seed grinder. previously, every fruit shared one cycling row, now Bintje, Red Fife, Green Zebra and Concord have their own row that returns that Variety's seed.
- 🔧 Changed mechanic: Premium casks. previously, a barrel filled with an Heirloom Variety poured the same Wine or Cider as any other Variety, now it pours Premium wine or Premium cider, and the name follows the bottle from the barrel to the stall.
- 🔧 Changed item: Grape jelly. previously, it drew the plain grape jam jar, now it draws a taller jar under a gold wax cap with a label of its own.
- 🔧 Changed item: Black raspberry jam. previously, it drew the plain raspberry jam jar, now it draws a jar under a tied cloth lid, filled almost black.
- 🔧 Changed item: Passata. previously, it drew the ketchup bottle, now it is a can with a label of its own.
- 🔧 Changed item: Barackpálinka. previously, it read Apricot pálinka and drew the Brandy bottle, now it reads Barackpálinka and draws a slim gold-foiled bottle nothing else uses.
- 🔧 Changed building: Jam machine. previously, every jar took the same sugar, now Passata takes none and ketchup takes twice what a jam does.
- 🔧 Changed mechanic: Starting stock. previously, the house held tree seeds and grafts only, now it also holds five Kéknyelű grapes and five San Marzano tomatoes, enough for one barrel and one Passata before your first harvest.
- 🔧 Changed ui: Seed silo. previously, sugar cane sat in the last column, now it sits in the first, and still only appears once you have researched it.
- 🔧 Changed ui: Inspect. previously, a ripe plant printed its Quality in the title and a fruit on the ground printed its Quality and freshness in text, now both read them off a blue Quality bar and a red-to-green Freshness bar.

# 2.4.0 Variety overhaul

Every plant now carries a Variety it was sown with and a Quality it earned, grafts move a Variety onto a plant already growing, and the machines pass both into what they make.

- 🎉 Added mechanic: Variety. Every seed carries a named Variety that is set when it goes in the ground and never changes, and each Variety is better at Preserving, at Fresh, or at Alcohol than its siblings.
  - Two Varieties of one crop are siblings, not steps. Bintje and Russian Banana are both potatoes, and neither is the better potato.
  - Preserving is the Jam machine and the Mill, Fresh is fruit sold as it is, and Alcohol is the Pot still and the Barrel.
  - The Market pays more for a good made on the path its Variety is rated highest on, and less for one made on the path it is rated lowest.
  - Kéknyelű, Pink Lady and Bing stop short of fruit unless another plant of the same crop that is not Heirloom is growing within two tiles.
  - Carrot, vanilla and sugar cane have one Variety each, and nothing about them changes.
- 🎉 Added mechanic: Quality. Every plant, fruit and good carries a Quality percent for how well it was treated, and the Market pays more for a higher one.
  - A plant kept happy hands its seed a better Quality than it was given, and a neglected plant hands down a worse one.
  - Seed bought from a shop starts at 0%, and merging two stacks of one Variety averages their Quality.
  - Fruit that drops from a tree is 0%.
- 🎉 Added building: Seed Variety Station. Takes Heirloom fruit, hands it back cut, and cuts one or two grafts of that Variety out of it.
- 🎉 Added item: Graft. Attaches to a plant or a sapling that is already in the ground and turns it into the graft's Variety; it is never sown like a seed.
- 🎉 Added mechanic: Named preserves. A jar takes the name of the Variety that filled it, so Concord grapes come out as Grape jelly, San Marzano tomatoes as Passata, Montmorency cherries as Sour cherry preserve, Blenheim apricots as Blenheim apricot jam, and Black raspberries as Black raspberry jam.
- 🎉 Added mechanic: Starting stock. The Seed silo starts with a pack of every annual Variety, and you start carrying a plain tree seed of each species and one graft of every tree Variety.
- 🎉 Added mechanic: Experienced apple, apricot, olive and cherry growers. Trees carry a Variety now, so each of those four crops has a grower skill of its own.
- 🔧 Changed mechanic: Trees. previously, an Axe on a mature tree gave Wood alone, now it also gives two grafts of that tree's Variety, so an orchard can make more of what it already holds.
- 🔧 Changed building: Seed grinder. previously, it refused tree fruit, now it takes tree fruit and returns a tree seed, and Heirloom fruit returns the plain seed of its crop instead of its own.
- 🔧 Changed building: Mill. previously, every fruit of a crop milled to the same flour at the same price, now the hopper holds one Variety and the flour carries that Variety's Preserving rating and the Quality that went in.
- 🔧 Changed building: Jam machine. previously, a jar sold at one price for its crop, now the machine holds one Variety and the jar carries that Variety's Preserving rating and the Quality that went in.
- 🔧 Changed building: Pot still. previously, a load of one crop made that crop's spirit at one price, now a load that shares one crop and one Variety makes that spirit at the Variety's Alcohol rating and the Quality that went in, and any other load comes out as a mixed spirit.
- 🔧 Changed building: Barrel. previously, how far a cask aged came from the fruit that filled it, now it comes from the Quality that went in.
- 🔧 Changed ui: Field lens. previously, the lens over the field showed what each planted crop was carrying, now the Variety lens colours every plot by the Variety growing on it.
- 🔧 Changed ui: Almanac. previously, a crop page explained the steps a fruit could ripen into, now it carries a Variety page and a Quality page, and each crop lists its Varieties with their Preserving, Fresh and Alcohol numbers.
- 🚫 Removed mechanic: Trusted seed bank. Seed packs bought from a shop no longer arrive better than the plain pack.
- 🚫 Removed mechanic: Experienced carrot, vanilla and sugar cane growers. Those three crops have one Variety each, so there was nothing left for the skill to raise.

# 2.3.0 Machine update II

A Furnace burns mixed waste into Ash and speeds nearby machines, and an Axe chops a mature tree for Wood.

- 🎉 Added building: Furnace. Burns a mixed load into Ash, and a working Furnace makes nearby machines finish faster than they do without one.
- 🎉 Added item: Axe. Chops a mature tree into Wood; the tree then grows a trunk and grows again before it fruits.
- 🎉 Added item: Wood. Chopped from a mature tree; burns in a Furnace.
- 🎉 Added item: Ash. Left when a Furnace finishes a burn; the Compost box takes it as waste.
- 🔧 Changed mechanic: Trees. previously, a mature tree only grew fruit, now an Axe chops it into Wood, it grows a trunk, then grows again before it fruits.
- 🔧 Changed ui: Tree inspect. previously, a tree that was not yet mature only read as growing, now a chopped tree reads as a trunk and a sapling still reads as growing.
- 🔧 Changed building: Furnace. previously, it stretched tall to fill both tiles, now it sits on those same two tiles without stretching, smoke comes from the chimney while it works, and placing or hovering it outlines how far nearby machines finish faster.
- 🔧 Changed building: Pot still. previously, it stretched wide to fill both tiles, now it sits on those same two tiles without stretching.
- 🔧 Changed ui: Machine inspect. previously, it did not say a machine finished faster from a working Furnace, now hovering a Mill, Jam machine, Pot still, Seed grinder, Compost box, or Furnace shows it finishes faster with that working Furnace than without a Furnace.

# 2.2.0 Settings

A Settings page behind the gear, a way back to the startup screen, and a farm that no longer races through the time you spent in another tab.

- 🎉 Added ui: Settings. A page behind the gear holds a reduced-motion switch and a switch that stops the farm while this tab is not in front, and what you save there follows you into every farm on this browser.
- 🎉 Added ui: Main menu. A button in the gear saves the farm and takes you back to the startup screen.
- 🔧 Changed mechanic: End of day. previously, the farm started running again the moment you closed the end-of-day summary, now it waits until you press Resume.
- 🐛 Fixed bug mechanic: Time spent in another tab piled up and the farm raced through it on your return, sometimes past midnight; the farm now carries on from where you left it.

# 2.1.3 QoL Patch IV

The Almanac shows what a crop turns into, the seed silo sells seeds, and the weed spray can gets a nozzle.

- 🎉 Added ui: Recipes. A crop or tree's Almanac page now lists what it turns into at any machine you have already researched, and hovering one shows the price and how that recipe works.
- 🎉 Added ui: Seed buying. A buy button under each crop column in the Seed silo stocks seeds without a trip to the shop.
- 🔧 Changed item: Weed spray. previously, the can had no nozzle, now it shows a hose and spray nozzle.

# 2.1.2 QoL Patch III

Wells become buildings, barrels show their age, and a run of small fixes across the farm.

- 🔧 Changed building: Well. previously, it sat on a pipe edge like a valve, now it stands on a tile like the pumpjack and feeds the grid from any of its four corners.
- 🔧 Changed building: Freezer. previously, fruit inside never rotted, now it rots 80% slower.
- 🔧 Changed building: Pot still. previously, a batch drank 1 L, now it drinks 2 L.
- 🔧 Changed building: Barrel. previously, a matured barrel only read as ready, now it shows how many days it has aged and what that multiplies the cask price by.
- 🔧 Changed item: Cask. previously, an aged wine looked the same as a fresh one, now its name carries the age multiplier baked into its price.
- 🔧 Changed mechanic: Pump water. previously, a pump running all day billed about $20 at sundown, now it bills about $40.
- 🔧 Changed mechanic: Money. previously, prices split into gold and silver coins, now every price shows as a single rounded coin.
- 🔧 Changed mechanic: Grass. previously, tufts kept appearing forever, now the farm stops growing new grass once it holds 32 tufts per chunk of land you own.
- 🔧 Changed mechanic: Tree fruit. previously, a tree dropped every fruit onto the same tile, now each fruit lands on a random tile around the trunk.
- 🎉 Added ui: Chest contents. Hovering a chest or freezer lists what is inside as small icons in the bottom-right panel.
- 🎉 Added ui: Queue markers. A small white triangle marks every tile your gardener is on the way to.
- 🎉 Added ui: Additive buying. A buy button on each row of the additive store stocks fertilizer without a trip to the shop.
- 🔧 Changed ui: Performance readout. previously, frames, tick time, and memory sat loose in the corner, now they sit muted on the top bar and the frame rate turns orange when it drops.
- 🐛 Fixed bug ui: An item's quantity sat on top of its rarity gem in the bottom-right of the icon; the quantity now sits on the left.

# 2.1.1 Balance

Trees grow faster, fruit prices move, and off-season care pays off.

- 🔧 Changed mechanic: Trees. previously, every sapling took two days and fruit sold at the old prices, now each species has its own grow time and stall price.
- 🔧 Changed mechanic: Careful tending. previously, it only made a growing plant happier once, now you can also tend an off-season tree once, which raises the next on-season chance by 15%.
- 🔧 Changed building: Barrel. previously, cider needed five apples, now it needs four. The cider price is the same.
- 🔧 Changed building: Seed grinder. previously, a fruit took 5 seconds, now it takes 12 seconds.
- 🔧 Changed mechanic: Freshness. previously, picked fruit that hit 0% stayed fruit, now it becomes rotten produce.
- 🔧 Changed mechanic: Clearance sale. previously, it paid $1 for fruit that had gone completely off, now it pays $1 for rotten produce.
- 🔧 Changed item: Weed spray. previously, it was a 30-use can delivered to the house, now it is a 30 L bag in the additive store.
- 🔧 Changed ui: Tree inspect. previously, it printed a growth percent and said yielding or resting, now it uses the plant Growth bar and says on-season or off-season.
- 🔧 Changed ui: Empty plot. previously, a tilled empty bed showed no bars, now it shows fertilizer, water, and weed resistance.
- 🔧 Changed mechanic: Save load. previously, a different version was refused unread, now any Gardena file is read, and a version line is shown only if that read fails.

# 2.1.0 Weather

Days can turn rainy or dry, and water from a pump now costs money at sundown.

- 🎉 Added mechanic: Weather. Clear, rain, dry, flood, and drought roll from the farm seed and change soil, weeds, tanks, wells, the stall, and the shop.
  - Rain wets every tilled plot a little, grows more weeds, and fills rain tanks six times faster.
  - Dry evaporates a little, stops weeds and grass, shuts rain tanks, and raises the pump bill.
  - Flood can drown plants, surges rain tanks, closes the stall at sunrise, and pays more for fruit.
  - Drought dries plots harder, halves wells, doubles shop goods, triples the pump bill, closes the stall at midday, and pays more for fruit.
- 🎉 Added mechanic: Pump water. Water taken from a pump is billed at sundown, about $20 if a pump runs all day.
- 🔧 Changed mechanic: Weather forecast. previously, it did nothing, now tomorrow's weather sits next to today on the top bar.
- 🎉 Added ui: Weather. After the day on the top bar, a glyph shows today's weather.
- 🎉 Added ui: Boot map. The farm behind the menu fades and scales in once the canvas is ready.

# 2.0.8 Almanac

Almanac matches the farm, and the day waits while you read it.

- 🔧 Changed ui: Almanac. previously olive sat with the annuals, now it sits with the trees.
- 🔧 Changed ui: Almanac. previously a fruit page showed jam as its third picture, now it shows the jam, spirit, wine, cider, or oil that fruit makes.
- 🔧 Changed mechanic: Pause. previously Family, Market, and Almanac left the day running, now they pause the farm unless you are in multiplayer.
- 🚫 Removed item: Watermelon. Seeds and fruit are gone from the shop, the field, and the stall.
- 🔧 Changed mechanic: Grape seeds. previously you had to finish Tomato or Watermelon seeds first, now Grape seeds sits on the research shelf from the first day.
- 🚫 Removed item: Apple jam. Apples go to cider in the barrel.
- 🔧 Changed building: Barrel. previously its recipe list showed grapes to wine only, now it also shows apples to cider.
- 🔧 Changed building: Pot still. previously a batch drank 0.5 L, now it drinks 1 L.
- 🔧 Changed building: Mill. previously extract came from grass only, now two vanilla fruits mill into three extract.

# 2.0.4 Balance

Rarity waits on Crop variants. Shop prices and machine times move.

- 🎉 Added mechanic: Crop variants. After this project, a happy plant can ripen as a better grade, shop packs can come Uncommon or Rare if you learned Trusted seed bank, and the seed silo shows those grades.
- 🔧 Changed mechanic: Rarity. previously, a happy plant could ripen a better grade from the first day, now a plant keeps the grade of its seed until you research Crop variants, and shop packs stay Common.
- 🔧 Changed mechanic: Experienced growers. previously, Better carrots, Better potatoes, and Better wheat were offered from the first day, now they are named Experienced carrot grower, Experienced potato grower, and Experienced wheat grower, and they wait on Crop variants.
- 🔧 Changed mechanic: Trusted seed bank. previously, it was offered from the first day, now it waits on Crop variants.
- 🔧 Changed mechanic: Still good for jam. previously, it kept a floor on what the Market paid for fruit that had started to go, now fruit below half freshness rots 15% slower per rank.
- 🔧 Changed mechanic: Haggling. previously, the husband could learn it on Family, now it does not appear as a skill choice.
- 🚫 Removed mechanic: Composting. The Compost box is in the store from the first day.
- 🔧 Changed mechanic: Machinery. previously, the research project was named Seed grinder, now it is named Machinery. The building is still the Seed grinder.
- 🔧 Changed mechanic: Research. previously, Unlock land took 50s, Expand land 110s, Eminent domain 200s, Vehicles cost $40, Automated dispatch cost $35 and took 70s, Irrigation cost $12, Chest $14, and Seed grinder $20, now Unlock land takes 45s, Expand land 90s, Eminent domain 180s, Vehicles cost $50, Automated dispatch costs $100 and takes 80s, Irrigation costs $10, Chest $10, and Machinery $10.
- 🔧 Changed building: Sprinkler. previously, it cost $15, now it costs $16.
- 🔧 Changed building: Large sprinkler. previously, it cost $33, now it costs $48.
- 🔧 Changed building: Pipe. previously, it cost $4, now it costs $3.
- 🔧 Changed building: Manual valve. previously, it cost $6, now it costs $5.
- 🔧 Changed building: Pumpjack. previously, it cost $40, now it costs $50.
- 🔧 Changed building: Rainwater tank. previously, it cost $20, now it costs $25.
- 🔧 Changed building: Wine barrel. previously, it cost $28, now it costs $18.
- 🔧 Changed building: Mill. previously, a batch took 3s and it cost $35, now a batch takes 10s and it costs $45.
- 🔧 Changed building: Jam machine. previously, a batch took 20s and it cost $40, now a batch takes 40s and it costs $45.
- 🔧 Changed building: Pot still. previously, a batch took 180s, now a batch takes 160s.
- 🔧 Changed building: Seed grinder. previously, a fruit took 2s, now a fruit takes 5s.
- 🔧 Changed building: Compost box. previously, a bag took 90s and it cost $20, now a bag takes 60s, it costs $8, and it is in the store from the first day.
- 🔧 Changed building: Wooden fence. previously, it cost $10, now it costs $8.
- 🔧 Changed item: Sensors. previously, lever, button, lamp, gates, pulser, counter, readers, and the traffic light sat at the old prices, now lever, button, and lamp cost $3, AND, OR, and NOT cost $8, pulser, counter, traffic light, and vehicle detector cost $10, water, fertilizer, and harvest sensors cost $6, and water-system and day sensors cost $12.

# 2.0.3 Orchard

Trees are redrawn end to end, and the barrel takes a second fruit.

- ✨ Added item: Cider. The barrel presses and ages it from apples.
- 🔧 Changed building: Barrel. previously, it took grapes and nothing else, now the first fruit you drop in sets what it makes, and apples make cider instead of wine.
- 🔧 Changed item: previously, a tree came as a sapling that looked like the shrub it would grow into, now it comes as a seed drawn as its own fruit cut open, so the four species read apart in a full pack.
- 🔧 Changed mechanic: Tree planting. previously, the tile you clicked became the crown and the tree grew downward over the tile below, now the tile you click is where the trunk stands and the tree grows up from it.
- 🔧 Changed ui: previously, a planted tree jumped from a shrub straight to a full canopy, now it spends its youth as a young tree on a mound of fresh soil before it fills out.
- 🔧 Changed ui: previously, the four trees shared one blocky canopy and told apart only by fruit colour, now each has its own silhouette - a round apple, a broad apricot, a gnarled silver olive, and a twin-crowned cherry.
- 🔧 Changed ui: previously, the apple was a red block with a bite of shading, now it has shoulders, a stem well, and a leaf, and Pink Lady is striped pink.

# 2.0.2 Legible Build

Pipes, valves, wires, and the lens say what they are doing. Water and signal move on the field.

- 🎉 Added mechanic: Smart irrigation on every valve. The separate smart valve is gone; the valve you already own grows a signal input once you research Smart irrigation.
  - An unwired valve is still a hand valve: click it and the gardener walks over and turns it.
  - A wired valve follows its wire instead, and ignores the click. Pull the wire and the hand takes it back.
- ✨ Added ui: Edge lattice. Arming a water tool draws every tile edge a pipe could sit on, so the grid is visible before the first click.
- ✨ Added ui: Pipe runs. Press on an edge and drag, and the run follows an L-shaped path to the pointer; hold Shift to turn the corner the other way. The chip counts the segments and their price.
- ✨ Added ui: Wire dragging. Press an output port and release on an input to lay a wire, or keep clicking one then the other.
- ✨ Added ui: Water flow. While the pipe overlay is up, water marches along the pipes it is moving through, and stops dead at a closed valve.
- ✨ Added ui: Signal flow. A live wire carries beads from its output to its input.
- ✨ Added ui: Lock view. A lens now turns off when you close the Lens panel, unless you lock it. Locked lenses say so on the rail and clear in one click.
- 🔧 Changed building: Valve. previously, a valve needed a pipe on the edge first, now placing one on a bare edge lays the pipe with it and charges for both.
- 🔧 Changed ui: previously, digging burst dirt once the hole was already dug, now the spade throws dirt for the whole dig and the soil opens as it goes.
- 🔧 Changed ui: previously, hovering a building outlined every tile it covers as its own box, now one outline runs around the whole building.
- 🔧 Changed ui: Sprinkler placement. previously, the corner snap was as tight as the delete and inspect snap, now an armed sprinkler reaches the nearest corner from anywhere in the tile.
- 🔧 Changed ui: previously, a sensor's ports took half its tile and only in the sensors lens, now a port is the dot you can see and the tile itself always flips, presses, or tunes the device.
- 🔧 Changed ui: previously, the field kept the pipes or sensors lens when you closed the shop, now a tool shows its own overlay while it is armed and hands the lens back when you put it away.
- 🔧 Changed ui: previously, watered soil looked like dry soil, now a plot darkens as it drinks and pales as it dries.
- 🔧 Changed ui: previously, the gardener slid across the farm in one pose, now they bob as they walk.
- 🚫 Removed building: Smart valve. The shelf entry is gone; research Smart irrigation and wire an ordinary valve instead.

# 2.0 Open Early Access

The field is redrawn. Menus, docks, and the day stay as they were.

- 🎉 Added ui: Smooth field. A large or busy farm no longer crawls when you pan.
- ✨ Added ui: Pipe drag. With Pipe armed, drag along tile edges and release to place each segment.
- 🔧 Changed ui: previously, hovering a house, hangar, or tank outlined one tile, now it outlines every tile that building occupies.
- 🔧 Changed ui: previously, pipes hid unless the pipes lens or a water tool was out, now joints stay on the field and the lens still shows wetness.
- 🚫 Removed ui: Last-action flash. The gold cell and label after a place or delete are gone.

# 1.9.1 Stacks

Fruit, seeds, and weeds stack in your hand. Fruit boxes are gone.

- 🎉 Added mechanic: Stacks. Countable goods of the same kind pile in your hand up to 10, or 6 for bottles and jars.
  - Harvest, pickup, and weed pull stop at the cap and say your hand is full. A chest or silo can still hand you more than that.
  - Liters do not stack this way.
- ✨ Added mechanic: Bulk up. A player skill. Each rank lets you carry 5 more of a kind, 3 more for bottled and jarred goods.
- ✨ Added ui: Machine work. A mill and jam maker puff dust while they run, a still steams, a barrel bubbles, and digging bursts dirt.
- 🔧 Changed building: Seed grinder. previously, a fruit box dumped every fruit in it, now a held fruit stack dumps all of it.
- 🔧 Changed mechanic: Tutorial. previously, it asked you to buy a fruit box, now it teaches stacking by picking a second fruit.
- 🚫 Removed item: Fruit box. You no longer buy a crate to carry a haul.
- 🚫 Removed item: Large fruit box. The large crate and its research project are gone.

# 1.9.0 Vehicle update III

Quad and tractor can run a shared loop of stops. A traffic light holds a truck only when that light is on the list.

- 🎉 Added mechanic: Automated dispatch. A Quad or tractor follows a shared stop list in a loop, and editing the list updates every vehicle on it.
  - Click the map for a go-to, a load pad, an unload pad, or a traffic light.
  - Automate on the dash opens the list while you drive. Start sends the vehicle off. Hangar Automate deploys it and starts from the first stop.
  - Getting in pauses the route. Start again resumes from the next stop.
  - An empty tank stops dead until you refill. Automated vehicles are slower and brake harder.
  - Load and unload only at a standstill, then a short pause.
- ✨ Added item: Traffic light. A truck waits here only if this light is a stop, until the input is green, and the output is on while one waits.
- ✨ Added ui: Automate. It opens the stop list from the dash, paints the purple path with numbered dots, and names Add stop, load, unload, or wait under the cursor.

# 1.8.3 Automation update IV

A chest or freezer beside a machine now feeds it and takes what it makes.

- 🔧 Changed mechanic: Machine chests. previously, you dumped by hand and the output landed on the ground, now a chest or freezer on the left feeds the machine and one on the right takes what it makes.
  - Blue chute on the left, green on the right.
  - No chest on the right, and the output still drops beside the machine.
- 🔧 Changed building: Seed grinder. previously, you stood there and ground fruit by hand, now it is a hopper that works on its own.

# 1.8.2 Rebalanced research

The research shelves are sorted by what you are trying to do, projects that need each other now say so, and the late ones cost what they are worth.

- 🔧 Changed ui: Research tabs. previously, they were Plants, Utilities, Expansion and Automation, now they are Plants, Land, Automation and Trade, and each holds the projects that answer one question.
- 🔧 Changed mechanic: Research order. previously, a project could be started out of order and the shop refused the thing it unlocked, now a project that truly needs another stays greyed and names what is missing.
  - Eleven projects are open on day one instead of fourteen, spread evenly across the four tabs.
  - Being shown a project and being able to start it are separate. Most projects only need one earlier project to appear.
  - Some shop items now need two projects rather than one, and the card says which.
- 🔧 Changed mechanic: Composting. previously, it sat behind Synthetic fertilizer, now the two cost the same and sit side by side from the first day.
- ✨ Added mechanic: Water storage. Wells and pumpjacks moved onto their own project, so Irrigation is now just the pipe and the tap for the pump you already own.
- ✨ Added mechanic: Field silos. The three silos moved onto their own project after Vehicles, so the hangar no longer arrives with $210 of storage attached.
- 🔧 Changed mechanic: Smart irrigation. previously, the sprinkler crop dial and the sprinkler signal input were two projects, now one project grants both.
- 🔧 Changed mechanic: Sensors. previously, it waited behind irrigation and sold a water reader with no plumbing to read, now it is open from the start and the readers that need plumbing, soil work or vehicles wait for those instead.
- 🔧 Changed mechanic: Research prices. previously, the deepest projects cost less than a well, now the late ones cost what they open and the early ones stay cheap.
- 🔧 Changed item: Pickaxe. previously, its project was free, now it costs money and waits until there is rock worth breaking.
- 🔧 Changed item: Rainwater tank. previously, it needed a research project, now it is in the store from the first day.

# 1.8.1 QoL Patch II

Contract offers are readable, leftover permits and skill points sit on the ribbon, and a lens shows vehicle pads.

- 🔧 Changed ui: Contract card. previously, it cut off the prize or cash, now the prize or cash has its own full line.
- 🔧 Changed ui: Contract hover. previously, it hid the offer, now hover shows the full offer.
- 🔧 Changed ui: Contract cancel. previously, cancel was a full-width button, now the host cancels with an ×, and hover names the coin penalty.
- ✨ Added ui: Expansion chip. It shows leftover expansion permits on the top ribbon, and it hides at zero.
- ✨ Added ui: Skill points chip. It shows unspent skill points on the top ribbon, and it hides at zero.
- 🔧 Changed ui: Expand plate. previously, a dead edge was silent, now it says No permit left.
- ✨ Added ui: Vehicle interactions. This lens paints hangar and pad arrows, it stays hidden until Vehicles is researched, and driving still paints the arrows with the lens off.
- 🔧 Changed mechanic: Heirloom crops. previously, it showed up early and cost little, now it sits behind Synthetic fertilizer and costs more.
- 🔧 Changed item: Shovel. previously, it swung faster, now each swing is slower.
- 🔧 Changed item: Better shovel. previously, it swung faster, now each swing is slower.

# 1.8.0 What money cannot buy

Two contracts a day pay in goods instead of coin. Some of those goods are the only ones of their kind.

- 🎉 Added mechanic: Contracts. Two of the six daily offers pay a prize and no money.
  - What a firm offers is fixed. Which two offers pay a prize rolls every day.
  - Harder work pays a better prize.
  - Whole Cart and Little Lid deal in saplings, vanilla, and the late tools.
  - Trade Jo and Mercanova deal in buildings and land.
  - Halbert Eijn and Intercrop deal in fertilizer and skill points.
  - Consign at the truck fills running contracts first, then the stall.
  - Delivered contract goods do not depress the stall. Missed and cancelled leftovers do.
  - Only the host accepts, cancels, and reorders. Guests still deliver at the truck.
- 🔧 Changed mechanic: Stall. previously, Sell all always paid the clean price, now selling more of one good depresses that good's price until it recovers.
  - Each good has its own pressure. Processed goods do not inherit the crop's pressure.
  - Sell all shows the paid total and the clean total it was measured against.
  - Hover names the floor and how many days until the price is clean.
  - Rotten fruit still pays a dollar and does not add pressure.
- ✨ Added ui: Stall tab. The market overlay splits Stall from Contracts.
- ✨ Added ui: Contracts tab. It shows today's board and running orders once you research Contracts.
- ✨ Added building: Large freezer. Nine slots instead of six, fruit inside still does not rot, and it appears in the shop only while you have one banked from a contract.
- ✨ Added item: Olive sapling. Trade Jo and Mercanova hand it over as a contract prize.
- 🚫 Removed item: Vanilla seeds. The shop no longer sells them, and only a contract prize hands them over.
- 🚫 Removed mechanic: Vanilla tending. That skill is gone.
- 🚫 Removed item: Rotary shovel. The shop no longer sells it, and a four-star contract can hand it over.
- 🚫 Removed item: Diamond pickaxe. The shop no longer sells it, and a four-star contract can hand it over.
- ✨ Added mechanic: Expansion permits. Expanding land spends a permit as well as money.
  - Unlock land grants the first permit.
  - Expand land and Eminent domain grant one each after that.
  - Inherit land grants one permit per rank, twice.
  - Past that, permits are contract work. An edge with none left says so.
- 🔧 Changed mechanic: Skill points. previously, each family member banked their own points and could not lend, now one shared bank gets three a day, spent on whoever you like.
- 🔧 Changed item: Olive. previously, it was a shop crop with seeds, now it is a tree, and saplings come from Trade Jo and Mercanova.
- 🚫 Removed item: Lemon. Lemon has left the garden.
- 🔧 Changed mechanic: Contract pay. previously, top-rung offers paid only a little more, now they pay much more.
- 🐛 Fixed bug mechanic: Contracts. A rare or heirloom order no longer pays wildly more than a common order of the same stars.
- 🔧 Changed mechanic: Contract deadlines. previously, the long jobs ran four to five days, now deadlines run 1-2, 2-3, or 3-4 days, and they land on half days.
- 🔧 Changed mechanic: Contract saves. previously, running orders vanished on reload, now they survive a save and load.
- 🔧 Changed mechanic: Haggling. previously, the husband's shop-discount skill was named Contracts, now it is named Haggling.

# 1.7.2 Memory on the wire

A lever can listen to itself. AND, OR, and NOT still cannot loop.

- 🔧 Changed mechanic: Wires. previously, they could not return to a lever, pulser, or counter, now they may, and a lever chain waits one moment per step instead of flipping all at once.
  - AND, OR, and NOT still cannot loop into each other. That still says Cannot loop.

# 1.7.1 QoL Patch I

A pulser, a counter, and a day sensor join the Sensors shelf. A wire can throw a lever. The dash shows cargo.

- ✨ Added building: Pulser. It turns on once when its input turns on, then stays off until the input turns off.
- ✨ Added building: Counter. It counts while its input is on, you set a number, and when the count reaches it the output turns on once and counting starts over.
- ✨ Added building: Day sensor. It turns on during the parts of the day you check, and Day is on when you place it.
- 🔧 Changed building: Lever. previously, only a hand throw flipped it, now a wire turning on throws it as well, you can still throw it by hand, and its output is on when the lever is on.
- 🔧 Changed building: AND. previously, Sensors unlocked it, now it waits on Advanced sensors.
- 🔧 Changed building: OR. previously, Sensors unlocked it, now it waits on Advanced sensors.
- 🔧 Changed building: NOT. previously, Sensors unlocked it, now it waits on Advanced sensors.
- 🔧 Changed ui: Driving dash. previously, it hid cargo, now a Quad shows occupied slot faces, a tractor with a seeder or sprayer shows the hopper, and a harvester shows occupied harvest faces.
- ✨ Added mechanic: Walking. WASD walks you around the farm when you are not driving, and click-to-walk still works.
- 🔧 Changed mechanic: Vehicles. previously, they drove faster, now they are slower.
- 🔧 Changed building: Pot still. previously, its art did not fill both tiles and it used less water, now it looks two tiles wide and it uses more water.
- 🔧 Changed building: Compost box. previously, it finished a bag slower, now it finishes a bag faster.
- 🔧 Changed mechanic: Trees. previously, they dropped fruit slower in season, now they drop fruit faster in season.

# 1.7 Irrigation update III

Working machines show what they are doing, and five props are easier to read.

- 🎉 Added mechanic: Machine effects. A working machine shows what it is doing, effects never block a click, and they stop moving if your system asks for reduced motion.
  - A working sprinkler throws an animated arc out to the edge of the ground it covers.
  - The spray stops the moment the water does.
  - Tending a plant and pouring a bucket leave a brief mark on the tile.
- 🔧 Changed building: Pump. previously, it was two halves seen from two angles, now it is one machine, a rocker arm over a water sump.
- 🔧 Changed building: Tap. previously, it was hard to read, now it has a handwheel and spout, and the water lands on its base.
- 🔧 Changed building: Freezer. previously, it was a blue chest, now it is a steel cabinet.
- 🔧 Changed building: Mill. previously, it was hard to read, now it has a millstone and a flour sack.
- 🔧 Changed building: Seed grinder. previously, it was hard to read, now it has a drum and a crank.

# 1.6.2 Machine — Vehicle patch

Machines, stores, and vehicles pass goods. Sensors can pause machines and read full stores.

- ✨ Added mechanic: Machine pads. Dropoff and takeup pads pass goods while you drive.
- ✨ Added ui: Load. The dash loads from a pad.
- ✨ Added ui: Unload. The dash unloads onto a pad.
- 🔧 Changed building: Mill. previously, it always took input, now a wire can disable its input.
- 🔧 Changed building: Jam machine. previously, it always took input, now a wire can disable its input.
- 🔧 Changed building: Pot still. previously, it occupied one tile and always took input, now it is 2×1 steel and a wire can disable its input.
- 🔧 Changed building: Chest. previously, it had no signal, now it outputs when full.
- 🔧 Changed building: Freezer. previously, it had no signal, now it outputs when full.
- 🔧 Changed building: Seed silo. previously, it had no signal, now it outputs when full.
- 🔧 Changed building: Additive store. previously, it had no signal, now it outputs when full.

# 1.6.1 Sensors polish

The Sensors shelf turns on the overlay. Ports, wires, and the water-system sensor speak more clearly.

- 🐛 Fixed bug ui: Sensors overlay. Opening the Sensors shelf left the overlay off, and now it turns the overlay on, closing Build, Shop, or Escape turns it off, and switching Build category keeps it on.
- 🐛 Fixed bug ui: Sensor tiles. They faded on the Sensors overlay, and now they stay unfaded.
- 🔧 Changed ui: Ports. previously, they were unclear, now outputs are small circles and inputs are squares, including on sprinklers and smart valves.
- 🔧 Changed building: AND. previously, it was larger, now it is more compact.
- 🔧 Changed building: OR. previously, it was larger, now it is more compact.
- 🔧 Changed building: Lamp. previously, its input sat elsewhere, now the input sits on top.
- 🔧 Changed mechanic: Wires. previously, drawing the same path again did nothing, now drawing it again removes it, and an input takes many wires as OR.
- 🔧 Changed building: Water-system sensor. previously, it stayed silent with no pipes around it, now it says so.

# 1.6 Automation III

Sensors and Smart Irrigation.

- 🎉 Added mechanic: Sensors. Research Sensors, then click a port to draw a wire.
- ✨ Added ui: Sensors shelf. It is a Build category for signal parts.
- ✨ Added building: Lever. Throw it to hold a signal.
- ✨ Added building: Button. Press it for a short pulse.
- ✨ Added building: Lamp. It lights when its input is high.
- ✨ Added building: AND. It is high only if both inputs are.
- ✨ Added building: OR. It is high if either input is.
- ✨ Added building: NOT. It inverts its input.
- ✨ Added building: Water sensor. It reads nearby plant water, and it is high when a plot matches the boxes you check.
- ✨ Added building: Fertilizer sensor. It reads nearby growing plants, and it is high when any is starving.
- ✨ Added building: Harvest sensor. Any is high when one plant is ripe, and All is high when every growing or ripe plant is ripe.
- ✨ Added building: Water-system sensor. It joins a net, and it is high when sprinklers want more than the tanks hold.
- 🎉 Added mechanic: Smart Irrigation. Existing sprinklers gain a signal input, unwired sprinklers still pour, and a wire turns one on and off.
- ✨ Added building: Smart valve. It sits on an edge, it stays closed unless its input is high, and it has no manual click.
- ✨ Added building: Vehicle detector. It is a flush plate, and it is high when a Quad or tractor sits on this tile.

# 1.5.2 Vehicles II patch

Boom width, slower machines, weed spray, and skill moves.

- 🔧 Changed building: Tractor. previously, the boom stayed at one width, now it switches between 3 and 5 while you drive, and a dash button shows the width.
- 🔧 Changed mechanic: Vehicles. previously, they drove faster, now they are slower, tilled soil and rocks drag more, and paving is still faster.
- ✨ Added mechanic: Enter. Enter boards the nearest parked machine or gets you off, it works within a short walk, and the dash Disembark button and the parked Embark button stay.
- ✨ Added item: Weed spray. Click tilled soil to starve weeds there.
- ✨ Added mechanic: Weed outbreaks. A fully grown weed seeds its four neighbours.
- 🔧 Changed mechanic: Family. previously, skill seats differed, now driving classes sit on you, and machinery and contracts sit on your husband.
- 🔧 Changed ui: Shop. previously, bulk seed buying waited on a skill, now Ctrl-click buys five packs at a discount with no skill lock.
- 🔧 Changed item: Fertilizer bag. previously, it held less, now it holds more.
- 🔧 Changed item: Bucket. previously, it held less, now it holds more.

# 1.5.1 Shop split

The store and the build menu are two panels, with search across both.

- 🔧 Changed ui: Shop. previously, it was one panel filed by ship date, now it is two panels, General store to buy and Build to place, filed by what a thing does.
- 🔧 Changed ui: Research. previously, it used a different shell, now it uses the same card grid and category rail as the shop.
- ✨ Added ui: Search. Type in either panel, results come from both, picking one that lives in the other panel takes you there, and Escape clears the box before it closes anything.
- 🐛 Fixed bug ui: Compost box. Delete and Cancel were missing while a compost box was on the cursor, and now they appear.
- 🐛 Fixed bug ui: Pipe overlay. Closing the shop through the gear or multiplayer button left the pipe layer on, and now the overlay turns off.

# 1.5 Vehicle Update II

A tractor, trailers, and field silos.

- 🎉 Added building: Tractor. Buy it at a hangar, hitch a trailer, and the boom works when you drive straight.
- ✨ Added item: Seeder. Hitch it to the tractor, it seeds as you drive, and capacity 100 shows on the dash.
- ✨ Added item: Sprayer. Hitch it to the tractor, it sprays as you drive, and capacity 100 shows on the dash.
- ✨ Added item: Harvester. Hitch it to the tractor, it harvests as you drive, and capacity 100 shows on the dash.
- ✨ Added building: Seeding silo. An inert field silo for seed.
- ✨ Added building: Spraying silo. An inert field silo for spray.
- ✨ Added building: Produce silo. An inert field silo for harvest.

# 1.4 Vehicle Update I

Drive a Quad around the farm.

- 🎉 Added building: Hangar. Vehicles research unlocks it, and you buy and dock machines there.
- 🎉 Added item: Quad. It deploys from the hangar, it holds six items when parked, and it docks on the hangar arrows.
- ✨ Added ui: Vehicle dashboard. It shows fuel and speed, and grass, dirt, and paving change how fast you go.

# 1.3 Seed silo and fertilizer store

Seeds and fertilizer no longer live in the house.

- 🎉 Added building: Seed silo. It stands next to the house, bought packs go here, up to 100 seeds, and starter packs start here.
- 🎉 Added building: Fertilizer store. It stands next to the house, and fertilizer, synthetic fertilizer, and compost sit here as liters, up to 200 L.
- 🔧 Changed mechanic: Stores. previously, you did not walk up to drop off, now you walk up to drop off what a store keeps, and you click a pile to take it.
- 🚫 Removed item: Placed fertilizer bag. Buying fertilizer no longer puts a bag in your hand, and it fills the fertilizer store instead.

# 1.2 Machine Update I

Machines on the farm turn crops into goods you can sell.

- 🎉 Added mechanic: Machines. Place them on the farm, feed them crops, and sell what comes out.
- ✨ Added building: Mill. It turns cane into sugar, olives into oil, wheat into flour, and grass into extract.
- ✨ Added building: Jam machine. It makes jam, and ketchup from tomatoes.
- ✨ Added building: Pot still. It distills spirits.
- ✨ Added building: Wine barrel. It ages grapes into wine.
- ✨ Added building: Freezer. Food inside does not go stale.
- ✨ Added item: Sugar. Liters from the mill or the shop.
- ✨ Added item: Oil. The mill presses it from olives.
- ✨ Added item: Flour. The mill grinds it from wheat.
- ✨ Added item: Extract. The mill presses it from grass.
- ✨ Added item: Jam. The jam machine cooks it from fruit.
- ✨ Added item: Ketchup. The jam machine cooks it from tomatoes.
- ✨ Added item: Spirits. The pot still distills them.
- ✨ Added item: Wine. The wine barrel ages it from grapes.
- 🔧 Changed mechanic: Research. previously, each machine had its own row, now one research can unlock several machines at once.

# 1.1 Multiplayer beta

Up to four players on the same farm.

- 🎉 Added multiplayer: Host. Host from the in-game menu, friends join from the main menu with a room key, money and land are shared, and when anyone pauses the whole farm pauses.

# 1.0 Early Access

You can leave the farm and come back to it.

- ✨ Added ui: Main menu. New game, load, upload a save, and in play save or download.
- ✨ Added mechanic: Tour. The first new farm walks you through a short tour.
- ✨ Added ui: Pause. A Pause button sits on the top bar.
- 🔧 Changed building: Well. previously, it stood apart from pipes, now it joins the pipe network, and you click it with a bucket to fill.
- 🔧 Changed mechanic: Weeds. previously, they were harsher on day one, now weeds and grass are gentler on the first day of a new farm.
- 🔧 Changed ui: Land overlay. previously, it hid untilled ground, now it colors untilled ground so you can see poor dirt before you dig.

# 0.8 Plants & Trees

Trees, and four new crops.

- 🎉 Added mechanic: Trees. Ripe fruit drops on the grass by itself, and trees do not drink or feed.
- ✨ Added item: Apple tree. Slow to set fruit, then the fruit keeps for days.
- ✨ Added item: Apricot tree. Many cheap fruits.
- ✨ Added item: Lemon tree. Citrus fruit, dropped when ripe.
- ✨ Added item: Cherry tree. Small fruit that spoils first among the trees.
- ✨ Added item: Olive. Keeps well once picked.
- ✨ Added item: Grape. A mid fruit, softer than raspberry.
- ✨ Added item: Vanilla. Expensive seed, slow, and picky about water and feed.
- ✨ Added item: Sugar cane. Water hungry, and ripe cane sells poorly as fruit.
- 🚫 Removed item: Wild berry shrubs. They are gone.

# 0.7.4 Cottage

Fences, lawn, and a cleaner interface.

- ✨ Added building: Wooden fence. It joins neighbours on untilled ground, and it does not block walking.
- ✨ Added item: Cobble. Cheap stone paving on untilled ground.
- ✨ Added item: Brick. Mid-price paving on untilled ground.
- ✨ Added item: Paved ground. The dearest paving on untilled ground.
- ✨ Added item: Grass seeds. Once they grow, the plot becomes lawn again.
- ✨ Added item: Rotary shovel. A thousand uses and a fast swing.
- ✨ Added item: Diamond pickaxe. A thousand uses and a fast swing.
- 🔧 Changed ui: Shop. previously, blocked buttons were silent, now they say why you cannot use them.
- 🔧 Changed ui: Research. previously, blocked buttons were silent, now they say why you cannot use them.
- 🔧 Changed ui: Family. previously, blocked buttons were silent, now they say why you cannot use them.
- 🔧 Changed ui: End-of-day recap. previously, it hid the ledger, now it shows stipend, tax, and remaining money.

# 0.6 Family

The farm is three people.

- 🎉 Added mechanic: Family. You garden, your husband runs research, your daughter runs the market.
  - Each morning everyone gets a skill point.
  - Pick skills on the Family panel.
- 🔧 Changed mechanic: Market hours. previously, the stall stayed open after sunset, now it closes at sunset until you unlock Open late or Open 24/7.
- 🔧 Changed ui: Map overlays. previously, they were always there, now water and soil-quality overlays unlock from study skills.

# 0.5 Irrigation II

More control over watering.

- ✨ Added building: Manual valve. It sits on a pipe edge and stops or opens flow.
- ✨ Added building: Tap. It fills buckets from an existing pipe network.
- ✨ Added building: Rainwater tank. It gathers rain without a pump.
- 🎉 Added mechanic: Smart sprinklers. Click a sprinkler, pick a crop, and it pours only as much as that crop drinks.
- 🔧 Changed mechanic: Water storage. previously, pumps, wells, and tanks did not store, now they store water, and a pipe only needs to touch a source at one corner to connect.

# 0.4 Plant care

Plants can drown, rot, and be composted.

- ✨ Added building: Compost box. Drop in rotten fruit and dead plants, and it makes compost.
- ✨ Added item: Synthetic fertilizer. A stronger feed than the bag, bought as liters.
- 🔧 Changed mechanic: Plants. previously, they only cared about water, now they care about water and fertilizer, and too much water hurts them.

# 0.3 Dirt Overhaul & Fertilizers

Water and fertilizer belong to the dirt, not the plant.

- 🎉 Added mechanic: Soil. Water and fertilizer live in the dirt, you can water bare tilled dirt, and harvest, dig, or death no longer wipe the plot.
- ✨ Added mechanic: Weeds. They sprout on empty tilled plots and drink what is in the dirt.
- ✨ Added mechanic: Grass. It can spread on untilled ground.
- ✨ Added item: Fertilizer bag. Pour it on dirt to raise the fertilizer in that plot.
- 🚫 Removed mechanic: Plant thirst. Plants no longer keep their own water, and the dirt holds it.

# 0.1 Market truck

Sell at the stall, not the house.

- ✨ Added mechanic: Stall. Take crops to the market truck, open the market, and Sell all.
- ✨ Added building: Market truck. It sits in the yard, and you consign cargo there.
- 🚫 Removed mechanic: House-door selling. Walking to the house door no longer sells.

# beta-6 Staleness mechanics

Picked fruit goes stale. Better fruit shows a gem.

- ✨ Added mechanic: Staleness. Picked fruit ticks down and can rot.
- ✨ Added mechanic: Rarity. Better fruit shows a gem, and a map overlay highlights it.
- ✨ Added ui: Delete. It sits on the toolbar, it removes buildings with no refund, and the house and starter pump stay.
- 🔧 Changed mechanic: Day. previously, it had no phases, now days have sunrise, day, sunset, and twilight.
- 🔧 Changed ui: Almanac. previously, it was one page, now it is split into tabs.

# beta-5 Irrigation

Pipes and sprinklers water the beds for you.

- 🎉 Added mechanic: Irrigation. Pipes run between tiles, and sprinklers at the corners water tilled land.
- ✨ Added building: Pipe. It runs on an edge and carries water.
- ✨ Added building: Sprinkler. It sits on a corner and waters the beds around it.
- ✨ Added building: Well. It feeds the water network.
- ✨ Added item: Watermelon. It drinks more than anything else, and a dry plot kills it.
- ✨ Added ui: Water network overlay. It colors the pipe network.
- 🐛 Fixed bug building: Sprinkler. You can place it before it has water, and it does nothing until a source feeds it.
- 🐛 Fixed bug building: Pipe. Empty pipes looked wet, and now they look dry.

# beta-4 Almanac

A catalog of crops and tools, plus storage.

- ✨ Added ui: Almanac. A catalog of crops, tools, and buildings.
- ✨ Added ui: Map overlays. They color soil water, ripeness, and what is on a tile.
- ✨ Added building: Chest. Walk up to it and store items in nine slots.
- ✨ Added building: Seed grinder. Put fruit in, get seeds out.
- 🔧 Changed ui: Shop. previously, it had no tabs, now it has tabs.
- 🔧 Changed ui: Research. previously, it used opaque names, now it uses readable names.

# beta-3 Land Expansion

Buy more land. Rocks and shrubs show up farther out.

- 🎉 Added mechanic: Land expansion. You can buy neighboring land, and owned land is taxed at night.
- ✨ Added item: Rock. It blocks a plot until you mine it.
- ✨ Added item: Pickaxe. It mines rocks.
- ✨ Added item: Berry shrub. Harvest berries, and shovel a ripe shrub to move it.
- 🔧 Changed building: Pumpjack. previously, it upgraded the starter pump, now it is a building you place.

# beta-2 Inventory

A house inventory, and buckets instead of cans.

- ✨ Added mechanic: House inventory. Sixteen slots, and you swap with what you are holding.
- ✨ Added item: Bucket. You start with 3 L, and a larger bucket is in the shop.
- 🚫 Removed item: Watering cans. They are gone.
- 🔧 Changed ui: Shop. previously, it was not a side panel, now it is.
- 🔧 Changed ui: Research. previously, it was not a side panel, now it is.
- 🔧 Changed ui: Market. previously, it was not a side panel, now it is.

# beta-1 First farm

Shovel, plant, water, harvest, sell.

- 🎉 Added mechanic: Farm. Shovel, plant, water, harvest, and sell.
  - House, water pump, shop, research, and market.
- ✨ Added item: Shovel. It tills grass and digs up plants.
- ✨ Added item: Carrot. Quick and forgiving, but the roots fetch almost nothing.
- ✨ Added item: Potato. Drinks less than any other crop and keeps the longest.
- ✨ Added item: Wheat. Slow grain that wants steady water and rich soil.
- ✨ Added item: Tomato. Late to ripen, picky, and bruises fast once picked.
- ✨ Added item: Raspberry. The richest crop and the first to spoil.
