# Weeds

Code: `feature-field/`, weed parts of `soil.ts` and `plant.ts`; see [[code-map]].
Unlocked: from the start. Weed spray comes with [[features/research]] `unlock-better-tools`.

## Purpose

A tilled plot with nothing planted on it grows weeds. A weed uses up the plot's water and fertilizer and blocks planting, and a full-grown weed makes the plots beside it more likely to grow weeds. Left alone for a day, it turns the plot back into grass, and the plot has to be dug again. Weeds make an unplanted plot cost the player work, so they keep tilled ground planted or treat it: pulled weeds go to compost, a shovel or Weed spray keeps a plot clear for longer. Rain makes weeds come faster; dry weather stops them.

## Rules

### Sprouting

Only an `empty` plot — tilled, with nothing on it — sprouts. Every big tick each empty plot rolls on the `weed` stream and sprouts when the roll is below its ramped `weedChance` times the weather multiplier: `WEATHER_WEED_MUL` on Rain and Flood, 1 on Clear, 0 on Dry and Drought (no roll at all). A second roll selects one of two sprite variants.

On a new game no weed sprouts at first: `ramped` increases the chance linearly from −0.1 at the first big tick to the plot's own chance at `CHANCE_RAMP_TICKS`, counted from the creation of the game.

### Weed chance on a plot

`Soil.weedChance` is a field of the plot's `Soil`. Planting, harvest, death and rot keep the same `Soil`, so the value is unchanged by them.

| event | `weedChance` becomes |
|---|---|
| till fresh ground | `WEED_CHANCE` |
| pull by hand | 0 |
| shovel | `WEED_DUG` (−0.3) |
| Infused Extract poured on the growing plant | `WEED_DUG`, only when the chance is higher ([[items/produce/extract]]) |
| Weed spray, by hand or from the Sprayer | `WEED_SPRAYED` (−1) |
| a side neighbour weed reaches full growth | +0.05, once per weed |

Below `WEED_CHANCE`, the chance rises by 0.15 per day until it is back at `WEED_CHANCE`, on every tilled plot except a growing one (`recovers`). Above it, from neighbour weeds, it stays until pulled, dug or sprayed.

### Growth

From the moment it sprouts, a weed uses `WEED_WATER_PER_SEC` and `WEED_FERT_PER_SEC` from the plot. It is full-grown after `WEED_GROW` seconds; its sprite changes from the `sprout` group to the `grow` group at 40%. At full growth it raises the chance on its four side neighbours that are empty plots, once, and records the day.

`WEED_GONE_DAYS` day changes later the weed is gone: the plot becomes soft untilled ground under grass, its water, fertilizer and weed chance are lost, and nothing drops.

### Removing a weed

| action | needs | result |
|---|---|---|
| **Pick up** | empty hand, or Pulled weeds with room in the stack | Pulled weed in hand |
| **Dig weed** | shovel | nothing drops; one shovel use |
| **Spray** | Weed spray with at least 1 L | 1 L used |
| Harvester trailer | tractor with the boom down | Pulled weed into the trailer; weed chance unchanged |
| Sprayer trailer with Weed spray | tractor with the boom down | 1 L used, as **Spray** ([[items/other/trailers]]) |

Each leaves an empty plot with the same soil. Spray works on any tilled plot, weed or not, so a planted plot can be sprayed before harvest. A bag leaves the hand when it drops below 1 L.

### Items

**Pulled weed** stacks. The Compost box and the Furnace take it, and a burrow can drop it.
**Weed spray** is a `WEED_SPRAY_BAG` litre bag from the Additive store or a Pot still ([[items/buildings/still]]), used by hand or carried by the Sprayer.

### Grass

Wild grass appears on bare untilled ground, at most one tuft per big tick for the whole farm, never on very hard soil or under a dropped item, and stops at `CHUNK` tufts per owned chunk. It uses the same weather multiplier and ramp as weeds, with `GRASS_CHANCE`. **Pick up** gives Cut grass and leaves bare ground.

Sown grass (turf) grows on a tilled plot from Grass seeds, uses `GRASS_WATER_PER_SEC`, and after `GRASS_GROW` becomes untilled grass. It has no happiness and uses no fertilizer.

## Screen

- Hover a weed: **Weed**, with Growth, water and fertilizer bars.
- Hover an empty plot: a **Weed resistance** bar, (1 − `weedChance`) ÷ 2, red under 50%.
- Prompts: **Pick up**, **Dig weed**, **Spray**.
- Command Center: one red **Weed infestation** row for the whole farm; hovering it outlines every weed.
- Weather descriptions say weeds grow on Clear, faster on Rain, and stay down on Dry.

## Guest

A guest can pick up, dig and spray weeds.

## Save and sync

Weed cells (look, growth, full-grown day) and `Soil.weedChance` are saved. The digest carries the cell kind and the plot's water and fertilizer, not the weed's growth or `weedChance`.

## Art

`crop-weed-*.svg`, groups `sprout` and `grow`. The Pulled weed item art is the Command Center row's icon.

## Sound

**Dig weed** plays the shovel's dig and turn of soil ([[systems/sound]]).

## Invariants

| id | rule | test |
|---|---|---|
| `weeds.chance` | tilled soil starts at `WEED_CHANCE`; harvest and death keep it | `plants.test.ts` |
| `weeds.outbreak` | full growth raises the four side neighbours once | `plants.test.ts` |
| `weeds.spray` | spray sets −1 and clears a standing weed | `plants.test.ts` |
| `weeds.pull` | pulling drops a Pulled weed and sets 0; a shovel drops nothing and sets −0.3 | `plants.test.ts` |
| `weeds.sprayer` | the Sprayer with Weed spray sprays a weed or a tilled plot at 0 or above for 1 L; a plot below 0 with no weed is passed over | `vehicle.test.ts` |
| `weeds.infused` | Infused Extract on a growing plant lowers the plot's chance to `WEED_DUG` and never raises it; plain Extract leaves it | `extract.test.ts` |
| `weeds.gone` | a full-grown weed turns to grass `WEED_GONE_DAYS` day changes later; a younger one survives | `weeds.test.ts` |
| `weeds.ramp` | weed and grass chance ramp up over the first day | `world.test.ts` |
| `notices.weed` | one Command Center row for all weeds | `notices.test.ts` |

## When you change this

- Weed chance or growth numbers: [[features/weather-day]] multiplies them; the plot's soil carries over to the next crop in [[features/plants]].
- What a weed turns into: the grass it leaves is a paving and fence site in [[features/build]] and [[features/fences]].
- A new way to remove weeds: the Harvester in [[features/vehicles]] already removes them; guests can do every weed action ([[features/multiplayer]]).
- The Pulled weed item: [[features/machines]] (Compost box, Furnace) takes it, and a Common burrow gives it ([[features/burrow]]).
- Weed state: [[systems/save]] saves it; [[systems/net]] leaves it out of the digest.

## Decisions

- The chance starts below zero on a new farm so the first weed appears minutes into day one, not on the first tick.
