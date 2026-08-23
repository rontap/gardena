# Tutorial

Bottom-center Chrome card. Gates and predicates: [[mechanics/tutorial]]. Type [[ui/type]].

Wrapper `pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2`. Map and HUD stay live. Camera not forced. HUD not blocked.

Show iff `kind === 'on'` and `ready(step)`. One step. No counter. No card while `ready` is false.

`Chrome` `relative w-80 px-4 pt-4 pb-3`. Body `relative z-20 text-base leading-relaxed text-ink`.

Card `pointer-events-auto` only on step 10. Steps 1–9: clicks on the card do not skip (they pass through). Step 10: the card is the hit; click → `{ kind: 'off' }`. No timer. No click-anywhere. No auto-dismiss.

| step | copy |
|---|---|
| 1 | Till, plant, water, harvest, sell, buy better tools. Click a grass tile to dig. |
| 2 | Dig four more plots. |
| 3 | Click the house and take seeds in hand. |
| 4 | You only carry one item. Plant the seeds. |
| 5 | Open Research and start something. |
| 6 | A plant is thirsty. Pick up the bucket (3 L), fill it at the pump, water the plant. |
| 7 | Something is ripe. Buy a fruit box and place it. |
| 8 | Pick any fruit. |
| 9 | Drop it at the truck and Sell all. |
| 10 | That's the tour. You're on your own. |
