# Family

Skill screen. One owned pool. No member owner. No offers. No Family class. No XP. `World.family` always.

Ids: one `SkillId` union. No `PlayerSkillId` `HusbandSkillId` `DaughterSkillId` as owners. Names and blurbs live in `SKILLS`. Hover uses `skillBlurb(id, tier)`. `grafting` name **Tree Grafting**. `specialty` name **Specialty Maker**. `lucky` is one id, maxTier 3, name **Lucky**.

Illegal: `better-carrot` `better-vanilla` `better-sugar-cane`. Illegal: `better-apple` `better-apricot` `better-olive` `better-cherry`. Illegal: `forecast` `lucky-husband` `lucky-daughter`. Illegal: member maps. Illegal: `offers`. Illegal: `pickCount`. Illegal: tier 0. Illegal: tier > `maxTier`.

`BetterCrop` = potato | wheat | tomato | raspberry | grape. `BETTER_IDS` is a complete map. No tree `better-*`.

## State

`Family = { owned: id → tier }`. `World.points` — one bank. Start: `World.points` 0, `owned` empty. Missing owned key = not owned.

Cap III: `boots` `bulk-up` `driving-classes` `machinery` `industrial` `inherit-land` `saleswoman` `jam` `heirloom` `specialty` `broker` `lucky` max 3. `tending` `seed-bank` `grafting` `better-*` max 1. Else `SKILLS.maxTier`. Percent and money add per owned tier, they do not multiply. Jam uses `JAM_ROT` per owned tier.

`SkillEffect` `{ kind: 'broker' }` `{ kind: 'industrial' }` `{ kind: 'machine' }` `{ kind: 'lucky' }` `{ kind: 'grafting' }` `{ kind: 'specialty' }` `{ kind: 'better'; crop; saleMul }`. No `{ kind: 'dummy' }`. No `{ kind: 'forecast' }`. `vanilla-tending` is not a skill.

## Parent

Same known/open as research — [[mechanics/research]]. `parent: SkillId | null`. `skillOpen(id)`: parent is null or parent owned ≥ 1. `skillKnown(id)`: parent is null or parent is open.

Not known: card stays in the grid, `skill-unknown` icon, unknown name **Unknown**, unknown description **You do not know what this does.** Disabled.

Extra research lock: known and the research gate unmet shows the real name, disabled. Not known stays mystery.

| id | parent | research |
|---|---|---|
| `boots` | — | — |
| `tending` | `boots` | — |
| `seed-bank` | `boots` | — |
| `better-wheat` | `seed-bank` | `unlock-crop-variants` |
| `better-potato` | `seed-bank` | `unlock-crop-variants` |
| `better-tomato` | `seed-bank` | `unlock-advanced-plants` |
| `better-grape` | `seed-bank` | `unlock-advanced-plants` |
| `better-raspberry` | `seed-bank` | `unlock-raspberry` |
| `grafting` | `boots` | — |
| `lucky` | `boots` | — |
| `bulk-up` | — | — |
| `driving-classes` | `machinery` | `unlock-vehicles` |
| `machinery` | `bulk-up` | `unlock-grinder` |
| `industrial` | `broker` | `unlock-contracts` |
| `inherit-land` | `bulk-up` | `unlock-landscaping` |
| `saleswoman` | — | — |
| `jam` | `saleswoman` | — |
| `heirloom` | `saleswoman` | `unlock-heirloom` |
| `specialty` | `heirloom` | `unlock-preservatives` |
| `broker` | `saleswoman` | `unlock-contracts` |

Potato / wheat Experienced growers: gated on Crop variants. Tomato / grape: Advanced Plants. Raspberry: Raspberry seeds.

## Points

One bank on `World`. Each seam it gets `POINTS_PER_DAY` 1 — preference. Grant is the seam step, not Close. `grantPoints(n)`: `World.points += n`. Rank n costs n points. `Act.pickSkill` `{ id }`. HUD remaining-points count is `World.points`. Derived. Not a second field. `Act.dismissRecap` / `dismissRecapBody` is a no-op. Recap Close is `World.seeRecap(day)` — not a `Cmd`, not a grant. [[mechanics/day]]. Contracts also pay points: 1 / 2 / 3 by band from Halbert Eijn and Intercrop — [[mechanics/contracts]]. Guest cannot pick.

`unlockAll`: every research id done, `money += 999`, job idle, `points = 99`. Does not grant skills. `unlockAllSkills`: every `SKILLS` id at that id's `maxTier` on the one pool. Ignores parent and research gates. Rebuilds skill `Modifier`s from owned `better-*` whose `saleMul` is not 1 at that tier, `modGen++`. Does not spend points. Does not touch research. `Act.cheat` `{ k: 'skills' }`.

`pickSkill(id)`: legal iff known, open, research gate met (or none), `owned < maxTier`, `World.points >=` next rank, `world.local === 0`. Next rank is owned + 1 (absent → 1). Spend that rank's cost, `owned[id] =` that rank. Illegal: pick at 0 points when the cost is above 0. Illegal: another seat.

## Tend

`Intent` `{ act: 'tend'; at: Coord }`. Plants: [[mechanics/plants]] `plants.tend`. Trees: [[mechanics/trees]] `trees.tend`. Illegal: optional `tended`. Illegal: tend twice. Illegal: tend ripe. Illegal: tend pending / `{ on }` / juvenile tree. `SKILLS.tending` blurb names plants and off-season trees.

## Market

`marketOpen` is always true. No phase hours. Consign always. Sell all always legal. — [[mechanics/market]]

## Sale

