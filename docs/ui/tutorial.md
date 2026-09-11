# Tutorial

Bottom-center Chrome card. Gates and predicates: [[mechanics/tutorial]]. Type [[ui/type]].

Map and HUD stay live. Camera not forced. HUD not blocked.

Show iff `kind === 'on'` and `ready(step)`. One step. No counter. No card while `ready` is false.

Card `pointer-events-auto` only on step 9. Steps 1–8: clicks on the card do not skip (they pass through). Step 9: the card is the hit; click → `{ kind: 'off' }`. No timer. No click-anywhere. No auto-dismiss.

Step 6 copy names `CONTAINERS.bucket` liters.

| step | copy |
|---|---|
| 1 | Till, plant, water, harvest, sell, buy better tools. Click a grass tile to dig. |
| 2 | Dig four more plots. |
| 3 | Click the house and take seeds in hand. |
| 4 | You only carry one item. Plant the seeds. |
| 5 | Open Research and start something. |
| 6 | A plant is thirsty. Pick up the bucket (5 L), fill it at the pump, water the plant. |
| 7 | Something is ripe. Pick it, then pick another — the same fruit stacks in your hand. |
| 8 | Drop it at the truck and Sell all. |
| 9 | That's the tour. You're on your own. |
