# Family

Skill screen. Roles stay: player gardens, husband research, daughter stall. No Family class. No XP. `World.family` always.

Ids: `player` | `husband` | `daughter`. Id unions: `sim/ids.ts`. Names and blurbs live in `SKILLS`. Hover uses `skillBlurb(id, tier)` — jam names the owned tier’s slower rot.

Illegal: `better-carrot` `better-vanilla` `better-sugar-cane`. Illegal: player `machinery`. Illegal: husband `contracts` `tool-contracts` `machine-contracts` `bulk-buying`. Owned maps are per member.

`BetterCrop` = potato | wheat | tomato | raspberry | grape | apple | apricot | olive | cherry. `BETTER_IDS` is a complete `{ [K in BetterCrop]: PlayerSkillId }`. Tree `better-*` is legal.

## State

```
MemberState = { pickCount, owned: id → tier, offers: { id, tier }[] }
Family = { player, husband, daughter }
World.points — one shared bank, not per member
```

Start: `World.points` 0, per member `pickCount` 0, `owned` empty, offers rolled. Missing owned key = not owned. `offers` length 0..3.

`bulk-up` max 3. `forecast` max 1. `driving-classes` max 3. `haggling` max 3. `broker` max `BROKER_MAX_TIER`. `industrial` max 3. `jam` max 3. `bio` max 3. Else `SKILLS.maxTier`. Illegal: tier 0. Illegal: tier > max.

Percent and money add per owned tier (`5+5+5`), they do not multiply. Jam uses `JAM_ROT` per owned tier.

## Points

One shared bank on `World`, not three. Each seam it gets `POINTS_PER_DAY`, and any point buys any member's offer.

`grantPoints(n)`: `World.points += n`. `pickSkill(member, slot)` spends 1 from the same bank.

HUD remaining-points count is `World.points`. Derived. Not a second field.

`dismissRecap()` is the only recap exit — [[mechanics/day]]. Grants `POINTS_PER_DAY`, then `seam = play`, `banner = 2`. No pick.

Contracts also pay points: 1 / 2 / 3 by band from Halbert Eijn and Intercrop — [[mechanics/contracts]].

`unlockAll`: every research id done, `money += 999`, job idle, `points = 99`. Does not grant skills. Does not reroll.

`unlockAllSkills`: every `SKILLS` id at that id's `maxTier` on its owning member, including `haggling`. Ignores gates. Rebuilds skill `Modifier`s from owned `better-*` at that tier, `modGen++`. Empties every member's `offers`. Does not spend points. Does not bump `pickCount`. Does not touch research. `Act.cheat` `{ k: 'skills' }`.

## Offers

Pool = that member’s ids with `owned < max` (or absent) and gate met.

Offered tier = owned + 1 (absent → 1).

Draw `min(3, pool.length)` distinct, no padding. Sort pool by id. Without replacement, slot `i` = `floor(skill.at(memberIx, pickCount, i) * remaining)`. — [[mechanics/rng]]

Offers exist at init. Persist until pick. Research done does not reroll.

`pickSkill(member, slot)`: spend 1 of `World.points`, `owned[id] = offered.tier`, `pickCount++`, reroll that member only.

Illegal: pick at 0 points. Illegal: slot past `offers.length`. Illegal: another member’s id.

## Gates

| id | requires |
|---|---|
| `open-24` | daughter owns `open-late` |
| `heirloom` | research `unlock-heirloom` done |
| `better-potato` | research `unlock-crop-variants` done |
| `better-wheat` | research `unlock-crop-variants` done |
| `haggling` | hidden — never offered |
| `better-tomato` | research `unlock-tomato` done |
| `better-raspberry` | research `unlock-raspberry` done |
| `better-grape` | research `unlock-grape` done |
| `better-apple` | none |
| `better-apricot` | none |
| `better-olive` | none |
| `better-cherry` | none |
| `bulk-up` | none |
| `driving-classes` | research `unlock-vehicles` done |
| `broker` | research `unlock-contracts` done |
| else | none |

Potato / wheat Experienced growers: gated on Crop variants. Tree `better-*`: no research gate.

## Tend

`Intent` `{ act: 'tend'; at: Coord }`. `dest` = `at`.

