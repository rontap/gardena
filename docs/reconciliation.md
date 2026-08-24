# Reconciliation

The game is not out. Nobody is playing an old build. This file is only the places where **the running game**, **your writeup**, and **the old notes** disagree on something that is already in the game. Tick one box per question. Unticked = leave the game as it runs.

Not in here, on purpose:

- How to folder the docs (you already said: items, mechanics, aims, coding/testing standards — not per version).
- Diseases, weather. Those are not in the game. They will not be written into the working docs.
- Family / skills are in. [[mechanics/family]].
- Machines are in. [[mechanics/machines]].
- Vehicles I is in. Vehicles II is in. [[mechanics/vehicles]].
- Sensors / Automation III is in. [[mechanics/sensors]] [[items/sensors]] [[ui/sensors]] [[art/sensors]].
- Renaming buckets back to watering cans, or selling at the house door. The game has buckets and the market truck.

---

## 1. Crop numbers

An older notes file still lists one table. The game (and the tests) use another. Pack prices in the shop are the same in both. Grow time, drink, sale, and how long a ripe plant lasts are not.

Day = 4 minutes.

| | grow (days) old → game | drink (L/day) old → game | sale $ old → game | ripe-until-rotten (days) old → game |
|---|---|---|---|---|
| Carrot | 0.43 → 0.38 | 1.17 → 1.17 | 4 → **3** | 2.00 → 1.75 |
| Potato | 0.77 → 0.50 | 0.90 → 0.90 | 8 → **6** | 2.00 → **2.50** |
| Wheat | 1.15 → 0.75 | 0.80 → **1.10** | 14 → **12** | 2.00 → 1.75 |
| Tomato | 1.44 → 1.17 | 0.75 → **1.05** | 18 → **20** | 1.25 → 1.25 |
| Watermelon | 1.44 → 1.08 | 3.20 → **2.70** | 19 → **20** | 1.50 → 1.50 |
| Raspberry | 1.73 → 1.42 | 0.80 → **1.10** | 24 → **26** | 0.66 → 0.67 |

Seed $ and pack $ did not change (1/3, 2/6, 2/10, 3/15, 4/18, 4/22).

If the rewrite copies the game, carrots and potatoes are worse to sell, tomato/raspberry/watermelon a bit better, everything finishes faster, wheat/tomato/raspberry drink more, watermelon drinks less. If you still wanted the old table, the game has been quietly rebalanced and the rewrite would freeze the wrong one.

- [x] Keep the **game** table. Old notes were leftover.
- [ ] Put the **old** table back in the game.
- [ ] Keep the game table except I will write a different one under this question.

---

## 2. Weeds and fertilizer use

Your writeup: every 10 seconds, each empty tilled plot has a **5%** chance to sprout a weed. A growing plant empties a full fertilizer plot in **3 days**.

What the game does: **3.5%** weed chance, and both plants and weeds burn fertilizer at **60%** of that (a plant takes **5 days** to empty a plot). Bags last longer. Fallow land weeds less.

Someone wrote that retune in a stray note and never changed the writeup. Early game is gentler than you specified.

- [x] Keep **3.5%** weeds and the slower fertilizer drain.
- [ ] Restore **5%** weeds and 3-day drain.

---

## 3. Fruit boxes

Your writeup: small box holds **5**, large holds **15**.

The game: small **5**, large **14**. You cannot quite triple a small box.

Shop: small box **$6**, large **$18**. An older note had large at **$12**.

Research **Fruit boxes** ($17, 50s) unlocks **both**. You cannot buy the small box until that research is done. The older notes said that research unlocked the large box only (small box already available).

This is the harvest-without-walking-back economy. 14 vs 15 is small; gating the small box behind research is not.

### Capacity

- [x] Large box holds **14**.
- [ ] Large box holds **15**.

### Large box price

- [x] **$18**.
- [ ] **$12**.

### When you can buy them

- [ ] One research unlocks **both** boxes (as now).
- [x] Small box is in the shop from the start. Research unlocks the large box only.

---

## 4. Building tiles

Paved / brick / cobble are already in a shop tab, **$1** each, stay selected so you can stamp many. They do not change walk speed. They replace grass (or an existing tile) and keep the dirt type underneath.

Your writeup priced them **$5 / $7 / $11** for when they later affect walking. $1 is either “they’re paint, so cheap” or a placeholder that leaked into the shop.

- [ ] **$1 / $1 / $1**. Cosmetic, cheap.
- [x] **$5 / $7 / $11** even while they do nothing to speed.
- [ ] Pull them from the shop until they actually do something. (They stay in the files; they just would not be sold.)

---

## 5. Fertilizer bag at the start

Your writeup: research fertilizer, then buy the 5 L bag for $6.

The game: the **ordinary bag is in the shop on day 1** ($6, no research). The research named Fertilizer ($9, 40s) unlocks **synthetic** fertilizer (8 L, $5, marks the soil non-organic). Composting research still sits behind Fertilizer.

Day-1 plots can be topped up before you have ever opened Research. That is a different early game than “water only until you research feed.”

- [x] Ordinary bag is **always** in the shop. Fertilizer research = synthetic. (As now.)
- [ ] Ordinary bag requires the Fertilizer research. Synthetic gets its own later research.

---

## 6. What you start holding

Your writeup: shovel, some seeds, pump, bucket.

The game also puts in the house inventory:

- 5 common carrot
- **2 rare carrot**
- **2 rare tomato**
- **2 heirloom potato**

Bucket is on the ground at the door. Money $50. The rare/heirloom stacks are never mentioned in the writeup. They look like a debug gift. A new run can plant high-tier crops before the shop exists.