Annual `better-*` pays ripen `betterGain` `BETTER_QUALITY` and `EXPERIENCED_VAR_BONUS` on the ripen variety roll — [[mechanics/plants]] `plants.variety-roll`. `saleMul` 1, so it pushes no `Modifier`. `Modifier.source = 'research' | 'fertilizer' | 'skill'`.

At `marketGain`, not crop `Modifier`: saleswoman every `StallGoodId`; heirloom variety tier `heirloom` of crop fruit, spirit, wine (not cider, not sugar / jam / oil / flour / extract / bread); specialty jam / spirit / wine / cider variety tier `variant` | `heirloom` × `(1 + 0.05 × tier)`, stacks with heirloom; jam fruit freshness `< JAM_ROT_FRESH` uses slower `rotSeconds` on ripe plants and `tickFreshness` (not a sale floor, not the jam machine); `{ kind: 'rotten' }` `$1` apiece iff `unlock-fermentation` in `done`, sat exempt; flood or drought fruit stall goods × `WEATHER_FRUIT_SALE` after skills before sat — [[mechanics/weather]]. Crop stall bins: stock + worth per variety. Rotten stock is `World.clearance`.

## Other effects

- boots: `WALK × (1 + 0.05 × tier)`
- bulk-up: hand stack cap `STACK_MAX + BULK_UP_STEP × tier`, `STACK_MAX_CRAFTED + BULK_UP_CRAFTED_STEP × tier` for spirit / wine / jam / oil / flour / extract / flakes / vanilla-extract / bread. Liters not — [[mechanics/inventory]] `inventory.stack`
- driving-classes: burn and vMax/accel — [[mechanics/vehicles]] `vehicles.empty` `vehicles.drive`
- machinery: gate `unlock-grinder`. valve, mill tick, jam tick, grinder tick `÷ (1 + 0.05 × tier)` only. Not Quad/Tractor vMax/accel. Still / barrel / station not work jobs. Pipe place stays 0
- drought `skuPrice`: [[mechanics/weather]] `weather.shop`
- Vehicle interactions lens (`vehicles`) is `unlock-vehicles` in `done` — [[mechanics/vehicles]]
- Water need lens is `unlock-auto-irrigation` in `done`. Land quality lens is `unlock-expand` in `done`. — [[ui/lens]]
- inherit-land: `+1` expansion permit per tier, max 3. Gated on `unlock-landscaping`. Land still costs money — [[mechanics/expansion]]
- grafting: max 1. Chop drops 2 grafts iff owned; chop always wood and trunk — [[mechanics/trees]] `trees.chop`
- `buyPacks(id)` always legal: five seed packs at `5 × skuPrice(id) × 0.95`, each `'base'` quality 0. Ctrl is the seed-silo Buy gesture. `buy(id)` stays one. Failed afford / fit / closed: no-op
- broker / industrial: [[mechanics/contracts]]
- lucky: `{ kind: 'lucky' }`. Luck `min(LUCK_CAP, skillTier('lucky'))`. Not a World field. No HUD chip. Loot roll: [[mechanics/burrow]]
- HUD tomorrow iff `forecastCount ≥ 1` (weather-station buildings). Not a skill — [[mechanics/weather]] `weather.forecast`

## Invariants

`family.pick` — `Act.pickSkill` `{ id }`; rank n costs n of `World.points`; writes `owned[id]` to that rank; guest never; no offers.

`family.lens` — Water need lens iff `unlock-auto-irrigation` in `done`; land quality lens iff `unlock-expand` in `done`; vehicle interactions lens iff `unlock-vehicles` in `done`.

`family.skills` — One pool: `boots` `tending` `seed-bank` `better-wheat` `better-potato` `better-tomato` `better-grape` `better-raspberry` `grafting` `lucky` `bulk-up` `driving-classes` `machinery` `industrial` `inherit-land` `saleswoman` `jam` `heirloom` `specialty` `broker`; parent known/open as this note; research lock as this note; cap III on the I–III ids; hangar-buys are not `skuPrice`; drought ×2 on `seeds` | `utility`.

`family.better-set` — `better-*` exists for potato wheat tomato raspberry grape; `betterGain` is `BETTER_QUALITY × owned tier × (h / HAPPY_MAX)`; `experiencedTier(crop, tierOf)` is the owned tier, 0 off the set; annual rows carry `saleMul` 1; no tree `better-*`.

`family.jam-rot` — `jam` owned tier N: fruit with freshness `< 0.5` rots `15% × N` slower; ripe plant and picked fruit; freezer skips.

`family.unlockSkills` — `unlockAllSkills`: every `SKILLS` id at `maxTier` on the one pool; ignores gates; rebuilds skill modifiers from owned `better-*` whose `saleMul` is not 1 at that tier; `unlockAll` still does not grant skills.

`family.lucky` — `lucky` one id, maxTier 3, parent `boots`, gate none, effect `{ kind: 'lucky' }`; luck is `min(LUCK_CAP, skillTier('lucky'))`; not a World field; no HUD chip; icon is the `stat-luck` clover — [[art/skills]] [[mechanics/burrow]].

`family.cost` — Rank n costs n of `World.points`; `POINTS_PER_DAY` is 1.

`family.grafting` — Chop drops 2 grafts iff `grafting` owned; chop always wood and trunk — [[mechanics/trees]] `graft.axe`.

`family.specialty` — jam / spirit / wine / cider whose variety tier is `variant` or `heirloom` × `(1 + 0.05 × tier)` at `marketGain`; stacks with heirloom — [[mechanics/market]].
