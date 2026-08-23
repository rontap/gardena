
---
THIS FILE IS READ ONLY FOR AGENTS
---
# Establishing prompt (Declaration of Intent)

This is a garden simulator game, similar to alice greenfingers or stardew valley but more focused on factorio-ish automation, expansion and tech-tree like evolution of tools and crops.
Starting context: game starts with a house, a character, shovel, some seeds, water pump and bucket. user selects the tools and clicks on the farm grid and shovels that plot, plants the seed, and it starts to grow.  when this happens, the player character physically moves there and performs the action. the plant has internal thirst that shows up when its low, then bucket needs to be used to water it. eventually it can be harvested. For Beta-1, all plants are taken back to the house and sold immediately for a money. 
First implementaiton version is beta-1
Core gameplay loop:
(shovel -> plant -> water -> harvest) -> buy upgrades to tools and plants -> ...
The game has the following concepts:
- seeds
	- Each type of fruit (corn, maise, rasberry etc) has _rarities_ which define sale value and other characteristics. At start, only common rarity is available.
	- Seeds have a grow time, in seconds, also water use.
	- Fruits have a sale value
	- growing fruits have a maturity time (time it takes to get ready). USually, watering needs to happen 1-2 times before fruit is ripe.
	- If a plant has <33% (not a baked number but config), it starts withering, does not grow, it is indicated that it needs water. At 10% more agressive in-field indication and at 0% plant is withered and dies, need to be showeled again.
	- Disease resistance (not relevant in beta-1)
- utility items
	- box, which when grabbed allows the harvest of multiple of the same fruit (5), large box 15
	- watering can, when filled at pump can water 5 plants. pump is a buyable item. large watering can can hold 10 waterings always filling up to full.
	- ... many more in later versions.
- research. 
	- players character's husband in the house (research button on UI) can research stuff in three categories initially.
		- Plants (more type of plant unlocks, more rare plants being available, small flat increased plant stats per type) (in total, like there should be like 5 single-field crops, each with given strength)
		- utilities unlocks: large box, large watering can, pumpjack, better shovel. these can be bought then in the shop and placed on the playing field, but they are not occupying a grid slot, they are "over" the gamefield. in later versions automations will be here too, fertilizer which increases growth speed and final sale value
		- third is not in beta-3
- shop, accessible via user button
- market, for now flat sell all button

Architecture & style:
- make sure the implementation of plants and stuff like this is highly polimorphic and can be easily affected by individual (like fertilizer) and flat (from research) increases. But also, the 4 apple rarities should not be four different classes, aim to create a very flexible base class for these things and the extends should just be art/ specific things 
- SVG + DOM mostly
- map should be pannable, zoomable, individual plot items should be investigate-able (Debuggable as well), constant mincraft-esque toolbar for main user action.
- Top down pixel-esque style
- Game loop is divided into days, each day roughly 4 minutes (in beta), at the end of the day flat payouts and in the future, flat expenses