- [x] Keep that loadout.
- [ ] Common starter seeds only (carrot / whatever you already considered “some seeds”). No rare, no heirloom.
- [ ] Common seeds **plus** the 2 heirloom potato only (the stray note that added those). Drop the extra rare carrot and rare tomato.

---

## 7. Fruit keeps rotting after you pick it

On the plant, ripe fruit loses freshness, then the tile becomes a rotten plant.

After harvest, the game **keeps ticking freshness** on fruit in your hand, house inventory, chests, and on the ground. Selling uses that freshness: above 80% you get full price; below that, price scales down. A raspberry you pick and forget in a chest will be worth less (then nothing useful at market) without ever sitting ripe in the field.

Your writeup asked for this once, then later talked about it as if it were still to do. It is already happening.

- [x] Picked fruit **keeps rotting** until sold. Write that down.
- [ ] Freeze freshness at the moment of harvest. Rot only happens on the plant.

---

## 8. Growth penalty when water and fertilizer are both bad

Hovering a growing plant shows Happiness / Fertilizer / Water bars (green / orange / red).

If water is in the red **or** fertilizer is in the red, growth runs at **67%** speed (the 33% stunt you asked for). If **both** are red, the game multiplies them: **45%** speed (`0.67 × 0.67`). You never wrote the both-red case.

- [x] Both red → **45%** speed (as now).
- [ ] Stunt once: both red is still **67%**, same as only one bar in the red.

---

## 9. Drowning speed

Soil water goes **0 to 2 L**. Plants want **1 L**. The water bar is red at both ends (dry and drowned). Happiness starts at 50%.

While the water bar is red from **too much** water, happiness drops so that a plant starting at 50% **dies in about 45 seconds** and the tile becomes a rotten plant. That does mean a plant sitting at 2 L will die before it finishes growing, which is what you asked for. It is also fast enough that a sprinkler left on the default 2.5 L/day/tile will drown a crop unless you dial it or valve it.

Dry (too little water) takes about **2 minutes** from 50% to dead. Starving fertilizer takes about **3.3 minutes**.

- [ ] Keep drown-at-~45s. Untuned sprinklers are supposed to be dangerous.
- [x] Slow drowning. Still die before harvest at 2 L, but not in under a minute. (Say a time if you care.)
- [ ] 

---

## 10. Weeds and grass in the hand

Shovel on a weed or on grass: the plant is gone, **nothing drops**. Same soil left behind on a weeded plot.

Click a weed or grass with an **empty hand**: the gardener picks it up as an item you can store or throw in a compost box.

Your first dirt writeup had shovel-only, no item. Compost then has no way to get weeds/grass unless you pick them up. The game chose pickup.

- [x] Empty hand **gathers** weed/grass. Shovel just clears.
- [ ] Never an item. Shovel (or whatever) deletes them. Compost does not take weeds/grass.

---

## 11. What a shovel gets from a dead or rotten plant

Older notes: shovel a rotten plant → empty tile, **no drop**.

The game: shovel a rotten plant drops a **rotten** item; shovel a dead plant drops a **dead plant** item. Both are worth 0 at market and are compost feedstock (rotten 2 units, dead 1). That is how compost gets field waste without you using an empty hand on a living weed.

- [ ] Shovel **drops** rotten / dead items for compost.
- [x] Shovel clears with **no drop**. Compost is only from stuff you already carry (fruit, seeds, gathered weeds, …).
- [ ] 

---

## 12. Market

You walk fruit to the truck, then open Market.

What you see: a stall picture, a count per crop, **Sell all** for one number. That number already includes freshness and rarity.

What is still in the game, switched off: each crop has an offered price and a market price that drift, with +/− buttons, and sales that tick over time. The overlay does not show any of that (`DYNAMIC_MARKET` is false). The writeup started as “flat sell all”; a later notes file specified the slider market, then hid it again for “this release.” There is no release.

If the rewrite describes the slider, it would be documenting a mode you cannot see. If it describes Sell all, the hidden slider is leftover machinery.

- [x] Market **is** Sell all. The hidden slider stays dead; do not write it up as a rule.
- [ ] Turn the slider market **on** and write that up (offered vs market price, +/−, drip sales).
- [ ] Delete the hidden slider from the game. Sell all is the whole rule.

---

## 13. The top rarity word

Four tiers internally: common, uncommon, rare, heirloom. Sale multipliers 1 / 1.25 / 2 / 3.5. Variety names on the last tier are things like Pink Lady, Cosmic Purple.

The rarity lens labels that last tier **Specialty**. The in-game almanac compost text also says “specialty fruit.” Hover/quality pips do not print the word heirloom.

Your writeup says heirloom.

- [ ] Player-facing word is **Specialty**.
- [x] Player-facing word is **Heirloom**. Change the lens and almanac copy.

---

## 14. Plant inspect bar colours

The Happiness / Fertilizer / Water / Freshness bars on inspect use three colours that are not in the cottage palette:

- green `#4f9d69`
- amber `#d69a3a`
- red `#c9574b`

Plus a pale notch, a growth blue `#4b91c2`, and an empty grey `#8b887d`.

Art notes for tiles and icons said no new hex. These bars already shipped in the HUD. Either the palette grows, or the bars should reuse grass / ripe / roof / water.

- [x] Keep these inspect colours. They are for bars, not tiles.
- [ ] Recolor the bars to the existing palette (grass / ripe / roof / water).

---

## 15. Compost box price

You specified: 10 units in → 3 L compost out, half a day, values (seeds 1, fruit 5, heirloom 20, grass/weed/dead 1, rotten 2). The game does that.

You did not specify shop price or research cost. The game charges **$20** for the box and **$14 / 45s** for Composting (after Fertilizer).

- [x] **$20** box, **$14** research. Fine.
- [ ] Different numbers:
- [ ] 
