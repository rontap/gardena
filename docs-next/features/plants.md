# Plants

Code: `feature-field/`, `plant.ts`, `soil.ts`, `modifiers.ts`, `defs/crops.ts`, `defs/varieties.ts`; see [[code-map]].
Unlocked: carrot and potato seed packs from the start; other seed packs through [[features/research]] (the `unlock` of each `pack-*` SKU in `defs/research.ts`).

## Purpose

The player sows seeds on plots, keeps each plot's water and fertilizer inside the crop's range, and harvests fruit to sell or process. How well a plant is kept while it grows sets the quality of its fruit, and a high-quality harvest can turn a plant into a better variety of its crop. A plant kept badly grows slower, loses happiness and dies. Fruit loses freshness from the moment it ripens.

This page covers annual crops. Trees: [[features/trees]]. Sown grass: [[features/weeds]].

## Rules

### Crops

`CROPS` in `defs/crops.ts` defines every crop: class (`root`, `grain`, `fruit`), `growSeconds`, `waterUsePerSec`, `waterTolerance`, `fertTolerance`, `fertUseMul`, `sale`, `seed` price and `rotSeconds`. Annual crops are `PLANT_CROPS` in `ids.ts`; trees share the `CROPS` table.

### Plot soil

A plot's `Soil` holds `water` (0 to `SOIL_WATER_MAX` litres), `fertilizer` (0 to `FERT_PLOT_MAX`) and `weedChance`. Tilling sets water to `SOIL_TILL_WATER` and fertilizer to the ground quality at that tile (`goodness`). The same `Soil` stays on the plot through planting, growth, harvest, death and rot, so a harvest leaves the next crop the water and fertilizer that were left.

### Water and fertilizer ranges

Each plant has a water range and a fertilizer range, each shown as green, orange or red.

Water: `d` is the distance between the plot's water and `SOIL_WATER_MID`. Green when `d` ≤ the plant's water tolerance; red when `d` ≥ (`SOIL_WATER_MID` + tolerance) ÷ 2; orange between. Above `SOIL_WATER_MID` the plot counts as too wet; below, as too dry.

```
water in the plot (tol = the plant's water tolerance, r = (SOIL_WATER_MID + tol) / 2)

 0                                  SOIL_WATER_MID                              SOIL_WATER_MAX
 |----- red -----|-- orange --|------ green ------|------ green ------|-- orange --|----- red -----|
               mid-r        mid-tol              mid              mid+tol        mid+r
 <-------------------- too dry --------------------|-------------------- too wet ------------------>
```

Fertilizer: the floor is `FERT_PLOT_MAX` − the plant's fertilizer tolerance. Green at or above the floor; red at or below half the floor; orange between.

```
fertilizer in the plot (floor = FERT_PLOT_MAX - the plant's fertilizer tolerance)

 0                     floor / 2                  floor                     FERT_PLOT_MAX
 |-------- red ------------|-------- orange --------|---------- green -----------|
```

A range can be wider than the scale; then that colour never shows on that side.

A growing plant uses `waterUsePerSec` litres of water per second and `PLANT_FERT_PER_SEC` × `fertUseMul` fertilizer per second. A ripe plant uses neither.

### Happiness

Each growing plant has happiness from 0 to `HAPPY_MAX`, starting at `HAPPY_START`. Every step:

- fertilizer red: happiness falls by `dt` ÷ `HAPPY_STARVE_SECONDS`;
- water red: happiness falls by `dt` ÷ `HAPPY_DROWN_SECONDS` when too wet, or `dt` ÷ `HAPPY_WILT_SECONDS` when too dry;
- neither red: each green range adds `dt` ÷ `HAPPY_GAIN_SECONDS`.

When happiness reaches 0 while a range is red, the plant dies. Too wet: the plot becomes Rotten produce. Too dry or no fertilizer: the plot becomes a dead plant. The day's death count increases.

### Growth

Growth goes from 0 to 1 over the plant's grow time. Each red range multiplies growth speed by `STUNT` (both red: `STUNT` × `STUNT`). The sprite shows the `sprout` group below 33% growth and the `grow` group after.

Three named varieties need a neighbour to grow (`NEIGHBOUR_IDS`): a plant of the same crop within `NEIGHBOUR_REACH` tiles that is growing, not Heirloom, and has no red range, or a grown tree of that species. Without one, growth stops; water, fertilizer, happiness and death continue.

### Extract