# Prior versions
see detailed beta-1 ... beta-6 then v0.1..v0.5
## 0.3 Dirt Overhaul & Fertilizers
Currently, each tile is a single thing, and the dirt underneath has no properties. This makes many things about the game bit unrealistic: for example, poorer dirt is not modelled, fertilizer use cannot be easily added, only seeded soil can be watered, excess water is removed when plant is removed. In this update, each tile of dirt will get its own identity.
Main change: In this update, dirt will own two properties: water and fertilizer. When the player tills hard or very hard soil, the difference is that those will have lower base fertilization.
Instead of RNG based individual soils, create a Perlin noise map where [0,1] represents dirt "goodness", 0 is 0 fertilizer and 1 is completely fertilized. below a threshold, the hard dirt will get generated, and at a very low, very hard dirt. The area around the starting base should get a random, decaying boost, clamping to max 1, the effect tapering out to +0 in r=8, so the whole starting area gets a bit of buff. 
When a seed is planted, the plant's water is "tied" to the water in the soil, so that logic, both drinking and giving more water is moved to the soil logic. 
New "plants": weed (not 420) and grass. 
- Weed grows in tilled lands that do not have any seed in it. They have a random chance to appear, checked every "big" ui tick, idk how it is implemented but there shouild be a secondary tick done only less often, like 10 seconds or so. There is a 5% chance that it appears on tilled land. Weed will grow fast, draining fertilizer and water. create SVG sprites for two types of weed
- Fertilizer use for now is uniform across all plants. Apple trees and bushes still do not use either. 
- Each big ui tick, there is a chance that a new grass will show up somewhere. Conditions: no item or building or tilled land or very hard dirt. grass grows immediately and is kind of a visual thing only for now, has 3 variants. This chance is owned by the state update, not ticked by each individual empty field. Same for weed growth, for optimization reasons.
Fertilizer bag (5L) 6$ can be bought once researched, one full plot fill uses max 1L, but since it has an an internal buffer, only the required amount is used (ie. if the fertilizer level is 70%, only 0.3L will be used).
For now, fertilizer does not affect plant health and anything. Focus on the water change going smoothly.
Now instead of starting with fixed water level for plants, the starting water level is taken from what is in the soil. When watering, still add up to 1L of water.
## 0.4 Plant happiness, rotting and composting
This update aims to introduce additional depth to the game by overhauling plant happiness UI and introducing new mechanics. 
Happiness: Each plant already has a water level need, which influences happiness, which influences only the rarity drop chance. Now in this update, more stuff is introduced to influence the plant's happiness. 
Obviously, fertilizer need is one. For now, each plant will have a single value determining its fertilizer need, which it sucks up slowly from the dirt. There are three stages: fully fertilized (green), mediocre (orange), starving (red). When fully fertilized, plant is gaining bits of happiness, orange stays the same and red happiness is decreasing. there is one value `fertilizer_tolerance` that governs this. at 1, the full range is green. at 0.33, third is green, third is red and middle third is orange. Basic starter plants have very high tolerance, and this goes down as type is increased, and as rarity is increased (programmatically). But numbers should be crafted such that it never is <0.25.
Fertilizer use is constant and slow: for now, set 3 days of full growth as the full exaustion from fully fertilized land to zero. The player initialyl should not really be concerned with this. Underfertilized plants have stunted growth by 33%.
New mechanic: overwatering. This is introduced to make the automatic irrigation not a complete solve of the game. Each plant has in addition to water need, water tolerance. 1L is the midpoint, shown on the UI from 0L to 2L. All plants are happy at 1L. `water_tolerance` works similarly to fertzilizer tolerance, but here it goes two ways. So 1 tolerance value means plant will be happy in whatever case. This water tolerance replaces the existing 0.33 (?) fixed threshold for wilting. Similar 3-band red orange green, extending both directions. Wilting (in the red) is still decreasing happiness and stunts growth by 33%.  Overwatering is much more seriously affecting the plant's happiness (same level of stunted growth of 33%). If a plant's happines reaches zero, it dies. Balance this in a way such that it is not super punishing, but if the plant is at 2L (so max) water level, it should die before producing a plant. Multiple things can cause the plant's death, the cause is recorded as the last thing that made it so the plant is dead (since multiple negative things can be affecting the plant at once).
- if it is overwatering (or the player did not harvest it in time), it becomes rotten {fruit}, new icon for each _class_ of fruit, not per fruit. 
- if its underwatering or no fertilizer, it becomes dead {plant}, same SVG logic. 
These items are not completely useless, although they have no sell value. A new building, compost box (1×1) can slowly turn these things into compost, which is a similar item to fertilizer, 3L. Compost can accept any organic material, each material has a calculated compost value. 10 units are needed to create one compost. seeds universally are 1, fruits universally are 5, heirloom is 20, grass is 1, weed is 1, rotten fruit is 2, dead plant is also 1. The compost box has infinite internal storage, when items are dropped (no ui), it converts it into compost units immediately. Once it has 10, it starts producing slowly new compost. compost, an item, is dropped on the ground in front of the compost station, and can be used as fertilizer. Composting is not very fast, takes like 0.5 day. Progress bar is shown on the building.
Freshness stops stopping at harvest: a picked item keeps decaying at its `rotSeconds` rate until sold at market, not just while it sits ripe on the plant.
When writing tests, check if the rarity upgrade mechanic is working as intended with the interplay of watering / fertilizer mechanic. If the player is taking good care of the plants, fruits should slowly upgrade over time.
New item: synthetic fertilizer. It is bigger than regular fertilizer with 8L and costs 5$. If used on soil, the soil will have property `is_bio:false`, and the fruits will have object property `is_bio:false` (not used or displayed anywhere) too. This property is removed when new fertilizer is added, but to prevent cheesing, only is removed when at least 30% of fertilizer is added. If the plant is already non-bio, it will not change it back.

