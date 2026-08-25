# Playtest Grok 1.7.2

MCP playtester, live turns, no cheats. Almanac source read once at start, not the in-game book after. New game. Ended Day 12 sunrise. Save not downloaded (Gear → Download Save exists).

Assumption: this note is a playtest artifact, not a mechanic contract.

## Tasks and outcomes

| #    | Task                                                 | Outcome                                                                                                                                                              |
| ---- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| i    | Dig, plant carrot, water, harvest, sell              | **Pass.** Days 1–3. Five carrots. Sold ~4 after overnight stall rot.                                                                                                 |
| ii   | Plant and collect 15 potatoes on 15 fields           | **Pass, dirty.** 15 fruit consigned across the run. Never a clean simultaneous 15-bed harvest. Beds died in batches; weeds were already on tiles I hadn't looked at. |
| iii  | Buy and use a full fertilizer bag                    | **Pass.** 10 L bag bought Day 7, emptied onto plots.                                                                                                                 |
| iv   | Research fertilizer, irrigation, fermentation        | **Pass.** Also pickaxe, compost, auto-irrigation, tomato, preservatives.                                                                                             |
| v    | 4×4 wheat, pipes, sprinkler, sprinkler set to potato | **Built, did not work as a farm.** 4 sprinklers on the wheat patch, tuned `{crop: potato}`. Wheat dried. `inn: 0` on sprinklers.                                     |
| vi   | 250 money                                            | **Fail.** Peak ~127 (Day 8 potato sale). Finish ~17.                                                                                                                 |
| vii  | 1 vodka                                              | **Fail.** Still placed. Hopper 7/10 (wheat + potato). Progress 0.                                                                                                    |
| viii | 1 jam                                                | **Fail.** Jam machine placed Day 11 (37). 1/5 apple, 0/4 L sugar.                                                                                                    |

Days: 10 asked, +2 granted, 12 used.

## User interruptions

1. Pause between turns; compost dead plants by hand; soil needs fertilizer.
2. Use the full 8-action queue, not 1–2.
3. Water and compost before planting; weeds take empty beds; need money; restart the turn loop.
4. Remember the eight goals. +2 days.
5. Stop waiting on dead potatoes.
6. Summary of the run.
7. Corrections: no overnight weed tick; dead plants are a hand pickup; still drinks from pipes; low action rate, not “pause or die”; almanac already said fertilize / death / hand on crops.
8. Write this note.
9. Answer now (mid-write).

---

## 10 things that frustrated me in play

1. **Shovel in hand + pickup drops the shovel.** First bucket pickup. I spent a turn walking back.
2. **Harvest is empty-hand or box.** One carrot in the hand blocked four ripe ones. Prompt became Drop. I did not have a box yet.
3. **Twilight closes Sell all** without Open 24/7. Open late is sunset only. I consigned into a closed market; next morning the stall paid almost nothing.
4. **Irrigation research does not unlock sprinklers.** Automated irrigation is a second card. The sprinkler tile said “Needs the Automated irrigation research” while Irrigation sat at 100%. I stared at a disabled button.
5. **Fruit box is a placeable, not a hand buy.** Shop click enters place mode. Closing the shop cancelled it the first time.
6. **Dead-plant prompt with empty hand: Move here.** Shovel: Dig out dead plant, plant gone, nothing in hand. That is the opposite of “carry it to compost.”
7. **Weed prompt flips with the tool.** Empty hand Pick up (fills the hand). Shovel Pull weed. Seeds in hand Need seeds. I kept the wrong tool and walked past the takeover.
8. **I did not look at empty soil.** Weeds and hunger were already there when I next wanted the tile. Frustration was “the field is gone,” not “I watched it go.”
9. **One overlay at a time, clock still running.** Shop, research, build, market, silo — every one of those while unpaused ate the day. Pause exists. I often didn't hit it.
10. **Queue silently drops illegal acts.** Harvest with a shovel, plant with a bucket, pickup with a full hand: `shiftHead`, no fruit, no message. The queue looked full. The field didn't change.