**Pour extract** with an Extract or Infused Extract bag ([[items/produce/extract]]) on a growing plant that has not had Extract (`Plant.boosted` false) takes `EXTRACT_WORK` seconds, uses `EXTRACT_POUR` L, sets `boosted`, and sets `Plant.boost` to the bag's seconds. While `boost` is above 0, growth gains extra, and `boost` falls by `dt`:

```
extra growth per second   EXTRACT_GROWTH ÷ EXTRACT_SECONDS
                          × STUNT for each red range; 0 while a needed neighbour is missing
for                       EXTRACT_SECONDS           Extract
                          EXTRACT_INFUSED_SECONDS   Infused Extract
```

The extra is a share of the whole growth bar, the same for every crop, variety and `growSpeed` modifier, so it adds the same amount at any point of growth. Extract adds at most `EXTRACT_GROWTH`, and Infused Extract `EXTRACT_GROWTH` × `EXTRACT_INFUSED_SECONDS` ÷ `EXTRACT_SECONDS`. At ripening `boost` becomes 0 and the rest is lost. A plant takes Extract once: once `boosted` is set there is no prompt and nothing is used.

### Ripening and quality

At growth 1 the plant becomes ripe, freshness is set to 1, and quality is fixed:

quality = seed quality + happiness gain + Experienced skill gain, clamped to 0–1.

- Happiness gain: `QUALITY_STEP` at `HAPPY_MAX`, 0 at `HAPPY_START`, −`QUALITY_STEP` at 0 happiness, linear between.
- Experienced skill gain: `BETTER_QUALITY` × skill rank × happiness, only when the player owns that crop's `better-*` skill ([[features/family]]).

### Variety

Each crop has up to three varieties in `VARIETIES`: Plain (`'base'`), Named (`variant`) and Heirloom. `VARIETY` gives each Named and Heirloom variety a purpose: fresh (`produce`), preserving (`processed`: jam machine and mill) or alcohol (`alcohol`: still and barrel).

After quality is fixed, the plant rolls once for the next variety up (Plain → Named, or Heirloom when the crop has no Named; Named → Heirloom):