## 0.5 Automation update II.
With the introduction of the last update, sprinklers now can be actively overwatering plants to a detrement. Therefore we update the sprinkling system with new features and items.
First: water sources should have, when the pipes lense turned on, have a × shaped pipe (actually 45 deg) and water source icon in the middle. It should be intuitive to the user, that if any of the edges are reached by the pipe, it will connect to that. Also fix a but here where now pipe is only filled if it is on a two edges of a water source, and not when it is only on one point. Sprinklers now all dispense only 2.5L/water/tile. Tomato, wheat and raspberry now use +0.3L/day, but watermelon uses -0.5L/day.
New buildings and mechanics:
- Manual Valve. This object, also placed on the edges of tiles, can open or close a valve. User can trigger change by clicking on it, (player moves there), and the valve is SVG-designed in a way such that it is either blue or red (off). Sprlinklers have no VFX when they have no water. If the pipe is connected in another way such that is can flow threough there, water should still reach it. 
- Tied to a research, called smart sprinklers, adds a clickable popup hud to sprinklers (not as a new building). When clicked, the list of all plants are shown in a vertical grid, showing water use. When the user clicks a plant, the sprinkler will adjust water output such that it only sprinklers as much water as the plants actually need. Note, that if the plant was under or overwatered, that will remain so. The clickable HUD of items will become a _common_ think, it should be done in a prorammattic and expandable way.
- When the player manually waters a plant, it plants up to 1L + `max plant comfortable water use` . So if the plant is already overwatered, no water is being added, whereas if the plant is wilting, more than 1L could be added. 
- Rainwater tank. 2×1 building, 20$, slowly (0.4/L) gathers water and has internal storage of 100L. All water producers have internal water storage. pump has 50L and well has 150L.
	- Design consideration: when there are multiple producers and multiple consumers in a network, it should clearly work. It is not important if it is pooled together, or only one is used at all. But if +10L/s is being produced, sprinklers should be able to use all 10L
	- Track water draw per producer individually (pump, well, rainwater tank, csap). Needed for pump-only water costs later.
	- Design consideration: like most other things, there could be global effects affecting water production _per type_ 
- "Csap". It is an acces point for water without having to place an expensive pump or well. 10$, needs to be connected to the water grid to function. Can fill water buckets quickly (5L/s)
	- Keep in mind, that a pumpjack alone cannot provide this mnuch water. But since it has an internal buffer, that can be used to provide that. Buf it that is empty, then fill speed should still just be 2.5L/s!

## 0.6 Family Update
The game mechanics of research-farming-market is done by personifying the three aspects as the player (you, female), your husband (research) and you daughter, who is at the market. 
Add a new main button to the left called "Family", which opens an almost full screen view.  It is a grid view, 3 vertical panels for the three characters, with high-quality detailed pixel art SVG for each of them. In the future, they will be able to earn _skills_ by gaining XP through various mechanics, but for now, implement only the skill points's system, each day one of them gets one skill point. "unlock all" gives all three of them 99. 
Each of them have seperate skills, with 3 random showing up based on the seed, and when one is selected, all three are rerolled. There are tiered skills, implemented such that if idk "gardening" gets rolled, but user has gardening II already, then the skill will be gardening III. These skills have modifiers that are wide-reaching and extremely useful. Each skill has an icon, and existing skills are shown as icons with hover-on showing name and effect. Icons are already implemented. The better {fruit} icons require composing the grown base fruit + icon In the selectable skills, same is true but name is also displayed on the button. LEvel is also displayed. Skills can be gated behind research unlocks, or skill unlocks.
Player skills (gardening-focused)
- Boots (I-V) 5% walking speed increase (non-comulative)
- Machinery (I-III) 5% machine use speed (non-comulative), machines are all pipe related and seed grinder.
- Careful tending. Unlocks an action with growing plants "tend", that can be done one time and provides a 10% boost to happiness.
Research skills (research focused)
- Speedy research (I-III) 5% research _speed_ increase.
- Tool contracts (I-III) utilities become 1$ cheaper. Min price is 1$
- Machine contracts (I-III) automation tools become 1$ cheaper. Min price is 1$
- Weather forecast [dummy]
- Smart tax returns (I-III) lowers taxes by 2%. Min tax is 1$
- {water,land quality} study, allows water level and land quality (fertilizer status) lenses.
- bulk buying. when buying seeds, press control to buy 5× as much (5->25) with 5% discount
For now, market mechanics are not that detailed, but the "better XY" crops research are moved to here as skills.
- saleswoman (I-III) fruits sell for 2% more
- "őstermelő" (I-III) heirloom fruits sell for 5% more.
- better {fruit}, for each fruit, a one time 4% income increase in income, replaces the research options.
- bio farmer (I-V) fruits that are `is_bio:true` have 3% higher sale value.
- industrial farmer [dummy] (I-V)
- At the start of the game, the market is actually not open (sale cannot be made) during the late afternoon and twilight stages of the game. (sell button becomes disabled with reason shown in text). "Open late" skill allows market to be open later, and when that is unlocked, -> "open 24/7" makes the market open during twilight too. This is a gameplay change too.
- "Still good for jam" (I-V) caps maximum reduction by fruit being  partially rotten to -90% / .. / -50%
- "Clearence sale" allows selling rotten fruits for 1$, regardless of type.
When there are no skills left, or not enough to fill all three, only those are generated.
## 0.7 VFX & UI update and Docs ordering