## 10 things I still don't get

1. If dead plants are a hand pickup, why did empty-hand prompt say Move here, and why did a `pickup` enqueue on a dead tile leave it dead?
2. Still at 17–18,11 with pipes on col 18. Hopper 7/10, `inn: 0`, progress 0. If the still drinks from pipes, when does `inn` move? At 10/10? On a vertex I didn't own?
3. Four sprinklers on that same net, also `inn: 0`. Filter-to-potato, dry wheat, or a net that never went wet?
4. Jam machine is not on the Processing grid after Preservatives. `buy-jam` entered place mode. Why is it hidden from the list a human would click?
5. Jam HUD: 5 fruit + 4 L sugar. Supplies do not sell sugar. Mill is 32. What is the intended first sugar without a mill?
6. Day 8 twilight → Day 9 sunrise with no recap click I remember. Queue was live. Did recap auto-dismiss?
7. First wheat plant wave: 8 queued, 5 grew, 3 failed. I never inspected those three tiles.
8. Day 10 recap Harvested 10. I thought I only fed the still. What counted?
9. Compost box: 10 units → 5 L on the ground in 90s. I shoveled dead plants instead of picking them. Units stayed weeds-only. Was shovel-delete supposed to feed the box?
10. Happiness 0.2 on overwatered potatoes that still grew to ripe, vs other plots that died at similar water. I never knew the kill line from the HUD.

## 5 things I read in the Almanac and still couldn't use

1. **Fertilizer “happy above N%.”** I read it. I did not map it to “this empty plot dies if I leave it hungry.” First fertilizer bag was Day 7, after mass death.
2. **Shovel rotten/dead → no seed.** I read that as the dead-plant verb. I never treated dead as a carried item. Almanac and HUD agreed with shovel; the user says hand pickup. I followed the book and the prompt, both wrong for the compost loop.
3. **Happiness to empty while growing → dead or rotten.** I did not watch happiness until the recap said Lost. Inspect exists. I opened it when I was already watering.
4. **Harvest ripe empty-handed.** Read it. First harvest still filled the hand and stalled the rest. I needed the fruit box line, not the harvest line.
5. **Sprinkler as water automation.** Read water-systems / automation copy. Did not read it as “crop filter means this sprinkler ignores wheat.” Setting it to potato on a wheat 4×4 was the task. I did not then switch it back or water by hand enough.

## 5 best things

1. **End-of-day recap.** Harvest / lost / research / stipend / tax / balance. The one screen that told the truth when I hadn't looked at soil.
2. **Fruit box (5 of one fruit).** Once placed and held, the potato harvest actually moved. Carry rule is sharp.
3. **Research HUD.** One job, money up front, seconds left while you garden. Fertilizer 9 / 40s is a good first buy.
4. **Pause.** It works. The farm only dies when I leave it unpaused and go read a menu.
5. **Compost recipe, when I used weeds.** 10 units, 5 L beside the box, 90s. Pickup the drop. That loop is complete.

## Playtester interface (not game rules)

A human sees the field. An MCP tester sees a snapshot with no soil. These are tester aids, not design changes to the loop.

- **Lens or inspect on idle soil:** water, fert, weed chance, happiness, without being about to act. I only queried a tile when I already had a verb.
- **Dead + empty hand prompt should say Pick up** if that is the verb. Move here hid it.
- **Queue act that `shiftHead`s should pulse why.** “Need empty hand.” “Need bucket.” Silent skip wasted turns.
- **Building prompt: pipe wet / `inn`.** Still and sprinkler both showed 0. I guessed. A human might see spray; I saw a number.
- **Pause when a blocking overlay opens** (shop, research, build, recap) as a tester default. Clock-running-in-shop is a tester bug, not a game bug.
- **End-of-turn counts:** growing / ripe / dead / weed / empty. Recap already does lost/harvested once a day. I needed it every pause.

A human who looks at the dirt and uses the Almanac in play will not miss the weed takeover I missed. The rules were on the field. I wasn't looking at the field.