chance = quality² × `MAX_QUALITY_VAR_IMPACT` + `EXPERIENCED_VAR_BONUS` (with the crop's `better-*` skill) + `CROSSBREED_VAR_BONUS` (with a growing or ripe plant of the same crop and a different variety within `CROSSBREED_REACH`) + `FAMILIARITY_VAR_BONUS` × the crop's familiarity ([[features/machines]], research station).

On success the plant's variety moves up one level and its quality becomes 0. Heirloom plants and crops with only Plain do not roll.

Variety changes the plant's stats: grow time × `VARIETY_GROW`, tolerances × `VARIETY_TOL` (not below `TOL_MIN`), rot time × `VARIETY_ROT`. Sale price is multiplied by `PURPOSE_MUL[tier].on` on the variety's own purpose and `.off` on the other two; Plain is × 1.

### Stats

`statsOf(crop, variety, quality, modifiers)` returns a plant's current numbers. Sale price: `sale` × `qualityMul(quality)` (1 at quality 0, `QUALITY_TOP` at 1) × fresh-purpose multiplier × skill sale multipliers × the crop's `saleMul`. Grow time is divided by the product of `growSpeed` modifiers; water use is multiplied by the `waterUseMul` modifiers. Modifiers come from research and skills and apply to all crops or to one crop.

### Freshness and rot

A ripe plant loses freshness at 1 ÷ `rotSeconds` per second, slowed by the `jam` skill below half freshness. At 0 the plot becomes Rotten produce. Harvested fruit keeps losing freshness ([[systems/tick]], `tickFreshness`). Fruit sells at full price above `FRESH_FULL` freshness and proportionally less below ([[features/market]]).

### Player actions

| action | needs | effect |
|---|---|---|
| **Plant {crop}** | seeds of that crop, empty plot | a growing plant with the seed's variety and quality |
| **Water** | bucket with water | adds water up to the top of the plant's green range (`SOIL_WATER_MID` + tolerance); an empty plot up to `SOIL_WATER_MID`; uses only the difference |
| **Fertilize** | fertilizer or compost bag | fills the plot to `FERT_PLOT_MAX`; uses only the difference |
| **Tend** | `tending` skill, empty hand, growing plant not yet tended | happiness + 0.1, once per plant |
| **Pour extract** | Extract or Infused Extract bag, growing plant that has not had Extract | extra growth for the bag's seconds (Extract, above); uses `EXTRACT_POUR` L, once per plant |
| **Harvest** | ripe plot; empty hand, or the same crop and variety in hand with room in the stack | one fruit into the hand with the plant's quality and freshness; plot becomes empty |
| **Dig up plant** | shovel, growing or ripe plant | one seed of that crop, variety and quality drops; plot becomes empty |
| **Dig out dead plant** / pick up | shovel, or empty hand | removes a dead plant or Rotten produce; picking up gives the item |
| graft | graft of the same crop, growing plant that is not Heirloom | the plant takes the graft's variety and quality ([[features/trees]]) |

The Harvester trailer also harvests plots ([[features/vehicles]]).

## Screen

- Hover on a growing or ripe plant: **{Crop} ({Variety})**. With plant details on: **Happiness {n}%**, **Water {stored} of {mid} - {word}**, **Fertilizer {n}% - {word}**. Current water words: happy, thirsty, too wet, wilting, drowning. Current fertilizer words: fertilized, needs fertilizer, starving for fertilizer. [[name-map]] lists the replacements.
- A neighbour-needing plant without a neighbour: **Needs another {name} nearby that is not Heirloom.**
- Inspect bars: growing plot — Growth, Happiness, Water, Fertilizer; ripe plot and fruit — Quality, Freshness.
- Command Center, red ranges only: **{crop} is wilting**, **{crop} is drowning**, **{crop} is starving for fertilizer**; **{crop} is losing freshness** below `FRESH_FULL`; **Dead plant**; **Rotten produce**.
- Prompts: **Plant {name}**, **Water**, **Fertilize**, **Tend**, **Pour extract**, **Harvest**, **Dig up plant**, **Dig out dead plant**.
- todo-almanac

## Guest

A guest can do every action on this page.

## Save and sync

Saved per plot: soil (water, fertilizer, weed chance) and plant (crop, variety, quality, growth, freshness, happiness, tended, `boost`, `boosted`). The digest carries each plant's crop, variety, quality, growth and happiness, and each plot's water and fertilizer.

## Art

`src/assets/crops/crop-{crop}.svg`: groups `sprout`, `grow`, `dead`, and one ripe group per variety of that crop (`ripe`, `ripe-variant`, `ripe-heirloom`). `crop-rotten.svg` for Rotten produce. Fruit items: `src/assets/fruits/`.

## Sound

Digging with a shovel plays a dig on every stretch of work and a turn of soil at the end; watering plays a pour and a soak; pouring Extract plays the pour; fertilizing plays a bag pour; harvesting plays leaves and the fruit coming off ([[systems/sound]]).

## Invariants

| id             | rule                                                                                                                                | test             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| `plants.drink` | a growing plant uses its crop's water and fertilizer from the plot's soil                                                           | `plants.test.ts` |
| `plants.extract` | Extract adds `EXTRACT_GROWTH` ÷ `EXTRACT_SECONDS` growth per second for the bag's seconds, × `STUNT` per red range, none without a needed neighbour; ripening ends it; once per plant, and a second pour shows no prompt and uses nothing | `extract.test.ts` |
| —              | quality is fixed at ripening from seed quality, happiness and the `better-*` skill; bought seed at `HAPPY_START` stays at quality 0 | `plants.test.ts` |
| —              | two plots ripening on the same day roll on different stream values                                                                  | `plants.test.ts` |
| —              | a picked fruit keeps losing freshness in the hand, house, chest, ground, Quad and Harvester trailer; freezers slow it               | `plants.test.ts` |
| —              | the last graft leaves the hand empty; an Heirloom cannot be grafted over                                                            | `plants.test.ts` |
| —              | harvest merges only into the same crop and variety; a full hand keeps the fruit on the plant                                        | `plants.test.ts` |

## When you change this

- Crop numbers: [[features/market]] (sale), [[features/contracts]] (order sizes use expected daily output), [[features/machines]] (inputs).
- A new crop: [[howto/add-crop]]; art groups per variety; `VARIETIES`; research unlock; Seed silo pack ([[features/inventory]]).
- Happiness or range rules: [[features/trees]] uses the same functions with its own constants; [[features/sensors]] water and fertilizer sensors read the same ranges; the Command Center rows ([[shell]]).
- Plot soil: [[features/weeds]] and [[features/water]] write to the same `Soil`.