A few (for now) mostly cosmetic items are to be added. They are all placed similarly to tiles, i.e. when the user starts placing it, they enter the "place many of this" mode and they can click and build as much as they want to. Theese items alre already mostly implemented - finish up work
- Wooden Fence (10$) can be built on untilled soil and links up to fences the same way a pipe does, but the fence is in the middle of a tile, not inbetween files.
- Tiles (Cobblestone, Brick, Paved) 5 / 7 / 11. They later will affect walking speed, but are not doing anything besides visuals now. 
- Grass seeds - 1$, unlocked by "**landscape architecture**" research, allows planting of grass seeds, use very little water and mature quite quickly (1/4 day), do not have rarity. Once a grass is fully grown, the tilled land becomes untilled again.
- Rotary shovel - research gated behind digging 200 times (research time 120sec), cost 1000$, 0.2s shovel time, 1k uses
- Diamond pickaxe - research gated behind pickaxing 150 times (research time 120sec), cost 1000$, 0.4s pickaxe time, 1k uses


## 0.8 Plants expansion & Trees Rework

Done. Olive, grape, vanilla, sugar cane. Raspberry hidden behind grape. Vanilla behind raspberry. Sugar cane behind Fermentation (automation); ripe cane is fruit, mill for sugar. Trees: apple apricot lemon cherry. Species-only, auto-drop, juvenile once, yield windows. Starter saplings apricot/lemon/cherry. Wild berry/shrub removed. See [[mechanics/plants]].

## 0.8b Stable game log state and perf improvements
The goal of this update is to log actions in a way such that later tools can use it to unlock things.
Most actions should be logged in a global dump-state, such as number of sold items per type×rarity, number of gold earned and spent. It should be almost like an action log. The tutorial engine attaches to this and every N ticks it checks for the step being complete.
Uses:
- Hiding more stuff from the user: unless the user has ever harvested a fruit of type X that is rare or specialty, it is shown as ???, and when clicking on it, the tab instead shows "You have not encountered this rare variant". This unlock check happens only when user opens almanac, with something like gamedump.filter( type harvest)
- Achievements, for now just an empty stub.
Now the game gets sluggish very fast. Mostly due to unnecesary react state updates and rerendering so many things. A few minutes of gameplay and we hit like 20FPS with lag spikes. Disptach agents to check out a RCA and fix the most pressing issues. 
## 0.9 Early Access 1 - playable complete game

Spec: [[plans/early-access-1]] (1.0 Early Access 1). Implement from that note.

# 0.10 Early Access 2 - Plant diseases

Design notes and critique: [[plans/early-access-2]]. The draft below is the original intent; several of its numbers and its spread clock are superseded there. Do not implement from this section alone.

Add a debug left menu which will be populated with trigger actions that force certain events to appear. only shows when unlock all instantly is pressed.
This update will add plant diseases and ways to fight that. Plants can now be afflicted with disease and spread it to other plants. 
There are three common diseases that are common to all plants: Powdery Mildew, Anthracnose and Gray Mold. These are shown as statuses on the plant and have several negative effects.
- Mildew reduces growth speed by 20% and makes the plant less happy overall.
- Anthracnose reduces growth speed by 20% and makes the plant less happy overall.
- Gray Mold reduces growth speed by 10% makes the plant somewhat less happy and when the fruit is ripe, it starts at -20% freshness.
Plants can be affected by multiple diseases at the same time, effects are additive. An SVG effect is placed on the soil to somehow indicate infection. Infection lens is also added "Healthy" / "Unhealthy".
 spreading with normal disease can happen to any nearby plant at set intervals of the plant's growth (25/50/75/100). At each section, there is a 33% chance that the plant will affect nearby (3×3 grid centered on plant) plants, rolled for each plant that is not yet infected with that disease. In addition, each fruit has its own, much rarer and much deadlier version, which can only be spread between species. These have 50% infection chances. Reduce growth speed by 33%, starts at freshness -25%, plant is much less happy, and at spreading stages (25/50/75/100) theres is a 10% chance the plant just immediately dies.
 All plants have some disease immunity. The final roll for getting infected is chance = (1-immunity) × infection chance from incoming plant. common fruits have 15% immunity, uncommon 10%, rare 5% and heirloom has 0%. 
 Infections can occur randomly (very rare - 0.1% of a plant getting randomly infected at a checkpoint), and some seed may have disease (also rare, 1%). The first 20 seeds the players buy have 0% chance to be infected. When a disease has been rolled, the three versions (3 common or one dangerous) is equal in weight.
 Infections can be fought with three ways, after "disease management" research is done, which unlocks when the user first plants 20 seeds. 
 - pesticide 70$ - 40 uses, `is_bio:false`, immediately kills all germs, adds to that individual plant +15% immunity.
 - bio pesticide 80$ - 30 uses `is_bio:true` immediately kills all germs, adds to that indidvidual plant +20% immunity.
 - antifungal extract 15$ - 20 uses does not treat infection but adds +30% immunity and completely prevents Gray Mold's effect, most likely best to add flag `immunized:["Gray Mold"], extra_immunity:0.25`
