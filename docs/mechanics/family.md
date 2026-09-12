# Family

Skill screen. Roles stay: player gardens, husband research, daughter stall. No Family class. No XP. `World.family` always.

Ids: `player` | `husband` | `daughter`. Names and blurbs live in `SKILLS`. Hover uses `skillBlurb(id, tier)` — jam names the owned tier’s slower rot. `lucky` `lucky-husband` `lucky-daughter` all read **Lucky** — one per member, each maxTier 1, each its own name and blurb key so a translator can split them.

Illegal: `better-carrot` `better-vanilla` `better-sugar-cane`. Illegal: player `machinery`. Illegal: husband `contracts` `tool-contracts` `machine-contracts` `bulk-buying`. Owned maps are per member.

`BetterCrop` = potato | wheat | tomato | raspberry | grape | apple | apricot | olive | cherry. `BETTER_IDS` is a complete map. Tree `better-*` is legal.

## State

`MemberState = { pickCount, owned: id → tier, offers: { id, tier }[] }`. `Family = { player, husband, daughter }`. `World.points` — one shared bank, not per member. Start: `World.points` 0, per member `pickCount` 0, `owned` empty, offers rolled. Missing owned key = not owned. `offers` length 0..3.

`bulk-up` max 3. `forecast` max 1. `driving-classes` max 3. `broker` max `BROKER_MAX_TIER`. `industrial` max 3. `jam` max 3. Else `SKILLS.maxTier`. Illegal: tier 0. Illegal: tier > max. Percent and money add per owned tier, they do not multiply. Jam uses `JAM_ROT` per owned tier.

`SkillEffect` `{ kind: 'broker' }` `{ kind: 'industrial' }` `{ kind: 'machine' }` `{ kind: 'forecast' }` `{ kind: 'lucky' }` `{ kind: 'better'; crop; saleMul }` on husband / player. No `{ kind: 'dummy' }`. `vanilla-tending` is not a skill.

## Points

One shared bank on `World`, not three. Each seam it gets `POINTS_PER_DAY`, and any point buys any member's offer. Grant is the seam step, not Close. `grantPoints(n)`: `World.points += n`. `pickSkill(member, slot)` spends 1 from the same bank. HUD remaining-points count is `World.points`. Derived. Not a second field. `Act.dismissRecap` / `dismissRecapBody` is a no-op. Recap Close is `World.seeRecap(day)` — not a `Cmd`, not a grant. [[mechanics/day]]. Contracts also pay points: 1 / 2 / 3 by band from Halbert Eijn and Intercrop — [[mechanics/contracts]].

`unlockAll`: every research id done, `money += 999`, job idle, `points = 99`. Does not grant skills. Does not reroll. `unlockAllSkills`: every `SKILLS` id at that id's `maxTier` on its owning member. Ignores gates. Rebuilds skill `Modifier`s from owned `better-*` whose `saleMul` is not 1 — the tree rows — at that tier, `modGen++`. Empties every member's `offers`. Does not spend points. Does not bump `pickCount`. Does not touch research. `Act.cheat` `{ k: 'skills' }`.

## Offers

Pool = that member’s ids with `owned < max` (or absent) and gate met. Offered tier = owned + 1 (absent → 1). Draw `min(3, pool.length)` distinct, no padding. Sort pool by id. Without replacement, slot `i` = `floor(skill.at(memberIx, pickCount, i) * remaining)`. — [[mechanics/rng]]. Offers exist at init. Persist until pick. Research done does not reroll. `pickSkill(member, slot)`: spend 1 of `World.points`, `owned[id] = offered.tier`, `pickCount++`, reroll that member only. Illegal: pick at 0 points. Illegal: slot past `offers.length`. Illegal: another member’s id.

## Gates

| id | requires |
|---|---|
| `heirloom` | research `unlock-heirloom` done |
| `better-potato` | research `unlock-crop-variants` done |
| `better-wheat` | research `unlock-crop-variants` done |
| `better-tomato` | research `unlock-tomato` done |
| `better-raspberry` | research `unlock-raspberry` done |
| `better-grape` | research `unlock-grape` done |
| `better-apple` | none |
| `better-apricot` | none |
| `better-olive` | none |
| `better-cherry` | none |
| `bulk-up` | none |
| `lucky` | none |
| `lucky-husband` | none |
| `lucky-daughter` | none |
| `seed-bank` | none |
| `driving-classes` | research `unlock-vehicles` done |
| `broker` | research `unlock-contracts` done |
| `machinery` | research `unlock-grinder` done |
| else | none |

Potato / wheat Experienced growers: gated on Crop variants. Tree `better-*`: no research gate.

## Tend

`Intent` `{ act: 'tend'; at: Coord }`. Plants: [[mechanics/plants]] `plants.tend`. Trees: [[mechanics/trees]] `trees.tend`. Illegal: optional `tended`. Illegal: tend twice. Illegal: tend ripe. Illegal: tend pending / `{ on }` / juvenile tree. `SKILLS.tending` blurb names plants and off-season trees.

## Market

