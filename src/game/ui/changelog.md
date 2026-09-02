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

# 1.9.0 Automated Dispatch I

Quad and tractor can run a shared loop of stops. A traffic light holds a truck only when that light is on the list.

- 🎉 Added mechanic: Automated dispatch. A Quad or tractor follows a shared stop list in a loop, and editing the list updates every vehicle on it.
  - Click the map for a go-to, a load pad, an unload pad, or a traffic light.
  - Automate on the dash opens the list while you drive. Start sends the vehicle off. Hangar Automate deploys it and starts from the first stop.
  - Getting in pauses the route. Start again resumes from the next stop.
  - An empty tank stops dead until you refill. Automated vehicles are slower and brake harder.
  - Load and unload only at a standstill, then a short pause.
- ✨ Added item: Traffic light. A truck waits here only if this light is a stop, until the input is green, and the output is on while one waits.
- ✨ Added ui: Automate. It opens the stop list from the dash, paints the purple path with numbered dots, and names Add stop, load, unload, or wait under the cursor.

# 1.8.3 Side chests

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

# 1.7 Sight lines

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