Disease resitance is added to almanac.
New research skill: disease resistance (I-III) adds flat 5% disease resistance for all plants-> then unlocked heirloom genetic resistance adds 10% resistance to heirlooms.
High level, The player has the following mental model and decision points:
- If I use cheap crops and they start getting infected, it may not even be worth it to use pesticide because it cuts into my profits. 
- If I use expensive crops or heirloom crops, they are much more expensive but also more sucaptable, i need to be very quick to prevent an outbreak. 
- I can invest some time to add antifungal extract that will slow down outbreaks and lower the effective chance of an outbreak, but cuts permanently into my profiuts
- pesticide is kind of cheap, but makes my fruits non bio and i may be getting big dividends on that. 
In addition, at the checkpoints (25..100) there is an additional roll for emerging disease:
- 0.5% for gray mold if the plant is in the red overwatered zone. 
- not implemented yet, but if it is [raining] , 0.5% for Anthracnose.
- not implemented yet, but if it is [hot], 0.5% for Mildew
Wild berry and apple tree are not affected

# 0.11 Early Access 3 Plants expansion & Trees Rework

Shipped as 0.8.
In this cute update, a few new plants are gonna be added.
- Olives
- Grapes
- Corn
- Vanilla
- Sugar cane
These are all researchable. Rasberry is hidden as a research item behind grapes. 
Sugar cane is water hungry and seels poorly, but is useful as an additive for later stuff.
Vanilla is the new princess on the block, seeds very expensive, growth time slow, low disease resistance and icky about fertilizer and water levels, unlocked after raspberry. At common, it is not even outcompeting in terms of price other stuff, but rare and heirloom have an increased rarity price multiplier. Also they have potato-levels of freshness.
And tree - like stuff:
- Apricot
- Lemon
- Cherry
The tree system is now somewhat bolted-on on the main system. Make is significantly more robust. Apples, Lemons and cherries automatically drop on the ground at 100% freshness. Add growing stage to all trees ( only once), but decease the time it takes for them to produce fruits. In general, apple is the fresh most long >lemon > apricot > cherry, while time it takes to mature is similar, with $ apple > apricot > lemon > cherry. total $/sec is apricot > lemon = cherry > apple. Here the fecund is apricot, producing a lot of cherries at low individual costs. Trees have "yielding days" once matured, the first starts the day after they are mature. During the yielding days (2) the production is 3×, then it is 0.75×, and the chance to start yielding is decided on the next day. After yielding time is over, the chance is -20%, and each day 20% is added.
The three common germs now can affect trees, but come up with a more stable way of infection ticking because the growth rate is not good for that since they have active phases. 
To prevent the user from permanently giving the plant 100% disease resistance, disease resistance drops by 10% each day. Trees also have the same rarity-specific disease resistance. 
In general gameplay wise, trees are intended as low-effort, low maintenance but low relative yield option, with limited ways to plant them.
In terms of planting trees, in the future tree seeds will be obtainably in special ways, for now they can be used in the seed grinder and give the user one apricot-lemon-cherry-apple seed in the house inventory. 

# 0.12 Early Access 4 Machines Machines Machines

Shipped. Running spec: [[mechanics/machines]]. Roadmap below is original intent, not rules. Whisky cancelled.