`marketOpen` is always true. No phase hours. Consign always. Sell all always legal. — [[mechanics/market]]

## Sale

Annual `better-*` pays ripen `betterGain` `BETTER_QUALITY` and `EXPERIENCED_VAR_BONUS` on the ripen variety roll — [[mechanics/plants]] `plants.variety-roll`. `saleMul` 1, so it pushes no `Modifier`. Tree `better-*` is `saleMul` 1.04 and a `Modifier` and nothing else: a tree has no happiness and never rolls a variety. `Modifier.source = 'research' | 'fertilizer' | 'skill'`.

At `marketGain`, not crop `Modifier`: saleswoman every `StallGoodId`; heirloom variety tier `heirloom` of crop fruit, spirit, wine (not cider, not sugar / jam / oil / flour / extract / bread); jam fruit freshness `< JAM_ROT_FRESH` uses slower `rotSeconds` on ripe plants and `tickFreshness` (not a sale floor, not the jam machine); `{ kind: 'rotten' }` `$1` apiece iff `unlock-fermentation` in `done`, sat exempt; flood or drought fruit stall goods × `WEATHER_FRUIT_SALE` after skills before sat — [[mechanics/weather]]. Crop stall bins: stock + worth per variety. Rotten stock is `World.clearance`.

## Other effects

- boots: `WALK × (1 + 0.05 × tier)`
- bulk-up: hand stack cap `STACK_MAX + BULK_UP_STEP × tier`, `STACK_MAX_CRAFTED + BULK_UP_CRAFTED_STEP × tier` for spirit / wine / jam / oil / flour / extract / flakes / vanilla-extract / bread. Liters not — [[mechanics/inventory]] `inventory.stack`
- driving-classes: burn and vMax/accel — [[mechanics/vehicles]] `vehicles.empty` `vehicles.drive`
- machinery: gate `unlock-grinder`. valve, mill tick, jam tick, grinder tick `÷ (1 + 0.05 × tier)` only. Not Quad/Tractor vMax/accel. Still / barrel / station not work jobs. Pipe place stays 0
- drought `skuPrice`: [[mechanics/weather]] `weather.shop`
- Vehicle interactions lens (`vehicles`) is `unlock-vehicles` in `done` — [[mechanics/vehicles]]
- Water need lens is `unlock-auto-irrigation` in `done`. Land quality lens is `unlock-expand` in `done`. — [[ui/lens]]
- inherit-land: `+1` expansion permit per tier, max 2. Gated on `unlock-expand`. Land still costs money — [[mechanics/expansion]]
- `buyPacks(id)` always legal: five seed packs at `5 × skuPrice(id) × 0.95`, each `'base'` quality 0. Ctrl is the seed-silo Buy gesture. `buy(id)` stays one. Failed afford / fit / closed: no-op
- broker / industrial: [[mechanics/contracts]]
- forecast: `{ kind: 'forecast' }`. HUD tomorrow iff owned — [[mechanics/weather]] `weather.forecast`
- lucky: `{ kind: 'lucky' }`. Luck `min(LUCK_CAP, skillTier('lucky'))`. Not a World field. No HUD chip. Loot roll: [[mechanics/burrow]]

## Invariants

`family.pick` — Offers 0–3 persist until pick; `pickSkill` costs 1 of `World.points`, writes `owned[id] = offered.tier`, `pickCount++`, rerolls that member only.

`family.lens` — Water need lens iff `unlock-auto-irrigation` in `done`; land quality lens iff `unlock-expand` in `done`; vehicle interactions lens iff `unlock-vehicles` in `done`.

`family.skills` — Player `boots` `bulk-up` `lucky` `seed-bank` `driving-classes` `tending` `better-*`; husband `machinery` `forecast` `inherit-land` `lucky-husband`; daughter `saleswoman` `jam` `industrial` `broker` `heirloom` `lucky-daughter`; gates and maxTier as this note; hangar-buys are not `skuPrice`; drought ×2 on `seeds` | `utility`.

`family.better-set` — `better-*` exists for potato wheat tomato raspberry grape apple apricot olive cherry; `betterGain` is `BETTER_QUALITY × owned tier × (h / HAPPY_MAX)`; `experiencedTier(crop, tierOf)` is the owned tier, 0 off the set; annual rows carry `saleMul` 1; tree rows carry 1.04 and are `saleMul` only.

`family.jam-rot` — `jam` owned tier N: fruit with freshness `< 0.5` rots `15% × N` slower; ripe plant and picked fruit; freezer skips.

`family.unlockSkills` — `unlockAllSkills`: every `SKILLS` id at `maxTier` on its owner; ignores gates; rebuilds skill modifiers from owned tree `better-*` at that tier; empties offers; `unlockAll` still does not grant skills.

`family.lucky` — `lucky` on the player, `lucky-husband`, `lucky-daughter`: one per member, each maxTier 1, gate none, effect `{ kind: 'lucky' }`; luck is `min(LUCK_CAP, the three tiers summed)`; not a World field; no HUD chip; icon is the `stat-luck` clover — [[art/skills]] [[mechanics/burrow]].