Legal plants: player owns `tending`, empty hand, plot `growing`, `plant.tended === false`. Work `TEND_WORK`. Then `happiness += 0.1`, clamp `HAPPY_MAX`, `tended = true`. Plants unchanged.

Legal trees: player owns `tending`, empty hand, `cell.kind === 'tree'`, `juvenile >= 1`, `yield.kind === 'off'`, `Tree.tended === false`. Either cell of the 1×2. Work `TEND_WORK`. Then `chance += 0.15`, `tended = true`. No cap. Not pending. Not `{ on }`. Not juvenile. Prompt **Tend**. Witness `Tree.tended`. — [[mechanics/trees]] `trees.tend`

`Plant.tended` required, starts `false`, same instance through ripe / dead — [[mechanics/plants]]. `Tree.tended` required, starts `false`. Illegal: optional `tended`. Illegal: tend twice. Illegal: tend ripe. Illegal: tend pending / `{ on }` / juvenile tree.

`SKILLS.tending` blurb names plants and off-season trees.

## Market hours

`marketOpen(phase)` — [[mechanics/market]] [[mechanics/weather]].

Weather block: `(flood ∧ sunrise) ∨ (drought ∧ day)` unless daughter owns `open-24`. Then:

| phase | open |
|---|---|
| sunrise, day | always |
| sunset | daughter owns `open-late` |
| twilight | daughter owns `open-24` |

`open-late` does not reopen a weather block. Consign always. Sell all illegal when closed.

Closed copy: flood “Stall closed this morning.” drought “Stall closed at midday.” Else “Stall closed until morning.” / “Stall closed at twilight.”

## Sale

`better-*` → `Modifier` `{ source: 'skill', crop, saleMul }` and ripen `betterGain` `BETTER_QUALITY` — [[mechanics/plants]]. Tree `better-*` is `saleMul` only.

`Modifier.source = 'research' | 'fertilizer' | 'skill'`.

At `marketGain`, not crop `Modifier`:

- saleswoman: every `StallGoodId` × `(1 + 0.02 × tier)`
- heirloom: variety tier `heirloom` of crop fruit, spirit, wine × `(1 + 0.05 × tier)`. Not cider. Not sugar / jam / oil / flour / extract
- bio: crop fruit `bio === true` × `(1 + 0.04 × tier)`. Not sugar / machine goods
- jam: fruit freshness `< JAM_ROT_FRESH` uses `rotSeconds × (1 + JAM_ROT × tier)` on ripe plants and `tickFreshness`. Not a sale floor. Not the jam machine
- clearance: `{ kind: 'rotten' }` `$1` apiece. Sat exempt. Saleswoman / heirloom / bio / weather do not apply. Sugar and machine goods do not rot. Without the skill: compost only, consign refused. `SKILLS.clearance` blurb: rotten produce sells for $1 apiece.
- flood or drought: fruit stall goods only (annual including sugar-cane, tree fruit) × `WEATHER_FRUIT_SALE` after skills before sat. Not sugar / jam / spirit / wine / oil / flour / extract — [[mechanics/weather]]

Crop stall bins: stock + worth per variety × bio. Illegal: consign that drops `fruit.bio`.

## Other effects