This update focuses on adding a lot of machines to the game to create secondary products that are better in some ways and in the future can be used as consumable goods. First, to make the tools desirable, the freshness mechanism should be changed such that rotting continues once picked, until it is dropped off at the market. 
Pot still:
- potatoes, wheat and apricot can be used to make spirits. It has a similar working to the compost, the user fills it up with stuff and then the production beings, but here the capacity == max, so no overload. The type of spirit produced depends on the input fruits (Vodka, Beer, Brandy). If there are more than one type is mixed in, it will produce mixed spirit which is cheaper. The spirits have rarities too, averaged from the rarities of the fruits, so if i mix common and uncommon 50%-50%, its rarity will be 1.5, and at finish random decides where to clamp to. Rot does not decrease quality (very realistic). In general, it should be worth it marginally to do pot stilling, but not to heirlooms and not to produce mixed spirit. Pot still needs to be connected to water system and uses 0.1L to produce the mix.
barrels:
- grapes can be turned into wine. A wine barrel holds less fruits than a pot still does. It takes 1 day to mature, has similar rarity decision. A wine can be aged for a further three days, and depending on rarity, the sell price will increase by 1.5× / 2 / 2.5 / 3. 
- ~~beer can be turned into whisky. It takes 2 days to mature and can be aged for a further of five days, and depending the rarity, the sell price will increase by 3 / 4 / 5 / 6. A full batch of rare heirloom potatoes turned to whisky and aged so long should be very rewarding financially, so make sure the numbers add up to a positive EV compared to just spamming carrots.~~ **Cancelled.** No whisky. Barrel is grapes → wine only. 
Jam machine:
- Very useful for upcoming updates (where price of fruits may fluctuate).
- apricot, grape, raspberry, apple and cherry can be turned into respective Jam, tomato into ketchup (just icon and price difference). Jam machine is quite quick and does not care about rottenness OR quality, good mid-game item for preserving stuff. 
- Items cannot be mixed.
- Jam machine has an internal buffer of sugar that needs to be filled and uses it to create jam.
- When this machine is unlocked, in the almanac, in the repective fruit section, a third icon is shown, with the jam.
Refiner mill:
- will crush items down (and should show what the item will be crushed into)
- is researchable item in automation, like pot still and jam machine (jam machine is dependent on this item, and this item is available from the start)
- sugar cane 5× -> sugar (2L)
- olive 5× -> olive oil (1 item)
- wheat 5× -> flour (1 item)
- grass 15× -> antifungal extract (unlocked by research gated behind disease management)
Freezer:
- fruits (in boxes or individually) do not rot at all. 6 slots.
Sugar is also unlocked as a buyable item when jam is unlocked, it should be priced in a way such that sugar cane is overall a cheaper way to produce it. 

# 0.13 Early Access 5 Weather patterns.
Weather is added to the game. A weather indicator is shown, and if the appropriate skill is shown, next day's weather is shown. The current "no weather" is still gonna be the default weather state in the game. Two new main weathers are introduced, rainy days and dry days. They have bunch of overarching effects that slightly modify the gameplay.
water use now costs money. Water use of the PUMP only costs money. Not very significant, but enough to balance out some of the fecund but cheap stuff. For example, running watermelons from pump is less efficient.
Rainy days:
- Each tilled field gets a slight extra water input. This value should be set such that plants do not just die of overwatering, but in particularly picky plants, it can cause some issues. But having set up an irrigation system that just keeps on going should cause problems - gameplay goal is to make the user realises that the situation can turn bad if they do not act.
- weeds and grass are 2× likely to appear.
- rainwater tank has 6× yield.
- see relevant infection notes.
Dry days:
- each tilled field has every N ticks a small amount of water substracted due to evaporation, over the whole day it should be like 0.2L, large enough to cause some trouble but nothing catastrophic.
- weeds do not appear, new grass does not grow.
- rainwater tank has no yield.
- see relevant infections.
- pump water use cost is increased by 50%
Game starts in normal weather and each day there is an increasing chance that a rainy or dry day will occur. Starts at -40%, +20% each subsequent day (first three days are dry). Then, if special day is rolled, then dry/rainy will be rolled with 50-50 chance. In a special day, there is a 50% chance that it will continue the next day, lowering by 10%, and a 20% chance for severe weather. If normal day is rolled, we go back to -20% to roll a special day. 
Severe weather can be either flood or drought. Severe weather lasts one day and next day we are back to -40% to roll a special day and a normal day.
Flood:
- each tilled plot gets lot of water input. plants may die from too much water.
- rainwater tank has 12× yield.
- market is closed in the morning and shop prices are double due to flooding conditions.
Drought:
- each tilled plot loses 0.4L water a day.
- rainwater tank has no yield and well has only 50% yield. pump is unaffected in terms of yield, but pump water use cost is increased by 200%.
- market is closed midday and shop prices are double due to panic.

Since this is PRNG seeded (its own seed lineage obviously), the whole chain of days up to like day 99 can be done after startup, to allow weather predcitions to happen. Add debug options to change weather for next day.

# 0.14 Early Access 6 - Automation III.
Sensors are added to the game. Sensors are 1×1 buildings that can read data from  places and send them to others through wires. Sensors may have inputs and/or outputs. all wires are one-way, strictly from output to input, strictly binary. Many of them have single pop-up huds that do not require the user to walk there. If there is a single input/output, they are on top (I) and bottom (O). If there are two inputs, they are on the side visually. Circular loops cannot be made.
Most are research at bulk with the research "Sensors", when researched, a new main option tab "Sensors" is shown, where most of these are 
Basic sensor providing user IO:
- Lever->: interactable object, when clicked by player, turns to other state and is replaced with active version, emitting output signal.
- Button->: interactrable, clickable same way but emits a pulse only.
- ->Lamp: lights up if receives signal.
- -> -> OR ->: signal with two inputs (one on the left side, one on the right), output (lower end), trivial how it works.
- -> -> AND ->: trivial again
- -> NOT ->: trivial
Specific sensors: these interact with various game mechanics to allow for automation.
- Germ sensor: sends signal if detects germs in the area. Area can be set to be 2×2 ... 4×4
- Water sensor: sends signal if any plant is being underwatered in the area. Has a checkbox to select send signal if : "wilting" andor"overwatered"
- Fertilizer sensor: trivial
- Water system sensor: sends out a signal when the connected system does not have enough water to satisfy needs
- Weather sensor: can be configured to send signal (checkbox) for any of the five types of weather.
- Harvest ready sensor: sends out signal if any OR all (hud configurable) plants in range are ready to be harvested.
When in the sensor lens, clicking the cell with a sensor that has only outputs will start drawing a wire from (lower end of sensor, cursor), and the wire is finalised if it is clicked on a valid input (either full cell for one input, or left or right size of input). This can easily done with SVG beziér curves. if a wire is active, it changes color from red to blue. Wires are only visible in the Sensors tab. Wires are free, do not cost maintenance.
Research-wise, many sensors are dual-requirement locked. The basic sensors unlock with Sensors research, But for example germ sensor requires the the related germ-y research to be done as well, but it does not have its own research. Same for others.
objects and research, locked behind "advanced signalling", requiring advanced irrigation:
- Smart sprinkler: receives a signal to turn on/off. Also it has a hud with 5×5 grid (center is sprinkler) where each grid can be turned off or on, and the sprinkler will only sprinkle those specific cells. Good to prevent overlaps from accedentally happening. 
- Smart valve: works same as normal valve, but user cannot manually set its state, instead it is set from input
- Vehicle detector: sends signal if the vehicle is on the cell. [dummy for now]
All sensors have a switch cooldown of a few ticks to prevent resource-heavy loops of plant wilts -> sprinkler turns on -> plant wilts ...

# 0.15 Early Access 7  - Vehicles I.
Vehicles will be added to the game, an extensive and modular system, just like real life they will represent the ultimate mechanized farming. This is a demanding update and is split into two parts.
In general, all vehicles have a speed, acceleration and turning radious. The player can sit inside them and then navigate with WASD, a lower HUD mimicking the car dashboard is SVG-ified there and is actively changing dpeending on what is happening. 
The first, flagship vehicle is the Quad. It only serves as a baseline vehicle, nothing can be attached,
The "Vehicles" research allows the buying of vehicle hangar, a large 3×2 building that will contain all future vehicles. Vehicles are then bought, managed and assembled in the hangar. When the user clicks it, a large and modular HUD shows up, where new vehicles and components can be bought and assembled for deployment. With the quad, once it is bought, and selected, "Deploy" button closes dialog and user is inside the vehicle now, allowing it to quickly traverse the map. No collision model for object, for now. 
Vehicle can be returned by going to the door of the vehicle hangar, which is shown with an arrow on the fields below the hangar, only active when player is in a vehicle. The player can dismount the vehicle by clicking somewhere, at which point the vehicle will slow down to 0, then the walk there is done. If the player wants to drive again the vehicle, they click it. The vehicle has a HUD, with 6 slots for storing items and a button "embark". It also has gauges, in general potentially multiple, but in this case its only one, the fuel gauge. 
In the vehicle bay, there is a button for refill all vehicles ($ ) shown. Re-use HUD baseline from seed silo.
Max vehicle speed depends on the exact surface the vehicle is running on. Slowest is tilled soil and rock and objects (0.5× max), fastest is paved road (1.2×) max. Max speed transition is set, so coming off high speed from paved road to rock will take some time to slow vehicle down.
The VFX and SVG here is important, the vehicle physically turns (top down view always).
Multiplayer: one person per vehicle. All players can drive vehicles.
# 0.16 Early Access 8 - Vehicles II.
A new vehicle type is added, Tractor. A tractor can have trailers, and is by default slower than Quad. 
There are 3 different kinds trailers, and each has a respective building where it can interact with it.
- Seeding trailer. Two variants, 2×1 and 5×1.  When attached and driven straight over an area, any tilled empty fields where the wide seeding trailer is touching the soil, it will plant it. seeding trailer can only have one type of fruit in it. 
	- Building: seed silo 3 tall 2 wide. When opened it, provides a similar interface to the shop/seed store, excewpt here you can set amounts for each seed to buy, and which one to send to the trailer. When the trailer is at the interface point (exactly same mechanism as the return to garage), the trailer's inventory is merged withe the silo's. So if there is unused seed from a seeding round, it can be returned, and switched for something else with a single button. (clicking "raspberry" if there is already raspberry stored there will replace existing wheat seed).