- boots: `WALK × (1 + 0.05 × tier)`
- bulk-up: hand stack cap `STACK_MAX + BULK_UP_STEP × tier`, `STACK_MAX_CRAFTED + BULK_UP_CRAFTED_STEP × tier` for spirit / wine / jam / oil / flour / extract. Additive owned tiers. Liters not — [[mechanics/inventory]] `inventory.stack`
- driving-classes: burn `× (1 − 0.05 × tier)`, Quad/Tractor `vMax` and accel `× (1 + 0.05 × tier)`. Additive owned tiers. Yaw not. Boots not. — [[mechanics/vehicles]]
- machinery: valve 0.3s, mill tick, jam tick, grinder tick `÷ (1 + 0.05 × tier)` only. Not Quad/Tractor vMax/accel. Still / barrel / station not work jobs. Pipe place stays 0
- research-speed: `job.left -= dt × (1 + 0.05 × tier)`
- haggling: utility AND automation tab `skuPrice` `− $tier` then min $1. Hangar-buys still not `skuPrice`
- drought `skuPrice`: `tab === 'seeds' | 'utility'`, after haggling min $1, then ×2. Automation / building / hangar-buys untouched — [[mechanics/weather]]
- tax: expansion formula then `× (1 − 0.02 × tier)` then min $1 — [[mechanics/expansion]]
- water-study: unlocks water lens. Water lens gated until owned
- land-study: unlocks land lens
- Vehicle interactions lens (`vehicles`) is `unlock-vehicles` in `done`, not a family-study row — [[mechanics/vehicles]]
- inherit-land: `+1` expansion permit per tier, max 2. Gated on `unlock-expand`. Land still costs money — [[mechanics/expansion]]
- `buyPacks(id)` always legal: five seed packs at `5 × skuPrice(id) × 0.95`, each `'base'` quality 0. Ctrl is shop and seed-silo Buy gesture. `buy(id)` stays one. Failed afford / fit / closed: no-op
- broker: T1 `+1` offered. T2 `+1` offered and `+1` active. Board size `CONTRACT_OFFERS +` offered bonus. Cap `CONTRACT_ACTIVE +` active bonus. Mid-day pick does not move slots 0..5. Broker slots are always cash — the two prize slots are drawn from the base six — [[mechanics/contracts]]
- industrial: complete pays `offer.reward * (1 + 0.03 * tier)` at complete time, current tier. Miss / cancel not. A prize contract pays no money, so industrial does not touch it
- forecast: `{ kind: 'forecast' }`. HUD tomorrow iff owned. Blurb locked on [[mechanics/weather]]

Assumption: `SkillEffect` `{ kind: 'haggling' }` `{ kind: 'broker' }` `{ kind: 'industrial' }` `{ kind: 'machine' }` `{ kind: 'forecast' }` `{ kind: 'better'; crop }` on husband / player. No `{ kind: 'dummy' }`. `vanilla-tending` is not a skill.

## Invariants

`family.pick` — Offers 0–3 persist until pick. `pickSkill` costs 1 of `World.points`, writes `owned[id] = offered.tier`, `pickCount++`, rerolls that member only.

`family.lens` — Water lens only if husband owns `water-study`. Land lens if husband owns `land-study`. Vehicle interactions lens if `unlock-vehicles` done.

`family.skills` — `PlayerSkillId`: `bulk-up` max 3, no gate, `+BULK_UP_STEP` / `+BULK_UP_CRAFTED_STEP` per owned tier on `World.stackMax`. `driving-classes` not `machinery`. `driving-classes` max 3, gate `unlock-vehicles`. `better-grape` gate `unlock-grape`. `better-apple` `better-apricot` `better-olive` `better-cherry` gate none. No `better-carrot` `better-vanilla` `better-sugar-cane`. `HusbandSkillId`: `machinery`, `haggling`, `forecast`. `forecast` max 1, `{ kind: 'forecast' }`, HUD tomorrow iff owned. `haggling` max 3, gate `hidden`. `skuPrice` `− $tier` on utility AND automation, min $1. Drought then ×2 on `seeds` | `utility` after that floor. Hangar-buys still not `skuPrice`. Daughter `bio` `+4%`/tier max 3. `jam` max 3, `JAM_ROT`. `industrial` max 3, complete `× (1 + 0.03 × tier)`. `broker` max 2, gate `unlock-contracts`; T1 `+1` offered; T2 `+1` offered and `+1` active. Daughter `heirloom` pays on variety tier `heirloom` of crop fruit, spirit, wine.

`family.better-set` — `better-*` exists for potato wheat tomato raspberry grape apple apricot olive cherry. `betterGain` is `BETTER_QUALITY × owned tier × (h / HAPPY_MAX)`. Tree `better-*` is `saleMul` only.

`family.jam-rot` — `jam` owned tier N: fruit with freshness `< 0.5` rots `15% × N` slower. Ripe plant and picked fruit. Freezer skips.

`family.hidden` — `haggling` gate `hidden`. Never in the offer pool. Effect still applies if owned. `unlockAllSkills` grants it at `maxTier`.

`family.unlockSkills` — `unlockAllSkills`: every `SKILLS` id at `maxTier` on its owner, including `haggling`. Ignores gates. Rebuilds skill modifiers from owned `better-*` at that tier. Empties offers. `unlockAll` still does not grant skills.