- Spraying trailer. same two variants, 2×1 and 5×1. When attached, it can dispense fertilizer, pesticide, and antifungal extract. 
	- Building: spraying silo Similar UI to seed silo, but remember that there are two types of fertilizers, and two types of pesticides. 
- Harvesting trailer. same two variants. When attached, it harvests all (!) planted fruits, regardless if it was ripe or not. it can hold different kinds of produce. 
	- Building: produce silo, drops off everything into a 5 × 5 grid, seeds separated by rarity. 
In the vehicle hangar, the player may have one of each thing bought. Deploying it is basically selecting the vehicle itself (icons of them), then, if the vehicle allows for trailers, selecting a trailer. A trailer is a permanent object, whether it is stored ephemerally inside the vehicle hangar or driven attached to a tractor, the inventory of it is kept. 
The player may have multiple hangars, multiple silos or multiple trailers, but can only drive at most one truck that has one attached trailer to it.


# 0.9 Global state notes
This is a significant, internal refactor. To the player, there should be no visible changes. This is an enabler task.
There should be a worker that receives all game state (not react state) updates and tracks them. Since the player is mostly interacting with one button, and has literally one action available per click, it should be pretty simple. logs in JSON, rough draft if sth like
`[{game_tick:x, coordinates:[x,y], ...}` most likely, for brevity's sake keys should be one lettered.
Of course there are specialty interactions, such as buying stuff, researching stuff and interacting with inventories. But other than that, given `state(tick=10) -> state(tick=N)` can be predicted, everything is deterministically random.
This should be verified, there is PRNG but it was not focused on that. PRNG should be seeded, and then sub-prng generators be seeded for that. Each seperate large mechanic (does plant upgrade, is shop bought thing rarer, etc) should have its own seeder. This should make the game less prone to stupid out-of-order issues.
The worker receives everything async, of course. Related to this, in react setStates and useEffects, only strictly state updates should be set or hooking to other components. I.e. a strong decoupling of game logic and rendering logic is needed. For example, as a plant is drinking water, it is not needed to log each time it sips. Debatable whether rotting should be noted. But it is very calculable from starting conditions + prng + time.
This ticket is very complex and will be foundational for the 1.0 release. It will be used in these major ways. These are NOT part of this update, but they are the reason why this update is performed:
- This makes regression testing and use-case testing mega simple. With e2e testing as well, but if it is added such that the actions can be played, not just recorded, the whole game can be automated.
- This makes it possible for grok agents, who coded the whole damn thing, to play the game. Couple of interfaces added so they can check stuff like current location or money or whatever, and bumm, grok heavy credits amount of playtesting.
- This makes building up a game state from the individual actions. This allows saving the game and then loading it back in. Also allows for visual replays like in prison architect
- This makes achievements super easy to implement, like "did you plant 10 apple trees" is basically two filters.
- A secret fifth thing is enabled by this. can you guess what? ;) 


# [draft] 1.next: Eletricity
In this update, electricity is added. Electricity has simlar systems to water, same general system of producers with internal buffer-buffers-pipes-consumers. The whole network is run on and is updated only on N ticks, not on normal ticks to save compute.
The way the piping system works, should be refactored out to a ~delivery system generic, which is implemented by Power and Water systems seperately.
Producers:
- Windmill 2.5 tall 0.75 wide, classical western style. internal storage of 0, 30$, produces 2Unit (U) of energy every big tick.
- Generator 2×2, dark machine like, with electricity symbol on it. 250$, produces 25U of energy.
Storage:
- Battery: 1×1, can store up to 250U energy.
Transmission & shutoff: Transmission speed is instant, transmission width of pipes is not a conceren.
- Underground power line, similarly works to pipes, but different design. 
- Power switch: trivial.
Consumers: each consumer has a 2×(power drain) internal buffer.
- Pot still needs power input, uses 6U of energy while its on.
- Mill uses 2U of energy while its on.
- Jam machine uses 3U of energy while its on.
- Freezer uses 1U if there is at least one item in it.
Rest of items (seed grinder, compost box, etc) remain unpowered.

 
